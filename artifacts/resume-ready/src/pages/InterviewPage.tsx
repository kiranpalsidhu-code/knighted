import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, ChevronRight, RotateCcw, LayoutDashboard,
  Sparkles, CheckCircle2, AlertCircle, Lightbulb, Trophy, Copy, Check,
  Plus, Pencil, Trash2, StickyNote, ChevronDown, ChevronUp, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useListInterviewNotes,
  useCreateInterviewNote,
  useUpdateInterviewNote,
  useDeleteInterviewNote,
  getListInterviewNotesQueryKey,
  useListApplications,
  useListResumes,
} from "@workspace/api-client-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "setup" | "interview" | "summary";
type InterviewType = "behavioral" | "technical" | "mixed";

interface Question {
  id: string;
  question: string;
  category: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  tip: string;
}

interface Result {
  question: Question;
  answer: string;
  feedback: Feedback;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 8) return "bg-green-50 border-green-200";
  if (score >= 6) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function avgScore(results: Result[]) {
  if (!results.length) return 0;
  return Math.round((results.reduce((s, r) => s + r.feedback.score, 0) / results.length) * 10) / 10;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InterviewPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Setup
  const [phase, setPhase] = useState<Phase>(() => {
    try { return (sessionStorage.getItem("interview_phase") as Phase) || "setup"; } catch { return "setup"; }
  });
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [sector, setSector] = useState<"general" | "finance" | "consulting" | "tech" | "product" | "design">("general");
  const [role, setRole] = useState(() => {
    try { return sessionStorage.getItem("interview_role") || ""; } catch { return ""; }
  });
  const [jobDescription, setJobDescription] = useState("");

  // Interview
  const [questions, setQuestions] = useState<Question[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("interview_questions") || "[]"); } catch { return []; }
  });
  const [currentIdx, setCurrentIdx] = useState(() => {
    try { return Number(sessionStorage.getItem("interview_idx") || "0"); } catch { return 0; }
  });
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [pendingFeedback, setPendingFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<Result[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("interview_results") || "[]"); } catch { return []; }
  });

  // Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalFailed, setEvalFailed] = useState(false);

  // Copy state for model answers (keyed by question id)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyModelAnswer = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Notes
  const queryClient = useQueryClient();
  const { data: notes = [] } = useListInterviewNotes();
  const { data: applications = [] } = useListApplications();
  const { data: resumes = [] } = useListResumes();
  const createNote = useCreateInterviewNote();
  const updateNote = useUpdateInterviewNote();
  const deleteNote = useDeleteInterviewNote();

  const [notesOpen, setNotesOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id?: number; title: string; content: string;
    applicationId?: number | null; resumeId?: number | null;
  } | null>(null);

  const handleSaveNote = () => {
    if (!editingNote) return;
    const payload = {
      title: editingNote.title.trim() || "Untitled Note",
      content: editingNote.content,
      applicationId: editingNote.applicationId || undefined,
      resumeId: editingNote.resumeId || undefined,
    };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListInterviewNotesQueryKey() });
    if (editingNote.id) {
      updateNote.mutate(
        { id: editingNote.id, data: payload },
        { onSuccess: () => { invalidate(); setEditingNote(null); } }
      );
    } else {
      createNote.mutate(
        { data: payload },
        { onSuccess: () => { invalidate(); setEditingNote(null); } }
      );
    }
  };

  const handleDeleteNote = (id: number) => {
    deleteNote.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListInterviewNotesQueryKey() }) }
    );
  };

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const voiceSupported = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
  const recognitionRef = useRef<any>(null);

  // ── API helpers ─────────────────────────────────────────────────────────────
  const callApi = useCallback(async (path: string, body: object) => {
    const token = await getToken();
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, [getToken]);

  // ── Voice recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice not available", description: "Voice input requires Chrome or Edge. Type your answer instead.", variant: "destructive" });
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = currentAnswer;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + e.results[i][0].transcript.trim();
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setCurrentAnswer(finalTranscript + (interim ? " " + interim : ""));
    };

    rec.onend = () => {
      setCurrentAnswer(finalTranscript);
      setIsRecording(false);
    };

    rec.onerror = () => {
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Microphone error — check permissions." });
    };

    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, [currentAnswer, toast]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ── Persist session to sessionStorage ─────────────────────────────────────
  useEffect(() => {
    try { sessionStorage.setItem("interview_phase", phase); } catch { /* ignore */ }
  }, [phase]);
  useEffect(() => {
    try { sessionStorage.setItem("interview_role", role); } catch { /* ignore */ }
  }, [role]);
  useEffect(() => {
    try { sessionStorage.setItem("interview_questions", JSON.stringify(questions)); } catch { /* ignore */ }
  }, [questions]);
  useEffect(() => {
    try { sessionStorage.setItem("interview_idx", String(currentIdx)); } catch { /* ignore */ }
  }, [currentIdx]);
  useEffect(() => {
    try { sessionStorage.setItem("interview_results", JSON.stringify(results)); } catch { /* ignore */ }
  }, [results]);

  // ── Start interview ─────────────────────────────────────────────────────────
  const handleStart = async () => {
    setIsGenerating(true);
    try {
      const data = await callApi("/resume-ready/ai/interview/questions", {
        interviewType, sector, role: role.trim(), jobDescription: jobDescription.trim(),
      });
      setQuestions(data.questions || []);
      setCurrentIdx(0);
      setCurrentAnswer("");
      setPendingFeedback(null);
      setResults([]);
      setPhase("interview");
    } catch {
      toast({ title: "Failed to start", description: "Could not generate questions. Try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Submit answer ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isRecording) stopRecording();
    const answer = currentAnswer.trim();
    if (!answer) { toast({ title: "No answer", description: "Type or record your answer first." }); return; }

    const q = questions[currentIdx];
    setIsEvaluating(true);
    setEvalFailed(false);
    try {
      const feedback = await callApi("/resume-ready/ai/interview/evaluate", {
        question: q.question, answer, role: role.trim(), category: q.category,
      });
      setPendingFeedback(feedback);
      setResults(prev => [...prev, { question: q, answer, feedback }]);
    } catch {
      setEvalFailed(true);
      toast({ title: "Evaluation failed", description: "Could not evaluate your answer.", variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── Next question ───────────────────────────────────────────────────────────
  const handleNext = () => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      setPhase("summary");
    } else {
      setCurrentIdx(next);
      setCurrentAnswer("");
      setPendingFeedback(null);
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setCurrentAnswer("");
    setPendingFeedback(null);
    setResults([]);
    try {
      ["interview_phase", "interview_role", "interview_questions", "interview_idx", "interview_results"]
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Setup
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <AppLayout>
        <div className="p-8 max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">KI Mock Interview</h1>
                <p className="text-muted-foreground text-sm">Practice with AI-powered feedback on every answer</p>
              </div>
            </div>
          </div>

          {/* ── Interview Notes panel ── */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors w-full mb-3"
            >
              <StickyNote className="w-4 h-4 text-primary" />
              Interview Notes
              <Badge variant="secondary" className="ml-1 text-xs">{notes.length}</Badge>
              <span className="ml-auto">
                {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {notesOpen && (
              <div className="space-y-3">
                {/* Note editor */}
                {editingNote ? (
                  <Card className="border-primary/30">
                    <CardContent className="p-4 space-y-3">
                      <Input
                        placeholder="Note title"
                        value={editingNote.title}
                        onChange={(e) => setEditingNote((n) => n && { ...n, title: e.target.value })}
                        className="font-medium"
                      />
                      <Textarea
                        placeholder="Your notes here — key insights, questions to ask, areas to study, talking points…"
                        value={editingNote.content}
                        onChange={(e) => setEditingNote((n) => n && { ...n, content: e.target.value })}
                        rows={6}
                        className="resize-none text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Tag to application</label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={editingNote.applicationId ?? ""}
                            onChange={(e) => setEditingNote((n) => n && { ...n, applicationId: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">None</option>
                            {(applications as any[]).map((a: any) => (
                              <option key={a.id} value={a.id}>{a.companyName} – {a.jobTitle}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Tag to resume</label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={editingNote.resumeId ?? ""}
                            onChange={(e) => setEditingNote((n) => n && { ...n, resumeId: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">None</option>
                            {(resumes as any[]).map((r: any) => (
                              <option key={r.id} value={r.id}>{r.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNote} disabled={createNote.isPending || updateNote.isPending}>
                          {createNote.isPending || updateNote.isPending ? "Saving…" : "Save Note"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)}>
                          <X className="w-4 h-4" /> Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setEditingNote({ title: "", content: "", applicationId: null, resumeId: null })}
                  >
                    <Plus className="w-4 h-4" /> New note
                  </Button>
                )}

                {/* Notes list */}
                {notes.length > 0 && (
                  <div className="space-y-2">
                    {(notes as any[]).map((note: any) => {
                      const app = (applications as any[]).find((a: any) => a.id === note.applicationId);
                      const res = (resumes as any[]).find((r: any) => r.id === note.resumeId);
                      return (
                        <Card key={note.id} className="border-border/60 hover:border-primary/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{note.title}</p>
                                {note.content && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{note.content}</p>
                                )}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {app && (
                                    <Badge variant="outline" className="text-xs">
                                      {app.companyName} – {app.jobTitle}
                                    </Badge>
                                  )}
                                  {res && (
                                    <Badge variant="outline" className="text-xs">
                                      📄 {res.title}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground self-center">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingNote({
                                    id: note.id,
                                    title: note.title,
                                    content: note.content,
                                    applicationId: note.applicationId,
                                    resumeId: note.resumeId,
                                  })}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {notes.length === 0 && !editingNote && (
                  <p className="text-xs text-muted-foreground text-center py-3">No notes yet. Create your first note to capture key preparation points.</p>
                )}
              </div>
            )}
          </div>

          <Card className="border-primary/20 shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Interview type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Interview Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["behavioral", "technical", "mixed"] as InterviewType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setInterviewType(t)}
                      className={cn(
                        "py-2.5 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-all",
                        interviewType === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      {t === "mixed" ? "Mixed 🔀" : t === "behavioral" ? "Behavioural 🧠" : "Technical ⚙️"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {interviewType === "behavioral" && "STAR-method questions about past experiences and soft skills."}
                  {interviewType === "technical" && "Skills, problem-solving, and domain knowledge questions."}
                  {interviewType === "mixed" && "3 behavioural + 3 technical questions for a balanced practice."}
                </p>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sector / Industry</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "general", label: "General 🌐" },
                    { key: "finance", label: "Finance 💰" },
                    { key: "consulting", label: "Consulting 📊" },
                    { key: "tech", label: "Tech ⚙️" },
                    { key: "product", label: "Product 🎯" },
                    { key: "design", label: "Design 🎨" },
                  ] as { key: typeof sector; label: string }[]).map(s => (
                    <button
                      key={s.key}
                      onClick={() => setSector(s.key)}
                      className={cn(
                        "py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all text-left",
                        sector === s.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sector === "finance" && "Includes case walks, valuation questions, and financial modelling scenarios."}
                  {sector === "consulting" && "Case framework questions, market sizing, and structured problem-solving."}
                  {sector === "tech" && "System design, coding approaches, and technical depth questions."}
                  {sector === "product" && "Metrics, prioritisation, roadmap trade-offs, and user research methods."}
                  {sector === "design" && "Portfolio critique, design process, user research, and critique handling."}
                  {sector === "general" && "Broadly applicable questions for any role or industry."}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Job Role <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input
                  placeholder="e.g. Senior Product Manager, Software Engineer"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                />
              </div>

              {/* JD */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Job Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  placeholder="Paste the job description for more targeted questions..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <><span className="animate-spin mr-2">⟳</span> Generating questions…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Start Interview (6 questions)</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                🎙️ Voice recording works in Chrome. You can also type your answers.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Interview
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "interview") {
    const q = questions[currentIdx];
    const progress = ((currentIdx) / questions.length) * 100;

    return (
      <AppLayout>
        <div className="p-6 max-w-3xl mx-auto flex flex-col gap-5">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Question {currentIdx + 1} of {questions.length}</span>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{q?.category}</Badge>
              <button onClick={handleReset} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Restart
              </button>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* KI question card */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">KI asks</p>
                <p className="text-base font-medium leading-relaxed">{q?.question}</p>
              </div>
            </div>
          </div>

          {/* Answer area — only shown if no feedback yet */}
          {!pendingFeedback && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Your Answer</label>
                {isRecording && (
                  <span className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Recording…
                  </span>
                )}
              </div>

              <Textarea
                placeholder="Type your answer here, or click the mic to record your voice…"
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                rows={7}
                className="resize-none"
                disabled={isEvaluating}
              />

              <div className="flex gap-2">
                {/* Voice button */}
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                  className="shrink-0"
                >
                  {isRecording
                    ? <><MicOff className="w-4 h-4 mr-2" /> Stop Recording</>
                    : <><Mic className="w-4 h-4 mr-2" /> Record Voice</>
                  }
                </Button>

                {/* Submit / Retry */}
                {evalFailed ? (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={isEvaluating}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Retry Evaluation
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isEvaluating || !currentAnswer.trim()}
                  >
                    {isEvaluating ? (
                      <><span className="animate-spin mr-2">⟳</span> KI is evaluating…</>
                    ) : (
                      <>Submit Answer <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Feedback card */}
          {pendingFeedback && (
            <div className={cn("border rounded-xl p-5 space-y-4", scoreBg(pendingFeedback.score))}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">KI Feedback</span>
                </div>
                <span className={cn("text-2xl font-bold", scoreColor(pendingFeedback.score))}>
                  {pendingFeedback.score}<span className="text-sm font-normal text-muted-foreground">/10</span>
                </span>
              </div>

              {/* Your answer recap */}
              <div className="bg-white/70 rounded-lg p-3 border border-white">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Your Answer</p>
                <p className="text-sm text-foreground leading-relaxed">{currentAnswer}</p>
              </div>

              {pendingFeedback.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                  </p>
                  <ul className="space-y-1">
                    {pendingFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingFeedback.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> To Improve
                  </p>
                  <ul className="space-y-1">
                    {pendingFeedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingFeedback.modelAnswer && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-primary uppercase flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Model Answer
                    </p>
                    <button
                      onClick={() => copyModelAnswer(pendingFeedback.modelAnswer, "pending")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      title="Copy model answer"
                    >
                      {copiedId === "pending" ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-white/70 rounded-lg p-3 border border-white italic">
                    "{pendingFeedback.modelAnswer}"
                  </p>
                </div>
              )}

              {pendingFeedback.tip && (
                <p className="text-xs text-muted-foreground bg-white/60 rounded-md px-3 py-2 border border-white">
                  💡 <span className="font-medium">Coaching tip:</span> {pendingFeedback.tip}
                </p>
              )}

              <Button className="w-full" onClick={handleNext}>
                {currentIdx + 1 >= questions.length
                  ? <><Trophy className="w-4 h-4 mr-2" /> See Your Results</>
                  : <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
                }
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Summary
  // ──────────────────────────────────────────────────────────────────────────
  const overall = avgScore(results);

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <div className="text-5xl font-black mb-1 flex items-center justify-center gap-2">
            <Trophy className="w-10 h-10 text-primary" />
            <span className={scoreColor(overall)}>{overall}</span>
            <span className="text-2xl text-muted-foreground font-normal">/10</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Interview Complete!</h1>
          <p className="text-muted-foreground text-sm">
            {overall >= 8 ? "Excellent performance — you're interview-ready. 🎉"
              : overall >= 6 ? "Good effort — a bit more practice and you'll nail it."
              : "Keep practising — each session makes you sharper."}
          </p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-primary">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
          </Card>
          <Card className="text-center p-4">
            <p className={cn("text-2xl font-bold", scoreColor(overall))}>{overall}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Score</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-green-600">{results.filter(r => r.feedback.score >= 7).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Strong Answers</p>
          </Card>
        </div>

        {/* Q&A review */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Answer Review</h2>
          {results.map((r, i) => (
            <Card key={i} className={cn("border overflow-hidden", scoreBg(r.feedback.score))}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                      <Badge variant="outline" className="text-xs">{r.question.category}</Badge>
                    </div>
                    <p className="text-sm font-medium">{r.question.question}</p>
                  </div>
                  <span className={cn("text-xl font-bold shrink-0", scoreColor(r.feedback.score))}>
                    {r.feedback.score}<span className="text-sm font-normal text-muted-foreground">/10</span>
                  </span>
                </div>

                <div className="bg-white/70 rounded-lg p-3 border border-white/80">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Your Answer</p>
                  <p className="text-sm leading-relaxed">{r.answer}</p>
                </div>

                {r.feedback.modelAnswer && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-primary uppercase flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Model Answer
                      </p>
                      <button
                        onClick={() => copyModelAnswer(r.feedback.modelAnswer, `summary-${i}`)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="Copy model answer"
                      >
                        {copiedId === `summary-${i}` ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-white/60 rounded p-2.5 border border-white/80 italic">
                      "{r.feedback.modelAnswer}"
                    </p>
                  </div>
                )}

                {r.feedback.tip && (
                  <p className="text-xs text-muted-foreground">
                    💡 {r.feedback.tip}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> New Interview
          </Button>
          <Button className="flex-1" onClick={() => window.location.href = "/dashboard"}>
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
