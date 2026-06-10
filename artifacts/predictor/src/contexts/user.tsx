import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getStoredUserId, storeUserId, clearStoredUserId, signOut } from "@/lib/hooks";

interface UserContextValue {
  userId: number | null;
  setUserId: (id: number) => void;
  clearUserId: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(() => getStoredUserId());

  // On mount, check if Supabase Auth session exists and restore user
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        clearStoredUserId();
        setUserIdState(null);
        return;
      }
      // Session exists — look up our users table if we don't have a stored id
      if (!getStoredUserId()) {
        const { data } = await supabase
          .from("users").select("id").eq("email", session.user.email!).single();
        if (data) {
          storeUserId(data.id);
          setUserIdState(data.id);
        }
      }
    });

    // Keep in sync with auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearStoredUserId();
        setUserIdState(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const setUserId = (id: number) => {
    storeUserId(id);
    setUserIdState(id);
  };

  const clearUserId = async () => {
    await signOut();
    setUserIdState(null);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, clearUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within UserProvider");
  return ctx;
}
