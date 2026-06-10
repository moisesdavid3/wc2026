import { Link } from "wouter";
import { Trophy, ChevronRight, Globe, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetLeaderboard } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Home() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  
  const topPlayers = Array.isArray(leaderboard) ? leaderboard.slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-background flex flex-col">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl tracking-tight uppercase">Predictor 26</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button className="font-bold uppercase tracking-wider" data-testid="button-signup-nav">Join Now</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.apply/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
          
          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              FIFA World Cup 2026
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
              PREDICT. <span className="text-primary">DOMINATE.</span> WIN.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The ultimate high-stakes prediction pool for the 2026 World Cup. Compete with friends, climb the leaderboard, and prove your football knowledge.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-signup-hero">
                  Start Predicting
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 bg-card border-b border-border">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">104 Matches</h3>
              <p className="text-muted-foreground leading-relaxed">Predict every single game of the expanded tournament format across USA, Mexico, and Canada.</p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Live Scoring</h3>
              <p className="text-muted-foreground leading-relaxed">Watch the leaderboard update in real-time as goals go in. Exact scores earn maximum points.</p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Dynamic Deadlines</h3>
              <p className="text-muted-foreground leading-relaxed">Submit or change your predictions right up until the referee blows the kickoff whistle.</p>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="px-6 py-24 max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Current Top 5</h2>
            <p className="text-muted-foreground mt-2">The best predictors so far.</p>
          </div>
          
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading standings...</div>
            ) : topPlayers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No predictions yet. Be the first!</div>
            ) : (
              <div className="divide-y divide-border">
                {topPlayers.map((player) => (
                  <div key={player.userId} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="w-8 text-center font-black text-xl text-muted-foreground">
                      {player.rank}
                    </div>
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={player.avatarUrl || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.exactPredictions} exact, {player.correctOutcomes} correct</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xl text-primary">{player.totalPoints}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">PTS</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>Predictor 26 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}