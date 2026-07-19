# Files by Study Priority

> Every file in the project, ordered **highest → lowest priority** for the oral exam.
>
> **Legend:** 🔴 must know cold · 🟠 know well · 🟡 know roughly · ⚪ just know it exists
> 🆕 = new work for the exam · ♻️ = carried/adapted from Oblig 1/2/3
>
> ⚠️ **Caveat:** NOTES.md says *all* of Oblig 1/2/3 was used as starter code, so 🆕/♻️ is my
> best inference from the README's "new features" list + code comments — correct it from memory.
>
> **Strategy:** study top-down. Learn ONE resource end-to-end (route → validator → controller →
> service → model) and the rest follow the same shape. Spend real time on the 🔴 block.

---

## 🔴 TIER 1 — Must know cold (hardest + most-asked + new)

1. `backend/project/webSockets/gameSocket.js` — 🆕 the real-time game engine. The single most complex + most-asked file (rolling, betting, timers, scoring, rejoin).
2. `frontend/src/pages/Game.jsx` — 🆕 game UI + WebSocket client; opens the socket, handles phases, cleanup on unmount.
3. `frontend/src/components/dice-poker-board.js` — ♻️ (ported from oblig1) Web Component board. Exam *requires* Web Components — know lifecycle + `CustomEvent`.
4. `frontend/src/components/dice-poker-die.js` — ♻️ single die Web Component (`observedAttributes`, `attributeChangedCallback`).
5. `backend/project/utils/handEvaluator.js` — ♻️ (ported from oblig1) hand ranking + `calculateEloDeltas` (pairwise ELO).
6. `backend/project/utils/jwt.js` — 🆕 access/refresh token create + verify.
7. `backend/project/utils/hash.js` — 🆕 scrypt password hashing + salt.
8. `backend/project/middleware/role.js` — 🆕 decode JWT, IP-mismatch check, `requireUser`/`requireAdmin`.
9. `frontend/src/contexts/AuthContext.jsx` — 🆕 login state, sessionStorage restore, 30s ban poll.
10. `frontend/src/api/config.js` — 🆕 `fetchWithAuth` + auto refresh-on-401 + `handleResponse`.
11. `backend/project/services/user.service.js` — 🆕 auth logic: register, login, verify email, reset, refresh, ban.
12. `backend/project/server.js` — 🆕 request flow, CORS, rate limiter + security-incident logging, route wiring.

---

## 🟠 TIER 2 — Know well (the rest of the new exam features)

**Tournaments** 🆕
13. `backend/project/services/tournament.service.js` — `startNextRound` random pairing, standings.
14. `backend/project/models/Tournament.js`
15. `backend/project/controllers/tournament.controller.js`
16. `backend/project/routes/tournament.routes.js`
17. `backend/project/validators/tournament.validator.js`
18. `frontend/src/pages/TournamentPage.jsx`
19. `frontend/src/pages/Tournament.jsx`
20. `frontend/src/pages/admin/TournamentCreate.jsx`
21. `frontend/src/pages/admin/TournamentEdit.jsx`
22. `frontend/src/api/tournaments.js`
23. `frontend/src/components/TournamentCard.jsx`

**Match / game backend (coins + wager are new)** 🆕/♻️
24. `backend/project/services/match.service.js` — `recordMatch` (ELO, coin payout, wager lock).
25. `backend/project/models/Match.js`
26. `backend/project/controllers/match.controller.js`
27. `backend/project/routes/match.routes.js`
28. `backend/project/validators/match.validator.js`
29. `frontend/src/api/matches.js`
30. `frontend/src/components/BettingControls.jsx` — 🆕 fold/bet/raise/match controls.
31. `frontend/src/components/PlayerInfo.jsx` — 🆕 per-player hand/stack/status.

**Points / coins** 🆕
32. `backend/project/utils/coins.js` — weekly 100-coin grant logic.
33. `backend/project/services/scheduler.js` — `grantWeeklyCoinsBatch` on startup.

**Admin + security + activity** 🆕
34. `backend/project/models/Security.js` — incident log (rate-limit, IP-mismatch).
35. `backend/project/services/admin.service.js`
36. `backend/project/controllers/admin.controller.js`
37. `backend/project/routes/admin.routes.js`
38. `backend/project/services/activity.service.js`
39. `backend/project/controllers/activity.controller.js`
40. `backend/project/routes/activity.routes.js`
41. `frontend/src/pages/admin/Dashboard.jsx`
42. `frontend/src/pages/admin/Users.jsx`
43. `frontend/src/pages/admin/Comments.jsx`
44. `frontend/src/pages/admin/AdminLayout.jsx`
45. `frontend/src/components/AdminRoute.jsx`
46. `frontend/src/components/BanModal.jsx`
47. `frontend/src/api/admin.js`
48. `frontend/src/api/adminUsers.js`
49. `frontend/src/api/activity.js`

**Comments (real-time via WebSocket)** 🆕
50. `backend/project/models/Comment.js`
51. `backend/project/services/comment.service.js`
52. `backend/project/controllers/comment.controller.js`
53. `backend/project/routes/comment.routes.js`
54. `backend/project/validators/comment.validator.js`
55. `frontend/src/api/comments.js`
56. `frontend/src/components/CommentList.jsx`
57. `frontend/src/components/CommentItem.jsx`
58. `frontend/src/components/CommentForm.jsx`

**Trophies** 🆕
59. `backend/project/models/Trophy.js`
60. `backend/project/services/trophy.service.js`
61. `backend/project/controllers/trophy.controller.js`
62. `backend/project/routes/trophy.routes.js`
63. `backend/project/validators/trophy.validator.js`
64. `frontend/src/api/trophies.js`
65. `frontend/src/components/TrophyBadge.jsx`

**Email + new auth pages** 🆕
66. `backend/project/utils/mailer.js` — verification + reset emails (Ethereal SMTP).
67. `frontend/src/pages/VerifyEmail.jsx`
68. `frontend/src/pages/ResetPassword.jsx`
69. `frontend/src/pages/Error404.jsx` — 🆕 not-found page (new requirement).

**Custom hooks** (mostly new, support live updates)
70. `frontend/src/hooks/usePolling.js` — 🆕 interval + AbortController cleanup.
71. `frontend/src/hooks/useFetch.js` — 🆕 generic fetch with cancel.
72. `frontend/src/hooks/useDebouncedValue.js` — 🆕 search debounce.
73. `frontend/src/hooks/useSoundEffects.js` — sound playback.
74. `frontend/src/hooks/useLobbyGames.js` — `filterLobbyMatches` (a plain helper, NOT a hook).

**Shared backend infrastructure**
75. `backend/project/middleware/error.js` — central error handler.
76. `backend/project/middleware/upload.js` — Multer in-memory image upload.
77. `backend/project/utils/customError.js` — `CustomError` (status + code).
78. `backend/project/validators/validate.js` — runs validators, returns 400.
79. `backend/project/config/constants.js` — limits, enums, coin amounts.
80. `backend/project/config/db.config.js` — `connectDB` / `disconnectDB`.
81. `frontend/src/main.jsx` — mounts app, wraps in providers.
82. `frontend/src/App.jsx` — routes, lazy loading, AdminRoute guard.

---

## 🟡 TIER 3 — Know roughly (Oblig 3 baseline, extended for exam)

**Game categories (18 fixed variants)** ♻️
83. `backend/project/models/GameCategory.js`
84. `backend/project/services/gameCategory.service.js`
85. `backend/project/controllers/gameCategory.controller.js`
86. `backend/project/routes/gameCategory.routes.js`
87. `backend/project/validators/gameCategory.validator.js`
88. `frontend/src/api/gameCategories.js`

**User (base CRUD; auth bits live in user.service above)** ♻️
89. `backend/project/models/User.js`
90. `backend/project/controllers/user.controller.js`
91. `backend/project/routes/user.routes.js`
92. `backend/project/validators/user.validator.js`
93. `frontend/src/api/users.js`

**Core pages** ♻️
94. `frontend/src/pages/Home.jsx`
95. `frontend/src/pages/Lobby.jsx`
96. `frontend/src/pages/CreateGame.jsx`
97. `frontend/src/pages/User.jsx`
98. `frontend/src/pages/Login.jsx`
99. `frontend/src/pages/Register.jsx`
100. `frontend/src/pages/ForgotPassword.jsx`

**Header / appearance / nav** ♻️
101. `frontend/src/components/Header.jsx`
102. `frontend/src/components/Navbar.jsx`
103. `frontend/src/components/Greeting.jsx`
104. `frontend/src/components/Appearance.jsx`
105. `frontend/src/contexts/AppearanceContext.jsx`

**Reusable UI components** ♻️
106. `frontend/src/components/Button.jsx`
107. `frontend/src/components/FormField.jsx`
108. `frontend/src/components/Spinner.jsx`
109. `frontend/src/components/Hero.jsx`
110. `frontend/src/components/GameCard.jsx`
111. `frontend/src/components/Layout.jsx`
112. `frontend/src/components/Footer.jsx`
113. `frontend/src/components/Copyright.jsx`
114. `frontend/src/components/ProfileImage.jsx`
115. `frontend/src/components/ConfirmDialog.jsx`
116. `frontend/src/components/GameVariantBadge.jsx`
117. `frontend/src/components/GameRulesSelector.jsx`
118. `frontend/src/components/RoundsSelector.jsx`
119. `frontend/src/components/TimeControlSelector.jsx`

---

## ⚪ TIER 4 — Just know it exists (don't study)

**Static content pages** ♻️
- `frontend/src/pages/AboutUs.jsx`
- `frontend/src/pages/AboutGame.jsx`
- `frontend/src/pages/Privacy.jsx`
- `frontend/src/pages/Terms.jsx`

**Seed scripts + data** 🆕 (know `npm run seed` exists and the order it runs)
- `backend/project/seed/db.seed.js`
- `backend/project/seed/users/user.seed.js` · `users/users.json`
- `backend/project/seed/gameCategories/gameCategory.seed.js` · `gameCategories/gamecategories.json`
- `backend/project/seed/trophies/trophy.seed.js`
- `backend/project/seed/tournaments/tournament.seed.js`
- `backend/project/seed/matches/match.seed.js`
- `backend/project/seed/comments/comment.seed.js`

**Build / config / tooling**
- `backend/project/package.json` · `package-lock.json` · `.env`
- `frontend/package.json` · `package-lock.json`
- `frontend/vite.config.js` · `eslint.config.js` · `index.html`
- `backend/.gitignore` · `frontend/.gitignore` · `./.gitignore`

**Styles (SCSS)** — know Sass is the preprocessor; don't read line-by-line
- `frontend/src/styles/main.scss` · `_global.scss` · `_reset.scss` · `_variables.scss` · `main.css` · `main.css.map`
- Component partials: `_Appearance.scss`, `_BanModal.scss`, `_Button.scss`, `_CommentForm.scss`, `_CommentItem.scss`, `_CommentList.scss`, `_ConfirmDialog.scss`, `_Footer.scss`, `_FormField.scss`, `_GameCard.scss`, `_Greeting.scss`, `_Header.scss`, `_Hero.scss`, `_Navbar.scss`, `_PlayerInfo.scss`, `_TournamentCard.scss`
- Page partials: `_Error404.scss`, `_Game.scss`, `_Home.scss`, `_Lobby.scss`, `_Login.scss`, `_Tournament.scss`, `_TournamentPage.scss`, `_User.scss`, `admin/_AdminLayout.scss`, `admin/_TournamentCreate.scss`

**Assets** — images + sounds
- `frontend/src/assets/logo.png`
- `frontend/public/`: `autumn-trophy.png`, `spring-trophy.png`, `summer-trophy.png`, `winter-trophy.png`, `valentines-trophy.png`, `default-img.jpg`, `home-hero.webp`, `lobby-hero.webp`, `rules-hero.webp`, `tournament-hero.webp`, `icon.png`, `team.png`, `spinner.gif`
- `frontend/public/sounds/`: `coffee time.wav`, `dbl-click.mp3`, `die-hold.mp3`, `die-roll.wav`, `finish-level-sfx.mp3`, `pling.mp3`

**REST test scripts** (handy for demoing endpoints, not study material)
- `backend/REST scripts/`: `activity.http`, `comments.http`, `gamecategories.http`, `leaderboard.http`, `matches.http`, `queue.http`, `scripts.md`, `tournaments.http`, `trophies.http`, `user.http`

**Docs / meta**
- `README.md` · `README.pdf` · `NOTES.md` · `instructions.md`
- `EXAM_PREP.md` · `EXAM_PREP.docx` · `EXAM_PREP.pdf` · `FILES_BY_PRIORITY.md` (this file)
