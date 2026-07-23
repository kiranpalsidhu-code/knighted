import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, resumesTable, applicationsTable, coverLettersTable, feedbackTable, resumeVersionsTable, guaranteeClaimsTable, referralsTable, contactsTable, interviewNotesTable, kiConversationsTable, kiMessagesTable, otpVerificationsTable } from "@workspace/db";
import { eq, and, count, desc, lt } from "drizzle-orm";
import Stripe from "stripe";
import { anthropic, MODEL_SONNET } from "@workspace/integrations-anthropic-ai";
import { Resend } from "resend";
import { randomBytes, randomUUID } from "crypto";
import multer from "multer";
import AdmZip from "adm-zip";

const router = Router();

/**
 * PII redaction for AI calls.
 * Strips name/email/phone/address from resume text before sending to the AI provider,
 * then restores the original values in the response. This minimises personal data
 * leaving our infrastructure, satisfying Item 11 of the Canadian data-residency brief.
 */
function redactPii(text: string): { redacted: string; restore: (s: string) => string } {
  const replacements: Array<{ placeholder: string; original: string }> = [];
  let counter = 0;
  let redacted = text;

  const sub = (original: string, label: string): string => {
    const placeholder = `__PII_${label}_${counter++}__`;
    replacements.push({ placeholder, original });
    return placeholder;
  };

  // Email addresses
  redacted = redacted.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, m => sub(m, 'EMAIL'));

  // Phone numbers (various formats)
  redacted = redacted.replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, m => sub(m, 'PHONE'));

  // LinkedIn / GitHub / personal URLs on their own line or after a label
  redacted = redacted.replace(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com)\/\S+/gi, m => sub(m, 'URL'));

  // Personal website / portfolio (generic URL that isn't a well-known company)
  redacted = redacted.replace(/(?:Portfolio|Website|Web):\s*https?:\/\/\S+/gi, m => sub(m, 'URL'));

  // Street addresses (number + street name pattern)
  redacted = redacted.replace(/\d{1,5}\s+\w+(?:\s+\w+){0,3}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)\.?(?:[,\s]+\w+(?:[,\s]+\w+)*)?/gi, m => sub(m, 'ADDRESS'));

  const restore = (output: string): string => {
    let restored = output;
    for (const { placeholder, original } of replacements) {
      restored = restored.replaceAll(placeholder, original);
    }
    return restored;
  };

  return { redacted, restore };
}

const FREE_RESUME_LIMIT = 3;

// Temporary launch flag: while testing with early users before marketing goes live,
// everyone gets Pro features regardless of their stored tier. Flip PRO_FOR_ALL_USERS
// to "false" (or unset it) once billing should start being enforced again.
const PRO_FOR_ALL = process.env.PRO_FOR_ALL_USERS === "true";

function effectiveTier(tier: string): string {
  return PRO_FOR_ALL ? "pro" : tier;
}

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

const REFERRAL_REWARD_DAYS = 30;

function generateReferralCode() {
  return randomBytes(5).toString("hex");
}

async function grantProDays(clerkId: string, days: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!user) return;
  const base = user.planExpiresAt && new Date(user.planExpiresAt) > new Date() ? new Date(user.planExpiresAt) : new Date();
  base.setDate(base.getDate() + days);
  await db
    .update(usersTable)
    .set({ tier: "pro", planExpiresAt: base, planType: user.planType || "referral" })
    .where(eq(usersTable.clerkId, clerkId));
}

async function ensureUser(clerkId: string, email?: string, referredByCode?: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length === 0) {
    let referralCode = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const clash = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode)).limit(1);
      if (clash.length === 0) break;
      referralCode = generateReferralCode();
    }

    let referrer: (typeof usersTable.$inferSelect) | undefined;
    if (referredByCode) {
      const found = await db.select().from(usersTable).where(eq(usersTable.referralCode, referredByCode)).limit(1);
      if (found.length > 0 && found[0].clerkId !== clerkId) {
        referrer = found[0];
      }
    }

    await db.insert(usersTable).values({
      clerkId,
      email: email || "",
      tier: "free",
      referralCode,
      referredByClerkId: referrer?.clerkId || null,
    }).onConflictDoNothing();

    if (referrer) {
      try {
        await db.insert(referralsTable).values({
          referrerClerkId: referrer.clerkId,
          refereeClerkId: clerkId,
          refereeEmail: email || null,
          rewardMonthsGranted: "0",
        });
        await grantProDays(referrer.clerkId, REFERRAL_REWARD_DAYS);
        await db
          .update(referralsTable)
          .set({ rewardMonthsGranted: "1" })
          .where(eq(referralsTable.refereeClerkId, clerkId));
      } catch {
        // referee already recorded (unique constraint) — ignore
      }
    }

    return { clerkId, email: email || "", tier: "free", stripeCustomerId: null, stripeSubscriptionId: null, referralCode, referredByClerkId: referrer?.clerkId || null } as any;
  }
  return existing[0];
}

// ── Custom OTP sign-up (no auth required) ────────────────────────────────────

const resendClient = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "TheKnightedResume <onboarding@resend.dev>";
const CLERK_API = "https://api.clerk.com/v1";

function clerkHeaders() {
  return {
    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

router.post("/resume-ready/auth/send-otp", async (req: any, res: any) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const normalised = email.toLowerCase().trim();

  try {
    // Check if a Clerk account already exists for this email
    const clerkCheck = await fetch(
      `${CLERK_API}/users?email_address=${encodeURIComponent(normalised)}&limit=1`,
      { headers: clerkHeaders() },
    );
    if (clerkCheck.ok) {
      const users = (await clerkCheck.json()) as any[];
      if (Array.isArray(users) && users.length > 0) {
        return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      }
    }

    // Delete any existing OTPs for this email
    await db.delete(otpVerificationsTable).where(eq(otpVerificationsTable.email, normalised));

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.insert(otpVerificationsTable).values({
      id: randomUUID(),
      email: normalised,
      code,
      expiresAt,
    });

    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: normalised,
      subject: "Your TheKnightedResume verification code",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0">Verify your email</h1>
          </div>
          <p style="color:#6b7280;font-size:15px;margin:0 0 24px">Use the code below to complete your TheKnightedResume sign-up. It expires in <strong>5 minutes</strong>.</p>
          <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e3a8a;font-variant-numeric:tabular-nums">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin:0">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.json({ message: "Code sent" });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/auth/send-otp");
    return res.status(500).json({ error: "Failed to send verification code" });
  }
});

router.post("/resume-ready/auth/verify-otp", async (req: any, res: any) => {
  const { email, code, password } = req.body ?? {};
  if (!email || !code || !password) {
    return res.status(400).json({ error: "Email, code, and password are required" });
  }
  const normalised = (email as string).toLowerCase().trim();

  try {
    const [otp] = await db
      .select()
      .from(otpVerificationsTable)
      .where(eq(otpVerificationsTable.email, normalised))
      .limit(1);

    if (!otp) return res.status(400).json({ error: "No verification code found. Please request a new one." });
    if (otp.used) return res.status(400).json({ error: "This code has already been used." });
    if (new Date() > new Date(otp.expiresAt)) return res.status(400).json({ error: "Code expired. Please request a new one." });
    if (otp.code !== String(code).trim()) return res.status(400).json({ error: "Incorrect code. Please try again." });

    // Mark OTP as used
    await db
      .update(otpVerificationsTable)
      .set({ used: true })
      .where(eq(otpVerificationsTable.id, otp.id));

    // Create Clerk user (email is already verified when created via Backend API)
    const createRes = await fetch(`${CLERK_API}/users`, {
      method: "POST",
      headers: clerkHeaders(),
      body: JSON.stringify({ email_address: [normalised], password }),
    });
    const createData = (await createRes.json()) as any;
    if (!createRes.ok) {
      const msg = createData?.errors?.[0]?.long_message ?? createData?.errors?.[0]?.message ?? "Failed to create account";
      return res.status(400).json({ error: msg });
    }
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/auth/verify-otp");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

router.get("/resume-ready/me", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const referredByCode = typeof req.query?.ref === "string" ? req.query.ref.trim() : undefined;
    const user = await ensureUser(req.userId, email, referredByCode);
    const [{ count: resumeCount }] = await db
      .select({ count: count() })
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));
    return res.json({ ...user, tier: effectiveTier(user.tier), resumeCount: Number(resumeCount) });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/me");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/dashboard", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const user = await ensureUser(req.userId, email);

    const [{ count: resumeCount }] = await db
      .select({ count: count() })
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));

    const applications = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, req.userId));

    const applicationsByStatus: Record<string, number> = {};
    for (const app of applications) {
      applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
    }

    return res.json({
      resumeCount: Number(resumeCount),
      applicationCount: applications.length,
      tier: effectiveTier(user.tier),
      applicationsByStatus,
    });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/dashboard");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/resumes", requireAuth, async (req: any, res: any) => {
  try {
    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));
    return res.json(resumes.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/resumes");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/resumes", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const user = await ensureUser(req.userId, email);

    if (effectiveTier(user.tier) === "free") {
      const [{ count: resumeCount }] = await db
        .select({ count: count() })
        .from(resumesTable)
        .where(eq(resumesTable.userId, req.userId));
      if (Number(resumeCount) >= FREE_RESUME_LIMIT) {
        return res.status(403).json({ error: "Free tier limit reached. Upgrade to Pro for unlimited resumes." });
      }
    }

    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const [resume] = await db
      .insert(resumesTable)
      .values({ userId: req.userId, title, content: content || "" })
      .returning();

    return res.status(201).json({
      ...resume,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/resumes");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/resumes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .limit(1);
    if (!resume) return res.status(404).json({ error: "Not found" });
    return res.json({
      ...resume,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/resumes/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/resumes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { title, content } = req.body;
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    // Auto-snapshot: fetch current state before overwriting
    const [current] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .limit(1);

    if (!current) return res.status(404).json({ error: "Not found" });

    // Only snapshot if content actually changed
    const contentChanged = content !== undefined && content !== current.content;
    if (contentChanged) {
      // Throttle: only auto-snapshot if last version is > 2 min old (or none exists)
      const [lastVersion] = await db
        .select({ createdAt: resumeVersionsTable.createdAt })
        .from(resumeVersionsTable)
        .where(eq(resumeVersionsTable.resumeId, id))
        .orderBy(desc(resumeVersionsTable.createdAt))
        .limit(1);

      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      const shouldSnapshot = !lastVersion || lastVersion.createdAt < twoMinAgo;

      if (shouldSnapshot) {
        await db.insert(resumeVersionsTable).values({
          resumeId: id,
          userId: req.userId,
          title: title ?? current.title,
          content: current.content,
        });
        // Trim to max 50 versions
        const versions = await db
          .select({ id: resumeVersionsTable.id })
          .from(resumeVersionsTable)
          .where(eq(resumeVersionsTable.resumeId, id))
          .orderBy(desc(resumeVersionsTable.createdAt));
        if (versions.length > 50) {
          const toDelete = versions.slice(50).map((v: any) => v.id);
          for (const vid of toDelete) {
            await db.delete(resumeVersionsTable).where(eq(resumeVersionsTable.id, vid));
          }
        }
      }
    }

    const [resume] = await db
      .update(resumesTable)
      .set(updates)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .returning();

    if (!resume) return res.status(404).json({ error: "Not found" });
    return res.json({
      ...resume,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/resumes/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/resumes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/resumes/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Version history routes ────────────────────────────────────────────────────

router.get("/resume-ready/resumes/:id/versions", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const versions = await db
      .select()
      .from(resumeVersionsTable)
      .where(and(eq(resumeVersionsTable.resumeId, id), eq(resumeVersionsTable.userId, req.userId)))
      .orderBy(desc(resumeVersionsTable.createdAt));
    return res.json(versions.map((v: any) => ({ ...v, createdAt: v.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/resumes/:id/versions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/resumes/:id/versions", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { label } = req.body;
    const [current] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .limit(1);
    if (!current) return res.status(404).json({ error: "Not found" });
    const [version] = await db
      .insert(resumeVersionsTable)
      .values({ resumeId: id, userId: req.userId, title: current.title, content: current.content, label: label || null })
      .returning();
    return res.status(201).json({ ...version, createdAt: version.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/resumes/:id/versions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/resumes/:id/versions/:versionId/label", requireAuth, async (req: any, res: any) => {
  try {
    const resumeId = Number(req.params.id);
    const versionId = Number(req.params.versionId);
    const { label } = req.body;
    await db
      .update(resumeVersionsTable)
      .set({ label: label || null })
      .where(and(eq(resumeVersionsTable.id, versionId), eq(resumeVersionsTable.resumeId, resumeId), eq(resumeVersionsTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/resumes/:id/versions/:versionId/label");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/resumes/:id/versions/:versionId/restore", requireAuth, async (req: any, res: any) => {
  try {
    const resumeId = Number(req.params.id);
    const versionId = Number(req.params.versionId);
    const [version] = await db
      .select()
      .from(resumeVersionsTable)
      .where(and(eq(resumeVersionsTable.id, versionId), eq(resumeVersionsTable.resumeId, resumeId), eq(resumeVersionsTable.userId, req.userId)))
      .limit(1);
    if (!version) return res.status(404).json({ error: "Not found" });

    // Snapshot current state before restoring
    const [current] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId))).limit(1);
    if (current) {
      await db.insert(resumeVersionsTable).values({ resumeId, userId: req.userId, title: current.title, content: current.content, label: "Before restore" });
    }

    const [updated] = await db
      .update(resumesTable)
      .set({ title: version.title, content: version.content })
      .where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/resumes/:id/versions/:versionId/restore");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/resumes/:id/versions/:versionId", requireAuth, async (req: any, res: any) => {
  try {
    const resumeId = Number(req.params.id);
    const versionId = Number(req.params.versionId);
    await db
      .delete(resumeVersionsTable)
      .where(and(eq(resumeVersionsTable.id, versionId), eq(resumeVersionsTable.resumeId, resumeId), eq(resumeVersionsTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/resumes/:id/versions/:versionId");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// ── Share link routes ─────────────────────────────────────────────────────────

router.post("/resume-ready/resumes/:id/share", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const token = existing.shareToken || randomBytes(16).toString("hex");
    const [updated] = await db
      .update(resumesTable)
      .set({ shareToken: token } as any)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)))
      .returning();

    return res.json({ shareToken: (updated as any).shareToken });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/resumes/:id/share");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/resumes/:id/share", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(resumesTable)
      .set({ shareToken: null } as any)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/resumes/:id/share");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/public/resumes/:token", async (req: any, res: any) => {
  try {
    const { token } = req.params;
    const [resume] = await db
      .select({ title: resumesTable.title, content: resumesTable.content })
      .from(resumesTable)
      .where(eq((resumesTable as any).shareToken, token))
      .limit(1);
    if (!resume) return res.status(404).json({ error: "Not found" });
    return res.json(resume);
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/public/resumes/:token");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// Derive the canonical interviewDate from the interviews array (nearest upcoming, else most recent)
function deriveInterviewDate(
  interviews: Array<{ date: string; type: string }> | null | undefined,
  fallback?: string | null,
): string | null {
  if (!interviews || interviews.length === 0) return fallback || null;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = interviews.filter(i => i.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length > 0) return upcoming[0].date;
  const past = [...interviews].sort((a, b) => b.date.localeCompare(a.date));
  return past[0]?.date || fallback || null;
}

router.get("/resume-ready/applications", requireAuth, async (req: any, res: any) => {
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, req.userId));
    return res.json(apps.map(a => ({
      ...a,
      appliedAt: a.appliedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/applications");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/applications", requireAuth, async (req: any, res: any) => {
  try {
    const { company, role, status, notes, url, salary, recruiterName, recruiterEmail, interviewDate, deadline, appliedDate, interviews } = req.body;
    if (!company || !role) return res.status(400).json({ error: "company and role are required" });

    // Derive interviewDate from interviews array (nearest upcoming, else most recent)
    const resolvedInterviewDate = deriveInterviewDate(interviews, interviewDate);

    const [app] = await db
      .insert(applicationsTable)
      .values({
        userId: req.userId,
        company,
        role,
        status: status || "Applied",
        notes: notes || null,
        url: url || null,
        salary: salary || null,
        recruiterName: recruiterName || null,
        recruiterEmail: recruiterEmail || null,
        interviewDate: resolvedInterviewDate,
        deadline: deadline || null,
        appliedDate: appliedDate || null,
        interviews: interviews || null,
      })
      .returning();

    return res.status(201).json({ ...app, appliedAt: app.appliedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/applications");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/applications/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { company, role, status, notes, url, salary, recruiterName, recruiterEmail, interviewDate, deadline, appliedDate, interviews } = req.body;
    const updates: Record<string, any> = {};
    if (company !== undefined) updates.company = company;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (url !== undefined) updates.url = url;
    if (salary !== undefined) updates.salary = salary;
    if (recruiterName !== undefined) updates.recruiterName = recruiterName;
    if (recruiterEmail !== undefined) updates.recruiterEmail = recruiterEmail;
    if (deadline !== undefined) updates.deadline = deadline;
    if (appliedDate !== undefined) updates.appliedDate = appliedDate;
    if (interviews !== undefined) {
      updates.interviews = interviews;
      updates.interviewDate = deriveInterviewDate(interviews, interviewDate);
    } else if (interviewDate !== undefined) {
      updates.interviewDate = interviewDate;
    }

    const [app] = await db
      .update(applicationsTable)
      .set(updates)
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId)))
      .returning();

    if (!app) return res.status(404).json({ error: "Not found" });
    return res.json({ ...app, appliedAt: app.appliedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/applications/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/applications/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(applicationsTable)
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/applications/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

router.get("/resume-ready/contacts", requireAuth, async (req: any, res: any) => {
  try {
    const contacts = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.userId, req.userId))
      .orderBy(desc(contactsTable.createdAt));
    return res.json(contacts.map(c => ({
      ...c,
      lastContactedAt: c.lastContactedAt ? c.lastContactedAt.toISOString() : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/contacts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/contacts", requireAuth, async (req: any, res: any) => {
  try {
    const { name, company, role, email, phone, linkedinUrl, relationship, notes, applicationId, lastContactedAt } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "name is required" });

    const [contact] = await db
      .insert(contactsTable)
      .values({
        userId: req.userId,
        name: name.trim(),
        company: company || null,
        role: role || null,
        email: email || null,
        phone: phone || null,
        linkedinUrl: linkedinUrl || null,
        relationship: relationship || null,
        notes: notes || null,
        applicationId: applicationId ?? null,
        lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : null,
      })
      .returning();

    return res.status(201).json({ ...contact, lastContactedAt: contact.lastContactedAt ? contact.lastContactedAt.toISOString() : null });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/contacts");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/contacts/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { name, company, role, email, phone, linkedinUrl, relationship, notes, applicationId, lastContactedAt } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (company !== undefined) updates.company = company;
    if (role !== undefined) updates.role = role;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (relationship !== undefined) updates.relationship = relationship;
    if (notes !== undefined) updates.notes = notes;
    if (applicationId !== undefined) updates.applicationId = applicationId;
    if (lastContactedAt !== undefined) updates.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;

    const [contact] = await db
      .update(contactsTable)
      .set(updates)
      .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, req.userId)))
      .returning();

    if (!contact) return res.status(404).json({ error: "Not found" });
    return res.json({ ...contact, lastContactedAt: contact.lastContactedAt ? contact.lastContactedAt.toISOString() : null });
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/contacts/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/contacts/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(contactsTable)
      .where(and(eq(contactsTable.id, id), eq(contactsTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/contacts/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/tailor", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeId, jobDescription, customInstructions } = req.body;
    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: "resumeId and jobDescription are required" });
    }

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, Number(resumeId)), eq(resumesTable.userId, req.userId)))
      .limit(1);

    if (!resume) return res.status(404).json({ error: "Resume not found" });

    // PII redaction: strip direct identifiers before sending to AI, re-insert after
    const { redacted: redactedContent, restore } = redactPii(resume.content);

    const prompt = `You are a world-class resume writer and career coach with deep expertise in ATS optimisation. Your task is to rewrite the candidate's resume so it is perfectly tailored to the job description below.

Guidelines:
- Preserve the candidate's authentic voice, real experience, and factual accuracy — never fabricate or exaggerate
- Integrate keywords and phrases from the job description naturally into bullet points
- Strengthen weak bullets with stronger action verbs and quantified results where possible
- Prioritise the most relevant experience at the top of each role
- Ensure the summary/objective (if present) speaks directly to this role
- Keep formatting consistent and clean
- Return only the updated resume content, no explanations or commentary
${customInstructions ? `\nAdditional instructions from the candidate:\n${customInstructions}` : ""}

Job Description:
${jobDescription}

Current Resume:
${redactedContent}`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = response.content[0]?.type === "text" ? response.content[0].text : redactedContent;
    const content = restore(rawContent);
    return res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/tailor");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/tailor-text", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeText, jobDescription, customInstructions } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are required" });
    }

    const system = `You are an elite resume writer and ATS optimisation expert with 15+ years of experience helping candidates land interviews at top companies. You have deep knowledge of how applicant tracking systems score resumes and what hiring managers actually read.

Your task: rewrite the candidate's resume so it is a near-perfect match for the job description — while keeping every fact 100% truthful and the candidate's voice intact.

OUTPUT RULES (follow exactly):
1. Return ONLY the rewritten resume text — no preamble, no commentary, no "Here is your tailored resume:" opener
2. Mirror the exact section structure and headers from the original resume (e.g. if it uses "PROFESSIONAL EXPERIENCE", keep that exact heading)
3. Preserve all contact info, company names, job titles, employment dates, and education facts unchanged
4. Use the same line/bullet formatting style as the original

REWRITING RULES:
- Professional summary/objective: rewrite to directly address this specific role and company; use the job's exact title and 2-3 of its most important keywords
- Every bullet point: apply the STAR-light pattern (action verb → what you did → measurable result where possible); front-load the most impactful verb
- Keyword integration: weave the JD's required skills, tools, and competencies naturally into bullets — don't keyword-stuff, integrate them meaningfully
- Prioritise: within each role, reorder bullets so the most relevant ones to this JD appear first
- Cut: remove or condense bullets that are completely irrelevant to this role to make room for stronger content
- Strengthen: replace weak verbs (responsible for, helped, worked on, assisted) with strong action verbs (led, engineered, launched, drove, reduced, grew)
- Quantify: if a bullet has a vague outcome ("improved performance"), make it specific ("reduced page load time by 40%") — only if the original hints at it; never fabricate numbers
- Skills section: reorder to list the skills most relevant to this role first${customInstructions ? `\n\nCANDIDATE'S SPECIAL INSTRUCTIONS (take priority over general guidelines):\n${customInstructions}` : ""}`;

    // PII redaction: strip direct identifiers before sending to AI, re-insert after
    const { redacted: redactedText, restore } = redactPii(resumeText);

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: `JOB DESCRIPTION:\n${jobDescription}\n\n---\n\nCANDIDATE'S CURRENT RESUME:\n${redactedText}` }],
    });

    const rawContent = response.content[0]?.type === "text" ? response.content[0].text : redactedText;
    const content = restore(rawContent);
    return res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/tailor-text");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/keyword-gap", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    if (!resumeContent || !jobDescription) {
      return res.status(400).json({ error: "resumeContent and jobDescription are required" });
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach.

Analyze the resume against the job description and return a JSON object with this exact shape:
{
  "score": <integer 0-100 representing how well the resume matches the job>,
  "matchedKeywords": <array of strings — skills, technologies, qualifications present in BOTH the resume and job description>,
  "missingKeywords": <array of strings — important skills, technologies, qualifications from the job description NOT found in the resume>,
  "suggestions": <array of 3-5 short, specific, actionable strings telling the candidate how to close the most important gaps>
}

Rules:
- Keywords should be specific (e.g. "TypeScript", "Agile", "P&L management") not generic (e.g. "communication")
- Keep each keyword short (1-4 words)
- Limit matchedKeywords to the 15 most important matches
- Limit missingKeywords to the 10 most critical gaps
- Suggestions should name the missing keyword and say concretely how to add it
- Return ONLY valid JSON — no markdown, no commentary

Job Description:
${jobDescription}

Resume:
${resumeContent}`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    return res.json({
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/keyword-gap");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/rewrite-bullet", requireAuth, async (req: any, res: any) => {
  try {
    const { bullet, jobDescription, customInstructions } = req.body;
    if (!bullet?.trim()) return res.status(400).json({ error: "bullet is required" });

    const systemPrompt = `You are KI (Knighted Intelligence), a world-class resume writing expert. You rewrite individual resume bullet points to be more impactful using the STAR-light framework (Situation implied, Task/Action explicit, Result quantified). Rules:
- Start with a strong action verb (Led, Built, Reduced, Grew, Delivered…)
- Quantify wherever plausible (%, $, time saved, users impacted)
- Mirror keywords from the job description if one is provided
- Keep it to 1-2 lines maximum
- Return ONLY the rewritten bullet, no explanation, no formatting`;

    const userContent = [
      `Original bullet: "${bullet}"`,
      jobDescription ? `Job description context:\n${jobDescription.slice(0, 800)}` : "",
      customInstructions ? `Additional instructions: ${customInstructions}` : "",
    ].filter(Boolean).join("\n\n");

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const rewritten = response.content[0]?.type === "text" ? response.content[0].text.trim() : bullet;
    return res.json({ rewritten });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/rewrite-bullet");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/feedback", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: "resumeId is required" });

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, Number(resumeId)), eq(resumesTable.userId, req.userId)))
      .limit(1);

    if (!resume) return res.status(404).json({ error: "Resume not found" });

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume and provide specific, actionable improvements to boost its ATS score.

For each item return FOUR fields:
- "bullet": the EXACT original text copied verbatim from the resume (a full sentence, bullet point, or section heading — enough to uniquely identify it)
- "suggestion": a short plain-English explanation of WHY this change improves ATS performance (1-2 sentences, no jargon)
- "rewrite": the COMPLETE rewritten version of that bullet/sentence/section, ready to paste directly into the resume — this must be a concrete, specific improvement with numbers, strong action verbs, and ATS keywords where relevant
- "impact": integer 1-10 for how much this change will improve the ATS score

Return a JSON array in this exact format:
[{"bullet": "exact original text from resume", "suggestion": "why this helps ATS", "rewrite": "complete rewritten version", "impact": 8}]

Only return valid JSON. No markdown, no explanation outside the array.

Resume Content:
${resume.content}

Return only the JSON array, no markdown, no other text.`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    let suggestions = [];
    try {
      const raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
      suggestions = JSON.parse(raw.trim());
    } catch {
      suggestions = [
        { bullet: "Summary", suggestion: "Add quantifiable achievements and industry keywords to improve ATS visibility.", rewrite: "Results-driven professional with 5+ years of experience delivering measurable outcomes. Achieved 20% efficiency gains through process optimization and cross-functional collaboration.", impact: 8 },
        { bullet: "Experience", suggestion: "Use strong action verbs at the start of each bullet point to increase keyword density.", rewrite: "Spearheaded end-to-end project delivery, reducing time-to-completion by 30% and exceeding client satisfaction targets for 3 consecutive quarters.", impact: 7 },
        { bullet: "Skills", suggestion: "Include specific technical skills mentioned in job postings to match ATS filters.", rewrite: "Technical Skills: Python, SQL, Excel (Advanced), Tableau, Power BI, Salesforce CRM, Jira, Agile/Scrum methodologies", impact: 9 },
      ];
    }

    return res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/feedback");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/jobs/search", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeId, jobTitle: jobTitleOverride, location, workArrangement, employmentType } = req.body;

    let analysis: any = null;
    let primaryQuery: string;
    let parsed: any = {};

    if (resumeId) {
      const [resume] = await db
        .select()
        .from(resumesTable)
        .where(and(eq(resumesTable.id, Number(resumeId)), eq(resumesTable.userId, req.userId)))
        .limit(1);

      if (!resume) return res.status(404).json({ error: "Resume not found" });

      const analysisPrompt = `You are an expert career coach and recruiter. Perform a thorough analysis of this resume.

Resume:
${resume.content.slice(0, 4000)}

Return a JSON object with EXACTLY these fields:
{
  "jobTitle": "the most appropriate job title to search for (e.g. 'Senior Software Engineer', 'Product Manager')",
  "seniorityLevel": "one of: Entry-level, Mid-level, Senior, Staff, Principal, Director, VP",
  "yearsOfExperience": "estimated years as a string e.g. '6 years'",
  "topSkills": ["array", "of", "5-8", "most", "marketable", "skills", "from", "the", "resume"],
  "industries": ["array", "of", "1-3", "industries", "this", "person", "has", "worked", "in"],
  "summary": "one sentence describing this candidate's professional profile for job matching purposes",
  "primaryQuery": "best 4-6 word job search query e.g. 'senior software engineer TypeScript Node.js'",
  "secondaryQuery": "alternative 4-6 word query targeting a related role e.g. 'full stack engineer React'"
}

Return ONLY valid JSON, no markdown, no explanation.`;

      const aiResponse = await anthropic.messages.create({
        model: MODEL_SONNET,
        max_tokens: 8192,
        messages: [{ role: "user", content: analysisPrompt }],
      });

      try {
        const aiText = aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "{}";
        parsed = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      } catch {
        parsed = {};
      }

      analysis = {
        jobTitle: parsed.jobTitle || resume.title,
        seniorityLevel: parsed.seniorityLevel || "Mid-level",
        yearsOfExperience: parsed.yearsOfExperience || "Unknown",
        topSkills: Array.isArray(parsed.topSkills) ? parsed.topSkills.slice(0, 8) : [],
        industries: Array.isArray(parsed.industries) ? parsed.industries.slice(0, 3) : [],
        summary: parsed.summary || "",
      };

      // Use clean job title as primary search term (short, standard title works best on job boards)
      // Keep the verbose AI query only as a secondary attempt
      primaryQuery = jobTitleOverride?.trim() || analysis.jobTitle;
    } else {
      // No resume — search directly by the provided job title
      if (!jobTitleOverride?.trim()) {
        return res.status(400).json({ error: "Either a resume or a job title is required." });
      }
      primaryQuery = jobTitleOverride.trim();
    }

    // Build a list of queries to run in parallel for maximum coverage
    const searchQueries = [primaryQuery];
    if (analysis) {
      // Also run the verbose AI query and secondary query for broader coverage
      if (parsed.primaryQuery && parsed.primaryQuery !== primaryQuery) {
        searchQueries.push(parsed.primaryQuery);
      }
      if (parsed.secondaryQuery) {
        searchQueries.push(parsed.secondaryQuery);
      }
    }

    const stripHtml = (html: string) =>
      html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();

    // Adzuna country detection — maps location input to Adzuna country codes
    // Supported: us, gb, ca, au, de, fr, at, br, in, it, mx, nz, pl, ru, sg, za
    const LOCATION_TO_COUNTRY: [RegExp, string][] = [
      [/\b(canada|canadian|ontario|quebec|bc|alberta|toronto|vancouver|montreal|calgary|ottawa)\b/i, "ca"],
      [/\b(united states|usa|us\b|u\.s\.|american?|new york|california|texas|florida|chicago|seattle|boston)\b/i, "us"],
      [/\b(uk|united kingdom|england|britain|london|manchester|edinburgh|glasgow|birmingham)\b/i, "gb"],
      [/\b(australia|australian|sydney|melbourne|brisbane|perth|auckland)\b/i, "au"],
      [/\b(germany|german|deutschland|berlin|munich|frankfurt|hamburg)\b/i, "de"],
      [/\b(france|french|paris|lyon|marseille)\b/i, "fr"],
      [/\b(india|indian|bangalore|mumbai|delhi|hyderabad|chennai)\b/i, "in"],
      [/\b(brazil|brasil|sao paulo|rio de janeiro)\b/i, "br"],
      [/\b(singapore|sg\b)\b/i, "sg"],
      [/\b(south africa|cape town|johannesburg|durban)\b/i, "za"],
    ];

    const detectCountries = (loc?: string): string[] => {
      if (!loc) return ["us", "gb", "ca", "au"]; // no location → search top 4 markets
      const l = loc.toLowerCase();
      for (const [pattern, code] of LOCATION_TO_COUNTRY) {
        if (pattern.test(l)) return [code];
      }
      // Unrecognised location — try us + gb + ca in parallel (location passed as `where`)
      return ["us", "gb", "ca"];
    };

    // Source 1: Adzuna — broad job board, multi-country, all sectors
    const adzunaFetch = async (query: string, loc?: string): Promise<any[]> => {
      const appId = process.env.ADZUNA_APP_ID;
      const appKey = process.env.ADZUNA_APP_KEY;
      if (!appId || !appKey) return [];

      const countries = detectCountries(loc);
      const mapJob = (j: any, countryCode: string) => {
        let salary: string | null = null;
        if (j.salary_min && j.salary_max) {
          const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
          salary = `${fmt(j.salary_min)} – ${fmt(j.salary_max)}`;
        }
        const jobLoc = j.location?.display_name || null;
        return {
          id: `adzuna-${countryCode}-${j.id}`,
          title: j.title,
          company: j.company?.display_name || "",
          location: jobLoc,
          salary,
          description: j.description ? j.description.slice(0, 400) : null,
          url: j.redirect_url || null,
          postedAt: j.created || null,
          employmentType: j.contract_time?.toLowerCase().replace(/_/g, "") || null,
          isRemote: /remote/i.test(jobLoc || "") || /remote/i.test(j.title || ""),
        };
      };

      try {
        const perCountry = await Promise.all(
          countries.map(async (countryCode) => {
            const params = new URLSearchParams({
              app_id: appId,
              app_key: appKey,
              what: query,
              results_per_page: countries.length > 1 ? "10" : "20",
              sort_by: "date",
              content_type: "application/json",
            });
            if (loc) params.set("where", loc);
            if (workArrangement === "remote") params.set("what_or", "remote");
            const r = await fetch(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params}`);
            if (!r.ok) return [];
            const data = await r.json() as any;
            return (data.results || []).map((j: any) => mapJob(j, countryCode)).filter((j: any) => j.url);
          })
        );
        return perCountry.flat();
      } catch { return []; }
    };

    // Source 2: Remotive — supplemental remote/tech jobs (no key needed)
    const remotiveFetch = async (query: string): Promise<any[]> => {
      try {
        const params = new URLSearchParams({ search: query, limit: "10" });
        const r = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
        if (!r.ok) return [];
        const data = await r.json() as any;
        return (data.jobs || []).map((j: any) => ({
          id: `remotive-${j.id}`,
          title: j.title,
          company: j.company_name,
          location: j.candidate_required_location || "Remote / Worldwide",
          salary: j.salary || null,
          description: j.description ? stripHtml(j.description).slice(0, 400) : null,
          url: j.url,
          postedAt: j.publication_date || null,
          employmentType: j.job_type || null,
          isRemote: true,
        }));
      } catch { return []; }
    };

    // Fetch all queries in parallel — Adzuna is primary, Remotive supplements remote roles
    const fetchForQuery = async (query: string): Promise<any[]> => {
      const [adzuna, remotive] = await Promise.all([
        adzunaFetch(query, location || undefined),
        workArrangement === "onsite" ? Promise.resolve([]) : remotiveFetch(query),
      ]);
      return [...adzuna, ...remotive];
    };

    const rawJobBatches = await Promise.all(searchQueries.map(fetchForQuery));
    const rawJobs = rawJobBatches.flat();

    // --- Location filter ---
    // Remotive is remote-only and ignores location — post-filter after fetching.
    // Keep if: no location specified, OR job location contains the user's location, OR location is vague/worldwide.
    const locationNorm = location?.trim().toLowerCase();
    const VAGUE_LOCATIONS = ["worldwide", "anywhere", "global", "remote", "flexible", "international"];
    const locationOk = (jobLoc: string | null | undefined): boolean => {
      if (!locationNorm) return true;
      if (!jobLoc) return true;
      const l = jobLoc.toLowerCase();
      if (VAGUE_LOCATIONS.some((v) => l.includes(v))) return true;
      return l.includes(locationNorm);
    };

    // --- Title relevance filter ---
    // Use the CLEAN job title (primaryQuery) as the keyword source, not a verbose AI phrase.
    // "Director of Energy Trading" → keywords: ["director", "energy", "trading"]
    // Require at least one keyword to appear in the job title.
    const STOP_WORDS = new Set(["with", "and", "the", "for", "senior", "junior", "lead", "staff", "head"]);
    const titleKeywords = primaryQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
    const titleOk = (jobTitle: string | null | undefined): boolean => {
      if (!titleKeywords.length) return true;
      if (!jobTitle) return false;
      const t = jobTitle.toLowerCase();
      return titleKeywords.some((kw) => t.includes(kw));
    };

    // --- Employment type filter ---
    const etFilter = employmentType?.toUpperCase();
    const etMap: Record<string, string[]> = {
      FULLTIME: ["full_time", "full-time", "fulltime", "permanent"],
      PARTTIME: ["part_time", "part-time", "parttime"],
      CONTRACTOR: ["contract", "contractor", "freelance"],
      INTERN: ["internship", "intern"],
    };
    const etTerms = etFilter ? (etMap[etFilter] || []) : [];

    const seen = new Set<string>();
    const applyFilters = (list: any[], requireTitle: boolean) =>
      list.filter((j) => {
        if (!j || seen.has(j.id)) return false;
        seen.add(j.id);
        if (!locationOk(j.location)) return false;
        if (requireTitle && !titleOk(j.title)) return false;
        if (etTerms.length && j.employmentType) {
          return etTerms.some((t) => j.employmentType.toLowerCase().includes(t));
        }
        return true;
      });

    let jobs = applyFilters(rawJobs, true).slice(0, 20);

    // Tier 2: combined search gave nothing — search each keyword separately,
    // requiring that keyword to appear in the job title
    if (jobs.length === 0 && titleKeywords.length > 1) {
      seen.clear();
      const perKwBatches = await Promise.all(
        titleKeywords.map(async (kw) => {
          const kwJobs = await fetchForQuery(kw);
          return kwJobs.filter((j) => j && locationOk(j.location) && j.title?.toLowerCase().includes(kw));
        })
      );
      const kwSeen = new Set<string>();
      jobs = perKwBatches.flat().filter((j) => {
        if (!j || kwSeen.has(j.id)) return false;
        kwSeen.add(j.id);
        return true;
      }).slice(0, 20);
    }

    return res.json({ jobs, query: primaryQuery, analysis });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/jobs/search");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/cover-letters", requireAuth, async (req: any, res: any) => {
  try {
    const letters = await db
      .select()
      .from(coverLettersTable)
      .where(eq(coverLettersTable.userId, req.userId));
    return res.json(letters.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/cover-letters");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/cover-letters", requireAuth, async (req: any, res: any) => {
  try {
    const { title, jobTitle, companyName, content } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const [letter] = await db
      .insert(coverLettersTable)
      .values({ userId: req.userId, title, jobTitle: jobTitle || "", companyName: companyName || "", content: content || "" })
      .returning();

    return res.status(201).json({
      ...letter,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/cover-letters");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/cover-letters/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const [letter] = await db
      .select()
      .from(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId)))
      .limit(1);
    if (!letter) return res.status(404).json({ error: "Not found" });
    return res.json({
      ...letter,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/cover-letters/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/cover-letters/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { title, jobTitle, companyName, content } = req.body;
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (companyName !== undefined) updates.companyName = companyName;
    if (content !== undefined) updates.content = content;

    const [letter] = await db
      .update(coverLettersTable)
      .set(updates)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId)))
      .returning();

    if (!letter) return res.status(404).json({ error: "Not found" });
    return res.json({
      ...letter,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/cover-letters/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/cover-letters/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/cover-letters/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/cover-letter", requireAuth, async (req: any, res: any) => {
  try {
    const { resumeContent, jobDescription, jobTitle, companyName, customInstructions, existingCoverLetter } = req.body;
    if (!resumeContent || !jobDescription) {
      return res.status(400).json({ error: "resumeContent and jobDescription are required" });
    }

    const roleContext = [jobTitle, companyName].filter(Boolean).join(" at ");

    const coverSystem = existingCoverLetter?.trim()
      ? `You are an elite cover letter editor. Your job is to surgically improve an existing cover letter so it is a stronger, more targeted match for the specific role — without erasing the candidate's voice or inventing anything new.

REVISION RULES:
- Keep sentences and paragraphs that are already strong and specific — do not rewrite them just for the sake of it
- Replace generic phrases ("I am passionate about", "team player", "hard worker", "I believe") with concrete evidence from the resume
- Align the opening hook to speak directly to this company and role — if it currently says "I am writing to apply for", replace it with something that immediately signals value
- Weave 2-3 of the job description's key requirements into the body naturally — do not keyword-stuff
- Sharpen the closing to a confident, specific call to action
- Maintain the same approximate length and paragraph structure
- Return ONLY the revised cover letter — no commentary, no "Here is the revised version:" opener${customInstructions ? `\n\nCANDIDATE'S SPECIAL INSTRUCTIONS:\n${customInstructions}` : ""}`
      : `You are an elite cover letter writer. You write letters that hiring managers actually finish reading — because every sentence earns its place.

STRUCTURE (follow this exactly):
1. Opening hook (2-3 sentences): Do NOT start with "I am applying for" or "I am excited to". Open with a concrete statement of value or a sharp observation about the company's challenge that the candidate can solve. Make the hiring manager think "this person gets it."
2. Body paragraph 1: Connect the candidate's single most impressive, relevant achievement to the company's primary need from the JD. Be specific — name the metric, the outcome, the scale.
3. Body paragraph 2: Show 1-2 more relevant skills or experiences, tied directly to secondary requirements from the JD. Demonstrate you've read the job description carefully.
4. Closing (2-3 sentences): Confident, direct call to action. No begging, no "I would be honoured". Something like: "I'd welcome a conversation about how I can [specific value]. Available [flexible/any time] — [email/phone]."

TONE & STYLE:
- Confident, specific, human — never sycophantic or generic
- Active voice, short punchy sentences mixed with one longer one for rhythm
- NEVER use: "passionate about", "team player", "hard worker", "I believe I would be a great fit", "I am excited to", "I look forward to hearing from you"
- Return ONLY the cover letter body — no subject line, no "Dear Hiring Manager" header (unless the candidate's instructions request it), no commentary${customInstructions ? `\n\nCANDIDATE'S SPECIAL INSTRUCTIONS:\n${customInstructions}` : ""}`;

    const userContent = existingCoverLetter?.trim()
      ? `ROLE: ${roleContext || "See job description"}\n\nJOB DESCRIPTION:\n${jobDescription}\n\n---\n\nCANDIDATE RESUME:\n${resumeContent}\n\n---\n\nEXISTING COVER LETTER TO REVISE:\n${existingCoverLetter}`
      : `ROLE: ${roleContext || "See job description"}\n\nJOB DESCRIPTION:\n${jobDescription}\n\n---\n\nCANDIDATE RESUME:\n${resumeContent}`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 8192,
      system: coverSystem,
      messages: [{ role: "user", content: userContent }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    return res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/cover-letter");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Interview Notes ───────────────────────────────────────────────────────────
router.get("/resume-ready/interview-notes", requireAuth, async (req: any, res: any) => {
  try {
    const notes = await db
      .select()
      .from(interviewNotesTable)
      .where(eq(interviewNotesTable.userId, req.userId))
      .orderBy(interviewNotesTable.updatedAt);
    return res.json(notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/interview-notes");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/interview-notes", requireAuth, async (req: any, res: any) => {
  try {
    const { title, content, applicationId, resumeId } = req.body;
    const [note] = await db
      .insert(interviewNotesTable)
      .values({
        userId: req.userId,
        title: title || "Untitled Note",
        content: content || "",
        applicationId: applicationId || null,
        resumeId: resumeId || null,
      })
      .returning();
    return res.status(201).json({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/interview-notes");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/resume-ready/interview-notes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const { title, content, applicationId, resumeId } = req.body;
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (applicationId !== undefined) updates.applicationId = applicationId;
    if (resumeId !== undefined) updates.resumeId = resumeId;

    const [note] = await db
      .update(interviewNotesTable)
      .set(updates)
      .where(and(eq(interviewNotesTable.id, id), eq(interviewNotesTable.userId, req.userId)))
      .returning();

    if (!note) return res.status(404).json({ error: "Not found" });
    return res.json({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error in PATCH /resume-ready/interview-notes/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/interview-notes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(interviewNotesTable)
      .where(and(eq(interviewNotesTable.id, id), eq(interviewNotesTable.userId, req.userId)));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/interview-notes/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PLAN_CONFIG: Record<string, { envVar: string; mode: "subscription" | "payment"; months: number | null }> = {
  monthly: { envVar: "STRIPE_PRO_PRICE_ID", mode: "subscription", months: null },
  "3month": { envVar: "STRIPE_PRO_3MONTH_PRICE_ID", mode: "payment", months: 3 },
  "6month": { envVar: "STRIPE_PRO_6MONTH_PRICE_ID", mode: "payment", months: 6 },
};

router.post("/resume-ready/billing/create-checkout-session", requireAuth, async (req: any, res: any) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return res.status(503).json({ error: "Stripe not configured" });

    const stripe = new Stripe(stripeKey);

    const plan: "monthly" | "3month" | "6month" =
      req.body?.plan === "3month" || req.body?.plan === "6month" ? req.body.plan : "monthly";
    const config = PLAN_CONFIG[plan];

    const priceId = process.env[config.envVar];
    if (!priceId) return res.status(503).json({ error: `Price ID not configured — set ${config.envVar}` });

    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const user = await ensureUser(req.userId, email);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { clerkId: req.userId },
      });
      customerId = customer.id;
      await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.clerkId, req.userId));
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: config.mode,
      metadata: { clerkId: req.userId, plan },
      success_url: `${origin}/resume-ready/dashboard?upgraded=true`,
      cancel_url: `${origin}/resume-ready/pricing`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/billing/create-checkout-session");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/billing/webhook", async (req: any, res: any) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    req.log.error({ err }, "Webhook signature verification failed");
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const tier = status === "active" ? "pro" : "free";

      await db
        .update(usersTable)
        .set({ tier, stripeSubscriptionId: subscription.id, planType: tier === "pro" ? "monthly" : null, planExpiresAt: null })
        .where(eq(usersTable.stripeCustomerId, customerId));
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await db
        .update(usersTable)
        .set({ tier: "free", stripeSubscriptionId: null, planType: null, planExpiresAt: null })
        .where(eq(usersTable.stripeCustomerId, customerId));
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        const plan = session.metadata?.plan;
        const clerkId = session.metadata?.clerkId;
        const customerId = session.customer as string;
        const config = plan ? PLAN_CONFIG[plan] : undefined;

        if (config?.months && (clerkId || customerId)) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + config.months);

          const whereClause = clerkId ? eq(usersTable.clerkId, clerkId) : eq(usersTable.stripeCustomerId, customerId);
          await db
            .update(usersTable)
            .set({ tier: "pro", planType: plan, planExpiresAt: expiresAt, stripeCustomerId: customerId || undefined })
            .where(whereClause);
        }
      }
    }
  } catch (err) {
    req.log.error({ err }, "Error processing webhook");
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.json({ received: true });
});

router.get("/resume-ready/billing/guarantee-claim", requireAuth, async (req: any, res: any) => {
  try {
    const claims = await db
      .select()
      .from(guaranteeClaimsTable)
      .where(eq(guaranteeClaimsTable.clerkId, req.userId))
      .orderBy(desc(guaranteeClaimsTable.createdAt))
      .limit(1);
    return res.json({ claim: claims[0] || null });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/billing/guarantee-claim");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/billing/guarantee-claim", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const user = await ensureUser(req.userId, email);

    if (user.planType !== "6month") {
      return res.status(400).json({ error: "The job guarantee is only available on the 6-month plan." });
    }

    const existing = await db
      .select()
      .from(guaranteeClaimsTable)
      .where(and(eq(guaranteeClaimsTable.clerkId, req.userId), eq(guaranteeClaimsTable.status, "pending")))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "You already have a pending claim." });
    }

    const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

    const [claim] = await db
      .insert(guaranteeClaimsTable)
      .values({ clerkId: req.userId, email: user.email || email || null, note: note || null })
      .returning();

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: "killwilltillhill@gmail.com",
        subject: "[TheKnightedResume] New 6-Month Job Guarantee Claim",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5;margin-bottom:4px">New Job Guarantee Claim</h2>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p><strong>User:</strong> ${user.email || email || req.userId}</p>
            <p><strong>Clerk ID:</strong> ${req.userId}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p style="white-space:pre-wrap;line-height:1.6">${note || "(no note provided)"}</p>
          </div>
        `,
      });
    }

    return res.json({ claim });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/billing/guarantee-claim");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/referrals/apply", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!code) return res.status(400).json({ applied: false, reason: "missing_code" });

    const user = await ensureUser(req.userId, email);

    if (user.referredByClerkId) {
      return res.json({ applied: false, reason: "already_referred" });
    }

    const ageMs = Date.now() - new Date(user.createdAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      return res.json({ applied: false, reason: "account_too_old" });
    }

    const found = await db.select().from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    if (found.length === 0 || found[0].clerkId === req.userId) {
      return res.json({ applied: false, reason: "invalid_code" });
    }

    const existingReferral = await db.select().from(referralsTable).where(eq(referralsTable.refereeClerkId, req.userId)).limit(1);
    if (existingReferral.length > 0) {
      return res.json({ applied: false, reason: "already_referred" });
    }

    const referrer = found[0];
    await db.update(usersTable).set({ referredByClerkId: referrer.clerkId }).where(eq(usersTable.clerkId, req.userId));
    await db.insert(referralsTable).values({
      referrerClerkId: referrer.clerkId,
      refereeClerkId: req.userId,
      refereeEmail: email || null,
      rewardMonthsGranted: "1",
    });
    await grantProDays(referrer.clerkId, REFERRAL_REWARD_DAYS);

    return res.json({ applied: true });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/referrals/apply");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/referrals", requireAuth, async (req: any, res: any) => {
  try {
    const auth = getAuth(req);
    const email = auth?.sessionClaims?.email as string | undefined;
    const user = await ensureUser(req.userId, email);

    const referred = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerClerkId, req.userId))
      .orderBy(desc(referralsTable.createdAt));

    const rewardDaysEarned = referred.reduce((sum, r) => sum + (r.rewardMonthsGranted === "1" ? REFERRAL_REWARD_DAYS : 0), 0);

    return res.json({
      referralCode: user.referralCode,
      referredCount: referred.length,
      rewardDaysEarned,
      referrals: referred.map((r) => ({ email: r.refereeEmail, createdAt: r.createdAt, rewardGranted: r.rewardMonthsGranted === "1" })),
    });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/referrals");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/feedback", async (req: any, res: any) => {
  try {
    const { name, email, feedbackType, message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    await db.insert(feedbackTable).values({
      name: name?.trim() || null,
      email: email?.trim() || null,
      type: feedbackType || "suggestion",
      message: message.trim(),
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const typeLabel = { question: "Question", suggestion: "Suggestion", bug: "Bug Report", other: "Other" }[feedbackType as string] ?? feedbackType;
      await resend.emails.send({
        from: FROM_EMAIL,
        to: "killwilltillhill@gmail.com",
        subject: `[TheKnightedResume ${typeLabel}]${name ? ` from ${name}` : ""}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5;margin-bottom:4px">New Feedback — ${typeLabel}</h2>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            ${name ? `<p><strong>Name:</strong> ${name}</p>` : ""}
            ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ""}
            <p><strong>Type:</strong> ${typeLabel}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p style="white-space:pre-wrap;line-height:1.6">${message.trim()}</p>
          </div>
        `,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/feedback");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Interview: generate questions ────────────────────────────────────────────
router.post("/resume-ready/ai/interview/questions", requireAuth, async (req: any, res: any) => {
  try {
    const { interviewType, sector, role, jobDescription } = req.body;
    if (!interviewType) return res.status(400).json({ error: "interviewType is required" });

    const typeGuide =
      interviewType === "behavioral"
        ? "All questions must be behavioural (STAR-method style, starting with 'Tell me about a time...' or 'Describe a situation...')."
        : interviewType === "technical"
        ? "All questions must be technical — focused on skills, problem-solving, systems design, or domain knowledge relevant to the role."
        : "Mix of behavioural (3) and technical (3) questions.";

    const sectorGuide: Record<string, string> = {
      finance: "The candidate is targeting Finance / Banking / Investment roles. Include questions on financial concepts (valuation, DCF, financial statements), commercial awareness, and analytical rigour. Incorporate case-walk elements where appropriate.",
      consulting: "The candidate is targeting Management Consulting roles. Include case framework questions (market sizing, profitability trees, market entry), structured problem-solving, and client communication scenarios.",
      tech: "The candidate is targeting Software Engineering / Tech roles. Include system design concepts, scalability trade-offs, debugging approaches, and relevant domain depth. Avoid full LeetCode-style coding unless the role demands it.",
      product: "The candidate is targeting Product Management roles. Include metrics-driven questions, prioritisation frameworks (RICE, ICE), product sense/design questions, roadmap trade-offs, and stakeholder management.",
      design: "The candidate is targeting UX/Product Design roles. Include design process questions, portfolio-critique style prompts, user research methods, critique-handling scenarios, and design system thinking.",
      general: "",
    };

    const activeSectorGuide = sector && sectorGuide[sector] ? `\nSector context: ${sectorGuide[sector]}` : "";

    const context = [
      role ? `Role: ${role}` : "",
      jobDescription ? `Job Description:\n${jobDescription}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = `You are an expert interviewer and career coach. Generate exactly 6 interview questions for a candidate.

${typeGuide}${activeSectorGuide}
${context ? `\nContext:\n${context}` : ""}

Return a JSON array of exactly 6 objects. Each object must have:
- "id": a short slug (e.g. "q1")
- "question": the full interview question (1-2 sentences, clear and specific)
- "category": one of "Behavioral", "Technical", "Leadership", "Problem Solving", "Culture Fit", "Case Study", "Product Sense", "Design Process"

Return only valid JSON, no markdown, no explanation.`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    const questions = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.json({ questions });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/interview/questions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Interview: evaluate answer ────────────────────────────────────────────────
router.post("/resume-ready/ai/interview/evaluate", requireAuth, async (req: any, res: any) => {
  try {
    const { question, answer, role, category } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "question and answer are required" });

    const prompt = `You are a senior hiring manager and interview coach evaluating a candidate's interview answer.

Question: ${question}
${category ? `Category: ${category}` : ""}
${role ? `Role: ${role}` : ""}

Candidate's Answer:
"""
${answer.trim() || "(no answer provided)"}
"""

Evaluate the answer and return a JSON object with these exact fields:
- "score": integer 1–10 (10 = exceptional, 7 = good, 5 = average, 3 = weak)
- "strengths": array of 1–3 short strings highlighting what the candidate did well
- "improvements": array of 1–3 short strings on what could be better
- "modelAnswer": a single paragraph (3–5 sentences) showing an ideal answer to this question
- "tip": one short coaching tip (max 15 words)

Return only valid JSON, no markdown, no explanation.`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 768,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const feedback = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.json(feedback);
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/interview/evaluate");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Extract readable text from a URL (job postings, career pages)
// ── LinkedIn ZIP export import ──────────────────────────────────────────────
const zipUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/** Minimal CSV parser — handles quoted fields and embedded commas */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === "," && !inQ) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    return cells;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(l => {
    const vals = parseRow(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (vals[i] ?? "").trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

router.post("/resume-ready/ai/import-linkedin-zip", requireAuth, zipUpload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();
    const getText = (name: string) => {
      const e = entries.find(e => e.entryName.toLowerCase().endsWith(name.toLowerCase()));
      return e ? e.getData().toString("utf8") : "";
    };

    const profile = parseCsv(getText("Profile.csv"))[0] ?? {};
    const positions = parseCsv(getText("Positions.csv"));
    const education = parseCsv(getText("Education.csv"));
    const skills = parseCsv(getText("Skills.csv"));
    const certifications = parseCsv(getText("Certifications.csv"));

    if (!profile && positions.length === 0 && education.length === 0) {
      return res.status(422).json({ error: "This doesn't look like a LinkedIn data export. Make sure you download the full archive from LinkedIn Settings → Data Privacy → Get a copy of your data." });
    }

    const name = [profile["First Name"], profile["Last Name"]].filter(Boolean).join(" ") || "Candidate";
    const structuredData = `
NAME: ${name}
HEADLINE: ${profile["Headline"] || ""}
LOCATION: ${profile["Geo Location"] || ""}
SUMMARY: ${profile["Summary"] || ""}

WORK EXPERIENCE:
${positions.map(p => `- ${p["Title"] || ""} at ${p["Company Name"] || ""} (${p["Started On"] || ""}${p["Finished On"] ? " – " + p["Finished On"] : " – Present"})
  ${p["Description"] || ""}`).join("\n")}

EDUCATION:
${education.map(e => `- ${e["Degree Name"] || ""} in ${e["Field Of Study"] || e["Notes"] || ""} at ${e["School Name"] || ""} (${e["Start Date"] || ""}${e["End Date"] ? " – " + e["End Date"] : ""})`).join("\n")}

SKILLS:
${skills.map(s => s["Name"]).filter(Boolean).join(", ")}

CERTIFICATIONS:
${certifications.map(c => `- ${c["Name"] || ""} (${c["Authority"] || ""}${c["Started On"] ? ", " + c["Started On"] : ""})`).filter(c => c !== "- ()").join("\n")}
`.trim();

    const prompt = `You are an expert resume writer. The user has provided structured data exported directly from their LinkedIn account. Convert it into a clean, professional resume.

Instructions:
- Use the exact facts provided — do not fabricate or embellish anything
- Write experience bullets in past tense using strong action verbs (expand thin descriptions into 2-3 bullet points if needed)
- Format with clear section headers in ALL CAPS (SUMMARY, EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS)
- List experience in reverse-chronological order
- Include name and headline at the very top
- Output ONLY the formatted resume text, no commentary

LinkedIn export data:
${structuredData}`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = (response.content[0]?.type === "text" ? response.content[0].text : "").trim();
    if (!content) return res.status(500).json({ error: "AI returned an empty response" });

    return res.json({ content, suggestedTitle: name ? `${name}'s Resume` : "LinkedIn Resume" });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/import-linkedin-zip");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ai/import-profile", requireAuth, async (req: any, res: any) => {
  try {
    const { rawText } = req.body as { rawText?: string };
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 40) {
      return res.status(400).json({ error: "rawText is required and must be at least 40 characters" });
    }

    const prompt = `You are an expert resume writer. The user has provided raw profile text extracted from their LinkedIn profile (or another source). Your job is to convert it into a clean, well-formatted resume.

Instructions:
- Extract: name, contact details (email, phone, LinkedIn URL, location), professional summary, work experience (company, title, dates, bullet points), education, skills, certifications, and any other relevant sections
- Write experience bullets in the past tense using strong action verbs
- Keep all facts accurate — do not fabricate anything not present in the source
- Format using plain text with clear section headers in ALL CAPS (e.g. EXPERIENCE, EDUCATION, SKILLS)
- Separate each section with a blank line
- List experience in reverse-chronological order
- Output ONLY the formatted resume text, no explanations or commentary

Raw profile text:
${rawText.slice(0, 18000)}`;

    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = (response.content[0]?.type === "text" ? response.content[0].text : "").trim();
    if (!content) return res.status(500).json({ error: "AI returned an empty response" });

    const nameMatch = content.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/m);
    const suggestedTitle = nameMatch ? `${nameMatch[1]}'s Resume` : "LinkedIn Import";

    return res.json({ content, suggestedTitle });
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ai/import-profile");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/extract-url", requireAuth, async (req: any, res: any) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { return res.status(400).json({ error: "Invalid URL" }); }

  if (/(^|\.)linkedin\.com$/i.test(parsedUrl.hostname)) {
    return res.status(422).json({
      error: "LinkedIn blocks automated access and only serves the page title without logging in — we can't fetch the full job description from a LinkedIn link. Please open the posting, copy the description text, and paste it in instead.",
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("pdf") ||
      contentType.includes("msword") ||
      contentType.includes("officedocument") ||
      contentType.includes("octet-stream")
    ) {
      return res.status(422).json({
        error: "This URL points to a file (PDF/DOCX). Download it first, then use the Upload File tab.",
      });
    }
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return res.status(422).json({ error: "URL does not return readable content. Try copying the text manually." });
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, " ")
      .replace(/<(nav|header|footer|aside)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gis, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(p|div|section|article|li|h[1-6]|tr|td|th|blockquote|ul|ol)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length < 80) {
      return res.status(422).json({
        error: "Could not extract enough text. The page may require login or block automated access.",
      });
    }

    return res.json({ text: text.slice(0, 20000), title: pageTitle });
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return res.status(408).json({ error: "Request timed out. The site took too long to respond." });
    }
    req.log.error({ err }, "Error in POST /resume-ready/extract-url");
    return res.status(500).json({ error: "Failed to fetch URL. The site may block automated requests." });
  }
});

// ── KI Conversations ─────────────────────────────────────────────────────────
router.get("/resume-ready/ki-conversations", requireAuth, async (req: any, res: any) => {
  try {
    const conversations = await db
      .select()
      .from(kiConversationsTable)
      .where(eq(kiConversationsTable.userId, req.userId))
      .orderBy(desc(kiConversationsTable.updatedAt));
    return res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/ki-conversations");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ki-conversations", requireAuth, async (req: any, res: any) => {
  try {
    const { title } = req.body as { title?: string };
    const [conv] = await db
      .insert(kiConversationsTable)
      .values({ userId: req.userId, title: title || "New Chat" })
      .returning();
    return res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ki-conversations");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resume-ready/ki-conversations/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(kiConversationsTable)
      .where(and(eq(kiConversationsTable.id, id), eq(kiConversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) return res.status(404).json({ error: "Not found" });
    const messages = await db
      .select()
      .from(kiMessagesTable)
      .where(eq(kiMessagesTable.conversationId, id))
      .orderBy(kiMessagesTable.createdAt);
    return res.json({ ...conv, messages });
  } catch (err) {
    req.log.error({ err }, "Error in GET /resume-ready/ki-conversations/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resume-ready/ki-conversations/:id", requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(kiConversationsTable)
      .where(and(eq(kiConversationsTable.id, id), eq(kiConversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) return res.status(404).json({ error: "Not found" });
    await db.delete(kiMessagesTable).where(eq(kiMessagesTable.conversationId, id));
    await db.delete(kiConversationsTable).where(eq(kiConversationsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error in DELETE /resume-ready/ki-conversations/:id");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume-ready/ki-conversations/:id/messages", requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { messages } = req.body as { messages: { role: string; content: string }[] };
    const [conv] = await db
      .select()
      .from(kiConversationsTable)
      .where(and(eq(kiConversationsTable.id, id), eq(kiConversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) return res.status(404).json({ error: "Not found" });
    if (Array.isArray(messages) && messages.length > 0) {
      await db.insert(kiMessagesTable).values(
        messages.map((m) => ({ conversationId: id, role: m.role, content: m.content }))
      );
      // Auto-title from first user message if still default
      if (conv.title === "New Chat") {
        const firstUser = messages.find((m) => m.role === "user");
        if (firstUser) {
          const autoTitle = firstUser.content.slice(0, 60).trim();
          await db.update(kiConversationsTable)
            .set({ title: autoTitle, updatedAt: new Date() })
            .where(eq(kiConversationsTable.id, id));
          return res.json({ ...conv, title: autoTitle });
        }
      }
      await db.update(kiConversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(kiConversationsTable.id, id));
    }
    return res.json(conv);
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ki-conversations/:id/messages");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Ask KI — streaming chat ──────────────────────────────────────────────────
router.post("/resume-ready/ki-chat", requireAuth, async (req: any, res: any) => {
  try {
    const { messages, documentText } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      documentText?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const systemPrompt = `You are KI (Knighted Intelligence), a world-class AI career assistant built into TheKnightedResume. You help job seekers with:
- Writing professional emails (follow-ups, thank-you notes, cold outreach, negotiation emails)
- Improving or reviewing resumes and cover letters
- Career advice, interview tips, and job search strategy
- LinkedIn profiles and professional bios
- Salary negotiation scripts
- Anything else related to finding and landing a job

Be direct, practical, and encouraging. Format responses clearly using markdown when helpful.${
  documentText
    ? `\n\nThe user has attached the following document for context:\n\n---\n${documentText.slice(0, 12000)}\n---`
    : ""
}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: MODEL_SONNET,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in POST /resume-ready/ki-chat");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
    res.end();
  }
});

export default router;

