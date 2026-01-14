CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  importance INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'mid',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_tier_importance
  ON memories (tier, importance DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_type
  ON memories (type, created_at DESC);
