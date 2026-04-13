# Doomsage Link Shortener

A minimal full-stack URL shortener built with Firebase Hosting, Cloud Functions (Express), and Firestore.

## Features
- Create short links from long URLs
- Optional custom code support with collision checks
- Random base62 code generation (5–7 chars) with uniqueness validation
- Redirect endpoint with fallback custom 404 page
- Dark-themed responsive UI with smooth animations
- Copy-to-clipboard support

## Tech Stack
- Frontend: Vanilla HTML/CSS/JavaScript
- Backend: Node.js + Express running on Firebase Cloud Functions v2
- Database: Firebase Firestore (`links` collection)
- Hosting: Firebase Hosting

## Firestore document format
Collection: `links`

```json
{
  "code": "aB3x9",
  "url": "https://youtube.com/watch?v=xyz"
}
```

## API
### `POST /api/shorten`
Request body:

```json
{
  "url": "https://example.com/long",
  "customCode": "optional123"
}
```

Responses:
- `201` success with `{ code, shortUrl }`
- `400` invalid input / URL
- `409` when custom code is already taken

## Redirect
`GET /:code`
- 302 redirect if code exists
- custom 404 page if missing

## Local Development
1. Install Firebase CLI:
   ```bash
   npm i -g firebase-tools
   ```
2. Install dependencies:
   ```bash
   cd functions && npm install
   ```
3. Start emulator:
   ```bash
   firebase emulators:start --only functions,hosting
   ```

## Deployment
```bash
firebase deploy --only functions,hosting
```

Deploy to custom domain: `link.doomsage.in` via Firebase Hosting settings.
