import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Modelos brasileiras de exemplo
const models = [
  {
    username: "bianca_santos",
    displayName: "Bianca Santos",
    bio: "Oii amor! 💕 Sou a Bianca, carioca de 23 anos. Adoro dançar, malhar e fazer conteúdo exclusivo pra vocês. Vem conhecer meu lado mais ousado! 🔥",
    location: "Rio de Janeiro, RJ",
    avatarUrl: "/models/model1.jpg",
    coverUrl: "/models/model1.jpg",
    subscriptionPrice: "19.99",
    isVerified: true,
    isOnline: true,
  },
  {
    username: "amanda_silva",
    displayName: "Amanda Silva",
    bio: "Hey gatinho! 😘 Amanda aqui, paulistana e apaixonada por lingerie. Meus conteúdos são feitos com muito carinho pra você. Me segue! 💋",
    location: "São Paulo, SP",
    avatarUrl: "/models/model2.jpg",
    coverUrl: "/models/model2.jpg",
    subscriptionPrice: "14.99",
    isVerified: true,
    isOnline: false,
  },
  {
    username: "juliana_costa",
    displayName: "Juliana Costa",
    bio: "Oi bebê! 🌸 Sou a Ju, mineira de 25 anos. Amo criar conteúdo sensual e provocante. Assina pra ver tudo sem censura! 🔞",
    location: "Belo Horizonte, MG",
    avatarUrl: "/models/model5.jpg",
    coverUrl: "/models/model5.jpg",
    subscriptionPrice: "24.99",
    isVerified: true,
    isOnline: true,
  },
  {
    username: "larissa_oliveira",
    displayName: "Larissa Oliveira",
    bio: "E aí gato! 😈 Larissa, 22 aninhos, gaúcha e muito safadinha. Meus vídeos vão te deixar louco! Vem pro meu mundo! 💦",
    location: "Porto Alegre, RS",
    avatarUrl: "/models/model4.webp",
    coverUrl: "/models/model4.webp",
    subscriptionPrice: "29.99",
    isVerified: false,
    isOnline: true,
  },
  {
    username: "fernanda_lima",
    displayName: "Fernanda Lima",
    bio: "Oie amor! 💖 Fê aqui, baiana de 24 anos. Adoro praia, sol e fazer conteúdo picante. Vem se divertir comigo! 🌴",
    location: "Salvador, BA",
    avatarUrl: "/models/model6.jpg",
    coverUrl: "/models/model6.jpg",
    subscriptionPrice: "12.99",
    isVerified: true,
    isOnline: false,
  },
  {
    username: "carolina_mendes",
    displayName: "Carolina Mendes",
    bio: "Oi lindinho! 🥰 Carol, curitibana de 26 anos. Conteúdo exclusivo e muito carinho pra quem assina. Te espero lá! 💕",
    location: "Curitiba, PR",
    avatarUrl: "/models/model3.jpg",
    coverUrl: "/models/model3.jpg",
    subscriptionPrice: "17.99",
    isVerified: true,
    isOnline: true,
  },
];

// Vídeos de exemplo (URLs de vídeos públicos)
const sampleVideos = [
  "https://videos.pexels.com/video-files/5530243/5530243-uhd_1440_2560_25fps.mp4",
  "https://videos.pexels.com/video-files/5530244/5530244-uhd_1440_2560_25fps.mp4",
  "https://videos.pexels.com/video-files/4057411/4057411-uhd_1440_2732_25fps.mp4",
  "https://videos.pexels.com/video-files/4057412/4057412-uhd_1440_2732_25fps.mp4",
  "https://videos.pexels.com/video-files/4536169/4536169-uhd_1440_2560_25fps.mp4",
  "https://videos.pexels.com/video-files/4536170/4536170-uhd_1440_2560_25fps.mp4",
];

async function seedModels() {
  console.log("Iniciando seed de modelos...");

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const openId = `demo_model_${model.username}`;

    try {
      // Criar usuário
      await connection.execute(
        `INSERT INTO users (openId, name, email, loginMethod, role, userType, onboardingCompleted)
         VALUES (?, ?, ?, 'demo', 'user', 'creator', true)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [openId, model.displayName, `${model.username}@fanclub.demo`]
      );

      // Buscar ID do usuário
      const [users] = await connection.execute(
        "SELECT id FROM users WHERE openId = ?",
        [openId]
      );
      const userId = users[0].id;

      // Criar perfil de criadora
      await connection.execute(
        `INSERT INTO creator_profiles 
         (userId, username, displayName, bio, location, avatarUrl, coverUrl, subscriptionPrice, isVerified, isOnline)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         displayName = VALUES(displayName),
         bio = VALUES(bio),
         location = VALUES(location),
         avatarUrl = VALUES(avatarUrl),
         coverUrl = VALUES(coverUrl),
         subscriptionPrice = VALUES(subscriptionPrice),
         isVerified = VALUES(isVerified),
         isOnline = VALUES(isOnline)`,
        [
          userId,
          model.username,
          model.displayName,
          model.bio,
          model.location,
          model.avatarUrl,
          model.coverUrl,
          model.subscriptionPrice,
          model.isVerified,
          model.isOnline,
        ]
      );

      // Buscar ID do perfil
      const [profiles] = await connection.execute(
        "SELECT id FROM creator_profiles WHERE userId = ?",
        [userId]
      );
      const creatorId = profiles[0].id;

      // Criar post com vídeo
      const videoUrl = sampleVideos[i % sampleVideos.length];
      
      await connection.execute(
        `INSERT INTO posts (creatorId, content, postType, likesCount, viewsCount)
         VALUES (?, ?, 'free', ?, ?)`,
        [
          creatorId,
          `Oii amores! 💕 Novo vídeo pra vocês! Me sigam pra mais conteúdo exclusivo 🔥 #dance #brasil #exclusive`,
          Math.floor(Math.random() * 5000) + 1000,
          Math.floor(Math.random() * 50000) + 10000,
        ]
      );

      // Buscar ID do post
      const [postsResult] = await connection.execute(
        "SELECT id FROM posts WHERE creatorId = ? ORDER BY id DESC LIMIT 1",
        [creatorId]
      );
      const postId = postsResult[0].id;

      // Adicionar mídia do vídeo
      await connection.execute(
        `INSERT INTO post_media (postId, mediaType, url, fileKey, thumbnailUrl)
         VALUES (?, 'video', ?, ?, ?)`,
        [postId, videoUrl, `demo_video_${model.username}`, model.avatarUrl]
      );

      // Criar mais alguns posts com imagens
      for (let j = 0; j < 3; j++) {
        await connection.execute(
          `INSERT INTO posts (creatorId, content, postType, likesCount, viewsCount)
           VALUES (?, ?, ?, ?, ?)`,
          [
            creatorId,
            j === 0 
              ? `Bom dia amores! ☀️ Começando o dia com muita energia! 💪 #goodmorning #brasil`
              : j === 1
              ? `Quem quer ver mais? 😏 Assina pra ter acesso ao conteúdo completo! 🔥 #exclusive #hot`
              : `Noite especial pra quem assina! 🌙 Te espero lá amor! 💋 #nightvibes`,
            j === 2 ? 'subscription' : 'free',
            Math.floor(Math.random() * 3000) + 500,
            Math.floor(Math.random() * 20000) + 5000,
          ]
        );

        const [newPostResult] = await connection.execute(
          "SELECT id FROM posts WHERE creatorId = ? ORDER BY id DESC LIMIT 1",
          [creatorId]
        );
        const newPostId = newPostResult[0].id;

        await connection.execute(
          `INSERT INTO post_media (postId, mediaType, url, fileKey)
           VALUES (?, 'image', ?, ?)`,
          [newPostId, model.avatarUrl, `demo_image_${model.username}_${j}`]
        );
      }

      console.log(`✅ Modelo ${model.displayName} criada com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao criar modelo ${model.displayName}:`, error.message);
    }
  }

  console.log("\\n🎉 Seed concluído!");
  await connection.end();
}

seedModels().catch(console.error);
