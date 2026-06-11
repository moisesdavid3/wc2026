import { useGetDashboard } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, CheckCircle2, TrendingUp, ChevronRight, Radio } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-xl border border-border"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-card rounded-xl border border-border"></div>
          <div className="h-96 bg-card rounded-xl border border-border"></div>
        </div>
      </div>
    );
  }

  const { myStats, upcomingMatches, liveMatches, leaderboardPreview, tournamentProgress } = dashboard;

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Panel</h1>
        <p className="text-muted-foreground mt-1">
          {tournamentProgress.currentRound} • {tournamentProgress.finishedMatches} / {tournamentProgress.totalMatches} Partidos Jugados
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Posición</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black">{myStats.rank}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Puntos</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black text-primary">{myStats.totalPoints}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Exactos</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black">{myStats.exactPredictions}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Resultado Correcto</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black">{myStats.correctOutcomes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#CE1126] animate-pulse" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-[#CE1126]">En Vivo</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="bg-card border-[#CE1126]/50 hover:border-[#CE1126] transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      <span>{match.group || match.round}</span>
                      <span className="text-[#CE1126] animate-pulse">EN VIVO</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{match.homeTeam?.flag}</span>
                        <span className="font-bold">{match.homeTeam?.code}</span>
                      </div>
                      <div className="text-xl font-black font-mono text-primary">
                        {match.homeScore} – {match.awayScore}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{match.awayTeam?.code}</span>
                        <span className="text-lg">{match.awayTeam?.flag}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Upcoming Matches */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-tight">Próximos</h2>
            <Link href="/matches">
              <Button variant="link" className="text-primary pr-0" data-testid="button-view-all-matches">
                Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {upcomingMatches.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                No hay partidos próximos.
              </div>
            ) : (
              upcomingMatches.slice(0, 4).map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-center mb-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <span>{match.group || match.round}</span>
                        <Countdown targetDate={match.matchDate} />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{match.homeTeam?.flag}</span>
                            <span className="font-bold">{match.homeTeam?.code}</span>
                          </div>
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-mono font-bold text-muted-foreground">
                            -
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{match.awayTeam?.flag}</span>
                            <span className="font-bold">{match.awayTeam?.code}</span>
                          </div>
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-mono font-bold text-muted-foreground">
                            -
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-tight">Top 5</h2>
            <Link href="/leaderboard">
              <Button variant="link" className="text-primary pr-0" data-testid="button-view-leaderboard">
                Completa <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <div className="divide-y divide-border">
              {leaderboardPreview.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Sin pronósticos aún.</div>
              ) : (
                leaderboardPreview.map((player) => (
                  <div key={player.userId} className={`flex items-center gap-3 p-3 ${player.userId === myStats.rank ? 'bg-primary/5' : ''}`}>
                    <div className={`w-6 text-center font-black ${player.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {player.rank}
                    </div>
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={player.avatarUrl || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{player.name}</p>
                    </div>
                    <div className="font-black text-primary">{player.totalPoints}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}