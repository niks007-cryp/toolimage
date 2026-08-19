import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), from: vi.fn(), fetchSubscription: vi.fn(), cancelSubscription: vi.fn() }));
vi.mock("../../../api/_lib/supabase.js", () => ({ requireUser: mocks.requireUser, adminSupabase: () => ({ from: mocks.from }) }));
vi.mock("../../../api/_lib/razorpay.js", () => ({ razorpay: () => ({ subscriptions: { fetch: mocks.fetchSubscription, cancel: mocks.cancelSubscription } }) }));

import cancelHandler from "../../../api/subscriptions/cancel";
import statusHandler from "../../../api/subscriptions/status";
import { TOOLIMAGE_PRO_PLAN_ID } from "../../../api/_lib/toolimageProPlan";

function responseMock() { const recorded = { statusCode: 200, body: null as unknown }; const response = { status(code: number) { recorded.statusCode = code; return response; }, json(body: unknown) { recorded.body = body; return response; }, setHeader() { return response; } } as unknown as VercelResponse; return { response, recorded }; }
function requestMock(method: "GET" | "POST") { return { method, headers: { authorization: "Bearer test" } } as unknown as VercelRequest; }
function databaseWith(entitlement: unknown) { const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })); mocks.from.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: entitlement, error: null })) })) })), update }); return { update }; }

beforeEach(() => { vi.clearAllMocks(); mocks.requireUser.mockResolvedValue({ id: "user_owner" }); });

describe("subscription management API", () => {
  it("returns only the signed-in user’s recorded provider subscription", async () => { databaseWith({ razorpay_subscription_id: "sub_owner", razorpay_plan_id: TOOLIMAGE_PRO_PLAN_ID }); mocks.fetchSubscription.mockResolvedValue({ id: "sub_owner", plan_id: TOOLIMAGE_PRO_PLAN_ID, status: "active", current_end: 1789824000 }); const { response, recorded } = responseMock(); await statusHandler(requestMock("GET"), response); expect(recorded.statusCode).toBe(200); expect(recorded.body).toMatchObject({ subscription: { plan: "ToolImage Pro", price: "₹149/month", status: "active" } }); });
  it("sends a cycle-end cancellation only for the server-recorded owned subscription", async () => { const { update } = databaseWith({ razorpay_subscription_id: "sub_owner", razorpay_plan_id: TOOLIMAGE_PRO_PLAN_ID }); mocks.fetchSubscription.mockResolvedValue({ id: "sub_owner", plan_id: TOOLIMAGE_PRO_PLAN_ID, status: "active", current_end: 1789824000 }); mocks.cancelSubscription.mockResolvedValue({ id: "sub_owner", plan_id: TOOLIMAGE_PRO_PLAN_ID, status: "active", current_end: 1789824000, has_scheduled_changes: true }); const { response, recorded } = responseMock(); await cancelHandler(requestMock("POST"), response); expect(mocks.cancelSubscription).toHaveBeenCalledWith("sub_owner", true); expect(update).toHaveBeenCalledOnce(); expect(recorded.statusCode).toBe(200); expect(recorded.body).toMatchObject({ cancelled: true, cancellationPending: true, status: "cancellation_pending" }); });
  it("refuses a mismatched provider subscription and never calls cancellation", async () => { databaseWith({ razorpay_subscription_id: "sub_owner", razorpay_plan_id: TOOLIMAGE_PRO_PLAN_ID }); mocks.fetchSubscription.mockResolvedValue({ id: "sub_other", plan_id: TOOLIMAGE_PRO_PLAN_ID, status: "active" }); const { response, recorded } = responseMock(); await cancelHandler(requestMock("POST"), response); expect(mocks.cancelSubscription).not.toHaveBeenCalled(); expect(recorded.statusCode).toBe(400); expect(recorded.body).toEqual({ error: "Subscription ownership could not be confirmed." }); });
  it("refuses cancellation for an expired server-confirmed subscription", async () => { databaseWith({ razorpay_subscription_id: "sub_owner", razorpay_plan_id: TOOLIMAGE_PRO_PLAN_ID }); mocks.fetchSubscription.mockResolvedValue({ id: "sub_owner", plan_id: TOOLIMAGE_PRO_PLAN_ID, status: "expired", current_end: 1 }); const { response, recorded } = responseMock(); await cancelHandler(requestMock("POST"), response); expect(mocks.cancelSubscription).not.toHaveBeenCalled(); expect(recorded.statusCode).toBe(400); expect(recorded.body).toEqual({ error: "Only an active Pro subscription can be cancelled." }); });
});
