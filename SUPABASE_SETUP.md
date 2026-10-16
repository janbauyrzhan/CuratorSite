# Cloud accounts and saved workspaces

The app now uses Supabase Auth for email/password accounts and stores each signed-in curator's workspace in `public.user_workspaces`. The database row is keyed by the authenticated user's immutable UUID; Row Level Security policies restrict every operation to that same user.

## 1. Create and configure Supabase

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, enable email/password sign-in. Keep email confirmation enabled for public registration.
3. In **Authentication → URL Configuration**, add the deployed Vercel origin to the allowed redirect URLs, for example `https://curator-site.vercel.app/**`. Add `http://localhost:3000/**` for local development.
4. Open **SQL Editor** and run [`supabase/migrations/20261016000000_user_workspaces.sql`](supabase/migrations/20261016000000_user_workspaces.sql).
5. Copy the **Project URL** and **Publishable key** from Supabase's Connect/API Keys page. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable.

## 2. Configure the app

For local development, copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Add the same two variables in **Vercel → Project → Settings → Environment Variables** for Production and Preview, then redeploy.

## 3. Existing browser-only data

Users create a new account with an email address. Old local passwords cannot be migrated as accounts. After signing in to the new account on the browser that contains the old workspace, the app offers an explicit **Cloud import**. Review and import the groups there; this sends the selected browser's groups and student lists to Supabase. Each other device can then sign in to the same email account and load the cloud workspace.

Each device keeps its own Supabase login session. The account and workspace are shared across devices; a user still signs in separately on each device.
