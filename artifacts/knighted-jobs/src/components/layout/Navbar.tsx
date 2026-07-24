import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SignInButton, UserButton, useAuth } from "@clerk/react";
import {
  Bookmark, Bell, Briefcase, User, LayoutDashboard, Menu,
  TrendingUp, BookOpen, Search, X, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const NAV_LINKS = [
  { href: "/jobs", label: "Find Jobs", icon: Search },
  { href: "/salary", label: "Salary Explorer", icon: TrendingUp },
  { href: "/blog", label: "Career Advice", icon: BookOpen },
];

const AUTH_LINKS = [
  { href: "/saved-jobs", label: "Saved Jobs", icon: Bookmark },
  { href: "/alerts", label: "Job Alerts", icon: Bell },
  { href: "/my-applications", label: "Applications", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/employer/dashboard", label: "Employer", icon: LayoutDashboard },
];

export function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-serif text-xl md:text-2xl font-bold tracking-tight text-primary">
            Knighted Jobs
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                location === href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
          {isSignedIn &&
            AUTH_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5 ${
                  location === href ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" className="border-primary/20 hover:border-primary/50 text-primary text-sm">
                  <a href="https://theknightedresume.com" target="_blank" rel="noreferrer">
                    KI Resume
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                <strong>Knight Intelligence (KI)</strong> — AI-powered resume builder. Craft, tailor, and score your resume with AI.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button asChild size="sm">
            <Link href="/post-a-job">Post a Job</Link>
          </Button>
          {isLoaded &&
            (isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Sign in
                </Button>
              </SignInButton>
            ))}
        </div>

        {/* Mobile right: Theme + Post + Auth + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm" className="text-xs h-8 px-3">
            <Link href="/post-a-job">Post a Job</Link>
          </Button>
          {isLoaded &&
            (isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-sm font-medium px-2">
                  Sign in
                </Button>
              </SignInButton>
            ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <span className="font-serif text-lg font-bold text-primary">Knighted Jobs</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Close menu">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Links */}
                <nav aria-label="Mobile navigation" className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Explore</p>
                  {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location === href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}

                  {isSignedIn && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-2">My Account</p>
                      {AUTH_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            location === href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      ))}
                    </>
                  )}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                  <Button asChild variant="outline" className="w-full border-primary/30 text-primary">
                    <a href="https://theknightedresume.com" target="_blank" rel="noreferrer">
                      KI Resume Tailoring ↗
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
