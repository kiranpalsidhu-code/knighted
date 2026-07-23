import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { KnightIcon } from "@/components/KnightIcon";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return location === href || location.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <KnightIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Knighted Resume</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted/60 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-1 shadow-md">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`py-3 px-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/60 ${
                isActive(link.href) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
            {isSignedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setOpen(false)} className="py-3 px-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up" onClick={() => setOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
