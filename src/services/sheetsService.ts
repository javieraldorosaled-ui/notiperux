import { PriceItem, FuelStation, OfferItem, CommunityReport } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const OAUTH_CLIENT_ID = '660934560178-jq2dn7tklstqguavnah1612j6tvl5dg4.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let accessToken: string | null = null;
let tokenExpiryTime = 0;

export function getStoredToken(): string | null {
  if (accessToken && Date.now() < tokenExpiryTime) {
    return accessToken;
  }
  const saved = localStorage.getItem('huanuco_precios_sheets_token');
  const expiry = localStorage.getItem('huanuco_precios_sheets_expiry');
  if (saved && expiry && Date.now() < Number(expiry)) {
    accessToken = saved;
    tokenExpiryTime = Number(expiry);
    return saved;
  }
  return null;
}

export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('La librería Google Identity Services no ha cargado aún.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error));
            return;
          }
          if (resp.access_token) {
            accessToken = resp.access_token;
            tokenExpiryTime = Date.now() + 3500 * 1000;
            localStorage.setItem('huanuco_precios_sheets_token', resp.access_token);
            localStorage.setItem('huanuco_precios_sheets_expiry', String(tokenExpiryTime));
            resolve(resp.access_token);
          } else {
            reject(new Error('No se recibió token de acceso'));
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

export function disconnectGoogleSheets() {
  accessToken = null;
  tokenExpiryTime = 0;
  localStorage.removeItem('huanuco_precios_sheets_token');
  localStorage.removeItem('huanuco_precios_sheets_expiry');
  localStorage.removeItem('huanuco_precios_current_sheet_id');
  localStorage.removeItem('huanuco_precios_current_sheet_url');
}

export interface SyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  syncedRows: number;
  timestamp: string;
}

export async function syncDataToGoogleSheets(
  prices: PriceItem[],
  fuels: FuelStation[],
  offers: OfferItem[],
  reports: CommunityReport[]
): Promise<SyncResult> {
  let token = getStoredToken();
  if (!token) {
    token = await requestGoogleAccessToken();
  }

  // Check if user already created a sheet in local storage
  let spreadsheetId = localStorage.getItem('huanuco_precios_current_sheet_id');
  let spreadsheetUrl = localStorage.getItem('huanuco_precios_current_sheet_url');

  if (!spreadsheetId) {
    // Create new spreadsheet
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Huánuco Precios - Monitoreo Diario (${new Date().toLocaleDateString('es-PE')})`,
        },
        sheets: [
          { properties: { title: 'Precios Alimentos y Canasta' } },
          { properties: { title: 'Combustibles Huánuco' } },
          { properties: { title: 'Ofertas Verificadas' } },
          { properties: { title: 'Reportes Comunidad' } },
        ],
      }),
    });

    if (!createResp.ok) {
      const errJson = await createResp.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Error al crear la hoja de cálculo en Google Sheets');
    }

    const sheetData = await createResp.json();
    spreadsheetId = sheetData.spreadsheetId;
    spreadsheetUrl = sheetData.spreadsheetUrl;

    if (spreadsheetId && spreadsheetUrl) {
      localStorage.setItem('huanuco_precios_current_sheet_id', spreadsheetId);
      localStorage.setItem('huanuco_precios_current_sheet_url', spreadsheetUrl);
    }
  }

  // Prepare batch updates
  const priceValues = [
    ['ID', 'Producto', 'Categoría', 'Unidad', 'Precio Anterior (S/)', 'Precio Actual (S/)', 'Variación (%)', 'Tendencia', 'Mercado / Establecimiento', 'Distrito', 'Fecha Actualización', 'Estado'],
    ...prices.map((p) => [
      p.id,
      p.name,
      p.category,
      p.unit,
      p.previousPrice,
      p.currentPrice,
      p.changePercentage,
      p.trend === 'up' ? 'SUBIÓ' : p.trend === 'down' ? 'BAJÓ' : 'ESTABLE',
      p.storeOrMarket,
      p.district,
      p.updatedAt,
      p.verificationStatus || 'VERIFICADO'
    ])
  ];

  const fuelValues = [
    ['Estación / Grifo', 'Distrito', 'Dirección', 'Gasolina 90 (S/)', 'Gasolina 95 (S/)', 'Diésel DB5 (S/)', 'GLP Galón (S/)', 'Última Actualización', 'Estado'],
    ...fuels.map((f) => [
      f.name,
      f.district,
      f.address,
      f.gas90,
      f.gas95,
      f.diesel,
      f.glp,
      f.updatedAt,
      f.verificationStatus || 'REFERENCIAL'
    ])
  ];

  const offerValues = [
    ['Producto / Promoción', 'Unidad', 'Precio Regular (S/)', 'Precio Oferta (S/)', 'Ahorro (%)', 'Establecimiento', 'Ubicación', 'Válido Hasta', 'Verificado', 'Fuente'],
    ...offers.map((o) => [
      o.title,
      o.unit,
      o.originalPrice,
      o.offerPrice,
      o.discountPercentage,
      o.store,
      o.location,
      o.validUntil,
      o.isVerified ? 'VERIFICADO' : 'POR COMPROBAR',
      o.source
    ])
  ];

  const reportValues = [
    ['ID', 'Tipo', 'Producto', 'Precio (S/)', 'Comercio / Mercado', 'Distrito', 'Fecha Reporte', 'Comentario', 'Estado'],
    ...reports.map((r) => [
      r.id,
      r.type === 'offer' ? 'OFERTA' : 'PRECIO REGULAR',
      r.product,
      r.price,
      r.storeName,
      r.district,
      r.date,
      r.comment || '',
      r.isVerified ? 'VERIFICADO' : 'EN REVISIÓN'
    ])
  ];

  // Push values to Google Sheets via ValueRange batchUpdate
  const batchBody = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Precios Alimentos y Canasta'!A1",
        values: priceValues,
      },
      {
        range: "'Combustibles Huánuco'!A1",
        values: fuelValues,
      },
      {
        range: "'Ofertas Verificadas'!A1",
        values: offerValues,
      },
      {
        range: "'Reportes Comunidad'!A1",
        values: reportValues,
      },
    ],
  };

  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchBody),
    }
  );

  if (!updateResp.ok) {
    const err = await updateResp.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al actualizar celdas en Google Sheets');
  }

  const timestamp = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const totalRows = priceValues.length + fuelValues.length + offerValues.length + reportValues.length;

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    syncedRows: totalRows,
    timestamp,
  };
}
