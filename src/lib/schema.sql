CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    markup_count INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markups (
    id            TEXT PRIMARY KEY,
    project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    url           TEXT NOT NULL,
    viewport      TEXT NOT NULL DEFAULT 'desktop',
    comment_count INTEGER NOT NULL DEFAULT 0,
    type          TEXT NOT NULL DEFAULT 'website'
);

CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    markup_id  TEXT NOT NULL REFERENCES markups(id) ON DELETE CASCADE,
    x          DOUBLE PRECISION NOT NULL,
    y          DOUBLE PRECISION NOT NULL,
    content    TEXT NOT NULL,
    author     TEXT NOT NULL,
    created_at TEXT NOT NULL,
    priority   TEXT,
    status     TEXT NOT NULL DEFAULT 'open'
);
