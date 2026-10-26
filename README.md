# Long Ash

App de avaliação de charutos (diário, check-in, comunidade e umidor) para Android, iPhone e web.
Feito com Expo (React Native, SDK 58) e Supabase.

## O que está na versão 1 (fase 1)

- Verificação de idade 21+ na abertura e data de nascimento obrigatória no cadastro (o banco recusa menores de 21).
- Login com e-mail, Google, Facebook e Apple (o "Entrar com Apple" é exigido pela App Store quando há Google/Facebook).
- Catálogo com busca sem acento, filtros por país, leitura de código de barras e cadastro de charuto novo pela comunidade, com aprovação de moderador.
- Ficha do charuto: nota da comunidade, nota de quem você segue, média de 100 pontos, aromas mais citados, harmonizações mais comuns, reviews em vídeo de influenciadores e check-ins recentes.
- Check-in: nota de 0,25 a 5, notas, até 5 fotos (a primeira é a capa), tabacaria/lounge/evento ou "em casa", harmonização, música (busca na Apple Music ou link do Spotify/YouTube/Apple Music), visibilidade (todos, seguidores, só eu), postar num clube e tirar um charuto do umidor.
- Avaliação completa por terços: roda de aromas com 9 famílias e 44 notas, intensidade de 1 a 3, 100 pontos em 6 critérios, força, corpo e duração.
- Social: feed de quem você segue e global, brindar (curtir), comentar, compartilhar, salvar, seguir, bloquear e denunciar.
- Clubes públicos e privados: convite, pedido de entrada, moderadores, posts fixados, ranking do clube e charuto do mês.
- Influenciadores: pedido de perfil verificado, selo, vídeos e artigos no perfil e na ficha do charuto, etiqueta de parceria paga, bloqueio automático de links de loja e afiliados.
- Umidor: vários umidores, estoque, tempo de guarda, aviso de descanso, leituras manuais de umidade e temperatura (°C ou °F), faixa ideal e lista de desejos.
- Badges automáticos (primeiro check-in, 10, 50, 100, Orgulho Brasileiro, 5 países, maduro, crítico, lounges, sommelier).
- Tipos de conta (versão 1.1):
  - **Aficionado**: a conta padrão de todo mundo.
  - **Expert**: sugere correções no catálogo, que entram depois da aprovação de um moderador.
  - **Fabricante**: administra as próprias marcas. Corrige qualquer charuto dela na hora, publica artigos que aparecem em destaque no feed e cria badges para dar aos maiores fãs da marca.
  - O pedido para virar Expert ou Fabricante é feito no app (Configurações → Tipo de conta) e aprovado no painel de moderação. Lá o moderador também escolhe quais marcas o Fabricante vai administrar.
  - O selo de **influenciador verificado** continua separado e vale para qualquer tipo de conta.
- Página da marca: artigos, charutos, ranking de maiores fãs e badges da marca.
- Painel de moderação: aprovar charutos, correções do catálogo, pedidos de conta e influenciadores, e tratar denúncias.
- Inglês, português e espanhol.
- Exclusão de conta dentro do app (exigida pela Apple e pelo Google).

Fica para atualizações: higrômetros Wi-Fi, identificação da anilha por IA, eventos completos, assinatura Premium, anúncios, notificações push e login pelas tabacarias.

## Passo a passo para rodar

### 1. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/setup_all.sql` e clique em **Run**.
   (Quem usa a CLI pode rodar `supabase db push` com a pasta `supabase/migrations`.)
3. Em **Project Settings → API**, copie a **Project URL** e a **publishable key**.

### 2. Configurar o app

```bash
cp .env.example .env      # cole a URL e a chave do Supabase
npm install
npx expo start
```

Abra no celular com o app **Expo Go** (lendo o QR code) ou aperte `w` para abrir no navegador.

### 3. Logins sociais

No Supabase, em **Authentication → Sign In / Providers**:

- **Google** e **Facebook**: ative e cole o Client ID e o Secret de cada um.
- **Apple**: ative e configure o Services ID e a chave do Apple Developer.
- Em **Authentication → URL Configuration**, adicione `longash://auth-callback` nos Redirect URLs.

### 4. Atualizar um banco que já existe

Quem já rodou o `setup_all.sql` antes da versão 1.1 só precisa rodar, no SQL Editor, o arquivo `supabase/migrations/20261022000001_account_types.sql`.

### Reconhecimento de anilha (IA) e códigos de barras — versão 1.2

No SQL Editor, rode nesta ordem: `supabase/migrations/20261022000001_account_types.sql` (se ainda não rodou), `supabase/migrations/20261026000001_recognition.sql` e `supabase/barcode_catalog_utl_ca.sql` (códigos de barras de referência).

A leitura da anilha usa a função `supabase/functions/identify-band`:

```
supabase login
supabase link --project-ref <ref do projeto>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy identify-band
```

Limite padrão: 40 leituras por usuário a cada 24 h (`BAND_DAILY_LIMIT`). Cada foto confirmada pelo usuário fica no bucket privado `band-photos` e em `band_scans`, formando a base de treino.

### 5. Virar administrador

Depois de criar sua conta no app, rode no SQL Editor:

```sql
update public.profiles set is_admin = true where username = 'seu_usuario';
```

A opção **Moderação** aparece em Configurações.

### 6. Publicar nas lojas

Com uma conta [Expo](https://expo.dev), use o EAS (os builds rodam na nuvem, sem precisar de Mac):

```bash
npx eas-cli@latest build --platform android --profile preview   # APK para testar
npx eas-cli@latest build --platform all --profile production    # versões das lojas
npx eas-cli@latest submit
```

Antes de enviar, troque o identificador `app.longash` em `app.json` se quiser outro, publique os Termos de Uso e a Política de Privacidade (os links estão no `.env`) e crie os ícones definitivos em `assets/images`.

## Estrutura

```
src/app/            telas (cada arquivo é uma rota do Expo Router)
  (tabs)/           Feed, Explorar, Check-in, Umidor, Perfil
  checkin/          novo check-in, local, música, harmonização, avaliação completa, detalhe
  cigar/  clubs/  humidor/  creator/  profile/  user/
src/components/     componentes visuais (cards, roda de aromas, botões…)
src/lib/            acesso ao Supabase (api.ts), login, tema, formatação
src/i18n/           textos em inglês, português e espanhol
supabase/           migrações SQL e setup_all.sql
```

## Checagens

```bash
npx tsc --noEmit     # tipos
npx eslint src       # lint
```
