import { eq, and, desc, sql, gte, lte, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  creatorProfiles, InsertCreatorProfile, CreatorProfile,
  posts, InsertPost, Post,
  postMedia, InsertPostMedia,
  followers, InsertFollower,
  subscriptions, InsertSubscription,
  ppvPurchases, InsertPpvPurchase,
  tips, InsertTip,
  postLikes,
  conversations, InsertConversation,
  messages, InsertMessage,
  transactions, InsertTransaction,
  analyticsDaily,
  shopItems, InsertShopItem,
  shopPurchases,
  comments, InsertComment,
  commentLikes,
  notifications, InsertNotification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(users).values(user);
  return result[0].insertId;
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserOnboarding(userId: number, userType: "fan" | "creator") {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ userType, onboardingCompleted: true })
    .where(eq(users.id, userId));
}

// ==================== CREATOR PROFILE QUERIES ====================

export async function createCreatorProfile(profile: InsertCreatorProfile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creatorProfiles).values(profile);
  return result[0].insertId;
}

export async function getCreatorProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getCreatorProfileByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.username, username)).limit(1);
  return result[0];
}

export async function getCreatorProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, id)).limit(1);
  return result[0];
}

export async function updateCreatorProfile(id: number, data: Partial<InsertCreatorProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(creatorProfiles).set(data).where(eq(creatorProfiles.id, id));
}

export async function getAllCreators(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creatorProfiles).limit(limit).offset(offset).orderBy(desc(creatorProfiles.createdAt));
}

export async function searchCreators(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creatorProfiles)
    .where(or(
      sql`${creatorProfiles.username} LIKE ${`%${query}%`}`,
      sql`${creatorProfiles.displayName} LIKE ${`%${query}%`}`
    ))
    .limit(limit);
}

export async function isUsernameAvailable(username: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  return result.length === 0;
}

export async function setCreatorOnlineStatus(creatorId: number, isOnline: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(creatorProfiles)
    .set({ isOnline, lastOnlineAt: new Date() })
    .where(eq(creatorProfiles.id, creatorId));
}

// ==================== POST QUERIES ====================

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(posts).values(post);
  return result[0].insertId;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0];
}

export async function getPostsByCreator(creatorId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts)
    .where(and(eq(posts.creatorId, creatorId), eq(posts.isPublished, true)))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set(data).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posts).where(eq(posts.id, id));
}

export async function incrementPostViews(postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts)
    .set({ viewsCount: sql`${posts.viewsCount} + 1` })
    .where(eq(posts.id, postId));
}

export async function getFeedPosts(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getExploreVideoPosts(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  // First, try to get posts that have video media
  const postsWithVideos = await db.select({
    id: posts.id,
    creatorId: posts.creatorId,
    content: posts.content,
    postType: posts.postType,
    likesCount: posts.likesCount,
    viewsCount: posts.viewsCount,
    createdAt: posts.createdAt,
  })
    .from(posts)
    .innerJoin(postMedia, eq(posts.id, postMedia.postId))
    .where(and(
      eq(posts.isPublished, true),
      eq(postMedia.mediaType, 'video')
    ))
    .orderBy(desc(posts.viewsCount), desc(posts.likesCount))
    .limit(limit);
  
  // Remove duplicates (a post might have multiple videos)
  let uniquePosts = Array.from(
    new Map(postsWithVideos.map(p => [p.id, p])).values()
  );
  
  // Return ONLY video posts - no fallback to images
  return uniquePosts;
}

// ==================== POST MEDIA QUERIES ====================

export async function addPostMedia(media: InsertPostMedia) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(postMedia).values(media);
  return result[0].insertId;
}

export async function getPostMedia(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postMedia)
    .where(eq(postMedia.postId, postId))
    .orderBy(postMedia.sortOrder);
}

export async function deletePostMedia(postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(postMedia).where(eq(postMedia.postId, postId));
}

// ==================== FOLLOWER QUERIES ====================

export async function followCreator(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(followers).values({ followerId, creatorId });
}

export async function unfollowCreator(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(followers)
    .where(and(eq(followers.followerId, followerId), eq(followers.creatorId, creatorId)));
}

export async function isFollowing(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: followers.id })
    .from(followers)
    .where(and(eq(followers.followerId, followerId), eq(followers.creatorId, creatorId)))
    .limit(1);
  return result.length > 0;
}

export async function getFollowersCount(creatorId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(followers)
    .where(eq(followers.creatorId, creatorId));
  return result[0]?.count ?? 0;
}

export async function getCreatorFollowers(creatorId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: followers.id,
    followerId: followers.followerId,
    createdAt: followers.createdAt,
    user: users,
  })
    .from(followers)
    .innerJoin(users, eq(followers.followerId, users.id))
    .where(eq(followers.creatorId, creatorId))
    .limit(limit)
    .offset(offset);
}

// ==================== SUBSCRIPTION QUERIES ====================

export async function createSubscription(sub: InsertSubscription) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(subscriptions).values(sub);
  return result[0].insertId;
}

export async function getActiveSubscription(subscriberId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.subscriberId, subscriberId),
      eq(subscriptions.creatorId, creatorId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);
  return result[0];
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

export async function getSubscribersCount(creatorId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active")));
  return result[0]?.count ?? 0;
}

export async function getCreatorSubscribers(creatorId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: subscriptions.id,
    subscriberId: subscriptions.subscriberId,
    status: subscriptions.status,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    user: users,
  })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.subscriberId, users.id))
    .where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active")))
    .limit(limit)
    .offset(offset);
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    subscription: subscriptions,
    creator: creatorProfiles,
  })
    .from(subscriptions)
    .innerJoin(creatorProfiles, eq(subscriptions.creatorId, creatorProfiles.id))
    .where(and(eq(subscriptions.subscriberId, userId), eq(subscriptions.status, "active")));
}

// ==================== PPV PURCHASE QUERIES ====================

export async function createPpvPurchase(purchase: InsertPpvPurchase) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ppvPurchases).values(purchase);
  return result[0].insertId;
}

export async function hasPurchasedPost(buyerId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: ppvPurchases.id })
    .from(ppvPurchases)
    .where(and(
      eq(ppvPurchases.buyerId, buyerId),
      eq(ppvPurchases.postId, postId),
      eq(ppvPurchases.status, "completed")
    ))
    .limit(1);
  return result.length > 0;
}

export async function updatePpvPurchase(id: number, data: Partial<InsertPpvPurchase>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ppvPurchases).set(data).where(eq(ppvPurchases.id, id));
}

// ==================== TIP QUERIES ====================

export async function createTip(tip: InsertTip) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(tips).values(tip);
  return result[0].insertId;
}

export async function updateTip(id: number, data: Partial<InsertTip>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tips).set(data).where(eq(tips.id, id));
}

export async function getCreatorTips(creatorId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    tip: tips,
    sender: users,
  })
    .from(tips)
    .innerJoin(users, eq(tips.senderId, users.id))
    .where(and(eq(tips.creatorId, creatorId), eq(tips.status, "completed")))
    .orderBy(desc(tips.createdAt))
    .limit(limit);
}

// ==================== LIKE QUERIES ====================

export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(postLikes).values({ userId, postId });
  await db.update(posts)
    .set({ likesCount: sql`${posts.likesCount} + 1` })
    .where(eq(posts.id, postId));
}

export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
  await db.update(posts)
    .set({ likesCount: sql`${posts.likesCount} - 1` })
    .where(eq(posts.id, postId));
}

export async function hasLikedPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
    .limit(1);
  return result.length > 0;
}

export async function getCreatorTotalLikes(creatorId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sql<number>`SUM(${posts.likesCount})` })
    .from(posts)
    .where(eq(posts.creatorId, creatorId));
  return result[0]?.total ?? 0;
}

// ==================== CONVERSATION QUERIES ====================

export async function getOrCreateConversation(creatorId: number, fanId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(conversations)
    .where(and(eq(conversations.creatorId, creatorId), eq(conversations.fanId, fanId)))
    .limit(1);
  
  if (existing[0]) return existing[0];
  
  const result = await db.insert(conversations).values({ creatorId, fanId });
  const newConv = await db.select().from(conversations).where(eq(conversations.id, result[0].insertId)).limit(1);
  return newConv[0];
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function getUserConversations(userId: number, creatorProfileId: number | null) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all conversations where user is either a fan OR a creator
  // This allows creators to also chat with other creators as fans
  const whereClause = creatorProfileId 
    ? or(eq(conversations.fanId, userId), eq(conversations.creatorId, creatorProfileId))
    : eq(conversations.fanId, userId);
  
  return db.select().from(conversations)
    .where(whereClause)
    .orderBy(desc(conversations.lastMessageAt));
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ==================== MESSAGE QUERIES ====================

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values(message);
  
  await db.update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, message.conversationId));
  
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { messages: [], total: 0, hasMore: false };
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  const total = countResult[0]?.count || 0;
  
  // Get messages (ordered by createdAt ASC so oldest first, then we can load more by increasing offset)
  const messagesList = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
  
  return {
    messages: messagesList.reverse(), // Reverse to show oldest first in UI
    total,
    hasMore: offset + limit < total,
  };
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages)
    .set({ isRead: true })
    .where(and(
      eq(messages.conversationId, conversationId),
      sql`${messages.senderId} != ${userId}`
    ));
}

export async function getLastMessage(conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return result[0] || null;
}

export async function getUnreadCount(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(messages)
    .where(and(
      eq(messages.conversationId, conversationId),
      sql`${messages.senderId} != ${userId}`,
      eq(messages.isRead, false)
    ));
  return Number(result[0]?.count) || 0;
}

// ==================== TRANSACTION QUERIES ====================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(transactions).values(transaction);
  return result[0].insertId;
}

export async function getCreatorTransactions(creatorId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions)
    .where(eq(transactions.creatorId, creatorId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCreatorEarnings(creatorId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, subscription: 0, ppv: 0, tips: 0 };
  
  let whereClause = and(
    eq(transactions.creatorId, creatorId),
    eq(transactions.status, "completed")
  );
  
  if (startDate) {
    whereClause = and(whereClause, gte(transactions.createdAt, startDate));
  }
  if (endDate) {
    whereClause = and(whereClause, lte(transactions.createdAt, endDate));
  }
  
  const result = await db.select({
    type: transactions.type,
    total: sql<number>`SUM(${transactions.creatorEarnings})`,
  })
    .from(transactions)
    .where(whereClause)
    .groupBy(transactions.type);
  
  const earnings = { total: 0, subscription: 0, ppv: 0, tips: 0 };
  for (const row of result) {
    const amount = Number(row.total) || 0;
    earnings.total += amount;
    if (row.type === "subscription") earnings.subscription = amount;
    if (row.type === "ppv") earnings.ppv = amount;
    if (row.type === "tip") earnings.tips = amount;
  }
  
  return earnings;
}

// ==================== ANALYTICS QUERIES ====================

export async function getCreatorAnalytics(creatorId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.select().from(analyticsDaily)
    .where(and(
      eq(analyticsDaily.creatorId, creatorId),
      gte(analyticsDaily.date, startDate)
    ))
    .orderBy(analyticsDaily.date);
}

export async function upsertDailyAnalytics(creatorId: number, date: Date, data: Partial<typeof analyticsDaily.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  
  const dateOnly = new Date(date.toISOString().split('T')[0]);
  
  const existing = await db.select().from(analyticsDaily)
    .where(and(
      eq(analyticsDaily.creatorId, creatorId),
      eq(analyticsDaily.date, dateOnly)
    ))
    .limit(1);
  
  if (existing[0]) {
    await db.update(analyticsDaily)
      .set(data)
      .where(eq(analyticsDaily.id, existing[0].id));
  } else {
    await db.insert(analyticsDaily).values({
      creatorId,
      date: dateOnly,
      ...data,
    });
  }
}

// ==================== SHOP QUERIES ====================

export async function createShopItem(item: InsertShopItem) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(shopItems).values(item);
  return result[0].insertId;
}

export async function getCreatorShopItems(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopItems)
    .where(and(eq(shopItems.creatorId, creatorId), eq(shopItems.isActive, true)))
    .orderBy(desc(shopItems.createdAt));
}

export async function getShopItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shopItems).where(eq(shopItems.id, id)).limit(1);
  return result[0];
}

export async function updateShopItem(id: number, data: Partial<InsertShopItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopItems).set(data).where(eq(shopItems.id, id));
}

// ==================== STATS QUERIES ====================

export async function getCreatorStats(creatorId: number) {
  const db = await getDb();
  if (!db) return { posts: 0, followers: 0, subscribers: 0, likes: 0 };
  
  const [postsResult, followersResult, subscribersResult, likesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.creatorId, creatorId)),
    db.select({ count: sql<number>`count(*)` }).from(followers).where(eq(followers.creatorId, creatorId)),
    db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active"))),
    db.select({ total: sql<number>`COALESCE(SUM(${posts.likesCount}), 0)` }).from(posts).where(eq(posts.creatorId, creatorId)),
  ]);
  
  return {
    posts: postsResult[0]?.count ?? 0,
    followers: followersResult[0]?.count ?? 0,
    subscribers: subscribersResult[0]?.count ?? 0,
    likes: likesResult[0]?.total ?? 0,
  };
}

// ==================== STRIPE RELATED QUERIES ====================

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ stripeCustomerId })
    .where(eq(users.id, userId));
}

export async function getSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return result[0];
}

export async function cancelSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions)
    .set({ status: "canceled" })
    .where(eq(subscriptions.id, subscriptionId));
}



export async function getUserPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const purchases = await db.select().from(ppvPurchases)
    .where(eq(ppvPurchases.buyerId, userId))
    .orderBy(desc(ppvPurchases.createdAt));
  
  // Get post details for each purchase
  const result = await Promise.all(purchases.map(async (purchase) => {
    const post = await getPostById(purchase.postId);
    const creator = post ? await getCreatorProfileById(post.creatorId) : null;
    return { ...purchase, post, creator };
  }));
  
  return result;
}


// ==================== COMMENT QUERIES ====================

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(comments).values(comment);
  
  // Update post comments count
  await db.update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} + 1` })
    .where(eq(posts.id, comment.postId));
  
  return result[0].insertId;
}

export async function getPostComments(postId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(comments)
    .where(and(eq(comments.postId, postId), sql`${comments.parentId} IS NULL`))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Get user info for each comment
  const commentsWithUsers = await Promise.all(result.map(async (comment) => {
    const user = await getUserById(comment.userId);
    const creatorProfile = user ? await getCreatorProfileByUserId(user.id) : null;
    const replies = await getCommentReplies(comment.id);
    return { 
      ...comment, 
      user: user ? { 
        id: user.id, 
        name: user.name,
        avatarUrl: creatorProfile?.avatarUrl,
        username: creatorProfile?.username,
      } : null,
      replies,
    };
  }));
  
  return commentsWithUsers;
}

export async function getCommentReplies(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(comments)
    .where(eq(comments.parentId, parentId))
    .orderBy(comments.createdAt);
  
  const repliesWithUsers = await Promise.all(result.map(async (reply) => {
    const user = await getUserById(reply.userId);
    const creatorProfile = user ? await getCreatorProfileByUserId(user.id) : null;
    return { 
      ...reply, 
      user: user ? { 
        id: user.id, 
        name: user.name,
        avatarUrl: creatorProfile?.avatarUrl,
        username: creatorProfile?.username,
      } : null,
    };
  }));
  
  return repliesWithUsers;
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return result[0];
}

export async function deleteComment(id: number, postId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(comments).where(eq(comments.id, id));
  
  // Update post comments count
  await db.update(posts)
    .set({ commentsCount: sql`GREATEST(${posts.commentsCount} - 1, 0)` })
    .where(eq(posts.id, postId));
}

export async function likeComment(userId: number, commentId: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(commentLikes)
    .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)))
    .limit(1);
  
  if (existing[0]) {
    // Unlike
    await db.delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    await db.update(comments)
      .set({ likesCount: sql`GREATEST(${comments.likesCount} - 1, 0)` })
      .where(eq(comments.id, commentId));
    return false;
  } else {
    // Like
    await db.insert(commentLikes).values({ userId, commentId });
    await db.update(comments)
      .set({ likesCount: sql`${comments.likesCount} + 1` })
      .where(eq(comments.id, commentId));
    return true;
  }
}

export async function hasLikedComment(userId: number, commentId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(commentLikes)
    .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)))
    .limit(1);
  return !!result[0];
}

// ==================== NOTIFICATION QUERIES ====================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getUserNotifications(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count) || 0;
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.id, id));
}


// ==================== ADMIN QUERIES ====================

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalCreators: 0, totalUsers: 0, totalRevenue: "0.00", totalSubscriptions: 0 };
  
  const [creatorsResult, usersResult, revenueResult, subscriptionsResult] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(creatorProfiles),
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions).where(eq(transactions.status, "completed")),
    db.select({ count: sql<number>`COUNT(*)` }).from(subscriptions).where(eq(subscriptions.status, "active")),
  ]);
  
  return {
    totalCreators: Number(creatorsResult[0]?.count) || 0,
    totalUsers: Number(usersResult[0]?.count) || 0,
    totalRevenue: revenueResult[0]?.total || "0.00",
    totalSubscriptions: Number(subscriptionsResult[0]?.count) || 0,
  };
}

export async function getAllCreatorsAdmin(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let creators;
  
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    creators = await db.select().from(creatorProfiles)
      .where(or(
        like(creatorProfiles.username, searchTerm),
        like(creatorProfiles.displayName, searchTerm)
      ))
      .orderBy(desc(creatorProfiles.createdAt));
  } else {
    creators = await db.select().from(creatorProfiles).orderBy(desc(creatorProfiles.createdAt));
  }
  
  // Get stats for each creator
  const creatorsWithStats = await Promise.all(creators.map(async (creator) => {
    const stats = await getCreatorStats(creator.id);
    return { ...creator, stats };
  }));
  
  return creatorsWithStats;
}

export async function getAllUsersAdmin(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    return db.select().from(users)
      .where(or(
        like(users.name, searchTerm),
        like(users.email, searchTerm)
      ))
      .orderBy(desc(users.createdAt));
  }
  
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAllTransactionsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(100);
}

export async function createVirtualUser(name: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Create a virtual user with a unique openId
  const virtualOpenId = `virtual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const result = await db.insert(users).values({
    openId: virtualOpenId,
    name,
    userType: "creator",
    onboardingCompleted: true,
  });
  
  return result[0].insertId;
}

export async function updateCreatorProfileAdmin(creatorId: number, data: Partial<{
  displayName: string;
  bio: string;
  location: string;
  subscriptionPrice: string;
  isVerified: boolean;
  isOnline: boolean;
  avatarUrl: string;
  coverUrl: string;
  coverPositionY: number;
}>) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.subscriptionPrice !== undefined) updateData.subscriptionPrice = data.subscriptionPrice;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
  if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
  if (data.coverPositionY !== undefined) updateData.coverPositionY = data.coverPositionY;
  
  if (Object.keys(updateData).length > 0) {
    await db.update(creatorProfiles)
      .set(updateData)
      .where(eq(creatorProfiles.id, creatorId));
  }
}

export async function deleteCreatorAdmin(creatorId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Get the creator to find the userId
  const creator = await getCreatorProfileById(creatorId);
  if (!creator) return;
  
  // Delete related data
  await db.delete(posts).where(eq(posts.creatorId, creatorId));
  await db.delete(followers).where(eq(followers.creatorId, creatorId));
  await db.delete(subscriptions).where(eq(subscriptions.creatorId, creatorId));
  await db.delete(conversations).where(eq(conversations.creatorId, creatorId));
  await db.delete(creatorProfiles).where(eq(creatorProfiles.id, creatorId));
  
  // Delete the virtual user if it exists
  if (creator.userId) {
    const user = await getUserById(creator.userId);
    if (user && user.openId.startsWith("virtual_")) {
      await db.delete(users).where(eq(users.id, creator.userId));
    }
  }
}

export async function toggleCreatorVerified(creatorId: number) {
  const db = await getDb();
  if (!db) return;
  
  const creator = await getCreatorProfileById(creatorId);
  if (!creator) return;
  
  await db.update(creatorProfiles)
    .set({ isVerified: !creator.isVerified })
    .where(eq(creatorProfiles.id, creatorId));
}

export async function getDetailedAdminStats() {
  const db = await getDb();
  if (!db) return null;
  
  // Get total posts
  const postsResult = await db.select({ count: sql<number>`count(*)` }).from(posts);
  const totalPosts = Number(postsResult[0]?.count) || 0;
  
  // Get total views (sum of all post views)
  const viewsResult = await db.select({ total: sql<number>`COALESCE(SUM(views_count), 0)` }).from(posts);
  const totalViews = Number(viewsResult[0]?.total) || 0;
  
  // Get total likes
  const likesResult = await db.select({ count: sql<number>`count(*)` }).from(postLikes);
  const totalLikes = Number(likesResult[0]?.count) || 0;
  
  // Get verified creators count
  const verifiedResult = await db.select({ count: sql<number>`count(*)` })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.isVerified, true));
  const verifiedCreators = Number(verifiedResult[0]?.count) || 0;
  
  // Get online creators count
  const onlineResult = await db.select({ count: sql<number>`count(*)` })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.isOnline, true));
  const onlineCreators = Number(onlineResult[0]?.count) || 0;
  
  // Get total creators for average calculation
  const creatorsResult = await db.select({ count: sql<number>`count(*)` }).from(creatorProfiles);
  const totalCreators = Number(creatorsResult[0]?.count) || 1;
  
  // Calculate average posts per creator
  const avgPostsPerCreator = totalPosts / totalCreators;
  
  // Get average subscription price
  const avgPriceResult = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(subscription_price AS DECIMAL(10,2))), 9.99)` }).from(creatorProfiles);
  const avgSubscriptionPrice = Number(avgPriceResult[0]?.avg)?.toFixed(2) || "9.99";
  
  // Get platform fees (20% of total revenue)
  const revenueResult = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` })
    .from(transactions)
    .where(eq(transactions.status, "completed"));
  const totalRevenue = Number(revenueResult[0]?.total) || 0;
  const platformFees = (totalRevenue * 0.20).toFixed(2);
  
  // Get total users
  const usersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const totalUsers = Number(usersResult[0]?.count) || 0;
  
  // Get total subscriptions
  const subsResult = await db.select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));
  const totalSubscriptions = Number(subsResult[0]?.count) || 0;
  
  // Calculate conversion rate (subscribers / total users * 100)
  const conversionRate = totalUsers > 0 ? ((totalSubscriptions / totalUsers) * 100).toFixed(1) : "0";
  
  // Growth calculations (comparing this month to last month)
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Creators growth
  const creatorsThisMonth = await db.select({ count: sql<number>`count(*)` })
    .from(creatorProfiles)
    .where(gte(creatorProfiles.createdAt, startOfThisMonth));
  const creatorsLastMonth = await db.select({ count: sql<number>`count(*)` })
    .from(creatorProfiles)
    .where(and(
      gte(creatorProfiles.createdAt, startOfLastMonth),
      lte(creatorProfiles.createdAt, startOfThisMonth)
    ));
  const creatorsGrowth = Number(creatorsLastMonth[0]?.count) > 0 
    ? Math.round(((Number(creatorsThisMonth[0]?.count) - Number(creatorsLastMonth[0]?.count)) / Number(creatorsLastMonth[0]?.count)) * 100)
    : Number(creatorsThisMonth[0]?.count) > 0 ? 100 : 0;
  
  // Users growth
  const usersThisMonth = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gte(users.createdAt, startOfThisMonth));
  const usersLastMonth = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(
      gte(users.createdAt, startOfLastMonth),
      lte(users.createdAt, startOfThisMonth)
    ));
  const usersGrowth = Number(usersLastMonth[0]?.count) > 0 
    ? Math.round(((Number(usersThisMonth[0]?.count) - Number(usersLastMonth[0]?.count)) / Number(usersLastMonth[0]?.count)) * 100)
    : Number(usersThisMonth[0]?.count) > 0 ? 100 : 0;
  
  // Revenue growth
  const revenueThisMonth = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, startOfThisMonth)
    ));
  const revenueLastMonth = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` })
    .from(transactions)
    .where(and(
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, startOfLastMonth),
      lte(transactions.createdAt, startOfThisMonth)
    ));
  const revenueGrowth = Number(revenueLastMonth[0]?.total) > 0 
    ? Math.round(((Number(revenueThisMonth[0]?.total) - Number(revenueLastMonth[0]?.total)) / Number(revenueLastMonth[0]?.total)) * 100)
    : Number(revenueThisMonth[0]?.total) > 0 ? 100 : 0;
  
  return {
    totalPosts,
    totalViews,
    totalLikes,
    verifiedCreators,
    onlineCreators,
    avgPostsPerCreator,
    avgSubscriptionPrice,
    platformFees,
    conversionRate,
    creatorsGrowth,
    usersGrowth,
    revenueGrowth,
  };
}

export async function getAllPostsAdmin(creatorId?: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Build where conditions
  const conditions = [];
  if (creatorId) {
    conditions.push(eq(posts.creatorId, creatorId));
  }
  if (search) {
    conditions.push(like(posts.content, `%${search}%`));
  }
  
  const allPosts = await db.select({
    id: posts.id,
    content: posts.content,
    postType: posts.postType,
    views_count: posts.viewsCount,
    likes_count: posts.likesCount,
    createdAt: posts.createdAt,
    creator: {
      id: creatorProfiles.id,
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
    }
  })
  .from(posts)
  .leftJoin(creatorProfiles, eq(posts.creatorId, creatorProfiles.id))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(posts.createdAt));
  
  // Get media for each post
  const postsWithMedia = await Promise.all(allPosts.map(async (post) => {
    const media = await db.select()
      .from(postMedia)
      .where(eq(postMedia.postId, post.id))
      .orderBy(postMedia.sortOrder);
    return { ...post, media };
  }));
  
  return postsWithMedia;
}

export async function getCreatorPostsAdmin(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const creatorPosts = await db.select()
    .from(posts)
    .where(eq(posts.creatorId, creatorId))
    .orderBy(desc(posts.createdAt));
  
  // Get media for each post
  const postsWithMedia = await Promise.all(creatorPosts.map(async (post) => {
    const media = await db.select()
      .from(postMedia)
      .where(eq(postMedia.postId, post.id))
      .orderBy(postMedia.sortOrder);
    return { ...post, media };
  }));
  
  return postsWithMedia;
}

export async function deletePostAdmin(postId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Delete media first
  await db.delete(postMedia).where(eq(postMedia.postId, postId));
  
  // Delete likes
  await db.delete(postLikes).where(eq(postLikes.postId, postId));
  
  // Delete post
  await db.delete(posts).where(eq(posts.id, postId));
}

// ==================== BULK ADMIN QUERIES ====================

export async function createUserAdmin(data: {
  name: string;
  email: string;
  userType: "fan" | "creator";
  role: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Create a virtual user with a unique openId
  const virtualOpenId = `virtual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const result = await db.insert(users).values({
    openId: virtualOpenId,
    name: data.name,
    email: data.email,
    userType: data.userType,
    role: data.role,
    onboardingCompleted: true,
  });
  
  return result[0].insertId;
}

export async function createCreatorProfileAdmin(data: {
  userId: number;
  username: string;
  displayName: string;
  bio?: string;
  location?: string;
  avatarUrl: string;
  coverUrl?: string;
  subscriptionPrice: string;
  isVerified: boolean;
  isOnline: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(creatorProfiles).values({
    userId: data.userId,
    username: data.username,
    displayName: data.displayName,
    bio: data.bio || "",
    location: data.location || "",
    avatarUrl: data.avatarUrl,
    coverUrl: data.coverUrl || data.avatarUrl,
    subscriptionPrice: data.subscriptionPrice,
    isVerified: data.isVerified,
    isOnline: data.isOnline,
  });
  
  return result[0].insertId;
}
