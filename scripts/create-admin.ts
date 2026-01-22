import "dotenv/config";
import * as db from "../server/db";
import { users } from "../drizzle/schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing");

  console.log("Conectando ao banco de dados...");
  const connection = await mysql.createConnection(url);
  const d = drizzle(connection);

  const email = "admin@teste.com";
  const password = "admin123"; // Você poderá mudar depois

  console.log(`Tentando criar usuário: ${email}`);

  try {
    // Usando a função de registro que já criamos para garantir o hash da senha
    const user = await db.registerUser({
      email,
      password,
      name: "Administrador",
    });

    // Forçar papel de admin
    await d.update(users)
      .set({ role: "admin" })
      .where(db.eq(users.id, user.id));

    console.log("✅ Usuário administrador criado com sucesso!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
  } finally {
    await connection.end();
  }
}

main();
