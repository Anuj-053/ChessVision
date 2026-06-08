# ♔ ChessVision — Chess Improvement Platform

A full-stack chess improvement web app with PGN analysis, engine play, blindfold training, and notation-only mode.

---

## Tech Stack

**Frontend:** React 18 + Vite + Tailwind CSS + chess.js + react-chessboard + Zustand  
**Backend:** Node.js + Express + MongoDB + Mongoose + JWT  
**Engine:** Stockfish 18 (WASM) running in a Web Worker via UCI protocol

---

## Project Structure

```
chessvision/
├── backend/
│   ├── config/
│   │   └── db.js                     # Mongoose connection
│   ├── controllers/
│   │   ├── authController.js         # signup, login, getMe
│   │   └── gameController.js         # save, list, stats, get, update, delete
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT Bearer verification
│   │   └── rateLimiter.js            # 10 req / 15 min on auth routes
│   ├── models/
│   │   ├── User.js                   # username, email, bcrypt password
│   │   └── Game.js                   # pgn, fen, mode, result, analysis[]
│   ├── routes/
│   │   ├── auth.js                   # POST /signup  POST /login  GET /me
│   │   └── games.js                  # CRUD + PATCH for analysis update
│   ├── server.js
│   └── .env
│
└── frontend/
    ├── public/
    │   ├── stockfish.js              # Stockfish 18 lite (browser worker script)
    │   └── stockfish.wasm            # Stockfish 18 WASM binary
    └── src/
        ├── store/
        │   └── authStore.js          # Zustand + localStorage persist
        ├── services/
        │   ├── api.js                # Axios instance + JWT interceptor
        │   ├── authService.js        # signup / login calls
        │   └── gameService.js        # save / get / update / delete calls
        ├── hooks/
        │   ├── useStockfish.js       # Web Worker wrapper (UCI protocol)
        │   └── useChessGame.js       # chess.js game state + move history
        ├── utils/
        │   ├── moveClassifier.js     # Brilliant / Good / Inaccuracy / Mistake / Blunder
        │   └── openingDetector.js    # ~20 opening names detected from move list
        ├── pages/
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   ├── Dashboard.jsx         # Stats + mode selector + recent games
        │   └── GameHistory.jsx       # Paginated, filterable, deletable game log
        ├── modes/
        │   ├── AnalyzerMode.jsx      # PGN paste/upload + engine analysis
        │   ├── PlayMode.jsx          # Play vs computer (Elo-based difficulty)
        │   ├── BlindfoldMode.jsx     # Hidden board, type moves in notation
        │   └── NotationMode.jsx      # Board visible, enter moves via text input
        ├── components/
        │   ├── Board/
        │   │   ├── ChessBoard.jsx    # react-chessboard wrapper
        │   │   └── EvalBar.jsx       # Animated centipawn eval bar
        │   ├── GameControls/
        │   │   ├── MoveHistory.jsx   # Scrollable move list with classification symbols
        │   │   └── CapturedPieces.jsx
        │   ├── Modals/
        │   │   └── GameEndModal.jsx  # Checkmate / stalemate / draw / resign
        │   └── Layout/
        │       └── Navbar.jsx
        ├── App.jsx                   # Routes + protected route guards
        └── main.jsx
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free M0 tier works)

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure backend environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chessvision
JWT_SECRET=pick_a_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Add Stockfish engine files

The Stockfish WASM files must be in `frontend/public/`:

```
frontend/public/stockfish.js      ← from stockfish npm package: bin/stockfish-18-lite-single.js
frontend/public/stockfish.wasm    ← from stockfish npm package: bin/stockfish-18-lite-single.wasm
```

To get them:
```bash
cd frontend
npm install stockfish
cp node_modules/stockfish/bin/stockfish-18-lite-single.js  public/stockfish.js
cp node_modules/stockfish/bin/stockfish-18-lite-single.wasm public/stockfish.wasm
```

> These files are served statically by Vite from the `public/` folder.
> The hook loads stockfish as `new Worker('/stockfish.js')` — a classic (non-module)
> worker that auto-detects it's in a worker context and communicates via plain UCI strings.

### 4. Run

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

The Vite dev server proxies `/api` → `http://localhost:5000` automatically, so no CORS setup is needed in development.

### 5. Verify engine works

Open `http://localhost:5173/test-engine.html` — you should see the engine respond with `uciok`, `readyok`, and then a `bestmove` within a few seconds. If you see errors here the WASM files are missing or in the wrong folder.

---

## Features

### Auth
- JWT auth, 7-day expiry, stored in localStorage via Zustand persist
- bcrypt password hashing (12 salt rounds)
- Rate limiting: 10 requests / 15 min on auth routes
- Protected routes redirect to `/login`

### Dashboard
- Stats: Total Games · Wins · Losses · Win Rate
- Mode selector cards with descriptions
- Last 5 games table with result badges 

### PGN Analyzer
- Paste PGN text or upload `.pgn` / `.txt` file
- Replay game move by move: Start / Prev / Next / End
- Stockfish evaluates each position at depth 12
- Best move shown as gold arrow on board
- Move classification: Brilliant `!!` / Good / Inaccuracy `?!` / Mistake `?` / Blunder `??`
- Separate accuracy % shown for White and Black
- Opening name detected from move list
- Cancel analysis mid-way with Cancel button
- **If opened from game history or Play mode:** updates the existing game record (no duplicate entry)
- **If opened with a fresh PGN paste:** creates one new record, no duplicates on re-analysis

### Play vs Computer
- Choose White / Black / Random
- Four difficulty levels using `UCI_LimitStrength` + `UCI_Elo`:

  | Level | Elo | Depth | Behaviour |
  |-------|-----|-------|-----------|
  | Beginner | ~1320 | 4 | Misses tactics, drops pieces |
  | Intermediate | ~1700 | 8 | Solid club play, occasional slip |
  | Advanced | ~2200 | 12 | Expert strength, rare errors |
  | Master | unlimited | 18 | Full engine strength |

- Click-to-move or drag-and-drop pieces
- Legal move highlights on square click
- Captured pieces display
- Move history sidebar with opening name
- Undo button (reverts both your move and engine response)
- Resign button
- Game-end modal with **Analyse Game** button — opens the exact game in the analyser (no duplicate history entry)
- Auto-saves result to DB on game over

### Blindfold Training
- Board completely hidden (dark placeholder)
- Type moves in algebraic notation: `e4`, `Nf3`, `O-O`, `O-O-O`
- Peek button reveals board for 2 seconds
- Invalid move shows clear error message
- Engine plays at chosen difficulty
- Auto-saves to DB on game end

### Notation Mode
- Full board and pieces always visible
- Enter moves via text input instead of dragging
- Practise reading and writing algebraic notation
- Engine plays normally at chosen difficulty
- Auto-saves to DB on game end

### Game History
- Paginated list (10 per page)
- Filter by mode (Analyzer / vs Bot / Blindfold / Notation) and result (Win / Loss / Draw)
- Each row shows: mode, opening, move count, color, level, accuracy, result, date
- **Analyse** button opens game in PGN Analyser (updates existing record, no duplicate)
- **Delete** button with confirmation

---

## API Routes

### Auth (rate limited)
```
POST /api/auth/signup    Register new user
POST /api/auth/login     Login, returns JWT + user object
GET  /api/auth/me        Get current user (protected)
```

### Games (all protected by JWT)
```
POST   /api/games          Save new game
GET    /api/games          List games  ?page=1&limit=10&mode=play&result=win
GET    /api/games/stats    Aggregate stats + 5 recent games
GET    /api/games/:id      Single game with full analysis array
PATCH  /api/games/:id      Update analysis, accuracy, opening on existing game
DELETE /api/games/:id      Delete game
```

---

## Stockfish Integration

Stockfish runs in a Web Worker to avoid blocking the main UI thread.

**How it works:**
1. `frontend/public/stockfish.js` is loaded as `new Worker('/stockfish.js')` — a classic (non-module) worker
2. The script auto-detects it's in a worker context (`window.document` is undefined) and enters UCI mode
3. It fetches `stockfish.wasm` from the same origin automatically
4. Communication is via plain UCI strings — `postMessage('go depth 12')` / `onmessage` receives UCI output lines

**`useStockfish` hook exposes:**
- `getBestMove(fen, depth, elo, callback)` — for gameplay; sets `UCI_LimitStrength` + `UCI_Elo` when elo is not null
- `analyzePosition(fen, depth, onInfo, onBestMove)` — for sequential PGN analysis
- `parseEval(infoLine, sideToMove)` — converts UCI score to centipawns from White's POV
- `stop()` — cancels current search

**Key constraint:** Only one search runs at a time. Calling either method while a search is active stops the current search first.

---

## Move Classification

Stockfish reports eval from the side-to-move's perspective. `parseEval` normalises this to always be from White's POV (positive = White ahead). `classifyMove` then computes the centipawn loss for the side that just moved:

| Classification | CP Loss | Symbol | Colour |
|----------------|---------|--------|--------|
| Brilliant | improves by 50+ cp | `!!` | Cyan |
| Good | loss ≤ 10 cp | — | Green |
| Inaccuracy | 11–50 cp loss | `?!` | Yellow |
| Mistake | 51–150 cp loss | `?` | Orange |
| Blunder | 150+ cp loss | `??` | Red |

Accuracy is calculated **per player** (White = even-indexed moves, Black = odd-indexed), not averaged across both.

---

## Deployment

### Frontend → Vercel

```bash
# Add environment variable in Vercel dashboard:
VITE_API_URL=https://your-backend.render.com/api
```

### Backend → Render

```
Environment variables:
  MONGODB_URI  = mongodb+srv://...
  JWT_SECRET   = ...
  CLIENT_URL   = https://your-frontend.vercel.app
  NODE_ENV     = production
```

### Database → MongoDB Atlas
1. Create a free M0 cluster
2. Add `0.0.0.0/0` to IP allowlist (or Render's specific outbound IPs)
3. Copy the connection string into `MONGODB_URI`

---

## Security

- Passwords hashed with bcrypt (12 rounds), never returned in API responses
- JWT with 7-day expiry; verified on every protected route
- Rate limiting on auth routes prevents brute-force
- CORS restricted to `CLIENT_URL` origin only
- Input validation via `express-validator` on signup and login
- All game routes require valid JWT; users can only access their own games