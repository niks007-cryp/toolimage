import { createClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured.`); return value; }
export function adminSupabase() { return createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } }); }
export async function requireUser(req: VercelRequest) { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ""); if (!token) throw new Error("Unauthorized"); const { data, error } = await adminSupabase().auth.getUser(token); if (error || !data.user) throw new Error("Unauthorized"); return data.user; }
