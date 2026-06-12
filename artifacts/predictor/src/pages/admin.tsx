import { useState } from "react";
import { useGetMe, useListMatches, useSetMatchResult, useListUsers, useListOrganizations, useUpdateUserRole, getListMatchesQueryKey, getListUsersQueryKey } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";
import { Redirect } from "wouter";

export function Admin() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: matches, isLoading: isLoadingMatches } = useListMatches();
  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  const { data: organizations } = useListOrganizations();
  
  const setMatchResult = useSetMatchResult();
  const updateUserRole = useUpdateUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState<Record<number, {home: string, away: string}>>({});

  if (isLoadingUser || isLoadingMatches || isLoadingUsers) {
    return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;
  }

  // Not an admin
  if (!user || user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  const handleScoreChange = (matchId: number, team: 'home' | 'away', val: string) => {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: val
      }
    }));
  };

  const handleSaveResult = (matchId: number) => {
    const s = scores[matchId];
    if (!s || !s.home || !s.away) return;

    setMatchResult.mutate({
      matchId,
      homeScore: parseInt(s.home),
      awayScore: parseInt(s.away)
    }, {
      onSuccess: () => {
        toast({ title: "Guardado" });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      },
      onError: () => {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    });
  };

  const handleRoleChange = (userId: number, role: 'user' | 'admin') => {
    updateUserRole.mutate({
      id: userId,
      data: { role }
    }, {
      onSuccess: () => {
        toast({ title: "Rol actualizado" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-destructive" />
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Panel Admin</h1>
          <p className="text-muted-foreground mt-1">Gestiona resultados y usuarios</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Match Results */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="uppercase tracking-widest text-primary">Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {matches?.map(match => (
              <div key={match.id} className="p-4 border border-border rounded-lg bg-background space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-muted-foreground uppercase">
                  <span>{match.group || match.round}</span>
                  <span>{match.status}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="font-bold">{match.homeTeam?.code}</span>
                    <span className="text-2xl">{match.homeTeam?.flag}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      placeholder={match.homeScore != null ? match.homeScore.toString() : "-"} 
                      className="w-16 text-center font-mono font-black"
                      value={scores[match.id]?.home ?? ''}
                      onChange={e => handleScoreChange(match.id, 'home', e.target.value)}
                    />
                    <span className="font-black">-</span>
                    <Input 
                      type="number" 
                      placeholder={match.awayScore != null ? match.awayScore.toString() : "-"} 
                      className="w-16 text-center font-mono font-black"
                      value={scores[match.id]?.away ?? ''}
                      onChange={e => handleScoreChange(match.id, 'away', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-2xl">{match.awayTeam?.flag}</span>
                    <span className="font-bold">{match.awayTeam?.code}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => handleSaveResult(match.id)}
                  disabled={!scores[match.id]?.home || !scores[match.id]?.away}
                >
                  Resultado Oficial
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="uppercase tracking-widest text-primary">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {users?.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                    <div className="text-xs text-muted-foreground/60">
                      {organizations?.find(o => o.id === u.organization_id)?.name ?? '—'}
                    </div>
                  </div>
                  <Select 
                    value={u.role} 
                    onValueChange={(val) => handleRoleChange(u.id, val as 'user' | 'admin')}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}