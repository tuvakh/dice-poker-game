# MARIE-EXPLAINED

This branch contains the work needed to move the project toward a cleaner, exam-safe auth and email flow, while keeping the current app working.

## What Changed

### 1. Email verification and password reset mail
- The backend mailer was changed so verification and reset emails are handled through Ethereal for development/testing.
- The mail flow was adjusted so the backend can send emails during registration and password reset without relying on the old test-site style flow.
- The email templates still build verification and reset links from `FRONTEND_URL`.
- I also tested the mail flow locally by sending a verification email and checking that Ethereal preview URLs were produced.

### 2. Authentication and authorization
- The old header-based role trust was removed so the server no longer depends on spoofable client headers like `X-User-Role`.
- Login now uses signed JWT-based auth.
- The access token is set as an HTTP-only cookie so the browser sends it automatically.
- The backend middleware now reads the authenticated user from the verified token instead of trusting the client.
- The password flow was upgraded to use Node crypto-based hashing with support for legacy hashes during migration.

### 3. Frontend auth cleanup
- Frontend API requests were updated to use `credentials: 'include'` so cookie-based auth works consistently.
- Client-side auth storage was simplified so the code no longer keeps stale sessionStorage-based token state in multiple places.
- The admin and user API modules were cleaned up so they no longer rely on the old bearer/header pattern.

### 4. Password handling fix
- A bug was found where passwords were being hashed more than once.
- That caused login to fail even when the correct password was typed.
- The duplicate hashing path was removed so passwords are hashed once and can be checked correctly at login.

### 5. Cleanup of duplicate or confusing code
- Unused auth helpers and old token-storage logic were removed from the frontend.
- Redundant password hashing code paths were removed from the backend service layer.
- The branch was cleaned so the auth flow is easier to reason about and less likely to drift between files.

### 6. Merge work
- `origin/master` was merged into this branch locally so any merge issues can be handled here before anything else is merged later.
- The merge was done locally only. Nothing was pushed to `main` or any remote branch.

## Validation I Ran
- Frontend production build succeeded.
- Mail delivery was tested locally through Ethereal preview URLs.
- Password hashing and password comparison were checked locally.
- The backend server was started and restarted locally during debugging, including fixing port conflicts caused by leftover Node processes.

## Notes
- This branch still keeps some backend refresh-token support for compatibility, but the frontend now follows the cookie-based auth path.
- The branch also includes the merge of upstream `master`, so the current state is a combination of the earlier feature work and the latest upstream changes.

## Summary
In short, this branch mainly focuses on:
- making email verification work in a predictable dev setup,
- securing authentication and authorization,
- fixing password handling,
- cleaning up duplicate logic,
- and merging upstream changes locally so the branch can be stabilized before any future merge.
