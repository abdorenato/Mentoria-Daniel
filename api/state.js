import { Redis } from "@upstash/redis";

// Acha a credencial mesmo se a Vercel injetou com prefixo (ex.: MEUBANCO_KV_REST_API_URL)
function envLookup(suffixes) {
  for (const s of suffixes) {
    if (process.env[s]) return process.env[s];
  }
  const keys = Object.keys(process.env);
  for (const s of suffixes) {
    const hit = keys.find((k) => k.endsWith(s));
    if (hit) return process.env[hit];
  }
  return undefined;
}
const url = envLookup(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"]);
const token = envLookup(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"]);

const DKEY = "mentoria-hq-state";
const MAX = 900000;

export default async function handler(req, res) {
  const key = req.headers["x-access-key"];
  if (!process.env.ACCESS_KEY) {
    res.status(500).json({ error: "missing_env", detail: "ACCESS_KEY não definida no projeto" });
    return;
  }
  if (key !== process.env.ACCESS_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (!url || !token) {
    res.status(500).json({ error: "missing_env", detail: "credenciais do Redis não encontradas (KV_REST_API_URL/TOKEN ou UPSTASH_REDIS_REST_URL/TOKEN)" });
    return;
  }

  const redis = new Redis({ url, token, automaticDeserialization: false });

  try {
    if (req.method === "GET") {
      const v = await redis.get(DKEY);
      res.status(200).json({ v: typeof v === "string" ? v : null });
      return;
    }
    if (req.method === "PUT") {
      const b = req.body;
      const v = b && typeof b.v === "string" ? b.v : null;
      if (!v || v.length > MAX) {
        res.status(400).json({ error: "bad_payload" });
        return;
      }
      JSON.parse(v);
      await redis.set(DKEY, v);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: String(e && e.message || e).slice(0, 200) });
  }
}
