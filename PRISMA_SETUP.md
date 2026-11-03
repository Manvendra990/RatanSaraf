Current 1 November 2026 installation/update instructions are in START_HERE.md. Historical plans are no longer created or sold.

# Prisma + MySQL setup

Prisma 6.19.0 is now the backend database layer. It is pinned together with @prisma/client for reproducible installation. The mobile/admin API shape and existing UI are unchanged.

## Added
- prisma/schema.prisma: all existing tables, enums, relations, integer-paisa/microgram fields and table mappings.
- prisma/migrations/202610270001_initial/migration.sql: initial schema, InnoDB and the reserved-gold CHECK constraint.
- prisma.config.ts: schema/migration/seed paths; dotenv configuration.
- src/prisma.service.ts: shared Nest lifecycle-managed Prisma client.
- src/db.ts: Prisma interactive transactions and bound SQL for existing row locks. There is no mysql2 pool in the running backend. Some transaction-sensitive operations intentionally remain parameterized SQL executed by Prisma.
- prisma/seed.ts: typed Prisma upserts for initial admin, categories/products, store settings and plans. Existing business records and prices are not overwritten.
- Catalogue and plan reads use Prisma model queries.
- Prisma error mapping and tests for safe parameters and bigint/decimal JSON serialization.
- mysql2 remains a development-only dependency for the independent MySQL integration test fixture.

## Configuration checks and dependency updates

`npm run env:check` checks required variable format without printing credentials. Startup and database scripts run this check before connecting. If Windows saved `.env.txt`, rename it to `.env`. Existing environment-provided production configuration also works without a physical file.

The backend audit now reports zero known vulnerabilities at generation time. Patched multer, deepmerge-ts and effect versions are constrained with npm overrides; Prisma CLI generation/validation and backend tests were rerun with those versions.

## Keep your existing backend/.env

The same DATABASE_URL, JWT_SECRET, admin email and merchant/provider settings apply. Do not replace actual credentials with .env.example placeholders. Save a database backup before adapting an existing installation.

## A. Database is NEW and EMPTY

From backend/:

```sh
npm ci
npm run prisma:validate
npm run db:setup
npm run dev
```

`npm ci` generates Prisma Client. `db:setup` generates Client, applies migrations, then seeds the initial admin/catalogue. MySQL must already be running, the database must exist, and the database user must have migration privileges on this database.

For first setup set INITIAL_ADMIN_EMAIL and a unique INITIAL_ADMIN_PASSWORD. Remove INITIAL_ADMIN_PASSWORD after seeding. A repeat seed works without that password when the configured admin already exists and does not reset its password.

## B. Tables already exist from the previous SQL setup

Do NOT use reset, drop tables or force db push. Keep the existing data and credentials.

From backend/:

```sh
npm ci
npm run db:baseline:check
```

This command compares the actual database with the Prisma schema and checks the gold reservation constraint. It does not change user tables or record a baseline. If it reports differences or a connection error, STOP and inspect the output; do not delete data to make the command pass.

If the check succeeds and you have a backup:

```sh
npm run db:baseline
npm run db:setup
npm run dev
```

The guarded baseline command rechecks and records the already-existing initial migration without recreating your tables. It refuses to re-baseline a database that already has Prisma migration history. After that, use normal migrations.

If Prisma has already been initialized, inspect status instead:

```sh
npm run db:status
npm run db:migrate
```

## Useful commands

```sh
npm run prisma:generate
npm run prisma:validate
npm run prisma:studio
npm run db:status
npm run db:migrate
npm run db:seed
npm run typecheck
npm test
```

Prisma Studio is a local database editor. It can display/edit financial records directly; use the admin workflow for payments and sales so ledger and reservation rules run together. Do not manually edit balances in Studio.

For a future schema change, author/review migrations on an isolated development database using Prisma Migrate. Production deployment applies reviewed migrations with db:migrate. The gold reservation CHECK constraint is explicit migration SQL and must be preserved because Prisma schema syntax does not express it.

## Validation

Passed: Prisma schema validation, Prisma Client generation, model-to-SQL generation, application/scripts typechecks, NestJS build and all eleven automated tests. No live MySQL migration, legacy baseline or database concurrency run was possible here; those must be verified against your local/test MySQL instance before real use. The supplied test:mysql suite still exercises the running API, now backed by Prisma.

Reference: https://www.prisma.io/docs/orm/v6/prisma-client/using-raw-sql/raw-queries
