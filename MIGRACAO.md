# Guia de Migração - NudFans

## 📦 Conteúdo do Pacote

Este ZIP contém a plataforma NudFans completa:
- ✅ Código-fonte completo (frontend + backend)
- ✅ Banco de dados com 19 criadoras e conteúdo
- ✅ Configurações do Stripe
- ✅ Logo e assets visuais
- ✅ Identidade visual rosa/roxa

## 🚀 Como Migrar para Outra Conta Manus

### 1. Criar Novo Projeto
1. Acesse sua nova conta Manus
2. Clique em "Novo Projeto"
3. Escolha "Importar de ZIP"
4. Faça upload do arquivo `nudfans-completo.zip`

### 2. Restaurar Banco de Dados
Após o projeto ser criado:
1. Acesse o painel de gerenciamento
2. Vá em "Database"
3. Clique em "Import SQL"
4. Faça upload do arquivo `nudfans_database_backup.sql`

### 3. Configurar Stripe
1. Acesse Settings → Payment
2. Configure suas chaves do Stripe:
   - Publishable Key (começa com `pk_`)
   - Secret Key (começa com `sk_`)
   - Webhook Secret (começa com `whsec_`)

### 4. Configurar Domínio (Opcional)
1. Acesse Settings → Domains
2. Configure domínio personalizado (ex: nudfans.com.br)

## 📋 Checklist Pós-Migração

- [ ] Projeto importado com sucesso
- [ ] Banco de dados restaurado
- [ ] Chaves do Stripe configuradas
- [ ] Teste de login funcionando
- [ ] Teste de navegação (Explorar, Perfis)
- [ ] Teste de checkout (cartão de teste: 4242 4242 4242 4242)
- [ ] Domínio configurado (se aplicável)

## 🎨 Recursos Incluídos

### Funcionalidades
- Sistema de autenticação OAuth
- 19 criadoras com perfis completos
- Posts com fotos e vídeos
- Chat com IA para conversão
- Sistema de assinatura com Stripe
- Painel admin master
- Feed estilo TikTok

### Design
- Logo NudFans profissional
- Paleta de cores rosa/magenta/roxo
- Identidade visual moderna e sensual
- Responsivo mobile-first

## ⚙️ Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente pela Manus:
- `DATABASE_URL` - Conexão com banco de dados
- `JWT_SECRET` - Segredo para sessões
- `VITE_APP_ID` - ID do app OAuth
- `STRIPE_SECRET_KEY` - Chave secreta Stripe (você deve configurar)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Chave pública Stripe (você deve configurar)
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook Stripe (você deve configurar)

## 🆘 Suporte

Se encontrar problemas na migração:
1. Verifique se todas as chaves do Stripe estão corretas
2. Confirme que o banco de dados foi importado
3. Acesse https://help.manus.im para suporte

## 📝 Notas Importantes

- **Stripe Test Mode**: Use o cartão `4242 4242 4242 4242` para testes
- **Conteúdo Adulto**: Lembre-se que Stripe proíbe conteúdo explícito. Para conteúdo +18, considere migrar para CCBill ou SegPay
- **Criadoras de Teste**: As 19 criadoras são perfis de demonstração. Você pode editá-las ou criar novas no painel admin

## 🎯 Próximos Passos Sugeridos

1. **Adicionar PIX**: Implementar pagamento via PIX para brasileiros (taxa menor)
2. **Migrar para CCBill**: Se for permitir conteúdo +18 explícito
3. **Personalizar Criadoras**: Editar perfis das modelos ou adicionar novas
4. **Marketing**: Configurar domínio personalizado e começar divulgação

---

Desenvolvido com ❤️ para NudFans
