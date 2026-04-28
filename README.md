# Goodman Finances Inc. — Mobile Shared Version

This is the phone-first version of the household budget app.

## What changed from v1

- Mobile-first UI for iPhone
- Email/password login via Supabase
- Shared cloud database so Steve and Lou can use the same data
- PWA-ready so it can be added to the iPhone Home Screen
- CBA CSV import retained
- Your budget categories retained

## What you need

1. A free Supabase project
2. A free Vercel account

## Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Paste and run the contents of `supabase-schema.sql`.
4. Go to **Project Settings → API**.
5. Copy:
   - Project URL
   - anon public key

## Local setup

1. Rename `.env.example` to `.env`
2. Add your Supabase values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Install and run:

```bash
npm install
npm run dev
```

## Deploy to phones

Deploy to Vercel. Then on iPhone:

1. Open the Vercel URL in Safari
2. Tap Share
3. Tap **Add to Home Screen**

## Notes

The first person to sign in creates the Goodman Household automatically. To add Lou to the same household, the app currently needs one small admin step in Supabase: add Lou's user ID to `household_members` with the same `household_id`. I can automate this with an invite code in the next version.
