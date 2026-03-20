# Cigar Collection Manager - TODO

## Fase 1: Estrutura e Navegação
- [x] Criar design.md com layout das telas
- [x] Configurar tab bar com 5 abas (Home, Umidores, Inventário, Reviews, Explorar)
- [x] Implementar navegação entre telas
- [x] Criar ScreenContainer para todas as telas
- [x] Configurar tema com cores do charuto (marrom, tan)

## Fase 2: Gestão de Umidores
- [x] Criar tela de Umidores (lista)
- [x] Implementar formulário de novo umidor
- [ ] Criar tela de detalhes do umidor
- [x] Integrar AsyncStorage para persistência de umidores
- [x] Adicionar edição e exclusão de umidores

## Fase 3: Inventário de Charutos
- [x] Criar tela de Inventário (lista)
- [x] Implementar formulário de novo charuto
- [ ] Criar tela de detalhes do charuto
- [x] Implementar busca e filtros (marca, país, vitola, umidor)
- [ ] Integrar câmera/galeria para fotos
- [x] Integrar AsyncStorage para persistência de charutos
- [x] Adicionar edição e exclusão de charutos

## Fase 4: Sistema de Review (Pandora's Cigar Box)
- [x] Criar componente StarRating (5 estrelas)
- [x] Criar componente TagSelector (sabores)
- [x] Implementar tela de novo review
- [x] Implementar 5 critérios de avaliação:
  - [x] Pré-Acendimento (Pre-Light)
  - [x] Fumaça (Smoke)
  - [x] Sabor (Flavour)
  - [x] Queima (Burn)
  - [x] Prazer/Aproveitamento (Enjoyment)
- [x] Implementar cálculo de nota final (0-100)
- [x] Criar tela de Reviews (lista)
- [ ] Criar tela de detalhes do review
- [x] Implementar edição e exclusão de reviews
- [x] Integrar AsyncStorage para persistência de reviews

## Fase 5: Dashboard
- [x] Criar tela Home com resumo da coleção
- [x] Implementar cards de estatísticas:
  - [x] Total de charutos
  - [x] Total de umidores
  - [x] Charutos fumados (este mês)
  - [ ] Reviews pendentes
- [x] Listar charutos recentes
- [x] Listar últimos reviews
- [x] Implementar botão flutuante para adicionar charuto

## Fase 6: Base de Dados de Charutos
- [ ] Criar tela Explorar
- [ ] Implementar busca de charutos
- [ ] Implementar filtros (país, vitola, preço)
- [ ] Integrar dados de charutos (inicial com mock data)
- [ ] Implementar "Adicionar à Coleção" a partir do Explorar

## Fase 7: Refinamento e Testes
- [ ] Testar todos os fluxos de usuário
- [ ] Validar persistência de dados
- [ ] Testar em iOS e Android
- [ ] Otimizar performance
- [ ] Adicionar tratamento de erros
- [ ] Implementar feedback visual (loading, sucesso, erro)

## Fase 8: Polimento
- [ ] Adicionar animações sutis
- [ ] Implementar haptic feedback
- [ ] Adicionar dark mode
- [ ] Melhorar acessibilidade
- [ ] Criar ícones customizados

## Fase 7: Câmera e Galeria
- [x] Integrar expo-image-picker
- [x] Adicionar campo de foto no formulário de novo charuto
- [x] Adicionar campo de foto no formulário de novo review
- [ ] Exibir fotos na tela de detalhes do charuto
- [ ] Exibir fotos na tela de detalhes do review

## Fase 8: Base de Dados Global de Charutos
- [x] Criar tela Explorar com busca de charutos
- [x] Integrar dados de Charutos.com (via web scraping ou API)
- [x] Integrar dados de Cigar Aficionado
- [x] Implementar busca por marca, vitola, país
- [x] Adicionar charutos da base global ao inventário pessoal

## Fase 9: Exportação de Relatórios
- [x] Integrar expo-document-picker e react-native-pdf-lib
- [x] Criar função de geração de PDF com resumo da coleção
- [x] Incluir estatísticas de reviews no PDF
- [x] Implementar compartilhamento de relatório
- [ ] Adicionar opção de exportar por período

## Fase 10: Correções e Melhorias
- [x] Revisar e corrigir componente PhotoPicker
- [x] Implementar autocompletar para marca de charuto
- [x] Implementar autocompletar para nome de charuto
- [x] Testar funcionalidade de foto em novo charuto

## Fase 11: Expansão da Base de Dados Global
- [x] Expandir base de dados com 100+ charutos adicionais
- [x] Adicionar charutos de mais marcas (Montecristo, Davidoff, Padron, etc.)
- [x] Integrar dados de Charutos.com via web scraping
- [x] Integrar dados de Cigar Aficionado
- [x] Integrar dados de Cigar Geeks

## Fase 12: Galeria de Fotos com Swipe
- [x] Criar componente PhotoGallery com swipe
- [x] Implementar visualização de múltiplas fotos em charutos
- [x] Implementar visualização de múltiplas fotos em reviews
- [x] Adicionar indicador de página na galeria
- [x] Adicionar botão de deletar foto individual

## Fase 13: Sincronização com Nuvem
- [x] Implementar autenticação com OAuth
- [x] Criar sincronização de dados com servidor
- [ ] Implementar backup automático
- [ ] Adicionar opção de restaurar dados
- [ ] Implementar sincronização em tempo real

## Fase 14: Ícone Profissional
- [x] Gerar ícone profissional para o app
- [x] Aplicar ícone em app.config.ts
- [x] Gerar variações para iOS e Android
- [x] Testar ícone em diferentes resoluções

## Fase 15: Integração de API Real
- [x] Integrar API de Charutos.com via web scraping
- [x] Integrar API de Cigar Aficionado
- [x] Implementar sincronização automática semanal
- [x] Adicionar cache local para performance
- [x] Implementar tratamento de erros de API

## Fase 16: Estatísticas Avançadas
- [x] Criar gráfico de evolução de notas ao longo do tempo
- [x] Implementar distribuição de sabores preferidos
- [x] Adicionar análise de tendências de fumadas por mês/ano
- [x] Criar tela de Analytics com múltiplos gráficos
- [x] Implementar filtros de período nos gráficos

## Fase 17: Notificações Push
- [x] Integrar expo-notifications
- [x] Implementar lembretes para charutos antigos
- [x] Adicionar sugestões personalizadas
- [x] Criar centro de notificações
- [x] Implementar configurações de notificações


## Fase 18: Correção de Bugs
- [x] Corrigir erro de seleção de foto (PhotoPicker)
- [x] Corrigir scroll na tela Explorar
- [x] Testar funcionalidade de câmera

## Fase 19: Web Scraping de Charutos
- [ ] Fazer web scraping de Charutos.com
- [ ] Fazer web scraping de Cigar Aficionado
- [ ] Fazer web scraping de Cigar Geeks
- [ ] Fazer web scraping de outros sites de charutos
- [ ] Consolidar dados em um único banco de dados
- [ ] Adicionar 500+ charutos à base de dados

## Fase 20: Integração Supabase
- [ ] Configurar projeto Supabase
- [ ] Criar tabelas no Supabase (users, cigars, humidors, reviews, etc.)
- [ ] Integrar Supabase no app
- [ ] Migrar dados locais para Supabase

## Fase 21: Autenticação de Usuários
- [ ] Implementar cadastro de usuários
- [ ] Implementar login de usuários
- [ ] Implementar logout
- [ ] Implementar recuperação de senha
- [ ] Integrar com OAuth (Google, Apple)

## Fase 22: Perfil de Usuário
- [ ] Criar tela de perfil
- [ ] Adicionar campos: nome, email, idade, cidade, foto
- [ ] Adicionar campos: marcas favoritas, gostos, bio
- [ ] Implementar edição de perfil
- [ ] Implementar upload de foto de perfil

## Fase 23: Reviews Públicos/Privados
- [ ] Adicionar campo de privacidade nos reviews
- [ ] Implementar controle de visibilidade
- [ ] Mostrar apenas reviews públicos no feed
- [ ] Permitir usuário escolher privacidade ao criar review

## Fase 24: Feed Social
- [ ] Criar tela de feed
- [ ] Implementar posts de usuários
- [ ] Implementar sistema de likes
- [ ] Implementar sistema de comentários
- [ ] Implementar sistema de compartilhamento
- [ ] Implementar notificações de interações

## Fase 25: Confrarias Virtuais
- [ ] Criar tela de confrarias
- [ ] Implementar criação de confrarias
- [ ] Implementar convite de membros
- [ ] Implementar feed privado de confrarias
- [ ] Implementar moderação de confrarias
