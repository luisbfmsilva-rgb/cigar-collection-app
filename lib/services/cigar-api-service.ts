/**
 * Serviço para integração com APIs de charutos
 * Suporta Charutos.com, Cigar Aficionado e outras fontes
 */

import { GlobalCigar } from "@/lib/context/data-context";

interface CigarAPIResponse {
  cigars: GlobalCigar[];
  lastUpdated: string;
  source: string;
}

class CigarAPIService {
  private baseURL = "https://api.charutos.com";
  private cigarAficionadoURL = "https://www.cigaraficionado.com";
  private cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

  /**
   * Buscar charutos da API de Charutos.com
   */
  async fetchFromCharutosCom(brand?: string): Promise<GlobalCigar[]> {
    try {
      // Simular chamada à API (em produção, seria uma chamada real)
      const cigars: GlobalCigar[] = [
        {
          id: "api-cohiba-robusto",
          brand: "Cohiba",
          name: "Robusto",
          vitola: "Robusto",
          ringGauge: 50,
          length: 124,
          country: "Cuba",
          wrapper: "Habano",
          source: "charutos.com",
          sourceUrl: "https://www.charutos.com/cohiba-robusto",
          averageRating: 92,
          reviewCount: 1250,
        },
        // Adicionar mais charutos conforme necessário
      ];

      if (brand) {
        return cigars.filter((c) =>
          c.brand.toLowerCase().includes(brand.toLowerCase())
        );
      }

      return cigars;
    } catch (error) {
      console.error("Erro ao buscar charutos de Charutos.com:", error);
      return [];
    }
  }

  /**
   * Buscar charutos da API de Cigar Aficionado
   */
  async fetchFromCigarAficionado(brand?: string): Promise<GlobalCigar[]> {
    try {
      // Simular chamada à API (em produção, seria uma chamada real)
      const cigars: GlobalCigar[] = [
        {
          id: "api-davidoff-millennium",
          brand: "Davidoff",
          name: "Millennium Robusto",
          vitola: "Robusto",
          ringGauge: 50,
          length: 124,
          country: "República Dominicana",
          wrapper: "Olor",
          source: "cigar-aficionado",
          sourceUrl: "https://www.cigaraficionado.com/davidoff-millennium",
          averageRating: 88,
          reviewCount: 890,
        },
        // Adicionar mais charutos conforme necessário
      ];

      if (brand) {
        return cigars.filter((c) =>
          c.brand.toLowerCase().includes(brand.toLowerCase())
        );
      }

      return cigars;
    } catch (error) {
      console.error("Erro ao buscar charutos de Cigar Aficionado:", error);
      return [];
    }
  }

  /**
   * Sincronizar base de dados global com APIs
   */
  async syncGlobalDatabase(): Promise<GlobalCigar[]> {
    try {
      const [charutosComCigars, cigarAficionadoCigars] = await Promise.all([
        this.fetchFromCharutosCom(),
        this.fetchFromCigarAficionado(),
      ]);

      const allCigars = [...charutosComCigars, ...cigarAficionadoCigars];

      // Remover duplicatas
      const uniqueCigars = Array.from(
        new Map(allCigars.map((c) => [c.id, c])).values()
      );

      // Salvar timestamp de sincronização
      const syncData = {
        cigars: uniqueCigars,
        lastUpdated: new Date().toISOString(),
      };

      // Aqui você salvaria em AsyncStorage
      // await AsyncStorage.setItem('global_cigars_sync', JSON.stringify(syncData));

      return uniqueCigars;
    } catch (error) {
      console.error("Erro ao sincronizar base de dados global:", error);
      return [];
    }
  }

  /**
   * Verificar se cache está expirado
   */
  async isCacheExpired(): Promise<boolean> {
    try {
      // Aqui você verificaria AsyncStorage
      // const syncData = await AsyncStorage.getItem('global_cigars_sync');
      // if (!syncData) return true;
      // const { lastUpdated } = JSON.parse(syncData);
      // return Date.now() - new Date(lastUpdated).getTime() > this.cacheExpiry;

      return true; // Simular cache expirado
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      return true;
    }
  }

  /**
   * Buscar charutos com cache
   */
  async fetchCigarsWithCache(brand?: string): Promise<GlobalCigar[]> {
    const isExpired = await this.isCacheExpired();

    if (isExpired) {
      return this.syncGlobalDatabase();
    }

    // Retornar do cache
    // const syncData = await AsyncStorage.getItem('global_cigars_sync');
    // if (syncData) {
    //   const { cigars } = JSON.parse(syncData);
    //   if (brand) {
    //     return cigars.filter((c: GlobalCigar) =>
    //       c.brand.toLowerCase().includes(brand.toLowerCase())
    //     );
    //   }
    //   return cigars;
    // }

    return [];
  }
}

export const cigarAPIService = new CigarAPIService();
