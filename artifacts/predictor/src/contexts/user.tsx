import { createContext, useContext, useState, type ReactNode } from "react";
import { getStoredUserId, storeUserId, clearStoredUserId } from "@/lib/hooks";

interface UserContextValue {
  userId: number | null;
  setUserId: (id: number) => void;
  clearUserId: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(() => getStoredUserId());

  const setUserId = (id: number) => {
    storeUserId(id);
    setUserIdState(id);
  };

  const clearUserId = () => {
    clearStoredUserId();
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
