import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://qdoblyedcycmtxjfwbtp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkb2JseWVkY3ljbXR4amZ3YnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzc4OTUsImV4cCI6MjA5NjYxMzg5NX0.OXLwyF7mQgLgmoWsXKyQ3H0LyDHRiZlqbyocEhxP_-M"
);
