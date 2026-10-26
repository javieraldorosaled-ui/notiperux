import React, { useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  HelpCircle,
  Cpu,
  Download,
  ShieldCheck,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Truck,
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Check,
  X,
  Lightbulb,
  Settings,
  Smartphone,
} from 'lucide-react';
import { CommunityReport, PriceExplanation } from '../types';
import { verifyCommunityReportInFirestore, rejectCommunityReportInFirestore } from '../services/realDataStore';

interface MoreViewProps {
  reports: CommunityReport[];
  explanations: PriceExplanation[];
  onOpenReport: () => void;
  onOpenSheets: () => void;
  onOpenAutomation: () => void;
  onOpenInstall: () => void;
  onSelectExplanation: (exp: PriceExplanation) => void;
  isStandalone: boolean;
  onModerateReport?: (reportId: string, status: 'verified' | 'rejected', notes?: string) => Promise<void> | void;
}

type MoreSectionKey =
  | 'confianza'
  | 'preguntas'
  | 'factores'
  | 'comunidad'
  | 'tecnica'
  | 'sobre';

export const MoreView: React.FC<MoreViewProps> = ({
  reports,
  explanations,
  onOpenReport,
  onOpenSheets,
  onOpenAutomation,
  onOpenInstall,
  onSelectExplanation,
  isStandalone,
  onModerateReport,
}) => {
  const [openSection, setOpenSection] = useState<MoreSectionKey | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [reviewerName, setReviewerName] = useState('Fiscalizador Cívico Huánuco');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDIENTE' | 'VERIFICADO'>('ALL');
  const [moderationFeedback, setModerationFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  const toggleSection = (key: MoreSectionKey) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const handleVerifyReport = async (report: CommunityReport) => {
    if (onModerateReport) {
      await onModerateReport(report.id, 'verified', 'Verificación física en campo conforme');
      return;
    }

    let currentUserId = localStorage.getItem('huanuco_client_id');
    if (!currentUserId) {
      currentUserId = 'reviewer-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('huanuco_client_id', currentUserId);
    }

    const reviewer = {
      id: currentUserId,
      name: reviewerName.trim() || 'Fiscalizador Autorizado',
    };

    const res = await verifyCommunityReportInFirestore(report.id, reviewer, 'Verificación física en campo conforme');
    setModerationFeedback({ id: report.id, msg: res.message, isError: !res.success });
    setTimeout(() => setModerationFeedback(null), 4000);
  };

  const handleRejectReport = async (report: CommunityReport) => {
    if (onModerateReport) {
      await onModerateReport(report.id, 'rejected', 'Inconsistencia con precio de pizarra');
      return;
    }

    let currentUserId = localStorage.getItem('huanuco_client_id');
    if (!currentUserId) {
      currentUserId = 'reviewer-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('huanuco_client_id', currentUserId);
    }

    const reviewer = {
      id: currentUserId,
      name: reviewerName.trim() || 'Fiscalizador Autorizado',
    };

    const res = await rejectCommunityReportInFirestore(report.id, reviewer, 'Inconsistencia con precio de pizarra');
    setModerationFeedback({ id: report.id, msg: res.message, isError: !res.success });
    setTimeout(() => setModerationFeedback(null), 4000);
  };

  const faqs = [
    {
      q: '¿Esta página vende productos?',
      a: 'NO. Huanurebajas no es una tienda online, ni cobra comisiones. Es una plataforma digital 100% informativa e independiente para que las familias, taxistas y comerciantes sepan qué precios rigen en la ciudad.',
    },
    {
      q: '¿De dónde salen los precios mostrados?',
      a: 'De tres fuentes transparentes: 1) Monitoreo presencial en el Mercado Modelo y Mercado Puelles; 2) Registros públicos de Osinergmin (Facilito) y plantas mayoristas para combustibles; y 3) Reportes directos enviados por la propia comunidad huanuqueña.',
    },
    {
      q: '¿Qué significa "Precio Verificado"?',
      a: 'Indica que el precio fue comprobado físicamente en la pizarra del puesto o estación de servicio en las últimas horas, o validado por múltiples reportes coincidentes.',
    },
    {
      q: '¿Por qué cambian tanto los precios en Huánuco?',
      a: 'Huánuco depende del flujo de camiones pesados por la Carretera Central para productos costeños y combustibles. Además, los alimentos agrícolas dependen directamente de la temporada de cosecha en Pachitea, Ambo y valles del Huallaga.',
    },
    {
      q: '¿Cada cuánto tiempo se actualizan los datos?',
      a: 'Los alimentos se registran en horario matutino con la llegada de camiones a Puelles y apertura del Mercado Modelo (6:00 a. m. a 10:00 a. m.). Los combustibles se refrescan a diario según listas de grifos.',
    },
    {
      q: '¿Cómo puedo reportar un precio u oferta?',
      a: 'Toca el botón "+ Reportar" en la barra superior o en esta sección. Solo necesitas indicar el producto, precio que viste, puesto o grifo, y una foto opcional si lo deseas.',
    },
  ];

  return (
    <div className="space-y-4 pb-10 text-[#102610]">
      {/* ENCABEZADO PRINCIPAL */}
      <div className="bg-[#E6F1DE] rounded-3xl p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)]">
        <h2 className="text-[22px] sm:text-[24px] font-extrabold text-[#165338] tracking-tight leading-tight uppercase">
          MÁS
        </h2>
        <p className="text-[16px] text-[#23361F] font-medium mt-1 leading-snug">
          Información, ayuda y transparencia
        </p>
      </div>

      {/* 1. 🛡️ CÓMO VERIFICAMOS LOS PRECIOS */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('confianza')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                🛡️ Cómo verificamos los precios
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Conoce qué significa cada nivel de confianza
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'confianza' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'confianza' && (
          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#BAD0B5] space-y-3 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-[#D8EACF] border border-[#BAD0B5] flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-[#165338] mt-1.5 shrink-0" />
              <div>
                <span className="text-[16px] font-bold text-[#165338] block">
                  🟢 PRECIO VERIFICADO
                </span>
                <p className="text-[15px] text-[#23361F] mt-1 leading-relaxed">
                  Comprobado físicamente en puesto o grifo, o validado con comprobante oficial.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-[#2179E6] mt-1.5 shrink-0" />
              <div>
                <span className="text-[16px] font-bold text-[#2179E6] block">
                  🔵 PRECIO REPORTADO
                </span>
                <p className="text-[15px] text-[#23361F] mt-1 leading-relaxed">
                  Enviado por un vecino o comprador en Huánuco; de gran utilidad comunitaria.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-[#56654F] mt-1.5 shrink-0" />
              <div>
                <span className="text-[16px] font-bold text-[#102610] block">
                  🟡 PENDIENTE DE VERIFICACIÓN
                </span>
                <p className="text-[15px] text-[#23361F] mt-1 leading-relaxed">
                  Reporte reciente en proceso de confirmación.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F2F8ED] border border-[#BAD0B5] flex items-start gap-3">
              <span className="w-3 h-3 rounded-full bg-[#7A886F] mt-1.5 shrink-0" />
              <div>
                <span className="text-[16px] font-bold text-[#102610] block">
                  ⚪ PRECIO REFERENCIAL
                </span>
                <p className="text-[15px] text-[#23361F] mt-1 leading-relaxed">
                  Promedio estimado del mercado o histórico para orientación general.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. ❓ PREGUNTAS FRECUENTES */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('preguntas')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                ❓ Preguntas frecuentes
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Respuestas claras sobre Huánuco Precios Hoy
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'preguntas' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'preguntas' && (
          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#BAD0B5] divide-y divide-[#BAD0B5]/70 animate-in fade-in">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3 first:pt-1 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-3 text-[16px] font-bold text-[#102610] py-1 hover:text-[#165338] transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#165338] shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="text-[15px] text-[#23361F] mt-2 leading-relaxed bg-[#FDEDD4] p-3.5 rounded-2xl border border-[#BAD0B5] animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. 💡 ¿POR QUÉ CAMBIAN LOS PRECIOS? (+ Carretera Central y Abastecimiento) */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('factores')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                💡 ¿Por qué cambian los precios?
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Conoce algunos factores que pueden influir en los precios.
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'factores' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'factores' && (
          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#BAD0B5] space-y-4 animate-in fade-in">
            {/* Explicaciones de productos existentes */}
            <div className="space-y-2.5">
              {explanations.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => onSelectExplanation(exp)}
                  className="w-full p-3.5 bg-[#FDEDD4] hover:bg-[#FDF0D4] rounded-2xl border border-[#BAD0B5] text-left flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[16px] sm:text-[17px] font-bold text-[#102610] block leading-snug">
                      {exp.productName}
                    </span>
                    <span className="text-[15px] text-[#23361F] block mt-1 leading-relaxed">
                      {exp.shortSummary}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#165338] shrink-0" />
                </button>
              ))}
            </div>

            {/* Carretera Central y Abastecimiento (integrado como información complementaria) */}
            <div className="pt-3 border-t border-[#BAD0B5] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#FDEDD4] text-[#165338] border border-[#BAD0B5]">
                  <Truck className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h4 className="text-[16px] font-bold text-[#102610]">
                    Carretera Central y Abastecimiento
                  </h4>
                  <p className="text-[14px] text-[#23361F]">
                    Factores clave que impactan los precios en Huánuco
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] space-y-1">
                  <div className="flex items-center gap-2 text-[16px] text-[#165338] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#165338] shrink-0" />
                    <span>Carretera Central</span>
                  </div>
                  <p className="text-[15px] text-[#23361F] leading-relaxed">
                    Tránsito fluido en el tramo Cerro de Pasco - San Rafael - Huánuco.
                  </p>
                </div>

                <div className="p-3.5 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] space-y-1">
                  <div className="flex items-center gap-2 text-[16px] text-[#165338] font-bold">
                    <CloudSun className="w-4.5 h-4.5 shrink-0" />
                    <span>Cosechas del Valle</span>
                  </div>
                  <p className="text-[15px] text-[#23361F] leading-relaxed">
                    Alta cosecha de papa en Pachitea y Ambo; buen ingreso a Puelles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. 👥 COMUNIDAD */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('comunidad')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                👥 Comunidad
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Reportes ciudadanos y participación de los usuarios
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'comunidad' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'comunidad' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#BAD0B5] space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="text-[16px] font-bold text-[#102610]">
                  Reportes de la Comunidad ({reports.length})
                </h4>
                <p className="text-[14px] text-[#23361F]">
                  Avisos ciudadanos con trazabilidad de moderación
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`px-3 py-2 text-xs rounded-xl border flex items-center gap-1.5 transition-colors ${
                    showAdminPanel
                      ? 'bg-[#FDEDD4] text-[#102610] border-[#BAD0B5]'
                      : 'bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#102610] border-[#BAD0B5]'
                  }`}
                  title="Panel de verificación administrativa"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-bold">
                    {showAdminPanel ? 'Admin Activo' : 'Modo Admin'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="px-3.5 py-2 bg-[#165338] hover:bg-[#102610] text-white text-[14px] font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Reportar</span>
                </button>
              </div>
            </div>

            {/* Panel de administración opcional */}
            {showAdminPanel && (
              <div className="p-3.5 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-[#102610] text-[14px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#165338]" /> Moderador Autorizado:
                  </span>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="px-2.5 py-1.5 text-[14px] bg-[#F2F8ED] border border-[#BAD0B5] rounded-lg text-[#102610]"
                    placeholder="Nombre del revisor"
                  />
                </div>
                <p className="text-[13px] text-[#23361F] leading-relaxed">
                  * Regla de integridad: No puedes verificar un reporte emitido desde tu propio identificador de dispositivo.
                </p>
              </div>
            )}

            {/* Filtros de estado */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-[14px] font-bold transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-[#165338] text-white'
                    : 'bg-[#D8EACF] text-[#23361F] hover:bg-[#C8DCC3]'
                }`}
              >
                Todos ({reports.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('PENDIENTE')}
                className={`px-3 py-1.5 rounded-xl text-[14px] font-bold transition-colors ${
                  filterStatus === 'PENDIENTE'
                    ? 'bg-[#165338] text-white'
                    : 'bg-[#D8EACF] text-[#23361F] hover:bg-[#C8DCC3]'
                }`}
              >
                Pendientes ({reports.filter((r) => r.status === 'PENDIENTE' || !r.status).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('VERIFICADO')}
                className={`px-3 py-1.5 rounded-xl text-[14px] font-bold transition-colors ${
                  filterStatus === 'VERIFICADO'
                    ? 'bg-[#165338] text-white'
                    : 'bg-[#D8EACF] text-[#23361F] hover:bg-[#C8DCC3]'
                }`}
              >
                Verificados ({reports.filter((r) => r.status === 'VERIFICADO').length})
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="p-4 bg-[#F2F8ED] rounded-2xl border border-[#BAD0B5] text-center text-[15px] text-[#23361F] font-medium">
                Aún no hay reportes comunitarios registrados. ¡Sé el primero en avisar un precio!
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports
                  .filter((r) => {
                    if (filterStatus === 'PENDIENTE') return r.status === 'PENDIENTE' || !r.status;
                    if (filterStatus === 'VERIFICADO') return r.status === 'VERIFICADO';
                    return true;
                  })
                  .slice(0, 6)
                  .map((r) => {
                    const isPending = r.status === 'PENDIENTE' || (!r.status && !r.isVerified);
                    const isVerified = r.status === 'VERIFICADO' || r.isVerified;
                    const isRejected = r.status === 'RECHAZADO';

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[16px] font-bold text-[#102610]">
                              {(r as any).productName || r.product}
                            </span>
                            {isVerified && (
                              <span className="text-[12px] font-bold text-[#165338] bg-[#D8EACF] px-2 py-0.5 rounded-lg border border-[#BAD0B5] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#165338]" /> VERIFICADO
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[12px] font-bold text-[#23361F] bg-[#F1E5D3] px-2 py-0.5 rounded-lg border border-[#BAD0B5] flex items-center gap-1">
                                ⏳ PENDIENTE
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[12px] font-bold text-[#BF1C10] bg-[#FDD9C5] px-2 py-0.5 rounded-lg border border-[#BF1C10]/30 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#BF1C10]" /> RECHAZADO
                              </span>
                            )}
                          </div>
                          <span className="text-[18px] font-extrabold text-[#165338] tabular-nums">
                            S/ {r.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[14px] text-[#23361F] font-medium">
                          <span>
                            🏪 {(r as any).storeOrMarket || r.storeName} ({r.district})
                          </span>
                          <span>{r.date}</span>
                        </div>

                        {r.photoUrl && (
                          <div className="pt-1">
                            <img
                              src={r.photoUrl}
                              alt={(r as any).productName || r.product}
                              className="w-16 h-16 object-cover rounded-lg border border-[#BAD0B5]"
                            />
                          </div>
                        )}

                        {r.comment && (
                          <p className="text-[14px] text-[#23361F] bg-[#F1E5D3] p-2.5 rounded-xl border border-[#BAD0B5]">
                            "{r.comment}"
                          </p>
                        )}

                        {/* Metadatos de verificación */}
                        {isVerified && r.verifiedBy && (
                          <div className="text-[13px] text-[#165338] bg-[#D8EACF] p-2 rounded-lg flex items-center gap-1.5 border border-[#BAD0B5]">
                            <ShieldCheck className="w-4 h-4 text-[#165338] shrink-0" />
                            <span>
                              Verificado por <strong>{r.verifiedBy}</strong>{' '}
                              {r.verifiedAt
                                ? `(${new Date(r.verifiedAt).toLocaleDateString('es-PE')})`
                                : ''}
                            </span>
                          </div>
                        )}

                        {isRejected && r.rejectedBy && (
                          <div className="text-[13px] text-[#BF1C10] bg-[#FDD9C5] p-2 rounded-lg flex items-center gap-1.5 border border-[#BF1C10]/30">
                            <AlertTriangle className="w-4 h-4 text-[#BF1C10] shrink-0" />
                            <span>
                              Rechazado por <strong>{r.rejectedBy}</strong>: {r.moderationNotes}
                            </span>
                          </div>
                        )}

                        {/* Feedback de la acción de moderación */}
                        {moderationFeedback && moderationFeedback.id === r.id && (
                          <div
                            className={`text-[13px] p-2.5 rounded-lg font-medium ${
                              moderationFeedback.isError
                                ? 'bg-[#FDD9C5] text-[#BF1C10] border border-[#BF1C10]/30'
                                : 'bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]'
                            }`}
                          >
                            {moderationFeedback.msg}
                          </div>
                        )}

                        {/* Acciones para moderador */}
                        {showAdminPanel && isPending && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#BAD0B5]">
                            <button
                              type="button"
                              onClick={() => handleRejectReport(r)}
                              className="px-3 py-1.5 bg-[#FDD9C5] hover:opacity-90 text-[#BF1C10] border border-[#BF1C10]/30 rounded-lg text-[13px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyReport(r)}
                              className="px-3 py-1.5 bg-[#165338] hover:bg-[#102610] text-white rounded-lg text-[13px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Verificar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. 📲 INSTALAR HUÁNUCO PRECIOS HOY */}
      {!isStandalone && (
        <section className="p-4 sm:p-5 bg-[#D8EACF] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] space-y-3.5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#165338] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                📲 Instalar Huánuco Precios Hoy
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Accede rápidamente desde la pantalla de tu celular.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstall}
            className="w-full px-4 py-3.5 bg-[#165338] hover:bg-[#102610] text-white text-[15px] sm:text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Download className="w-4.5 h-4.5 text-[#D8EACF] shrink-0" />
            <span>Instalar esta página en móvil como una aplicación</span>
          </button>
        </section>
      )}

      {/* 6. ⚙️ INFORMACIÓN TÉCNICA */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('tecnica')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <Settings className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                ⚙️ Información técnica
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Información avanzada de la plataforma
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'tecnica' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'tecnica' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#BAD0B5] space-y-3.5 animate-in fade-in">
            {/* Google Sheets Integration Card */}
            <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F1DE] text-[#165338] border border-[#BAD0B5] flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-[#102610]">
                      Google Sheets
                    </h4>
                    <p className="text-[14px] text-[#23361F]">
                      Sincronización y exportación de datos
                    </p>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#165338] bg-[#E6F1DE] border border-[#BAD0B5] px-2.5 py-0.5 rounded-full shrink-0">
                  OAuth 2.0
                </span>
              </div>

              <p className="text-[15px] text-[#23361F] leading-relaxed">
                Mantén un registro automatizado de todos los precios de alimentos, grifos y reportes comunitarios en tu propia hoja de cálculo de Google.
              </p>

              <button
                type="button"
                onClick={onOpenSheets}
                className="w-full py-3 px-4 bg-[#165338] hover:bg-[#102610] text-white font-bold text-[15px] rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                <span>Gestionar sincronización</span>
              </button>
            </div>

            {/* Motor de Automatización */}
            <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 text-[#2179E6] border border-blue-200/60 shrink-0">
                  <Cpu className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-[16px] font-bold text-[#102610]">
                    Motor de Automatización
                  </h4>
                  <p className="text-[14px] text-[#23361F]">
                    Algoritmo de cálculo delta % y vigencias
                  </p>
                </div>
              </div>

              <p className="text-[15px] text-[#23361F] leading-relaxed">
                Diseñado para conectar con fuentes oficiales (Facilito, SISAP, catálogos) y calcular automáticamente qué subió, qué bajó y descuentos reales.
              </p>

              <button
                type="button"
                onClick={onOpenAutomation}
                className="w-full py-3 px-3.5 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#102610] border border-[#BAD0B5] text-[15px] font-bold rounded-xl flex items-center justify-between transition-colors"
              >
                <span>Ver flujo del algoritmo</span>
                <ChevronRight className="w-4.5 h-4.5 text-[#165338]" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. ℹ️ SOBRE HUÁNUCO PRECIOS HOY */}
      <section className="bg-[#E6F1DE] rounded-3xl border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('sobre')}
          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#D8EACF]/50 transition-colors"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#102610] leading-snug">
                ℹ️ Sobre Huánuco Precios Hoy
              </h3>
              <p className="text-[15px] text-[#23361F] font-medium mt-0.5 leading-snug">
                Transparencia y Descargo Legal
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#165338] shrink-0 transition-transform duration-200 ${
              openSection === 'sobre' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSection === 'sobre' && (
          <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#BAD0B5] text-[15px] text-[#23361F] space-y-3 animate-in fade-in">
            <h4 className="font-bold text-[#102610] text-[16px] flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-[#165338] shrink-0" />
              <span>Transparencia y Descargo Legal</span>
            </h4>
            <p className="leading-relaxed">
              <strong>Huanurebajas</strong> es una plataforma informativa independiente. Los precios pueden variar según el establecimiento y la hora del día. Información recopilada y actualizada periódicamente para la comunidad.
            </p>
            <p className="leading-relaxed">
              No somos una tienda online, ni intermediamos transacciones comerciales. Toda información se ofrece con fines exclusivamente orientativos para el público consumidor de la región Huánuco.
            </p>
            <div className="pt-2.5 border-t border-[#BAD0B5] flex items-center justify-between text-[13px] font-medium text-[#56654F]">
              <span>Versión 1.2 Mobile-First PWA</span>
              <span>Huánuco, Perú</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
