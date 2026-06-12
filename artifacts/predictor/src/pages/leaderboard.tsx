import { useState } from "react";
import { useGetLeaderboard, useGetMyStats, useGetMe, useListOrganizations } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award } from "lucide-react";

export function Leaderboard() {
  const { data: user } = useGetMe();
  const { data: organizations } = useListOrganizations();
  const isAdmin = user?.role === 'admin';
  const [selectedOrgId, setSelectedOrgId] = useState<string>("1");
  const orgId = isAdmin ? (selectedOrgId !== "all" ? parseInt(selectedOrgId) : null) : (user?.organization_id ?? null);
  const { data: leaderboard, isLoading } = useGetLeaderboard(orgId);
  const { data: myStats } = useGetMyStats(orgId);
  const orgName = orgId ? organizations?.find(o => o.id === orgId)?.name : 'Todas las organizaciones';

  if (isLoading || !leaderboard) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted w-1/3 rounded"></div>
      <div className="h-96 bg-card rounded-xl border border-border"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Clasificación</h1>
          <p className="text-muted-foreground mt-1">{orgName || 'Clasificación'}</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && organizations && (
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue placeholder="Todas las org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las organizaciones</SelectItem>
                {organizations.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {myStats && (
            <div className="text-right">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Tu Posición</div>
              <div className="text-3xl font-black text-primary">#{myStats.rank}</div>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-bold">Pos</th>
                <th className="p-4 font-bold">Jugador</th>
                <th className="p-4 font-bold text-center">Exacto</th>
                <th className="p-4 font-bold text-center">Resultado</th>
                <th className="p-4 font-bold text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className={`hover:bg-muted/50 transition-colors ${myStats?.rank === entry.rank ? 'bg-primary/5' : ''}`}>
                  <td className="p-4 font-black text-muted-foreground text-center w-16">
                    {entry.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-400 mx-auto" /> : 
                     entry.rank === 2 ? <Medal className="w-5 h-5 text-slate-300 mx-auto" /> : 
                     entry.rank === 3 ? <Award className="w-5 h-5 text-[#CE1126] mx-auto" /> :
                     entry.rank}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={entry.avatarUrl || ''} />
                        <AvatarFallback>{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{entry.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono">{entry.exactPredictions}</td>
                  <td className="p-4 text-center font-mono">{entry.correctOutcomes}</td>
                  <td className="p-4 text-right font-black text-primary text-lg">{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}