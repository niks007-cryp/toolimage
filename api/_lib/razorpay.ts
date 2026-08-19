import Razorpay from "razorpay";
import { TOOLIMAGE_PRO_PLAN_ID } from "./toolimageProPlan.js";

export function razorpay() { const key_id = process.env.RAZORPAY_KEY_ID; const key_secret = process.env.RAZORPAY_KEY_SECRET; if (!key_id || !key_secret) throw new Error("Razorpay is not configured."); return new Razorpay({ key_id, key_secret }); }
export function razorpayKeyId() { const value = process.env.RAZORPAY_KEY_ID; if (!value) throw new Error("Razorpay is not configured."); return value; }
export function planForCurrency(currency: string) { if (currency !== "INR") throw new Error("ToolImage Pro is currently available in INR only."); return TOOLIMAGE_PRO_PLAN_ID; }
