import { useState, useCallback } from "react";
import {
  useListMatches,
  useListMyPredictions,
  useUpsertPrediction,
  getListMyPredictionsQueryKey,
} from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Check, MapPin, Clock, Lock } from "lucide-react";

// Colombia is UTC-5 year-round (no DST)
function formatCOT(utcString: string) {
  const date = new Date(utcString);
  const cot = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const day = days[cot.getUTCDay()];
  const d = cot.getUTCDate();
  const mon = months[cot.getUTCMonth()];
  const h = cot.getUTCHours();
  const m = cot.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h % 12) || 12);
  return { date: `${day} ${d} ${mon}`, time: `${h12}:${m} ${ampm} COT` };
}

export function Matches() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const { data: matches, isLoading: isLoadingMatches } = useListMatches();
  const { data: predictions, isLoading: isLoadingPredictions } = useListMyPredictions();
  const upsertPrediction = useUpsertPrediction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const predictionMap = new Map((predictions || []).map((p) => [p.matchId, p]));

  const handleScoreChange = useCallback(
    (matchId: number, side: "home" | "away", value: string) => {
      const clean = value.replace(/[^0-9]/g, "").slice(0, 2);
      setScores((prev) => ({
        ...prev,
        [matchId]: { home: prev[matchId]?.home ?? "", away: prev[matchId]?.away ?? "", [side]: clean },
      }));
    },
    []
  );

  const handleSave = useCallback(
    (matchId: number) => {
      const s = scores[matchId];
      if (!s || s.home === "" || s.away === "") return;
      setSaving((prev) => ({ ...prev, [matchId]: true }));
      upsertPrediction.mutate(
        { data: { matchId, homeScore: parseInt(s.home), awayScore: parseInt(s.away) } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMyPredictionsQueryKey() });
            setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
            toast({ title: "✓ Predicción guardada" });
          },
          onError: () => {
            toast({ title: "Error al guardar", variant: "destructive" });
          },
          onSettled: () => setSaving((prev) => ({ ...prev, [matchId]: false })),
        }
      );
    },
    [scores, upsertPrediction, queryClient, toast]
  );

  if (isLoadingMatches || isLoadingPredictions) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted w-1/3 rounded" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-xl border border-border" />
        ))}
      </div>
    );
  }

  let filtered = matches || [];
  if (filterStatus !== "all") filtered = filtered.filter((m) => m.status === filterStatus);
  if (filterGroup !== "all") filtered = filtered.filter((m) => m.group === filterGroup);

  const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight uppercase">Fixtures</h1>
        <div className="flex items-center gap-3">
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-[130px] bg-card">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="upcoming">Por jugar</SelectItem>
              <SelectItem value="live">En vivo</SelectItem>
              <SelectItem value="finished">Terminados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Match list */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground bg-card rounded-xl border border-border">
            No se encontraron partidos.
          </div>
        ) : (
          filtered.map((match) => {
            const prediction = predictionMap.get(match.id);
            const isUpcoming = match.status === "upcoming";
            const isLive = match.status === "live";
            const isFinished = match.status === "finished";
            const isLockedSoon = isUpcoming && (new Date(match.matchDate).getTime() - Date.now()) < 60 * 60 * 1000;
            const isLocked = isFinished || isLive || isLockedSoon;
            const cot = formatCOT(match.matchDate);
            const draft = scores[match.id];
            const isSaving = saving[match.id] ?? false;
            const hasDraft = draft && draft.home !== "" && draft.away !== "";

            return (
              <Card
                key={match.id}
                className="bg-card border-border"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">

                    {/* ── Info panel ── */}
                    <div className="lg:w-56 px-3 py-2 lg:p-4 border-b lg:border-b-0 lg:border-r border-border bg-muted/10 flex flex-col justify-center gap-1.5 lg:gap-2">
                      <div className="text-xs lg:text-sm font-black uppercase tracking-widest text-primary">
                        {match.group ? `Grupo ${match.group}` : match.round}
                      </div>

                      {/* Colombia time */}
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-xs lg:text-sm font-semibold text-foreground leading-tight">{cot.date}</div>
                          <div className="text-xs lg:text-sm text-primary font-mono font-bold">{cot.time}</div>
                        </div>
                      </div>

                      {/* Stadium */}
                      <div className="flex items-start gap-1.5 lg:gap-2">
                        <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs lg:text-sm text-foreground/80 leading-tight">{match.stadium}</div>
                          <div className="text-xs lg:text-sm text-muted-foreground">{match.city}</div>
                        </div>
                      </div>

                      {/* Status badge */}
                      {isLive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#CE1126] uppercase mt-1 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-[#CE1126] rounded-full" />EN VIVO
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Finalizado</span>
                      )}
                    </div>

                    {/* ── Teams & score ── */}
                    <div className="flex-1 px-3 py-2 lg:p-4 flex items-center min-w-0">
                      <div className="flex items-center justify-between w-full min-w-0 gap-1">
                        {/* Home */}
                        <div className="flex items-center gap-1.5 lg:gap-2 w-[38%] justify-end min-w-0">
                          <span className="font-bold text-xs lg:text-base truncate">{match.homeTeam?.name ?? "TBD"}</span>
                          <span className="text-lg lg:text-2xl shrink-0">{match.homeTeam?.flag ?? "🏳️"}</span>
                        </div>

                        {/* Score / VS */}
                        <div className="flex flex-col items-center justify-center px-1.5 lg:px-3 w-[24%] shrink-0">
                          {isUpcoming ? (
                            <div className="text-muted-foreground font-mono font-bold text-sm lg:text-lg">VS</div>
                          ) : (
                            <div className="text-base lg:text-2xl font-black font-mono text-foreground">
                              {match.homeScore} – {match.awayScore}
                            </div>
                          )}
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-1.5 lg:gap-2 w-[38%] justify-start min-w-0">
                          <span className="text-lg lg:text-2xl shrink-0">{match.awayTeam?.flag ?? "🏳️"}</span>
                          <span className="font-bold text-xs lg:text-base truncate">{match.awayTeam?.name ?? "TBD"}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Prediction panel ── */}
                    <div className="lg:w-56 px-3 py-2 lg:p-4 border-t lg:border-t-0 lg:border-l border-border bg-primary/5 flex flex-col items-center justify-center gap-1.5 lg:gap-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Tu predicción
                      </div>

                      {isLocked ? (
                        /* Locked */
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          {prediction ? (
                            <>
                              <div className="text-base lg:text-xl font-mono font-black text-foreground">
                                {prediction.homeScore} – {prediction.awayScore}
                              </div>
                              {prediction.points != null && (
                                <div className={`text-xs lg:text-sm font-bold ${prediction.points > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                  +{prediction.points} pts
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">—</div>
                          )}
                          {isLockedSoon && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-destructive uppercase tracking-widest mt-1">
                              <Lock className="w-3 h-3" />Cerrado
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Upcoming & open — editable inputs */
                        <div className="w-full space-y-1.5 lg:space-y-2">
                          <div className="flex items-center justify-center gap-1.5 lg:gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="99"
                              placeholder={prediction ? String(prediction.homeScore) : "0"}
                              value={draft?.home ?? ""}
                              onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                              className="w-11 lg:w-14 text-center text-base lg:text-xl font-mono font-black h-9 lg:h-11 bg-background border-border focus:border-primary p-1"
                            />
                            <span className="font-black text-muted-foreground">–</span>
                            <Input
                              type="number"
                              min="0"
                              max="99"
                              placeholder={prediction ? String(prediction.awayScore) : "0"}
                              value={draft?.away ?? ""}
                              onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                              className="w-11 lg:w-14 text-center text-base lg:text-xl font-mono font-black h-9 lg:h-11 bg-background border-border focus:border-primary p-1"
                            />
                          </div>

                          {prediction && !hasDraft && (
                            <div className="text-center text-xs text-muted-foreground">
                              Guardado: {prediction.homeScore} – {prediction.awayScore}
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="w-full h-7 lg:h-8 text-xs font-bold uppercase tracking-wider"
                            disabled={!hasDraft || isSaving}
                            onClick={(e) => { e.stopPropagation(); handleSave(match.id); }}
                          >
                            {isSaving ? (
                              "Guardando…"
                            ) : prediction && !hasDraft ? (
                              <><Check className="w-3 h-3 mr-1" />Guardado</>
                            ) : (
                              "Guardar"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
