const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function verifyAuth(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = atob(token);
    const [username, password] = decoded.split(":");
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE username = ? AND password = ?"
    ).bind(username, password).first();
    return user || null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (path === "/api/login" && request.method === "POST") {
      const { username, password } = await request.json();
      const user2 = await env.DB.prepare(
        "SELECT * FROM users WHERE username = ? AND password = ?"
      ).bind(username, password).first();
      if (!user2) return json({ error: "Invalid credentials" }, 401);
      const token = btoa(`${username}:${password}`);
      return json({ token, username });
    }

    const user = await verifyAuth(request, env);
    if (!user) return json({ error: "Unauthorized" }, 401);

    if (path === "/api/entries" && request.method === "GET") {
      const entries = await env.DB.prepare(
        "SELECT * FROM entries ORDER BY created_at DESC"
      ).all();
      const parsed = entries.results.map((e) => ({
        ...e,
        pallets: JSON.parse(e.pallets)
      }));
      return json(parsed);
    }

    if (path === "/api/entries" && request.method === "POST") {
      const e = await request.json();
      await env.DB.prepare(
        `INSERT INTO entries (timestamp, item_code, pallets, gross_wt, pallet_wt, plastic_rate, empty_plastic, net_wt, total_bundles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        e.timestamp,
        e.itemCode,
        JSON.stringify(e.pallets),
        e.grossWt,
        e.palletWt,
        e.plasticRate,
        e.emptyPlastic,
        e.netWt,
        e.totalBundles
      ).run();
      return json({ success: true });
    }

    if (path.startsWith("/api/entries/") && request.method === "PUT") {
      const id = path.split("/")[3];
      const e = await request.json();
      await env.DB.prepare(
        `UPDATE entries SET timestamp=?, item_code=?, pallets=?, gross_wt=?, pallet_wt=?, plastic_rate=?, empty_plastic=?, net_wt=?, total_bundles=? WHERE id=?`
      ).bind(
        e.timestamp,
        e.itemCode,
        JSON.stringify(e.pallets),
        e.grossWt,
        e.palletWt,
        e.plasticRate,
        e.emptyPlastic,
        e.netWt,
        e.totalBundles,
        id
      ).run();
      return json({ success: true });
    }

    if (path === "/api/entries" && request.method === "DELETE") {
      const { ids } = await request.json();
      const placeholders = ids.map(() => "?").join(",");
      await env.DB.prepare(
        `DELETE FROM entries WHERE id IN (${placeholders})`
      ).bind(...ids).run();
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  }
};
