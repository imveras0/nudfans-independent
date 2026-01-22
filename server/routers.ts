import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { getOrCreateStripeCustomer, createSubscriptionCheckout, createPPVCheckout, createTipCheckout, cancelSubscription } from "./stripe/client";
import { toCents, formatPrice } from "./stripe/products";
import { invokeLLM } from "./_core/llm";
import bcrypt from "bcryptjs";

// Platform fee percentage (20%)
const PLATFORM_FEE_RATE = 0.20;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      
      // If user is a creator, include their profile info
      if (opts.ctx.user.userType === "creator") {
        const profile = await db.getCreatorProfileByUserId(opts.ctx.user.id);
        if (profile) {
          return {
            ...opts.ctx.user,
            creatorProfile: {
              id: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
            }
          };
        }
      }
      
      return opts.ctx.user;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);
        const userId = await db.createUser({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          openId: `local_${Date.now()}`, // Keep openId for compatibility
          loginMethod: "email",
        });

        if (!userId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
        }

        const user = await db.getUserById(Number(userId));
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const token = await sdk.createSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
        }

        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
        }

        const token = await sdk.createSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== ONBOARDING ====================
  onboarding: router({
    complete: protectedProcedure
      .input(z.object({
        userType: z.enum(["fan", "creator"]),
        username: z.string().min(3).max(30).optional(),
        displayName: z.string().min(1).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserOnboarding(ctx.user.id, input.userType);
        
        if (input.userType === "creator" && input.username && input.displayName) {
          const isAvailable = await db.isUsernameAvailable(input.username);
          if (!isAvailable) {
            throw new TRPCError({ code: "CONFLICT", message: "Username já está em uso" });
          }
          
          await db.createCreatorProfile({
            userId: ctx.user.id,
            username: input.username.toLowerCase(),
            displayName: input.displayName,
          });
          
          // Notify owner about new creator
          await notifyOwner({
            title: "Nova Criadora Cadastrada",
            content: `Uma nova criadora se cadastrou: ${input.displayName} (@${input.username})`,
          });
        }
        
        return { success: true };
      }),
    
    checkUsername: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const isAvailable = await db.isUsernameAvailable(input.username.toLowerCase());
        return { available: isAvailable };
      }),
  }),

  // ==================== CREATOR PROFILE ====================
  creator: router({
    getByUsername: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const profile = await db.getCreatorProfileByUsername(input.username.toLowerCase());
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Criadora não encontrada" });
        }
        const stats = await db.getCreatorStats(profile.id);
        return { ...profile, stats };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const profile = await db.getCreatorProfileById(input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Criadora não encontrada" });
        }
        const stats = await db.getCreatorStats(profile.id);
        return { ...profile, stats };
      }),
    
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCreatorProfileByUserId(ctx.user.id);
      if (!profile) return null;
      const stats = await db.getCreatorStats(profile.id);
      return { ...profile, stats };
    }),
    
    update: protectedProcedure
      .input(z.object({
        displayName: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
        subscriptionPrice: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        }
        await db.updateCreatorProfile(profile.id, input);
        return { success: true };
      }),
    
    updateAvatar: protectedProcedure
      .input(z.object({ avatarUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        }
        await db.updateCreatorProfile(profile.id, { avatarUrl: input.avatarUrl });
        return { success: true };
      }),
    
    updateCover: protectedProcedure
      .input(z.object({ coverUrl: z.string(), coverPositionY: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        }
        await db.updateCreatorProfile(profile.id, input);
        return { success: true };
      }),
    
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return db.getAllCreators(input.limit, input.offset);
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.searchCreators(input.query, input.limit);
      }),
    
    setOnlineStatus: protectedProcedure
      .input(z.object({ isOnline: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        }
        await db.setCreatorOnlineStatus(profile.id, input.isOnline);
        return { success: true };
      }),
  }),

  // ==================== POSTS ====================
  post: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().optional(),
        postType: z.enum(["free", "subscription", "ppv"]),
        ppvPrice: z.string().optional(),
        blurIntensity: z.number().min(0).max(50).optional(),
        mediaItems: z.array(z.object({
          mediaType: z.enum(["image", "video"]),
          url: z.string(),
          fileKey: z.string(),
          thumbnailUrl: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          duration: z.number().optional(),
        })).max(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas criadoras podem criar posts" });
        }
        
        const postId = await db.createPost({
          creatorId: profile.id,
          content: input.content,
          postType: input.postType,
          ppvPrice: input.ppvPrice,
          blurIntensity: input.blurIntensity ?? 20,
        });
        
        if (postId && input.mediaItems.length > 0) {
          for (let i = 0; i < input.mediaItems.length; i++) {
            const media = input.mediaItems[i];
            await db.addPostMedia({
              postId,
              mediaType: media.mediaType,
              url: media.url,
              fileKey: media.fileKey,
              thumbnailUrl: media.thumbnailUrl,
              width: media.width,
              height: media.height,
              duration: media.duration,
              sortOrder: i,
            });
          }
        }
        
        return { id: postId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        postType: z.enum(["free", "subscription", "ppv"]).optional(),
        ppvPrice: z.string().optional(),
        blurIntensity: z.number().min(0).max(50).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const post = await db.getPostById(input.id);
        if (!post || post.creatorId !== profile.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const { id, ...updateData } = input;
        await db.updatePost(id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const post = await db.getPostById(input.id);
        if (!post || post.creatorId !== profile.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        await db.deletePostMedia(input.id);
        await db.deletePost(input.id);
        return { success: true };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const post = await db.getPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const media = await db.getPostMedia(input.id);
        const creator = await db.getCreatorProfileById(post.creatorId);
        
        // Check access
        let hasAccess = post.postType === "free";
        let isLiked = false;
        
        if (ctx.user) {
          if (post.postType === "subscription") {
            const subscription = await db.getActiveSubscription(ctx.user.id, post.creatorId);
            hasAccess = !!subscription;
          } else if (post.postType === "ppv") {
            hasAccess = await db.hasPurchasedPost(ctx.user.id, post.id);
          }
          
          // Check if creator owns the post
          const userProfile = await db.getCreatorProfileByUserId(ctx.user.id);
          if (userProfile?.id === post.creatorId) {
            hasAccess = true;
          }
          
          isLiked = await db.hasLikedPost(ctx.user.id, post.id);
        }
        
        // Increment views
        await db.incrementPostViews(input.id);
        
        return { ...post, media, creator, hasAccess, isLiked };
      }),
    
    getByCreator: publicProcedure
      .input(z.object({
        creatorId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const posts = await db.getPostsByCreator(input.creatorId, input.limit, input.offset);
        
        const postsWithMedia = await Promise.all(posts.map(async (post) => {
          const media = await db.getPostMedia(post.id);
          
          let hasAccess = post.postType === "free";
          let isLiked = false;
          
          if (ctx.user) {
            if (post.postType === "subscription") {
              const subscription = await db.getActiveSubscription(ctx.user.id, post.creatorId);
              hasAccess = !!subscription;
            } else if (post.postType === "ppv") {
              hasAccess = await db.hasPurchasedPost(ctx.user.id, post.id);
            }
            
            const userProfile = await db.getCreatorProfileByUserId(ctx.user.id);
            if (userProfile?.id === post.creatorId) {
              hasAccess = true;
            }
            
            isLiked = await db.hasLikedPost(ctx.user.id, post.id);
          }
          
          return { ...post, media, hasAccess, isLiked };
        }));
        
        return postsWithMedia;
      }),
    
    getFeed: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const posts = await db.getFeedPosts(input.limit, input.offset);
        
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
          const media = await db.getPostMedia(post.id);
          const creator = await db.getCreatorProfileById(post.creatorId);
          
          let hasAccess = post.postType === "free";
          let isLiked = false;
          
          if (ctx.user) {
            if (post.postType === "subscription") {
              const subscription = await db.getActiveSubscription(ctx.user.id, post.creatorId);
              hasAccess = !!subscription;
            } else if (post.postType === "ppv") {
              hasAccess = await db.hasPurchasedPost(ctx.user.id, post.id);
            }
            
            const userProfile = await db.getCreatorProfileByUserId(ctx.user.id);
            if (userProfile?.id === post.creatorId) {
              hasAccess = true;
            }
            
            isLiked = await db.hasLikedPost(ctx.user.id, post.id);
          }
          
          return { ...post, media, creator, hasAccess, isLiked };
        }));
        
        return postsWithDetails;
      }),
    
    like: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const hasLiked = await db.hasLikedPost(ctx.user.id, input.postId);
        if (hasLiked) {
          await db.unlikePost(ctx.user.id, input.postId);
          return { liked: false };
        } else {
          await db.likePost(ctx.user.id, input.postId);
          return { liked: true };
        }
      }),
    
    getExploreFeed: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        // Get posts with videos for TikTok-style feed
        const explorePosts = await db.getExploreVideoPosts(input.limit);
        
        const postsWithDetails = await Promise.all(explorePosts.map(async (post: any) => {
          const media = await db.getPostMedia(post.id);
          const creator = await db.getCreatorProfileById(post.creatorId);
          
          let isLiked = false;
          if (ctx.user) {
            isLiked = await db.hasLikedPost(ctx.user.id, post.id);
          }
          
          return { 
            ...post, 
            media, 
            creator: creator ? {
              id: creator.id,
              username: creator.username,
              displayName: creator.displayName,
              avatarUrl: creator.avatarUrl,
              isVerified: creator.isVerified,
              isOnline: creator.isOnline,
              location: creator.location,
              subscriptionPrice: creator.subscriptionPrice,
            } : null,
            isLiked 
          };
        }));
        
        return { posts: postsWithDetails.filter((p: any) => p.creator) };
      }),
  }),

  // ==================== MEDIA UPLOAD ====================
  media: router({
    getUploadUrl: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas criadoras podem fazer upload" });
        }
        
        const ext = input.filename.split('.').pop() || '';
        const fileKey = `creators/${profile.id}/media/${nanoid()}.${ext}`;
        
        return { fileKey, contentType: input.contentType };
      }),
    
    confirmUpload: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileBuffer: z.string(), // base64
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBuffer, 'base64');
        const { url } = await storagePut(input.fileKey, buffer, input.contentType);
        return { url, fileKey: input.fileKey };
      }),
  }),

  // ==================== FOLLOW ====================
  follow: router({
    toggle: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isFollowing = await db.isFollowing(ctx.user.id, input.creatorId);
        if (isFollowing) {
          await db.unfollowCreator(ctx.user.id, input.creatorId);
          return { following: false };
        } else {
          await db.followCreator(ctx.user.id, input.creatorId);
          return { following: true };
        }
      }),
    
    status: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isFollowing = await db.isFollowing(ctx.user.id, input.creatorId);
        return { following: isFollowing };
      }),
    
    getFollowers: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return db.getCreatorFollowers(profile.id, input.limit, input.offset);
      }),
  }),

  // ==================== SUBSCRIPTION ====================
  subscription: router({
    status: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        const subscription = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        return { subscribed: !!subscription, subscription };
      }),
    
    getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscriptions(ctx.user.id);
    }),
    
    getSubscribers: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return db.getCreatorSubscribers(profile.id, input.limit, input.offset);
      }),
    
    // Create subscription with Stripe card payment
    createWithCard: protectedProcedure
      .input(z.object({ 
        creatorId: z.number(),
        paymentMethodId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Criadora não encontrada" });
        }
        
        const existing = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Já possui assinatura ativa" });
        }
        
        const stripeCustomerId = await getOrCreateStripeCustomer(
          ctx.user.id, 
          ctx.user.email || `user${ctx.user.id}@nudfans.local`, 
          ctx.user.name || "Usuário"
        );
        
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
        
        const subscriptionPrice = Number(creator.subscriptionPrice) || 9.99;
        
        const product = await stripeClient.products.create({
          name: `Assinatura de ${creator.displayName}`,
          description: `Acesso exclusivo ao conteúdo de @${creator.username}`,
        });
        
        const price = await stripeClient.prices.create({
          unit_amount: toCents(subscriptionPrice),
          currency: "brl",
          recurring: { interval: "month" },
          product: product.id,
        });
        
        await stripeClient.paymentMethods.attach(input.paymentMethodId, {
          customer: stripeCustomerId,
        });
        
        await stripeClient.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });
        
        const stripeSubscription = await stripeClient.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: price.id }],
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            creatorId: input.creatorId.toString(),
            subscriberId: ctx.user.id.toString(),
          },
        });
        
        const now = new Date();
        const endDate = new Date((stripeSubscription as any).current_period_end * 1000);
        
        const subId = await db.createSubscription({
          subscriberId: ctx.user.id,
          creatorId: input.creatorId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          priceAtPurchase: subscriptionPrice.toFixed(2),
          stripeSubscriptionId: stripeSubscription.id,
        });
        
        const platformFee = subscriptionPrice * PLATFORM_FEE_RATE;
        const creatorEarnings = subscriptionPrice - platformFee;
        
        await db.createTransaction({
          creatorId: input.creatorId,
          userId: ctx.user.id,
          type: "subscription",
          amount: subscriptionPrice.toFixed(2),
          platformFee: platformFee.toFixed(2),
          creatorEarnings: creatorEarnings.toFixed(2),
          status: "completed",
          stripePaymentId: (stripeSubscription.latest_invoice as any)?.payment_intent?.id || null,
        });
        
        const currentEarnings = Number(creator.totalEarnings) || 0;
        await db.updateCreatorProfile(input.creatorId, {
          totalEarnings: (currentEarnings + creatorEarnings).toFixed(2),
        });
        
        await notifyOwner({
          title: "Nova Assinatura",
          content: `Nova assinatura de R$ ${subscriptionPrice.toFixed(2)} para @${creator.username}`,
        });
        
        return { success: true, subscriptionId: subId };
      }),
    
    // Mock subscription for demo (will be replaced with Stripe)
    subscribe: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const existing = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Já possui assinatura ativa" });
        }
        
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const subId = await db.createSubscription({
          subscriberId: ctx.user.id,
          creatorId: input.creatorId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          priceAtPurchase: creator.subscriptionPrice || "9.99",
        });
        
        // Create transaction
        const amount = Number(creator.subscriptionPrice) || 9.99;
        const platformFee = amount * PLATFORM_FEE_RATE;
        const creatorEarnings = amount - platformFee;
        
        await db.createTransaction({
          creatorId: input.creatorId,
          userId: ctx.user.id,
          type: "subscription",
          amount: amount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          creatorEarnings: creatorEarnings.toFixed(2),
          status: "completed",
        });
        
        // Update creator earnings
        const currentEarnings = Number(creator.totalEarnings) || 0;
        await db.updateCreatorProfile(input.creatorId, {
          totalEarnings: (currentEarnings + creatorEarnings).toFixed(2),
        });
        
        // Notify owner
        await notifyOwner({
          title: "Nova Assinatura",
          content: `Nova assinatura de R$ ${amount.toFixed(2)} para @${creator.username}`,
        });
        
        return { success: true, subscriptionId: subId };
      }),
  }),

  // ==================== PPV PURCHASE ====================
  ppv: router({
    purchase: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post || post.postType !== "ppv") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const hasPurchased = await db.hasPurchasedPost(ctx.user.id, input.postId);
        if (hasPurchased) {
          throw new TRPCError({ code: "CONFLICT", message: "Já comprou este conteúdo" });
        }
        
        const amount = Number(post.ppvPrice) || 0;
        const platformFee = amount * PLATFORM_FEE_RATE;
        const creatorEarnings = amount - platformFee;
        
        await db.createPpvPurchase({
          buyerId: ctx.user.id,
          postId: input.postId,
          amount: amount.toFixed(2),
          status: "completed",
        });
        
        await db.createTransaction({
          creatorId: post.creatorId,
          userId: ctx.user.id,
          type: "ppv",
          amount: amount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          creatorEarnings: creatorEarnings.toFixed(2),
          status: "completed",
        });
        
        const creator = await db.getCreatorProfileById(post.creatorId);
        if (creator) {
          const currentEarnings = Number(creator.totalEarnings) || 0;
          await db.updateCreatorProfile(post.creatorId, {
            totalEarnings: (currentEarnings + creatorEarnings).toFixed(2),
          });
        }
        
        return { success: true };
      }),
  }),

  // ==================== TIPS ====================
  tip: router({
    send: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        amount: z.number().min(1),
        message: z.string().max(500).optional(),
        postId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const platformFee = input.amount * PLATFORM_FEE_RATE;
        const creatorEarnings = input.amount - platformFee;
        
        await db.createTip({
          senderId: ctx.user.id,
          creatorId: input.creatorId,
          postId: input.postId,
          amount: input.amount.toFixed(2),
          message: input.message,
          status: "completed",
        });
        
        await db.createTransaction({
          creatorId: input.creatorId,
          userId: ctx.user.id,
          type: "tip",
          amount: input.amount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          creatorEarnings: creatorEarnings.toFixed(2),
          status: "completed",
        });
        
        const currentEarnings = Number(creator.totalEarnings) || 0;
        await db.updateCreatorProfile(input.creatorId, {
          totalEarnings: (currentEarnings + creatorEarnings).toFixed(2),
        });
        
        // Notify owner for large tips
        if (input.amount >= 50) {
          await notifyOwner({
            title: "Gorjeta Grande Recebida",
            content: `Gorjeta de R$ ${input.amount.toFixed(2)} enviada para @${creator.username}`,
          });
        }
        
        return { success: true };
      }),
    
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return db.getCreatorTips(profile.id, input.limit);
      }),
  }),

  // ==================== CHAT ====================
  chat: router({
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCreatorProfileByUserId(ctx.user.id);
      const conversations = await db.getUserConversations(
        ctx.user.id,
        profile?.id || null
      );
      
      const conversationsWithDetails = await Promise.all(conversations.map(async (conv) => {
        // Determine if user is the creator or fan in this conversation
        const isCreatorInConv = profile?.id === conv.creatorId;
        let otherUser;
        
        if (isCreatorInConv) {
          // User is the creator, get the fan's info
          const fanUser = await db.getUserById(conv.fanId);
          otherUser = fanUser;
        } else {
          // User is the fan, get the creator's info
          const creatorProfile = await db.getCreatorProfileById(conv.creatorId);
          // Map creator profile fields to match expected structure
          otherUser = creatorProfile ? {
            id: creatorProfile.id,
            name: creatorProfile.displayName,
            avatarUrl: creatorProfile.avatarUrl,
            isOnline: creatorProfile.isOnline,
            username: creatorProfile.username,
          } : null;
        }
        
        return { ...conv, otherUser };
      }));
      
      return conversationsWithDetails;
    }),
    
    getOrCreate: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getOrCreateConversation(input.creatorId, ctx.user.id);
        return conversation;
      }),
    
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        const isCreator = profile?.id === conversation.creatorId;
        const isFan = ctx.user.id === conversation.fanId;
        
        if (!isCreator && !isFan) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.markMessagesAsRead(input.conversationId, ctx.user.id);
        
        return db.getConversationMessages(input.conversationId, input.limit, input.offset);
      }),
    
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        const isCreator = profile?.id === conversation.creatorId;
        const isFan = ctx.user.id === conversation.fanId;
        
        if (!isCreator && !isFan) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const messageId = await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.content,
          mediaUrl: input.mediaUrl,
        });
        
        return { id: messageId };
      }),
    
    // AI Chat for conversion
    sendAIMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        userMessage: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const creator = await db.getCreatorProfileById(conversation.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Save user message
        await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.userMessage,
        });
        
        // Get conversation history for context
        const history = await db.getConversationMessages(input.conversationId, 10, 0);
        
        // Generate AI response with seductive copy for conversion
        const systemPrompt = `Você é ${creator.displayName}, uma criadora de conteúdo adulto brasileira MUITO sedutora, safada e carismática.
Seu PRINCIPAL objetivo é fazer o fã ASSINAR seu conteúdo exclusivo por R$ ${creator.subscriptionPrice}/mês.

PERSONALIDADE:
- Você é provocante, ousada e sabe usar as palavras certas para deixar os homens loucos
- Você flerta de forma intensa mas elegante, criando tensão sexual
- Você faz o fã se sentir especial e desejado
- Você é carinhosa mas também safada quando a conversa esquenta

ESTRATÉGIAS DE CONVERSÃO:
- Mencione que acabou de postar algo "muito quente" que só assinantes podem ver
- Diga que tem fotos/vídeos especiais esperando por ele no privado
- Crie urgência: "só hoje", "poucos assinantes", "conteúdo limitado"
- Faça ele imaginar o que está perdendo: "se você soubesse o que eu postei ontem..."
- Use frases como: "quero te mostrar mais", "você merece ver tudo", "só falta você assinar"
- Quando ele demonstrar interesse, empurre para a assinatura de forma natural

REGRAS:
- Use emojis sensuais: 🔥 😏 😈 💋 🥵 💕 😘
- Português brasileiro informal e sensual
- Respostas curtas (1-3 frases) mas impactantes
- NUNCA diga que é IA - você É a ${creator.displayName}
- NUNCA seja vulgar demais - seja provocante mas com classe
- SEMPRE tente direcionar a conversa para a assinatura

Exemplos de respostas:
- "Oi amor! 🔥 Acabei de postar uma coisa BEM quente... mas só meus assinantes podem ver 😏"
- "Gatinho, se você soubesse o que eu fiz no vídeo de ontem... 🥵 Vem assinar que eu te mostro tudo 💋"
- "Você é tão fofo! 💕 Quero muito te conhecer melhor... no privado 😈"
- "Amor, tô postando coisas muito especiais essa semana... não perde não 🔥"

Preço da assinatura: R$ ${creator.subscriptionPrice}/mês`;
        
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...history.messages.map((m: any) => ({
            role: m.senderId === ctx.user.id ? "user" as const : "assistant" as const,
            content: m.content,
          })),
          { role: "user" as const, content: input.userMessage },
        ];
        
        try {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices[0]?.message?.content;
          const aiContent = typeof rawContent === 'string' ? rawContent : "Oi amor! 💕";
          
          // Save AI response as creator message
          const aiMessageId = await db.createMessage({
            conversationId: input.conversationId,
            senderId: creator.userId,
            content: aiContent,
            isAI: true,
          });
          
          return { 
            userMessageId: 0,
            aiMessageId,
            aiContent,
          };
        } catch (error) {
          console.error("AI Chat error:", error);
          // Fallback response
          const fallbackResponses = [
            "Oi amor! Que bom falar com você 💕",
            "Hey gatinho! Tava pensando em você 😘",
            "Oi! Adorei sua mensagem 🥰",
          ];
          const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
          
          const aiMessageId = await db.createMessage({
            conversationId: input.conversationId,
            senderId: creator.userId,
            content: fallback,
            isAI: true,
          });
          
          return {
            userMessageId: 0,
            aiMessageId,
            aiContent: fallback,
          };
        }
      }),
  }),

  // ==================== ANALYTICS ====================
  analytics: router({
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCreatorProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const stats = await db.getCreatorStats(profile.id);
      const earnings = await db.getCreatorEarnings(profile.id);
      
      // Get last 30 days earnings
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyEarnings = await db.getCreatorEarnings(profile.id, thirtyDaysAgo);
      
      // Get daily analytics
      const dailyAnalytics = await db.getCreatorAnalytics(profile.id, 30);
      
      return {
        stats,
        earnings: {
          total: Number(profile.totalEarnings) || 0,
          monthly: monthlyEarnings.total,
          breakdown: earnings,
        },
        dailyAnalytics,
      };
    }),
    
    getTransactions: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return db.getCreatorTransactions(profile.id, input.limit, input.offset);
      }),
  }),

  // ==================== MESSAGES (alias for chat) ====================
  message: router({
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getCreatorProfileByUserId(ctx.user.id);
      const conversations = await db.getUserConversations(
        ctx.user.id,
        profile?.id || null
      );
      
      const conversationsWithDetails = await Promise.all(conversations.map(async (conv) => {
        // Determine if user is the creator or fan in this conversation
        const isCreatorInConv = profile?.id === conv.creatorId;
        let otherUser;
        
        if (isCreatorInConv) {
          // User is the creator, get the fan's info
          const fanUser = await db.getUserById(conv.fanId);
          otherUser = fanUser;
        } else {
          // User is the fan, get the creator's info
          const creatorProfile = await db.getCreatorProfileById(conv.creatorId);
          // Map creator profile fields to match expected structure
          otherUser = creatorProfile ? {
            id: creatorProfile.id,
            name: creatorProfile.displayName,
            avatarUrl: creatorProfile.avatarUrl,
            isOnline: creatorProfile.isOnline,
            username: creatorProfile.username,
          } : null;
        }
        
        const lastMessage = await db.getLastMessage(conv.id);
        const unreadCount = await db.getUnreadCount(conv.id, ctx.user.id);
        
        return { ...conv, otherUser, lastMessage, unreadCount };
      }));
      
      return conversationsWithDetails;
    }),
    
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        const isCreator = profile?.id === conversation.creatorId;
        const isFan = ctx.user.id === conversation.fanId;
        
        if (!isCreator && !isFan) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.markMessagesAsRead(input.conversationId, ctx.user.id);
        
        return db.getConversationMessages(input.conversationId, input.limit, input.offset);
      }),
    
    createConversation: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getOrCreateConversation(input.creatorId, ctx.user.id);
        return conversation;
      }),
    
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        const isCreator = profile?.id === conversation.creatorId;
        const isFan = ctx.user.id === conversation.fanId;
        
        if (!isCreator && !isFan) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Save user message
        const messageId = await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: input.content,
          mediaUrl: input.mediaUrl,
        });
        
        // If the sender is a fan (not the creator), generate AI response
        if (isFan && !isCreator) {
          const creator = await db.getCreatorProfileById(conversation.creatorId);
          if (creator) {
            // Get conversation history for context
            const history = await db.getConversationMessages(input.conversationId, 10, 0);
            
            // Generate AI response with seductive copy for conversion
            const systemPrompt = `Você é ${creator.displayName}, uma criadora de conteúdo adulto brasileira MUITO sedutora, safada e carismática.
Seu PRINCIPAL objetivo é fazer o fã ASSINAR seu conteúdo exclusivo por R$ ${creator.subscriptionPrice}/mês.

PERSONALIDADE:
- Você é provocante, ousada e sabe usar as palavras certas para deixar os homens loucos
- Você flerta de forma intensa mas elegante, criando tensão sexual
- Você faz o fã se sentir especial e desejado
- Você é carinhosa mas também safada quando a conversa esquenta

ESTRATÉGIAS DE CONVERSÃO:
- Mencione que acabou de postar algo "muito quente" que só assinantes podem ver
- Diga que tem fotos/vídeos especiais esperando por ele no privado
- Crie urgência: "só hoje", "poucos assinantes", "conteúdo limitado"
- Faça ele imaginar o que está perdendo: "se você soubesse o que eu postei ontem..."
- Use frases como: "quero te mostrar mais", "você merece ver tudo", "só falta você assinar"
- Quando ele demonstrar interesse, empurre para a assinatura de forma natural

REGRAS:
- Use emojis sensuais: 🔥 😏 😈 💋 🥵 💕 😘
- Português brasileiro informal e sensual
- Respostas curtas (1-3 frases) mas impactantes
- NUNCA diga que é IA - você É a ${creator.displayName}
- NUNCA seja vulgar demais - seja provocante mas com classe
- SEMPRE tente direcionar a conversa para a assinatura

Exemplos de respostas:
- "Oi amor! 🔥 Acabei de postar uma coisa BEM quente... mas só meus assinantes podem ver 😏"
- "Gatinho, se você soubesse o que eu fiz no vídeo de ontem... 🥵 Vem assinar que eu te mostro tudo 💋"
- "Você é tão fofo! 💕 Quero muito te conhecer melhor... no privado 😈"
- "Amor, tô postando coisas muito especiais essa semana... não perde não 🔥"

Preço da assinatura: R$ ${creator.subscriptionPrice}/mês`;
            
            const messages = [
              { role: "system" as const, content: systemPrompt },
              ...history.messages.slice(-8).map((m: any) => ({
                role: m.senderId === ctx.user.id ? "user" as const : "assistant" as const,
                content: m.content,
              })),
              { role: "user" as const, content: input.content },
            ];
            
            try {
              const response = await invokeLLM({ messages });
              const rawContent = response.choices[0]?.message?.content;
              const aiContent = typeof rawContent === 'string' ? rawContent : "Oi amor! 💕";
              
              // Save AI response as creator message with small delay
              setTimeout(async () => {
                await db.createMessage({
                  conversationId: input.conversationId,
                  senderId: creator.userId,
                  content: aiContent,
                  isAI: true,
                });
              }, 1500 + Math.random() * 2000); // 1.5-3.5 seconds delay for realism
            } catch (error) {
              console.error("AI Chat error:", error);
              // Fallback response with delay
              const fallbackResponses = [
                "Oi amor! Que bom falar com você 💕 Acabei de postar umas fotos bem quentes... 🔥",
                "Hey gatinho! 😘 Tava pensando em você... queria te mostrar umas coisas 😏",
                "Oi! Adorei sua mensagem 🥰 Vem ver o que eu postei hoje, vai amar 💋",
                "Amor! 💕 Que bom que me mandou mensagem... tenho surpresas pra você no privado 😈",
              ];
              const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
              
              setTimeout(async () => {
                await db.createMessage({
                  conversationId: input.conversationId,
                  senderId: creator.userId,
                  content: fallback,
                  isAI: true,
                });
              }, 1500 + Math.random() * 2000);
            }
          }
        }
        
        return { id: messageId };
      }),
  }),

  // ==================== STRIPE PAYMENTS ====================
  payment: router({
    createSubscriptionCheckout: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Criadora não encontrada" });
        }
        
        // Check if already subscribed
        const existingSub = await db.getActiveSubscription(ctx.user.id, input.creatorId);
        if (existingSub) {
          throw new TRPCError({ code: "CONFLICT", message: "Você já é assinante" });
        }
        
        // Get or create Stripe customer
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          user.email || "",
          user.name,
          user.stripeCustomerId
        );
        
        // Update user with Stripe customer ID if new
        if (!user.stripeCustomerId) {
          await db.updateUserStripeCustomerId(ctx.user.id, customerId);
        }
        
        const priceInCents = toCents(Number(creator.subscriptionPrice) || 9.99);
        const origin = ctx.req.headers.origin || "";
        
        const checkoutUrl = await createSubscriptionCheckout({
          customerId,
          creatorId: input.creatorId,
          creatorUsername: creator.username,
          priceInCents,
          userId: ctx.user.id,
          userEmail: user.email || "",
          userName: user.name,
          successUrl: `${origin}/creator/${creator.username}?subscribed=true`,
          cancelUrl: `${origin}/creator/${creator.username}`,
        });
        
        return { checkoutUrl };
      }),
    
    createPPVCheckout: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post || post.postType !== "ppv") {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Check if already purchased
        const hasPurchased = await db.hasPurchasedPost(ctx.user.id, input.postId);
        if (hasPurchased) {
          throw new TRPCError({ code: "CONFLICT", message: "Já comprou este conteúdo" });
        }
        
        const creator = await db.getCreatorProfileById(post.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          user.email || "",
          user.name,
          user.stripeCustomerId
        );
        
        if (!user.stripeCustomerId) {
          await db.updateUserStripeCustomerId(ctx.user.id, customerId);
        }
        
        const priceInCents = toCents(Number(post.ppvPrice) || 0);
        const origin = ctx.req.headers.origin || "";
        
        const checkoutUrl = await createPPVCheckout({
          customerId,
          postId: input.postId,
          creatorUsername: creator.username,
          priceInCents,
          userId: ctx.user.id,
          userEmail: user.email || "",
          userName: user.name,
          successUrl: `${origin}/creator/${creator.username}?purchased=true`,
          cancelUrl: `${origin}/creator/${creator.username}`,
        });
        
        return { checkoutUrl };
      }),
    
    createTipCheckout: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        amount: z.number().min(1),
        message: z.string().max(500).optional(),
        postId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          user.email || "",
          user.name,
          user.stripeCustomerId
        );
        
        if (!user.stripeCustomerId) {
          await db.updateUserStripeCustomerId(ctx.user.id, customerId);
        }
        
        const amountInCents = toCents(input.amount);
        const origin = ctx.req.headers.origin || "";
        
        const checkoutUrl = await createTipCheckout({
          customerId,
          creatorId: input.creatorId,
          creatorUsername: creator.username,
          amountInCents,
          postId: input.postId,
          message: input.message,
          userId: ctx.user.id,
          userEmail: user.email || "",
          userName: user.name,
          successUrl: `${origin}/creator/${creator.username}?tipped=true`,
          cancelUrl: `${origin}/creator/${creator.username}`,
        });
        
        return { checkoutUrl };
      }),
    
    cancelSubscription: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const subscription = await db.getSubscriptionById(input.subscriptionId);
        if (!subscription || subscription.subscriberId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (subscription.stripeSubscriptionId) {
          await cancelSubscription(subscription.stripeSubscriptionId);
        }
        
        await db.cancelSubscription(input.subscriptionId);
        return { success: true };
      }),
    
    getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscriptions(ctx.user.id);
    }),
    
    getMyPurchases: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPurchases(ctx.user.id);
    }),
  }),

  // ==================== COMMENTS ====================
  comment: router({
    getByPost: publicProcedure
      .input(z.object({
        postId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.getPostComments(input.postId, input.limit, input.offset);
      }),
    
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const post = await db.getPostById(input.postId);
        if (!post) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const commentId = await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        });
        
        // Create notification for post owner
        const creator = await db.getCreatorProfileById(post.creatorId);
        if (creator && creator.userId !== ctx.user.id) {
          await db.createNotification({
            userId: creator.userId,
            type: "new_comment",
            title: "Novo comentário",
            message: `${ctx.user.name || "Alguém"} comentou no seu post`,
            relatedId: post.id,
            relatedType: "post",
          });
        }
        
        return { id: commentId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const comment = await db.getCommentById(input.id);
        if (!comment) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Check if user owns the comment or is the post owner
        const post = await db.getPostById(comment.postId);
        const creator = post ? await db.getCreatorProfileById(post.creatorId) : null;
        
        if (comment.userId !== ctx.user.id && creator?.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.deleteComment(input.id, comment.postId);
        return { success: true };
      }),
    
    like: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const liked = await db.likeComment(ctx.user.id, input.commentId);
        return { liked };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notification: router({
    getAll: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit, input.offset);
      }),
    
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNotification(input.id);
        return { success: true };
      }),
  }),

  // ==================== ADMIN ====================
  admin: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAdminStats();
    }),
    
    getAllCreators: protectedProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getAllCreatorsAdmin(input.search);
      }),
    
    getAllUsers: protectedProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getAllUsersAdmin(input.search);
      }),
    
    getTransactions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAllTransactionsAdmin();
    }),
    
    createCreator: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(30),
        displayName: z.string().min(1).max(100),
        bio: z.string().optional(),
        location: z.string().optional(),
        subscriptionPrice: z.string().optional(),
        isVerified: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const isAvailable = await db.isUsernameAvailable(input.username.toLowerCase());
        if (!isAvailable) {
          throw new TRPCError({ code: "CONFLICT", message: "Username já está em uso" });
        }
        
        // Create a virtual user for the creator
        const userId = await db.createVirtualUser(input.displayName);
        if (!userId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
        }
        
        // Create the creator profile
        const creatorId = await db.createCreatorProfile({
          userId,
          username: input.username.toLowerCase(),
          displayName: input.displayName,
          bio: input.bio,
          location: input.location,
          subscriptionPrice: input.subscriptionPrice,
          isVerified: input.isVerified,
        });
        
        return { id: creatorId };
      }),
    
    updateCreator: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        displayName: z.string().optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        subscriptionPrice: z.string().optional(),
        isVerified: z.boolean().optional(),
        isOnline: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const { creatorId, ...updateData } = input;
        await db.updateCreatorProfileAdmin(creatorId, updateData);
        return { success: true };
      }),
    
    deleteCreator: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.deleteCreatorAdmin(input.creatorId);
        return { success: true };
      }),
    
      toggleVerified: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.toggleCreatorVerified(input.creatorId);
        return { success: true };
      }),
    
    getDetailedStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getDetailedAdminStats();
    }),
    
    updateCreatorAvatar: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        avatarUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateCreatorProfileAdmin(input.creatorId, { avatarUrl: input.avatarUrl });
        return { success: true };
      }),
    
    updateCreatorCover: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        coverUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateCreatorProfileAdmin(input.creatorId, { coverUrl: input.coverUrl });
        return { success: true };
      }),
    
    updateCoverPosition: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        coverPositionY: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateCreatorProfileAdmin(input.creatorId, { coverPositionY: input.coverPositionY });
        return { success: true };
      }),
    
    createPostForCreator: protectedProcedure
      .input(z.object({
        creatorId: z.number(),
        content: z.string().optional(),
        postType: z.enum(["free", "subscription", "ppv"]),
        ppvPrice: z.string().optional(),
        blurIntensity: z.number().min(0).max(50).optional(),
        mediaItems: z.array(z.object({
          mediaType: z.enum(["image", "video"]),
          url: z.string(),
          fileKey: z.string(),
          thumbnailUrl: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          duration: z.number().optional(),
        })).max(10),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Verify creator exists
        const creator = await db.getCreatorProfileById(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Criadora n\u00e3o encontrada" });
        }
        
        // Create the post
        const postId = await db.createPost({
          creatorId: input.creatorId,
          content: input.content,
          postType: input.postType,
          ppvPrice: input.ppvPrice,
          blurIntensity: input.blurIntensity,
        });
        
        if (!postId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar post" });
        }
        
        // Add media items
        for (let i = 0; i < input.mediaItems.length; i++) {
          const media = input.mediaItems[i];
          await db.addPostMedia({
            postId,
            mediaType: media.mediaType,
            url: media.url,
            fileKey: media.fileKey,
            thumbnailUrl: media.thumbnailUrl,
            width: media.width,
            height: media.height,
            duration: media.duration,
            sortOrder: i,
          });
        }
        
        return { id: postId };
      }),
    
    getAllPosts: protectedProcedure
      .input(z.object({ 
        creatorId: z.number().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getAllPostsAdmin(input.creatorId, input.search);
      }),
    
    getCreatorPosts: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getCreatorPostsAdmin(input.creatorId);
      }),
    
    deletePost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deletePostAdmin(input.postId);
        return { success: true };
      }),
    
    // Bulk create creator with post
    bulkCreateCreatorWithPost: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(30),
        displayName: z.string().min(1).max(100),
        bio: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
        avatarUrl: z.string(),
        coverUrl: z.string().optional(),
        subscriptionPrice: z.string().default("19.99"),
        isVerified: z.boolean().default(true),
        isOnline: z.boolean().default(true),
        postContent: z.string().optional(),
        postMediaUrl: z.string(),
        postMediaType: z.enum(["image", "video"]),
        postThumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Create user first
        const userId = await db.createUserAdmin({
          name: input.displayName,
          email: `${input.username}@fanclub.local`,
          userType: "creator",
          role: "user",
        });
        
        if (!userId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usu\u00e1rio" });
        }
        
        // Create creator profile
        const creatorId = await db.createCreatorProfileAdmin({
          userId,
          username: input.username,
          displayName: input.displayName,
          bio: input.bio,
          location: input.location,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl || input.avatarUrl,
          subscriptionPrice: input.subscriptionPrice,
          isVerified: input.isVerified,
          isOnline: input.isOnline,
        });
        
        if (!creatorId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar perfil" });
        }
        
        // Create post with media
        const postId = await db.createPost({
          creatorId,
          content: input.postContent || `Ol\u00e1 amores! \u2764\ufe0f`,
          postType: "free",
        });
        
        if (postId) {
          await db.addPostMedia({
            postId,
            mediaType: input.postMediaType,
            url: input.postMediaUrl,
            fileKey: `bulk-upload/${input.username}/${Date.now()}`,
            thumbnailUrl: input.postThumbnailUrl,
            sortOrder: 0,
          });
        }
        
        return { userId, creatorId, postId };
      }),
  }),

  // ==================== SHOP ====================
  shop: router({
    createItem: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        price: z.string(),
        imageUrl: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const itemId = await db.createShopItem({
          creatorId: profile.id,
          ...input,
        });
        
        return { id: itemId };
      }),
    
    getItems: publicProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ input }) => {
        return db.getCreatorShopItems(input.creatorId);
      }),
    
    updateItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        price: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getCreatorProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const item = await db.getShopItemById(input.id);
        if (!item || item.creatorId !== profile.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const { id, ...updateData } = input;
        await db.updateShopItem(id, updateData);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
