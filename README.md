# 🌴 Siargao Pixel Life: Island of Hope

> *“Play, Protect, and Rebuild Our Island.”*

A browser-based **3D educational adventure game** inspired by Siargao Island, Surigao del Norte, Philippines.
Players explore nine real destinations, surf Cloud 9, kayak Sugba Lagoon, talk to locals, take conservation quizzes and join cleanups that **visibly change the island**. Every action is validated by the backend and saved in MySQL.

> Whether you are a local resident or a tourist, Siargao is everyone's responsibility.

---

## ✨ Features

| Area | What is playable |
| --- | --- |
| **Main menu** | Animated 3D Cloud 9 at sunset (boardwalk, viewing tower, breaking waves, surfers), Start Game / Login / Create Account / About / Settings |
| **Accounts** | Register (username, email, password, confirm, **role**), login, JWT sessions, saved progress |
| **Roles** | 🏡 *Local Resident (Siargao-nun)* and 🎒 *Tourist / Visitor* — stored in the DB, drive recommended missions |
| **3D world** | Third-person character (walk, run, jump, interact), orbit camera, 9 hand-built destinations with unique terrain and props |
| **Destinations** | Cloud 9 · Magpupungko Rock Pools · Sugba Lagoon · Naked Island · Guyam Island · Daku Island · Pacifico Beach · Sohoton Cove · Taktak Falls (lazy-loaded) |
| **Surfing** | Real mini-game: choose a board, paddle (W), time the take-off (Space), balance and carve (A/D), stay in the pocket. Tutorial, Beginner, Intermediate and Free modes, badges and leaderboard |
| **Kayaking** | Sugba Lagoon buoy loop with floating-litter pickup |
| **Quests** | 18 location-based missions in 8 categories, objectives tracked by the server, accept/track/abandon/claim, repeatable cleanups |
| **Cleanliness** | Per-destination meter tied to validated pickups/missions; litter amount and water murkiness change with it; slow decay so communities keep cleaning |
| **Marine protection** | 8 server-graded quizzes, marine conservation records, turtle/reef/jellyfish education |
| **NPCs** | 15 community characters with dialogue, quest markers (! ? ✓), educational info, quizzes, shops |
| **Progression** | Levels, XP, coins, eco points, surfing skill, badges, achievements, certificate, surfboards, cosmetics, local products |
| **Community dashboard** | Shared island progress computed only from validated records |
| **Admin dashboard** | Role-protected: players (filter by role), destinations, missions (objective builder), activities, mission/cleanliness/marine/surf records |
| **Mobile** | Virtual joystick, jump / interact / run buttons, touch camera; graphics quality presets |

### 🎨 Graphics
- Procedural **detail materials** (world-space noise + bump mapping) for sand, porous limestone, bark and foliage — no texture downloads needed
- Ocean shader with depth-based colour (crystal shallows → turquoise → deep blue), **caustics**, sky reflections, sun glitter, ripples and shoreline foam
- Gradient sky dome with sun halo and drifting cumulus clouds; Day / Sunset / Cycle lighting
- Instanced vegetation: coconut palms with leaflet fronds and wind sway, dense rainforest canopy, grass tufts, seaweed wrack lines
- Post-processing on Medium/High: ambient occlusion (High), bloom, filmic tone mapping, colour grade, vignette, anti-aliasing
- **Pacifico Beach, Magpupungko and Sugba Lagoon are modelled on real photos**, which are also shown on the travel loading screen and in the island map (`frontend/public/images/destinations/`)

---

## 🧱 Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS, Three.js, React Three Fiber, @react-three/drei, React Router, Zustand
- **Backend:** Node.js, Express, REST, JWT (HS256) + bcrypt, zod validation, helmet, rate limiting
- **Database:** MySQL 8 (managed with MySQL Workbench) — also tested on MariaDB 10.11
- **3D assets:** stylized low-poly models built procedurally in code; organised so they can be replaced by Blender GLB/GLTF files

No Python/Django — JavaScript end to end.

---

## 📁 Project structure

```
siargaoGame/
├── backend/
│   ├── src/
│   │   ├── config/        env + MySQL pool
│   │   ├── controllers/   auth, players, spots, missions, activities, game (npc/quiz/cleanup), surfing, shop, community, admin
│   │   ├── routes/        REST routes (index.js)
│   │   ├── middleware/    auth (JWT, admin), validation, errors
│   │   ├── models/        data access (users, profiles, spots, missions, rewards)
│   │   ├── services/      mission engine (validated events), cleanup service
│   │   ├── data/          content.js — seed content (spots, NPCs, quizzes, missions, shop)
│   │   └── utils/
│   ├── scripts/           generate-sql.js, init-db.js, create-admin.js
│   ├── tests/             end-to-end API test
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/         menu, login, register, about, settings, game, community, admin
│   │   ├── scenes/        DestinationScene, MenuScene, Atmosphere (sky, sun, fog)
│   │   ├── environments/  terrain, ocean shader, props, layouts/ (one file per destination)
│   │   ├── characters/    Humanoid, Player controller, NPC, sprite labels
│   │   ├── activities/    surfing/ (engine, wave, HUD), kayak/
│   │   ├── missions/      trash, info boards, repair points, markers
│   │   ├── components/    hud/, modals/, admin/, ui/
│   │   ├── game/          store (zustand), input, registry, player state
│   │   ├── contexts/      Auth, Settings
│   │   ├── services/      api client, procedural audio
│   │   └── styles/
│   └── .env.example
└── database/
    └── siargao_pixel_life.sql   schema + seed data (MySQL Workbench ready)
```

---

## 🚀 Getting started

### 1. Requirements
- Node.js 20+ and npm
- MySQL Server 8 (+ MySQL Workbench)

### 2. Database
**Option A – MySQL Workbench:** *File → Open SQL Script →* `database/siargao_pixel_life.sql` → *Execute* (⚡). It creates the `siargao_pixel_life` database, all tables and seed content.

**Option B – command line:**
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your MySQL user/password and a long random `JWT_SECRET`, then:
```bash
npm run install:all
```
```bash
npm run db:init
```

Create an administrator account (for the admin dashboard):
```bash
npm --prefix backend run create-admin -- admin admin@example.com "a-strong-password"
```

### 3. Run
In two terminals:
```bash
npm run dev:backend
```
```bash
npm run dev:frontend
```
Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend on port 4000.

### 4. Tests
With the backend running against a seeded database:
```bash
npm test
```
The test registers a player, plays through *Maintain Cloud 9* (trash, NPC, boardwalk repairs, quiz), checks that cheating is rejected (duplicate pickups, impossible surf scores, unowned boards, buying local products away from Daku) and that admin routes are protected.

### Production build
```bash
npm run build
```
Serve `frontend/dist` with any static host and set `VITE_API_URL` to your API URL (and `CORS_ORIGIN` on the backend).

---

## 🎮 Controls

| Desktop | Mobile |
| --- | --- |
| **W A S D** move · **Shift** run · **Space** jump | Left joystick move · RUN toggle · ⤒ jump |
| **E** interact (hold to repair) | **E** button |
| Mouse drag rotate camera · wheel zoom | Drag screen to rotate |
| Surfing: **W** paddle, **Space** catch, **A/D** steer | Joystick paddle/steer, **CATCH** button |
| **Esc** pause menu / close windows | ⚙️ button |

---

## 🔐 Anti-cheat: the server decides

The client never sends rewards, XP or cleanliness values.

- **Trash pickups** – each destination has a fixed number of deterministic litter spawn points. The client sends only an index; the server checks range, a 60-minute per-item respawn window and a minimum interval between pickups, then updates cleanliness (+0.4%), eco points and missions.
- **Missions** – progress only advances through validated events (`collect_trash`, `talk_npc`, `quiz`, `activity`, `surf`, `visit`). `POST /missions/:id/complete` re-checks every objective and grants rewards from the database.
- **Quizzes** – answers are stored and graded server-side; XP is granted on the first pass only.
- **Surfing** – challenge pass rules live on the server, scores must be plausible for the ride duration and carves, the board must be owned, and rides can't be submitted faster than they could be surfed.
- **Activities** – per-type validation (info-board indices, repair points, kayak checkpoints and minimum time).
- **Shop** – prices and ownership checked in a transaction; local products only purchasable at their destination.
- **Cleanliness** – only changes through those records (admins can't edit it either) and decays slowly over time.

---

## 🌐 REST API

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | username, email, password, confirmPassword, role |
| POST | `/api/auth/login` | login (username or email), password |
| GET | `/api/auth/me` | current profile |
| GET / PUT | `/api/players/profile` | update role / equipped items (ownership checked) |
| GET | `/api/players/missions` | my mission progress |
| GET | `/api/players/inventory` | badges, boards, cosmetics, products |
| GET | `/api/tourist-spots`, `/api/tourist-spots/:id` | `:id` = numeric id or key (e.g. `cloud9`) |
| GET | `/api/tourist-spots/:id/trash` | visible litter for this player |
| POST | `/api/tourist-spots/:id/visit` | travel; satisfies visit objectives |
| GET | `/api/missions`, `/api/missions/:id` | with my status when logged in |
| POST | `/api/missions/:id/start` · `/complete` · `/abandon` | |
| GET | `/api/activities` | |
| POST | `/api/activities/:id/complete` | explore / maintenance / kayak |
| POST | `/api/npcs/:key/talk` | |
| GET / POST | `/api/quizzes/:key`, `/api/quizzes/:key/submit` | |
| POST | `/api/cleanup/collect` | `{ spotId, trashIndex }` |
| GET / POST | `/api/shop/items`, `/api/shop/buy` | |
| GET | `/api/community/progress`, `/api/community/cleanliness` | public dashboard |
| POST | `/api/surfing/submit-score` | |
| GET | `/api/surfing/leaderboard` | `?spot=cloud9` |
| * | `/api/admin/...` | stats, players, tourist-spots, missions, activities, records/:type, lookups (admin only) |

---

## 🗄️ Database

Normalized MySQL schema with foreign keys and indexes:
`users`, `player_profiles`, `tourist_spots`, `missions`, `mission_progress`, `activities`, `cleanliness_records`, `marine_conservation_records`, `rewards`, `surfing_records`, plus supporting tables `npcs`, `quizzes`, `quiz_questions`, `quiz_attempts`, `shop_items`, `trash_pickups`, `activity_records`, `spot_visits`.

The seed content lives in `backend/src/data/content.js`. After editing it, regenerate the SQL file:
```bash
npm run db:generate-sql
```

---

## 🧩 Adding content

- **New mission:** use the admin dashboard (*Missions → Create mission*). The objective builder only offers NPCs, quizzes and activities that exist at the chosen destination, and the server validates them.
- **New destination:** add it in *Admin → Destinations* and choose an existing 3D scene theme, or create a new layout file in `frontend/src/environments/layouts/` and register it in `environments/index.js`.

### Replacing placeholder models with Blender assets
All characters and props are small React components (`characters/Humanoid.jsx`, `environments/props.jsx`). To use Blender models, export **GLB**, put them in `frontend/public/models/`, and swap the component body for drei's `useGLTF('/models/your-model.glb')` while keeping the same props. The player/NPC animation contract (`anim.current.speed`, `pose`) can drive GLB animation clips via `useAnimations`.

---

## 🛣️ Development phases

| Phase | Status |
| --- | --- |
| 1. Frontend foundation (menu, 3D island, movement, camera, Cloud 9, surfing) | ✅ |
| 2. Accounts (signup, login, roles, profile) | ✅ |
| 3. Gameplay (quests, NPC dialogue, cleanup, surfing, destinations, inventory, rewards) | ✅ |
| 4. Backend & database (Express, MySQL, JWT, REST, saves, mission persistence) | ✅ |
| 5. Community & education (cleanliness, marine conservation, dashboard, quizzes) | ✅ |
| 6. Admin dashboard | ✅ |
| 7. Testing & optimization (API tests, lazy loading, quality presets, mobile controls) | ✅ first pass |

Ideas for next iterations: authored Blender GLB characters and animations, sound effects recorded on location, Filipino/Surigaonon language options, multiplayer presence.

---

*Educational project. Destinations are inspired by real places; facts are simplified for learning. Please follow local rules and guides when visiting Siargao.*

*Destination photos in `frontend/public/images/destinations/` were supplied by the project owner as references; make sure you have permission from the photographers before publishing the game publicly.*
