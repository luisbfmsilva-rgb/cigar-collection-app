#!/usr/bin/env python3
"""
Web Scraping Script para Coletar Dados de Charutos
Coleta dados de: Charutos.com, Cigar Aficionado, Cigar Geeks
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CigarScraper:
    def __init__(self):
        self.cigars: List[Dict] = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_charutos_com(self) -> List[Dict]:
        """Scrape charutos from charutos.com"""
        logger.info("Iniciando scraping de Charutos.com...")
        cigars = []
        
        # Letras do alfabeto
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        
        for letter in letters:
            try:
                url = f"https://www.charutos.com/charutos/index.php?marca={letter}"
                logger.info(f"Scraping letra {letter}...")
                
                response = requests.get(url, headers=self.headers, timeout=10)
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Procurar por charutos na página
                # Estrutura típica: tabelas com charutos
                tables = soup.find_all('table')
                
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows[1:]:  # Skip header
                        cols = row.find_all('td')
                        if len(cols) >= 3:
                            try:
                                # Extrair dados
                                brand_name = cols[0].text.strip()
                                vitola = cols[1].text.strip() if len(cols) > 1 else ""
                                rating = cols[2].text.strip() if len(cols) > 2 else "0"
                                
                                # Limpar rating
                                try:
                                    rating_value = float(rating.replace(',', '.'))
                                except:
                                    rating_value = 0
                                
                                # Parse brand and name
                                parts = brand_name.split()
                                if len(parts) >= 2:
                                    brand = parts[0]
                                    name = ' '.join(parts[1:])
                                else:
                                    brand = brand_name
                                    name = ""
                                
                                cigar = {
                                    'brand': brand,
                                    'name': name,
                                    'vitola': vitola,
                                    'rating': rating_value,
                                    'source': 'charutos.com',
                                    'country': 'Unknown',  # Será preenchido manualmente se necessário
                                    'wrapper': '',
                                    'ringGauge': 0,
                                    'length': 0,
                                }
                                
                                cigars.append(cigar)
                                logger.info(f"✓ {brand} {name}")
                            except Exception as e:
                                logger.debug(f"Erro ao processar linha: {e}")
                                continue
                
                time.sleep(1)  # Respeitar rate limit
                
            except Exception as e:
                logger.error(f"Erro ao scraping letra {letter}: {e}")
                continue
        
        logger.info(f"Total de charutos coletados de Charutos.com: {len(cigars)}")
        return cigars
    
    def scrape_cigar_aficionado(self) -> List[Dict]:
        """Scrape charutos from Cigar Aficionado"""
        logger.info("Iniciando scraping de Cigar Aficionado...")
        cigars = []
        
        try:
            # Cigar Aficionado tem estrutura diferente
            # Vamos coletar dados da página de ratings
            url = "https://www.cigaraficionado.com/cigars"
            
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Procurar por charutos (estrutura pode variar)
            cigar_items = soup.find_all('div', class_=['cigar-item', 'product', 'cigar'])
            
            for item in cigar_items[:100]:  # Limitar a 100 para teste
                try:
                    # Tentar extrair informações
                    title = item.find(['h2', 'h3', 'a'])
                    if title:
                        text = title.text.strip()
                        parts = text.split()
                        if len(parts) >= 2:
                            brand = parts[0]
                            name = ' '.join(parts[1:])
                            
                            cigar = {
                                'brand': brand,
                                'name': name,
                                'vitola': '',
                                'rating': 0,
                                'source': 'cigar-aficionado',
                                'country': 'Unknown',
                                'wrapper': '',
                                'ringGauge': 0,
                                'length': 0,
                            }
                            cigars.append(cigar)
                except Exception as e:
                    logger.debug(f"Erro ao processar item: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Erro ao scraping Cigar Aficionado: {e}")
        
        logger.info(f"Total de charutos coletados de Cigar Aficionado: {len(cigars)}")
        return cigars
    
    def scrape_cigar_geeks(self) -> List[Dict]:
        """Scrape charutos from Cigar Geeks"""
        logger.info("Iniciando scraping de Cigar Geeks...")
        cigars = []
        
        try:
            url = "https://www.cigargeeks.com/cigar-database"
            
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Procurar por charutos no banco de dados
            cigar_entries = soup.find_all('tr', class_=['cigar-row', 'entry'])
            
            for entry in cigar_entries[:100]:  # Limitar a 100 para teste
                try:
                    cols = entry.find_all('td')
                    if len(cols) >= 2:
                        brand = cols[0].text.strip()
                        name = cols[1].text.strip() if len(cols) > 1 else ""
                        
                        cigar = {
                            'brand': brand,
                            'name': name,
                            'vitola': '',
                            'rating': 0,
                            'source': 'cigar-geeks',
                            'country': 'Unknown',
                            'wrapper': '',
                            'ringGauge': 0,
                            'length': 0,
                        }
                        cigars.append(cigar)
                except Exception as e:
                    logger.debug(f"Erro ao processar entrada: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Erro ao scraping Cigar Geeks: {e}")
        
        logger.info(f"Total de charutos coletados de Cigar Geeks: {len(cigars)}")
        return cigars
    
    def consolidate_and_deduplicate(self) -> List[Dict]:
        """Consolidar dados de múltiplas fontes e remover duplicatas"""
        logger.info("Consolidando e removendo duplicatas...")
        
        # Dicionário para rastrear charutos únicos
        unique_cigars = {}
        
        for cigar in self.cigars:
            # Criar chave única baseada em marca e nome
            key = f"{cigar['brand'].lower()}_{cigar['name'].lower()}"
            
            if key not in unique_cigars:
                unique_cigars[key] = cigar
            else:
                # Se já existe, mesclar informações
                existing = unique_cigars[key]
                if cigar['rating'] > existing['rating']:
                    existing['rating'] = cigar['rating']
                if not existing['vitola'] and cigar['vitola']:
                    existing['vitola'] = cigar['vitola']
                if not existing['country'] or existing['country'] == 'Unknown':
                    existing['country'] = cigar['country']
        
        consolidated = list(unique_cigars.values())
        logger.info(f"Total de charutos únicos após consolidação: {len(consolidated)}")
        return consolidated
    
    def save_to_json(self, filename: str = 'cigars_database.json'):
        """Salvar dados em JSON"""
        logger.info(f"Salvando dados em {filename}...")
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.cigars, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✓ Dados salvos em {filename}")
    
    def run(self):
        """Executar scraping completo"""
        logger.info("Iniciando scraping completo de charutos...")
        
        # Scrape de todas as fontes
        charutos_com = self.scrape_charutos_com()
        cigar_aficionado = self.scrape_cigar_aficionado()
        cigar_geeks = self.scrape_cigar_geeks()
        
        # Consolidar
        self.cigars = charutos_com + cigar_aficionado + cigar_geeks
        self.cigars = self.consolidate_and_deduplicate()
        
        # Salvar
        self.save_to_json()
        
        logger.info(f"✓ Scraping concluído! Total: {len(self.cigars)} charutos únicos")
        return self.cigars


if __name__ == '__main__':
    scraper = CigarScraper()
    cigars = scraper.run()
    
    # Mostrar alguns exemplos
    logger.info("\nExemplos de charutos coletados:")
    for cigar in cigars[:5]:
        logger.info(f"  - {cigar['brand']} {cigar['name']} ({cigar['source']})")
