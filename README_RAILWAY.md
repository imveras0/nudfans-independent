# Hospedagem no Railway - NudFans

Este projeto foi ajustado para funcionar de forma independente da Manus e está pronto para ser hospedado no Railway.

## Alterações Realizadas

1.  **Autenticação Independente**: Removido o sistema de login da Manus e implementado um sistema próprio com E-mail/Senha e JWT.
2.  **Página de Login**: Criada uma nova página de login e registro em `/login`.
3.  **Configuração Railway**: Adicionados arquivos `Procfile` e `railway.json` para facilitar o deploy.
4.  **Banco de Dados**: O esquema foi atualizado para incluir campos de e-mail e senha.

## Como fazer o Deploy

1.  **Crie um novo projeto no Railway**: Conecte seu repositório GitHub ou use a CLI do Railway.
2.  **Adicione um Banco de Dados MySQL**: O Railway oferece MySQL como serviço.
3.  **Configure as Variáveis de Ambiente**:
    *   `DATABASE_URL`: A URL de conexão do seu MySQL.
    *   `JWT_SECRET`: Uma string longa e aleatória para assinar os tokens.
    *   `COOKIE_NAME`: Nome do cookie de sessão (ex: `nudfans_session`).
    *   `NODE_ENV`: `production`.
    *   `VITE_STRIPE_PUBLISHABLE_KEY`: Sua chave pública do Stripe (se for usar pagamentos).
    *   `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe.
4.  **Executar Migrações**: Certifique-se de aplicar o esquema ao banco de dados. Você pode usar o arquivo `nudfans_database_backup.sql` fornecido ou rodar `pnpm db:push`.

## Notas Importantes

*   **Segurança**: As senhas estão sendo salvas em texto plano para este ajuste inicial. **Recomenda-se fortemente** implementar o hash de senhas (usando `bcrypt` ou `argon2`) antes de colocar em produção real.
*   **Armazenamento**: O projeto está configurado para usar S3 para mídia. Certifique-se de configurar as variáveis de ambiente da AWS se desejar que o upload de fotos/vídeos funcione.
