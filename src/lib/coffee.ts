import type { Locale } from '@/i18n';

type L = { en: string; pt: string; es: string };
export type CoffeeOption = { code: string; label: L };
const o = (code: string, en: string, pt: string, es = en): CoffeeOption => ({ code, label: { en, pt, es } });

/** Coffee pairing choices: pick instead of typing. The last-picked values end up in the pairing name. */
export const COFFEE = {
  drink: [
    o('espresso', 'Espresso', 'Espresso'), o('ristretto', 'Ristretto', 'Ristretto'), o('lungo', 'Lungo', 'Lungo'),
    o('doppio', 'Doppio', 'Doppio'), o('americano', 'Americano', 'Americano'), o('macchiato', 'Macchiato', 'Macchiato'),
    o('cortado', 'Cortado', 'Cortado'), o('flat_white', 'Flat white', 'Flat white'), o('cappuccino', 'Cappuccino', 'Cappuccino'),
    o('latte', 'Latte', 'Latte'), o('mocha', 'Mocha', 'Mocha'), o('affogato', 'Affogato', 'Affogato'),
    o('white_coffee', 'Coffee with milk', 'Café com leite', 'Café con leche'), o('irish', 'Irish coffee', 'Irish coffee'),
    o('filter', 'Filter coffee', 'Café coado', 'Café filtrado'), o('cafezinho', 'Cafezinho', 'Cafezinho'),
    o('cold_brew', 'Cold brew', 'Cold brew'), o('nitro', 'Nitro cold brew', 'Nitro cold brew'),
    o('iced', 'Iced coffee', 'Café gelado', 'Café helado'), o('turkish', 'Turkish coffee', 'Café turco'),
  ],
  method: [
    o('machine', 'Espresso machine', 'Máquina de espresso', 'Máquina de espresso'), o('moka', 'Moka pot', 'Moka', 'Cafetera moka'),
    o('v60', 'V60 / pour-over', 'V60 / coado', 'V60 / filtrado'), o('chemex', 'Chemex', 'Chemex'),
    o('aeropress', 'AeroPress', 'AeroPress'), o('french_press', 'French press', 'Prensa francesa', 'Prensa francesa'),
    o('drip', 'Drip machine', 'Cafeteira elétrica', 'Cafetera eléctrica'), o('cloth', 'Cloth filter', 'Coador de pano', 'Colador de tela'),
    o('capsule', 'Capsule', 'Cápsula', 'Cápsula'), o('ibrik', 'Ibrik / cezve', 'Ibrik / cezve'),
    o('siphon', 'Siphon', 'Sifão', 'Sifón'), o('cold_method', 'Cold immersion', 'Infusão a frio', 'Infusión en frío'),
  ],
  roast: [o('light', 'Light roast', 'Torra clara', 'Tueste claro'), o('medium', 'Medium roast', 'Torra média', 'Tueste medio'), o('dark', 'Dark roast', 'Torra escura', 'Tueste oscuro')],
  extras: [
    o('black', 'Black', 'Puro', 'Solo'), o('sugar', 'Sugar', 'Açúcar', 'Azúcar'), o('sweetener', 'Sweetener', 'Adoçante', 'Edulcorante'),
    o('milk', 'Milk', 'Leite', 'Leche'), o('oat', 'Oat milk', 'Leite de aveia', 'Leche de avena'), o('almond', 'Almond milk', 'Leite de amêndoas', 'Leche de almendras'),
    o('cream', 'Cream', 'Creme', 'Crema'), o('syrup', 'Syrup', 'Calda', 'Sirope'), o('cinnamon', 'Cinnamon', 'Canela', 'Canela'),
    o('chocolate', 'Chocolate', 'Chocolate', 'Chocolate'), o('ice', 'Ice', 'Gelo', 'Hielo'),
  ],
  origin: [
    o('brazil', 'Brazil', 'Brasil', 'Brasil'), o('colombia', 'Colombia', 'Colômbia', 'Colombia'), o('ethiopia', 'Ethiopia', 'Etiópia', 'Etiopía'),
    o('guatemala', 'Guatemala', 'Guatemala'), o('costa_rica', 'Costa Rica', 'Costa Rica'), o('kenya', 'Kenya', 'Quênia', 'Kenia'),
    o('jamaica', 'Jamaica Blue Mountain', 'Jamaica Blue Mountain'), o('hawaii', 'Hawaii Kona', 'Havaí Kona', 'Hawái Kona'),
    o('sumatra', 'Sumatra', 'Sumatra'), o('blend', 'Blend', 'Blend'),
  ],
} satisfies Record<string, CoffeeOption[]>;

export type CoffeeChoice = { drink: string | null; method: string | null; roast: string | null; origin: string | null; extras: string[]; brand: string };

const label = (list: CoffeeOption[], code: string | null, locale: Locale) => list.find((x) => x.code === code)?.label[locale] ?? null;

/** "Cappuccino · Moka pot · Medium roast · Brazil · Oat milk, Sugar · Fazenda X" — the drink comes first so pairings can be grouped by it. */
export function coffeeName(c: CoffeeChoice, locale: Locale) {
  const parts = [
    label(COFFEE.drink, c.drink, locale), label(COFFEE.method, c.method, locale), label(COFFEE.roast, c.roast, locale),
    label(COFFEE.origin, c.origin, locale), c.extras.map((e) => label(COFFEE.extras, e, locale)).filter(Boolean).join(', ') || null, c.brand.trim() || null,
  ].filter(Boolean) as string[];
  return parts.join(' · ').slice(0, 140);
}
