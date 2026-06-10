import { useGetBracket } from "@/lib/hooks";
import { Trophy, MapPin, Calendar } from "lucide-react";

// Slot labels for each knockout match (by matchNumber)
const SLOT_LABELS: Record<number, [string, string]> = {
  // Round of 32
  73: ["1st A", "Best 3rd"],
  74: ["1st C", "Best 3rd"],
  75: ["1st B", "Best 3rd"],
  76: ["1st D", "2nd B"],
  77: ["1st E", "2nd A"],
  78: ["1st F", "2nd C"],
  79: ["1st G", "2nd E"],
  80: ["1st H", "2nd D"],
  81: ["1st I", "2nd G"],
  82: ["1st J", "2nd F"],
  83: ["1st K", "2nd H"],
  84: ["1st L", "2nd I"],
  85: ["2nd J", "2nd K"],
  86: ["2nd L", "Best 3rd"],
  87: ["Best 3rd", "Best 3rd"],
  88: ["Best 3rd", "Best 3rd"],
  // Round of 16
  89: ["W73", "W74"], 90: ["W75", "W76"],
  91: ["W77", "W78"], 92: ["W79", "W80"],
  93: ["W81", "W82"], 94: ["W83", "W84"],
  95: ["W85", "W86"], 96: ["W87", "W88"],
  // Quarterfinals
  97: ["W89", "W90"], 98: ["W91", "W92"],
  99: ["W93", "W94"], 100: ["W95", "W96"],
  // Semifinals
  101: ["W97", "W98"], 102: ["W99", "W100"],
  // Third Place
  103: ["L Semi", "L Semi"],
  // Final
  104: ["W Semi", "W Semi"],
};

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Third Place",
  "Final",
];

const ROUND_LABELS: Record<string, string> = {
  "Round of 32": "Ronda de 32",
  "Round of 16": "Octavos de Final",
  "Quarterfinals": "Cuartos de Final",
  "Semifinals": "Semifinales",
  "Third Place": "Tercer Lugar",
  "Final": "Final",
};

const ROUND_COLS: Record<string, string> = {
  "Round of 32":   "grid-cols-2 sm:grid-cols-4",
  "Round of 16":   "grid-cols-2 sm:grid-cols-4",
  "Quarterfinals": "grid-cols-2 sm:grid-cols-4",
  "Semifinals":    "grid-cols-1 sm:grid-cols-2",
  "Third Place":   "grid-cols-1 sm:grid-cols-2",
  "Final":         "grid-cols-1",
};

type BracketMatch = {
  id: number;
  matchNumber?: number | null;
  matchDate: string;
  stadium: string;
  city: string;
  round: string;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: { name: string; code: string; flag: string } | null;
  awayTeam?: { name: string; code: string; flag: string } | null;
};

function MatchCard({ match }: { match: BracketMatch }) {
  const slots = match.matchNumber ? SLOT_LABELS[match.matchNumber] : undefined;
  const homeLabel = match.homeTeam?.code ?? slots?.[0] ?? "TBD";
  const awayLabel = match.awayTeam?.code ?? slots?.[1] ?? "TBD";
  const homeFlag = match.homeTeam?.flag ?? "🏳";
  const awayFlag = match.awayTeam?.flag ?? "🏳";
  const hasTeams = !!match.homeTeam && !!match.awayTeam;
  const played = match.status === "completed";
  const date = new Date(match.matchDate);
  const isFinal = match.round === "Final";
  const isThirdPlace = match.round === "Third Place";

  return (
    <div className={`
      rounded-xl border bg-card overflow-hidden flex flex-col
      ${isFinal ? "border-primary/60 shadow-lg shadow-primary/10" : "border-border"}
      ${isThirdPlace ? "border-amber-600/40" : ""}
      transition-all hover:border-primary/40
    `}>
      {/* Match header */}
      <div className={`
        px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider
        ${isFinal ? "bg-primary/10 text-primary" : isThirdPlace ? "bg-amber-600/10 text-amber-400" : "bg-muted/60 text-muted-foreground"}
      `}>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          {" · "}
          {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="flex items-center gap-1.5 truncate max-w-[140px]">
          <MapPin className="w-4 h-4 shrink-0" />
          {match.city}
        </span>
      </div>

      {/* Teams */}
      <div className="p-3 flex flex-col gap-2">
        {/* Home */}
        <div className={`flex items-center gap-2 ${played && match.homeScore! > match.awayScore! ? "opacity-100" : played ? "opacity-50" : ""}`}>
          <span className="text-lg w-6 text-center">{hasTeams ? homeFlag : "🏳"}</span>
          <span className={`flex-1 text-sm font-bold truncate ${!hasTeams ? "text-muted-foreground italic" : ""}`}>
            {homeLabel}
          </span>
          {played && (
            <span className={`font-black text-lg tabular-nums ${match.homeScore! > match.awayScore! ? "text-primary" : "text-muted-foreground"}`}>
              {match.homeScore}
            </span>
          )}
        </div>

        <div className="border-t border-border/50" />

        {/* Away */}
        <div className={`flex items-center gap-2 ${played && match.awayScore! > match.homeScore! ? "opacity-100" : played ? "opacity-50" : ""}`}>
          <span className="text-lg w-6 text-center">{hasTeams ? awayFlag : "🏳"}</span>
          <span className={`flex-1 text-sm font-bold truncate ${!hasTeams ? "text-muted-foreground italic" : ""}`}>
            {awayLabel}
          </span>
          {played && (
            <span className={`font-black text-lg tabular-nums ${match.awayScore! > match.homeScore! ? "text-primary" : "text-muted-foreground"}`}>
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Venue footer */}
      <div className="px-3 pb-2 text-xs text-muted-foreground/60 truncate">{match.stadium}</div>
    </div>
  );
}

export function Bracket() {
  const { data: bracket, isLoading } = useGetBracket();

  if (isLoading || !bracket) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted w-1/3 rounded" />
        <div className="h-96 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  const roundMap = new Map<string, BracketMatch[]>();
  for (const r of bracket as Array<{ round: string; matches: BracketMatch[] }>) {
    roundMap.set(r.round, r.matches);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
          <Trophy className="w-7 h-7 text-primary" />
          Fase Eliminatoria
        </h1>
        <p className="text-muted-foreground mt-1">Copa Mundial 2026 · 2 – 19 Jul</p>
      </div>

      {ROUND_ORDER.map(roundName => {
        const matches = roundMap.get(roundName);
        if (!matches?.length) return null;
        const isFinal = roundName === "Final";
        const isThirdPlace = roundName === "Third Place";

        return (
          <section key={roundName}>
            <h2 className={`
              text-base font-black uppercase tracking-widest mb-4 pb-2 border-b
              ${isFinal ? "text-primary border-primary/40" : isThirdPlace ? "text-amber-400 border-amber-600/30" : "text-foreground border-border"}
            `}>
              {isFinal && <span className="mr-2">🏆</span>}
              {isThirdPlace && <span className="mr-2">🥉</span>}
              {ROUND_LABELS[roundName] ?? roundName}
              <span className="ml-2 text-xs font-normal text-muted-foreground normal-case tracking-normal">
                {matches.length} {matches.length === 1 ? "partido" : "partidos"}
              </span>
            </h2>
            <div className={`grid gap-3 ${ROUND_COLS[roundName] ?? "grid-cols-2 sm:grid-cols-4"}`}>
              {matches.map(m => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
