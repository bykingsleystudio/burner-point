import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { clearApiSession } from './auth';
import { supabase } from './supabase';

type BurnerAuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const BurnerAuthContext = createContext<BurnerAuthContextValue | null>(null);

export function BurnerAuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setIsLoaded(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setIsLoaded(true);
      if (!nextSession) {
        void clearApiSession();
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await clearApiSession();
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <BurnerAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: Boolean(session),
        session,
        user: session?.user ?? null,
        signOut,
      }}
    >
      {children}
    </BurnerAuthContext.Provider>
  );
}

export function useBurnerAuth() {
  const value = useContext(BurnerAuthContext);
  if (!value) {
    throw new Error('useBurnerAuth must be used inside BurnerAuthProvider.');
  }
  return value;
}
