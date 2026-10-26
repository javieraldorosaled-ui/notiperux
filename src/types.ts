export type CityId = 'huanuco';

export interface CityConfig {
  id: CityId;
  name: string;
  department: string;
  isDefault: boolean;
}

export type PriceTrend = 'up' | 'down' | 'stable';

export type ProductCategory = 'alimentos' | 'combustibles' | 'abarrotes' | 'construccion' | 'hogar';

export type VerificationStatus =
  | 'VERIFICADO'
  | 'REPORTADO'
  | 'PENDIENTE'
  | 'REFERENCIAL'
  | 'NO_DISPONIBLE';

export type TrustLevel = 'verified' | 'reported' | 'pending' | 'referential';

export type PriceType = 'minorista' | 'mayorista' | 'referencial' | 'reportado';

export interface StorePrice {
  id: string;
  storeName: string;
  brand?: string;
  presentation?: string;
  price: number | null;
  district: string;
  address: string;
  googleMapsQuery: string;
  updatedAt: string;
  trustLevel: TrustLevel;
  verificationStatus?: VerificationStatus;
  source?: string;
}

export interface PriceItem {
  id: string;
  name: string;
  brand?: string;
  verifiedPresentation?: string;
  category: ProductCategory;
  unit: string;
  icon: string;
  previousPrice: number | null;
  currentPrice: number | null;
  changePercentage: number;
  trend: PriceTrend;
  storeOrMarket: string;
  district: string;
  address?: string;
  location?: string;
  googleMapsQuery?: string;
  updatedAt: string; // Timestamp ISO real
  createdAt?: string;
  trustLevel: TrustLevel;
  verificationStatus?: VerificationStatus;
  isVerified: boolean;
  source?: string;
  sourceUrl?: string;
  priceType?: PriceType;
  explanationId?: string;
  storePrices?: StorePrice[];
  isDemoData?: boolean;
}

export interface FuelStation {
  id: string;
  name: string;
  brand: 'Primax' | 'Repsol' | 'Petroperú' | 'Pecsa' | 'Independiente' | string;
  address: string;
  district: string;
  location?: string;
  googleMapsQuery: string;
  gas90: number | null;
  gas90Trend: PriceTrend;
  gas95: number | null;
  gas95Trend: PriceTrend;
  diesel: number | null;
  dieselTrend: PriceTrend;
  glp: number | null; // por galón
  glpTrend: PriceTrend;
  updatedAt: string; // Timestamp ISO real
  createdAt?: string;
  trustLevel: TrustLevel;
  verificationStatus?: VerificationStatus;
  source?: string;
  sourceUrl?: string;
  isAvailable?: boolean;
  isDemoData?: boolean;
  ruc?: string;
  registroHidrocarburos?: string;
  rawRazonSocial?: string;
  lastReportedDate?: string;
}

export type PromotionLifecycleStatus = 'PROXIMAMENTE' | 'OFERTA_ACTIVA' | 'PROMOCION_VENCIDA';

export interface OfferItem {
  id: string;
  title: string;
  product?: string;
  productPhotoUrl?: string;
  unit: string;
  category: ProductCategory;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  store: string;
  storePhotoUrl?: string;
  location: string;
  district: string;
  googleMapsQuery: string;
  googleMapsUrl?: string;
  whatsapp?: string;
  hasWhatsapp?: boolean;
  description?: string;
  conditions?: string;
  schedule?: string;
  validFrom?: string;
  validUntil: string;
  promotionStatus?: PromotionLifecycleStatus;
  ownerVendorId?: string;
  isActive?: boolean;
  isVerified: boolean;
  trustLevel: TrustLevel;
  verificationStatus?: VerificationStatus;
  isExpired: boolean;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  verifiedAt?: string;
  updatedAt?: string; // Timestamp ISO real
  createdAt?: string;
  isDemoData?: boolean;
}

export interface PriceExplanation {
  id: string;
  productId: string;
  productName: string;
  trend: 'up' | 'down';
  headline: string;
  shortSummary: string;
  detailedReason: string;
  factors: string[];
  sourceReference: string;
}

export interface CommunityReport {
  id: string;
  type: 'price' | 'offer';
  product: string;
  price: number;
  previousPrice?: number;
  storeName: string;
  location: string;
  district: string;
  date: string;
  validUntil?: string;
  whatsapp?: string;
  description?: string;
  comment?: string;
  photoUrl?: string;
  trustLevel: TrustLevel;
  status: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
  isVerified: boolean;
  createdAt: string;
  authorId?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  moderationNotes?: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice?: number;
  active?: boolean;
  createdAt: string;
}

export interface PriceFeedback {
  id: string;
  productId: string;
  agrees: boolean;
  reportedPrice?: number;
  storeName?: string;
  createdAt: string;
}

export type ActiveTab =
  | 'inicio'
  | 'peru'
  | 'internacional'
  | 'perfil'
  | 'mas'
  | 'precios'
  | 'combustibles'
  | 'ofertas'
  | 'noticias'
  | 'descubre'
  | 'kiosko';

export type DiscoverCategory = 'turisticos' | 'comer';

export interface DiscoverPlace {
  id: string;
  name: string;
  category: DiscoverCategory;
  categoryLabel: 'Lugar turístico' | 'Lugar para comer';
  location: string;
  district: string;
  province: string;
  shortDescription: string;
  whatItOffers: string;
  highlights: string[];
  updateStatus: string;
  verifiedSource: string;
  photoUrl?: string;
  photoAttribution?: string;
  googleMapsQuery?: string;
  googleMapsUrl?: string;
}

export type InternetStoreId = 'plazavea' | 'metro' | 'wong' | 'vega' | 'promart';

export type InternetGeographicScope = 'HUANUCO' | 'LIMA_NACIONAL';

export interface InternetPriceSourceStatus {
  source: InternetStoreId;
  name: string;
  domain: string;
  geographicScope?: InternetGeographicScope;
  locationBadge: string;
  locationNote?: string;
  lastFetchedAt: string | null;
  nextFetchAt: string | null;
  fetchStatus: 'OK' | 'PARTIAL' | 'ERROR' | 'PENDING';
  errorCount: number;
  lastError?: string | null;
  dataAge: string;
  dataAgeMinutes: number | null;
  sourceReliability: number;
}

export interface InternetPriceObservation {
  observationId: string;
  comparisonGroupKey: string;
  source: InternetStoreId;
  storeName: string;
  productId: string;
  skuId?: string;
  productName: string;
  brand: string;
  presentation: string;
  quantity: number;
  unit: 'un' | 'g' | 'kg' | 'ml' | 'L' | 'gal' | 'm';
  price: number;
  listPrice: number;
  isPromotional: boolean;
  priceType: 'promocional' | 'regular';
  normalizedUnitPrice: number;
  normalizedUnitLabel: string;
  previousPrice: number | null;
  changeAmount: number;
  changePercentage: number;
  trend: PriceTrend;
  changeLabel: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK';
  availableQuantity: number;
  geographicScope?: InternetGeographicScope;
  scope?: InternetGeographicScope;
  isLocalHuanuco?: boolean;
  sellerId?: string;
  branchName?: string;
  pickupPointId?: string;
  locationBadge: string;
  locationNote?: string;
  trustLabel: 'REFERENCIA ONLINE';
  sourceUrl: string;
  retrievedAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface InternetPriceGroup {
  comparisonGroupKey: string;
  productBaseName: string;
  presentationLabel: string;
  icon: string;
  category: string;
  targetQuantity: number;
  targetUnit: 'un' | 'g' | 'kg' | 'ml' | 'L' | 'gal' | 'm';
  normalizedUnitName: 'unidad' | 'kg' | 'litro' | 'galón' | 'metro';
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  lowestNormalizedUnitPrice: number | null;
  sourcesCount: number;
  hasHuanucoPrice?: boolean;
  primaryGeographicScope?: InternetGeographicScope;
  huanucoLowestPrice?: number | null;
  huanucoAveragePrice?: number | null;
  huanucoHighestPrice?: number | null;
  huanucoSourcesCount?: number;
  nationalLowestPrice?: number | null;
  nationalAveragePrice?: number | null;
  nationalHighestPrice?: number | null;
  nationalSourcesCount?: number;
  updatedAt: string | null;
  trustLabel: 'REFERENCIA ONLINE';
  observations: InternetPriceObservation[];
}

export interface InternetPricesResponse {
  status: 'OK' | 'EMPTY' | 'ERROR';
  updatedAt: string | null;
  sources: InternetPriceSourceStatus[];
  items: InternetPriceGroup[];
}

export type NewsImageSourceType =
  | 'og:image'
  | 'twitter:image'
  | 'json-ld'
  | 'html-main'
  | 'content-associated'
  | 'article-page'
  | 'rss-media'
  | 'portal-api'
  | 'category-fallback';

export type NewsImageStatusType =
  | 'VERIFIED_REMOTE'
  | 'RESOLVED'
  | 'FALLBACK_CATEGORY';

export type NewsSection = 'peru' | 'internacional';

export interface NewsKeyFacts {
  whatHappened?: string;
  where?: string;
  when?: string;
  whoInvolved?: string;
  currentStatus?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  keyFacts?: NewsKeyFacts;
  whatIsKnown?: string[];
  whyItMatters?: string;
  context?: string;
  isLimitedInfo?: boolean;
  url: string;
  imageUrl?: string | null;
  imageUrlOriginal?: string | null;
  imageUrlResolved?: string | null;
  imageSource?: NewsImageSourceType | string;
  imageStatus?: NewsImageStatusType | string;
  imageFallbackUsed?: boolean;
  sourceId: string;
  sourceName: string;
  sourceDomain?: string;
  publishedAt: string; // ISO string
  fetchedAt: string; // ISO string
  category?: string;
  section: NewsSection;
  country?: string;
  isFeatured?: boolean;
  slug?: string;
  detectedLocations?: string[];
  primaryLocation?: string;
  isVerifiedHuanuco?: boolean;
}

export type HuanucoNewsItem = NewsItem;

export interface NewsSourceStatus {
  id: string;
  name: string;
  rssUrl: string;
  websiteUrl: string;
  enabled: boolean;
  lastFetchedAt: string | null;
  fetchStatus: 'OK' | 'ERROR' | 'PENDING';
  itemsFound: number;
  huanucoItemsAccepted: number;
  lastError?: string | null;
}

export interface HuanucoNewsResponse {
  status: 'OK' | 'EMPTY' | 'ERROR';
  updatedAt: string | null;
  count: number;
  sources: NewsSourceStatus[];
  items: NewsItem[];
}


