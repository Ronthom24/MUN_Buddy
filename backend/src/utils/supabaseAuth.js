const { jwtVerify, createRemoteJWKSet } = require("jose");
require("dotenv").config();

const SUPABASE_ISSUER = `${process.env.SUPABASE_URL}/auth/v1`;
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_ISSUER}/.well-known/jwks.json`));

/**
 * Verifies a Supabase Auth access token locally against Supabase's published
 * JWKS (ES256, cached with the TTL jose manages internally) rather than
 * calling supabase.auth.getUser() over the network on every request -- this
 * is a persistent Express server, not a serverless function, so the extra
 * round-trip and dependency on Supabase's API uptime for basic routing
 * decisions isn't worth it. Throws on an invalid/expired/wrong-issuer token.
 */
async function verifySupabaseToken(token) {
    const { payload } = await jwtVerify(token, JWKS, {
        issuer: SUPABASE_ISSUER,
        audience: "authenticated"
    });
    return payload;
}

module.exports = { verifySupabaseToken, SUPABASE_ISSUER };
