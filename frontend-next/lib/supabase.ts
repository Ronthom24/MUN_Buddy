import { createClient } from "@supabase/supabase-js";

/**
 * Used only for the password-reset-confirmation flow (see
 * app/reset-password/page.tsx) -- login/register still go through our own
 * backend (see lib/api.ts), not Supabase directly, so this client never
 * needs to persist an app session. It exists solely to read the recovery
 * session Supabase writes to the URL when the emailed reset link lands here,
 * and to call auth.updateUser with the new password.
 *
 * Deliberately plain @supabase/supabase-js, not @supabase/ssr's
 * createBrowserClient -- that one hardcodes flowType: "pkce" (can't be
 * overridden via options), but the backend's resetPasswordForEmail call
 * (authService.js) uses a plain createClient with the default implicit
 * flow, so its emailed links carry access_token/refresh_token in the URL
 * hash, not a PKCE `code` param. A pkce-flow client silently ignores those
 * hash tokens instead of detecting a session.
 */
export function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { flowType: "implicit", persistSession: false } }
  );
}
