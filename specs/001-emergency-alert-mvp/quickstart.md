# Quickstart Guide: Family Alert

## 1. Local Development Setup

### Prerequisites
- Node.js 20+ LTS
- npm 10+ or pnpm

### Step-by-Step

1. **Clone & Install**:
   ```bash
   git clone https://github.com/henrylai/family_alert.git
   cd family_alert

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

2. **Environment Variables**:
   In `backend/.env`:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_PATH=./data/family_alert.sqlite
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=mailto:admin@example.com
   CLIENT_URL=http://localhost:5173
   ```

   In `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

3. **Generate VAPID Keys**:
   ```bash
   npx web-push generate-vapid-keys
   ```

4. **Run Development Servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```
   Open `http://localhost:5173` on your browser or mobile device on the local network.

---

## 2. Deploying to Railway (railway.app)

The repository includes a root `Dockerfile` and `railway.json` for seamless deployment.

### Option A: Railway Dashboard (GitHub Integration)
1. Go to [railway.app](https://railway.app) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and choose `henrylai/family_alert`.
3. Railway automatically detects the root `Dockerfile`.
4. In the Railway dashboard under **Variables**, set:
   - `NODE_ENV`: `production`
   - `VAPID_PUBLIC_KEY`: `<generated-public-key>`
   - `VAPID_PRIVATE_KEY`: `<generated-private-key>`
   - `VAPID_SUBJECT`: `mailto:support@yourdomain.com`
   - `DATABASE_PATH`: `/app/data/family_alert.sqlite` (or attach a Railway PostgreSQL service and set `DATABASE_URL`)
5. If using SQLite, attach a Railway **Persistent Volume** mounted at `/app/data` to persist groups and incidents across deployments.
6. Railway automatically provisions a public domain (e.g. `https://family-alert-production.up.railway.app`).

### Option B: Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
The health check endpoint `/health` will confirm the server is operational.
