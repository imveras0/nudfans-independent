import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Conectando ao banco de dados...");
  let connection;
  try {
    connection = await mysql.createConnection(url);

    const email = "admin@teste.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Verificando se o usuário já existe: ${email}`);
    
    // Garantir que a tabela users existe com a estrutura correta
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(320) UNIQUE,
        password TEXT,
        loginMethod VARCHAR(64),
        role VARCHAR(64) DEFAULT 'user',
        userType VARCHAR(64),
        stripeCustomerId VARCHAR(255),
        onboardingCompleted BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP
      )
    `);

    const [rows] = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
    const existing = rows as any[];

    if (existing && existing.length > 0) {
      console.log("ℹ️ Usuário administrador já existe. Resetando senha para garantir acesso...");
      await connection.query(
        "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
        [hashedPassword, email]
      );
      console.log("✅ Senha do administrador resetada com sucesso!");
    } else {
      console.log("Criando novo usuário administrador...");
      await connection.query(
        "INSERT INTO users (openId, name, email, password, loginMethod, role, onboardingCompleted) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nanoid(), "Administrador", email, hashedPassword, "email", "admin", true]
      );
      console.log("✅ Usuário administrador criado com sucesso!");
    }
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
  } catch (error) {
    console.error("❌ Erro crítico no script:", error);
  } finally {
    if (connection) await connection.end();
  }
}

main();
