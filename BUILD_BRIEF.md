# Build brief: "Anticipate Hues that Heal 2.0" virtual gallery and event site

Build a Next.js website with a walkable 3D gallery, plain pages for each artwork, an events page, and a registration form for the upcoming event. Artist: Olalekan Isiaka. Theme: faith-based art exhibition.

**Reference:** `studio-gallery.html` (attached) is a working single-file prototype of the 3D room. Reuse its layout, controls and the `WORKS` data (titles, sizes, write-ups, images). Do not copy its code style. Rebuild it in React Three Fiber.

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- `three`, `@react-three/fiber`, `@react-three/drei` for the gallery
- `zod` and `react-hook-form` for form validation
- Database for registrations: Supabase (Postgres) or Vercel Postgres
- Confirmation email: Resend
- Deploy: Vercel

## Routes
| Route | Purpose |
|---|---|
| `/` | Landing: exhibition title, short intro, "Enter the gallery" button, next event card |
| `/gallery` | Full-screen 3D gallery |
| `/works` | Grid of all works, grouped by body of work |
| `/works/[slug]` | One artwork: large image, details, write-up, previous and next, "View in gallery" |
| `/events` | List of upcoming and past events |
| `/events/[slug]` | Event details: date, time, venue, map link, description, Register button |
| `/events/[slug]/register` | Registration form |
| `/about` | Artist and exhibition statement |
| `/api/register` | POST endpoint (see below) |
| `/admin/registrations` | Optional. Password-protected list with CSV export |

## Content files (no CMS needed)
`content/works.json`
```json
{ "slug": "unwavering", "title": "", "artist": "Olalekan Isiaka", "year": "", "medium": "",
  "size": "", "body": "Faith", "writeup": "", "image": "/art/unwavering.webp",
  "wall": "left", "position": -1.8, "widthM": 0.95, "heightM": 0.95 }
```
`content/events.json`
```json
{ "slug": "", "title": "", "startsAt": "ISO date", "endsAt": "ISO date", "venue": "",
  "address": "", "mapUrl": "", "description": "", "capacity": 0, "registrationOpen": true }
```
Current works: The Lost Sheep (two versions), The Lion and the Lamb, Unwavering (two versions), Bond. Bodies of work: "The Shepherd and the Flock", "Faith", "Bond". Names are editable.

## Gallery (`/gallery`)
- Load with `dynamic(() => import(...), { ssr: false })`; the component is `"use client"`.
- White room, 16 × 10 × 4.5 m, wood floor, soft lighting. Frames sized from `widthM` and `heightM` so works appear at real proportions.
- Body-of-work title on the wall above each group.
- Controls: drag to look, W A S D and arrow keys to walk (Shift is faster), double-click the floor to walk there, click an artwork to glide to it. Keep the camera inside the room bounds.
- Selecting a work opens a side panel (bottom sheet on mobile) with title, artist, year, medium, size, write-up, Previous, Next and Close. Esc closes it.
- A "Bodies of work" menu lets visitors jump to any work, which is the main way to move on phones.
- Show a loading screen while textures load.
- Quality toggle (standard and high) controlling pixel ratio and texture size.
- Fallback: if WebGL is unavailable, redirect to `/works` with a message.
- Later (optional): WebXR with `@react-three/xr`.

## Event page and registration
**Registration form fields:** full name, email, phone (optional), number of guests (1 to 5), how you heard about the event (select, optional), accessibility needs (optional), consent checkbox (required).

**`POST /api/register`**
- Validate with zod on client and server.
- Reject if the event is closed or at capacity.
- Block duplicate registrations (same email and event).
- Spam protection: hidden honeypot field plus simple rate limiting by IP.
- Save to the database, then email a confirmation with event details and an "Add to calendar" `.ics` link.
- Return clear errors. Success state shows a confirmation message and calendar link.

**Event page:** shows remaining spaces if capacity is set, and hides the Register button when registration is closed. Add `Event` JSON-LD for SEO.

**Privacy:** collect only what is listed above, state how it is used, and keep keys in `.env.local` (`DATABASE_URL`, `RESEND_API_KEY`, `ADMIN_PASSWORD`).

## Design
- Quiet and gallery-like so the paintings carry the colour. Warm off-white, near-black text, one deep teal accent.
- Serif for headings (Newsreader), clean sans for UI (Instrument Sans).
- Support light and dark mode. Responsive down to 360 px wide.

## Quality requirements
- Accessible: keyboard focus visible, alt text for every image (describe the painting), form labels and error messages announced, respect `prefers-reduced-motion`.
- Performance: resize images to 2048 px max, serve WebP with `next/image` on 2D pages, compressed textures in 3D, lazy load the gallery.
- No secrets in client code. No `localStorage` required.

## Build order
1. Scaffold project, fonts, layout, nav, content JSON, images in `/public/art`.
2. `/works` and `/works/[slug]`.
3. `/gallery` room, then artwork frames, then walking and click-to-glide, then info panel and menu.
4. `/events` and `/events/[slug]`.
5. Registration form, API route, database, confirmation email.
6. Landing and about pages, SEO, accessibility pass, deploy.

## Still to provide (leave `TODO` placeholders until supplied)
- Event details: name, date, time, venue, address, capacity
- Missing years, mediums and sizes for some works; write-ups for The Lost Sheep and The Lion and the Lamb
- Artist bio and exhibition statement
- Contact email and social links
