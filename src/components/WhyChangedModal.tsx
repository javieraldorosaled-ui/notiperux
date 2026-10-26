import React from 'react';
import { X, ArrowUpRight, ArrowDownRight, Info, CheckCircle, Truck, CloudSun, Layers } from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import { PriceExplanation } from '../types';

interface WhyChangedModalProps {
  explanation: PriceExplanation | null;
  onClose: () => void;
}

export const WhyChangedModal: React.FC<WhyChangedModalProps> = ({
  explanation,
  onClose,
}) => {
  if (!explanation) return null;

  const isUp = explanation.trend === 'up';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#BAD0B5] max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-xl flex items-center justify-center border ${
                isUp
                  ? 'bg-[#FDD9C5] text-[#BF1C10] border-[#BF1C10]/30'
                  : 'bg-[#D8EACF] text-[#165338] border-[#BAD0B5]'
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-5 h-5 stroke-[2.5px]" />
              ) : (
                <ArrowDownRight className="w-5 h-5 stroke-[2.5px]" />
              )}
            </span>
            <div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isUp ? 'text-[#BF1C10]' : 'text-[#165338]'
                }`}
              >
                {isUp ? 'Tendencia al alza' : 'Tendencia a la baja'}
              </span>
              <h2 className="text-base font-bold text-[#102610] leading-snug">
                {explanation.productName}
              </h2>
            </div>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar explicación de precio" />
        </div>

        <div className="space-y-4">
          {/* Main Question Headline */}
          <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5]">
            <h3 className="text-sm font-bold text-[#102610] mb-1.5">
              {explanation.headline}
            </h3>
            <p className="text-xs text-[#56654F] leading-relaxed">
              {explanation.shortSummary}
            </p>
          </div>

          {/* Detailed simple explanation */}
          <div>
            <h4 className="text-xs font-semibold text-[#56654F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#7A886F]" />
              <span>Explicación práctica para el consumidor</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#102610] leading-relaxed bg-[#E6F1DE] border border-[#BAD0B5] p-3.5 rounded-2xl shadow-xs">
              {explanation.detailedReason}
            </p>
          </div>

          {/* Key factors */}
          <div>
            <h4 className="text-xs font-semibold text-[#56654F] uppercase tracking-wider mb-2">
              Factores determinantes en Huánuco:
            </h4>
            <div className="space-y-2">
              {explanation.factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#D8EACF] border border-[#BAD0B5] text-xs text-[#102610]"
                >
                  <CheckCircle className="w-4 h-4 text-[#165338] shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Reference */}
          <div className="p-3 bg-[#E6F1DE] rounded-xl text-[11px] text-[#56654F] flex items-center justify-between border border-[#BAD0B5]">
            <span>Fuente informativa:</span>
            <span className="font-medium text-[#102610]">{explanation.sourceReference}</span>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-[#BAD0B5]">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#165338] hover:bg-[#102610] text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
