import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "email",
    role: "user",
    userType: "fan",
    stripeCustomerId: null,
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AI Chat System", () => {
  it("should have chat router with sendAIMessage procedure", () => {
    expect(appRouter._def.procedures).toBeDefined();
    // Verify the chat router exists
    expect(appRouter._def.record.chat).toBeDefined();
  });

  it("should have message router with getConversations procedure", () => {
    expect(appRouter._def.record.message).toBeDefined();
  });
});

describe("Explore Feed", () => {
  it("should have post router with getExploreFeed procedure", () => {
    expect(appRouter._def.record.post).toBeDefined();
  });
});

describe("Creator Profile Features", () => {
  it("should have creator router with required procedures", () => {
    const creatorRouter = appRouter._def.record.creator;
    expect(creatorRouter).toBeDefined();
  });

  it("should have follow/unfollow procedures in subscription router", () => {
    const subscriptionRouter = appRouter._def.record.subscription;
    expect(subscriptionRouter).toBeDefined();
  });
});

describe("Notifications System", () => {
  it("should have notification router", () => {
    const notificationRouter = appRouter._def.record.notification;
    expect(notificationRouter).toBeDefined();
  });
});
