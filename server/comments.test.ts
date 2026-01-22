import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getPostById: vi.fn().mockResolvedValue({ id: 1, creatorId: 1, content: "Test post" }),
  createComment: vi.fn().mockResolvedValue(1),
  getPostComments: vi.fn().mockResolvedValue([
    {
      id: 1,
      postId: 1,
      userId: 2,
      content: "Test comment",
      likesCount: 0,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 2, name: "Test User", avatarUrl: null, username: null },
      replies: [],
    },
  ]),
  getCommentById: vi.fn().mockResolvedValue({
    id: 1,
    postId: 1,
    userId: 1,
    content: "Test comment",
  }),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  likeComment: vi.fn().mockResolvedValue(true),
  getCreatorProfileById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 2,
    username: "testcreator",
    displayName: "Test Creator",
  }),
  createNotification: vi.fn().mockResolvedValue(1),
  getUserNotifications: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      type: "new_comment",
      title: "Novo comentário",
      message: "Alguém comentou no seu post",
      relatedId: 1,
      relatedType: "post",
      isRead: false,
      createdAt: new Date(),
    },
  ]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(5),
  markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
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
      headers: { origin: "https://example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("comment router", () => {
  describe("getByPost", () => {
    it("returns comments for a post", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.comment.getByPost({ postId: 1 });
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("content");
      expect(result[0]).toHaveProperty("user");
    });
  });

  describe("create", () => {
    it("creates a comment when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.comment.create({
        postId: 1,
        content: "This is a test comment",
      });
      
      expect(result).toHaveProperty("id");
    });

    it("throws error when not authenticated", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.comment.create({
          postId: 1,
          content: "This is a test comment",
        })
      ).rejects.toThrow();
    });
  });

  describe("like", () => {
    it("toggles like on a comment", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.comment.like({ commentId: 1 });
      
      expect(result).toHaveProperty("liked");
      expect(typeof result.liked).toBe("boolean");
    });
  });
});

describe("notification router", () => {
  describe("getAll", () => {
    it("returns notifications for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notification.getAll({ limit: 20 });
      
      expect(result).toBeInstanceOf(Array);
    });

    it("throws error when not authenticated", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.notification.getAll({ limit: 20 })
      ).rejects.toThrow();
    });
  });

  describe("getUnreadCount", () => {
    it("returns unread count for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notification.getUnreadCount();
      
      expect(typeof result).toBe("number");
    });
  });

  describe("markAsRead", () => {
    it("marks notification as read", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notification.markAsRead({ id: 1 });
      
      expect(result).toEqual({ success: true });
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notification.markAllAsRead();
      
      expect(result).toEqual({ success: true });
    });
  });
});
