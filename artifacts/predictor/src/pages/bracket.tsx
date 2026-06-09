import { useGetBracket } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export function Bracket() {
  const { data: bracket, isLoading } = useGetBracket();

  if (isLoading || !bracket) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted w-1/3 rounded"></div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  // Not rendering a full complex bracket visual, 
  // instead rendering a clean list of rounds for simplicity and mobile responsiveness.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Knockout Stage</h1>
        <p className="text-muted-foreground mt-1">Tournament Bracket</p>
      </div>

      <div className="space-y-12">
        {bracket.map((round) => (
          <div key={round.round} className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-widest text-primary border-b border-border pb-2">{round.round}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {round.matches.map(match => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col justify-center h-full space-y-4">
                      {/* Home */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{match.homeTeam?.flag || '❓'}</span>
                          <span className="font-bold">{match.homeTeam?.code || 'TBD'}</span>
                        </div>
                        <div className="font-black font-mono">
                          {match.status === 'upcoming' ? '-' : match.homeScore}
                        </div>
                      </div>
                      
                      {/* Away */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{match.awayTeam?.flag || '❓'}</span>
                          <span className="font-bold">{match.awayTeam?.code || 'TBD'}</span>
                        </div>
                        <div className="font-black font-mono">
                          {match.status === 'upcoming' ? '-' : match.awayScore}
                        </div>
                      </div>
                      
                      <div className="text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider pt-2 border-t border-border">
                        {new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}