import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = new Redis({ url, token, automaticDeserialization: false });

const DKEY = "mentoria-hq-state";
const MAX = 900000; // ~0,9 MB de estado — folga enorme pro JSON do HQ

export default async function handler(req, res) {
  // chave de acesso obrigatória (definida na env ACCESS_KEY do projeto)
  const key = req.headers["x-access-key"];
  if (!process.env.ACCESS_KEY || key !== process.env.ACCESS_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

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
      JSON.parse(v); // valida que é JSON antes de gravar
      await redis.set(DKEY, v);
      res.status(200).json({ ok: true });
      return;
    }
    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
}
