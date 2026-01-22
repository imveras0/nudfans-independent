import { db } from '../server/db.ts';
import { users, creatorProfiles, posts, postMedia } from '../drizzle/schema.ts';
import { storagePut } from '../server/storage.ts';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

// Nomes brasileiros femininos para as modelos
const brazilianNames = {
  'Amelia': { displayName: 'Amélia Santos', username: 'amelia_santos', bio: 'Modelo e influencer digital 💕 Conteúdo exclusivo aqui!', location: 'São Paulo, SP' },
  'Bianca': { displayName: 'Bianca Oliveira', username: 'bianca_oliveira', bio: 'Criadora de conteúdo sensual ✨ Vem me conhecer melhor!', location: 'Rio de Janeiro, RJ' },
  'Calista': { displayName: 'Camila Costa', username: 'camila_costa', bio: 'Modelo profissional 🔥 Posts exclusivos todos os dias!', location: 'Belo Horizonte, MG' },
  'Diana': { displayName: 'Diana Ferreira', username: 'diana_ferreira', bio: 'Influencer e modelo 💋 Conteúdo premium aqui!', location: 'Brasília, DF' },
  'Elena': { displayName: 'Elena Rodrigues', username: 'elena_rodrigues', bio: 'Criadora de conteúdo adulto 🌟 Assine para ver mais!', location: 'Curitiba, PR' },
  'Grace': { displayName: 'Graziela Lima', username: 'graziela_lima', bio: 'Modelo e atriz 💫 Conteúdo exclusivo e sensual!', location: 'Porto Alegre, RS' },
  'Harriet': { displayName: 'Helena Martins', username: 'helena_martins', bio: 'Influencer digital 🌹 Posts quentes todos os dias!', location: 'Recife, PE' },
  'Inori': { displayName: 'Isabela Souza', username: 'isabela_souza', bio: 'Modelo profissional 💕 Conteúdo premium e exclusivo!', location: 'Fortaleza, CE' },
  'Julia': { displayName: 'Júlia Alves', username: 'julia_alves', bio: 'Criadora de conteúdo sensual ✨ Vem me conhecer!', location: 'Salvador, BA' },
  'Kia': { displayName: 'Karina Silva', username: 'karina_silva', bio: 'Modelo e influencer 🔥 Assine para conteúdo exclusivo!', location: 'Manaus, AM' },
  'Lexi': { displayName: 'Letícia Pereira', username: 'leticia_pereira', bio: 'Criadora de conteúdo adulto 💋 Posts diários!', location: 'Goiânia, GO' },
  'Lina': { displayName: 'Lina Carvalho', username: 'lina_carvalho', bio: 'Modelo profissional 🌟 Conteúdo sensual e exclusivo!', location: 'Belém, PA' },
  'Lucy': { displayName: 'Luciana Ribeiro', username: 'luciana_ribeiro', bio: 'Influencer digital 💫 Vem ver meu conteúdo premium!', location: 'Vitória, ES' },
  'Maya': { displayName: 'Mayara Gomes', username: 'mayara_gomes', bio: 'Modelo e criadora 🌹 Assine para ver mais!', location: 'Florianópolis, SC' },
  'Megan': { displayName: 'Melissa Santos', username: 'melissa_santos', bio: 'Criadora de conteúdo sensual 💕 Posts exclusivos!', location: 'Natal, RN' },
  'Raven': { displayName: 'Rafaela Costa', username: 'rafaela_costa', bio: 'Modelo profissional ✨ Conteúdo premium aqui!', location: 'São Luís, MA' },
  'Sarah': { displayName: 'Sara Oliveira', username: 'sara_oliveira', bio: 'Influencer e modelo 🔥 Vem me conhecer melhor!', location: 'Maceió, AL' },
  'Skye': { displayName: 'Sabrina Lima', username: 'sabrina_lima', bio: 'Criadora de conteúdo adulto 💋 Assine agora!', location: 'João Pessoa, PB' },
  'Sophie': { displayName: 'Sofia Ferreira', username: 'sofia_ferreira', bio: 'Modelo e atriz 🌟 Conteúdo exclusivo e sensual!', location: 'Teresina, PI' },
  'Tonya': { displayName: 'Tatiana Rodrigues', username: 'tatiana_rodrigues', bio: 'Influencer digital 💫 Posts quentes todos os dias!', location: 'Campo Grande, MS' }
};

const modelsDir = '/home/ubuntu/candy_models/candy_models_media_v2';

async function addModels() {
  console.log('🚀 Iniciando adição de modelos...\n');
  
  const modelFolders = readdirSync(modelsDir).filter(name => {
    return brazilianNames[name] !== undefined;
  });
  
  console.log(`📁 Encontradas ${modelFolders.length} pastas de modelos\n`);
  
  for (const folderName of modelFolders) {
    try {
      const modelInfo = brazilianNames[folderName];
      const modelPath = join(modelsDir, folderName);
      const files = readdirSync(modelPath);
      
      const photoFile = files.find(f => f.includes('photo'));
      const videoFile = files.find(f => f.includes('video'));
      
      if (!photoFile || !videoFile) {
        console.log(`⚠️  ${folderName}: Arquivos incompletos, pulando...`);
        continue;
      }
      
      console.log(`📸 Processando ${modelInfo.displayName}...`);
      
      // Upload da foto de perfil
      const photoPath = join(modelPath, photoFile);
      const photoBuffer = readFileSync(photoPath);
      const photoExt = photoFile.split('.').pop();
      const photoKey = `avatars/${Date.now()}-${randomBytes(8).toString('hex')}.${photoExt}`;
      const { url: avatarUrl } = await storagePut(photoKey, photoBuffer, `image/${photoExt}`);
      
      console.log(`  ✓ Avatar uploaded: ${avatarUrl.substring(0, 50)}...`);
      
      // Upload do vídeo
      const videoPath = join(modelPath, videoFile);
      const videoBuffer = readFileSync(videoPath);
      const videoExt = videoFile.split('.').pop();
      const videoKey = `videos/${Date.now()}-${randomBytes(8).toString('hex')}.${videoExt}`;
      const { url: videoUrl } = await storagePut(videoKey, videoBuffer, `video/${videoExt}`);
      
      console.log(`  ✓ Vídeo uploaded: ${videoUrl.substring(0, 50)}...`);
      
      // Criar usuário
      const [user] = await db.insert(users).values({
        openId: `model_${modelInfo.username}_${Date.now()}`,
        name: modelInfo.displayName,
        email: `${modelInfo.username}@fanclub.local`,
        loginMethod: 'email',
        role: 'user',
        userType: 'creator',
        onboardingCompleted: true
      }).returning();
      
      console.log(`  ✓ Usuário criado: ID ${user.id}`);
      
      // Criar perfil de criadora
      const monthlyPrice = (Math.floor(Math.random() * 6) + 2) * 4.99; // R$ 9.98 a R$ 34.93
      const [profile] = await db.insert(creatorProfiles).values({
        userId: user.id,
        username: modelInfo.username,
        displayName: modelInfo.displayName,
        bio: modelInfo.bio,
        avatarUrl: avatarUrl,
        coverUrl: avatarUrl, // Usar a mesma foto como capa
        location: modelInfo.location,
        monthlyPrice: monthlyPrice.toFixed(2),
        isVerified: Math.random() > 0.3, // 70% verificadas
        isOnline: Math.random() > 0.5 // 50% online
      }).returning();
      
      console.log(`  ✓ Perfil criado: @${profile.username} - R$ ${monthlyPrice.toFixed(2)}/mês`);
      
      // Criar post com vídeo
      const [post] = await db.insert(posts).values({
        creatorId: profile.id,
        caption: `Oii amores! 💕 Novo vídeo exclusivo pra vocês! Me sigam pra mais conteúdo sensual 🔥 #${modelInfo.username} #exclusive`,
        type: 'free', // Post gratuito para aparecer no Explorar
        blurIntensity: 0
      }).returning();
      
      console.log(`  ✓ Post criado: ID ${post.id}`);
      
      // Adicionar mídia ao post
      await db.insert(postMedia).values({
        postId: post.id,
        url: videoUrl,
        type: 'video',
        thumbnailUrl: avatarUrl // Usar a foto como thumbnail do vídeo
      });
      
      console.log(`  ✓ Mídia adicionada ao post`);
      console.log(`✅ ${modelInfo.displayName} adicionada com sucesso!\n`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${folderName}:`, error.message);
      console.log('');
    }
  }
  
  console.log('🎉 Processo concluído!');
  process.exit(0);
}

addModels().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
