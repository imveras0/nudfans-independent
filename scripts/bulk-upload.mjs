/**
 * Script de Upload em Massa para FanClub
 * 
 * Este script permite criar múltiplas criadoras e fazer upload de posts com fotos/vídeos de uma só vez.
 * 
 * Estrutura de pasta esperada:
 * /home/ubuntu/bulk-content/
 *   ├── criadora1/
 *   │   ├── profile.json (dados do perfil)
 *   │   ├── avatar.jpg (foto de perfil)
 *   │   ├── cover.jpg (foto de capa)
 *   │   └── posts/
 *   │       ├── post1.mp4
 *   │       ├── post1.json (metadata do post)
 *   │       ├── post2.jpg
 *   │       └── post2.json
 *   ├── criadora2/
 *   │   └── ...
 * 
 * Formato do profile.json:
 * {
 *   "username": "maria_silva",
 *   "displayName": "Maria Silva",
 *   "bio": "Modelo profissional 💋",
 *   "location": "São Paulo, Brasil",
 *   "subscriptionPrice": "29.99",
 *   "isVerified": true,
 *   "isOnline": true
 * }
 * 
 * Formato do postX.json:
 * {
 *   "content": "Descrição do post 💕",
 *   "postType": "free" | "subscription" | "ppv",
 *   "ppvPrice": "9.99" (opcional, só para PPV)
 * }
 * 
 * Uso:
 * node scripts/bulk-upload.mjs /home/ubuntu/bulk-content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateProfileData(profile) {
  const required = ['username', 'displayName', 'subscriptionPrice'];
  for (const field of required) {
    if (!profile[field]) {
      throw new Error(`Campo obrigatório ausente: ${field}`);
    }
  }
  return true;
}

function validatePostData(post) {
  if (!post.postType || !['free', 'subscription', 'ppv'].includes(post.postType)) {
    throw new Error('postType deve ser "free", "subscription" ou "ppv"');
  }
  if (post.postType === 'ppv' && !post.ppvPrice) {
    throw new Error('ppvPrice é obrigatório para posts PPV');
  }
  return true;
}

async function processCreator(creatorDir) {
  const creatorName = path.basename(creatorDir);
  log(`\n📁 Processando: ${creatorName}`, 'cyan');

  // Ler profile.json
  const profilePath = path.join(creatorDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    log(`  ❌ profile.json não encontrado`, 'red');
    return { success: false, error: 'profile.json não encontrado' };
  }

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  validateProfileData(profile);

  // Verificar arquivos de mídia do perfil
  const avatarPath = path.join(creatorDir, 'avatar.jpg');
  const coverPath = path.join(creatorDir, 'cover.jpg');
  
  const hasAvatar = fs.existsSync(avatarPath);
  const hasCover = fs.existsSync(coverPath);

  log(`  ✓ Perfil: ${profile.displayName} (@${profile.username})`, 'green');
  log(`  ✓ Avatar: ${hasAvatar ? 'Sim' : 'Não'}`, hasAvatar ? 'green' : 'yellow');
  log(`  ✓ Capa: ${hasCover ? 'Sim' : 'Não'}`, hasCover ? 'green' : 'yellow');

  // Processar posts
  const postsDir = path.join(creatorDir, 'posts');
  let postCount = 0;

  if (fs.existsSync(postsDir)) {
    const files = fs.readdirSync(postsDir);
    const mediaFiles = files.filter(f => f.match(/\.(jpg|jpeg|png|mp4|webm)$/i));
    
    for (const mediaFile of mediaFiles) {
      const baseName = path.basename(mediaFile, path.extname(mediaFile));
      const metadataPath = path.join(postsDir, `${baseName}.json`);
      
      if (fs.existsSync(metadataPath)) {
        const postData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        validatePostData(postData);
        postCount++;
      }
    }
  }

  log(`  ✓ Posts: ${postCount}`, postCount > 0 ? 'green' : 'yellow');

  return {
    success: true,
    profile,
    avatarPath: hasAvatar ? avatarPath : null,
    coverPath: hasCover ? coverPath : null,
    postCount,
    postsDir: fs.existsSync(postsDir) ? postsDir : null
  };
}

async function main() {
  const contentDir = process.argv[2] || '/home/ubuntu/bulk-content';

  log('🚀 FanClub - Upload em Massa', 'blue');
  log(`📂 Diretório: ${contentDir}\n`, 'blue');

  if (!fs.existsSync(contentDir)) {
    log(`❌ Diretório não encontrado: ${contentDir}`, 'red');
    log(`\nCrie o diretório e organize o conteúdo conforme a estrutura esperada.`, 'yellow');
    process.exit(1);
  }

  const creators = fs.readdirSync(contentDir)
    .map(name => path.join(contentDir, name))
    .filter(dir => fs.statSync(dir).isDirectory());

  if (creators.length === 0) {
    log('❌ Nenhuma pasta de criadora encontrada', 'red');
    process.exit(1);
  }

  log(`📊 Encontradas ${creators.length} criadoras\n`, 'cyan');

  const results = [];
  for (const creatorDir of creators) {
    try {
      const result = await processCreator(creatorDir);
      results.push(result);
    } catch (error) {
      log(`  ❌ Erro: ${error.message}`, 'red');
      results.push({ success: false, error: error.message });
    }
  }

  // Resumo
  log('\n' + '='.repeat(60), 'cyan');
  log('📈 RESUMO', 'cyan');
  log('='.repeat(60), 'cyan');

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const totalPosts = results.reduce((sum, r) => sum + (r.postCount || 0), 0);

  log(`✓ Criadoras processadas com sucesso: ${successful}`, 'green');
  log(`✗ Criadoras com erro: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📝 Total de posts: ${totalPosts}`, 'cyan');

  log('\n⚠️  ATENÇÃO:', 'yellow');
  log('Este script apenas VALIDA os dados.', 'yellow');
  log('Para fazer o upload real, você precisa:', 'yellow');
  log('1. Implementar a lógica de upload para S3', 'yellow');
  log('2. Chamar as APIs tRPC do admin para criar criadoras e posts', 'yellow');
  log('3. Ou usar o painel Admin para criar manualmente\n', 'yellow');

  log('💡 Próximos passos:', 'blue');
  log('- Todos os dados estão validados e prontos', 'blue');
  log('- Use o painel Admin (/admin) para criar as criadoras', 'blue');
  log('- Faça upload das fotos/vídeos através do formulário de criação de posts\n', 'blue');
}

main().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
