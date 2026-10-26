# Inventory API

A REST API for an equipment rental inventory. I built it from scratch to practice good backend practices and cleaner code.

## Tech stack

- Node.js with Express for the API
- Zod to validate the data before it gets to the database
- PostgreSQL as the database, using parameterized queries
- Docker to run the database locally

## Getting started

You need Node.js and Docker installed.

```bash
git clone https://github.com/ConnexAi/inventory-api.git
cd inventory-api
npm install
cp .env.example .env
```

Fill the `.env` with your own values, then start the database and create the table:

```bash
docker compose up -d
docker compose exec -T db psql -U your_db_user -d inventario < schema.sql
```

Then run the server:

```bash
node server.js
```

It runs on http://localhost:3000

## Endpoints

I made 5 endpoints to cover the full CRUD:

- `GET /equipos` returns all the equipment. You can filter with `?categoria=` or `?disponible=true`
- `GET /equipos/:id` returns one equipment by its id
- `POST /equipos` creates a new equipment, the body is validated with Zod
- `PATCH /equipos/:id` updates only the fields you send and returns the updated equipment
- `DELETE /equipos/:id` deletes the equipment and returns 204

If the input is wrong it returns 400, and if the id doesn't exist it returns 404.

## Why I did it this way

- I never put user input directly in the SQL. I use `$1`, `$2` so Postgres treats the values as data and not as code, that's what prevents SQL injection.
- Zod checks the body before touching the database, so bad data gets a clear 400 instead of a database error. For PATCH I reused the same schema with `.extend()` and `.partial()` so you can send just one field.
- The filters and the PATCH query are built from fields I define in the code, not from whatever the client sends.
- The database password lives in a `.env` file that is not uploaded. `.env.example` shows what variables you need.

## What's next

- Validate the id and the filters with Zod too
- Move it to TypeScript
- Add tests with Vitest and Supertest
