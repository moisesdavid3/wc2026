import { useListGroups } from "@/lib/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function Groups() {
  const { data: groups, isLoading } = useListGroups();

  if (isLoading || !groups) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted w-1/3 rounded"></div>
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-card rounded-xl border border-border"></div>
        ))}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Fase de Grupos</h1>
        <p className="text-muted-foreground mt-1">Clasificación</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Card key={group.group} className="bg-card border-border overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border pb-3 pt-4 px-4">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground">Group {group.group}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-bold w-8">#</th>
                      <th className="px-4 py-3 font-bold">Team</th>
                      <th className="px-3 py-3 font-bold text-center" title="Jugados">PJ</th>
                      <th className="px-3 py-3 font-bold text-center" title="Ganados">G</th>
                      <th className="px-3 py-3 font-bold text-center" title="Empatados">E</th>
                      <th className="px-3 py-3 font-bold text-center" title="Perdidos">P</th>
                      <th className="px-3 py-3 font-bold text-center" title="Dif. Goles">DG</th>
                      <th className="px-4 py-3 font-black text-primary text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.standings.map((standing, index) => (
                      <tr key={standing.teamId} className={`hover:bg-muted/30 transition-colors ${index < 2 ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3 text-muted-foreground font-bold">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{standing.team.flag}</span>
                            <span className="font-bold">{standing.team.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono">{standing.played}</td>
                        <td className="px-3 py-3 text-center font-mono">{standing.won}</td>
                        <td className="px-3 py-3 text-center font-mono">{standing.drawn}</td>
                        <td className="px-3 py-3 text-center font-mono">{standing.lost}</td>
                        <td className="px-3 py-3 text-center font-mono">{standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}</td>
                        <td className="px-4 py-3 text-center font-black text-primary">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}