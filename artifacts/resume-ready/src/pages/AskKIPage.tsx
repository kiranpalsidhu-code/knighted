import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListResumes, getListResumesQueryKey,
  useListKiConversations, getListKiConversationsQueryKey,
  useCreateKiConversation,
  useGetKiConversation, getGetKiConversationQueryKey,
  useDeleteKiConversation,
  useAppendKiMessages,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import {
  Send, Paperclip, X, Sparkles, FileText, RotateCcw,
  ChevronDown, Bot, User as UserIcon, Loader2, AlertCircle,
  Plus, Trash2, MessageSquare, Menu, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; pending?: boolean };

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      out.push(
        <pre key={i} className="bg-muted border border-border rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono whitespace-pre-wrap">
          {lang && <div className="text-muted-foreground text-[10px] mb-1 uppercase">{lang}</div>}
          {codeLines.join("\n")}
        </pre>
      );
      i++; continue;
    }
    if (line.startsWith("### ")) { out.push(<h3 key={i} className="font-bold text-base mt-3 mb-1">{inlineRender(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("## ")) { out.push(<h2 key={i} className="font-bold text-lg mt-3 mb-1">{inlineRender(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("# ")) { out.push(<h1 key={i} className="font-bold text-xl mt-3 mb-1">{inlineRender(line.slice(2))}</h1>); i++; continue; }
    if (line.match(/^[-*]\s+/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) { items.push(<li key={i} className="ml-1">{inlineRender(lines[i].replace(/^[-*]\s+/, ""))}</li>); i++; }
      out.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-0.5 my-1">{items}</ul>); continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) { items.push(<li key={i} className="ml-1">{inlineRender(lines[i].replace(/^\d+\.\s+/, ""))}</li>); i++; }
      out.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-0.5 my-1">{items}</ol>); continue;
    }
    if (line.trim() === "") { out.push(<div key={i} className="h-2" />); i++; continue; }
    out.push(<p key={i} className="leading-relaxed">{inlineRender(line)}</p>);
    i++;
  }
  return out;
}

function inlineRender(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={idx} className="bg-muted border border-border rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={idx}>{part.slice(1, -1)}</em>;
    return part;
  });
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Write a follow-up email after my interview",
  "Help me negotiate my salary offer",
  "Review my resume bullet points",
  "Write a cold outreach email to a hiring manager",
  "Give me tips for a phone screen tomorrow",
  "Write a thank-you note after an interview",
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AskKIPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();

  // Conversation state
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingConvId, setPendingConvId] = useState<number | null>(null); // conv created but not yet committed

  // Chat input state
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Queries & mutations ───────────────────────────────────────────────────
  const { data: conversations, isLoading: convsLoading } = useListKiConversations({
    query: { queryKey: getListKiConversationsQueryKey() }
  });
  const { data: activeConvDetail } = useGetKiConversation(
    activeConvId ?? 0,
    { query: { queryKey: getGetKiConversationQueryKey(activeConvId ?? 0), enabled: activeConvId !== null } }
  );
  const { data: resumes } = useListResumes({ query: { queryKey: getListResumesQueryKey() } });

  const createConv = useCreateKiConversation();
  const deleteConv = useDeleteKiConversation();
  const appendMessages = useAppendKiMessages();

  // ── Load conversation messages when switching ─────────────────────────────
  useEffect(() => {
    if (activeConvDetail && activeConvId !== null) {
      const loaded: Message[] = (activeConvDetail.messages ?? []).map((m: any) => ({
        id: String(m.id),
        role: m.role as Role,
        content: m.content,
      }));
      setMessages(loaded);
    }
  }, [activeConvDetail, activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const startNewChat = () => {
    if (streaming) return;
    setActiveConvId(null);
    setPendingConvId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setDocumentText(null);
    setDocumentName(null);
  };

  const openConversation = (id: number) => {
    if (streaming) return;
    if (id === activeConvId) return;
    setActiveConvId(id);
    setPendingConvId(null);
    setMessages([]);
    setInput("");
    setError(null);
    qc.invalidateQueries({ queryKey: getGetKiConversationQueryKey(id) });
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteConv.mutateAsync({ id });
      if (activeConvId === id) startNewChat();
      qc.invalidateQueries({ queryKey: getListKiConversationsQueryKey() });
    } finally {
      setDeletingId(null);
    }
  };

  const attachResume = (resume: any) => {
    setDocumentText(resume.content || "");
    setDocumentName(resume.title || "Resume");
    setShowResumePicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const { extractTextFromFile } = await import("@/lib/pdf-utils");
      const text = await extractTextFromFile(file);
      setDocumentText(text);
      setDocumentName(file.name);
    } catch (err: any) {
      setError(err?.message || "Could not extract text from this file.");
    }
  };

  const removeDocument = () => { setDocumentText(null); setDocumentName(null); };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    const userMsg: Message = { id: uid(), role: "user", content: trimmed };
    const assistantMsgId = uid();
    const assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "", pending: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    // Ensure we have a conversation to save to
    let convId = activeConvId ?? pendingConvId;
    if (convId === null) {
      try {
        const newConv = await createConv.mutateAsync({ data: { title: "New Chat" } });
        convId = newConv.id;
        setPendingConvId(convId);
        setActiveConvId(convId);
        qc.invalidateQueries({ queryKey: getListKiConversationsQueryKey() });
      } catch {
        // Non-fatal — will try to save later
      }
    }

    let assistantContent = "";

    try {
      const token = await getToken();
      abortRef.current = new AbortController();

      const res = await fetch("/api/resume-ready/ki-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history, documentText: documentText ?? undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.delta) {
              assistantContent += parsed.delta;
              setMessages((prev) =>
                prev.map((m) => m.id === assistantMsgId
                  ? { ...m, content: m.content + parsed.delta, pending: false }
                  : m
                )
              );
            }
          } catch { /* ignore malformed chunks */ }
        }
      }

      // Persist both messages
      if (convId !== null && assistantContent) {
        try {
          await appendMessages.mutateAsync({
            id: convId,
            data: {
              messages: [
                { role: "user", content: trimmed },
                { role: "assistant", content: assistantContent },
              ],
            },
          });
          qc.invalidateQueries({ queryKey: getListKiConversationsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetKiConversationQueryKey(convId) });
        } catch {
          // Persistence failed silently — messages still visible in UI
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: m.content || "_(stopped)_", pending: false } : m
        ));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        setError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, documentText, getToken, activeConvId, pendingConvId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const stop = () => abortRef.current?.abort();
  const isEmpty = messages.length === 0;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const sidebar = (
    <div className={cn(
      "flex flex-col bg-muted/30 border-r border-border transition-all duration-200 shrink-0",
      sidebarOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Conversations</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat} title="New Chat" aria-label="New Chat">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1">
        {convsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!convsLoading && (!conversations || conversations.length === 0) && (
          <div className="px-4 py-6 text-center">
            <MessageSquare className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          </div>
        )}
        {(conversations ?? []).map((conv: any) => (
          <div
            key={conv.id}
            onClick={() => openConversation(conv.id)}
            className={cn(
              "group flex items-start gap-2 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors",
              activeConvId === conv.id
                ? "bg-primary/10 text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate leading-snug">{conv.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeDate(conv.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => handleDeleteConv(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-all"
              title="Delete"
            >
              {deletingId === conv.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Trash2 className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        {sidebar}

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"} aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-none">Ask KI</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Your AI career assistant</p>
              </div>
            </div>
            {!isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                disabled={streaming}
                className="text-muted-foreground gap-1.5 text-xs h-7"
              >
                <RotateCcw className="w-3 h-3" /> New chat
              </Button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {isEmpty ? (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10 mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                  <p className="text-muted-foreground text-sm">
                    Ask me to write emails, review your resume, prep for interviews, or anything career-related.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/60 hover:border-primary/30 text-sm text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border text-muted-foreground"
                    )}>
                      {msg.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted border border-border rounded-tl-sm"
                    )}>
                      {msg.pending ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {renderMarkdown(msg.content)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border bg-background px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-2">
              {/* Attached document chip */}
              {documentName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-primary font-medium truncate">{documentName}</span>
                  <button onClick={removeDocument} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text input */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 4000))}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask KI anything… (Shift+Enter for new line)"
                    className="resize-none min-h-[52px] max-h-40 pr-4 text-sm"
                    rows={1}
                    disabled={streaming}
                    maxLength={4000}
                  />
                  {input.length > 3600 && (
                    <span className={`absolute bottom-2 right-2 text-[10px] ${input.length >= 4000 ? "text-destructive" : "text-muted-foreground"}`}>
                      {input.length}/4000
                    </span>
                  )}
                </div>
                {streaming ? (
                  <Button variant="outline" size="icon" onClick={stop} className="shrink-0 h-[52px] w-[52px]" title="Stop" aria-label="Stop generating">
                    <span className="w-3 h-3 bg-foreground rounded-sm" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    className="shrink-0 h-[52px] w-[52px]"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Attachment row */}
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.rtf" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Attach file
                </button>
                {resumes && resumes.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowResumePicker((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Use a resume
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showResumePicker && (
                      <div className="absolute bottom-full mb-1 left-0 z-50 bg-background border border-border rounded-xl shadow-lg py-1 min-w-[220px]">
                        {(resumes as any[]).map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => attachResume(r)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors truncate"
                          >
                            {r.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
                  Enter to send · Shift+Enter for new line
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
