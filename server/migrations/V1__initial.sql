CREATE TABLE IF NOT EXISTS desires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    importance VARCHAR(10) NOT NULL CHECK (importance IN ('low', 'high')),
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'high')),
    image_url TEXT,
    web_url TEXT,
    note TEXT,
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
