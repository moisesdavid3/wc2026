import { useGetLeaderboard, useGetMyStats } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: myStats } = useGetMyStats();

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
          <h1 className="text-3xl font-black tracking-tight uppercase">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Global rankings</p>
        </div>
        {myStats && (
          <div className="text-right">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Your Rank</div>
            <div className="text-3xl font-black text-primary">#{myStats.rank}</div>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 md:gap-8 pt-12 pb-8">
          {/* Rank 2 */}
          <div className="flex flex-col items-center order-1 pb-4">
            <Avatar className="w-16 h-16 border-4 border-slate-300">
              <AvatarImage src={leaderboard[1].avatarUrl || ''} />
              <AvatarFallback>{leaderboard[1].name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="mt-4 font-bold text-center">{leaderboard[1].name}</div>
            <div className="text-primary font-black">{leaderboard[1].totalPoints} pts</div>
            <div className="w-20 h-24 bg-slate-300 rounded-t-lg mt-4 flex justify-center pt-2">
              <span className="font-black text-slate-500 text-2xl">2</span>
            </div>
          </div>
          
          {/* Rank 1 */}
          <div className="flex flex-col items-center order-2">
            <Trophy className="w-10 h-10 text-yellow-400 mb-2" />
            <Avatar className="w-24 h-24 border-4 border-yellow-400">
              <AvatarImage src={leaderboard[0].avatarUrl || ''} />
              <AvatarFallback>{leaderboard[0].name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="mt-4 font-bold text-xl text-center">{leaderboard[0].name}</div>
            <div className="text-primary font-black text-xl">{leaderboard[0].totalPoints} pts</div>
            <div className="w-24 h-32 bg-yellow-400 rounded-t-lg mt-4 flex justify-center pt-2">
              <span className="font-black text-yellow-600 text-3xl">1</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="flex flex-col items-center order-3 pb-8">
            <Avatar className="w-14 h-14 border-4 border-amber-600">
              <AvatarImage src={leaderboard[2].avatarUrl || ''} />
              <AvatarFallback>{leaderboard[2].name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="mt-4 font-bold text-center text-sm">{leaderboard[2].name}</div>
            <div className="text-primary font-black text-sm">{leaderboard[2].totalPoints} pts</div>
            <div className="w-16 h-16 bg-amber-600 rounded-t-lg mt-4 flex justify-center pt-2">
              <span className="font-black text-amber-800 text-xl">3</span>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-bold">Rank</th>
                <th className="p-4 font-bold">Player</th>
                <th className="p-4 font-bold text-center">Exact</th>
                <th className="p-4 font-bold text-center">Outcome</th>
                <th className="p-4 font-bold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className={`hover:bg-muted/50 transition-colors ${myStats?.rank === entry.rank ? 'bg-primary/5' : ''}`}>
                  <td className="p-4 font-black text-muted-foreground text-center w-16">
                    {entry.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-400 mx-auto" /> : 
                     entry.rank === 2 ? <Medal className="w-5 h-5 text-slate-300 mx-auto" /> : 
                     entry.rank === 3 ? <Award className="w-5 h-5 text-amber-600 mx-auto" /> : 
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