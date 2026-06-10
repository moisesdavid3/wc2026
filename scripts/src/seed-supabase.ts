const SUPABASE_URL = "https://qdoblyedcycmtxjfwbtp.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkb2JseWVkY3ljbXR4amZ3YnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzc4OTUsImV4cCI6MjA5NjYxMzg5NX0.OXLwyF7mQgLgmoWsXKyQ3H0LyDHRiZlqbyocEhxP_-M";

const headers = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

async function rpc(table: string, method: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table} ${method}: ${text}`);
  return text ? JSON.parse(text) : [];
}

// ── Teams ─────────────────────────────────────────────────────────────────────

const teams = [
  { name: "Mexico", code: "MEX", flag: "🇲🇽", confederation: "CONCACAF", group: "A" },
  { name: "South Africa", code: "RSA", flag: "🇿🇦", confederation: "CAF", group: "A" },
  { name: "South Korea", code: "KOR", flag: "🇰🇷", confederation: "AFC", group: "A" },
  { name: "Czechia", code: "CZE", flag: "🇨🇿", confederation: "UEFA", group: "A" },
  { name: "Canada", code: "CAN", flag: "🇨🇦", confederation: "CONCACAF", group: "B" },
  { name: "Bosnia and Herzegovina", code: "BIH", flag: "🇧🇦", confederation: "UEFA", group: "B" },
  { name: "Qatar", code: "QAT", flag: "🇶🇦", confederation: "AFC", group: "B" },
  { name: "Switzerland", code: "SUI", flag: "🇨🇭", confederation: "UEFA", group: "B" },
  { name: "Brazil", code: "BRA", flag: "🇧🇷", confederation: "CONMEBOL", group: "C" },
  { name: "Morocco", code: "MAR", flag: "🇲🇦", confederation: "CAF", group: "C" },
  { name: "Haiti", code: "HAI", flag: "🇭🇹", confederation: "CONCACAF", group: "C" },
  { name: "Scotland", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA", group: "C" },
  { name: "United States", code: "USA", flag: "🇺🇸", confederation: "CONCACAF", group: "D" },
  { name: "Paraguay", code: "PAR", flag: "🇵🇾", confederation: "CONMEBOL", group: "D" },
  { name: "Australia", code: "AUS", flag: "🇦🇺", confederation: "AFC", group: "D" },
  { name: "Türkiye", code: "TUR", flag: "🇹🇷", confederation: "UEFA", group: "D" },
  { name: "Germany", code: "GER", flag: "🇩🇪", confederation: "UEFA", group: "E" },
  { name: "Curaçao", code: "CUW", flag: "🇨🇼", confederation: "CONCACAF", group: "E" },
  { name: "Ivory Coast", code: "CIV", flag: "🇨🇮", confederation: "CAF", group: "E" },
  { name: "Ecuador", code: "ECU", flag: "🇪🇨", confederation: "CONMEBOL", group: "E" },
  { name: "Netherlands", code: "NED", flag: "🇳🇱", confederation: "UEFA", group: "F" },
  { name: "Japan", code: "JPN", flag: "🇯🇵", confederation: "AFC", group: "F" },
  { name: "Sweden", code: "SWE", flag: "🇸🇪", confederation: "UEFA", group: "F" },
  { name: "Tunisia", code: "TUN", flag: "🇹🇳", confederation: "CAF", group: "F" },
  { name: "Belgium", code: "BEL", flag: "🇧🇪", confederation: "UEFA", group: "G" },
  { name: "Egypt", code: "EGY", flag: "🇪🇬", confederation: "CAF", group: "G" },
  { name: "Iran", code: "IRN", flag: "🇮🇷", confederation: "AFC", group: "G" },
  { name: "New Zealand", code: "NZL", flag: "🇳🇿", confederation: "OFC", group: "G" },
  { name: "Spain", code: "ESP", flag: "🇪🇸", confederation: "UEFA", group: "H" },
  { name: "Cape Verde", code: "CPV", flag: "🇨🇻", confederation: "CAF", group: "H" },
  { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦", confederation: "AFC", group: "H" },
  { name: "Uruguay", code: "URU", flag: "🇺🇾", confederation: "CONMEBOL", group: "H" },
  { name: "France", code: "FRA", flag: "🇫🇷", confederation: "UEFA", group: "I" },
  { name: "Senegal", code: "SEN", flag: "🇸🇳", confederation: "CAF", group: "I" },
  { name: "Iraq", code: "IRQ", flag: "🇮🇶", confederation: "AFC", group: "I" },
  { name: "Norway", code: "NOR", flag: "🇳🇴", confederation: "UEFA", group: "I" },
  { name: "Argentina", code: "ARG", flag: "🇦🇷", confederation: "CONMEBOL", group: "J" },
  { name: "Algeria", code: "ALG", flag: "🇩🇿", confederation: "CAF", group: "J" },
  { name: "Austria", code: "AUT", flag: "🇦🇹", confederation: "UEFA", group: "J" },
  { name: "Jordan", code: "JOR", flag: "🇯🇴", confederation: "AFC", group: "J" },
  { name: "Portugal", code: "POR", flag: "🇵🇹", confederation: "UEFA", group: "K" },
  { name: "DR Congo", code: "COD", flag: "🇨🇩", confederation: "CAF", group: "K" },
  { name: "Uzbekistan", code: "UZB", flag: "🇺🇿", confederation: "AFC", group: "K" },
  { name: "Colombia", code: "COL", flag: "🇨🇴", confederation: "CONMEBOL", group: "K" },
  { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA", group: "L" },
  { name: "Croatia", code: "CRO", flag: "🇭🇷", confederation: "UEFA", group: "L" },
  { name: "Ghana", code: "GHA", flag: "🇬🇭", confederation: "CAF", group: "L" },
  { name: "Panama", code: "PAN", flag: "🇵🇦", confederation: "CONCACAF", group: "L" },
];

// ── Match helpers ─────────────────────────────────────────────────────────────

function etToUtc(dateStr: string, timeStr: string): string {
  const [, h, min = "00", period] = timeStr.match(/(\d+)(?::(\d+))?\s*(a\.m\.|p\.m\.)/) ?? [];
  let hour = parseInt(h);
  if (period === "p.m." && hour !== 12) hour += 12;
  if (period === "a.m." && hour === 12) hour = 0;
  hour += 4;
  let day = dateStr;
  if (hour >= 24) {
    hour -= 24;
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    day = d.toISOString().slice(0, 10);
  }
  return `${day}T${String(hour).padStart(2, "0")}:${min.padStart(2, "0")}:00Z`;
}

// ── Group stage matches ───────────────────────────────────────────────────────

const groupMatches = [
  // Group A
  { num: 1,  home: "MEX", away: "RSA", date: "2026-06-11", time: "3 p.m.",    stadium: "Estadio Azteca",          city: "Mexico City",      group: "A" },
  { num: 2,  home: "KOR", away: "CZE", date: "2026-06-11", time: "10 p.m.",   stadium: "Estadio Tecnológico",     city: "Zapopan",          group: "A" },
  { num: 25, home: "CZE", away: "RSA", date: "2026-06-18", time: "12 p.m.",   stadium: "Mercedes-Benz Stadium",   city: "Atlanta",          group: "A" },
  { num: 28, home: "MEX", away: "KOR", date: "2026-06-18", time: "11 p.m.",   stadium: "Estadio Tecnológico",     city: "Zapopan",          group: "A" },
  { num: 53, home: "CZE", away: "MEX", date: "2026-06-24", time: "9 p.m.",    stadium: "Estadio Azteca",          city: "Mexico City",      group: "A" },
  { num: 54, home: "RSA", away: "KOR", date: "2026-06-24", time: "9 p.m.",    stadium: "Estadio Tecnológico",     city: "Guadalupe",        group: "A" },
  // Group B
  { num: 3,  home: "CAN", away: "BIH", date: "2026-06-12", time: "3 p.m.",    stadium: "BMO Field",               city: "Toronto",          group: "B" },
  { num: 5,  home: "QAT", away: "SUI", date: "2026-06-13", time: "3 p.m.",    stadium: "Levi's Stadium",          city: "Santa Clara",      group: "B" },
  { num: 26, home: "SUI", away: "BIH", date: "2026-06-18", time: "3 p.m.",    stadium: "SoFi Stadium",            city: "Inglewood",        group: "B" },
  { num: 27, home: "CAN", away: "QAT", date: "2026-06-18", time: "6 p.m.",    stadium: "BC Place",                city: "Vancouver",        group: "B" },
  { num: 49, home: "SUI", away: "CAN", date: "2026-06-24", time: "3 p.m.",    stadium: "BC Place",                city: "Vancouver",        group: "B" },
  { num: 50, home: "BIH", away: "QAT", date: "2026-06-24", time: "3 p.m.",    stadium: "Lumen Field",             city: "Seattle",          group: "B" },
  // Group C
  { num: 6,  home: "BRA", away: "MAR", date: "2026-06-13", time: "6 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford",  group: "C" },
  { num: 7,  home: "HAI", away: "SCO", date: "2026-06-13", time: "9 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough",       group: "C" },
  { num: 30, home: "SCO", away: "MAR", date: "2026-06-19", time: "6 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough",       group: "C" },
  { num: 31, home: "BRA", away: "HAI", date: "2026-06-19", time: "9 p.m.",    stadium: "Lincoln Financial Field", city: "Philadelphia",     group: "C" },
  { num: 51, home: "SCO", away: "BRA", date: "2026-06-24", time: "6 p.m.",    stadium: "Hard Rock Stadium",       city: "Miami Gardens",    group: "C" },
  { num: 52, home: "MAR", away: "HAI", date: "2026-06-24", time: "6 p.m.",    stadium: "Mercedes-Benz Stadium",   city: "Atlanta",          group: "C" },
  // Group D
  { num: 4,  home: "USA", away: "PAR", date: "2026-06-12", time: "9 p.m.",    stadium: "SoFi Stadium",            city: "Inglewood",        group: "D" },
  { num: 8,  home: "AUS", away: "TUR", date: "2026-06-14", time: "12 a.m.",   stadium: "BC Place",                city: "Vancouver",        group: "D" },
  { num: 29, home: "USA", away: "AUS", date: "2026-06-19", time: "3 p.m.",    stadium: "Lumen Field",             city: "Seattle",          group: "D" },
  { num: 32, home: "TUR", away: "PAR", date: "2026-06-20", time: "12 a.m.",   stadium: "Levi's Stadium",          city: "Santa Clara",      group: "D" },
  { num: 59, home: "TUR", away: "USA", date: "2026-06-25", time: "10 p.m.",   stadium: "SoFi Stadium",            city: "Inglewood",        group: "D" },
  { num: 60, home: "PAR", away: "AUS", date: "2026-06-25", time: "10 p.m.",   stadium: "Levi's Stadium",          city: "Santa Clara",      group: "D" },
  // Group E
  { num: 9,  home: "GER", away: "CUW", date: "2026-06-14", time: "1 p.m.",    stadium: "NRG Stadium",             city: "Houston",          group: "E" },
  { num: 11, home: "CIV", away: "ECU", date: "2026-06-14", time: "7 p.m.",    stadium: "Lincoln Financial Field", city: "Philadelphia",     group: "E" },
  { num: 34, home: "GER", away: "CIV", date: "2026-06-20", time: "4 p.m.",    stadium: "BMO Field",               city: "Toronto",          group: "E" },
  { num: 35, home: "ECU", away: "CUW", date: "2026-06-20", time: "8 p.m.",    stadium: "Arrowhead Stadium",       city: "Kansas City",      group: "E" },
  { num: 55, home: "ECU", away: "GER", date: "2026-06-25", time: "4 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford",  group: "E" },
  { num: 56, home: "CUW", away: "CIV", date: "2026-06-25", time: "4 p.m.",    stadium: "Lincoln Financial Field", city: "Philadelphia",     group: "E" },
  // Group F
  { num: 10, home: "NED", away: "JPN", date: "2026-06-14", time: "4 p.m.",    stadium: "AT&T Stadium",            city: "Arlington",        group: "F" },
  { num: 12, home: "SWE", away: "TUN", date: "2026-06-14", time: "10 p.m.",   stadium: "Estadio Tecnológico",     city: "Guadalupe",        group: "F" },
  { num: 33, home: "NED", away: "SWE", date: "2026-06-20", time: "1 p.m.",    stadium: "NRG Stadium",             city: "Houston",          group: "F" },
  { num: 36, home: "TUN", away: "JPN", date: "2026-06-21", time: "12 a.m.",   stadium: "Estadio Tecnológico",     city: "Guadalupe",        group: "F" },
  { num: 57, home: "JPN", away: "SWE", date: "2026-06-25", time: "7 p.m.",    stadium: "AT&T Stadium",            city: "Arlington",        group: "F" },
  { num: 58, home: "TUN", away: "NED", date: "2026-06-25", time: "7 p.m.",    stadium: "Arrowhead Stadium",       city: "Kansas City",      group: "F" },
  // Group G
  { num: 14, home: "BEL", away: "EGY", date: "2026-06-15", time: "6 p.m.",    stadium: "Lumen Field",             city: "Seattle",          group: "G" },
  { num: 16, home: "IRN", away: "NZL", date: "2026-06-16", time: "12 a.m.",   stadium: "SoFi Stadium",            city: "Inglewood",        group: "G" },
  { num: 38, home: "BEL", away: "IRN", date: "2026-06-21", time: "3 p.m.",    stadium: "SoFi Stadium",            city: "Inglewood",        group: "G" },
  { num: 40, home: "NZL", away: "EGY", date: "2026-06-21", time: "9 p.m.",    stadium: "BC Place",                city: "Vancouver",        group: "G" },
  { num: 65, home: "EGY", away: "IRN", date: "2026-06-26", time: "11 p.m.",   stadium: "Lumen Field",             city: "Seattle",          group: "G" },
  { num: 66, home: "NZL", away: "BEL", date: "2026-06-26", time: "11 p.m.",   stadium: "BC Place",                city: "Vancouver",        group: "G" },
  // Group H
  { num: 13, home: "ESP", away: "CPV", date: "2026-06-15", time: "1 p.m.",    stadium: "Mercedes-Benz Stadium",   city: "Atlanta",          group: "H" },
  { num: 15, home: "KSA", away: "URU", date: "2026-06-15", time: "6 p.m.",    stadium: "Hard Rock Stadium",       city: "Miami Gardens",    group: "H" },
  { num: 37, home: "ESP", away: "KSA", date: "2026-06-21", time: "12 p.m.",   stadium: "Mercedes-Benz Stadium",   city: "Atlanta",          group: "H" },
  { num: 39, home: "URU", away: "CPV", date: "2026-06-21", time: "6 p.m.",    stadium: "Hard Rock Stadium",       city: "Miami Gardens",    group: "H" },
  { num: 63, home: "CPV", away: "KSA", date: "2026-06-26", time: "8 p.m.",    stadium: "NRG Stadium",             city: "Houston",          group: "H" },
  { num: 64, home: "URU", away: "ESP", date: "2026-06-26", time: "8 p.m.",    stadium: "Estadio Tecnológico",     city: "Zapopan",          group: "H" },
  // Group I
  { num: 17, home: "FRA", away: "SEN", date: "2026-06-16", time: "3 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford",  group: "I" },
  { num: 18, home: "IRQ", away: "NOR", date: "2026-06-16", time: "6 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough",       group: "I" },
  { num: 42, home: "FRA", away: "IRQ", date: "2026-06-22", time: "5 p.m.",    stadium: "Lincoln Financial Field", city: "Philadelphia",     group: "I" },
  { num: 43, home: "NOR", away: "SEN", date: "2026-06-22", time: "8 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford",  group: "I" },
  { num: 61, home: "NOR", away: "FRA", date: "2026-06-26", time: "3 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough",       group: "I" },
  { num: 62, home: "SEN", away: "IRQ", date: "2026-06-26", time: "3 p.m.",    stadium: "BMO Field",               city: "Toronto",          group: "I" },
  // Group J
  { num: 19, home: "ARG", away: "ALG", date: "2026-06-16", time: "9 p.m.",    stadium: "Arrowhead Stadium",       city: "Kansas City",      group: "J" },
  { num: 20, home: "AUT", away: "JOR", date: "2026-06-17", time: "12 a.m.",   stadium: "Levi's Stadium",          city: "Santa Clara",      group: "J" },
  { num: 41, home: "ARG", away: "AUT", date: "2026-06-22", time: "1 p.m.",    stadium: "AT&T Stadium",            city: "Arlington",        group: "J" },
  { num: 44, home: "JOR", away: "ALG", date: "2026-06-22", time: "11 p.m.",   stadium: "Levi's Stadium",          city: "Santa Clara",      group: "J" },
  { num: 71, home: "ALG", away: "AUT", date: "2026-06-27", time: "10 p.m.",   stadium: "Arrowhead Stadium",       city: "Kansas City",      group: "J" },
  { num: 72, home: "JOR", away: "ARG", date: "2026-06-27", time: "10 p.m.",   stadium: "AT&T Stadium",            city: "Arlington",        group: "J" },
  // Group K
  { num: 21, home: "POR", away: "COD", date: "2026-06-17", time: "1 p.m.",    stadium: "NRG Stadium",             city: "Houston",          group: "K" },
  { num: 24, home: "UZB", away: "COL", date: "2026-06-17", time: "10 p.m.",   stadium: "Estadio Azteca",          city: "Mexico City",      group: "K" },
  { num: 45, home: "POR", away: "UZB", date: "2026-06-23", time: "1 p.m.",    stadium: "NRG Stadium",             city: "Houston",          group: "K" },
  { num: 48, home: "COL", away: "COD", date: "2026-06-23", time: "10 p.m.",   stadium: "Estadio Tecnológico",     city: "Zapopan",          group: "K" },
  { num: 69, home: "COL", away: "POR", date: "2026-06-27", time: "7:30 p.m.", stadium: "Hard Rock Stadium",       city: "Miami Gardens",    group: "K" },
  { num: 70, home: "COD", away: "UZB", date: "2026-06-27", time: "7:30 p.m.", stadium: "Mercedes-Benz Stadium",   city: "Atlanta",          group: "K" },
  // Group L
  { num: 22, home: "ENG", away: "CRO", date: "2026-06-17", time: "4 p.m.",    stadium: "AT&T Stadium",            city: "Arlington",        group: "L" },
  { num: 23, home: "GHA", away: "PAN", date: "2026-06-17", time: "7 p.m.",    stadium: "BMO Field",               city: "Toronto",          group: "L" },
  { num: 46, home: "ENG", away: "GHA", date: "2026-06-23", time: "4 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough",       group: "L" },
  { num: 47, home: "PAN", away: "CRO", date: "2026-06-23", time: "7 p.m.",    stadium: "BMO Field",               city: "Toronto",          group: "L" },
  { num: 67, home: "PAN", away: "ENG", date: "2026-06-27", time: "5 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford",  group: "L" },
  { num: 68, home: "CRO", away: "GHA", date: "2026-06-27", time: "5 p.m.",    stadium: "Lincoln Financial Field", city: "Philadelphia",     group: "L" },
];

// ── Knockout stage matches ────────────────────────────────────────────────────

const knockoutMatches = [
  // Round of 32
  { num: 73,  round: "Round of 32",   date: "2026-07-02", time: "3 p.m.",    stadium: "Estadio Azteca",          city: "Mexico City"      },
  { num: 74,  round: "Round of 32",   date: "2026-07-02", time: "6 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford"  },
  { num: 75,  round: "Round of 32",   date: "2026-07-02", time: "9 p.m.",    stadium: "BC Place",                city: "Vancouver"        },
  { num: 76,  round: "Round of 32",   date: "2026-07-03", time: "12 a.m.",   stadium: "SoFi Stadium",            city: "Inglewood"        },
  { num: 77,  round: "Round of 32",   date: "2026-07-03", time: "3 p.m.",    stadium: "NRG Stadium",             city: "Houston"          },
  { num: 78,  round: "Round of 32",   date: "2026-07-03", time: "6 p.m.",    stadium: "AT&T Stadium",            city: "Arlington"        },
  { num: 79,  round: "Round of 32",   date: "2026-07-03", time: "9 p.m.",    stadium: "Lumen Field",             city: "Seattle"          },
  { num: 80,  round: "Round of 32",   date: "2026-07-04", time: "12 a.m.",   stadium: "Hard Rock Stadium",       city: "Miami Gardens"    },
  { num: 81,  round: "Round of 32",   date: "2026-07-04", time: "3 p.m.",    stadium: "Gillette Stadium",        city: "Foxborough"       },
  { num: 82,  round: "Round of 32",   date: "2026-07-04", time: "6 p.m.",    stadium: "Arrowhead Stadium",       city: "Kansas City"      },
  { num: 83,  round: "Round of 32",   date: "2026-07-04", time: "9 p.m.",    stadium: "Mercedes-Benz Stadium",   city: "Atlanta"          },
  { num: 84,  round: "Round of 32",   date: "2026-07-05", time: "12 a.m.",   stadium: "Lincoln Financial Field", city: "Philadelphia"     },
  { num: 85,  round: "Round of 32",   date: "2026-07-05", time: "3 p.m.",    stadium: "Levi's Stadium",          city: "Santa Clara"      },
  { num: 86,  round: "Round of 32",   date: "2026-07-05", time: "6 p.m.",    stadium: "BMO Field",               city: "Toronto"          },
  { num: 87,  round: "Round of 32",   date: "2026-07-05", time: "9 p.m.",    stadium: "Rose Bowl",               city: "Pasadena"         },
  { num: 88,  round: "Round of 32",   date: "2026-07-06", time: "12 a.m.",   stadium: "Estadio Tecnológico",     city: "Guadalupe"        },
  // Round of 16
  { num: 89,  round: "Round of 16",   date: "2026-07-08", time: "3 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford"  },
  { num: 90,  round: "Round of 16",   date: "2026-07-08", time: "9 p.m.",    stadium: "SoFi Stadium",            city: "Inglewood"        },
  { num: 91,  round: "Round of 16",   date: "2026-07-09", time: "3 p.m.",    stadium: "AT&T Stadium",            city: "Arlington"        },
  { num: 92,  round: "Round of 16",   date: "2026-07-09", time: "9 p.m.",    stadium: "Hard Rock Stadium",       city: "Miami Gardens"    },
  { num: 93,  round: "Round of 16",   date: "2026-07-10", time: "3 p.m.",    stadium: "Arrowhead Stadium",       city: "Kansas City"      },
  { num: 94,  round: "Round of 16",   date: "2026-07-10", time: "6 p.m.",    stadium: "NRG Stadium",             city: "Houston"          },
  { num: 95,  round: "Round of 16",   date: "2026-07-10", time: "9 p.m.",    stadium: "Rose Bowl",               city: "Pasadena"         },
  { num: 96,  round: "Round of 16",   date: "2026-07-11", time: "12 a.m.",   stadium: "Lumen Field",             city: "Seattle"          },
  // Quarterfinals
  { num: 97,  round: "Quarterfinals", date: "2026-07-14", time: "3 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford"  },
  { num: 98,  round: "Quarterfinals", date: "2026-07-14", time: "9 p.m.",    stadium: "SoFi Stadium",            city: "Inglewood"        },
  { num: 99,  round: "Quarterfinals", date: "2026-07-15", time: "3 p.m.",    stadium: "AT&T Stadium",            city: "Arlington"        },
  { num: 100, round: "Quarterfinals", date: "2026-07-15", time: "9 p.m.",    stadium: "Hard Rock Stadium",       city: "Miami Gardens"    },
  // Semifinals
  { num: 101, round: "Semifinals",    date: "2026-07-17", time: "9 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford"  },
  { num: 102, round: "Semifinals",    date: "2026-07-18", time: "9 p.m.",    stadium: "Rose Bowl",               city: "Pasadena"         },
  // Third Place
  { num: 103, round: "Third Place",   date: "2026-07-18", time: "6 p.m.",    stadium: "AT&T Stadium",            city: "Arlington"        },
  // Final
  { num: 104, round: "Final",         date: "2026-07-19", time: "6 p.m.",    stadium: "MetLife Stadium",         city: "East Rutherford"  },
];

async function seed() {
  // Clear existing data
  console.log("Clearing existing data...");
  await fetch(`${SUPABASE_URL}/rest/v1/predictions?id=gte.0`, { method: "DELETE", headers });
  await fetch(`${SUPABASE_URL}/rest/v1/matches?id=gte.0`, { method: "DELETE", headers });
  await fetch(`${SUPABASE_URL}/rest/v1/teams?id=gte.0`, { method: "DELETE", headers });

  // Insert teams
  console.log("Inserting 48 teams...");
  const insertedTeams: any[] = await rpc("teams", "POST", teams);
  const byCode = new Map(insertedTeams.map((t: any) => [t.code, t]));
  console.log(`  ✓ ${insertedTeams.length} teams`);

  // Insert group stage matches
  console.log("Inserting 72 group stage matches...");
  const groupMatchRows = groupMatches.map(m => ({
    home_team_id: byCode.get(m.home)?.id ?? null,
    away_team_id: byCode.get(m.away)?.id ?? null,
    match_date: etToUtc(m.date, m.time),
    stadium: m.stadium,
    city: m.city,
    round: "Group Stage",
    group: m.group,
    status: "upcoming",
    match_number: m.num,
  }));
  await rpc("matches", "POST", groupMatchRows);
  console.log(`  ✓ 72 group stage matches`);

  // Insert knockout matches
  console.log("Inserting 32 knockout matches...");
  const knockoutRows = knockoutMatches.map(m => ({
    home_team_id: null,
    away_team_id: null,
    match_date: etToUtc(m.date, m.time),
    stadium: m.stadium,
    city: m.city,
    round: m.round,
    group: null,
    status: "upcoming",
    match_number: m.num,
  }));
  await rpc("matches", "POST", knockoutRows);
  console.log(`  ✓ 32 knockout matches`);

  console.log("Seed complete ✓");
}

seed().catch(err => { console.error(err); process.exit(1); });
