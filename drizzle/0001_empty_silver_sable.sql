CREATE TABLE `analytics_daily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`date` timestamp NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`newFollowers` int NOT NULL DEFAULT 0,
	`newSubscribers` int NOT NULL DEFAULT 0,
	`earnings` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_daily_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`fanId` int NOT NULL,
	`lastMessageAt` timestamp,
	`creatorUnreadCount` int NOT NULL DEFAULT 0,
	`fanUnreadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`bio` text,
	`location` varchar(100),
	`avatarUrl` text,
	`coverUrl` text,
	`coverPositionY` int DEFAULT 50,
	`isVerified` boolean NOT NULL DEFAULT false,
	`isOnline` boolean NOT NULL DEFAULT false,
	`lastOnlineAt` timestamp,
	`subscriptionPrice` decimal(10,2) DEFAULT '9.99',
	`stripeAccountId` varchar(100),
	`stripeAccountStatus` enum('pending','active','restricted') DEFAULT 'pending',
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `creator_profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `creator_profiles_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`creatorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`mediaUrl` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`thumbnailUrl` text,
	`width` int,
	`height` int,
	`duration` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`content` text,
	`postType` enum('free','subscription','ppv') NOT NULL DEFAULT 'free',
	`ppvPrice` decimal(10,2),
	`blurIntensity` int DEFAULT 20,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`viewsCount` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ppv_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`postId` int NOT NULL,
	`stripePaymentIntentId` varchar(100),
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ppv_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`fileUrl` text,
	`fileKey` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`salesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`itemId` int NOT NULL,
	`stripePaymentIntentId` varchar(100),
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`creatorId` int NOT NULL,
	`stripeSubscriptionId` varchar(100),
	`status` enum('active','canceled','past_due','expired') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`priceAtPurchase` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`creatorId` int NOT NULL,
	`postId` int,
	`amount` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(100),
	`message` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`userId` int,
	`type` enum('subscription','ppv','tip') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`creatorEarnings` decimal(10,2) NOT NULL,
	`stripePaymentId` varchar(100),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('fan','creator');--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;