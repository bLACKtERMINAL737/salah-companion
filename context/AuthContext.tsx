"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured, watchAuthState } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  /** True until the first auth-state callback fires — avoids a flash of
   *  "signed out" UI before Firebase has had a chance to restore a session. */
  loading: boolean;
  /** Whether NEXT_PUBLIC_FIREBASE_* env vars are present at all. Accounts
   *  are an enhancement, not a requirement — every screen should keep
   *  working with this false. */
  configured: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, configured: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const unsubscribe = watchAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading, configured }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
