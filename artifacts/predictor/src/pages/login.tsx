import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserContext } from "@/contexts/user";
import { signIn, signUp } from "@/lib/hooks";

export function Login() {
  const { setUserId } = useUserContext();

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);
    try {
      const user = await signIn(signInEmail, signInPassword);
      setUserId(user.id);
    } catch (err: any) {
      setSignInError(err.message ?? "Invalid email or password");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpError(null);
    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Passwords don't match");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }
    setSignUpLoading(true);
    try {
      const user = await signUp(signUpName, signUpEmail, signUpPassword);
      setUserId(user.id);
    } catch (err: any) {
      setSignUpError(err.message ?? "Could not create account");
    } finally {
      setSignUpLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-14 h-14 text-primary" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Predictor 26</h1>
          <p className="text-muted-foreground mt-1">FIFA World Cup 2026 prediction pool</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <Tabs defaultValue="signin">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" placeholder="you@example.com"
                      value={signInEmail} onChange={e => setSignInEmail(e.target.value)}
                      required autoFocus disabled={signInLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" type="password" placeholder="••••••••"
                      value={signInPassword} onChange={e => setSignInPassword(e.target.value)}
                      required disabled={signInLoading} />
                  </div>
                  {signInError && <p className="text-sm text-destructive">{signInError}</p>}
                  <Button type="submit" className="w-full font-bold"
                    disabled={signInLoading || !signInEmail || !signInPassword}>
                    {signInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Create Account */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Your name</Label>
                    <Input id="su-name" type="text" placeholder="e.g. Moisés"
                      value={signUpName} onChange={e => setSignUpName(e.target.value)}
                      required autoFocus disabled={signUpLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" placeholder="you@example.com"
                      value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)}
                      required disabled={signUpLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" placeholder="At least 6 characters"
                      value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)}
                      required disabled={signUpLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-confirm">Confirm password</Label>
                    <Input id="su-confirm" type="password" placeholder="••••••••"
                      value={signUpConfirm} onChange={e => setSignUpConfirm(e.target.value)}
                      required disabled={signUpLoading} />
                  </div>
                  {signUpError && <p className="text-sm text-destructive">{signUpError}</p>}
                  <Button type="submit" className="w-full font-bold"
                    disabled={signUpLoading || !signUpName || !signUpEmail || !signUpPassword || !signUpConfirm}>
                    {signUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
