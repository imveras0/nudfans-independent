import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["fan", "creator"]),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Creator profiles with extended information
 */
export const creatorProfiles = mysqlTable("creator_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  coverPositionY: int("coverPositionY").default(50),
  isVerified: boolean("isVerified").default(false).notNull(),
  isOnline: boolean("isOnline").default(false).notNull(),
  lastOnlineAt: timestamp("lastOnlineAt"),
  subscriptionPrice: decimal("subscriptionPrice", { precision: 10, scale: 2 }).default("9.99"),
  stripeAccountId: varchar("stripeAccountId", { length: 100 }),
  stripeAccountStatus: mysqlEnum("stripeAccountStatus", ["pending", "active", "restricted"]).default("pending"),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;

/**
 * Posts created by creators
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  content: text("content"),
  postType: mysqlEnum("postType", ["free", "subscription", "ppv"]).default("free").notNull(),
  ppvPrice: decimal("ppvPrice", { precision: 10, scale: 2 }),
  blurIntensity: int("blurIntensity").default(20),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  viewsCount: int("viewsCount").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Media files attached to posts
 */
export const postMedia = mysqlTable("post_media", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  width: int("width"),
  height: int("height"),
  duration: int("duration"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = typeof postMedia.$inferInsert;

/**
 * Followers relationship (free)
 */
export const followers = mysqlTable("followers", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  creatorId: int("creatorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follower = typeof followers.$inferSelect;
export type InsertFollower = typeof followers.$inferInsert;

/**
 * Subscriptions (paid)
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId").notNull(),
  creatorId: int("creatorId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "expired"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  priceAtPurchase: decimal("priceAtPurchase", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * PPV purchases
 */
export const ppvPurchases = mysqlTable("ppv_purchases", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  postId: int("postId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PpvPurchase = typeof ppvPurchases.$inferSelect;
export type InsertPpvPurchase = typeof ppvPurchases.$inferInsert;

/**
 * Tips/Gorjetas
 */
export const tips = mysqlTable("tips", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  creatorId: int("creatorId").notNull(),
  postId: int("postId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

/**
 * Post likes
 */
export const postLikes = mysqlTable("post_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

/**
 * Chat conversations
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  fanId: int("fanId").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  creatorUnreadCount: int("creatorUnreadCount").default(0).notNull(),
  fanUnreadCount: int("fanUnreadCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Chat messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  isRead: boolean("isRead").default(false).notNull(),
  isAI: boolean("isAI").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Transactions log for analytics
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  userId: int("userId"),
  type: mysqlEnum("type", ["subscription", "ppv", "tip"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  creatorEarnings: decimal("creatorEarnings", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 100 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Creator analytics daily snapshots
 */
export const analyticsDaily = mysqlTable("analytics_daily", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  date: timestamp("date").notNull(),
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  newFollowers: int("newFollowers").default(0).notNull(),
  newSubscribers: int("newSubscribers").default(0).notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type InsertAnalyticsDaily = typeof analyticsDaily.$inferInsert;

/**
 * Shop items for creators
 */
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

/**
 * Shop purchases
 */
export const shopPurchases = mysqlTable("shop_purchases", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  itemId: int("itemId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopPurchase = typeof shopPurchases.$inferSelect;
export type InsertShopPurchase = typeof shopPurchases.$inferInsert;


/**
 * Post comments
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Comment likes
 */
export const commentLikes = mysqlTable("comment_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  commentId: int("commentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;

/**
 * User notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["new_follower", "new_subscriber", "new_comment", "new_like", "new_message", "new_tip", "new_post"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 50 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
