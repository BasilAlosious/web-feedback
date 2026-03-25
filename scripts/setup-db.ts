/**
 * Run once to create tables and seed existing data from data/db.json.
 *
 * Usage:
 *   npx tsx scripts/setup-db.ts
 *
 * Requires POSTGRES_URL (or the Vercel Postgres env vars) in your environment.
 * The easiest way locally: run `vercel env pull .env.local` first.
 */

import { sql } from '@vercel/postgres'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
    console.log('Creating tables...')

    // Users table (for authentication)
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            name          TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        )
    `

    // Projects table (with user_id for ownership)
    await sql`
        CREATE TABLE IF NOT EXISTS projects (
            id           TEXT PRIMARY KEY,
            user_id      TEXT NOT NULL,
            name         TEXT NOT NULL,
            url          TEXT NOT NULL,
            markup_count INTEGER NOT NULL DEFAULT 0,
            updated_at   TEXT NOT NULL
        )
    `

    // Markups table
    await sql`
        CREATE TABLE IF NOT EXISTS markups (
            id            TEXT PRIMARY KEY,
            project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name          TEXT NOT NULL,
            url           TEXT NOT NULL,
            viewport      TEXT NOT NULL DEFAULT 'desktop',
            comment_count INTEGER NOT NULL DEFAULT 0,
            type          TEXT NOT NULL DEFAULT 'website'
        )
    `

    // Comments table (with width, height, is_guest for area selection and guest mode)
    await sql`
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
            is_guest   BOOLEAN DEFAULT false
        )
    `

    console.log('Tables created.')

    // Seed from db.json
    const dbPath = path.join(process.cwd(), 'data', 'db.json')
    if (!fs.existsSync(dbPath)) {
        console.log('No data/db.json found — skipping seed.')
        return
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

    // Seed users first (if present)
    if (data.users && data.users.length > 0) {
        console.log(`Seeding ${data.users.length} users...`)
        for (const u of data.users) {
            await sql`
                INSERT INTO users (id, email, name, password_hash, created_at)
                VALUES (${u.id}, ${u.email}, ${u.name}, ${u.passwordHash}, ${u.createdAt})
                ON CONFLICT (id) DO NOTHING
            `
        }
    }

    console.log(`Seeding ${data.projects.length} projects...`)
    for (const p of data.projects) {
        await sql`
            INSERT INTO projects (id, user_id, name, url, markup_count, updated_at)
            VALUES (${p.id}, ${p.userId ?? 'default-user'}, ${p.name}, ${p.url}, ${p.markupCount}, ${p.updatedAt})
            ON CONFLICT (id) DO NOTHING
        `
    }

    console.log(`Seeding ${data.markups.length} markups...`)
    for (const m of data.markups) {
        await sql`
            INSERT INTO markups (id, project_id, name, url, viewport, comment_count, type)
            VALUES (${m.id}, ${m.projectId}, ${m.name}, ${m.url}, ${m.viewport}, ${m.commentCount}, ${m.type})
            ON CONFLICT (id) DO NOTHING
        `
    }

    console.log(`Seeding ${data.comments.length} comments...`)
    for (const c of data.comments) {
        await sql`
            INSERT INTO comments (id, markup_id, x, y, width, height, content, author, created_at, priority, status, is_guest)
            VALUES (${c.id}, ${c.markupId}, ${c.x}, ${c.y}, ${c.width ?? null}, ${c.height ?? null},
                    ${c.content}, ${c.author}, ${c.createdAt}, ${c.priority ?? null}, ${c.status ?? 'open'}, ${c.isGuest ?? false})
            ON CONFLICT (id) DO NOTHING
        `
    }

    console.log('Seed complete.')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
