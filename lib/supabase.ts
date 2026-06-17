import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

import type { Database } from "@/lib/types";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined);

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error early instead of a cryptic network failure later.
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill the anon key from the Supabase dashboard.",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Base URL for invoking edge functions directly (Stripe flows). */
export const FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `${supabaseUrl}/functions/v1`;

/**
 * Invoke a Supabase edge function with the current user's access token.
 * Throws an Error with the server message on non-2xx responses.
 */
export async function invokeFunction<T = unknown>(
  name: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in.");
  }

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  const payload = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(payload?.error ?? `Request failed (${res.status})`);
  }

  return payload as T;
}
