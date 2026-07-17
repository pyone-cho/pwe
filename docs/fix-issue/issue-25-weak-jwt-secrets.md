# Fix Issue #25: Weak JWT Fallback Secrets Enable Token Forgery

**Issue Title:** Security: Weak JWT fallback secrets enable token forgery

**Date:** 2026-07-17

**Status:** Fixed

---

## Problem

The JWT authentication system in `src/backend/src/utils/jwt.ts` used hardcoded fallback secrets when environment variables were not configured:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";
```

### Security Impact

1. **Token Forgery:** If environment variables are not set, the app uses easily guessable fallback secrets (`"fallback-secret"`, `"fallback-refresh-secret"`)
2. **Privilege Escalation:** Attackers can craft JWT tokens with `{"role": "admin"}` signed with the known fallback secret
3. **Authentication Bypass:** Compromises the entire authentication system
4. **Common Attack Vector:** Fallback secrets are often present in dev/staging environments and can be exploited in production

### Attack Scenario

1. Attacker checks if app uses fallback secrets (common in dev/staging)
2. Crafts JWT with `{"role": "admin"}` signed with `"fallback-secret"`
3. Uses forged token to access admin endpoints
4. Gains full access to the system

---

## Fix

### Before

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback-refresh-secret";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
```

### After

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables");
}
```

### Changes Made

1. Removed fallback secrets from `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
2. Added runtime validation to ensure both secrets are configured
3. Application fails fast at startup if secrets are missing (prevents running with weak security)

---

## Testing

### Verification Steps

1. **Without secrets set:**
   ```bash
   unset JWT_SECRET
   unset REFRESH_TOKEN_SECRET
   npm run dev
   # Expected: Application crashes with error message
   ```

2. **With secrets set:**
   ```bash
   export JWT_SECRET="your-secure-random-string"
   export REFRESH_TOKEN_SECRET="your-secure-random-refresh-string"
   npm run dev
   # Expected: Application starts normally
   ```

3. **Token validation:**
   - Generate tokens with valid secrets
   - Verify tokens can be validated
   - Ensure tokens signed with old fallback secrets are rejected

---

## Environment Variables Required

Add these to your `.env` file (generate secure random strings):

```bash
# Generate secure secrets using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=<64-character-random-hex-string>
REFRESH_TOKEN_SECRET=<64-character-random-hex-string>

# Optional (with defaults)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Related Files

- `src/backend/src/utils/jwt.ts` - Main file modified
- `.env.example` - Should be updated with required variables
- `docs/pwe/security.md` - Security documentation

---

## Prevention

To prevent similar issues in the future:

1. **Never use fallback secrets** in authentication systems
2. **Fail fast** - Application should crash if critical security config is missing
3. **Document required environment variables** in README and .env.example
4. **Use secret scanning tools** in CI/CD to detect hardcoded secrets
5. **Regular security audits** of authentication and authorization code
