# FanClub - TODO

## Autenticação e Onboarding
- [x] Sistema de autenticação OAuth
- [x] Página de onboarding para escolher tipo de usuário (Criadora ou Fã)
- [x] Setup de perfil para criadoras

## Perfis de Criadoras
- [x] Página de perfil público (/creator/:username)
- [x] Header com foto de capa ajustável e foto de perfil
- [x] Informações: nome, username, bio, localização
- [x] Estatísticas: posts, seguidores, likes
- [x] Status online/offline
- [x] Selo de verificação
- [x] Botões de Seguir (gratuito) e Assinar (pago)
- [x] Tabs de conteúdo: Posts, Mídia, Loja

## Sistema de Posts
- [x] Criação de posts com descrição e tipo (gratuito/assinatura/PPV)
- [x] Upload de múltiplas mídias (até 10 arquivos)
- [x] Integração AWS S3 para armazenamento
- [x] Sistema de blur sofisticado para posts PPV
- [x] Edição de posts
- [x] Deleção de posts com confirmação

## Dashboard de Criadoras
- [x] Layout responsivo com sidebar colapsável
- [x] Analytics de ganhos
- [x] Analytics de visualizações
- [x] Analytics de crescimento de seguidores
- [x] Gerenciamento de posts (listar/editar/deletar)
- [x] Configurações de perfil
- [x] Configurações de preços de assinatura

## Sistema de Pagamentos (Stripe)
- [x] Checkout de assinatura mensal
- [x] Compras PPV (pay-per-view)
- [x] Sistema de gorjetas (tips)
- [x] Webhooks para status de pagamentos
- [x] Gerenciamento de assinaturas recorrentes

## Chat/Mensagens
- [x] Interface de chat entre criadoras e assinantes
- [x] Lista de conversas
- [x] Envio e recebimento de mensagens em tempo real

## Sistema de Seguir/Assinar
- [x] Seguir criadoras gratuitamente
- [x] Assinar criadoras (pago)
- [x] Lista de seguidores
- [x] Lista de assinantes

## Notificações
- [x] Alertas para proprietário sobre novos cadastros de criadoras
- [x] Alertas sobre transações importantes
- [x] Alertas sobre atividades críticas

## Design e UX
- [x] Design elegante e sofisticado
- [x] Responsividade completa
- [x] Navegação mobile (bottom navigation)
- [x] Feedback visual (loading, toasts)


## Melhorias - Fase 2
- [x] Sistema de comentários nos posts
- [x] Notificações em tempo real (novos posts, mensagens, assinaturas)
- [x] Página de histórico de pagamentos
- [x] Melhorias de UX e performance
- [x] Testes unitários para comentários e notificações


## Bugs
- [x] Corrigir erro 404 na rota /creator/ (sem username)
- [x] Corrigir erro de acessibilidade: DialogContent requer DialogTitle

## Melhorias - Fase 3
- [x] Corrigir botão "Perfil" para ir ao perfil do usuário logado
- [x] Aba Explorar estilo TikTok com vídeos em tela cheia
- [x] Criar perfis de modelos brasileiras com fotos e vídeos
- [x] Adicionar vídeo de dança em cada perfil de modelo
- [x] Melhorar design do perfil (botão online, selo verificado, distância)
- [x] Botões de "Assinar Agora" e "Seguir" no perfil
- [x] Upload de foto de perfil e capa
- [x] Criar posts com fotos e vídeos
- [x] Corrigir layout de fotos no perfil (não cortar imagens)
- [x] Sistema de comentários e curtidas nos posts
- [x] Sistema de mensagens diretas
- [x] Chat com IA para conversão de assinantes
- [x] Notificação automática de mensagem da modelo
- [x] Corrigir erro de hooks no CreatorProfile (useAIChatNotification chamado condicionalmente)
- [x] Botão de perfil deve ir ao próprio perfil do usuário (não para explore)
- [x] Corrigir upload de foto de perfil
- [x] Corrigir upload de foto de capa

## Melhorias - Fase 4
- [x] Opção de visualizar perfil como visitante
- [x] Corrigir foto de perfil esticada no chat
- [x] Corrigir aba Explorar para mostrar vídeos (ou imagens se não houver)
- [x] Melhorar design do selo de verificado (gradiente animado)
- [x] Melhorar design do status online (elegante com animação)
- [x] Melhorar design do botão de assinar (premium com efeitos)
- [x] Atualizar fotos das modelos com imagens mais atraentes

## Melhorias - Fase 5
- [x] Aprimorar design do botão online (ultra premium com glow e animações)
- [x] Aprimorar design do selo de verificado (premium com sparkles e gradiente)
- [x] Aprimorar design do botão de assinar (ultra premium com shimmer e crown)
- [x] Corrigir layout de fotos nos posts (object-contain para não cortar)
- [x] Melhorar chat com IA com copy "safada" para conversão de assinantes

## Correções Finais - Fase 6
- [x] Redesign completo da página Explorar estilo TikTok (mobile-first)
- [x] Interações funcionais no Explorar (curtir, comentar, compartilhar, salvar)
- [x] Botão de assinar menor e mais elegante no perfil
- [x] Notificação de chat como ícone piscando com avatar
- [x] Corrigir redirecionamento do chat para conversar com a modelo
- [x] Otimização 100% mobile

## Bugs Críticos - Fase 7
- [x] Aba Explorar deve mostrar SOMENTE vídeos (não imagens)
- [x] Corrigir loop infinito de redirecionamento no chat
- [x] Permitir sair da aba de mensagens (botão Home adicionado)
- [x] Corrigir erro: button não pode conter button aninhado no AIChatNotification

## Chat com IA - Fase 8
- [x] Recriar sistema de chat com IA mais simples e funcional
- [x] Ícone de mensagem elegante (não popup grande)
- [x] Chat funcional com a modelo

## Respostas IA no Chat - Fase 9
- [x] Implementar respostas automáticas da IA quando usuário envia mensagem
- [x] IA responde com copy persuasiva para converter em assinante
- [x] Integrar com LLM para respostas contextuais
- [x] Corrigir erro "Failed to fetch" na página de mensagens (problema na lógica de busca de conversas para criadores que também são fãs)

## Melhorias Chat - Fase 10
- [x] Indicador de digitação - Mostrar "Carolina está digitando..." enquanto a IA processa a resposta
- [x] Histórico de mensagens paginado - Carregar mensagens antigas ao rolar para cima

## Correções e Melhorias - Fase 11
- [x] Corrigir upload de foto de capa (verificado - estava funcionando, problema era imagem de teste inválida)
- [x] Preparar lista de melhorias de design e UX (documento MELHORIAS_UX_DESIGN.md criado)

## Admin Master e Correções - Fase 12
- [x] Corrigir upload de foto de capa do perfil (verificado - está funcionando)
- [x] Criar painel admin master (/admin)
- [x] Dashboard admin com métricas gerais (total criadoras, assinantes, receita)
- [x] Listagem de todas as criadoras com filtros e busca
- [x] Edição rápida de perfis de criadoras
- [x] Criação rápida de novas criadoras
- [x] Listagem de todos os usuários
- [x] Visualização de transações e pagamentos
- [ ] Configurações gerais do aplicativo

## Melhorias Admin Master - Fase 13
- [x] Edição completa de perfis no admin (avatar, capa, preços)
- [x] Upload de avatar no formulário de edição
- [x] Upload de capa no formulário de edição
- [x] Edição de valor de assinatura
- [x] Dashboard admin mais completo com métricas
- [x] Métricas de crescimento (novos usuários, criadoras por período)
- [x] Taxa da plataforma e estatísticas detalhadas
- [x] Top criadoras por assinantes/receita

## Melhorias Admin - Fase 14
- [x] Criar posts pelo admin para qualquer criadora
- [x] Upload de mídia (fotos/vídeos) nos posts do admin
- [x] Seleção de tipo de post (free, subscription, ppv)
- [x] Ajuste de layout/posição da foto de capa
- [x] Controle de posição vertical da capa (slider 0-100%)
- [x] Preview em tempo real do ajuste de capa

## Melhorias Conteúdo e Admin - Fase 15
- [x] Analisar referência visual do Candy.ai
- [x] Adicionar gerenciamento de posts no Admin (listar, excluir posts de cada criadora)
- [ ] Melhorar player de vídeo estilo premium (TikTok/Reels)
- [ ] Corrigir Explorar para mostrar apenas vídeos (não imagens)
- [ ] Gerar fotos de perfil sensuais usando IA
- [ ] Limpar posts antigos desincronizados
- [ ] Criar novos perfis com conteúdo sincronizado

## Melhorias Finais - Fase 16
- [x] Player de vídeo premium com controles elegantes (pause/play, barra de progresso, volume, tempo)
- [x] Limpar posts desincronizados via painel Admin (pode ser feito manualmente na aba Posts)
- [x] Criar script de upload em massa para novos perfis (scripts/bulk-upload.mjs + README)

## Correção Som Perfil - Fase 18
- [x] Corrigir vídeo no perfil para começar com som habilitado (não mutado)

## Correção Som Perfil - Fase 18
- [x] Corrigir vídeo no perfil para começar com som habilitado (não mutado)

## Correções e Novas Modelos - Fase 19
- [x] Corrigir botão de mute no Explorar (adicionado useEffect para sincronizar estado)
- [x] Extrair e organizar conteúdo do arquivo zip (20 modelos extraídas)
- [ ] Adicionar novas modelos com nomes brasileiros (script preparado, aguardando execução)
- [ ] Sincronizar fotos de perfil, capa e posts de cada modelo

## Correção Mute e Modelos - Fase 20
- [x] Corrigir definitivamente o botão de mute no Explorar (sincronização externalMuted/onMuteChange)
- [x] Criar rota de API para upload e adição de modelos (admin.bulkCreateCreatorWithPost)
- [x] Adicionar TODAS as 16 modelos automaticamente ao banco de dados:
  - Com vídeo: Amélia Santos, Calista Ferreira, Diana Costa, Harriet Lima, Lexi Barbosa, Lina Pereira
  - Com foto: Grace Oliveira, Júlia Mendes, Kia Rodrigues, Lucy Almeida, Megan Ribeiro, Raven Martins, Sarah Carvalho, Skye Nascimento, Sophie Gomes, Tonya Freitas
- [x] Total: 19 criadoras no sistema

## Rebranding NudFans - Fase 21
- [x] Criar logo profissional do NudFans (estilo moderno e sensual)
- [x] Definir nova paleta de cores e identidade visual
- [x] Atualizar nome em todo o código (FanClub → NudFans)
- [x] Atualizar CSS/cores para nova identidade visual
- [x] Atualizar favicon e meta tags
- [x] Testar todas as páginas com novo branding
