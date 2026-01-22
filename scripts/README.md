# Scripts de Administração do FanClub

## Upload em Massa (`bulk-upload.mjs`)

Script para validar e preparar conteúdo em massa para upload no FanClub.

### Estrutura de Pastas

Organize seu conteúdo da seguinte forma:

```
/home/ubuntu/bulk-content/
├── criadora1/
│   ├── profile.json          # Dados do perfil (obrigatório)
│   ├── avatar.jpg            # Foto de perfil (opcional)
│   ├── cover.jpg             # Foto de capa (opcional)
│   └── posts/
│       ├── video1.mp4        # Vídeo do post
│       ├── video1.json       # Metadata do post
│       ├── foto1.jpg         # Foto do post
│       └── foto1.json        # Metadata do post
├── criadora2/
│   └── ...
```

### Formato do `profile.json`

```json
{
  "username": "maria_silva",
  "displayName": "Maria Silva",
  "bio": "Modelo profissional 💋 Conteúdo exclusivo todos os dias!",
  "location": "São Paulo, Brasil",
  "subscriptionPrice": "29.99",
  "isVerified": true,
  "isOnline": true
}
```

**Campos obrigatórios:**
- `username`: Nome de usuário único (sem espaços, apenas letras, números e underscore)
- `displayName`: Nome de exibição
- `subscriptionPrice`: Preço da assinatura mensal em reais

**Campos opcionais:**
- `bio`: Biografia da criadora
- `location`: Localização
- `isVerified`: Se a conta é verificada (padrão: false)
- `isOnline`: Se está online (padrão: false)

### Formato do `postX.json`

```json
{
  "content": "Novo vídeo exclusivo pra vocês! 💕 #dance #exclusive",
  "postType": "subscription",
  "ppvPrice": "9.99"
}
```

**Campos obrigatórios:**
- `postType`: Tipo do post
  - `"free"`: Gratuito (todos podem ver)
  - `"subscription"`: Apenas assinantes
  - `"ppv"`: Pay-per-view (requer `ppvPrice`)

**Campos opcionais:**
- `content`: Legenda do post
- `ppvPrice`: Preço para desbloquear (obrigatório se `postType` for `"ppv"`)

### Como Usar

1. **Organize seu conteúdo** na estrutura de pastas acima

2. **Execute o script** para validar:
   ```bash
   cd /home/ubuntu/fanclub
   node scripts/bulk-upload.mjs /home/ubuntu/bulk-content
   ```

3. **Verifique o output** - o script mostrará:
   - ✓ Criadoras válidas
   - ✓ Arquivos encontrados (avatar, capa, posts)
   - ❌ Erros de validação

4. **Faça o upload manual** através do painel Admin:
   - Acesse `/admin`
   - Clique em "Nova Criadora"
   - Preencha os dados do `profile.json`
   - Faça upload do avatar e capa
   - Crie posts usando o botão "Post"

### Exemplo Completo

```bash
# 1. Criar estrutura de pastas
mkdir -p /home/ubuntu/bulk-content/maria_silva/posts
mkdir -p /home/ubuntu/bulk-content/ana_costa/posts

# 2. Criar profile.json para Maria Silva
cat > /home/ubuntu/bulk-content/maria_silva/profile.json << 'EOF'
{
  "username": "maria_silva",
  "displayName": "Maria Silva",
  "bio": "Modelo profissional 💋",
  "location": "Rio de Janeiro, Brasil",
  "subscriptionPrice": "24.99",
  "isVerified": true,
  "isOnline": true
}
EOF

# 3. Copiar fotos e vídeos
cp /path/to/maria_avatar.jpg /home/ubuntu/bulk-content/maria_silva/avatar.jpg
cp /path/to/maria_cover.jpg /home/ubuntu/bulk-content/maria_silva/cover.jpg
cp /path/to/video1.mp4 /home/ubuntu/bulk-content/maria_silva/posts/dance.mp4

# 4. Criar metadata do post
cat > /home/ubuntu/bulk-content/maria_silva/posts/dance.json << 'EOF'
{
  "content": "Dançando pra vocês! 💃 #dance",
  "postType": "subscription"
}
EOF

# 5. Validar
cd /home/ubuntu/fanclub
node scripts/bulk-upload.mjs /home/ubuntu/bulk-content
```

### Dicas

- **Nomes de arquivo**: Use nomes descritivos sem espaços (ex: `dance_video.mp4`)
- **Tamanho de vídeos**: Recomendado até 100MB por vídeo
- **Formato de imagens**: JPG ou PNG
- **Formato de vídeos**: MP4 ou WebM
- **Username único**: Cada criadora deve ter um username diferente

### Troubleshooting

**Erro: "profile.json não encontrado"**
- Certifique-se de que cada pasta de criadora tem um `profile.json`

**Erro: "Campo obrigatório ausente"**
- Verifique se `username`, `displayName` e `subscriptionPrice` estão no `profile.json`

**Erro: "postType deve ser free, subscription ou ppv"**
- Verifique o valor de `postType` no arquivo `.json` do post

**Posts não aparecem**
- Certifique-se de que cada arquivo de mídia (`.mp4`, `.jpg`) tem um `.json` correspondente
- Exemplo: `video1.mp4` precisa de `video1.json`
