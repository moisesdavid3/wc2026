import { useState } from "react";
import { Trophy, Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserContext } from "@/contexts/user";
import { setExtraHeaders } from "@workspace/api-client-react";

type Step = "email" | "code";

export function Login() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserId } = useUserContext();

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setStep("code");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Invalid code");
      const user = await res.json();
      setExtraHeaders({ "x-user-id": String(user.id) });
      setUserId(user.id);
    } catch (err: any) {
      setError(err.message ?? "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Predictor 26</CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === "email"
              ? "Enter your email to receive a login code"
              : `Check ${email} for your 6-digit code`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full font-bold" disabled={loading || !email.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send code <ArrowRight className="ml-2 w-4 h-4" /></>}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> 6-digit code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  disabled={loading}
                  className="text-center text-2xl font-black tracking-[0.5em]"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full font-bold"
                disabled={loading || code.length !== 6}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => { setStep("email"); setCode(""); setError(null); }}
              >
                ← Use a different email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
