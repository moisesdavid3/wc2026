import { useRef, useState } from "react";
import { useGetMe, useGetMyStats, useListMyPredictions, useListMatches, getStoredUserId } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, CalendarDays, CheckCircle2, Target, Camera, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export function Profile() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: stats, isLoading: isLoadingStats } = useGetMyStats();
  const { data: predictions, isLoading: isLoadingPreds } = useListMyPredictions();
  const { data: matches, isLoading: isLoadingMatches } = useListMatches();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["me", getStoredUserId()] });
    } catch (err: any) {
      console.error("Error al subir avatar:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoadingUser || isLoadingStats || isLoadingPreds || isLoadingMatches || !user || !stats) {
    return <div className="animate-pulse space-y-8">
      <div className="h-32 bg-card rounded-xl"></div>
      <div className="h-64 bg-card rounded-xl"></div>
    </div>;
  }

  const matchMap = new Map((matches || []).map(m => [m.id, m]));

  const completedPredictions = (predictions || []).filter(p => p.points !== null && p.points !== undefined);
  completedPredictions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-background border-b border-border"></div>
        <CardContent className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-card rounded-xl">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary font-black">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-100"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 text-center sm:text-left mb-2">
              <h1 className="text-3xl font-black">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="bg-primary/10 border border-primary px-6 py-3 rounded-xl text-center mb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Posición</div>
              <div className="text-3xl font-black text-primary">#{stats.rank}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-primary mb-4" />
            <div className="text-3xl font-black">{stats.totalPoints}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Puntos Totales</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Target className="w-8 h-8 text-primary mb-4" />
            <div className="text-3xl font-black">{stats.exactPredictions}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Exactos</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
            <div className="text-3xl font-black">{stats.correctOutcomes}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Correctos</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CalendarDays className="w-8 h-8 text-primary mb-4" />
            <div className="text-3xl font-black">{stats.totalPredictions}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pronosticados</div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-primary">Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {completedPredictions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Sin resultados aún.
            </div>
          ) : (
            <div className="space-y-4">
              {completedPredictions.slice(0, 10).map(pred => {
                const match = matchMap.get(pred.matchId);
                if (!match) return null;
                
                return (
                  <Link key={pred.id} href={`/matches/${match.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className="font-bold text-sm sm:text-base">{match.homeTeam?.code}</span>
                          <span className="text-xl sm:text-2xl">{match.homeTeam?.flag}</span>
                        </div>
                        <div className="w-16 text-center font-black font-mono text-lg">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div className="flex-1 flex items-center justify-start gap-2">
                          <span className="text-xl sm:text-2xl">{match.awayTeam?.flag}</span>
                          <span className="font-bold text-sm sm:text-base">{match.awayTeam?.code}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 sm:border-l border-border sm:pl-6">
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Pronóstico</div>
                          <div className="font-mono font-bold text-sm">{pred.homeScore} - {pred.awayScore}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Pts</div>
                          <div className={`font-black text-lg ${pred.points && pred.points > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            +{pred.points}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}