# User Signup & Login - Implementation Plan

## Overview
Add proper user authentication with email/password signup and login, replacing the current single-password system.

## Current State
- Single password auth (checks `ADMIN_PASSWORD` env var)
- Cookie: `auth_token=authenticated`
- No User table in database
- Hardcoded user data: "Agency User" for comments, "Basil Alosious" in settings
- No logout functionality

---

## Implementation Plan

### Phase 1: Dependencies & Database Schema

**Install bcryptjs:**
```bash
npm install bcryptjs @types/bcryptjs
```

**Add User interface to `src/lib/db.ts`:**
```typescript
export interface User {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: string
}
```

**Add database methods to both adapters:**
- `getUserByEmail(email: string): Promise<User | undefined>`
- `getUserById(id: string): Promise<User | undefined>`
- `createUser(user: User): Promise<User>`

**Postgres migration:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

---

### Phase 2: Auth Utilities

**New file: `src/lib/auth.ts`**
- `hashPassword(password)` - bcrypt hash with cost 10
- `verifyPassword(password, hash)` - bcrypt compare
- `createSession(userId)` - create signed session cookie
- `getSession()` - verify and decode session
- `getCurrentUser()` - get full user from session
- `destroySession()` - clear session cookie

**Session approach:** Signed JSON cookie with userId and expiry (7 days).

---

### Phase 3: Signup Flow

**New route: `src/app/signup/page.tsx`**
- Form fields: Name, Email, Password
- Client component with form status
- Link to login page

**New file: `src/app/signup/actions.ts`**
- Validate inputs (email format, password min 8 chars)
- Check if email exists
- Hash password, create user
- Create session, redirect to `/`

---

### Phase 4: Updated Login Flow

**Update: `src/app/login/page.tsx`**
- Add email field (currently only password)
- Add link to signup page

**Update: `src/app/login/actions.ts`**
- Lookup user by email
- Verify password with bcrypt
- Create session, redirect to `/`

---

### Phase 5: Logout & Middleware

**New file: `src/app/logout/actions.ts`**
- `logout()` server action - destroys session, redirects to `/login`

**Update: `src/middleware.ts`**
- Change cookie name from `auth_token` to `session`
- Add `/signup` to public paths
- Keep `/login`, `/share/*`, `/api/proxy` public

---

### Phase 6: User Context

**New file: `src/lib/user-context.tsx`**
```typescript
const UserContext = createContext<{ id: string; name: string; email: string } | null>(null)
export function UserProvider({ user, children }) { ... }
export function useUser() { return useContext(UserContext) }
```

**Update: `src/app/(main)/layout.tsx`**
- Fetch current user with `getCurrentUser()`
- Wrap children in `<UserProvider>`

---

### Phase 7: UI Updates

**Update: `src/components/layout/Navbar.tsx`**
- Add logout button (form with logout action)

**Update: `src/app/settings/SettingsClient.tsx`**
- Replace hardcoded "Basil Alosious" with `user?.name`
- Replace hardcoded email with `user?.email`

**Update: `src/app/projects/[id]/ProjectClient.tsx`**
- Replace `"Agency User"` with `user?.name || "Agency User"`

**Update: `src/app/markup/[id]/MarkupClient.tsx`**
- Replace `"Agency User"` with `user?.name || "Agency User"`

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/lib/db.ts` | Add User interface, database methods |
| `src/lib/auth.ts` | **NEW** - session & password utilities |
| `src/lib/user-context.tsx` | **NEW** - React context for user |
| `src/app/signup/page.tsx` | **NEW** - signup page |
| `src/app/signup/actions.ts` | **NEW** - signup action |
| `src/app/login/page.tsx` | Add email field, link to signup |
| `src/app/login/actions.ts` | Rewrite for email/password auth |
| `src/app/logout/actions.ts` | **NEW** - logout action |
| `src/middleware.ts` | Update cookie name, add /signup |
| `src/app/(main)/layout.tsx` | Add UserProvider |
| `src/components/layout/Navbar.tsx` | Add logout button |
| `src/app/settings/SettingsClient.tsx` | Use user context |
| `src/app/projects/[id]/ProjectClient.tsx` | Use user context for author |
| `src/app/markup/[id]/MarkupClient.tsx` | Use user context for author |

---

## Environment Variables

Add to `.env.local`:
```
SESSION_SECRET=<generate with: openssl rand -hex 32>
```

---

## Security Considerations

- Password hashing: bcryptjs with cost factor 10
- HttpOnly, Secure, SameSite=Lax cookies
- Signed session tokens (HMAC-SHA256)
- Generic error messages ("Invalid email or password")
- Server-side input validation

---

## Verification

1. **Signup flow:**
   - Go to `/signup`
   - Create account with name/email/password
   - Should redirect to dashboard
   - Check user appears in database

2. **Login flow:**
   - Logout, go to `/login`
   - Login with email/password
   - Should redirect to dashboard

3. **Session persistence:**
   - Refresh page - should stay logged in
   - Close browser, reopen - should stay logged in (7 days)

4. **Logout:**
   - Click logout in navbar
   - Should redirect to `/login`
   - Accessing `/` should redirect to `/login`

5. **User context:**
   - Settings page shows logged-in user's name/email
   - New comments show user's name as author

6. **Protected routes:**
   - Unauthenticated access to `/` redirects to `/login`
   - Authenticated access to `/login` or `/signup` redirects to `/`
