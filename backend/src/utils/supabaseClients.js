const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Public-key client: used for operations a user could do themselves
// (sign in, sign up, request a password reset) -- safe to run server-side
// with the anon/publishable key since it never bypasses RLS or acts as
// another user.
const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Secret-key client: bypasses Row Level Security, used only for privileged
// admin operations (creating a user without the email-confirmation wait,
// looking up a user by id/email as an admin). Never expose this client or
// its key to the frontend.
const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { authClient, adminClient };
