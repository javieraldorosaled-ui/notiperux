import React, { useState, useEffect } from 'react';
import { X, Table, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Download, FileSpreadsheet, Lock } from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import { PriceItem, FuelStation, OfferItem, CommunityReport } from '../types';
import {
  syncDataToGoogleSheets,
  getStoredToken,
  requestGoogleAccessToken,
  disconnectGoogleSheets,
  SyncResult
} from '../services/sheetsService';

interface SheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices: PriceItem[];
  fuels: FuelStation[];
  offers: OfferItem[];
  reports: CommunityReport[];
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  onClose,
  prices,
  fuels,
  offers,
  reports,
}) => {
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = getStoredToken();
      setIsConnected(!!token);
      const savedUrl = localStorage.getItem('huanuco_precios_current_sheet_url');
      const savedId = localStorage.getItem('huanuco_precios_current_sheet_id');
      if (savedUrl && savedId && !syncResult) {
        setSyncResult({
          spreadsheetId: savedId,
          spreadsheetUrl: savedUrl,
          syncedRows: prices.length + fuels.length + offers.length + reports.length,
          timestamp: 'Previamente sincronizado',
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await syncDataToGoogleSheets(prices, fuels, offers, reports);
      setSyncResult(result);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Sheets sync error:', err);
      setError(err?.message || 'No se pudo sincronizar con Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleSheets();
    setIsConnected(false);
    setSyncResult(null);
  };

  const exportLocalCSV = () => {
    const headers = ['Producto', 'Categoria', 'Unidad', 'Precio_Anterior', 'Precio_Actual', 'Variacion_Pct', 'Tendencia', 'Mercado', 'Distrito', 'Fecha'];
    const rows = prices.map(p => [
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.previousPrice,
      p.currentPrice,
      p.changePercentage,
      p.trend,
      `"${p.storeOrMarket}"`,
      `"${p.district}"`,
      `"${p.updatedAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `huanuco_precios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#BAD0B5] max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102610] leading-tight">
                Google Sheets
              </h2>
              <p className="text-xs text-[#56654F]">
                Sincronización y registro de precios de Huánuco
              </p>
            </div>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar sincronización con Google Sheets" />
        </div>

        <div className="space-y-4">
          <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5] text-xs text-[#56654F] leading-relaxed">
            <p className="font-semibold text-[#102610] mb-1">
              Conexión directa con Google Workspace:
            </p>
            Permite exportar y mantener una hoja de cálculo actualizada con los 4 módulos:
            <span className="font-medium text-[#165338]"> Precios diarios, Grifos y combustibles, Ofertas verificadas y Reportes ciudadanos de Huánuco</span>.
          </div>

          {error && (
            <div className="p-3.5 bg-[#FDD9C5] border border-[#BF1C10]/30 rounded-2xl flex items-start gap-2.5 text-xs text-[#BF1C10]">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#BF1C10] mt-0.5" />
              <div>
                <p className="font-semibold">Aviso de sincronización:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {syncResult && (
            <div className="p-4 bg-[#D8EACF] border border-[#BAD0B5] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#165338] font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#165338]" />
                <span>Hoja de cálculo activa y sincronizada</span>
              </div>
              <p className="text-xs text-[#56654F]">
                Se registraron <span className="font-semibold text-[#102610]">{syncResult.syncedRows} filas</span> de datos de Huánuco.
              </p>
              <div className="pt-2">
                <a
                  href={syncResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F2F8ED] border border-[#BAD0B5] hover:bg-[#E6F1DE] text-[#165338] text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Google Sheets</span>
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={handleSync}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#165338] hover:bg-[#102610] disabled:opacity-60 active:scale-98 transition-all text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Sincronizando con Google Sheets...' : 'Sincronizar datos ahora'}</span>
            </button>

            <button
              onClick={exportLocalCSV}
              type="button"
              className="w-full py-2.5 px-4 bg-[#D8EACF] hover:bg-[#C8DCC3] border border-[#BAD0B5] active:scale-98 transition-all text-[#102610] font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar respaldo en CSV</span>
            </button>
          </div>

          {isConnected && (
            <div className="text-center pt-1">
              <button
                onClick={handleDisconnect}
                className="text-[11px] text-[#7A886F] hover:text-[#BF1C10] transition-colors"
              >
                Desconectar cuenta de Google Sheets
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#BAD0B5] flex items-center justify-between text-[11px] text-[#7A886F]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Acceso seguro oficial OAuth 2.0
          </span>
          <button
            onClick={onClose}
            className="text-[#165338] font-medium hover:underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
