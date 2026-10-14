# ResearchHub — Research Collaboration Platform

**SE331 Software Engineering Design Capstone · Group 03 · Section D1 · Daffodil International University**

This repository contains **Module 1 — Research Network** of the Research Collaboration Platform:

| ID | Requirement | Owner | Where it lives |
|----|-------------|-------|----------------|
| FR-01 | User Registration & Profile (incl. **profile picture**) | Member 1 | `server/src/controllers/auth.controller.js`, `profile.controller.js` · `client/src/pages/Register.jsx`, `Login.jsx`, `ResearcherProfile.jsx`, `EditProfile.jsx`, `components/AvatarUploader.jsx` |
| FR-02 | Skills & Interest Management | Member 2 | `server/src/controllers/research.controller.js` · `client/src/pages/ResearchInterests.jsx`, `components/TagInput.jsx` |
| FR-03 | Researcher Search & Discovery | Member 3 | `server/src/controllers/researcher.controller.js` · `client/src/pages/Discover.jsx`, `components/ResearcherCard.jsx` |
| FR-04 | Recommendation System | Member 1 | `server/src/services/recommendation.service.js`, `controllers/recommendation.controller.js` · `client/src/pages/Recommendations.jsx`, `Dashboard.jsx` |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router, Axios, plain CSS (custom design system, CSS animations) |
| Backend | Node.js + Express.js (REST API) |
| Database | **MongoDB** with **Mongoose** ODM (local MongoDB or MongoDB Atlas) |
| Auth | JWT (Bearer token) + bcrypt password hashing |
| Uploads | Multer (memory) → profile picture stored in MongoDB |
| Deployment | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

> The proposal listed MySQL + Sequelize; per the team's decision the database is now **MongoDB + Mongoose**.

---

## Project structure

```
research-collab-platform/
├── server/                     # Express REST API
│   ├── src/
│   │   ├── config/             # env loading, MongoDB connection (with retries)
│   │   ├── models/User.js      # profile, skills, interests, avatar, indexes
│   │   ├── controllers/        # auth & profile (FR-01), research (FR-02), researcher (FR-03), recommendation (FR-04)
│   │   ├── services/           # recommendation engine (FR-04)
│   │   ├── middleware/         # auth (JWT), validation, upload, sanitize, rate limits, errors
│   │   ├── validators/         # express-validator rules, one file per feature
│   │   ├── routes/             # one route file per feature, mounted in routes/index.js
│   │   ├── utils/events.js     # event bus that keeps features decoupled
│   │   ├── scripts/seed.js     # demo researchers
│   │   ├── app.js              # express app + security middleware
│   │   └── server.js           # start-up & graceful shutdown
│   └── .env.example
├── client/                     # React (Vite) SPA
│   ├── src/
│   │   ├── api/client.js       # axios instance + endpoint helpers
│   │   ├── context/            # Auth & Toast providers
│   │   ├── components/         # Avatar, ResearcherCard, TagInput, ScoreRing, ...
│   │   ├── pages/              # Landing, Login, Register, Dashboard, Profile, ...
│   │   └── styles/             # base, layout, components, pages CSS
│   ├── vercel.json             # SPA routing on Vercel
│   └── .env.example
└── render.yaml                 # optional Render blueprint
```

---

## Running locally

### 1. Prerequisites
- Node.js **18+**
- MongoDB — either install [MongoDB Community](https://www.mongodb.com/try/download/community) locally **or** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).

### 2. Backend
```bash
cd server
cp .env.example .env          # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed                  # optional: adds 15 demo researchers (password: Demo@1234)
npm run dev                   # API on http://localhost:5000
```
Check it: open http://localhost:5000/api/health → `{"status":"ok","db":"connected"}`

**MongoDB Atlas URI example**
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/research_collab?retryWrites=true&w=majority
```
(In Atlas → *Network Access*, allow your IP, or `0.0.0.0/0` for Render.)

### Can't connect to MongoDB?
- Run **`npm run check-db`**. It tests DNS, port 27017, your IP allow-list and the password, then tells you exactly what to fix.
- To keep working while Atlas is blocked, set **`USE_MEMORY_DB=true`** in `server/.env`, run `npm install`, then `npm run dev`. This starts a real MongoDB on your computer (no install, data saved in `server/.mongo-data`) and adds the demo researchers automatically. Set it back to `false` once Atlas connects.

### 3. Frontend
```bash
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

Register a new account, add some skills/interests, and open **Recommended** — with the seed data you'll see ranked matches immediately.

---

## API reference (all routes prefixed with `/api`)

🔒 = requires `Authorization: Bearer <token>`

### FR-01 · Registration & profile
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account `{ name, email, password, role, institution, department }` |
| POST | `/auth/login` | Log in `{ email, password }` → `{ token, user }` |
| GET 🔒 | `/auth/me` | Current user |
| PATCH 🔒 | `/auth/password` | Change password `{ currentPassword, newPassword }` (invalidates older tokens) |
| GET 🔒 | `/profile` | My full profile |
| PUT 🔒 | `/profile` | Update headline, bio, institution, department, designation, location, role, education[], links{}, settings{} |
| PUT 🔒 | `/profile/avatar` | Upload profile picture (`multipart/form-data`, field `avatar`, JPG/PNG/WEBP ≤ 2 MB) |
| DELETE 🔒 | `/profile/avatar` | Remove profile picture |
| GET | `/users/:id/avatar` | Profile picture image (cached with ETag) |

### FR-02 · Skills & interests
| Method | Route | Description |
|---|---|---|
| GET 🔒 | `/profile/research` | My skills, domains, interests, expertise |
| PUT 🔒 | `/profile/research` | Replace all at once `{ skills:[{name,level}], researchDomains:[], interests:[], expertise:[] }` |
| POST 🔒 | `/profile/skills` | Add skill `{ name, level }` (level: beginner/intermediate/advanced/expert) |
| PATCH 🔒 | `/profile/skills/:skillId` | Update skill name/level |
| DELETE 🔒 | `/profile/skills/:skillId` | Remove skill |
| POST 🔒 | `/profile/tags/:field` | Add `{ value }` to `researchDomains` \| `interests` \| `expertise` |
| DELETE 🔒 | `/profile/tags/:field/:value` | Remove a value |
| GET 🔒 | `/taxonomy/suggestions?field=skills&q=py` | Autocomplete from platform usage + starter vocabulary |


### FR-03 · Search & discovery
| Method | Route | Description |
|---|---|---|
| GET 🔒 | `/researchers?q=&domain=&skill=&interest=&institution=&role=&sort=relevance\|newest\|name&page=&limit=` | Search with filters (comma-separated values = match any) and pagination |
| GET 🔒 | `/researchers/filters` | Facet values with counts (top domains, skills, interests, institutions) |
| GET 🔒 | `/researchers/:id` | Public profile |



---

## Non-functional requirements — how each is met

| NFR | Implementation |
|---|---|
| **1. Security** | bcrypt (12 rounds) password hashing · strong password policy (client + server) · JWT with expiry, HS256 pinned, and tokens invalidated after password change · `helmet` security headers · CORS whitelist (`CLIENT_ORIGIN`) · rate limiting (20 auth attempts / 15 min, 300 req/min general) · NoSQL-injection sanitiser strips `$`/`.` keys · input validation on every write (`express-validator`) · mass-assignment protection (whitelisted profile fields) · regex input escaped · upload type checked by **file signature (magic bytes)**, not just MIME · 2 MB upload & 100 KB JSON limits · email hidden from other users unless the owner enables it · generic login error (no account enumeration) · stack traces never sent in production |
| **2. Performance** | MongoDB indexes on all searchable fields · `.lean()` reads and field projections · paginated endpoints · recommendation candidate pre-filter + 60 s cache · gzip `compression` · avatar served with `Cache-Control` + `ETag` (304 responses) · client-side image crop/resize to 512 px before upload · React route-level code splitting (`lazy`) · debounced search input · request cancellation (`AbortController`) |
| **3. Usability** | Clean, consistent design system · responsive layout (desktop sidebar → mobile drawer) · skeleton loaders, toasts, inline field errors, empty states with next actions · password strength meter · autocomplete for skills/interests · keyboard support (Enter/Backspace/arrow keys in tag inputs, visible focus rings) · ARIA labels/roles · animations respect `prefers-reduced-motion` · onboarding hint after registration · profile-completeness checklist |
| **4. Reliability** | Mongoose schema validation and limits · unique email index · centralised error handler (consistent JSON errors) · DB connection retries + reconnect logging · graceful shutdown on SIGTERM/SIGINT · `/api/health` endpoint for Render health checks · profile pictures stored **in MongoDB**, so they survive redeploys on Render's ephemeral disk |
| **5. Scalability** | Stateless JWT auth (any number of API instances) · connection pooling (`maxPoolSize`) · indexed queries + pagination · candidate limit in recommendations · all configuration through environment variables · works with MongoDB Atlas clusters |
| **6. Maintainability** | Layered backend: routes → validators → controllers → services → models · recommendation engine isolated in its own service · shared utilities (`ApiError`, `asyncHandler`, text helpers) · frontend split into api / context / components / pages / styles · CSS design tokens in one place · documented API & seed script |

---

## Deployment

**Database — MongoDB Atlas:** create a free cluster, a database user, allow network access, copy the connection string.

**Backend — Render:** New → Web Service → connect the repo → Root directory `server`, Build `npm install`, Start `npm start`, Health check `/api/health`. Environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` (long random string), `CLIENT_ORIGIN=https://<your-app>.vercel.app`. (Or use the included `render.yaml`.)

**Frontend — Vercel:** New Project → root directory `client` → framework *Vite* → env var `VITE_API_URL=https://<your-api>.onrender.com/api`. `vercel.json` already handles client-side routing.

---

## Demo accounts (after `npm run seed`)
All use password **`Demo@1234`**, e.g. `farhana.rahman@demo.researchhub.edu`, `tanvir.ahmed@demo.researchhub.edu`, `kamal.hossain@demo.researchhub.edu`.
Remove them with `npm run seed -- --fresh` (re-creates) or delete users with the `@demo.researchhub.edu` domain.
