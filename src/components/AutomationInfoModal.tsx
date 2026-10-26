import React from 'react';
import { Cpu, ArrowDown, Database, Check, ShieldCheck, Clock } from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';

interface AutomationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationInfoModal: React.FC<AutomationInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#BAD0B5] max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102610] leading-tight">
                Arquitectura del Motor
              </h2>
              <p className="text-xs text-[#56654F]">
                Flujo de cálculo y verificación automática
              </p>
            </div>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar arquitectura del motor" />
        </div>

        <div className="space-y-4 text-xs text-[#56654F]">
          {/* Pipeline 1: Precios */}
          <div className="bg-[#FDEDD4] p-4 rounded-2xl border border-[#BAD0B5] space-y-2.5">
            <span className="font-bold text-[#102610] flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-[#165338]" />
              Pipeline de Precios Diarios
            </span>
            <div className="space-y-1 font-mono text-[11px] text-[#56654F] bg-[#F1E5D3] p-3 rounded-xl border border-[#BAD0B5]">
              <div className="p-1 text-[#102610] font-semibold">1. PRECIO ANTERIOR</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">2. PRECIO NUEVO</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">3. COMPARAR DIFERENCIA</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">4. CALCULAR PORCENTAJE (Δ%)</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">5. DETERMINAR SUBIÓ / BAJÓ</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#165338] font-bold bg-[#D8EACF] rounded border border-[#BAD0B5]">6. ACTUALIZAR INTERFAZ</div>
            </div>
          </div>

          {/* Pipeline 2: Ofertas */}
          <div className="bg-[#FDEDD4] p-4 rounded-2xl border border-[#BAD0B5] space-y-2.5">
            <span className="font-bold text-[#102610] flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#165338]" />
              Ciclo de Vida de Ofertas
            </span>
            <div className="space-y-1 font-mono text-[11px] text-[#56654F] bg-[#F1E5D3] p-3 rounded-xl border border-[#BAD0B5]">
              <div className="p-1 text-[#102610] font-semibold">1. PRECIO ORIGINAL vs. OFERTA</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">2. CALCULAR DESCUENTO REAL (%)</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">3. COMPROBAR FECHA DE VIGENCIA</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">4. VERIFICAR FUENTE CONFIABLE</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#102610] font-semibold">5. PUBLICAR CON DISTINTIVO</div>
              <div className="text-center text-[#7A886F]">↓</div>
              <div className="p-1 text-[#BF1C10] font-bold bg-[#FDD9C5] rounded border border-[#BF1C10]/30">6. RETIRAR AL VENCER VIGENCIA</div>
            </div>
          </div>

          {/* Future sources */}
          <div className="p-3 bg-[#E6F1DE] border border-[#BAD0B5] rounded-xl space-y-1.5 text-[11px]">
            <span className="font-bold text-[#165338] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Fuentes en integración técnica:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[#56654F]">
              <li>API Osinergmin Facilito (Grifos de Huánuco, Amarilis, Pillco Marca)</li>
              <li>Sistema de Información de Abastecimiento y Precios (SISAP)</li>
              <li>Catálogos oficiales y avisos de establecimientos locales</li>
              <li>Reportes validados por la comunidad vecinal</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#BAD0B5]">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#165338] hover:bg-[#102610] text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
