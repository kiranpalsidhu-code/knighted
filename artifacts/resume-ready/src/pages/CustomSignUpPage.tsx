import { useState, useEffect, useRef, useCallback } from "react";
import { useSignIn, useClerk } from "@clerk/react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function formatCountdown(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function Logo() {
  return (
    <div className="flex justify-center mb-6">
      <img
        src={`${window.location.origin}${BASE}/logo.svg`}
        alt="Knighted Resume"
        className="h-8"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

export default function CustomSignUpPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    setError("");

    // Switch to OTP screen immediately so it feels instant
    setStep("otp");
    setDigits(["", "", "", "", "", ""]);
    setCountdown(300);
    setResendCooldown(30);
    setLoading(true);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);

    try {
      const res = await fetch(`${BASE}/api/resume-ready/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = useCallback(async (code: string) => {
    if (!signIn) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/resume-ready/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");

      // Account created — sign in directly with email + password
      const result = await signIn.create({ identifier: email, password }) as any;
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
      } else {
        throw new Error("Sign-in could not be completed. Please sign in manually.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [signIn, setActive, email, password, navigate]);

  const handleDigitChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (next.every(Boolean)) {
      verifyOtp(next.join(""));
    }
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      verifyOtp(pasted);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl">
        {step === "form" ? (
          <form onSubmit={sendOtp}>
            <div className="px-8 py-6">
              <Logo />
              <h1 className="text-2xl font-bold text-foreground text-center">Create your account</h1>
              <p className="text-sm text-muted-foreground text-center mt-1 mb-6">Get started today</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending code…" : "Continue"}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-sm font-medium text-primary underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <div>
            <div className="px-8 py-6">
              <Logo />
              <h1 className="text-2xl font-bold text-foreground text-center">Verify your email</h1>
              <p className="text-sm text-muted-foreground text-center mt-1 mb-2">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-center text-foreground mb-6">{email}</p>

              <div className="flex justify-center gap-2 mb-4" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-12 text-center text-lg font-semibold border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  {countdown > 0
                    ? `Code expires in ${formatCountdown(countdown)}`
                    : <span className="text-red-500">Code expired</span>
                  }
                </span>
                <button
                  type="button"
                  onClick={() => sendOtp()}
                  disabled={resendCooldown > 0 || loading}
                  className="text-primary underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {loading && (
                <p className="text-sm text-center text-muted-foreground">Verifying…</p>
              )}
            </div>

            <div className="bg-muted/50 p-4 border-t border-border text-center">
              <button
                type="button"
                onClick={() => { setStep("form"); setError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Use a different email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
