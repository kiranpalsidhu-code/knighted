import { useState, useEffect } from "react";
import { X } from "lucide-react";

const CONSENT_KEY = "kj-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-background border-t border-border shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies to keep you signed in and remember your preferences. See our{" "}
          <a href="/knighted-jobs/privacy" className="underline text-foreground hover:text-primary transition-colors">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="h-9 px-4 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={accept}
            className="h-9 px-4 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Accept all
          </button>
          <button
            onClick={decline}
            aria-label="Dismiss"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
