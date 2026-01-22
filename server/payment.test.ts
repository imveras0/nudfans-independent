import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the Stripe client functions
vi.mock("./stripe/client", () => ({
  getOrCreateStripeCustomer: vi.fn().mockResolvedValue("cus_test123"),
  createSubscriptionCheckout: vi.fn().mockResolvedValue("https://checkout.stripe.com/test"),
  createPPVCheckout: vi.fn().mockResolvedValue("https://checkout.stripe.com/test-ppv"),
  createTipCheckout: vi.fn().mockResolvedValue("https://checkout.stripe.com/test-tip"),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
}));

// Mock the database functions
vi.mock("./db", () => ({
  getCreatorProfileById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 2,
    username: "testcreator",
    displayName: "Test Creator",
    subscriptionPrice: "9.99",
  }),
  getActiveSubscription: vi.fn().mockResolvedValue(null),
  getUserById: vi.fn().mockResolvedValue({
    id: 1,
    email: "test@example.com",
    name: "Test User",
    stripeCustomerId: null,
  }),
  updateUserStripeCustomerId: vi.fn().mockResolvedValue(undefined),
  getPostById: vi.fn().mockResolvedValue({
    id: 1,
    creatorId: 1,
    postType: "ppv",
    ppvPrice: "5.99",
  }),
  hasPurchasedPost: vi.fn().mockResolvedValue(false),
  getSubscriptionById: vi.fn().mockResolvedValue({
    id: 1,
    subscriberId: 1,
    stripeSubscriptionId: "sub_test123",
  }),
  cancelSubscription: vi.fn().mockResolvedValue(undefined),
  getUserSubscriptions: vi.fn().mockResolvedValue([]),
  getUserPurchases: vi.fn().mockResolvedValue([]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
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
      headers: {
        origin: "https://test.example.com",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("payment.createSubscriptionCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a checkout URL for subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createSubscriptionCheckout({
      creatorId: 1,
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(typeof result.checkoutUrl).toBe("string");
  });
});

describe("payment.createPPVCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a checkout URL for PPV purchase", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createPPVCheckout({
      postId: 1,
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(typeof result.checkoutUrl).toBe("string");
  });
});

describe("payment.createTipCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a checkout URL for tip", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createTipCheckout({
      creatorId: 1,
      amount: 10,
      message: "Great content!",
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(typeof result.checkoutUrl).toBe("string");
  });
});

describe("payment.getMySubscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user subscriptions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.getMySubscriptions();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("payment.getMyPurchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user purchases", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.getMyPurchases();

    expect(Array.isArray(result)).toBe(true);
  });
});
