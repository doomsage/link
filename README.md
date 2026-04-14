# Doomsage Link Shortener (Supabase Edition)

A minimal full-stack URL shortener using a static frontend + Supabase Postgres.

## Features
- Create short links from long URLs
- Optional custom code support with collision checks
- Random base62 code generation (5–7 chars)
- Redirect flow handled client-side from `/:code`
- Dark-themed responsive UI with copy-to-clipboard
- No Firebase billing dependency

## Tech Stack
- Frontend: Vanilla HTML/CSS/JavaScript
- Backend/DB: Supabase Postgres (`links` table)
- Hosting: Any static host (Vercel / Netlify / Cloudflare Pages / Firebase Hosting static)

## 1) Create Supabase project
1. Go to https://supabase.com and create a project.
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` public key

## 2) Configure frontend keys
Edit `public/config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
};
```

## 3) Create database table
In Supabase SQL Editor, run:

```sql
create table if not exists public.links (
  code text primary key,
  url text not null,
  created_at timestamptz not null default now()
);
```

## 4) Enable RLS + policies
Run in SQL Editor:

```sql
alter table public.links enable row level security;

create policy "Allow public read links"
on public.links for select
using (true);

create policy "Allow public insert links"
on public.links for insert
with check (
  code ~ '^[A-Za-z0-9]{3,40}$'
  and url ~* '^https?://'
);
```

## 5) Hosting rewrite requirement
Because redirects are handled client-side, your host must rewrite all unknown paths to `index.html`.

### Vercel (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify (`_redirects`)
```
/* /index.html 200
```

## Usage
- Open site root: paste URL + optional code → click **Shorten**
- Share generated link: `https://your-domain/{code}`
- When someone opens it, app resolves code from Supabase and redirects.

## Notes
- If you want stricter security, move write operations to Supabase Edge Functions and keep table insert private.
