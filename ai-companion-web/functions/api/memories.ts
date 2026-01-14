type MemoryType = "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
type MemoryTier = "short" | "mid" | "long";
type MemoryStatus = "active" | "archived";

type MemoryRow = {
  id: string;
  content: string;
  type: MemoryType;
  importance: number;
  tier: MemoryTier;
  status: MemoryStatus;
  created_at: string;
};

type Memory = {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  tier: MemoryTier;
  status: MemoryStatus;
  createdAt: string;
};

type Env = {
  DB?: D1Database;
};

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    importance: row.importance,
    tier: row.tier,
    status: row.status,
    createdAt: row.created_at,
  };
}

function clampLimit(value: string | null, fallback = 200) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(500, Math.max(1, parsed));
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) {
      return Response.json({ memories: [] }, { status: 500 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") as MemoryType | null;
    const tier = url.searchParams.get("tier") as MemoryTier | null;
    const status = url.searchParams.get("status") as MemoryStatus | null;
    const limit = clampLimit(url.searchParams.get("limit"));

    const clauses: string[] = [];
    const binds: unknown[] = [];

    if (type) {
      clauses.push("type = ?");
      binds.push(type);
    }
    if (tier) {
      clauses.push("tier = ?");
      binds.push(tier);
    }
    if (status) {
      clauses.push("status = ?");
      binds.push(status);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const stmt = env.DB.prepare(
      `SELECT id, content, type, importance, tier, status, created_at FROM memories ${where} ORDER BY datetime(created_at) DESC LIMIT ?`
    );

    const result = await stmt.bind(...binds, limit).all<MemoryRow>();
    return Response.json({ memories: (result.results ?? []).map(rowToMemory) });
  } catch (error) {
    console.error(error);
    return Response.json({ memories: [] }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) {
      return Response.json({ error: "Database unavailable" }, { status: 500 });
    }

    const body = await request.json<{
      id?: string;
      content?: string;
      importance?: number;
      type?: MemoryType;
      tier?: MemoryTier;
      status?: MemoryStatus;
    }>();

    if (!body.id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const binds: unknown[] = [];

    if (typeof body.content === "string") {
      updates.push("content = ?");
      binds.push(body.content.trim());
    }
    if (typeof body.importance === "number") {
      updates.push("importance = ?");
      binds.push(body.importance);
    }
    if (body.type) {
      updates.push("type = ?");
      binds.push(body.type);
    }
    if (body.tier) {
      updates.push("tier = ?");
      binds.push(body.tier);
    }
    if (body.status) {
      updates.push("status = ?");
      binds.push(body.status);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No updates provided" }, { status: 400 });
    }

    binds.push(body.id);

    await env.DB.prepare(`UPDATE memories SET ${updates.join(", ")} WHERE id = ?`).bind(
      ...binds
    ).run();

    const updated = await env.DB.prepare(
      "SELECT id, content, type, importance, tier, status, created_at FROM memories WHERE id = ?"
    ).bind(body.id).first<MemoryRow>();

    if (!updated) {
      return Response.json({ error: "Memory not found" }, { status: 404 });
    }

    return Response.json({ memory: rowToMemory(updated) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) {
      return Response.json({ error: "Database unavailable" }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM memories WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
};
