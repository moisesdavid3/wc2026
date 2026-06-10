import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Team = {
  id: number; name: string; code: string; flag: string;
  confederation: string; group: string | null;
};

export type Match = {
  id: number; match_number: number | null; match_date: string;
  stadium: string; city: string; round: string; group: string | null;
  status: string; home_score: number | null; away_score: number | null;
  home_team: Team | null; away_team: Team | null;
};

export type User = {
  id: number; name: string; email: string;
  avatar_url: string | null; role: string; created_at: string;
};

export type Prediction = {
  id: number; user_id: number; match_id: number;
  home_score: number; away_score: number; points: number | null;
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

const USER_KEY = "predictor26_user_id";

export function getStoredUserId(): number | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function storeUserId(id: number) { localStorage.setItem(USER_KEY, String(id)); }
export function clearStoredUserId() { localStorage.removeItem(USER_KEY); }

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Insert into our users table
  const { data: user, error: userError } = await supabase
    .from("users").insert({ name: name.trim(), email: email.trim().toLowerCase() })
    .select().single();
  if (userError) throw userError;
  return user as User;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: user, error: userError } = await supabase
    .from("users").select("*").eq("email", email.trim().toLowerCase()).single();
  if (userError) throw userError;
  return user as User;
}

export async function signOut() {
  await supabase.auth.signOut();
  clearStoredUserId();
}

// ── Match helpers ─────────────────────────────────────────────────────────────

function mapMatch(m: any): Match {
  return {
    ...m,
    home_team: m.home_team ?? null,
    away_team: m.away_team ?? null,
  };
}

const MATCH_SELECT = `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`;

// ── Matches ───────────────────────────────────────────────────────────────────

export function useListMatches(params?: { round?: string; group?: string }) {
  return useQuery({
    queryKey: ["matches", params],
    queryFn: async () => {
      let q = supabase.from("matches").select(MATCH_SELECT).order("match_number");
      if (params?.round) q = q.eq("round", params.round);
      if (params?.group) q = q.eq("group", params.group);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapMatch);
    },
  });
}

export function useGetMatch(id: number | string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches").select(MATCH_SELECT).eq("id", id).single();
      if (error) throw error;
      return mapMatch(data);
    },
    enabled: !!id,
  });
}

export function useGetBracket() {
  return useQuery({
    queryKey: ["bracket"],
    queryFn: async () => {
      const rounds = ["Round of 32","Round of 16","Quarterfinals","Semifinals","Third Place","Final"];
      const { data, error } = await supabase
        .from("matches").select(MATCH_SELECT)
        .in("round", rounds).order("match_number");
      if (error) throw error;
      const byRound: Record<string, Match[]> = {};
      for (const r of rounds) byRound[r] = [];
      for (const m of data ?? []) {
        const round = m.round as string;
        if (byRound[round]) byRound[round].push(mapMatch(m));
      }
      return rounds.filter(r => byRound[r].length > 0).map(r => ({ round: r, matches: byRound[r] }));
    },
  });
}

// ── Groups ────────────────────────────────────────────────────────────────────

export function useGetGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const [{ data: teams }, { data: matches }] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("matches").select(MATCH_SELECT).eq("round", "Group Stage").order("match_number"),
      ]);
      const groupNames = [...new Set((teams ?? []).map((t: Team) => t.group).filter(Boolean) as string[])].sort();
      return groupNames.map(g => ({
        name: g,
        teams: (teams ?? []).filter((t: Team) => t.group === g),
        matches: ((matches ?? []) as any[]).filter((m: any) => m.group === g).map(mapMatch),
      }));
    },
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function useGetLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data: users, error } = await supabase.from("users").select("*");
      if (error) throw error;
      const { data: preds } = await supabase
        .from("predictions").select("user_id, points").not("points", "is", null);

      const scoreMap: Record<number, { total: number; exact: number; correct: number }> = {};
      for (const u of users ?? []) scoreMap[u.id] = { total: 0, exact: 0, correct: 0 };
      for (const p of preds ?? []) {
        if (!scoreMap[p.user_id]) continue;
        scoreMap[p.user_id].total += p.points ?? 0;
        if (p.points === 3) scoreMap[p.user_id].exact++;
        else if (p.points === 1) scoreMap[p.user_id].correct++;
      }

      return (users ?? [])
        .map((u: User) => ({
          userId: u.id, name: u.name, avatarUrl: u.avatar_url,
          totalPoints: scoreMap[u.id]?.total ?? 0,
          exactPredictions: scoreMap[u.id]?.exact ?? 0,
          correctOutcomes: scoreMap[u.id]?.correct ?? 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    },
  });
}

// ── Me / Stats ────────────────────────────────────────────────────────────────

export function useGetMe() {
  const userId = getStoredUserId();
  return useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
      if (error) throw error;
      return data as User;
    },
    enabled: !!userId,
  });
}

export function useGetMyStats() {
  const userId = getStoredUserId();
  return useQuery({
    queryKey: ["myStats", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data: preds } = await supabase
        .from("predictions").select("points").eq("user_id", userId).not("points", "is", null);
      const total = (preds ?? []).reduce((s: number, p: any) => s + (p.points ?? 0), 0);
      const exact = (preds ?? []).filter((p: any) => p.points === 3).length;
      const correct = (preds ?? []).filter((p: any) => p.points === 1).length;

      // rank
      const lb = await supabase.from("predictions")
        .select("user_id, points").not("points", "is", null);
      const scores: Record<number, number> = {};
      for (const p of lb.data ?? []) scores[p.user_id] = (scores[p.user_id] ?? 0) + (p.points ?? 0);
      const sorted = Object.values(scores).sort((a, b) => b - a);
      const rank = sorted.findIndex(s => s <= total) + 1;

      return { totalPoints: total, exactPredictions: exact, correctOutcomes: correct, rank: rank || 1 };
    },
    enabled: !!userId,
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useGetDashboard() {
  const userId = getStoredUserId();
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [meRes, upcomingRes, allMatchesRes, lbRes, predsRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId!).single(),
        supabase.from("matches").select(MATCH_SELECT)
          .eq("status", "upcoming").gte("match_date", now)
          .order("match_date").limit(5),
        supabase.from("matches").select("id, status, round"),
        supabase.from("predictions").select("user_id, points").not("points", "is", null),
        supabase.from("predictions").select("*").eq("user_id", userId!),
      ]);

      const me = meRes.data as User;
      const allMatches = allMatchesRes.data ?? [];
      const finished = allMatches.filter((m: any) => m.status === "completed").length;
      const rounds = [...new Set(allMatches.map((m: any) => m.round as string))];
      const currentRound = rounds.find(r => {
        const roundMatches = allMatches.filter((m: any) => m.round === r);
        return roundMatches.some((m: any) => m.status !== "completed");
      }) ?? "Group Stage";

      // leaderboard preview
      const { data: users } = await supabase.from("users").select("id, name, avatar_url");
      const scoreMap: Record<number, number> = {};
      for (const p of lbRes.data ?? []) scoreMap[p.user_id] = (scoreMap[p.user_id] ?? 0) + (p.points ?? 0);
      const leaderboardPreview = (users ?? [])
        .map((u: any) => ({ userId: u.id, name: u.name, avatarUrl: u.avatar_url, totalPoints: scoreMap[u.id] ?? 0 }))
        .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
        .slice(0, 5)
        .map((u: any, i: number) => ({ ...u, rank: i + 1 }));

      // my stats
      const myPreds = predsRes.data ?? [];
      const totalPoints = myPreds.reduce((s: number, p: any) => s + (p.points ?? 0), 0);
      const exact = myPreds.filter((p: any) => p.points === 3).length;
      const correct = myPreds.filter((p: any) => p.points === 1).length;
      const allScores = Object.values(scoreMap).sort((a, b) => b - a);
      const rank = allScores.findIndex(s => s <= totalPoints) + 1 || 1;

      return {
        user: me,
        myStats: { totalPoints, exactPredictions: exact, correctOutcomes: correct, rank },
        upcomingMatches: (upcomingRes.data ?? []).map(mapMatch),
        leaderboardPreview,
        tournamentProgress: { currentRound, finishedMatches: finished, totalMatches: allMatches.length },
      };
    },
    enabled: !!userId,
  });
}

// ── Predictions ───────────────────────────────────────────────────────────────

export function useListMyPredictions() {
  const userId = getStoredUserId();
  return useQuery({
    queryKey: ["myPredictions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("predictions").select("*").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as Prediction[];
    },
    enabled: !!userId,
  });
}

export function useUpsertPrediction() {
  const userId = getStoredUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { matchId: number; homeScore: number; awayScore: number }) => {
      const { data, error } = await supabase.from("predictions")
        .upsert({ user_id: userId!, match_id: vars.matchId, home_score: vars.homeScore, away_score: vars.awayScore },
          { onConflict: "user_id,match_id" })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["myPredictions"] });
      qc.invalidateQueries({ queryKey: ["match", vars.matchId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ── Users (admin) ─────────────────────────────────────────────────────────────

export function useListUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as User[];
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const { data, error } = await supabase.from("users")
        .update({ role }).eq("id", userId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ── Match result (admin) ──────────────────────────────────────────────────────

export function useSetMatchResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, homeScore, awayScore }: { matchId: number; homeScore: number; awayScore: number }) => {
      // Update match
      const { error: matchErr } = await supabase.from("matches")
        .update({ home_score: homeScore, away_score: awayScore, status: "completed" })
        .eq("id", matchId);
      if (matchErr) throw matchErr;

      // Score predictions for this match
      const { data: preds } = await supabase.from("predictions")
        .select("id, home_score, away_score").eq("match_id", matchId);

      const homeOutcome = homeScore > awayScore ? "H" : homeScore < awayScore ? "A" : "D";
      for (const p of preds ?? []) {
        const predOutcome = p.home_score > p.away_score ? "H" : p.home_score < p.away_score ? "A" : "D";
        let points = 0;
        if (p.home_score === homeScore && p.away_score === awayScore) points = 3;
        else if (predOutcome === homeOutcome) points = 1;
        await supabase.from("predictions").update({ points }).eq("id", p.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Alias for backwards compatibility with pages
export const useListGroups = useGetGroups;

// ── Query key helpers (for manual invalidation) ───────────────────────────────

export const getListMatchesQueryKey = (params?: any) => ["matches", params];
export const getGetMatchQueryKey = (id: number | string) => ["match", id];
export const getListMyPredictionsQueryKey = () => ["myPredictions", getStoredUserId()];
export const getListUsersQueryKey = () => ["users"];

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function requestLoginCode(email: string): Promise<void> {
  // Generate 6-digit code, store in magic_tokens, send via Supabase edge function
  // For simplicity: use magic_tokens table directly via REST
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidate previous tokens
  await supabase.from("magic_tokens")
    .update({ used: true })
    .eq("email", email).eq("used", false);

  await supabase.from("magic_tokens").insert({ email, token: code, expires_at: expiresAt });

  // In production set up an email provider via Supabase Edge Function or SMTP
  // For now: log to console (visible in browser devtools)
  console.log(`%c🔑 Login code for ${email}: ${code}`, "font-size:20px;font-weight:bold;color:green");
}

export async function verifyLoginCode(email: string, code: string): Promise<User> {
  const now = new Date().toISOString();
  const { data: token } = await supabase.from("magic_tokens")
    .select("*").eq("email", email).eq("token", code).eq("used", false)
    .gt("expires_at", now).single();

  if (!token) throw new Error("Invalid or expired code");

  await supabase.from("magic_tokens").update({ used: true }).eq("id", token.id);

  // Find or create user
  let { data: user } = await supabase.from("users").select("*").eq("email", email).single();
  if (!user) {
    const name = email.split("@")[0];
    const { data: newUser, error } = await supabase.from("users")
      .insert({ name, email }).select().single();
    if (error) throw error;
    user = newUser;
  }
  return user as User;
}
