import { readdirSync } from 'fs';
import { join } from 'path';

// Nomes brasileiros femininos para as modelos
const brazilianNames = {
  'Amelia': { displayName: 'Amélia Santos', username: 'amelia_santos', bio: 'Modelo e influencer digital 💕 Conteúdo exclusivo aqui!', location: 'São Paulo, SP', price: '19.99' },
  'Bianca': { displayName: 'Bianca Oliveira', username: 'bianca_oliveira', bio: 'Criadora de conteúdo sensual ✨ Vem me conhecer melhor!', location: 'Rio de Janeiro, RJ', price: '24.99' },
  'Calista': { displayName: 'Camila Costa', username: 'camila_costa', bio: 'Modelo profissional 🔥 Posts exclusivos todos os dias!', location: 'Belo Horizonte, MG', price: '29.99' },
  'Diana': { displayName: 'Diana Ferreira', username: 'diana_ferreira', bio: 'Influencer e modelo 💋 Conteúdo premium aqui!', location: 'Brasília, DF', price: '19.99' },
  'Elena': { displayName: 'Elena Rodrigues', username: 'elena_rodrigues', bio: 'Criadora de conteúdo adulto 🌟 Assine para ver mais!', location: 'Curitiba, PR', price: '34.99' },
  'Grace': { displayName: 'Graziela Lima', username: 'graziela_lima', bio: 'Modelo e atriz 💫 Conteúdo exclusivo e sensual!', location: 'Porto Alegre, RS', price: '24.99' },
  'Harriet': { displayName: 'Helena Martins', username: 'helena_martins', bio: 'Influencer digital 🌹 Posts quentes todos os dias!', location: 'Recife, PE', price: '19.99' },
  'Inori': { displayName: 'Isabela Souza', username: 'isabela_souza', bio: 'Modelo profissional 💕 Conteúdo premium e exclusivo!', location: 'Fortaleza, CE', price: '29.99' },
  'Julia': { displayName: 'Júlia Alves', username: 'julia_alves', bio: 'Criadora de conteúdo sensual ✨ Vem me conhecer!', location: 'Salvador, BA', price: '24.99' },
  'Kia': { displayName: 'Karina Silva', username: 'karina_silva', bio: 'Modelo e influencer 🔥 Assine para conteúdo exclusivo!', location: 'Manaus, AM', price: '19.99' },
  'Lexi': { displayName: 'Letícia Pereira', username: 'leticia_pereira', bio: 'Criadora de conteúdo adulto 💋 Posts diários!', location: 'Goiânia, GO', price: '24.99' },
  'Lina': { displayName: 'Lina Carvalho', username: 'lina_carvalho', bio: 'Modelo profissional 🌟 Conteúdo sensual e exclusivo!', location: 'Belém, PA', price: '29.99' },
  'Lucy': { displayName: 'Luciana Ribeiro', username: 'luciana_ribeiro', bio: 'Influencer digital 💫 Vem ver meu conteúdo premium!', location: 'Vitória, ES', price: '19.99' },
  'Maya': { displayName: 'Mayara Gomes', username: 'mayara_gomes', bio: 'Modelo e criadora 🌹 Assine para ver mais!', location: 'Florianópolis, SC', price: '24.99' },
  'Megan': { displayName: 'Melissa Santos', username: 'melissa_santos', bio: 'Criadora de conteúdo sensual 💕 Posts exclusivos!', location: 'Natal, RN', price: '34.99' },
  'Raven': { displayName: 'Rafaela Costa', username: 'rafaela_costa', bio: 'Modelo profissional ✨ Conteúdo premium aqui!', location: 'São Luís, MA', price: '29.99' },
  'Sarah': { displayName: 'Sara Oliveira', username: 'sara_oliveira', bio: 'Influencer e modelo 🔥 Vem me conhecer melhor!', location: 'Maceió, AL', price: '24.99' },
  'Skye': { displayName: 'Sabrina Lima', username: 'sabrina_lima', bio: 'Criadora de conteúdo adulto 💋 Assine agora!', location: 'João Pessoa, PB', price: '19.99' },
  'Sophie': { displayName: 'Sofia Ferreira', username: 'sofia_ferreira', bio: 'Modelo e atriz 🌟 Conteúdo exclusivo e sensual!', location: 'Teresina, PI', price: '24.99' },
  'Tonya': { displayName: 'Tatiana Rodrigues', username: 'tatiana_rodrigues', bio: 'Influencer digital 💫 Posts quentes todos os dias!', location: 'Campo Grande, MS', price: '29.99' }
};

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌟 SCRIPT DE ADIÇÃO DE MODELOS - FANCLUB 🌟             ║
║                                                            ║
║   Este script adiciona 20 modelos brasileiras com         ║
║   fotos de perfil e vídeos sincronizados.                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

const modelsDir = '/home/ubuntu/candy_models/candy_models_media_v2';

const modelFolders = readdirSync(modelsDir).filter(name => {
  return brazilianNames[name] !== undefined;
});

console.log(`📁 Encontradas ${modelFolders.length} pastas de modelos\n`);
console.log('📋 Modelos que serão adicionadas:\n');

modelFolders.forEach((folderName, index) => {
  const info = brazilianNames[folderName];
  console.log(`   ${index + 1}. ${info.displayName} (@${info.username}) - ${info.location} - R$ ${info.price}/mês`);
});

console.log(`
\n⚠️  IMPORTANTE:
   - Este script deve ser executado MANUALMENTE via painel Admin
   - Use a funcionalidade "Nova Criadora" no painel Admin
   - Copie os dados de cada modelo abaixo e cole no formulário
   - Faça upload das fotos e vídeos manualmente
\n`);

console.log('═'.repeat(60));
console.log('\n📝 DADOS DAS MODELOS PARA COPIAR:\n');

modelFolders.forEach((folderName, index) => {
  const info = brazilianNames[folderName];
  const modelPath = join(modelsDir, folderName);
  const files = readdirSync(modelPath);
  
  const photoFile = files.find(f => f.includes('photo'));
  const videoFile = files.find(f => f.includes('video'));
  
  console.log(`\n${index + 1}. ${info.displayName}`);
  console.log('─'.repeat(60));
  console.log(`   Username: ${info.username}`);
  console.log(`   Nome: ${info.displayName}`);
  console.log(`   Bio: ${info.bio}`);
  console.log(`   Localização: ${info.location}`);
  console.log(`   Preço Mensal: R$ ${info.price}`);
  console.log(`   Verificada: Sim`);
  console.log(`   Online: Sim`);
  console.log(`   Foto: ${join(modelPath, photoFile)}`);
  console.log(`   Vídeo: ${join(modelPath, videoFile)}`);
});

console.log(`\n${'═'.repeat(60)}\n`);
console.log('✅ Lista completa gerada!');
console.log('📌 Use o painel Admin em /admin para adicionar as modelos manualmente.\n');
