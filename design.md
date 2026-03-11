# Design do Aplicativo - Cigar Collection Manager

## Visão Geral

O Cigar Collection Manager é um aplicativo móvel para colecionadores de charutos gerenciarem suas coleções, registrarem compras e criarem reviews detalhados. O design segue as diretrizes de interface do iOS com foco em usabilidade em uma mão e navegação intuitiva.

## Orientação e Dimensões

- **Orientação:** Portrait (9:16)
- **Uso:** Uma mão (botões e elementos interativos no terço inferior da tela)
- **Plataforma:** iOS (HIG) com suporte a Android

## Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| **Primary** | #8B4513 (Marrom Charuto) | Botões primários, destaques, ícones ativos |
| **Secondary** | #D2B48C (Tan) | Elementos secundários, backgrounds suaves |
| **Background** | #FFFFFF (Light) / #151718 (Dark) | Fundo principal |
| **Surface** | #F5F5F5 (Light) / #1E2022 (Dark) | Cards, superfícies elevadas |
| **Foreground** | #11181C (Light) / #ECEDEE (Dark) | Texto principal |
| **Muted** | #687076 (Light) / #9BA1A6 (Dark) | Texto secundário |
| **Success** | #22C55E | Estados de sucesso |
| **Warning** | #F59E0B | Estados de alerta |
| **Error** | #EF4444 | Estados de erro |

## Telas Principais

### 1. Home / Dashboard
**Objetivo:** Visão geral da coleção do usuário.

**Conteúdo:**
- Cabeçalho: Saudação personalizada ("Bem-vindo, [Nome]")
- Cards de resumo:
  - Total de charutos na coleção
  - Total de umidores
  - Charutos fumados (este mês)
  - Reviews pendentes
- Lista de charutos recentes adicionados
- Botão flutuante para adicionar novo charuto
- Seção "Últimos Reviews" com resumo visual

**Funcionalidade:**
- Tap em card de resumo → filtra lista
- Tap em charuto recente → detalhes
- Tap em review → visualiza review completo

### 2. Umidores (Humidors)
**Objetivo:** Gerenciar locais de armazenamento de charutos.

**Conteúdo:**
- Lista de umidores com:
  - Nome do umidor
  - Quantidade de charutos
  - Capacidade (ex: 50/100)
  - Barra de progresso visual
  - Ícone de umidade (se disponível)
- Botão "Adicionar Umidor" (bottom sheet)
- Tap em umidor → detalhes e charutos contidos

**Formulário de Novo Umidor:**
- Campo: Nome do umidor (ex: "Umidor da Sala")
- Campo: Capacidade (número)
- Campo: Tipo (Caixa, Umidor, Gaveta, etc.)
- Botões: Cancelar / Salvar

### 3. Inventário (My Cigars)
**Objetivo:** Visualizar e gerenciar charutos pessoais.

**Conteúdo:**
- Barra de busca e filtros:
  - Por marca
  - Por país
  - Por umidor
  - Por vitola
- Lista de charutos com:
  - Foto (thumbnail)
  - Nome e marca
  - Vitola
  - Quantidade em estoque
  - Nota média (se houver reviews)
- Tap em charuto → detalhes e opções

**Detalhes do Charuto:**
- Foto do charuto
- Informações: Marca, Linha, País, Vitola, Dimensões
- Umidor onde está armazenado
- Data de compra, valor pago
- Botões: Fumar (iniciar review), Editar, Deletar

**Formulário de Novo Charuto:**
- Campo: Marca
- Campo: Nome/Linha
- Campo: Vitola
- Campo: Ring Gauge x Comprimento
- Campo: País de origem
- Campo: Capa (Wrapper)
- Campo: Data de compra
- Campo: Valor pago
- Campo: Umidor (seletor)
- Campo: Foto (câmera ou galeria)
- Botões: Cancelar / Salvar

### 4. Degustação / Review (Tasting Notes)
**Objetivo:** Criar reviews detalhados com critérios do Pandora's Cigar Box.

**Fluxo:**
1. Usuário seleciona "Fumar" em um charuto
2. Abre tela de review com formulário estruturado

**Seções do Formulário:**

#### Seção 1: Informações Básicas
- Data da degustação (datepicker)
- Foto do charuto (câmera)
- Tempo de fumaça (campo numérico)

#### Seção 2: Critérios de Avaliação (5 Estrelas cada)
Cada critério exibe:
- Nome do critério
- Descrições de cada nível (1-5 estrelas)
- Seletor visual de estrelas (tap para selecionar)

**Critérios:**
1. **Pré-Acendimento (Pre-Light)** - Aparência, construção, cold draw
2. **Fumaça (Smoke)** - Qualidade, textura, aroma
3. **Sabor (Flavour)** - Paladar, evolução, complexidade
4. **Queima (Burn)** - Uniformidade, cinza
5. **Prazer/Aproveitamento (Enjoyment)** - Impressão geral

#### Seção 3: Sabores Identificados
- Multi-seletor de tags:
  - Couro, Café, Especiarias, Madeira, Terra, Floral, Frutado, Chocolate, Tabaco, Fumaça, Pimenta, Mel, Noz, Baunilha, Alcatrão, Cedro, Anis, Caramelo, Manteiga, Cravo, Gengibre, Hortelã, Alcatrão, Amêndoa, Canela
- Campo livre para adicionar sabores customizados

#### Seção 4: Intensidade Geral
- Seletor: Suave / Médio / Forte

#### Seção 5: Comentários
- Campo de texto livre para notas adicionais

#### Seção 6: Resumo e Pontuação
- Exibição automática da nota final (0-100) calculada a partir das 5 categorias
- Botões: Cancelar / Salvar Review

### 5. Reviews (Meus Reviews)
**Objetivo:** Visualizar histórico de reviews criados.

**Conteúdo:**
- Lista de reviews ordenados por data (mais recentes primeiro)
- Card de review com:
  - Foto do charuto
  - Nome do charuto
  - Data da degustação
  - Nota final (0-100)
  - Sabores principais (primeiras 3 tags)
- Tap em review → detalhes completos

**Detalhes do Review:**
- Todas as informações do review
- Gráfico visual das 5 categorias (radar ou barras)
- Comentários completos
- Botões: Editar, Deletar, Compartilhar

### 6. Explorar (Explore)
**Objetivo:** Buscar e descobrir charutos na base de dados global.

**Conteúdo:**
- Barra de busca (por marca, nome, vitola)
- Filtros:
  - País de origem
  - Vitola
  - Faixa de preço
  - Nota média (de fontes externas)
- Lista de charutos com:
  - Foto
  - Nome e marca
  - Vitola
  - País
  - Nota média (Cigar Aficionado, Cigar Geeks, etc.)
- Tap em charuto → detalhes e botão "Adicionar à Coleção"

## Fluxos Principais

### Fluxo 1: Adicionar Novo Charuto
1. Home → Botão flutuante "+"
2. Seleciona "Novo Charuto"
3. Preenche formulário (marca, vitola, etc.)
4. Seleciona foto
5. Seleciona umidor
6. Salva → Volta para Home com notificação de sucesso

### Fluxo 2: Criar Review
1. Inventário → Seleciona charuto
2. Tap em "Fumar"
3. Preenche critérios de avaliação (5 seções)
4. Adiciona foto
5. Seleciona sabores
6. Salva → Nota final calculada automaticamente
7. Volta para Reviews com novo review listado

### Fluxo 3: Gerenciar Umidores
1. Umidores → Tap em umidor
2. Visualiza charutos contidos
3. Pode adicionar/remover charutos
4. Pode editar informações do umidor

## Componentes Reutilizáveis

- **StarRating:** Componente de seleção de 5 estrelas com descrições
- **TagSelector:** Multi-seletor de tags com busca
- **PhotoPicker:** Câmera ou galeria
- **Card:** Container com sombra e borda
- **Button:** Primário, secundário, outline
- **Input:** TextField com validação
- **BottomSheet:** Modal inferior para formulários

## Acessibilidade

- Contraste de cores WCAG AA
- Textos descritivos em todos os ícones
- Tamanho mínimo de toque: 44x44pt
- Suporte a Dark Mode nativo

## Animações (Subtis)

- Transição entre abas: Fade (200ms)
- Tap em botão: Scale 0.97 (80ms)
- Carregamento: Spinner suave
- Sucesso: Checkmark com haptic feedback

## Próximas Fases

1. Implementar navegação com tab bar
2. Criar telas de umidores e inventário
3. Implementar sistema de review com critérios
4. Integrar banco de dados local (AsyncStorage)
5. Adicionar base de dados de charutos
