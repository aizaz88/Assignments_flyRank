# Task API with Supabase Authentication

A Node.js + Express API with a PostgreSQL database (in Docker) and secure user authentication powered by **Supabase Auth**. Users can sign up, log in and log out, and certain routes answer only to logged-in users.

Built for FlyRank Internship, Backend Track, Assignment A4 (Auth: Login & protect).

## What this is

- **Task CRUD API** (from earlier assignments), stored in PostgreSQL.
- **Authentication** through Supabase Auth, which acts as the Identity Provider. This app never stores or hashes passwords. It forwards credentials to Supabase and verifies the JWT that Supabase returns.
- **Protected routes** guarded by a single reusable middleware (`middleware/auth.js`).
- **Swagger UI** at `/docs` with an **Authorize** button for bearer tokens.

## How authentication works

1. The client sends email + password to `POST /auth/login`.
2. The server forwards them to Supabase, which returns a JWT (the access token).
3. The client sends that token on later requests: `Authorization: Bearer <token>`.
4. The `requireAuth` middleware asks Supabase whether the token is real (`supabase.auth.getUser(token)`).
   - Valid: the user is attached to `req.user` and the route runs.
   - Missing, malformed, tampered or expired: the server answers `401`.

## Project structure

```
.
├── index.js               # App entry: routes, Swagger, startup
├── db.js                  # PostgreSQL pool + table setup
├── supabase.js            # Supabase client
├── middleware/
│   └── auth.js            # requireAuth: token verification guard
├── routes/
│   ├── auth.js            # signup, login, logout
│   └── protected.js       # profile, dashboard
├── openapi.json           # Swagger / OpenAPI spec
├── Dockerfile
├── compose.yaml
├── .env.example
└── Readme.md
```

## Setup

### 1. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com) (no credit card needed).
2. Open **Project Settings → API** and copy the **Project URL** and the **anon (public) key**. Never use the `service_role` key.
3. Open **Authentication → Sign In / Providers → Email** and turn **"Confirm email" off**, so a new signup can log in immediately (practice project only; leave it on in production).

### 2. Configure environment variables

```bash
git clone https://github.com/aizaz88/Assignments_flyRank.git
cd Assignments_flyRank
cp .env.example .env
```

Then edit `.env` with your own values:

```
DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
PORT=3000
```

`.env` is git-ignored and is never committed. Inside Docker Compose the app connects to the database through the service name `db`. This is set automatically in `compose.yaml`.

### 3. Run it (one command)

```bash
docker compose up --build
```

The server runs at `http://localhost:3000`. The database table is created automatically, and 3 example tasks are seeded on first run.

## API reference

| Method | Path                   | Auth needed? | Description                              |
| ------ | ---------------------- | ------------ | ---------------------------------------- |
| POST   | `/auth/signup`         | No           | Create a new user account                |
| POST   | `/auth/login`          | No           | Log in, returns access + refresh token   |
| POST   | `/auth/logout`         | Bearer token | Log out                                  |
| GET    | `/protected/profile`   | Bearer token | Current user's profile                   |
| GET    | `/protected/dashboard` | Bearer token | Second protected route (same middleware) |
| GET    | `/public/info`         | No           | Public message                           |
| GET    | `/tasks`               | No           | List all tasks                           |
| GET    | `/tasks/:id`           | No           | Get a single task                        |
| POST   | `/tasks`               | No           | Create a task                            |
| PUT    | `/tasks/:id`           | No           | Update a task                            |
| DELETE | `/tasks/:id`           | No           | Delete a task                            |

### Status codes

| Code | Meaning in this API                                                      |
| ---- | ------------------------------------------------------------------------ |
| 200  | Login / read succeeded                                                   |
| 201  | Signup succeeded                                                         |
| 204  | Logout succeeded (no body)                                               |
| 400  | Missing input (for example no password)                                  |
| 401  | Missing, malformed, invalid or expired token, or wrong login credentials |

Every error returns JSON like `{ "error": "message" }`.

## Try it with curl

```bash
# 1. Sign up
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Log in (copy the access_token from the response)
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Call a protected route
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 4. Tamper with the token (change one character) -> 401
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>x"

# 5. Log out
curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Swagger UI

Interactive docs are at `http://localhost:3000/docs`.

1. Run `POST /auth/login` with **Try it out** and copy the `access_token`.
2. Click **Authorize** and paste the token (Swagger adds `Bearer` itself).
3. Run **Try it out** on `GET /protected/profile`.

![Swagger auth screenshot](swagger-auth-screenshot.png)

![Swagger UI screenshot](swagger-screenshot.png)

## Security notes

- **No password handling in this code.** Supabase stores accounts, hashes passwords and signs tokens.
- **Secrets stay out of Git.** `.env` is git-ignored and `.env.example` holds placeholders only. Only the public `anon` key is used.
- **One guard for all protected routes.** The auth check lives in `middleware/auth.js` and is reused, so no route can be accidentally left unchecked.
- **Logout and stateless JWTs.** A JWT is valid until it expires (Supabase default: 1 hour). With only the anon key, the server cannot revoke an already-issued access token, so a token can still work briefly after logout. This is a known trade-off of stateless tokens.

## Database

Tasks are stored in PostgreSQL, running in its own Docker container (`db` service in `compose.yaml`), with a named volume (`taskdata`) so data survives `docker compose down` and `docker compose up`.

![Postgres screenshot](postgres-screenshot.jpeg)

### Persistence proof

Tested by creating a task, running `docker compose down`, then `docker compose up` again. The task was still present in `GET /tasks`, so the volume preserved the data even though the containers were recreated.

## Storage history

1. In-memory array (Assignment 1)
2. SQLite file (Assignment 2)
3. PostgreSQL in Docker (Assignment 3)
4. Supabase authentication added on top (Assignment 4, this one)

## Notes

Running `docker compose down -v` (with `-v`) also removes the volume and permanently deletes all data.
