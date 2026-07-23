import { Resend } from "resend";
import { db } from "@workspace/db";
import { sql, lte, eq, and } from "drizzle-orm";
import { knightedJobListingsTable } from "@workspace/db";
import { logger } from "./logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "TheKnightedResume <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? "https://resumeready.app";

async function getUserEmail(userId: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return (data.email_addresses?.[0]?.email_address as string) ?? null;
  } catch {
    return null;
  }
}

function deadlineEmailHtml(role: string, company: string, deadline: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
        <tr><td style="background:#1e293b;padding:28px 32px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700">TheKnightedResume</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">Application Deadline Tomorrow</p>
          <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111827">${role}</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#6b7280">at ${company}</p>
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px 20px;margin:0 0 24px">
            <p style="margin:0;font-size:14px;color:#713f12">
              &#x23F0; Your application deadline is <strong>${deadline}</strong>. Don't miss it!
            </p>
          </div>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
            Head over to TheKnightedResume to review your application, polish your resume one last time,
            or log any notes before the deadline passes.
          </p>
          <a href="${APP_URL}/pipeline"
             style="display:inline-block;background:#1e293b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
            View Application &rarr;
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#9ca3af">
            You're receiving this because you have a job application with a deadline set in TheKnightedResume.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

type ApplicationRow = {
  id: number;
  user_id: string;
  company: string;
  role: string;
  deadline: string;
};

async function checkDeadlines(): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0]!;

  let rows: ApplicationRow[];
  try {
    const result = await db.execute(sql`
      SELECT id, user_id, company, role, deadline
      FROM resume_ready_applications
      WHERE deadline = ${tomorrowStr}::date
        AND reminder_sent_at IS NULL
        AND deadline IS NOT NULL
    `);
    rows = result.rows as ApplicationRow[];
  } catch (err) {
    logger.error({ err }, "Reminder: failed to query applications");
    return;
  }

  if (rows.length === 0) return;
  logger.info({ count: rows.length, date: tomorrowStr }, "Sending deadline reminders");

  for (const app of rows) {
    try {
      const email = await getUserEmail(app.user_id);
      if (!email) {
        logger.warn({ appId: app.id }, "Reminder: no email for user, skipping");
        continue;
      }

      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `\u23F0 Deadline tomorrow: ${app.role} at ${app.company}`,
        html: deadlineEmailHtml(app.role, app.company, app.deadline),
      });

      if (error) {
        logger.warn({ appId: app.id, error }, "Reminder: Resend returned error");
        continue;
      }

      await db.execute(sql`
        UPDATE resume_ready_applications
        SET reminder_sent_at = NOW()
        WHERE id = ${app.id}
      `);

      logger.info({ appId: app.id, email }, "Reminder: sent deadline email");
    } catch (err) {
      logger.error({ err, appId: app.id }, "Reminder: unexpected error");
    }
  }
}

async function expireOldListings(): Promise<void> {
  try {
    const now = new Date();
    const result = await db
      .update(knightedJobListingsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(knightedJobListingsTable.isActive, true),
          lte(knightedJobListingsTable.expiresAt, now),
        ),
      )
      .returning({ id: knightedJobListingsTable.id });

    if (result.length > 0) {
      logger.info({ count: result.length }, "Freshness: expired old listings");
    }
  } catch (err) {
    logger.error({ err }, "Freshness: failed to expire old listings");
  }
}

export function startDeadlineReminders(): void {
  if (!process.env.RESEND_API_KEY) {
    logger.info("RESEND_API_KEY not set — deadline reminders disabled");
    return;
  }

  const INTERVAL_MS = 60 * 60 * 1000;

  checkDeadlines().catch((err) =>
    logger.error({ err }, "Reminder: initial check failed"),
  );

  setInterval(() => {
    checkDeadlines().catch((err) =>
      logger.error({ err }, "Reminder: periodic check failed"),
    );
  }, INTERVAL_MS);

  logger.info("Deadline reminder service started (checks every 1h)");
}

export function startFreshnessGuarantee(): void {
  const INTERVAL_MS = 60 * 60 * 1000;

  expireOldListings().catch((err) =>
    logger.error({ err }, "Freshness: initial expiry check failed"),
  );

  setInterval(() => {
    expireOldListings().catch((err) =>
      logger.error({ err }, "Freshness: periodic expiry check failed"),
    );
  }, INTERVAL_MS);

  logger.info("Freshness guarantee service started (checks every 1h)");
}
