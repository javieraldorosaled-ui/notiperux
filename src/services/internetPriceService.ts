import {
  InternetStoreId,
  InternetGeographicScope,
  InternetPriceSourceStatus,
  InternetPriceObservation,
  InternetPriceGroup,
  PriceTrend,
} from '../types';

export interface StoreConfig {
  id: InternetStoreId;
  name: string;
  domain: string;
  geographicScope: InternetGeographicScope;
  locationBadge: string;
  locationNote?: string;
}

export const METRO_HUANUCO_SELLER_ID = 'metroios066mio';
export const METRO_HUANUCO_GEO_COORDINATES: [number, number] = [-76.2421875, -9.9260625];
export const METRO_HUANUCO_BRANCH_NAME = 'Metro Huánuco · Jr. San Martín (Sucursal S066)';

export const PROMART_HUANUCO_SELLER_ID = 'promart_sc8_huanuco';
export const PROMART_HUANUCO_BRANCH_NAME =
  'Promart Huánuco · Real Plaza (Jr. Independencia 1601)';

export const INTERNET_STORES: StoreConfig[] = [
  {
    id: 'metro',
    name: 'Metro',
    domain: 'https://www.metro.pe',
    geographicScope: 'HUANUCO',
    locationBadge: '📍 PRECIO EN HUÁNUCO · Metro Huánuco · Jr. San Martín (Sucursal S066)',
    locationNote:
      'Precio y disponibilidad verificados en la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066, seller: metroios066mio).',
  },
  {
    id: 'promart',
    name: 'Promart',
    domain: 'https://www.promart.pe',
    geographicScope: 'HUANUCO',
    locationBadge:
      '📍 PRECIO EN HUÁNUCO · Promart Huánuco · Real Plaza (Jr. Independencia 1601)',
    locationNote:
      'Precio y retiro en tienda verificados en la sede física Promart Huánuco (Jr. Independencia 1601 · C.C. Real Plaza Huánuco, canal regional sc=8).',
  },
  {
    id: 'plazavea',
    name: 'Plaza Vea',
    domain: 'https://www.plazavea.com.pe',
    geographicScope: 'LIMA_NACIONAL',
    locationBadge: '🌐 Precio Online de Referencia · Cadena con sede física en Huánuco',
    locationNote:
      'El catálogo online de alimentos no tiene despacho ni retiro habilitado en Huánuco según la verificación VTEX realizada; se muestra como precio online de referencia.',
  },
  {
    id: 'wong',
    name: 'Wong',
    domain: 'https://www.wong.pe',
    geographicScope: 'LIMA_NACIONAL',
    locationBadge: '🌐 Precio Online de Referencia · Lima/Nacional',
    locationNote:
      'Precio Online de Referencia Lima/Nacional. Wong no cuenta con supermercado físico en Huánuco.',
  },
  {
    id: 'vega',
    name: 'Vega',
    domain: 'https://www.vega.pe',
    geographicScope: 'LIMA_NACIONAL',
    locationBadge: '🌐 Precio Online de Referencia · Lima/Nacional',
    locationNote:
      'Precio Online de Referencia Lima/Nacional. Vega no cuenta con tienda o sede verificada en Huánuco.',
  },
];

export interface WhitelistGroupSpec {
  comparisonGroupKey: string;
  productBaseName: string;
  presentationLabel: string;
  icon: string;
  category: string;
  targetQuantity: number;
  targetUnit: 'un' | 'g' | 'kg' | 'ml' | 'L' | 'gal' | 'm';
  normalizedUnitName: 'unidad' | 'kg' | 'litro' | 'galón' | 'metro';
  normalizedDivisor: number; // divide package price by this to get price per unidad/kg/litro
  searchQueries: string[];
  requiredKeywordsAny: string[][]; // array of groups; at least one keyword from each sub-array must appear in normalized title
  requiredCategoryTerms: string[]; // at least one term must appear in lowercase category path
  excludedTitleTerms?: string[];
  allowedStores?: InternetStoreId[];
}

export const WHITELIST_PRODUCT_GROUPS: WhitelistGroupSpec[] = [
  {
    comparisonGroupKey: 'huevo_pardo_15_un',
    productBaseName: 'Huevo Pardo / Rosado',
    presentationLabel: 'Bandeja 15 unidades',
    icon: '🥚',
    category: 'alimentos',
    targetQuantity: 15,
    targetUnit: 'un',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 15,
    searchQueries: ['huevos pardos'],
    requiredKeywordsAny: [['huevo', 'huevos'], ['pardo', 'pardos', 'rosado', 'rosados']],
    requiredCategoryTerms: ['huevo'],
    excludedTitleTerms: ['codorniz', 'blanco', 'blancos', 'orgánico', 'organico', 'free range', 'artesanal'],
  },
  {
    comparisonGroupKey: 'huevo_pardo_30_un',
    productBaseName: 'Huevo Pardo / Rosado',
    presentationLabel: 'Bandeja 30 unidades',
    icon: '🥚',
    category: 'alimentos',
    targetQuantity: 30,
    targetUnit: 'un',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 30,
    searchQueries: ['huevos pardos', 'huevos'],
    requiredKeywordsAny: [['huevo', 'huevos'], ['pardo', 'pardos', 'rosado', 'rosados']],
    requiredCategoryTerms: ['huevo'],
    excludedTitleTerms: ['codorniz', 'blanco', 'blancos', 'orgánico', 'organico', 'free range'],
  },
  {
    comparisonGroupKey: 'pollo_entero_1_kg',
    productBaseName: 'Pollo Entero',
    presentationLabel: 'Precio por 1 kg',
    icon: '🍗',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['pollo entero'],
    requiredKeywordsAny: [['pollo'], ['entero']],
    requiredCategoryTerms: ['pollo entero'],
    excludedTitleTerms: [
      'rostizado',
      'horneado',
      'brasa',
      'leña',
      'lena',
      'gaseosa',
      'chicha',
      'papa',
      'combo',
      'congelado',
      'hamburguesa',
      'pechuga',
      'pierna',
      'filete',
      'trozado',
    ],
  },
  {
    comparisonGroupKey: 'arroz_extra_750_g',
    productBaseName: 'Arroz Extra',
    presentationLabel: 'Bolsa 750 g',
    icon: '🌾',
    category: 'abarrotes',
    targetQuantity: 750,
    targetUnit: 'g',
    normalizedUnitName: 'kg',
    normalizedDivisor: 0.75,
    searchQueries: ['arroz extra'],
    requiredKeywordsAny: [['arroz'], ['extra']],
    requiredCategoryTerms: ['arroz'],
    excludedTitleTerms: ['integral', 'arborio', 'sushi', 'basmati', 'superior', 'parbolizado'],
  },
  {
    comparisonGroupKey: 'arroz_extra_5_kg',
    productBaseName: 'Arroz Extra',
    presentationLabel: 'Bolsa 5 kg',
    icon: '🌾',
    category: 'abarrotes',
    targetQuantity: 5,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 5,
    searchQueries: ['arroz extra'],
    requiredKeywordsAny: [['arroz'], ['extra']],
    requiredCategoryTerms: ['arroz'],
    excludedTitleTerms: ['integral', 'arborio', 'sushi', 'basmati', 'superior', 'parbolizado'],
  },
  {
    comparisonGroupKey: 'aceite_vegetal_900_ml',
    productBaseName: 'Aceite Vegetal',
    presentationLabel: 'Botella 900 ml',
    icon: '🫗',
    category: 'abarrotes',
    targetQuantity: 900,
    targetUnit: 'ml',
    normalizedUnitName: 'litro',
    normalizedDivisor: 0.9,
    searchQueries: ['aceite vegetal'],
    requiredKeywordsAny: [['aceite'], ['vegetal']],
    requiredCategoryTerms: ['aceite'],
    excludedTitleTerms: ['oliva', 'coco', 'ajonjolí', 'ajonjoli', 'spray', 'girasol', 'maíz', 'maiz'],
  },
  {
    comparisonGroupKey: 'azucar_rubia_1_kg',
    productBaseName: 'Azúcar Rubia',
    presentationLabel: 'Bolsa 1 kg',
    icon: '🧂',
    category: 'abarrotes',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['azucar rubia'],
    requiredKeywordsAny: [['azucar', 'azúcar'], ['rubia']],
    requiredCategoryTerms: ['azucar', 'azúcar'],
    excludedTitleTerms: ['blanca', 'impalpable', 'edulcorante', 'stevia', 'panela'],
  },
  {
    comparisonGroupKey: 'papa_amarilla_1_kg',
    productBaseName: 'Papa Amarilla',
    presentationLabel: 'Por 1 kg',
    icon: '🥔',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['papa amarilla'],
    requiredKeywordsAny: [['papa'], ['amarilla']],
    requiredCategoryTerms: ['frutas y verduras'],
    excludedTitleTerms: [
      'gnocchi',
      'prefrita',
      'congelada',
      'congelado',
      'snack',
      'piqueo',
      'chips',
      'puré',
      'pure',
      'procesada',
      'cocktail',
    ],
  },
  {
    comparisonGroupKey: 'cebolla_roja_1_kg',
    productBaseName: 'Cebolla Roja',
    presentationLabel: 'Por 1 kg',
    icon: '🧅',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['cebolla roja'],
    requiredKeywordsAny: [['cebolla'], ['roja']],
    requiredCategoryTerms: ['frutas y verduras'],
    excludedTitleTerms: ['semilla', 'semillas', 'picada', 'blanca', 'china', 'polvo', 'aros'],
  },
  {
    comparisonGroupKey: 'tomate_1_kg',
    productBaseName: 'Tomate',
    presentationLabel: 'Por 1 kg',
    icon: '🍅',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['tomate italiano', 'tomate'],
    requiredKeywordsAny: [['tomate']],
    requiredCategoryTerms: ['frutas y verduras'],
    excludedTitleTerms: [
      'salsa',
      'pasta',
      'puré',
      'pure',
      'triturado',
      'concentrado',
      'ketchup',
      'plato',
      'bowl',
      'lata',
      'conserva',
      'cherry',
      'deshidratado',
    ],
  },
  {
    comparisonGroupKey: 'limon_sutil_1_kg',
    productBaseName: 'Limón Sutil',
    presentationLabel: 'Por 1 kg',
    icon: '🍋',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['limon sutil', 'limon x kg', 'frutas-y-verduras?ft=limon'],
    requiredKeywordsAny: [['limon', 'limón']],
    requiredCategoryTerms: ['frutas y verduras'],
    excludedTitleTerms: [
      'tahiti',
      'tahití',
      'dulce',
      'gold',
      'limpiador',
      'lavavajillas',
      'detergente',
      'lejia',
      'lejía',
      'perfume',
      'silicona',
      'galleta',
      'caramelo',
      'kombucha',
    ],
  },
  {
    comparisonGroupKey: 'fideos_spaguetti_950_g',
    productBaseName: 'Fideos Spaguetti',
    presentationLabel: 'Paquete 950 g',
    icon: '🍝',
    category: 'abarrotes',
    targetQuantity: 950,
    targetUnit: 'g',
    normalizedUnitName: 'kg',
    normalizedDivisor: 0.95,
    searchQueries: ['spaguetti 950g', 'fideos spaguetti'],
    requiredKeywordsAny: [['spaguetti', 'spaghetti', 'fideo', 'fideos']],
    requiredCategoryTerms: ['fideos', 'pastas'],
    excludedTitleTerms: ['integral', 'sin gluten', 'artesanal', 'cuchara', 'servidor'],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'atun_filete_140_g',
    productBaseName: 'Filete de Atún en Conserva',
    presentationLabel: 'Lata 140 g',
    icon: '🐟',
    category: 'abarrotes',
    targetQuantity: 140,
    targetUnit: 'g',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 1,
    searchQueries: ['filete de atun 140g', 'filete de atun'],
    requiredKeywordsAny: [['filete'], ['atun', 'atún']],
    requiredCategoryTerms: ['conserva', 'pescado'],
    excludedTitleTerms: ['trozos', 'grated', 'lomito', 'ensalada', 'pouch'],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'lenteja_400_g',
    productBaseName: 'Lenteja (Menestra)',
    presentationLabel: 'Bolsa 400 g',
    icon: '🫘',
    category: 'abarrotes',
    targetQuantity: 400,
    targetUnit: 'g',
    normalizedUnitName: 'kg',
    normalizedDivisor: 0.4,
    searchQueries: ['lenteja 400g', 'lenteja'],
    requiredKeywordsAny: [['lenteja', 'lentejas']],
    requiredCategoryTerms: ['menestra', 'lenteja'],
    excludedTitleTerms: ['germinado', 'germinados', 'lista', 'listas', 'chocolate', 'grageas'],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'zanahoria_1_kg',
    productBaseName: 'Zanahoria',
    presentationLabel: 'Por 1 kg',
    icon: '🥕',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['zanahoria x kg', 'zanahoria'],
    requiredKeywordsAny: [['zanahoria']],
    requiredCategoryTerms: ['frutas y verduras', 'verduras'],
    excludedTitleTerms: [
      'congelada',
      'congelado',
      'baston',
      'bastones',
      'baby',
      'mix',
      'rallada',
      'picada',
      'nectar',
      'jugo',
      'keke',
      'snack',
    ],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'platano_seda_1_kg',
    productBaseName: 'Plátano de Seda',
    presentationLabel: 'Por 1 kg',
    icon: '🍌',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['platano de seda'],
    requiredKeywordsAny: [['platano', 'plátano'], ['seda']],
    requiredCategoryTerms: ['frutas y verduras', 'frutas'],
    excludedTitleTerms: ['organico', 'orgánico', 'exportacion', 'exportación', 'chifle', 'harina'],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'tilapia_1_kg',
    productBaseName: 'Pescado Filete de Tilapia',
    presentationLabel: 'Por 1 kg',
    icon: '🐠',
    category: 'alimentos',
    targetQuantity: 1,
    targetUnit: 'kg',
    normalizedUnitName: 'kg',
    normalizedDivisor: 1,
    searchQueries: ['filete de tilapia 1kg', 'filete de tilapia'],
    requiredKeywordsAny: [['filete'], ['tilapia']],
    requiredCategoryTerms: ['pescados', 'pescado'],
    excludedTitleTerms: ['apanado', 'apanados', 'nugget', 'entera', 'extra'],
    allowedStores: ['metro', 'plazavea', 'wong', 'vega'],
  },
  {
    comparisonGroupKey: 'cemento_portland_42_5_kg',
    productBaseName: 'Cemento Portland (Bolsa 42.5 kg)',
    presentationLabel: 'Bolsa 42.5 kg',
    icon: '🧱',
    category: 'construccion',
    targetQuantity: 42.5,
    targetUnit: 'kg',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 1,
    searchQueries: ['cemento andino', 'cemento sol'],
    requiredKeywordsAny: [['cemento'], ['portland']],
    requiredCategoryTerms: ['construccion', 'cemento'],
    excludedTitleTerms: ['fragua', 'pegamento', 'placa', 'mortero', 'blanco'],
    allowedStores: ['promart'],
  },
  {
    comparisonGroupKey: 'fierro_corrugado_1_2_9m',
    productBaseName: 'Fierro Corrugado 1/2" x 9 m',
    presentationLabel: 'Varilla 9 m',
    icon: '🏗️',
    category: 'construccion',
    targetQuantity: 9,
    targetUnit: 'm',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 1,
    searchQueries: ['fierro 1/2 aceros arequipa'],
    requiredKeywordsAny: [['fierro'], ['1/2']],
    requiredCategoryTerms: ['construccion', 'fierro', 'barras'],
    excludedTitleTerms: ['3/8', '5/8', '3/4', '1"', '4.7mm', '6mm', '8mm', '12mm', 'alambre'],
    allowedStores: ['promart'],
  },
  {
    comparisonGroupKey: 'ladrillo_king_kong_un',
    productBaseName: 'Ladrillo King Kong 18 Huecos',
    presentationLabel: 'Por 1 unidad',
    icon: '🧱',
    category: 'construccion',
    targetQuantity: 1,
    targetUnit: 'un',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 1,
    searchQueries: ['ladrillo king kong'],
    requiredKeywordsAny: [['ladrillo'], ['king kong'], ['18 huecos']],
    requiredCategoryTerms: ['construccion', 'ladrillos'],
    excludedTitleTerms: ['tacho', 'recolector', 'pandereta', 'techo', 'pastelero', 'millar'],
    allowedStores: ['promart'],
  },
  {
    comparisonGroupKey: 'pintura_latex_1_gal',
    productBaseName: 'Pintura Látex Blanco 1 Galón',
    presentationLabel: 'Balde 1 galón',
    icon: '🎨',
    category: 'hogar',
    targetQuantity: 1,
    targetUnit: 'gal',
    normalizedUnitName: 'galón',
    normalizedDivisor: 1,
    searchQueries: ['duralatex cpp blanco 1 galon'],
    requiredKeywordsAny: [['pintura'], ['latex', 'látex', 'duralatex']],
    requiredCategoryTerms: ['pinturas'],
    excludedTitleTerms: ['4 galones', '5 galones', 'esmalte', 'barniz', 'rodillo', 'brocha'],
    allowedStores: ['promart'],
  },
  {
    comparisonGroupKey: 'wincha_5_m',
    productBaseName: 'Cinta Métrica (Wincha) 5 metros',
    presentationLabel: 'Unidad 5 m',
    icon: '📏',
    category: 'hogar',
    targetQuantity: 5,
    targetUnit: 'm',
    normalizedUnitName: 'unidad',
    normalizedDivisor: 1,
    searchQueries: ['cinta metrica 5m stanley'],
    requiredKeywordsAny: [['cinta metrica', 'cinta métrica', 'wincha'], ['5m', '5 m']],
    requiredCategoryTerms: ['herramientas', 'winchas', 'medicion', 'medición'],
    excludedTitleTerms: ['3m', '8m', '10m', '20m', '30m', 'laser', 'láser'],
    allowedStores: ['promart'],
  },
];

// Palabras globalmente excluidas en cualquier producto
const GLOBAL_EXCLUDED_TERMS = [
  'cortador',
  'porta',
  'cocedor',
  'juguete',
  'sarten',
  'sartén',
  'utensilio',
  'accesorio',
  'plato',
  'bowl',
  'twopack',
  'bipack',
  'tripack',
  'sixpack',
  'pack ',
  'pack x',
  'dúo',
  'duo ',
  'combo',
  'semillas',
  'limpiador',
  'lavavajillas',
  'detergente',
  'lejía',
  'lejia',
  'perfume',
  'silicona',
];

export interface ParsedPresentation {
  quantity: number;
  unit: 'un' | 'g' | 'kg' | 'ml' | 'L' | 'gal' | 'm';
  rawLabel: string;
}

/**
 * Extrae de forma determinista la presentación desde productName.
 * Si la presentación es ambigua o contiene multiplicadores de pack (ej. "4kg x 2un"), devuelve null.
 */
export function extractPresentationFromTitle(productName: string): ParsedPresentation | null {
  const clean = productName.trim();
  const lower = clean.toLowerCase();

  // Descartar si es un multi-pack explícito como "x 2un", "pack 6u", "twopack"
  if (/\b(?:x\s*\d+\s*(?:un|unid|u)|pack\s*\d+|twopack|bipack|tripack|sixpack)\b/i.test(lower)) {
    return null;
  }

  // Caso especial: Ladrillo King Kong 18 huecos (venta unitaria)
  if (lower.includes('ladrillo') && lower.includes('18 huecos')) {
    return {
      quantity: 1,
      unit: 'un',
      rawLabel: '1 un',
    };
  }

  // 1. Caso explícito "x kg" o "por kg" (venta a granel por 1 kilogramo)
  if (/\b(?:x|por)\s*kg\b/i.test(lower)) {
    return {
      quantity: 1,
      unit: 'kg',
      rawLabel: 'Por 1 kg',
    };
  }

  // 2. Buscar patrones numéricos con unidad reconocida
  // Unidades: un, unid, unidades, u
  // Peso: g, gr, gramos, kg, kilo, kilos
  // Volumen: ml, l, lt, litro, litros, galón, galon, gl
  // Longitud: m, metros, metro, mts
  const regex =
    /(?:^|\s|bandeja|bolsa|botella|paquete|malla|saco|galonera|galón|balde|lata|x)(\d+(?:[.,]\d+)?)\s*(unid|unidades|un|u|gramos|gr|g|kilos|kilo|kg|ml|litros|litro|lt|l|galones|galón|galon|gl|metros|metro|mts|m)(?=\b|\/|$|\s)/gi;

  const matches: ParsedPresentation[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    const qtyRaw = match[1].replace(',', '.');
    const qty = parseFloat(qtyRaw);
    if (isNaN(qty) || qty <= 0) continue;

    const unitToken = match[2].toLowerCase();
    let unit: 'un' | 'g' | 'kg' | 'ml' | 'L' | 'gal' | 'm';
    if (['un', 'unid', 'unidades', 'u'].includes(unitToken)) {
      unit = 'un';
    } else if (['g', 'gr', 'gramos'].includes(unitToken)) {
      unit = 'g';
    } else if (['kg', 'kilo', 'kilos'].includes(unitToken)) {
      unit = 'kg';
    } else if (unitToken === 'ml') {
      unit = 'ml';
    } else if (['l', 'lt', 'litro', 'litros'].includes(unitToken)) {
      unit = 'L';
    } else if (['galones', 'galón', 'galon', 'gl'].includes(unitToken)) {
      unit = 'gal';
    } else if (['metros', 'metro', 'mts', 'm'].includes(unitToken)) {
      unit = 'm';
    } else {
      continue;
    }

    matches.push({
      quantity: qty,
      unit,
      rawLabel: `${qty} ${unit}`,
    });
  }

  // Si no se encontró ninguna presentación o hay múltiples presentaciones contradictorias (ej. combo), descartar
  if (matches.length !== 1) {
    return null;
  }

  return matches[0];
}

export interface DiscardedProductLog {
  source: InternetStoreId;
  productName: string;
  category: string;
  reason: string;
}

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Valida si un producto crudo de VTEX cumple estrictamente la lista blanca,
 * filtros de categoría, palabras clave, exclusiones y presentación exacta.
 */
export function evaluateVtexProductAgainstGroup(
  rawProduct: any,
  spec: WhitelistGroupSpec,
  store: StoreConfig
): {
  accepted: boolean;
  reason?: string;
  parsedPresentation?: ParsedPresentation;
  price?: number;
  listPrice?: number;
  availableQuantity?: number;
  productId?: string;
  skuId?: string;
  productName?: string;
  brand?: string;
  sourceUrl?: string;
} {
  const productName = String(rawProduct?.productName || '').trim();
  if (!productName) {
    return { accepted: false, reason: 'Sin nombre de producto' };
  }

  const categoriesArr: string[] = Array.isArray(rawProduct?.categories) ? rawProduct.categories : [];
  const categoryPath = categoriesArr.join(' | ');
  const normTitle = normalizeText(productName);
  const normCat = normalizeText(categoryPath);

  // 1. Verificar exclusiones globales
  for (const banned of GLOBAL_EXCLUDED_TERMS) {
    if (normTitle.includes(normalizeText(banned))) {
      return {
        accepted: false,
        reason: `Excluido por término prohibido global ("${banned}")`,
      };
    }
  }

  // 2. Verificar exclusiones específicas del grupo
  if (spec.excludedTitleTerms) {
    for (const excluded of spec.excludedTitleTerms) {
      if (normTitle.includes(normalizeText(excluded))) {
        return {
          accepted: false,
          reason: `Excluido por filtro del grupo ("${excluded}")`,
        };
      }
    }
  }

  // 3. Validar categoría VTEX
  const catMatches = spec.requiredCategoryTerms.some((term) =>
    normCat.includes(normalizeText(term))
  );
  if (!catMatches) {
    return {
      accepted: false,
      reason: `Categoría incompatible ("${categoriesArr[0] || 'sin categoría'}")`,
    };
  }

  // 4. Validar palabras clave obligatorias en el nombre
  for (const groupKeywords of spec.requiredKeywordsAny) {
    const groupMatched = groupKeywords.some((kw) => normTitle.includes(normalizeText(kw)));
    if (!groupMatched) {
      return {
        accepted: false,
        reason: `No contiene palabra clave requerida (${groupKeywords.join('/')})`,
      };
    }
  }

  // 5. Extraer y validar presentación inequívoca
  const parsedPresentation = extractPresentationFromTitle(productName);
  if (!parsedPresentation) {
    return {
      accepted: false,
      reason: 'Presentación ambigua o no determinable de forma inequívoca',
    };
  }

  if (
    parsedPresentation.unit !== spec.targetUnit ||
    Math.abs(parsedPresentation.quantity - spec.targetQuantity) > 0.001
  ) {
    return {
      accepted: false,
      reason: `Presentación distinta (${parsedPresentation.quantity} ${parsedPresentation.unit} ≠ ${spec.targetQuantity} ${spec.targetUnit})`,
    };
  }

  // 6. Extraer oferta comercial de VTEX
  const firstItem = Array.isArray(rawProduct?.items) ? rawProduct.items[0] : null;
  const firstSeller = Array.isArray(firstItem?.sellers) ? firstItem.sellers[0] : null;
  const offer = firstSeller?.commertialOffer;

  const price = Number(offer?.Price);
  const listPriceRaw = Number(offer?.ListPrice);
  const availableQuantity = Number(offer?.AvailableQuantity ?? 0);

  if (!price || isNaN(price) || price <= 0) {
    return {
      accepted: false,
      reason: 'Precio inválido o igual a 0',
    };
  }

  const listPrice = !isNaN(listPriceRaw) && listPriceRaw >= price ? listPriceRaw : price;

  let sourceUrl = String(rawProduct?.link || '').trim();
  if (sourceUrl && !sourceUrl.startsWith('http')) {
    sourceUrl = `${store.domain}${sourceUrl.startsWith('/') ? '' : '/'}${sourceUrl}`;
  }
  if (!sourceUrl) {
    return {
      accepted: false,
      reason: 'Sin URL oficial de producto',
    };
  }

  const skuId = String(firstItem?.itemId || rawProduct?.productId || '');

  return {
    accepted: true,
    parsedPresentation,
    price: Number(price.toFixed(2)),
    listPrice: Number(listPrice.toFixed(2)),
    availableQuantity,
    productId: String(rawProduct.productId || firstItem?.itemId || ''),
    skuId,
    productName,
    brand: String(rawProduct.brand || store.name).trim(),
    sourceUrl,
  };
}

const FETCH_TIMEOUT_MS = 6000;
const THROTTLE_DELAY_MS = 180;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchVtexSearchWithTimeout(store: StoreConfig, queryOrPath: string): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const scParam = store.id === 'promart' ? '&sc=8' : '';
    const endpoint = queryOrPath.includes('?ft=')
      ? `${store.domain}/api/catalog_system/pub/products/search/${queryOrPath}${scParam}&_from=0&_to=12`
      : `${store.domain}/api/catalog_system/pub/products/search/?ft=${encodeURIComponent(
          queryOrPath
        )}${scParam}&_from=0&_to=12`;

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HuanucoPreciosHoy/1.0; +https://gob.pe)',
        Accept: 'application/json',
      },
    });

    if (!res.ok && res.status !== 206) {
      throw new Error(`HTTP ${res.status} desde ${store.name}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

export interface MetroHuanucoSimulationResult {
  availableInHuanuco: boolean;
  price: number | null;
  listPrice: number | null;
  availableQuantity: number;
  pickupPointId: string | null;
  slaId: string | null;
}

/**
 * Simula disponibilidad y precio específico para la sucursal Metro Huánuco
 * (Jr. San Martín, Sucursal S066, seller: metroios066mio).
 */
export async function simulateMetroHuanucoSku(skuId: string): Promise<MetroHuanucoSimulationResult> {
  if (!skuId) {
    return {
      availableInHuanuco: false,
      price: null,
      listPrice: null,
      availableQuantity: 0,
      pickupPointId: null,
      slaId: null,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('https://www.metro.pe/api/checkout/pub/orderForms/simulation', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HuanucoPreciosHoy/1.0; +https://gob.pe)',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: skuId,
            quantity: 1,
            seller: METRO_HUANUCO_SELLER_ID,
          },
        ],
        country: 'PER',
        geoCoordinates: METRO_HUANUCO_GEO_COORDINATES,
      }),
    });

    if (!res.ok) {
      return {
        availableInHuanuco: false,
        price: null,
        listPrice: null,
        availableQuantity: 0,
        pickupPointId: null,
        slaId: null,
      };
    }

    const data = await res.json();
    const simItem = Array.isArray(data?.items) ? data.items[0] : null;
    const logistics = Array.isArray(data?.logisticsInfo) ? data.logisticsInfo[0] : null;
    const slas: any[] = Array.isArray(logistics?.slas) ? logistics.slas : [];

    const huanucoSla = slas.find((s) => {
      const idStr = String(s?.id || s?.name || '');
      const friendly = String(s?.pickupStoreInfo?.friendlyName || '');
      const ppId = String(s?.pickupPointId || '');
      return /huanuco|huánuco|s066/i.test(`${idStr} ${friendly} ${ppId}`);
    });

    const isAvailable =
      simItem?.availability === 'available' &&
      Boolean(huanucoSla || simItem?.seller === METRO_HUANUCO_SELLER_ID);

    if (!isAvailable) {
      return {
        availableInHuanuco: false,
        price: null,
        listPrice: null,
        availableQuantity: 0,
        pickupPointId: null,
        slaId: null,
      };
    }

    // En VTEX Checkout Simulation, price / sellingPrice / listPrice vienen en centavos (ej. 1079 = S/ 10.79).
    // Atención: para productos pesables ("x kg") donde unitMultiplier != 1 (ej. 0.1 kg por 1 limón o 1.8 kg por 1 pollo),
    // sellingPrice es el precio de 1 unidad pesable (price * unitMultiplier), mientras que
    // priceDefinition.pricePerUnit y simItem.price representan el precio exacto por 1 kg.
    const unitMultiplier = Number(simItem?.unitMultiplier ?? 1);
    const isWeighablePerKg = !isNaN(unitMultiplier) && Math.abs(unitMultiplier - 1) > 0.001;

    const rawEffectiveCents = isWeighablePerKg
      ? Number(simItem?.priceDefinition?.pricePerUnit || simItem?.price || 0)
      : Number(simItem?.sellingPrice || simItem?.priceDefinition?.pricePerUnit || simItem?.price || 0);
    const rawListCents = Number(simItem?.listPrice || rawEffectiveCents || 0);

    const simPrice = rawEffectiveCents > 0 ? Number((rawEffectiveCents / 100).toFixed(2)) : null;
    const simListPrice =
      rawListCents > 0 && simPrice !== null
        ? Number(Math.max(simPrice, rawListCents / 100).toFixed(2))
        : simPrice;

    return {
      availableInHuanuco: simPrice !== null && simPrice > 0,
      price: simPrice,
      listPrice: simListPrice,
      availableQuantity: Math.max(1, Number(simItem?.quantity || 1)),
      pickupPointId: String(huanucoSla?.pickupPointId || '1_pp002S066RetiroenSucursal'),
      slaId: String(huanucoSla?.id || 'Retiro en Metro Huanuco (pp002S066RetiroenSucursal)'),
    };
  } catch {
    return {
      availableInHuanuco: false,
      price: null,
      listPrice: null,
      availableQuantity: 0,
      pickupPointId: null,
      slaId: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Simula disponibilidad y precio específico para la tienda física Promart Huánuco
 * (Jr. Independencia 1601 · C.C. Real Plaza Huánuco, canal regional sc=8, ubigeo 100101).
 */
export async function simulatePromartHuanucoSku(
  skuId: string
): Promise<MetroHuanucoSimulationResult> {
  if (!skuId) {
    return {
      availableInHuanuco: false,
      price: null,
      listPrice: null,
      availableQuantity: 0,
      pickupPointId: null,
      slaId: null,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('https://www.promart.pe/api/checkout/pub/orderForms/simulation?sc=8', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HuanucoPreciosHoy/1.0; +https://gob.pe)',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: String(skuId),
            quantity: 1,
            seller: '1',
          },
        ],
        country: 'PER',
        postalCode: '100101',
      }),
    });

    if (!res.ok) {
      return {
        availableInHuanuco: false,
        price: null,
        listPrice: null,
        availableQuantity: 0,
        pickupPointId: null,
        slaId: null,
      };
    }

    const data = await res.json();
    const simItem = Array.isArray(data?.items) ? data.items[0] : null;
    const logistics = Array.isArray(data?.logisticsInfo) ? data.logisticsInfo[0] : null;
    const slas: any[] = Array.isArray(logistics?.slas) ? logistics.slas : [];

    const huanucoSla = slas.find((s) => {
      const idStr = String(s?.id || s?.name || '');
      const friendly = String(s?.pickupStoreInfo?.friendlyName || '');
      const ppId = String(s?.pickupPointId || '');
      return /huanuco|huánuco|06260d14/i.test(`${idStr} ${friendly} ${ppId}`);
    });

    const isAvailable = simItem?.availability === 'available' && Boolean(huanucoSla);
    if (!isAvailable) {
      return {
        availableInHuanuco: false,
        price: null,
        listPrice: null,
        availableQuantity: 0,
        pickupPointId: null,
        slaId: null,
      };
    }

    const rawEffectiveCents = Number(
      simItem?.sellingPrice || simItem?.priceDefinition?.pricePerUnit || simItem?.price || 0
    );
    const rawListCents = Number(simItem?.listPrice || rawEffectiveCents || 0);

    const simPrice = rawEffectiveCents > 0 ? Number((rawEffectiveCents / 100).toFixed(2)) : null;
    const simListPrice =
      rawListCents > 0 && simPrice !== null
        ? Number(Math.max(simPrice, rawListCents / 100).toFixed(2))
        : simPrice;

    return {
      availableInHuanuco: simPrice !== null && simPrice > 0,
      price: simPrice,
      listPrice: simListPrice,
      availableQuantity: Math.max(1, Number(simItem?.quantity || 1)),
      pickupPointId: String(
        huanucoSla?.pickupPointId || '1_06260d14-f76c-4939-9e42-a9075dc0457c'
      ),
      slaId: String(huanucoSla?.id || 'Retiro en Tienda - Huanuco'),
    };
  } catch {
    return {
      availableInHuanuco: false,
      price: null,
      listPrice: null,
      availableQuantity: 0,
      pickupPointId: null,
      slaId: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function computeStatsSubset(subset: InternetPriceObservation[]): {
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  lowestNormalizedUnitPrice: number | null;
  sourcesCount: number;
} {
  if (subset.length === 0) {
    return {
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      medianPrice: null,
      lowestNormalizedUnitPrice: null,
      sourcesCount: 0,
    };
  }

  const sortedPrices = subset.map((o) => o.price).sort((a, b) => a - b);
  const lowestPrice = Number(sortedPrices[0].toFixed(2));
  const highestPrice = Number(sortedPrices[sortedPrices.length - 1].toFixed(2));
  const sum = sortedPrices.reduce((acc, p) => acc + p, 0);
  const averagePrice = Number((sum / sortedPrices.length).toFixed(2));

  const mid = Math.floor(sortedPrices.length / 2);
  const medianPrice =
    sortedPrices.length % 2 === 0
      ? Number(((sortedPrices[mid - 1] + sortedPrices[mid]) / 2).toFixed(2))
      : Number(sortedPrices[mid].toFixed(2));

  const sortedUnitPrices = subset.map((o) => o.normalizedUnitPrice).sort((a, b) => a - b);
  const lowestNormalizedUnitPrice = Number(sortedUnitPrices[0].toFixed(2));

  const uniqueSources = new Set(subset.map((o) => o.source));

  return {
    lowestPrice,
    highestPrice,
    averagePrice,
    medianPrice,
    lowestNormalizedUnitPrice,
    sourcesCount: uniqueSources.size,
  };
}

export function computeGroupStatistics(observations: InternetPriceObservation[]): {
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  lowestNormalizedUnitPrice: number | null;
  sourcesCount: number;
  hasHuanucoPrice: boolean;
  primaryGeographicScope: InternetGeographicScope;
  huanucoLowestPrice: number | null;
  huanucoAveragePrice: number | null;
  huanucoHighestPrice: number | null;
  huanucoSourcesCount: number;
  nationalLowestPrice: number | null;
  nationalAveragePrice: number | null;
  nationalHighestPrice: number | null;
  nationalSourcesCount: number;
} {
  const nowMs = Date.now();
  const validObservations = observations.filter((obs) => {
    const expMs = Date.parse(obs.expiresAt);
    const expired = isNaN(expMs) ? true : nowMs > expMs;
    return !expired && !obs.isExpired && obs.availability === 'IN_STOCK' && obs.price > 0;
  });

  const huanucoValid = validObservations.filter(
    (o) => (o.geographicScope || o.scope) === 'HUANUCO' || o.isLocalHuanuco === true
  );
  const nationalValid = validObservations.filter(
    (o) => (o.geographicScope || o.scope) !== 'HUANUCO' && o.isLocalHuanuco !== true
  );

  const overallStats = computeStatsSubset(validObservations);
  const huanucoStats = computeStatsSubset(huanucoValid);
  const nationalStats = computeStatsSubset(nationalValid);

  const hasHuanucoPrice = huanucoStats.sourcesCount > 0 && huanucoStats.lowestPrice !== null;

  return {
    ...overallStats,
    hasHuanucoPrice,
    primaryGeographicScope: hasHuanucoPrice ? 'HUANUCO' : 'LIMA_NACIONAL',
    huanucoLowestPrice: huanucoStats.lowestPrice,
    huanucoAveragePrice: huanucoStats.averagePrice,
    huanucoHighestPrice: huanucoStats.highestPrice,
    huanucoSourcesCount: huanucoStats.sourcesCount,
    nationalLowestPrice: nationalStats.lowestPrice,
    nationalAveragePrice: nationalStats.averagePrice,
    nationalHighestPrice: nationalStats.highestPrice,
    nationalSourcesCount: nationalStats.sourcesCount,
  };
}

export function formatDataAge(lastFetchedAt: string | null): {
  dataAge: string;
  dataAgeMinutes: number | null;
} {
  if (!lastFetchedAt) {
    return { dataAge: 'Sin sincronización previa', dataAgeMinutes: null };
  }
  const parsed = Date.parse(lastFetchedAt);
  if (isNaN(parsed)) {
    return { dataAge: 'Fecha no disponible', dataAgeMinutes: null };
  }
  const diffMin = Math.max(0, Math.round((Date.now() - parsed) / 60000));
  if (diffMin < 1) {
    return { dataAge: 'Hace menos de 1 min', dataAgeMinutes: 0 };
  }
  if (diffMin < 60) {
    return { dataAge: `Hace ${diffMin} min`, dataAgeMinutes: diffMin };
  }
  const hours = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  return {
    dataAge: remMin > 0 ? `Hace ${hours}h ${remMin}m` : `Hace ${hours}h`,
    dataAgeMinutes: diffMin,
  };
}

export function computeNextScheduledFetchIso(now = new Date()): string {
  // Objetivo: 2 sincronizaciones diarias aprox. 07:00 y 14:00 America/Lima (UTC-5 -> 12:00 UTC y 19:00 UTC)
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();

  const slot1 = new Date(Date.UTC(utcYear, utcMonth, utcDate, 12, 0, 0)); // 07:00 Lima
  const slot2 = new Date(Date.UTC(utcYear, utcMonth, utcDate, 19, 0, 0)); // 14:00 Lima
  const slotTomorrow = new Date(Date.UTC(utcYear, utcMonth, utcDate + 1, 12, 0, 0));

  if (now.getTime() < slot1.getTime()) return slot1.toISOString();
  if (now.getTime() < slot2.getTime()) return slot2.toISOString();
  return slotTomorrow.toISOString();
}

export interface StoreSyncResult {
  store: StoreConfig;
  success: boolean;
  errorMessage?: string;
  observationsByGroup: Map<string, InternetPriceObservation>;
  discardedSamples: DiscardedProductLog[];
}

const INCOMPATIBLE_LEGACY_WEIGHABLE_PRICES: Record<string, number> = {
  'metro-35350': 16.02,
  'metro-33992': 0.35,
  'metro-33572': 0.7,
  'metro-33987': 0.19,
};

export function hasIncompatibleLegacyUnitPrice(
  observationId: string,
  previousPrice: number | null | undefined,
  prevUnit?: string,
  currentUnit?: string
): boolean {
  if (previousPrice === null || previousPrice === undefined) return false;
  if (prevUnit && currentUnit && prevUnit !== currentUnit) return true;
  const legacyVal = INCOMPATIBLE_LEGACY_WEIGHABLE_PRICES[observationId];
  if (legacyVal !== undefined && Math.abs(previousPrice - legacyVal) < 0.01) {
    return true;
  }
  return false;
}

/**
 * Consulta una tienda específica para todos los grupos de la lista blanca,
 * con throttling y timeout de 6s por consulta.
 * Para Metro, realiza además la simulación regional de la Sucursal S066 Metro Huánuco (seller: metroios066mio).
 */
async function syncSingleStore(
  store: StoreConfig,
  previousSnapshots: Map<string, { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }>
): Promise<StoreSyncResult> {
  const observationsByGroup = new Map<string, InternetPriceObservation>();
  const discardedSamples: DiscardedProductLog[] = [];
  const queryCache = new Map<string, any[]>();
  const metroSimCache = new Map<string, MetroHuanucoSimulationResult>();
  const now = new Date();
  const retrievedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  let successfulQueries = 0;
  let failedQueries = 0;
  let lastErrorMsg = '';

  for (const spec of WHITELIST_PRODUCT_GROUPS) {
    const allowedStores = spec.allowedStores || ['metro', 'plazavea', 'wong', 'vega'];
    if (!allowedStores.includes(store.id)) {
      continue;
    }

    let bestCandidateForStoreAndGroup: InternetPriceObservation | null = null;
    let metroSimulationsForGroup = 0;

    for (const query of spec.searchQueries) {
      let rawProducts: any[] = [];
      if (queryCache.has(query)) {
        rawProducts = queryCache.get(query)!;
      } else {
        try {
          rawProducts = await fetchVtexSearchWithTimeout(store, query);
          queryCache.set(query, rawProducts);
          successfulQueries++;
          await sleep(THROTTLE_DELAY_MS);
        } catch (err: any) {
          failedQueries++;
          lastErrorMsg = err?.message || 'Error de red';
          continue;
        }
      }

      for (const rawProd of rawProducts) {
        const evalRes = evaluateVtexProductAgainstGroup(rawProd, spec, store);
        if (!evalRes.accepted) {
          if (discardedSamples.length < 25 && evalRes.reason) {
            discardedSamples.push({
              source: store.id,
              productName: String(rawProd?.productName || ''),
              category: String(rawProd?.categories?.[0] || ''),
              reason: evalRes.reason,
            });
          }
          continue;
        }

        let finalPrice = evalRes.price!;
        let finalListPrice = evalRes.listPrice!;
        let finalAvailableQuantity = evalRes.availableQuantity!;
        let geographicScope: InternetGeographicScope = 'LIMA_NACIONAL';
        let isLocalHuanuco = false;
        let sellerId = '1';
        let branchName: string | undefined = undefined;
        let pickupPointId: string | undefined = undefined;
        let locationBadge = store.locationBadge;
        let locationNote = store.locationNote;

        if (store.id === 'metro' && evalRes.skuId) {
          let simRes: MetroHuanucoSimulationResult | undefined = metroSimCache.get(evalRes.skuId);
          if (!simRes && metroSimulationsForGroup < 10) {
            simRes = await simulateMetroHuanucoSku(evalRes.skuId);
            metroSimCache.set(evalRes.skuId, simRes);
            metroSimulationsForGroup++;
            await sleep(90);
          }

          if (simRes && simRes.availableInHuanuco && simRes.price !== null && simRes.price > 0) {
            finalPrice = simRes.price;
            finalListPrice = simRes.listPrice ?? Math.max(simRes.price, evalRes.listPrice!);
            finalAvailableQuantity = simRes.availableQuantity;
            geographicScope = 'HUANUCO';
            isLocalHuanuco = true;
            sellerId = METRO_HUANUCO_SELLER_ID;
            branchName = METRO_HUANUCO_BRANCH_NAME;
            pickupPointId = simRes.pickupPointId || '1_pp002S066RetiroenSucursal';
            locationBadge = '📍 PRECIO EN HUÁNUCO · Metro Huánuco · Jr. San Martín (Sucursal S066)';
            locationNote =
              'Precio y stock verificados en la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066, seller: metroios066mio).';
          } else {
            geographicScope = 'LIMA_NACIONAL';
            isLocalHuanuco = false;
            sellerId = '1';
            locationBadge = '🌐 REFERENCIA ONLINE LIMA/NACIONAL · Sin stock en Metro Huánuco (S066)';
            locationNote =
              'Este producto no cuenta con stock habilitado hoy en la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066). Se muestra únicamente como referencia online Lima/Nacional.';
          }
        } else if (store.id === 'promart' && evalRes.skuId) {
          let simRes: MetroHuanucoSimulationResult | undefined = metroSimCache.get(
            `promart-${evalRes.skuId}`
          );
          if (!simRes && metroSimulationsForGroup < 10) {
            simRes = await simulatePromartHuanucoSku(evalRes.skuId);
            metroSimCache.set(`promart-${evalRes.skuId}`, simRes);
            metroSimulationsForGroup++;
            await sleep(90);
          }

          if (simRes && simRes.availableInHuanuco && simRes.price !== null && simRes.price > 0) {
            finalPrice = simRes.price;
            finalListPrice = simRes.listPrice ?? Math.max(simRes.price, evalRes.listPrice!);
            finalAvailableQuantity = simRes.availableQuantity;
            geographicScope = 'HUANUCO';
            isLocalHuanuco = true;
            sellerId = PROMART_HUANUCO_SELLER_ID;
            branchName = PROMART_HUANUCO_BRANCH_NAME;
            pickupPointId =
              simRes.pickupPointId || '1_06260d14-f76c-4939-9e42-a9075dc0457c';
            locationBadge =
              '📍 PRECIO EN HUÁNUCO · Promart Huánuco · Real Plaza (Jr. Independencia 1601)';
            locationNote =
              'Precio y retiro en tienda verificados en la sede física Promart Huánuco (Jr. Independencia 1601 · C.C. Real Plaza Huánuco, canal regional sc=8).';
          } else {
            geographicScope = 'LIMA_NACIONAL';
            isLocalHuanuco = false;
            sellerId = '1';
            locationBadge =
              '🌐 REFERENCIA ONLINE LIMA/NACIONAL · Sin stock para retiro en Promart Huánuco';
            locationNote =
              'Este producto no cuenta con stock habilitado hoy para retiro en Promart Huánuco. Se muestra únicamente como precio online de referencia.';
          }
        }

        const observationId = `${store.id}-${evalRes.productId}`;
        const prevSnap = previousSnapshots.get(observationId);

        let previousPrice: number | null = null;
        let changeAmount = 0;
        let changePercentage = 0;
        let trend: PriceTrend = 'stable';
        let changeLabel = 'Primera lectura registrada';

        if (prevSnap && typeof prevSnap.price === 'number' && prevSnap.price > 0) {
          if (
            hasIncompatibleLegacyUnitPrice(
              observationId,
              prevSnap.price,
              prevSnap.unit,
              spec.targetUnit
            )
          ) {
            if (finalListPrice > finalPrice + 0.005) {
              previousPrice = finalListPrice;
              changeAmount = Number((finalPrice - previousPrice).toFixed(2));
              changePercentage = Number((((finalPrice - previousPrice) / previousPrice) * 100).toFixed(1));
              trend = 'down';
              changeLabel = `${changePercentage}% vs precio regular`;
            } else {
              previousPrice = finalPrice;
              changeAmount = 0;
              changePercentage = 0;
              trend = 'stable';
              changeLabel = 'Sin cambio respecto a lectura previa';
            }
          } else if (Math.abs(finalPrice - prevSnap.price) > 0.005) {
            previousPrice = prevSnap.price;
            changeAmount = Number((finalPrice - previousPrice).toFixed(2));
            changePercentage = Number((((finalPrice - previousPrice) / previousPrice) * 100).toFixed(1));
            if (changeAmount > 0.005) {
              trend = 'up';
              changeLabel = `+${changePercentage}%`;
            } else {
              trend = 'down';
              changeLabel = `${changePercentage}%`;
            }
          } else if (finalListPrice > finalPrice + 0.005) {
            previousPrice = finalListPrice;
            changeAmount = Number((finalPrice - previousPrice).toFixed(2));
            changePercentage = Number((((finalPrice - previousPrice) / previousPrice) * 100).toFixed(1));
            trend = 'down';
            changeLabel = `${changePercentage}% vs precio regular`;
          } else {
            previousPrice = prevSnap.price;
            changeAmount = 0;
            changePercentage = 0;
            trend = 'stable';
            changeLabel = 'Sin cambio respecto a lectura previa';
          }
        } else if (finalListPrice > finalPrice + 0.005) {
          previousPrice = finalListPrice;
          changeAmount = Number((finalPrice - previousPrice).toFixed(2));
          changePercentage = Number((((finalPrice - previousPrice) / previousPrice) * 100).toFixed(1));
          trend = 'down';
          changeLabel = `${changePercentage}% vs precio regular`;
        }

        const isPromotional = finalPrice < finalListPrice;
        const priceType = isPromotional ? 'promocional' : 'regular';
        const availability = finalAvailableQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
        const normalizedUnitPrice = Number((finalPrice / spec.normalizedDivisor).toFixed(2));
        const normalizedUnitLabel = `S/ ${normalizedUnitPrice.toFixed(2)} / ${spec.normalizedUnitName}`;

        const candidate: InternetPriceObservation = {
          observationId,
          comparisonGroupKey: spec.comparisonGroupKey,
          source: store.id,
          storeName: store.name,
          productId: evalRes.productId!,
          skuId: evalRes.skuId,
          productName: evalRes.productName!,
          brand: evalRes.brand!,
          presentation: spec.presentationLabel,
          quantity: spec.targetQuantity,
          unit: spec.targetUnit,
          price: finalPrice,
          listPrice: finalListPrice,
          isPromotional,
          priceType,
          normalizedUnitPrice,
          normalizedUnitLabel,
          previousPrice,
          changeAmount,
          changePercentage,
          trend,
          changeLabel,
          availability,
          availableQuantity: finalAvailableQuantity,
          geographicScope,
          scope: geographicScope,
          isLocalHuanuco,
          sellerId,
          branchName,
          pickupPointId,
          locationBadge,
          locationNote,
          trustLabel: 'REFERENCIA ONLINE',
          sourceUrl: evalRes.sourceUrl!,
          retrievedAt,
          expiresAt,
          isExpired: false,
        };

        // Selección de mejor candidato:
        // 1. Prioridad absoluta: Disponible en Huánuco (geographicScope === 'HUANUCO') y en stock
        // 2. Segunda opción: En stock nacional
        // 3. Menor precio a igualdad de condiciones
        if (!bestCandidateForStoreAndGroup) {
          bestCandidateForStoreAndGroup = candidate;
        } else {
          const currHuanuco = bestCandidateForStoreAndGroup.geographicScope === 'HUANUCO';
          const newHuanuco = candidate.geographicScope === 'HUANUCO';
          const currStock = bestCandidateForStoreAndGroup.availability === 'IN_STOCK';
          const newStock = candidate.availability === 'IN_STOCK';

          if (newHuanuco && !currHuanuco) {
            bestCandidateForStoreAndGroup = candidate;
          } else if (newHuanuco === currHuanuco) {
            if (newStock && !currStock) {
              bestCandidateForStoreAndGroup = candidate;
            } else if (newStock === currStock && candidate.price < bestCandidateForStoreAndGroup.price) {
              bestCandidateForStoreAndGroup = candidate;
            }
          }
        }
      }

      if (
        bestCandidateForStoreAndGroup &&
        bestCandidateForStoreAndGroup.availability === 'IN_STOCK' &&
        ((store.id !== 'metro' && store.id !== 'promart') ||
          bestCandidateForStoreAndGroup.geographicScope === 'HUANUCO')
      ) {
        break;
      }
    }

    if (bestCandidateForStoreAndGroup) {
      observationsByGroup.set(spec.comparisonGroupKey, bestCandidateForStoreAndGroup);
    }
  }

  if (successfulQueries === 0 && failedQueries > 0) {
    return {
      store,
      success: false,
      errorMessage: lastErrorMsg || 'No se pudo conectar con la fuente',
      observationsByGroup,
      discardedSamples,
    };
  }

  return {
    store,
    success: true,
    observationsByGroup,
    discardedSamples,
  };
}

export interface FullInternetSyncReport {
  syncedAt: string;
  sources: InternetPriceSourceStatus[];
  groups: InternetPriceGroup[];
  newSnapshots: Array<{
    observationId: string;
    price: number;
    updatedAt: string;
    source: InternetStoreId;
    productId: string;
    unit: string;
    normalizedUnitName: string;
  }>;
  discardedSamples: DiscardedProductLog[];
  successfulSourcesCount: number;
  validProductsCount: number;
  sourceErrors: Record<string, string>;
}

/**
 * Ejecuta la sincronización completa contra las 4 fuentes VTEX usando Promise.allSettled()
 * para que la caída de una tienda nunca detenga a las demás.
 */
export async function executeInternetPriceSync(
  previousSnapshots: Map<string, { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }>,
  previousGroupsMap: Map<string, InternetPriceGroup>,
  previousSourcesMap: Map<string, InternetPriceSourceStatus>
): Promise<FullInternetSyncReport> {
  const syncedAt = new Date().toISOString();
  const nextFetchAt = computeNextScheduledFetchIso(new Date());

  const settled = await Promise.allSettled(
    INTERNET_STORES.map((store) => syncSingleStore(store, previousSnapshots))
  );

  const sourcesStatus: InternetPriceSourceStatus[] = [];
  const storeResults = new Map<InternetStoreId, StoreSyncResult>();
  const allDiscarded: DiscardedProductLog[] = [];
  const sourceErrors: Record<string, string> = {};
  let successfulSourcesCount = 0;

  settled.forEach((res, idx) => {
    const store = INTERNET_STORES[idx];
    const prevSource = previousSourcesMap.get(store.id);

    if (res.status === 'fulfilled' && res.value.success) {
      successfulSourcesCount++;
      storeResults.set(store.id, res.value);
      allDiscarded.push(...res.value.discardedSamples);
      sourcesStatus.push({
        source: store.id,
        name: store.name,
        domain: store.domain,
        geographicScope: store.geographicScope,
        locationBadge: store.locationBadge,
        locationNote: store.locationNote,
        lastFetchedAt: syncedAt,
        nextFetchAt,
        fetchStatus: 'OK',
        errorCount: 0,
        lastError: null,
        dataAge: 'Hace menos de 1 min',
        dataAgeMinutes: 0,
        sourceReliability: prevSource
          ? Math.min(100, Math.round(prevSource.sourceReliability * 0.8 + 20))
          : 100,
      });
    } else {
      const errMsg =
        res.status === 'rejected'
          ? String(res.reason?.message || res.reason)
          : res.value.errorMessage || 'Fallo al consultar fuente';
      sourceErrors[store.id] = errMsg;
      const prevErrCount = prevSource?.errorCount || 0;
      const prevLastFetched = prevSource?.lastFetchedAt || null;
      const ageInfo = formatDataAge(prevLastFetched);

      sourcesStatus.push({
        source: store.id,
        name: store.name,
        domain: store.domain,
        geographicScope: store.geographicScope,
        locationBadge: store.locationBadge,
        locationNote: store.locationNote,
        lastFetchedAt: prevLastFetched,
        nextFetchAt,
        fetchStatus: 'ERROR',
        errorCount: prevErrCount + 1,
        lastError: errMsg,
        dataAge: ageInfo.dataAge,
        dataAgeMinutes: ageInfo.dataAgeMinutes,
        sourceReliability: prevSource ? Math.max(0, prevSource.sourceReliability - 25) : 0,
      });
    }
  });

  const groups: InternetPriceGroup[] = [];
  const newSnapshots: Array<{
    observationId: string;
    price: number;
    updatedAt: string;
    source: InternetStoreId;
    productId: string;
    unit: string;
    normalizedUnitName: string;
  }> = [];

  for (const spec of WHITELIST_PRODUCT_GROUPS) {
    const groupObservations: InternetPriceObservation[] = [];
    const prevGroup = previousGroupsMap.get(spec.comparisonGroupKey);

    for (const store of INTERNET_STORES) {
      const storeRes = storeResults.get(store.id);
      if (storeRes) {
        const freshObs = storeRes.observationsByGroup.get(spec.comparisonGroupKey);
        if (freshObs) {
          groupObservations.push(freshObs);
          newSnapshots.push({
            observationId: freshObs.observationId,
            price: freshObs.price,
            updatedAt: syncedAt,
            source: freshObs.source,
            productId: freshObs.productId,
            unit: freshObs.unit,
            normalizedUnitName: spec.normalizedUnitName,
          });
        }
      } else if (prevGroup) {
        // Si la fuente falló, conservar observación anterior marcando si ya venció (>24h)
        const prevObs = prevGroup.observations.find((o) => o.source === store.id);
        if (prevObs) {
          groupObservations.push({
            ...prevObs,
            isExpired: true, // Regla 10: Si una fuente falla, conservar datos anteriores únicamente como "dato vencido"
          });
        }
      }
    }

    // Ordenar observaciones con prioridad geográfica absoluta:
    // 1. Vigentes antes que vencidas
    // 2. HUANUCO siempre primero antes que LIMA_NACIONAL
    // 3. En stock antes que agotadas
    // 4. Precio ascendente dentro del mismo alcance geográfico
    groupObservations.sort((a, b) => {
      if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
      const aHuanuco = (a.geographicScope || a.scope) === 'HUANUCO' || a.isLocalHuanuco === true;
      const bHuanuco = (b.geographicScope || b.scope) === 'HUANUCO' || b.isLocalHuanuco === true;
      if (aHuanuco !== bHuanuco) return aHuanuco ? -1 : 1;
      const aStock = a.availability === 'IN_STOCK';
      const bStock = b.availability === 'IN_STOCK';
      if (aStock !== bStock) return aStock ? -1 : 1;
      return a.price - b.price;
    });

    const stats = computeGroupStatistics(groupObservations);

    groups.push({
      comparisonGroupKey: spec.comparisonGroupKey,
      productBaseName: spec.productBaseName,
      presentationLabel: spec.presentationLabel,
      icon: spec.icon,
      category: spec.category,
      targetQuantity: spec.targetQuantity,
      targetUnit: spec.targetUnit,
      normalizedUnitName: spec.normalizedUnitName,
      lowestPrice: stats.lowestPrice,
      highestPrice: stats.highestPrice,
      averagePrice: stats.averagePrice,
      medianPrice: stats.medianPrice,
      lowestNormalizedUnitPrice: stats.lowestNormalizedUnitPrice,
      sourcesCount: stats.sourcesCount,
      hasHuanucoPrice: stats.hasHuanucoPrice,
      primaryGeographicScope: stats.primaryGeographicScope,
      huanucoLowestPrice: stats.huanucoLowestPrice,
      huanucoAveragePrice: stats.huanucoAveragePrice,
      huanucoHighestPrice: stats.huanucoHighestPrice,
      huanucoSourcesCount: stats.huanucoSourcesCount,
      nationalLowestPrice: stats.nationalLowestPrice,
      nationalAveragePrice: stats.nationalAveragePrice,
      nationalHighestPrice: stats.nationalHighestPrice,
      nationalSourcesCount: stats.nationalSourcesCount,
      updatedAt: stats.sourcesCount > 0 ? syncedAt : prevGroup?.updatedAt || null,
      trustLabel: 'REFERENCIA ONLINE',
      observations: groupObservations,
    });
  }

  const validProductsCount = groups.reduce((acc, g) => acc + g.sourcesCount, 0);

  return {
    syncedAt,
    sources: sourcesStatus,
    groups,
    newSnapshots,
    discardedSamples: allDiscarded.slice(0, 40),
    successfulSourcesCount,
    validProductsCount,
    sourceErrors,
  };
}
