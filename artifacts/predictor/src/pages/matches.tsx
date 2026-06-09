import { useState } from "react";
import { useListMatches, useListMyPredictions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Countdown } from "@/components/countdown";

export function Matches() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const { data: matches, isLoading: isLoadingMatches } = useListMatches();
  const { data: predictions, isLoading: isLoadingPredictions } = useListMyPredictions();

  if (isLoadingMatches || isLoadingPredictions) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted w-1/3 rounded"></div>
      <div className="h-20 bg-card rounded-xl border border-border"></div>
      <div className="h-20 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  let filteredMatches = matches || [];
  if (filterStatus !== "all") {
    filteredMatches = filteredMatches.filter(m => m.status === filterStatus);
  }

  const predictionMap = new Map((predictions || []).map(p => [p.matchId, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight uppercase">Fixtures</h1>
        
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-card" data-testid="select-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card rounded-xl border border-border">
            No matches found.
          </div>
        ) : (
          filteredMatches.map(match => {
            const prediction = predictionMap.get(match.id);
            
            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-center">
                      {/* Left: Info */}
                      <div className="p-4 sm:w-48 border-b sm:border-b-0 sm:border-r border-border flex flex-col justify-center bg-muted/20">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          {match.group || match.round}
                        </div>
                        {match.status === 'upcoming' ? (
                          <Countdown targetDate={match.matchDate} />
                        ) : match.status === 'live' ? (
                          <div className="text-primary font-bold animate-pulse">LIVE</div>
                        ) : (
                          <div className="text-muted-foreground font-bold">FT</div>
                        )}
                      </div>

                      {/* Middle: Teams */}
                      <div className="flex-1 p-4 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 w-1/3 justify-end">
                          <span className="font-bold sm:text-lg">{match.homeTeam?.code || match.homeTeam?.name}</span>
                          <span className="text-2xl">{match.homeTeam?.flag}</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center px-4 w-1/3">
                          {match.status === 'upcoming' ? (
                            <div className="text-muted-foreground font-mono font-bold">- : -</div>
                          ) : (
                            <div className="text-2xl font-black font-mono">
                              {match.homeScore} : {match.awayScore}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 w-1/3 justify-start">
                          <span className="text-2xl">{match.awayTeam?.flag}</span>
                          <span className="font-bold sm:text-lg">{match.awayTeam?.code || match.awayTeam?.name}</span>
                        </div>
                      </div>

                      {/* Right: Prediction */}
                      <div className="p-4 sm:w-48 border-t sm:border-t-0 sm:border-l border-border bg-primary/5 flex flex-col items-center justify-center h-full w-full sm:h-auto">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Your Prediction
                        </div>
                        {prediction ? (
                          <div className="flex flex-col items-center">
                            <div className="text-lg font-mono font-bold text-foreground">
                              {prediction.homeScore} - {prediction.awayScore}
                            </div>
                            {prediction.points !== undefined && prediction.points !== null && (
                              <div className="text-sm font-bold text-primary">
                                +{prediction.points} PTS
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">None</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}