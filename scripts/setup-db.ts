/**
 * Run once to create tables and seed existing data from data/db.json.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep '=' | xargs) && npx tsx scripts/setup-db.ts
 *
 * Requires POSTGRES_URL (or DATABASE_URL) in your environment.
 * The easiest way locally: run `vercel env pull .env.local` first.
 */

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL
    if (!connectionString) throw new Error('No database connection string found. Set POSTGRES_URL, POSTGRES_URL_NON_POOLING, or DATABASE_URL.')

    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
    await client.connect()
    console.log('Connected to database.')
    console.log('Creating tables...')

    // Users table (for authentication)
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            name          TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        )
    `)

    // Projects table (with user_id for ownership)
    await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id           TEXT PRIMARY KEY,
            user_id      TEXT NOT NULL,
            name         TEXT NOT NULL,
            url          TEXT NOT NULL,
            markup_count INTEGER NOT NULL DEFAULT 0,
            updated_at   TEXT NOT NULL
        )
    `)

    // Markups table
    await client.query(`
        CREATE TABLE IF NOT EXISTS markups (
            id            TEXT PRIMARY KEY,
            project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name          TEXT NOT NULL,
            url           TEXT NOT NULL,
            viewport      TEXT NOT NULL DEFAULT 'desktop',
            comment_count INTEGER NOT NULL DEFAULT 0,
            type          TEXT NOT NULL DEFAULT 'website'
        )
    `)

    // Comments table
    await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
            id         TEXT PRIMARY KEY,
            markup_id  TEXT NOT NULL REFERENCES markups(id) ON DELETE CASCADE,
            x          DOUBLE PRECISION NOT NULL,
            y          DOUBLE PRECISION NOT NULL,
            width      DOUBLE PRECISION,
            height     DOUBLE PRECISION,
            content    TEXT NOT NULL,
            author     TEXT NOT NULL,
            created_at TEXT NOT NULL,
            priority   TEXT,
            status     TEXT NOT NULL DEFAULT 'open',
            is_guest   BOOLEAN DEFAULT false,
            scroll_y   DOUBLE PRECISION,
            scroll_x   DOUBLE PRECISION
        )
    `)

    // Migration: add scroll columns if table already existed without them
    await client.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS scroll_y DOUBLE PRECISION`)
    await client.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS scroll_x DOUBLE PRECISION`)

    console.log('Tables created.')

    // Seed from db.json
    const dbPath = path.join(process.cwd(), 'data', 'db.json')
    if (!fs.existsSync(dbPath)) {
        console.log('No data/db.json found — skipping seed.')
        await client.end()
        return
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

    // Seed users first (if present)
    if (data.users && data.users.length > 0) {
        console.log(`Seeding ${data.users.length} users...`)
        for (const u of data.users) {
            await client.query(
                `INSERT INTO users (id, email, name, password_hash, created_at)
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
                [u.id, u.email, u.name, u.passwordHash, u.createdAt]
            )
        }
    }

    console.log(`Seeding ${data.projects.length} projects...`)
    for (const p of data.projects) {
        await client.query(
            `INSERT INTO projects (id, user_id, name, url, markup_count, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [p.id, p.userId ?? 'default-user', p.name, p.url, p.markupCount, p.updatedAt]
        )
    }

    console.log(`Seeding ${data.markups.length} markups...`)
    for (const m of data.markups) {
        await client.query(
            `INSERT INTO markups (id, project_id, name, url, viewport, comment_count, type)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [m.id, m.projectId, m.name, m.url, m.viewport, m.commentCount, m.type]
        )
    }

    console.log(`Seeding ${data.comments.length} comments...`)
    for (const c of data.comments) {
        await client.query(
            `INSERT INTO comments (id, markup_id, x, y, width, height, scroll_y, scroll_x, content, author, created_at, priority, status, is_guest)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
            [c.id, c.markupId, c.x, c.y, c.width ?? null, c.height ?? null,
             c.scrollY ?? null, c.scrollX ?? null,
             c.content, c.author, c.createdAt, c.priority ?? null, c.status ?? 'open', c.isGuest ?? false]
        )
    }

    console.log('Seed complete.')
    await client.end()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
