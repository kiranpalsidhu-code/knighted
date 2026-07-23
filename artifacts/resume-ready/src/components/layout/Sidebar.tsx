import React from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  MessageSquare,
  LogOut,
  ChevronRight,
  Home,
  Mail,
  Briefcase,
  Mic,
  Gift,
  Users,
  Sparkles,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KnightIcon } from "@/components/KnightIcon";

const navItems = [
  { icon: Home,            label: "Home",           href: "/today" },
  { icon: Sparkles,        label: "Ask KI",          href: "/ask-ki" },
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: Upload,          label: "KI Tailor",       href: "/ai-tailor" },
  { icon: FileText,        label: "Resumes",         href: "/resumes" },
  { icon: Mail,            label: "Cover Letters",   href: "/cover-letters" },
  { icon: Briefcase,       label: "Job Search",      href: "/jobs" },
  { icon: KanbanSquare,    label: "Track Jobs",      href: "/pipeline" },
  { icon: Users,           label: "Networking",      href: "/contacts" },
  { icon: Mic,             label: "Interview Prep",  href: "/interview" },
  { icon: Settings,        label: "Settings",        href: "/settings" },
  { icon: Gift,            label: "Invite Friends",  href: "/referrals" },
  { icon: MessageSquare,   label: "Analyze Resume",  href: "/feedback" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-card h-screen sticky top-0">
      <Link href="/today" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <KnightIcon className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">Knighted Resume</span>
      </Link>

      <nav aria-label="Main navigation" className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? location === "/"
            : location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid={`link-sidebar-${item.label.toLowerCase()}`}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.imageUrl} alt={user?.firstName || "User"} />
            <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.firstName || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          data-testid="button-sign-out"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link href="/accessibility" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Accessibility</Link>
          <Link href="/trust" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Trust</Link>
          <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </div>
      </div>
    </aside>
  );
}
