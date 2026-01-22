import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check user 1 (logged in user)
const [user1] = await conn.execute(`SELECT u.id as userId, u.name, u.userType, cp.id as creatorProfileId, cp.username FROM users u LEFT JOIN creator_profiles cp ON u.id = cp.userId WHERE u.id = 1`);
console.log("User 1 info:", user1);

// Check all conversations
const [convs] = await conn.execute(`SELECT c.id, c.creatorId, c.fanId, cp.displayName as creatorName, u.name as fanName FROM conversations c JOIN creator_profiles cp ON c.creatorId = cp.id JOIN users u ON c.fanId = u.id`);
console.log("\nAll conversations:", convs);

// Check conversations for user 1 as creator (profile id 1)
const [creatorConvs] = await conn.execute(`SELECT * FROM conversations WHERE creatorId = 1`);
console.log("\nConversations where creatorId = 1:", creatorConvs);

// Check conversations for user 1 as fan (user id 1)
const [fanConvs] = await conn.execute(`SELECT * FROM conversations WHERE fanId = 1`);
console.log("\nConversations where fanId = 1:", fanConvs);

await conn.end();
