<<<<<<< HEAD
# Security Clock In/Out App

Replaces a manual, paper based sign in/out process for security guards with
a QR scan (or manual entry fallback) that looks up the guard's license
status directly against Ontario's PSIS Public Registry, then logs the
clock in/out time.

## Project structure

```
security-clock-app/
  backend/      Express API (auth, license verification, shift logs, venues, users)
  frontend/     React (Vite) app: login, scan/clock-in, active roster, manager views
```

## Backend setup

```
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL`: your Supabase Postgres connection string (Project Settings > Database > Connection string)
- `JWT_SECRET`: any long random string

Once Supabase is set up, run `db/schema.sql` in the Supabase SQL editor to
create the tables.

You'll also need at least one manager account to log in for the first
time. Since account creation requires being logged in as a manager
already, insert the first one directly via SQL:

```sql
-- Generate a bcrypt hash for your chosen password first (see note below),
-- then:
insert into users (name, email, password_hash, role)
values ('Your Name', 'you@example.com', '<bcrypt-hash-here>', 'manager');
```

To generate a bcrypt hash quickly from the backend folder:
```
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

Run the backend:
```
npm run dev
```
Runs on http://localhost:3001 by default.

## Frontend setup

```
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 by default. Already configured to talk to
the backend at http://localhost:3001 via `.env` (`VITE_API_BASE_URL`).

## How the license verification works

Ontario's digital security guard licence includes a QR code that links to
the PSIS Public Registry:
`https://www.compliance.gov.on.ca/services/psis-publicregistry/individual/en/{licenseNumber}`

The backend (`services/licenseVerification.js`) fetches that page directly
using the license number and parses the result table (Licence Number,
Status, Category, Licensee) to determine if the license is currently
Active.

This works whether the license number comes from:
- Scanning the QR code (frontend extracts the trailing digits from the
  decoded URL)
- Manual entry (a supervisor types the number in directly, if the QR
  won't scan)

Both paths call the same backend endpoint, `POST /guards/scan-lookup`.

## Known dependency worth flagging in any pitch

This app relies on Ontario's public registry staying available and not
blocking automated requests. It worked with a normal browser-style
request during development, but this is a dependency on a third party
government service that could change behavior in the future. Worth
testing periodically, and worth mentioning honestly as a known risk when
pitching this internally.

## Roles

- **supervisor**: can scan/manually enter guards, clock in/out, view the
  active roster
- **manager**: everything a supervisor can do, plus manage venues
  (add/edit/deactivate) and view full shift history with filters, and
  create new staff accounts
=======
# security-clock
>>>>>>> a3786f101f96c2a15c69a9baf93f88e976be50ac
