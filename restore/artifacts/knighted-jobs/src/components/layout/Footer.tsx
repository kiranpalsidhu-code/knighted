import { Link } from "wouter";
import { CATEGORY_SLUGS, CITY_SLUGS } from "@/data/landing-pages";

const POPULAR_COMBOS = [
  { cat: "finance",     city: "london",     label: "Finance Jobs in London"       },
  { cat: "finance",     city: "new-york",   label: "Finance Jobs in New York"     },
  { cat: "consulting",  city: "dubai",      label: "Consulting Jobs in Dubai"     },
  { cat: "legal",       city: "london",     label: "Legal Jobs in London"         },
  { cat: "engineering", city: "zurich",     label: "Engineering Jobs in Zurich"   },
  { cat: "data-ai",     city: "singapore",  label: "Data & AI Jobs in Singapore"  },
  { cat: "finance",     city: "hong-kong",  label: "Finance Jobs in Hong Kong"    },
  { cat: "consulting",  city: "frankfurt",  label: "Consulting Jobs in Frankfurt" },
  { cat: "energy",      city: "dubai",      label: "Energy Jobs in Dubai"         },
  { cat: "product",     city: "amsterdam",  label: "Product Jobs in Amsterdam"    },
  { cat: "legal",       city: "singapore",  label: "Legal Jobs in Singapore"      },
  { cat: "engineering", city: "london",     label: "Engineering Jobs in London"   },
];

export function Footer() {
  const catEntries  = Object.entries(CATEGORY_SLUGS);
  const cityEntries = Object.entries(CITY_SLUGS);

  return (
    <footer className="border-t border-border/50 bg-card/40 mt-auto">
      <div className="container max-w-6xl py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Browse by Category */}
          <div>
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Browse by Category
            </h2>
            <ul className="space-y-2">
              {catEntries.map(([slug, name]) => (
                <li key={slug}>
                  <Link href={`/jobs/${slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {name} Jobs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Browse by City */}
          <div>
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Browse by City
            </h2>
            <ul className="space-y-2">
              {cityEntries.map(([slug, name]) => (
                <li key={slug}>
                  <Link href={`/jobs/${slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Jobs in {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Searches */}
          <div>
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              Popular Searches
            </h2>
            <ul className="space-y-2">
              {POPULAR_COMBOS.map(c => (
                <li key={`${c.cat}-${c.city}`}>
                  <Link href={`/jobs/${c.cat}/${c.city}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
              KnightedJobs
            </h2>
            <ul className="space-y-2">
              {[
                { href: "/jobs",        label: "Find Jobs"          },
                { href: "/salary",      label: "Salary Explorer"    },
                { href: "/blog",        label: "Career Advice"      },
                { href: "/post-a-job",  label: "Post a Job"         },
                { href: "/employer/dashboard", label: "Employer Dashboard" },
                { href: "/contact",            label: "Contact Us"          },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="text-xs font-semibold text-foreground mb-3">For Job Seekers</p>
              <ul className="space-y-2">
                {[
                  { href: "/saved-jobs",       label: "Saved Jobs"        },
                  { href: "/my-applications",  label: "My Applications"   },
                  { href: "/alerts",           label: "Job Alerts"        },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-sm">KnightedJobs</span>
            <span className="text-muted-foreground text-xs">— Curated listings. Real salaries. No noise.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/accessibility" className="text-xs text-muted-foreground hover:text-primary transition-colors">Accessibility</Link>
            <Link href="/trust" className="text-xs text-muted-foreground hover:text-primary transition-colors">Trust</Link>
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-primary transition-colors">Employer Pricing</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</Link>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} KnightedJobs. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
