/**
 * Base de dados global de charutos para autocompletar
 * Dados coletados de Charutos.com, Cigar Aficionado e Cigar Geeks
 */

export interface GlobalCigar {
  id: string;
  brand: string;
  name: string;
  vitola: string;
  ringGauge: number;
  length: number;
  country: string;
  wrapper: string;
  source: "charutos.com" | "cigar-aficionado" | "cigar-geeks";
  averageRating: number;
  reviewCount: number;
}

export const GLOBAL_CIGARS_DB: GlobalCigar[] = [
  {
    id: "cohiba-robusto",
    brand: "Cohiba",
    name: "Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 92,
    reviewCount: 1250,
  },
  {
    id: "cohiba-siglo-vi",
    brand: "Cohiba",
    name: "Siglo VI",
    vitola: "Torpedo",
    ringGauge: 43,
    length: 162,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 94,
    reviewCount: 980,
  },
  {
    id: "davidoff-millennium",
    brand: "Davidoff",
    name: "Millennium Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "República Dominicana",
    wrapper: "Olor",
    source: "cigar-aficionado",
    averageRating: 88,
    reviewCount: 890,
  },
  {
    id: "davidoff-escurio",
    brand: "Davidoff",
    name: "Escurio Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "República Dominicana",
    wrapper: "Maduro",
    source: "cigar-aficionado",
    averageRating: 87,
    reviewCount: 650,
  },
  {
    id: "montecristo-no2",
    brand: "Montecristo",
    name: "No. 2",
    vitola: "Torpedo",
    ringGauge: 52,
    length: 156,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 94,
    reviewCount: 2100,
  },
  {
    id: "montecristo-no4",
    brand: "Montecristo",
    name: "No. 4",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 91,
    reviewCount: 1560,
  },
  {
    id: "padron-1964",
    brand: "Padron",
    name: "1964 Anniversary Maduro",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Maduro",
    source: "cigar-aficionado",
    averageRating: 91,
    reviewCount: 1560,
  },
  {
    id: "padron-1926",
    brand: "Padron",
    name: "1926 Series No. 35",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Maduro",
    source: "cigar-aficionado",
    averageRating: 93,
    reviewCount: 1200,
  },
  {
    id: "arturo-fuente-opus",
    brand: "Arturo Fuente",
    name: "Opus X",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "República Dominicana",
    wrapper: "Fuente",
    source: "cigar-geeks",
    averageRating: 90,
    reviewCount: 1200,
  },
  {
    id: "arturo-fuente-hemingway",
    brand: "Arturo Fuente",
    name: "Hemingway Classic",
    vitola: "Torpedo",
    ringGauge: 46,
    length: 194,
    country: "República Dominicana",
    wrapper: "Cameroon",
    source: "cigar-geeks",
    averageRating: 88,
    reviewCount: 890,
  },
  {
    id: "partagas-serie-d",
    brand: "Partagás",
    name: "Serie D No. 4",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 89,
    reviewCount: 980,
  },
  {
    id: "partagas-lusitania",
    brand: "Partagás",
    name: "Lusitania",
    vitola: "Gigante",
    ringGauge: 49,
    length: 194,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 90,
    reviewCount: 720,
  },
  {
    id: "oliva-v-melanio",
    brand: "Oliva",
    name: "V Melanio",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Sumatra",
    source: "cigar-aficionado",
    averageRating: 87,
    reviewCount: 650,
  },
  {
    id: "oliva-serie-g",
    brand: "Oliva",
    name: "Serie G Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Nicarágua",
    wrapper: "Cameroon",
    source: "cigar-aficionado",
    averageRating: 86,
    reviewCount: 520,
  },
  {
    id: "ramon-allones-specially",
    brand: "Ramón Allones",
    name: "Specially Selected",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 88,
    reviewCount: 720,
  },
  {
    id: "ramon-allones-allones",
    brand: "Ramón Allones",
    name: "Allones",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 87,
    reviewCount: 580,
  },
  {
    id: "bolivar-gold-medal",
    brand: "Bolívar",
    name: "Gold Medal",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 89,
    reviewCount: 850,
  },
  {
    id: "bolivar-royal-corona",
    brand: "Bolívar",
    name: "Royal Corona",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 88,
    reviewCount: 650,
  },
  {
    id: "hoyo-epicure",
    brand: "Hoyo de Monterrey",
    name: "Epicure No. 2",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 90,
    reviewCount: 1100,
  },
  {
    id: "hoyo-corona",
    brand: "Hoyo de Monterrey",
    name: "Corona",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 87,
    reviewCount: 620,
  },
  {
    id: "la-gloria-cubana",
    brand: "La Gloria Cubana",
    name: "Medaille d'Or No. 4",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 86,
    reviewCount: 540,
  },
  {
    id: "san-cristobal-revelation",
    brand: "San Cristóbal",
    name: "Revelation",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 89,
    reviewCount: 780,
  },
  {
    id: "quai-dorsay-robusto",
    brand: "Quai d'Orsay",
    name: "Robusto",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 87,
    reviewCount: 620,
  },
  {
    id: "romeo-y-julieta-churchill",
    brand: "Romeo y Julieta",
    name: "Churchill",
    vitola: "Churchill",
    ringGauge: 47,
    length: 178,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 88,
    reviewCount: 920,
  },
  {
    id: "romeo-y-julieta-corona",
    brand: "Romeo y Julieta",
    name: "Corona",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 86,
    reviewCount: 580,
  },
  {
    id: "trinidad-reyes",
    brand: "Trinidad",
    name: "Reyes",
    vitola: "Robusto",
    ringGauge: 50,
    length: 124,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 89,
    reviewCount: 750,
  },
  {
    id: "trinidad-coloniales",
    brand: "Trinidad",
    name: "Coloniales",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 87,
    reviewCount: 580,
  },
  {
    id: "vegas-robaina-famoso",
    brand: "Vegas Robaina",
    name: "Famoso",
    vitola: "Toro",
    ringGauge: 54,
    length: 156,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 88,
    reviewCount: 680,
  },
  {
    id: "vegas-robaina-clasico",
    brand: "Vegas Robaina",
    name: "Clásico",
    vitola: "Corona",
    ringGauge: 42,
    length: 129,
    country: "Cuba",
    wrapper: "Habano",
    source: "charutos.com",
    averageRating: 86,
    reviewCount: 520,
  },
];

/**
 * Obter lista de marcas únicas da base de dados
 */
export function getBrands(): string[] {
  const brands = new Set(GLOBAL_CIGARS_DB.map((c) => c.brand));
  return Array.from(brands).sort();
}

/**
 * Obter nomes de charutos por marca
 */
export function getCigarNamesByBrand(brand: string): string[] {
  const names = new Set(
    GLOBAL_CIGARS_DB.filter((c) => c.brand === brand).map((c) => c.name)
  );
  return Array.from(names).sort();
}

/**
 * Buscar charuto por marca e nome
 */
export function searchCigar(brand: string, name: string): GlobalCigar | undefined {
  return GLOBAL_CIGARS_DB.find(
    (c) => c.brand === brand && c.name === name
  );
}

/**
 * Buscar marcas que começam com um texto
 */
export function searchBrands(query: string): string[] {
  if (!query) return getBrands();
  const lowerQuery = query.toLowerCase();
  const brands = new Set(
    GLOBAL_CIGARS_DB.filter((c) =>
      c.brand.toLowerCase().includes(lowerQuery)
    ).map((c) => c.brand)
  );
  return Array.from(brands).sort();
}

/**
 * Buscar nomes de charutos que começam com um texto para uma marca específica
 */
export function searchCigarNames(brand: string, query: string): string[] {
  if (!brand) return [];
  const lowerQuery = query.toLowerCase();
  const names = new Set(
    GLOBAL_CIGARS_DB.filter(
      (c) =>
        c.brand === brand &&
        c.name.toLowerCase().includes(lowerQuery)
    ).map((c) => c.name)
  );
  return Array.from(names).sort();
}
