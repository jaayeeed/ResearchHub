# Push 1 — FR-01 · Member 1 (Khaphia Sultana)

Project setup (server + client), MongoDB connection, User model, JWT auth, register/login, profile editing, profile picture upload, settings, design system and all security/performance middleware.

**Branch:** `feature/fr-01-registration-profile`  
**Commit message:** `feat(FR-01): user registration, login and academic profile with profile picture`

Copy everything in this folder (except this FILES.md) into the root of your cloned repository, keeping the folder structure. Say **Yes / Replace** when Windows asks to overwrite files.

## New files (65)

- `.gitignore`
- `README.md`
- `client/.env.example`
- `client/index.html`
- `client/package.json`
- `client/public/favicon.svg`
- `client/src/App.jsx`
- `client/src/api/client.js`
- `client/src/components/AppLayout.jsx`
- `client/src/components/Avatar.jsx`
- `client/src/components/AvatarUploader.jsx`
- `client/src/components/Feedback.jsx`
- `client/src/components/FormControls.jsx`
- `client/src/components/Icon.jsx`
- `client/src/components/NetworkHero.jsx`
- `client/src/components/ScoreRing.jsx`
- `client/src/context/AuthContext.jsx`
- `client/src/context/ToastContext.jsx`
- `client/src/hooks/useDebounce.js`
- `client/src/main.jsx`
- `client/src/pages/AuthShell.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/EditProfile.jsx`
- `client/src/pages/Landing.jsx`
- `client/src/pages/Login.jsx`
- `client/src/pages/NotFound.jsx`
- `client/src/pages/Register.jsx`
- `client/src/pages/ResearcherProfile.jsx`
- `client/src/pages/Settings.jsx`
- `client/src/styles/base.css`
- `client/src/styles/components.css`
- `client/src/styles/layout.css`
- `client/src/styles/pages.css`
- `client/src/utils/format.js`
- `client/vercel.json`
- `client/vite.config.js`
- `render.yaml`
- `server/.env.example`
- `server/package.json`
- `server/src/app.js`
- `server/src/config/db.js`
- `server/src/config/env.js`
- `server/src/controllers/auth.controller.js`
- `server/src/controllers/profile.controller.js`
- `server/src/middleware/auth.js`
- `server/src/middleware/error.js`
- `server/src/middleware/rateLimiters.js`
- `server/src/middleware/sanitize.js`
- `server/src/middleware/upload.js`
- `server/src/middleware/validate.js`
- `server/src/models/User.js`
- `server/src/routes/auth.routes.js`
- `server/src/routes/index.js`
- `server/src/routes/profile.routes.js`
- `server/src/scripts/check-db.js`
- `server/src/scripts/seed.js`
- `server/src/server.js`
- `server/src/utils/ApiError.js`
- `server/src/utils/asyncHandler.js`
- `server/src/utils/events.js`
- `server/src/utils/text.js`
- `server/src/utils/token.js`
- `server/src/validators/auth.validators.js`
- `server/src/validators/common.validators.js`
- `server/src/validators/profile.validators.js`
