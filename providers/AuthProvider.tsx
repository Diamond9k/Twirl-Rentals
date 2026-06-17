import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until the initial session check + profile load completes. */
  initializing: boolean;
  userId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function isEduEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.edu$/.test(email.trim());
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[auth] failed to load profile:", error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    setProfile(await loadProfile(session.user.id));
  }, [session?.user.id]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user.id) {
        setProfile(await loadProfile(data.session.user.id));
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setProfile(
          nextSession?.user.id ? await loadProfile(nextSession.user.id) : null,
        );
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const trimmed = email.trim();
      if (!isEduEmail(trimmed)) {
        throw new Error("Please use your school .edu email address.");
      }
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      // If email confirmation is on, there is no session yet.
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      initializing,
      userId: session?.user.id ?? null,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, initializing, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
