import Razorpay from "razorpay";
export function razorpay() { const key_id = process.env.RAZORPAY_KEY_ID; const key_secret = process.env.RAZORPAY_KEY_SECRET; if (!key_id || !key_secret) throw new Error("Razorpay Test Mode is not configured."); return new Razorpay({ key_id, key_secret }); }
export function razorpayKeyId() { const value = process.env.RAZORPAY_KEY_ID; if (!value) throw new Error("Razorpay Test Mode is not configured."); return value; }
export function planForCurrency(currency: string) { const value = process.env[`RAZORPAY_PLAN_ID_${currency}`]; if (!value) throw new Error(`Razorpay Test Mode is not configured for ${currency} subscriptions.`); return value; }
