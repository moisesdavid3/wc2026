import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setExtraHeaders } from "@workspace/api-client-react";

interface UserContextValue {
  userId: number | null;
  setUserId: (id: number) => void;
  clearUserId: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY = "predictor26_user_id";

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  });

  useEffect(() => {
    if (userId != null) {
      setExtraHeaders({ "x-user-id": String(userId) });
    } else {
      setExtraHeaders({});
    }
  }, [userId]);

  const setUserId = (id: number) => {
    localStorage.setItem(STORAGE_KEY, String(id));
    setUserIdState(id);
  };

  const clearUserId = () => {
    localStorage.removeItem(STORAGE_KEY);
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
