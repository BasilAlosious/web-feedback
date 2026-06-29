/**
 * Data layer — dual mode:
 *   • POSTGRES_URL set  → Vercel Postgres (production / Vercel dev)
 *   • POSTGRES_URL unset → local JSON file at data/db.json (local dev)
 */

export interface Project {
    id: string
    userId: string  // Owner of the project
    name: string
    url: string
    markupCount: number
    updatedAt: string
}

export interface Markup {
    id: string
    projectId: string
    name: string
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    commentCount: number
    type: "website" | "image"
    figmaUrl?: string
}

// Anchors a comment to a specific DOM element so the pin follows it across reflow.
export interface CommentAnchor {
    fbId?: string   // data-fb-id stamped by the proxy script
    relX: number    // 0–1 offset within the element's box
    relY: number
    tag?: string
    elId?: string
    cls?: string
    text?: string
}

export interface Comment {
    id: string
    markupId: string
    x: number
    y: number
    width?: number   // percentage-based width for area selection (0-100)
    height?: number  // percentage-based height for area selection (0-100)
    scrollY?: number // pixels - scroll position when comment was placed (for anchoring)
    scrollX?: number // pixels - horizontal scroll position when comment was placed
    content: string
    author: string
    createdAt: string
    priority?: 'high' | 'medium' | 'low'
    status?: 'open' | 'in_progress' | 'resolved'
    isGuest?: boolean  // true for guest comments via share links
    viewport: 'desktop' | 'tablet' | 'mobile'  // coarse category (for badge/back-compat)
    device?: string  // exact device-preset key (e.g. 'desktop-1990'); scopes the comment
    anchor?: CommentAnchor | null  // optional element anchor (pin follows the element)
}

export interface User {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: string
}

// Default device-preset key per coarse viewport — used to backfill legacy comments
// that predate the `device` field. (Mirrors DEFAULT_DEVICE in IframeRenderer; kept
// local to avoid importing a client module into the data layer.)
const DEFAULT_DEVICE_BY_VIEWPORT: Record<string, string> = {
    desktop: 'desktop-1440',
    tablet: 'ipad',
    mobile: 'iphone-16',
}

function withCommentDefaults(c: Comment): Comment {
    const viewport = c.viewport ?? 'desktop'
    return { ...c, viewport, device: c.device ?? DEFAULT_DEVICE_BY_VIEWPORT[viewport] ?? 'desktop-1440' }
}

// Postgres returns `anchor` as a JSON string (TEXT column) — parse it to an object.
function parseCommentRow(row: any): Comment {
    let anchor = row.anchor
    if (typeof anchor === 'string') { try { anchor = JSON.parse(anchor) } catch { anchor = null } }
    return { ...row, anchor: anchor ?? null } as Comment
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON adapter (local dev, no Postgres required)
// ─────────────────────────────────────────────────────────────────────────────

function jsonDb() {
    // Dynamic require so Next.js doesn't bundle 'fs' for the edge runtime
    const fs   = require('fs')   as typeof import('fs')
    const path = require('path') as typeof import('path')

    const DB_PATH = path.join(process.cwd(), 'data', 'db.json')
    const empty   = { users: [] as User[], projects: [] as Project[], markups: [] as Markup[], comments: [] as Comment[] }

    function read() {
        if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2)); return empty }
        const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
        // Ensure users array exists for existing db.json files
        if (!data.users) data.users = []
        return data as typeof empty
    }
    function write(data: typeof empty) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)) }

    return {
        // User methods
        getUserByEmail: async (email: string): Promise<User | undefined> =>
            read().users.find(u => u.email.toLowerCase() === email.toLowerCase()),

        getUserById: async (id: string): Promise<User | undefined> =>
            read().users.find(u => u.id === id),

        createUser: async (u: User): Promise<User> => {
            const d = read(); d.users.push(u); write(d); return u
        },

        // Project methods
        getProjects: async (userId: string): Promise<Project[]> =>
            read().projects.filter(p => p.userId === userId),

        addProject: async (p: Project): Promise<Project> => {
            const d = read(); d.projects.unshift(p); write(d); return p
        },

        getMarkups: async (projectId: string): Promise<Markup[]> =>
            read().markups.filter(m => m.projectId === projectId),

        getMarkup: async (id: string): Promise<Markup | undefined> =>
            read().markups.find(m => m.id === id),

        addMarkup: async (m: Markup): Promise<Markup> => {
            const d = read(); d.markups.unshift(m)
            const p = d.projects.find(p => p.id === m.projectId); if (p) p.markupCount++
            write(d); return m
        },

        updateMarkup: async (id: string, patch: Partial<Markup>): Promise<Markup> => {
            const d = read(); const i = d.markups.findIndex(m => m.id === id)
            if (i === -1) throw new Error('Markup not found')
            d.markups[i] = { ...d.markups[i], ...patch }; write(d); return d.markups[i]
        },

        deleteMarkup: async (id: string): Promise<void> => {
            const d = read(); const m = d.markups.find(m => m.id === id)
            if (m) { const p = d.projects.find(p => p.id === m.projectId); if (p) p.markupCount = Math.max(0, p.markupCount - 1) }
            d.markups = d.markups.filter(m => m.id !== id)
            d.comments = d.comments.filter(c => c.markupId !== id)
            write(d)
        },

        getComments: async (markupId: string): Promise<Comment[]> =>
            read().comments
                .filter(c => c.markupId === markupId)
                .map(withCommentDefaults),

        addComment: async (c: Comment): Promise<Comment> => {
            const d = read(); d.comments.push(c)
            const m = d.markups.find(m => m.id === c.markupId); if (m) m.commentCount++
            write(d); return c
        },

        updateComment: async (id: string, patch: Partial<Comment>): Promise<Comment> => {
            const d = read(); const i = d.comments.findIndex(c => c.id === id)
            if (i === -1) throw new Error('Comment not found')
            d.comments[i] = { ...d.comments[i], ...patch }; write(d); return d.comments[i]
        },

        getCommentsForProject: async (projectId: string): Promise<Comment[]> => {
            const d = read()
            const ids = new Set(d.markups.filter(m => m.projectId === projectId).map(m => m.id))
            return d.comments
                .filter(c => ids.has(c.markupId))
                .map(withCommentDefaults)
        },

        getCommentCountsForProjects: async (projectIds: string[]): Promise<Record<string, number>> => {
            const d = read()
            const result: Record<string, number> = {}
            for (const projectId of projectIds) {
                const markupIds = new Set(d.markups.filter(m => m.projectId === projectId).map(m => m.id))
                result[projectId] = d.comments.filter(c => markupIds.has(c.markupId)).length
            }
            return result
        },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Postgres adapter (Vercel / production)
// ─────────────────────────────────────────────────────────────────────────────

function postgresDb() {
    const { sql } = require('@vercel/postgres') as typeof import('@vercel/postgres')

    const SU = `id, email, name, password_hash AS "passwordHash", created_at AS "createdAt"`
    const SP = `id, user_id AS "userId", name, url, markup_count AS "markupCount", updated_at AS "updatedAt"`
    const SM = `id, project_id AS "projectId", name, url, viewport, comment_count AS "commentCount", type, figma_url AS "figmaUrl"`
    const SC = `id, markup_id AS "markupId", x, y, width, height, scroll_y AS "scrollY", scroll_x AS "scrollX", content, author, created_at AS "createdAt", priority, status, is_guest AS "isGuest", COALESCE(viewport, 'desktop') AS viewport, COALESCE(device, CASE COALESCE(viewport,'desktop') WHEN 'tablet' THEN 'ipad' WHEN 'mobile' THEN 'iphone-16' ELSE 'desktop-1440' END) AS device, anchor`

    return {
        // User methods
        getUserByEmail: async (email: string): Promise<User | undefined> => {
            const { rows } = await sql.query(
                `SELECT ${SU} FROM users WHERE LOWER(email) = LOWER($1)`, [email]
            )
            return rows[0] as User | undefined
        },

        getUserById: async (id: string): Promise<User | undefined> => {
            const { rows } = await sql.query(`SELECT ${SU} FROM users WHERE id = $1`, [id])
            return rows[0] as User | undefined
        },

        createUser: async (u: User): Promise<User> => {
            await sql`INSERT INTO users (id, email, name, password_hash, created_at)
                      VALUES (${u.id}, ${u.email}, ${u.name}, ${u.passwordHash}, ${u.createdAt})`
            return u
        },

        // Project methods
        getProjects: async (userId: string): Promise<Project[]> => {
            const { rows } = await sql.query(
                `SELECT ${SP} FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`, [userId]
            )
            return rows as Project[]
        },

        addProject: async (p: Project): Promise<Project> => {
            await sql`INSERT INTO projects (id, user_id, name, url, markup_count, updated_at)
                      VALUES (${p.id}, ${p.userId}, ${p.name}, ${p.url}, ${p.markupCount}, ${p.updatedAt})`
            return p
        },

        getMarkups: async (projectId: string): Promise<Markup[]> => {
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE project_id = $1`, [projectId])
            return rows as Markup[]
        },

        getMarkup: async (id: string): Promise<Markup | undefined> => {
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE id = $1`, [id])
            return rows[0] as Markup | undefined
        },

        addMarkup: async (m: Markup): Promise<Markup> => {
            await sql`INSERT INTO markups (id, project_id, name, url, viewport, comment_count, type, figma_url)
                      VALUES (${m.id}, ${m.projectId}, ${m.name}, ${m.url}, ${m.viewport}, ${m.commentCount}, ${m.type}, ${m.figmaUrl ?? null})`
            await sql`UPDATE projects SET markup_count = markup_count + 1 WHERE id = ${m.projectId}`
            return m
        },

        updateMarkup: async (id: string, patch: Partial<Markup>): Promise<Markup> => {
            if (patch.name     !== undefined) await sql`UPDATE markups SET name      = ${patch.name}            WHERE id = ${id}`
            if (patch.url      !== undefined) await sql`UPDATE markups SET url       = ${patch.url}             WHERE id = ${id}`
            if (patch.viewport !== undefined) await sql`UPDATE markups SET viewport  = ${patch.viewport}        WHERE id = ${id}`
            if (patch.type     !== undefined) await sql`UPDATE markups SET type      = ${patch.type}            WHERE id = ${id}`
            if (patch.figmaUrl !== undefined) await sql`UPDATE markups SET figma_url = ${patch.figmaUrl ?? null} WHERE id = ${id}`
            const { rows } = await sql.query(`SELECT ${SM} FROM markups WHERE id = $1`, [id])
            if (!rows[0]) throw new Error('Markup not found')
            return rows[0] as Markup
        },

        deleteMarkup: async (id: string): Promise<void> => {
            const { rows } = await sql.query(`SELECT project_id FROM markups WHERE id = $1`, [id])
            if (!rows[0]) return
            await sql`DELETE FROM markups WHERE id = ${id}`
            await sql`UPDATE projects SET markup_count = GREATEST(markup_count - 1, 0) WHERE id = ${rows[0].project_id}`
        },

        getComments: async (markupId: string): Promise<Comment[]> => {
            const { rows } = await sql.query(
                `SELECT ${SC} FROM comments WHERE markup_id = $1 ORDER BY created_at ASC`, [markupId]
            )
            return rows.map(parseCommentRow)
        },

        addComment: async (c: Comment): Promise<Comment> => {
            await sql`INSERT INTO comments (id, markup_id, x, y, width, height, scroll_y, scroll_x, content, author, created_at, priority, status, is_guest, viewport, device, anchor)
                      VALUES (${c.id}, ${c.markupId}, ${c.x}, ${c.y}, ${c.width ?? null}, ${c.height ?? null}, ${c.scrollY ?? null}, ${c.scrollX ?? null}, ${c.content}, ${c.author},
                              ${c.createdAt}, ${c.priority ?? null}, ${c.status ?? 'open'}, ${c.isGuest ?? false}, ${c.viewport ?? 'desktop'}, ${c.device ?? null}, ${c.anchor ? JSON.stringify(c.anchor) : null})`
            await sql`UPDATE markups SET comment_count = comment_count + 1 WHERE id = ${c.markupId}`
            return c
        },

        updateComment: async (id: string, patch: Partial<Comment>): Promise<Comment> => {
            if (patch.status   !== undefined) await sql`UPDATE comments SET status   = ${patch.status}             WHERE id = ${id}`
            if (patch.priority !== undefined) await sql`UPDATE comments SET priority = ${patch.priority ?? null}   WHERE id = ${id}`
            if (patch.x        !== undefined) await sql`UPDATE comments SET x        = ${patch.x}                  WHERE id = ${id}`
            if (patch.y        !== undefined) await sql`UPDATE comments SET y        = ${patch.y}                  WHERE id = ${id}`
            if (patch.scrollY  !== undefined) await sql`UPDATE comments SET scroll_y = ${patch.scrollY ?? null}    WHERE id = ${id}`
            if (patch.scrollX  !== undefined) await sql`UPDATE comments SET scroll_x = ${patch.scrollX ?? null}    WHERE id = ${id}`
            if (patch.viewport !== undefined) await sql`UPDATE comments SET viewport = ${patch.viewport ?? 'desktop'} WHERE id = ${id}`
            const { rows } = await sql.query(`SELECT ${SC} FROM comments WHERE id = $1`, [id])
            if (!rows[0]) throw new Error('Comment not found')
            return parseCommentRow(rows[0])
        },

        getCommentsForProject: async (projectId: string): Promise<Comment[]> => {
            const { rows } = await sql.query(
                `SELECT c.id, c.markup_id AS "markupId", c.x, c.y, c.width, c.height, c.scroll_y AS "scrollY", c.scroll_x AS "scrollX", c.content, c.author,
                        c.created_at AS "createdAt", c.priority, c.status, c.is_guest AS "isGuest", COALESCE(c.viewport, 'desktop') AS viewport
                 FROM comments c
                 INNER JOIN markups m ON c.markup_id = m.id
                 WHERE m.project_id = $1
                 ORDER BY c.created_at ASC`,
                [projectId]
            )
            return rows as Comment[]
        },

        getCommentCountsForProjects: async (projectIds: string[]): Promise<Record<string, number>> => {
            if (projectIds.length === 0) return {}
            const { rows } = await sql.query(
                `SELECT m.project_id, COUNT(c.id)::int as count
                 FROM markups m
                 LEFT JOIN comments c ON c.markup_id = m.id
                 WHERE m.project_id = ANY($1)
                 GROUP BY m.project_id`,
                [projectIds]
            )
            const result: Record<string, number> = {}
            for (const projectId of projectIds) result[projectId] = 0
            for (const row of rows) result[row.project_id] = row.count
            return result
        },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export the right adapter based on environment
// ─────────────────────────────────────────────────────────────────────────────

export const db = process.env.POSTGRES_URL ? postgresDb() : jsonDb()
