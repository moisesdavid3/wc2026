import { useState } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import { useUserContext } from "@/contexts/user";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function Setup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { setUserId } = useUserContext();
  const createUser = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createUser.mutate(
      { data: { name: name.trim(), email: email.trim() || undefined } },
      {
        onSuccess: (user) => {
          setUserId(user.id);
        },
      }
    );
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Predictor 26</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your profile to start predicting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name *</Label>
              <Input
                id="name"
                placeholder="e.g. Moisés"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full font-bold"
              disabled={!name.trim() || createUser.isPending}
            >
              {createUser.isPending ? "Creating..." : "Join the pool"}
            </Button>
            {createUser.isError && (
              <p className="text-sm text-destructive text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
