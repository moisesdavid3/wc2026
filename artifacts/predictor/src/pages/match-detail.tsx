import { useState, useEffect } from "react";
import { useGetMatch, useUpsertPrediction, useGetMe, getGetMatchQueryKey, getListMyPredictionsQueryKey } from "@/lib/hooks";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const matchId = parseInt(id || '0');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: match, isLoading } = useGetMatch(matchId, {
    query: {
      enabled: !!matchId,
      queryKey: getGetMatchQueryKey(matchId)
    }
  });

  const { data: user } = useGetMe();
  const upsertPrediction = useUpsertPrediction();

  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  useEffect(() => {
    if (match?.myPrediction) {
      setHomeScore(match.myPrediction.homeScore.toString());
      setAwayScore(match.myPrediction.awayScore.toString());
    }
  }, [match?.myPrediction]);

  if (isLoading || !match) {
    return <div className="animate-pulse h-64 bg-card rounded-xl border border-border"></div>;
  }

  const isLocked = user?.id !== 1 && match.status !== 'upcoming';

  const handleSubmit = () => {
    if (isLocked) return;
    
    upsertPrediction.mutate({
      data: {
        matchId,
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Pronóstico guardado",
          description: "Tu pronóstico fue registrado.",
        });
        queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
        queryClient.invalidateQueries({ queryKey: getListMyPredictionsQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: "No se pudo guardar.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-lg font-black tracking-widest text-primary uppercase">{match.group || match.round}</h1>
        <p className="text-base font-semibold text-foreground">{new Date(match.matchDate).toLocaleString()}</p>
        <p className="text-base text-muted-foreground">{match.stadium}, {match.city}</p>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Teams */}
            <div className="flex-1 p-8 flex items-center justify-between">
              <div className="flex flex-col items-center gap-4 w-1/3">
                <span className="text-6xl">{match.homeTeam?.flag}</span>
                <span className="font-bold text-xl text-center">{match.homeTeam?.name}</span>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4 w-1/3">
                {match.status === 'upcoming' ? (
                  <div className="text-muted-foreground font-mono font-bold text-2xl">VS</div>
                ) : (
                  <div className="text-4xl font-black font-mono">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
                {match.status === 'live' && <div className="text-primary font-bold mt-2 animate-pulse">EN VIVO</div>}
                {match.status === 'finished' && <div className="text-muted-foreground font-bold mt-2">FINAL</div>}
              </div>

              <div className="flex flex-col items-center gap-4 w-1/3">
                <span className="text-6xl">{match.awayTeam?.flag}</span>
                <span className="font-bold text-xl text-center">{match.awayTeam?.name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Prediction Form */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-tight text-center">Tu Pronóstico</h2>
            
            <div className="flex items-center justify-center gap-6">
              <div className="space-y-2 text-center">
                <label className="text-sm font-bold text-muted-foreground uppercase">{match.homeTeam?.code}</label>
                <Input 
                  type="number" 
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  disabled={isLocked}
                  className="w-20 text-center text-3xl h-16 font-mono font-black bg-background border-border"
                  data-testid="input-home-score"
                />
              </div>
              
              <div className="text-2xl font-black text-muted-foreground">-</div>
              
              <div className="space-y-2 text-center">
                <label className="text-sm font-bold text-muted-foreground uppercase">{match.awayTeam?.code}</label>
                <Input 
                  type="number" 
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  disabled={isLocked}
                  className="w-20 text-center text-3xl h-16 font-mono font-black bg-background border-border"
                  data-testid="input-away-score"
                />
              </div>
            </div>

            <Button 
              className="w-full font-bold uppercase tracking-widest h-12"
              onClick={handleSubmit}
              disabled={isLocked || upsertPrediction.isPending}
              data-testid="button-submit-prediction"
            >
              {isLocked ? "Partido Bloqueado" : (upsertPrediction.isPending ? "Guardando..." : "Guardar Pronóstico")}
            </Button>
            
            {match.myPrediction && match.myPrediction.points !== null && match.myPrediction.points !== undefined && (
              <div className="text-center pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">Puntos Obtenidos</div>
                <div className="text-3xl font-black text-primary">+{match.myPrediction.points}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-tight text-center">Comunidad</h2>
            <div className="text-center text-sm text-muted-foreground mb-6">
              Basado en {match.predictionStats.totalPredictions} pronósticos
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{match.homeTeam?.name} Gana</span>
                  <span>{Math.round(match.predictionStats.homeWinPct)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${match.predictionStats.homeWinPct}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Empate</span>
                  <span>{Math.round(match.predictionStats.drawPct)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground" style={{ width: `${match.predictionStats.drawPct}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{match.awayTeam?.name} Gana</span>
                  <span>{Math.round(match.predictionStats.awayWinPct)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${match.predictionStats.awayWinPct}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}