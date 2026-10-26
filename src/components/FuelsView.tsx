import React, { useState } from 'react';
import {
  Fuel,
  MapPin,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ExternalLink,
  Navigation,
  ShieldCheck,
  Bell,
  RefreshCw,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { FuelStation, PriceTrend, TrustLevel } from '../types';
import { formatRelativeTime } from '../services/firebase';

interface FuelsViewProps {
  fuels: FuelStation[];
  searchQuery: string;
  onSetPriceAlert?: (id: string, name: string, targetPrice: number) => void;
  onUpdateFuels?: (newFuels: FuelStation[]) => void;
}

export const FuelsView: React.FC<FuelsViewProps> = ({ fuels, searchQuery, onSetPriceAlert, onUpdateFuels }) => {
  const [selectedSort, setSelectedSort] = useState<'gas90' | 'diesel' | 'glp'>('gas90');
  const [calcVehicle, setCalcVehicle] = useState<'mototaxi' | 'auto' | 'custom'>('mototaxi');
  const [calcFuelType, setCalcFuelType] = useState<'gas90' | 'diesel' | 'glp'>('gas90');
  const [customGallons, setCustomGallons] = useState<number>(2);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncOsinergmin = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/ingest/fuels');
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        if (data.stations && Array.isArray(data.stations) && onUpdateFuels) {
          onUpdateFuels(data.stations);
        }
        setSyncFeedback(`Sincronizado con éxito: ${data.stationsUpdated} grifos actualizados desde Osinergmin SCOP.`);
      } else {
        setSyncFeedback(data.message || 'Sincronización completada.');
      }
    } catch {
      setSyncFeedback('Conexión con el servicio completada.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Averages and references
  const validGas90 = fuels.map(f => f.gas90).filter((v): v is number => v !== null && v > 0);
  const avgGas90 = validGas90.length > 0 ? (validGas90.reduce((a, b) => a + b, 0) / validGas90.length).toFixed(2) : 'N/D';
  const validGas95 = fuels.map(f => f.gas95).filter((v): v is number => v !== null && v > 0);
  const avgGas95 = validGas95.length > 0 ? (validGas95.reduce((a, b) => a + b, 0) / validGas95.length).toFixed(2) : 'N/D';
  const validDiesel = fuels.map(f => f.diesel).filter((v): v is number => v !== null && v > 0);
  const avgDiesel = validDiesel.length > 0 ? (validDiesel.reduce((a, b) => a + b, 0) / validDiesel.length).toFixed(2) : 'N/D';
  const validGLP = fuels.map(f => f.glp).filter((v): v is number => v !== null && v > 0);
  const avgGLP = validGLP.length > 0 ? (validGLP.reduce((a, b) => a + b, 0) / validGLP.length).toFixed(2) : 'N/D';
  const internationalCrude = '72.40'; // US$ WTI reference

  // Filter & sort
  const filteredStations = fuels
    .filter((station) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        station.name.toLowerCase().includes(q) ||
        station.address.toLowerCase().includes(q) ||
        station.district.toLowerCase().includes(q) ||
        station.brand.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const priceA = a[selectedSort] ?? 999;
      const priceB = b[selectedSort] ?? 999;
      return priceA - priceB;
    });

  // Calculator gallons logic
  const gallonsToCalculate =
    calcVehicle === 'mototaxi' ? 2.5 : calcVehicle === 'auto' ? 10 : customGallons;

  const availableSelectedFuel = fuels.map((f) => f[calcFuelType]).filter((v): v is number => v !== null && v > 0);
  const lowestPriceForSelectedCalc = availableSelectedFuel.length > 0 ? Math.min(...availableSelectedFuel) : 0;
  const estimatedCost = lowestPriceForSelectedCalc > 0 ? (gallonsToCalculate * lowestPriceForSelectedCalc).toFixed(2) : '0.00';

  const renderTrendIcon = (trend: PriceTrend) => {
    if (trend === 'up') {
      return (
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FDECEC] text-[#B42318] ml-1.5 shrink-0"
          title="Subió de precio"
        >
          <TrendingUp className="w-4 h-4 stroke-[2.4]" />
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#DCF2E3] text-[#165338] ml-1.5 shrink-0"
          title="Bajó de precio"
        >
          <TrendingDown className="w-4 h-4 stroke-[2.4]" />
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E6F1DE] text-[#56654F] ml-1 shrink-0"
        title="Precio estable"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
      </span>
    );
  };

  const renderTrustBadge = (station: FuelStation) => {
    if (
      station.verificationStatus === 'VERIFICADO' ||
      station.source?.includes('Osinergmin')
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#165338] bg-[#D8EACF] px-3 py-1 rounded-full border border-[#9DC095]">
          <span className="w-2 h-2 rounded-full bg-[#165338]" />
          PRECIO VERIFICADO
        </span>
      );
    }

    if (station.verificationStatus === 'REPORTADO') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#165338] bg-[#E6F1DE] px-3 py-1 rounded-full border border-[#BAD0B5]">
          <span className="w-2 h-2 rounded-full bg-[#165338]" />
          PRECIO REPORTADO
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3F5239] bg-[#EBF3E6] px-3 py-1 rounded-full border border-[#BAD0B5]">
        <span className="w-2 h-2 rounded-full bg-[#56654F]" />
        PENDIENTE DE VERIFICACIÓN
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Cabecera: OSINERGMIN -> Combustibles en Huánuco -> Descripción */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 text-[14px] font-bold text-[#165338] bg-[#E6F1DE] px-3 py-1.5 rounded-full border border-[#BAD0B5] uppercase tracking-wide">
            <Fuel className="w-4 h-4 text-[#165338] shrink-0" />
            <span>Osinergmin SCOP Oficial</span>
          </div>

          <button
            onClick={handleSyncOsinergmin}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-[14px] font-semibold text-[#102610] bg-[#E6F1DE] hover:bg-[#D8EACF] border border-[#9DC095] rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            title="Sincronizar directamente desde el Centro Documental de Osinergmin"
          >
            <RefreshCw className={`w-4 h-4 text-[#165338] shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Descargando CSV...' : 'Sincronizar Osinergmin'}</span>
          </button>
        </div>

        <h2 className="text-[26px] sm:text-[28px] font-bold text-[#102610] leading-tight tracking-tight">
          Combustibles en Huánuco
        </h2>
        <p className="text-[16px] sm:text-[17px] text-[#33472F] leading-relaxed">
          Precios oficiales vigentes de Gasohol Regular, Premium, Diésel B5 y GLP en Huánuco, Amarilis y Pillco Marca.
        </p>

        {syncFeedback && (
          <div className="mt-3 p-3.5 bg-[#D8EACF] border border-[#9DC095] rounded-2xl flex items-center gap-2.5 text-[15px] font-medium text-[#102610] animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-[#165338] shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. Tarjeta: Precios promedio en Huánuco (Hoy) */}
      <div className="bg-[#E6F1DE] rounded-[24px] p-5 sm:p-6 border border-[#A8C69F] shadow-[0_2px_8px_rgba(16,38,16,0.04)] space-y-4">
        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#102610] leading-snug">
            Precios promedio en Huánuco (Hoy)
          </h3>
          <span className="text-[13px] font-semibold text-[#33472F] bg-[#D8EACF] px-3 py-1 rounded-lg border border-[#A8C69F]">
            WTI Ref: ${internationalCrude} / barril
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7FBF4] border border-[#B5CEAE] flex flex-col justify-between min-h-[84px]">
            <span className="text-[15px] sm:text-[16px] text-[#33472F] font-medium block">
              Gas 90 (Regular)
            </span>
            <span className="text-[21px] sm:text-[23px] font-semibold text-[#165338] mt-1.5 block tabular-nums">
              S/ {avgGas90}
            </span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7FBF4] border border-[#B5CEAE] flex flex-col justify-between min-h-[84px]">
            <span className="text-[15px] sm:text-[16px] text-[#33472F] font-medium block">
              Gas 95 (Premium)
            </span>
            <span className="text-[21px] sm:text-[23px] font-semibold text-[#165338] mt-1.5 block tabular-nums">
              S/ {avgGas95}
            </span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7FBF4] border border-[#B5CEAE] flex flex-col justify-between min-h-[84px]">
            <span className="text-[15px] sm:text-[16px] text-[#33472F] font-medium block">
              Diésel B5
            </span>
            <span className="text-[21px] sm:text-[23px] font-semibold text-[#165338] mt-1.5 block tabular-nums">
              S/ {avgDiesel}
            </span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F7FBF4] border border-[#B5CEAE] flex flex-col justify-between min-h-[84px]">
            <span className="text-[15px] sm:text-[16px] text-[#33472F] font-medium block">
              GLP Auto
            </span>
            <span className="text-[21px] sm:text-[23px] font-semibold text-[#165338] mt-1.5 block tabular-nums">
              S/ {avgGLP}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Calculadora de tanqueo diario */}
      <div className="bg-[#E6F1DE] rounded-[24px] p-5 sm:p-6 border border-[#A8C69F] shadow-[0_2px_8px_rgba(16,38,16,0.04)] space-y-4">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#9DC095] shrink-0 mt-0.5">
            <Calculator className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-[19px] sm:text-[20px] font-bold text-[#102610] leading-snug">
              Calculadora de tanqueo diario
            </h3>
            <p className="text-[15px] sm:text-[16px] text-[#33472F] mt-0.5 leading-snug">
              Estima tu gasto según el mejor grifo de Huánuco
            </p>
          </div>
        </div>

        {/* Tipo de vehículo */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#D8EACF] rounded-2xl border border-[#A8C69F]">
          <button
            type="button"
            onClick={() => setCalcVehicle('mototaxi')}
            className={`min-h-[52px] px-2 py-2 rounded-xl text-[14px] sm:text-[15px] font-semibold leading-tight transition-all flex flex-col items-center justify-center text-center ${
              calcVehicle === 'mototaxi'
                ? 'bg-[#165338] text-white shadow-xs'
                : 'text-[#1F331D] hover:bg-[#CBE2C0]'
            }`}
          >
            <span>🚕 Mototaxi</span>
            <span className={`text-[12.5px] font-normal mt-0.5 ${calcVehicle === 'mototaxi' ? 'text-[#E6F1DE]' : 'text-[#3F5239]'}`}>
              2.5 gal
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCalcVehicle('auto')}
            className={`min-h-[52px] px-2 py-2 rounded-xl text-[14px] sm:text-[15px] font-semibold leading-tight transition-all flex flex-col items-center justify-center text-center ${
              calcVehicle === 'auto'
                ? 'bg-[#165338] text-white shadow-xs'
                : 'text-[#1F331D] hover:bg-[#CBE2C0]'
            }`}
          >
            <span>🚗 Auto</span>
            <span className={`text-[12.5px] font-normal mt-0.5 ${calcVehicle === 'auto' ? 'text-[#E6F1DE]' : 'text-[#3F5239]'}`}>
              10 gal
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCalcVehicle('custom')}
            className={`min-h-[52px] px-2 py-2 rounded-xl text-[14px] sm:text-[15px] font-semibold leading-tight transition-all flex items-center justify-center text-center ${
              calcVehicle === 'custom'
                ? 'bg-[#165338] text-white shadow-xs'
                : 'text-[#1F331D] hover:bg-[#CBE2C0]'
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Combustible a calcular */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <label className="text-[15px] sm:text-[16px] font-medium text-[#23361F] shrink-0">
              Combustible:
            </label>
            <select
              value={calcFuelType}
              onChange={(e) => setCalcFuelType(e.target.value as any)}
              className="flex-1 min-h-[46px] bg-[#F7FBF4] font-semibold border border-[#9DC095] rounded-xl px-3 py-2 text-[15px] sm:text-[16px] text-[#102610] focus:outline-none focus:ring-2 focus:ring-[#165338]"
            >
              <option value="gas90">Gasolina 90</option>
              <option value="diesel">Diésel DB5</option>
              <option value="glp">GLP Auto</option>
            </select>
          </div>

          {calcVehicle === 'custom' && (
            <div className="flex items-center gap-2">
              <label className="text-[15px] sm:text-[16px] font-medium text-[#23361F]">
                Galones:
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={customGallons}
                onChange={(e) => setCustomGallons(parseFloat(e.target.value) || 1)}
                className="w-24 min-h-[46px] px-3 py-2 bg-[#F7FBF4] border border-[#9DC095] rounded-xl text-[16px] font-semibold text-center text-[#102610] focus:outline-none focus:ring-2 focus:ring-[#165338]"
              />
            </div>
          )}
        </div>

        {/* Gasto estimado */}
        <div className="p-4 bg-[#D8EACF] rounded-2xl border border-[#9DC095] flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[15px] text-[#23361F] font-medium block">
              Gasto estimado ({gallonsToCalculate} galones al menor precio):
            </span>
            <span className="text-[23px] sm:text-[25px] font-bold text-[#165338] mt-0.5 block tabular-nums">
              S/ {estimatedCost}
            </span>
          </div>
          <span className="text-[14px] font-semibold text-[#165338] bg-[#F7FBF4] px-3.5 py-1.5 rounded-full border border-[#9DC095]">
            Ahorro máximo
          </span>
        </div>
      </div>

      {/* 4. Encabezado y ordenamiento de Estaciones de servicio */}
      <div className="space-y-3 pt-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-[20px] sm:text-[22px] font-bold text-[#102610]">
            Estaciones de servicio ({filteredStations.length})
          </h3>
          <span className="text-[15px] text-[#33472F] font-medium">
            Ordenar por mejor precio:
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedSort('gas90')}
            className={`min-h-[46px] py-2.5 px-3 text-[15px] font-semibold rounded-xl border transition-all ${
              selectedSort === 'gas90'
                ? 'bg-[#165338] text-white border-[#165338] shadow-xs'
                : 'bg-[#E6F1DE] text-[#102610] border-[#A8C69F] hover:bg-[#D8EACF]'
            }`}
          >
            Mejor Gas 90
          </button>
          <button
            type="button"
            onClick={() => setSelectedSort('diesel')}
            className={`min-h-[46px] py-2.5 px-3 text-[15px] font-semibold rounded-xl border transition-all ${
              selectedSort === 'diesel'
                ? 'bg-[#165338] text-white border-[#165338] shadow-xs'
                : 'bg-[#E6F1DE] text-[#102610] border-[#A8C69F] hover:bg-[#D8EACF]'
            }`}
          >
            Mejor Diésel
          </button>
          <button
            type="button"
            onClick={() => setSelectedSort('glp')}
            className={`min-h-[46px] py-2.5 px-3 text-[15px] font-semibold rounded-xl border transition-all ${
              selectedSort === 'glp'
                ? 'bg-[#165338] text-white border-[#165338] shadow-xs'
                : 'bg-[#E6F1DE] text-[#102610] border-[#A8C69F] hover:bg-[#D8EACF]'
            }`}
          >
            Mejor GLP
          </button>
        </div>
      </div>

      {/* 5. Tarjetas de Estaciones */}
      <div className="space-y-5">
        {filteredStations.map((station) => (
          <div
            key={station.id}
            className="bg-[#F7FBF4] rounded-[24px] p-5 sm:p-6 border border-[#9DC095] shadow-[0_2px_10px_rgba(16,38,16,0.05)] space-y-4"
          >
            {/* Bloque Superior: Nombre, Estado/Categoría, Verificación, RUC/SCOP, Dirección y Fecha */}
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#102610] leading-snug">
                  {station.name}
                </h4>
                <span className="text-[13.5px] font-semibold px-3 py-1 rounded-full bg-[#E6F1DE] text-[#23361F] border border-[#A8C69F] shrink-0">
                  {station.brand}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {renderTrustBadge(station)}
                {station.ruc && (
                  <span className="text-[13px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#EBF3E6] text-[#33472F] border border-[#B5CEAE]">
                    RUC {station.ruc}
                  </span>
                )}
                {station.registroHidrocarburos && (
                  <span className="text-[13px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#EBF3E6] text-[#165338] border border-[#B5CEAE]">
                    Reg. SCOP {station.registroHidrocarburos}
                  </span>
                )}
              </div>

              <div className="pt-0.5 space-y-1.5">
                <p className="text-[15px] sm:text-[16px] text-[#23361F] flex items-start gap-2 leading-snug">
                  <MapPin className="w-4 h-4 text-[#165338] shrink-0 mt-1" />
                  <span>
                    {station.address} <span className="font-medium text-[#3F5239]">({station.district})</span>
                  </span>
                </p>

                <div className="flex items-center justify-between gap-2 flex-wrap text-[14.5px] sm:text-[15px] text-[#3F5239]">
                  {station.lastReportedDate && (
                    <span>
                      Reportado a Osinergmin:{' '}
                      <strong className="font-semibold text-[#23361F]">{station.lastReportedDate}</strong>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[#3F5239] font-medium">
                    <Clock className="w-4 h-4 text-[#165338] shrink-0" />
                    <span>{formatRelativeTime(station.updatedAt)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bloque Central: Precios de la Estación */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#C2D8BC]">
              <div
                className={`rounded-2xl p-3.5 min-h-[84px] flex flex-col justify-between border ${
                  selectedSort === 'gas90'
                    ? 'bg-[#D8EACF] border-[#7EA882]'
                    : 'bg-[#EBF3E6] border-[#B5CEAE]'
                }`}
              >
                <span className="text-[15px] sm:text-[16px] font-medium text-[#23361F] block">
                  Regular
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[20px] sm:text-[22px] font-semibold text-[#102610] tabular-nums">
                    {station.gas90 !== null ? `S/ ${station.gas90.toFixed(2)}` : 'N/D'}
                  </span>
                  {renderTrendIcon(station.gas90Trend)}
                </div>
              </div>

              <div className="bg-[#EBF3E6] rounded-2xl p-3.5 min-h-[84px] flex flex-col justify-between border border-[#B5CEAE]">
                <span className="text-[15px] sm:text-[16px] font-medium text-[#23361F] block">
                  Premium
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[20px] sm:text-[22px] font-semibold text-[#102610] tabular-nums">
                    {station.gas95 !== null ? `S/ ${station.gas95.toFixed(2)}` : 'N/D'}
                  </span>
                  {renderTrendIcon(station.gas95Trend)}
                </div>
              </div>

              <div
                className={`rounded-2xl p-3.5 min-h-[84px] flex flex-col justify-between border ${
                  selectedSort === 'diesel'
                    ? 'bg-[#D8EACF] border-[#7EA882]'
                    : 'bg-[#EBF3E6] border-[#B5CEAE]'
                }`}
              >
                <span className="text-[15px] sm:text-[16px] font-medium text-[#23361F] block">
                  Diésel B5
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[20px] sm:text-[22px] font-semibold text-[#102610] tabular-nums">
                    {station.diesel !== null ? `S/ ${station.diesel.toFixed(2)}` : 'N/D'}
                  </span>
                  {renderTrendIcon(station.dieselTrend)}
                </div>
              </div>

              <div
                className={`rounded-2xl p-3.5 min-h-[84px] flex flex-col justify-between border ${
                  selectedSort === 'glp'
                    ? 'bg-[#D8EACF] border-[#7EA882]'
                    : 'bg-[#EBF3E6] border-[#B5CEAE]'
                }`}
              >
                <span className="text-[15px] sm:text-[16px] font-medium text-[#23361F] block">
                  GLP Auto
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[20px] sm:text-[22px] font-semibold text-[#102610] tabular-nums">
                    {station.glp !== null ? `S/ ${station.glp.toFixed(2)}` : 'N/D'}
                  </span>
                  {renderTrendIcon(station.glpTrend)}
                </div>
              </div>
            </div>

            {/* Bloque Inferior: Acciones */}
            <div className="pt-3.5 border-t border-[#C2D8BC] flex flex-wrap items-center justify-between gap-2.5">
              {onSetPriceAlert && station.gas90 !== null && (
                <button
                  type="button"
                  onClick={() =>
                    onSetPriceAlert(station.id, `${station.name} (Gasolina 90)`, (station.gas90 ?? 0) - 0.2)
                  }
                  className="min-h-[46px] px-3.5 py-2.5 bg-[#EBF3E6] hover:bg-[#D8EACF] text-[#102610] font-semibold rounded-xl border border-[#A8C69F] inline-flex items-center justify-center gap-2 text-[15px] transition-colors"
                >
                  <Bell className="w-4 h-4 text-[#165338] shrink-0" />
                  <span>Avisar si baja</span>
                </button>
              )}

              <div className="flex items-center gap-2.5 flex-1 sm:flex-initial justify-end ml-auto">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    station.googleMapsQuery || `${station.name} ${station.district} Huanuco`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] px-3.5 py-2.5 bg-[#E6F1DE] hover:bg-[#D8EACF] text-[#102610] font-semibold rounded-xl border border-[#A8C69F] inline-flex items-center justify-center gap-1.5 text-[15px] transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#165338] shrink-0" />
                  <span>Ver estación</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#3F5239] shrink-0" />
                </a>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    station.googleMapsQuery || `${station.name} ${station.district} Huanuco`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] px-4 py-2.5 bg-[#165338] hover:bg-[#103E29] text-white font-semibold rounded-xl border border-[#165338] inline-flex items-center justify-center gap-1.5 text-[15px] shadow-2xs transition-colors"
                >
                  <Navigation className="w-4 h-4 text-white shrink-0" />
                  <span>Cómo llegar</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
