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
