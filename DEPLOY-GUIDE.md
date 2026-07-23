# Deploying Knighted to a Live Staging Site — Step by Step

Written to be followed start to finish with zero prior deployment experience. Take it slowly; each step says exactly what to click and what to copy where. Total time: about an hour, most of it making free accounts.

## What we're building

One project on **Railway** (a hosting website) containing two things:

1. A **Postgres database** (where your data lives).
2. Your **app** — a single service that serves *both* websites and the API together. Thanks to the setup work already done, this is one "box," not three.

When finished you'll have a public link like `https://knighted-production.up.railway.app` where:
- `/` is the Knighted Resume site
- `/knighted-jobs/` is the Knighted Jobs site

We'll use Railway's free URL for now. Real domains (theknightedresume.com etc.) can come later.

---

## STEP 0 — Push the latest code (2 minutes)

I just added deploy config to your folder. Get it onto GitHub so Railway can see it. In your terminal:

```
cd C:\Users\kiran\Knighted
git add -A
git commit -m "Add single-service deploy setup"
git push
```

---

## STEP 1 — Collect your keys (about 25 minutes)

You'll gather **4 secret keys**. Open a blank Notepad file and paste each one in as you go — you'll need them all in Step 2. (Keep this file private; delete it after.)

### 1A · Clerk — handles login/signup  *(required)*
1. Go to **clerk.com** → **Sign up**.
2. Click **Create application**. Name it `Knighted`. Turn on **Email** and **Google** (or whatever sign-in options you want). Click **Create**.
3. On the left, click **API Keys**.
4. Copy the **Publishable key** (starts with `pk_test_...`) → paste in Notepad, label it "CLERK PUBLISHABLE".
5. Copy the **Secret key** (starts with `sk_test_...`) → paste in Notepad, label it "CLERK SECRET".

### 1B · Anthropic — the AI  *(required)*
1. Go to **console.anthropic.com** → sign up.
2. Click **Billing** (left menu) → add a small amount of credit, like $5. (AI calls cost fractions of a cent; this lasts a long time in testing.)
3. Click **API Keys** → **Create Key** → name it `Knighted` → **Copy** the key (starts with `sk-ant-...`) → paste in Notepad as "ANTHROPIC".
   - Note: you only see this key once. If you lose it, just make a new one.

### 1C · Resend — sends emails  *(required — the app won't start without it)*
1. Go to **resend.com** → sign up.
2. Click **API Keys** → **Create API Key** → name it `Knighted` → **Add** → copy the key (starts with `re_...`) → paste in Notepad as "RESEND".
   - (You can set up a "sending domain" later. The key by itself is enough to launch.)

### 1D · Stripe — payments  *(SKIP for now)*
Your app runs perfectly fine without Stripe — the paid-plan buttons just won't charge anyone yet. We'll add this later when you're ready to take money. Nothing to do here today.

---

## STEP 2 — Set up Railway (about 25 minutes)

### 2A · Create the project
1. Go to **railway.com** → **Login** → **Login with GitHub** (use the same GitHub account that has your `knighted` repo).
2. Click **New Project** → **Deploy from GitHub repo**.
3. If asked, click **Configure GitHub App** and give Railway access to your `knighted` repo, then come back.
4. Pick **kiranpalsidhu-code/knighted**.
5. Railway will start trying to build it. It may fail this first time because there's no database or keys yet — that's totally normal, keep going.

### 2B · Add the database
1. In your project, click **+ New** (or **Create**) → **Database** → **Add PostgreSQL**.
2. Wait ~30 seconds for it to say it's ready. You now have two boxes in your project: your **app** and **Postgres**.

### 2C · Add your keys to the app
1. Click your **app** box (the one named after your repo, *not* Postgres).
2. Click the **Variables** tab.
3. Click **Raw Editor** (easiest), and paste in the block below — replacing each `...` with the real value from your Notepad:

```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
CLERK_PUBLISHABLE_KEY=pk_test_...your clerk publishable...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...same clerk publishable, again...
CLERK_SECRET_KEY=sk_test_...your clerk secret...
ANTHROPIC_API_KEY=sk-ant-...your anthropic key...
RESEND_API_KEY=re_...your resend key...
```

   - Leave `DATABASE_URL=${{ Postgres.DATABASE_URL }}` exactly as written — that magic text tells Railway to use your Postgres box automatically.
   - Yes, the Clerk publishable key goes in **twice** (once for the server, once labeled `VITE_` for the website). That's on purpose.
   - Don't set `PORT` — Railway fills that in for you.
4. Click **Save** / **Update Variables**. Railway will redeploy automatically.

### 2D · Get your public link
1. Click your app box → **Settings** tab → **Networking** section.
2. Under **Public Networking**, click **Generate Domain** (pick the port `5000` if it asks, or just accept the default).
3. Copy the URL it gives you (like `https://knighted-production.up.railway.app`). This is your site.

---

## STEP 3 — Create the database tables (one time, 3 minutes)

Your database is empty right now, so the app can save/read data you need to create its tables once.

1. Click your **app** box → **Settings** tab → find **Deploy** → **Custom Start Command**.
2. Set it to exactly:

   ```
   pnpm run db:push && pnpm start
   ```

3. Go to the **Deployments** tab → click the **⋮** menu on the latest deploy → **Redeploy**. Wait for it to finish (watch the logs; you want to see "Server listening").
4. Once it's up, go **back** to that Custom Start Command and change it back to just:

   ```
   pnpm start
   ```

   (This stops it from re-running the table setup on every future deploy.) No need to redeploy again right now.

That's it — the app automatically fills the jobs site with 100 sample listings the first time it boots with a working database.

> Stuck on this step? You can paste me your Postgres connection string (Railway → Postgres box → **Variables** → the `DATABASE_URL` value) and I'll create the tables for you from here. It's a secret, so rotate/reset it afterward if you like.

---

## STEP 4 — Try it out

Open your Railway URL in a browser:

- **`/`** → the Resume site homepage
- **`/pricing`**, **`/blog`** → these are the SEO-optimized pages we built
- **`/knighted-jobs/`** → the Jobs site, with the 100 seeded jobs
- Click **Sign up**, make an account (that's Clerk working), create a resume, and try **AI Tailor** (that's Anthropic working).

If all of that works, congratulations — you have a live staging site. 🎉

---

## If something goes wrong

| What you see | What it means / fix |
|---|---|
| Build fails, log says **"BASE_PATH … required"** | Railway isn't using the repo's `railway.json`. In app → Settings → Build, make sure the Build Command is `pnpm run build:deploy`. |
| App keeps restarting, log says **"RESEND_API_KEY / ANTHROPIC_API_KEY / DATABASE_URL must be set"** | That variable is missing or misspelled in Step 2C. Fix it and redeploy. |
| Site loads but **login/signup is broken or blank** | `VITE_CLERK_PUBLISHABLE_KEY` was missing when it built. Add it (Step 2C) and redeploy. |
| Jobs page or dashboard shows errors, API returns **500** | The database tables aren't created yet — do Step 3. |
| Everything 404s | Make sure you generated a domain (Step 2D) and are visiting that exact URL. |

---

## Rough costs

- **Railway** — gives a small starter trial credit; after that it's usage-based, typically a few dollars a month for a small app. (Check railway.com for current pricing — a card is required.)
- **Anthropic / Resend** — pay-as-you-go; pennies while testing.
- **Clerk** — free tier is generous; fine for staging and early launch.

---

## What comes after staging works

- Add **Stripe** keys to turn on paid plans.
- Point your **real domains** at Railway (Railway → Settings → Networking → Custom Domain, then add a record at your domain registrar — I can walk you through it).
- Set up a real Resend **sending domain** so emails come from your address.
- Review the **privacy-page wording** flagged earlier (it names the wrong AI provider / auth system).

Want me to help with any specific step, or do the database setup (Step 3) for you? Just say the word.
