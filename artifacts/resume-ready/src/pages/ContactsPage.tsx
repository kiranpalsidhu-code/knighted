import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Mail, Phone, Linkedin, Building2, Pencil, Trash2, Users, CalendarCheck } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  relationship: string | null;
  notes: string | null;
  lastContactedAt: string | null;
}

const RELATIONSHIP_OPTIONS = ["Recruiter", "Hiring Manager", "Referral", "Former Colleague", "Mentor", "Other"];

const EMPTY_FORM = {
  name: "",
  company: "",
  role: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  relationship: "Recruiter",
  notes: "",
};

export default function ContactsPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const authedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  const loadContacts = async () => {
    try {
      const res = await authedFetch("/api/resume-ready/contacts");
      if (!res.ok) throw new Error("Failed to load contacts");
      setContacts(await res.json());
    } catch {
      toast({ title: "Couldn't load contacts", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEditDialog = (c: Contact) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      company: c.company || "",
      role: c.role || "",
      email: c.email || "",
      phone: c.phone || "",
      linkedinUrl: c.linkedinUrl || "",
      relationship: c.relationship || "Recruiter",
      notes: c.notes || "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/resume-ready/contacts/${editingId}` : "/api/resume-ready/contacts";
      const method = editingId ? "PATCH" : "POST";
      const res = await authedFetch(url, { method, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed to save contact");
      setIsOpen(false);
      await loadContacts();
      toast({ title: editingId ? "Contact updated" : "Contact added" });
    } catch {
      toast({ title: "Failed to save contact", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(null);
    try {
      const res = await authedFetch(`/api/resume-ready/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      setContacts((prev) => prev?.filter((c) => c.id !== id) || null);
      toast({ title: "Contact removed" });
    } catch {
      toast({ title: "Failed to remove contact", variant: "destructive" });
    }
  };

  const handleMarkContacted = async (id: number) => {
    const now = new Date().toISOString();
    try {
      const res = await authedFetch(`/api/resume-ready/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ lastContactedAt: now }),
      });
      if (!res.ok) throw new Error();
      setContacts((prev) => prev?.map((c) => c.id === id ? { ...c, lastContactedAt: now } : c) || null);
      toast({ title: "Logged", description: "Last contacted updated to today." });
    } catch {
      toast({ title: "Failed to log contact", variant: "destructive" });
    }
  };

  const formatLastContacted = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? "s" : ""} ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Networking</h1>
            <p className="text-muted-foreground mt-1">
              Track recruiters, referrals, and contacts who can help your job search.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} data-testid="button-add-contact">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Contact" : "Add Contact"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                      <SelectTrigger id="relationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="role">Role / Title</Label>
                    <Input id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input id="linkedinUrl" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="How you met, what they can help with, follow-up plans..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Contact"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !contacts?.length ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center text-center gap-3">
              <Users className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No contacts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add recruiters, referrals, and people helping with your search.
                </p>
              </div>
              <Button onClick={openAddDialog} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add your first contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <Card key={c.id} data-testid={`card-contact-${c.id}`}>
                <CardContent className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{c.name}</span>
                      {c.relationship && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {c.relationship}
                        </span>
                      )}
                    </div>
                    {(c.role || c.company) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {[c.role, c.company].filter(Boolean).join(" at ")}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="w-3.5 h-3.5" /> {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {c.phone}
                        </span>
                      )}
                      {c.linkedinUrl && (
                        <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                    {c.notes && <p className="text-sm mt-2 text-muted-foreground whitespace-pre-wrap">{c.notes}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {c.lastContactedAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" />
                          Last contacted: {formatLastContacted(c.lastContactedAt)}
                        </span>
                      )}
                      <button
                        onClick={() => handleMarkContacted(c.id)}
                        className="text-xs text-primary underline underline-offset-2 font-medium"
                      >
                        {c.lastContactedAt ? "Update" : "Log contact"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" aria-label="Edit contact" onClick={() => openEditDialog(c)} data-testid={`button-edit-contact-${c.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete contact" onClick={() => setDeleteConfirmId(c.id)} data-testid={`button-delete-contact-${c.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
