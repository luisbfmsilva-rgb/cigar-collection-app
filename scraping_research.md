# Pesquisa de Web Scraping - Charutos.com

## Estrutura do Site Charutos.com

### Página Principal
- URL: https://www.charutos.com/
- Contém busca por letra (A-Z)
- Rankings por preço
- Últimas avaliações
- Notícias

### Estrutura de Dados Observada
1. **Charutos** têm os seguintes campos:
   - Nome/Marca
   - Vitola (Robusto, Corona, etc.)
   - Nota/Rating (0-10)
   - Número de avaliações
   - Preço (R$)
   - País de origem

2. **Avaliações** incluem:
   - Usuário que avaliou
   - Nota (0-10)
   - Data da avaliação
   - Texto da avaliação
   - Sabores/Aromas mencionados

### URLs de Acesso
- Charutos por letra: https://www.charutos.com/charutos/index.php?marca=LETRA
- Exemplo: https://www.charutos.com/charutos/index.php?marca=Cohiba

### Próximos Passos
1. Fazer scraping de todas as letras (A-Z)
2. Coletar dados de cada charuto
3. Armazenar em banco de dados
4. Integrar com Supabase
