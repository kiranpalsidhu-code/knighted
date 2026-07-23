import { db } from "@workspace/db";
import { knightedJobListingsTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";
import { logger } from "./logger";
import seedData from "./knightedJobsSeedData.json";

type SeedJob = {
  title: string;
  company: string;
  companyWebsite: string | null;
  location: string;
  isRemote: boolean;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  category: string;
  description: string;
  applyUrl: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  isAgency: boolean;
};

export async function seedKnightedJobsIfEmpty(): Promise<void> {
  try {
    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(knightedJobListingsTable);

    if (existing > 0) {
      logger.info({ existing }, "knighted_job_listings already seeded, skipping");
      return;
    }

    logger.info("knighted_job_listings is empty, seeding…");

    const jobs = seedData as SeedJob[];
    const BATCH = 50;

    for (let i = 0; i < jobs.length; i += BATCH) {
      const batch = jobs.slice(i, i + BATCH);
      const n = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
      await db.insert(knightedJobListingsTable).values(
        batch.map((j) => ({
          title: j.title,
          company: j.company,
          companyWebsite: n(j.companyWebsite),
          location: j.location,
          isRemote: j.isRemote,
          employmentType: j.employmentType as "full_time" | "part_time" | "contract" | "internship",
          salaryMin: j.salaryMin != null ? String(j.salaryMin) : undefined,
          salaryMax: j.salaryMax != null ? String(j.salaryMax) : undefined,
          salaryCurrency: j.salaryCurrency,
          category: j.category,
          description: j.description,
          applyUrl: n(j.applyUrl),
          contactEmail: j.contactEmail ?? "jobs@knightedjobs.com",
          logoUrl: n(j.logoUrl),
          isAgency: j.isAgency,
          isActive: true,
        })),
      );
    }

    logger.info({ count: jobs.length }, "knighted_job_listings seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed knighted_job_listings");
  }
}
