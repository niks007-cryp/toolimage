import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method } from "./_lib/http.js";
import { adminSupabase, requireUser } from "./_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) { if (!method(req, res, "GET")) return; try { const user = await requireUser(req); const db = adminSupabase(); const { data, error } = await db.from("entitlements").select("status,current_period_end").eq("user_id", user.id).maybeSingle(); if (error) throw error; let status = data?.status || "free"; if (status === "grace" && data?.current_period_end && new Date(data.current_period_end).getTime() <= Date.now()) { status = "inactive"; await db.from("entitlements").update({ status }).eq("user_id", user.id); } res.status(200).json({ status, pro: status === "pro" || status === "grace" }); } catch (error) { apiError(res, error, error instanceof Error && error.message === "Unauthorized" ? 401 : 500); } }
