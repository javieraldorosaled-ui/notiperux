import { PriceExplanation, PriceTrend } from '../types';

// Automation calculation helper
export function calculatePriceChange(previousPrice: number, currentPrice: number): { changePercentage: number; trend: PriceTrend } {
  const diff = currentPrice - previousPrice;
  const percentage = Number(((diff / previousPrice) * 100).toFixed(1));
  const trend: PriceTrend = diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'stable';
  return { changePercentage: percentage, trend };
}

export function calculateDiscount(originalPrice: number, offerPrice: number): number {
  const diff = originalPrice - offerPrice;
  const percentage = Number(((diff / originalPrice) * 100).toFixed(1));
  return percentage;
}

export const PRICE_EXPLANATIONS: PriceExplanation[] = [
  {
    id: 'exp-huevos',
    productId: 'prod-huevo-rosado',
    productName: 'Huevos de gallina',
    trend: 'up',
    headline: 'Factores que influyen en el precio de los huevos en Huánuco',
    shortSummary: 'Costo de insumos avícolas (maíz y soya) y flete de transporte hacia Huánuco.',
    detailedReason: 'El precio de los huevos en los mercados locales depende principalmente de la cotización del maíz amarillo duro y la soya en las granjas productoras de la costa, así como del costo del flete de carga por la Carretera Central hacia Huánuco.',
    factors: [
      'Variación en el costo del alimento avícola (maíz y soya)',
      'Tarifas de flete de transporte por la Carretera Central',
      'Ciclos de reposición de aves ponedoras en granjas abastecedoras',
    ],
    sourceReference: 'Información educativa sobre factores de abastecimiento avícola',
  },
  {
    id: 'exp-pollo',
    productId: 'prod-pollo-entero',
    productName: 'Pollo limpio entero',
    trend: 'down',
    headline: 'Factores que influyen en el precio del pollo en Huánuco',
    shortSummary: 'Frecuencia de ingreso de camiones de carga viva y producción en granjas.',
    detailedReason: 'El precio del pollo en los puestos del Mercado Modelo y Mercado Puelles varía según el volumen diario de camiones con aves en pie que ingresan a los centros de beneficio de Huánuco y Amarilis desde las zonas productoras.',
    factors: [
      'Volumen de abastecimiento diario en camiones de carga viva',
      'Condiciones de transitabilidad en la Carretera Central',
      'Nivel de oferta mayorista en los centros de distribución locales',
    ],
    sourceReference: 'Información educativa sobre abastecimiento en mercados locales',
  },
  {
    id: 'exp-combustible',
    productId: 'p-2',
    productName: 'Gasolina, Diésel y GLP',
    trend: 'up',
    headline: 'Factores que influyen en el precio de los combustibles en Huánuco',
    shortSummary: 'Listas mayoristas de plantas de abastecimiento y flete de cisternas.',
    detailedReason: 'Los precios en las estaciones de servicio de Huánuco, Amarilis y Pillco Marca reflejan las actualizaciones de las plantas mayoristas de hidrocarburos, la cotización internacional del petróleo y el costo logístico de traslado de cisternas por vía terrestre.',
    factors: [
      'Variación en la cotización internacional del petróleo y derivados',
      'Actualización de listas de precios en plantas de despacho mayorista',
      'Costo logístico de transporte terrestre en cisternas hasta Huánuco',
    ],
    sourceReference: 'Información educativa basada en la cadena de comercialización de hidrocarburos (Osinergmin)',
  },
  {
    id: 'exp-arroz',
    productId: 'prod-arroz-extra',
    productName: 'Arroz extra y abarrotes',
    trend: 'down',
    headline: 'Factores que influyen en el precio del arroz en Huánuco',
    shortSummary: 'Campañas de cosecha en valles arroceros de la selva y costa norte.',
    detailedReason: 'El abastecimiento de arroz en las plataformas mayoristas de Huánuco depende de los ciclos de cosecha en los valles productores de San Martín, Huallaga Central y la costa norte, además de los costos de pilado y transporte.',
    factors: [
      'Temporadas de cosecha en los valles del Huallaga y selva alta',
      'Costos de pilado, secado y distribución mayorista',
      'Ingreso de carga hacia los almacenes mayoristas de Puelles',
    ],
    sourceReference: 'Información educativa sobre cadenas de abastecimiento agrícola',
  },
  {
    id: 'exp-papa',
    productId: 'prod-papa-amarilla',
    productName: 'Papa Amarilla Tumbay',
    trend: 'down',
    headline: 'Factores que influyen en el precio de la papa amarilla en Huánuco',
    shortSummary: 'Estacionalidad de cosechas en Pachitea, Ambo y zonas altoandinas.',
    detailedReason: 'Las cuencas productoras de Huánuco (Pachitea, Ambo y Huamalíes) abastecen directamente a los mercados de la ciudad. El precio varía según la temporada de cosecha, el clima en las zonas altas y el ingreso diario de productores al Mercado Puelles y Mercado Modelo.',
    factors: [
      'Calendario de siembra y cosecha en Panao, Pachitea y Ambo',
      'Condiciones climáticas (lluvias o heladas) en zonas productoras',
      'Volumen de ingreso diario a plataformas mayoristas de Huánuco',
    ],
    sourceReference: 'Información educativa sobre producción agrícola regional en Huánuco',
  },
];

