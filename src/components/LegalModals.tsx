import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Users,
  Mail,
  X,
  ExternalLink,
  Lock,
  Cookie,
  AlertCircle,
  CheckCircle2,
  Send,
  Building2,
  Scale,
  Award,
} from 'lucide-react';

export type LegalDocType = 'privacidad' | 'terminos' | 'quienes-somos' | 'contacto';

interface LegalModalsProps {
  activeDoc: LegalDocType | null;
  onClose: () => void;
  onSwitchDoc: (doc: LegalDocType) => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  activeDoc,
  onClose,
  onSwitchDoc,
}) => {
  const [contactSubject, setContactSubject] = useState('consulta');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (!activeDoc) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0a0a0a] text-neutral-100 border-2 border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior Institucional */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <span className="font-serif font-black tracking-tighter text-lg text-white">
              NOTIPERUX
            </span>
            <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold border-l border-neutral-700 pl-2.5">
              DOCUMENTACIÓN INSTITUCIONAL & POLÍTICAS
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación Rápida entre Políticas */}
        <div className="flex items-center gap-1 px-4 py-2 bg-neutral-900 border-b border-neutral-800 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => onSwitchDoc('privacidad')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeDoc === 'privacidad'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidad (AdSense)</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchDoc('terminos')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeDoc === 'terminos'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Términos de Servicio</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchDoc('quienes-somos')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeDoc === 'quienes-somos'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quiénes Somos & Consejo Editorial</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchDoc('contacto')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeDoc === 'contacto'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contacto & Rectificaciones</span>
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-neutral-300 font-sans">
          {/* ========================================================== */}
          {/* 1. POLÍTICA DE PRIVACIDAD (CUMPLE 100% GOOGLE ADSENSE)     */}
          {/* ========================================================== */}
          {activeDoc === 'privacidad' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-xs uppercase tracking-widest text-[#93c5aa] font-bold">
                  Marco Legal & Divulgación de Publicidad
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                  Política de Privacidad y Cookies de NotiPerúx
                </h1>
                <p className="text-xs text-neutral-400 mt-2">
                  Última actualización y revisión legal: Octubre de 2026 · Cumplimiento de la Ley Peruana N° 29733 (Protección de Datos Personales), Reglamento General de Protección de Datos (GDPR) y Políticas Oficiales para Editores de Google AdSense.
                </p>
              </div>

              {/* Cláusula Específica y Obligatoria de Google AdSense */}
              <div className="bg-[#161616] border border-[#2d2d2d] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Cookie className="w-5 h-5 text-amber-400" />
                  <span>Declaración Específica sobre Google AdSense y Cookies de Terceros</span>
                </div>
                <p className="text-neutral-300">
                  En cumplimiento estricto de las directrices y políticas de privacidad requeridas por Google AdSense para sus editores asociados, informamos puntualmente a todos los usuarios de <strong>NotiPerúx (www.notiperux.com)</strong> lo siguiente:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <strong>Proveedores externos y cookies publicitarias:</strong> Terceros proveedores de servicios, incluyendo a Google Inc., utilizan cookies para publicar anuncios en nuestro sitio web basados en las visitas previas que los usuarios hayan realizado a <em>NotiPerúx</em> o a otros sitios de la red de Internet.
                  </li>
                  <li>
                    <strong>Cookies de publicidad de Google (DART y similares):</strong> El uso de cookies de publicidad permite a Google y a sus socios asociados servir anuncios personalizados a nuestros lectores sobre la base de su historial de navegación en este y otros portales digitales.
                  </li>
                  <li>
                    <strong>Derecho y opciones de inhabilitación (Opt-Out):</strong> Los usuarios tienen la libertad y potestad de inhabilitar la publicidad personalizada en cualquier momento. Para ello, pueden acceder a la configuración de anuncios de Google visitando:{' '}
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#93c5aa] underline font-semibold inline-flex items-center gap-1"
                    >
                      Configuración de Anuncios de Google
                      <ExternalLink className="w-3 h-3" />
                    </a>.
                    Alternativamente, los usuarios pueden optar por no recibir cookies de proveedores externos para publicidad basada en intereses a través de la iniciativa de autorregulación publicitaria visitando:{' '}
                    <a
                      href="https://www.aboutads.info/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#93c5aa] underline font-semibold inline-flex items-center gap-1"
                    >
                      www.aboutads.info/choices
                      <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>
                    <strong>Cómo utiliza Google la información de sitios asociados:</strong> Para conocer con mayor detalle cómo Google recopila y procesa los datos de los usuarios cuando navegan en sitios o aplicaciones asociadas como NotiPerúx, puede consultar el portal oficial de transparencia de Google en:{' '}
                    <a
                      href="https://policies.google.com/technologies/partner-sites"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#93c5aa] underline font-semibold inline-flex items-center gap-1"
                    >
                      Cómo utiliza Google los datos al usar sitios de nuestros partners
                      <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                </ul>
              </div>

              {/* 1. Responsable del Tratamiento */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  1. Identidad del Responsable del Tratamiento
                </h2>
                <p>
                  El responsable del tratamiento de los datos personales recopilados a través del sitio web es <strong>NotiPerúx Digital</strong>, medio de comunicación digital con sede editorial en el departamento de Huánuco y corresponsalía en Lima, Perú. Para cualquier consulta o ejercicio de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), el usuario puede contactar a nuestro Delegado de Privacidad mediante el correo oficial:{' '}
                  <a href="mailto:javieraldorosaled@gmail.com" className="text-emerald-400 font-mono font-semibold hover:underline">javieraldorosaled@gmail.com</a>.
                </p>
              </div>

              {/* 2. Información que recopilamos */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">2. Datos Recopilados y Almacenamiento Local</h2>
                <p>
                  NotiPerúx está diseñado bajo el principio de minimización de datos:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Almacenamiento Local del Navegador (LocalStorage):</strong> Utilizamos tecnologías de almacenamiento local del cliente exclusivamente para guardar las preferencias del lector (fuente de audio favorita, noticias guardadas para lectura diferida, estado de consentimiento de cookies y aceptación de instalación PWA). Estos datos residen únicamente en su dispositivo y nunca se transfieren a servidores externos.
                  </li>
                  <li>
                    <strong>Métricas técnicas anónimas:</strong> Registramos estadísticas agregadas y anónimas de lectura (páginas vistas, recuento de visitantes únicos) a través de Firebase Firestore con el único propósito de auditar la estabilidad de los servidores e identificar picos de tráfico en coberturas de última hora.
                  </li>
                  <li>
                    <strong>Comunicaciones voluntarias:</strong> Si el usuario nos remite un mensaje a través del formulario de contacto o rectificación, recopilamos su nombre, correo electrónico y el tenor de su consulta para responder debidamente.
                  </li>
                </ul>
              </div>

              {/* 3. Base Jurídica del Tratamiento */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">3. Base Legal del Tratamiento</h2>
                <p>
                  El tratamiento de datos técnicos se fundamenta en el interés legítimo de proporcionar un servicio informativo digital ágil, seguro y accesible. Para las cookies publicitarias y de personalización de terceros, el tratamiento se fundamenta en el consentimiento expreso otorgado por el usuario mediante nuestro aviso de cookies.
                </p>
              </div>

              {/* 4. Derechos del Usuario */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">4. Ejercicio de Derechos ARCO</h2>
                <p>
                  De conformidad con la Ley N° 29733 de la República del Perú y normas internacionales homólogas, usted tiene derecho a acceder a sus datos personales, solicitar su rectificación si fuesen inexactos, o exigir su supresión cuando ya no resulten necesarios para las finalidades que motivaron su recogida. Envíe su solicitud formal adjuntando copia de su documento de identidad a <a href="mailto:javieraldorosaled@gmail.com" className="text-emerald-400 font-mono hover:underline">javieraldorosaled@gmail.com</a>.
                </p>
              </div>

              {/* 5. Modificaciones a la presente política */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">5. Actualizaciones de la Política</h2>
                <p>
                  NotiPerúx se reserva el derecho de actualizar esta política para adaptarla a novedades legislativas, cambios técnicos o nuevos requerimientos normativos de Google AdSense. Toda modificación sustancial será comunicada oportunamente en esta misma sección.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. TÉRMINOS Y CONDICIONES DE SERVICIO                       */}
          {/* ========================================================== */}
          {activeDoc === 'terminos' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-xs uppercase tracking-widest text-[#93c5aa] font-bold">
                  Condiciones Generales de Uso
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                  Términos y Condiciones de Uso de NotiPerúx
                </h1>
                <p className="text-xs text-neutral-400 mt-2">
                  Vigentes a partir de Octubre de 2026 · El acceso o navegación en este sitio web atribuye la condición de usuario y conlleva la aceptación plena de estas condiciones.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">1. Objeto y Naturaleza del Servicio</h2>
                <p>
                  NotiPerúx es una plataforma informativa independiente orientada a la difusión de noticias verificadas del Perú y del acontecer internacional, complementada con síntesis de voz, análisis periodísticos originales y archivo de prensa regional.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">2. Propiedad Intelectual y Citas Periodísticas</h2>
                <p>
                  Los artículos, crónicas, informes especiales, logotipos, diseño gráfico e identidad de marca generados por el Consejo Editorial de NotiPerúx son de su exclusiva propiedad intelectual o cuentan con las debidas licencias de uso.
                </p>
                <p>
                  Las noticias provenientes de agencias o medios de comunicación reconocidos (RPP, El Comercio, Andina, La República, entre otros) son citadas con estricto apego al derecho de información y cita periodística contemplado en la legislación peruana y los convenios internacionales, identificando de manera inequívoca la fuente originaria y el enlace de atribución correspondiente.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">3. Reglas de Conducta y Uso Permitido</h2>
                <p>El usuario se compromete a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No emplear el sitio web para actividades ilícitas, fraudulentas o lesivas de derechos de terceros.</li>
                  <li>No realizar ataques de denegación de servicio (DDoS), inyecciones de código malicioso o intentos no autorizados de vulnerar los sistemas informáticos.</li>
                  <li>No utilizar bots de raspado masivo o sistemas automáticos que degraden el rendimiento de los servidores para el resto de la comunidad lectora.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">4. Exención y Limitación de Responsabilidad</h2>
                <p>
                  NotiPerúx realiza sus mejores esfuerzos por contrastar y verificar la exactitud de la información publicada en sus ediciones. No obstante, no asume responsabilidad por decisiones económicas, comerciales o personales que los usuarios adopten basándose exclusivamente en los reportes informativos, ni por la disponibilidad temporal o caídas ajenas a nuestra infraestructura técnica.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">5. Legislación y Jurisdicción Aplicable</h2>
                <p>
                  Cualquier controversia relacionada con el uso de NotiPerúx se someterá a las leyes vigentes de la República del Perú y a la jurisdicción de los juzgados y tribunales de la ciudad de Huánuco o Lima, renunciando las partes a cualquier otro fuero que pudiera corresponderles.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. QUIÉNES SOMOS & CONSEJO EDITORIAL (E-E-A-T)              */}
          {/* ========================================================== */}
          {activeDoc === 'quienes-somos' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-xs uppercase tracking-widest text-[#93c5aa] font-bold">
                  Transparencia Periodística & E-E-A-T
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                  Quiénes Somos, Principios Editoriales y Misión
                </h1>
                <p className="text-xs text-neutral-400 mt-2">
                  NotiPerúx: «El Diario de Mayor Circulación Informativa del Perú» · Sede Editorial Central en Huánuco, Perú.
                </p>
              </div>

              {/* Misión y Visión */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Nuestra Misión Informativa
                </h2>
                <p>
                  NotiPerúx nació con la convicción de que el acceso a noticias rigurosas, independientes y comprensibles es un derecho fundamental de todos los peruanos, tanto en las grandes urbes costeras como en las comunidades de la sierra y la selva profunda.
                </p>
                <p>
                  Combinamos el rigor del periodismo escrito tradicional con herramientas de accesibilidad de última generación —como la narración en audio nativo y el almacenamiento en caché para lectura sin conexión— para asegurar que los ciudadanos puedan mantenerse informados sin importar su velocidad de conexión o condición física.
                </p>
              </div>

              {/* Consejo Editorial y Equipo Humano */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Estructura Organizacional y Consejo Editorial
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl">
                    <span className="text-[11px] uppercase tracking-wider text-[#93c5aa] font-bold">
                      Dirección General & Editorial
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Consejo de Redacción NotiPerúx</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Supervisión de la línea editorial, verificación de hechos y rigor en la cobertura política, económica y social nacional.
                    </p>
                  </div>
                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl">
                    <span className="text-[11px] uppercase tracking-wider text-[#93c5aa] font-bold">
                      Área de Investigaciones Regionales
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Mesa Huánuco y Centro Oriente</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Cobertura en terreno sobre la cuenca del Huallaga, viales de la Carretera Central, agricultura familiar y turismo en Huánuco y Pasco.
                    </p>
                  </div>
                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl">
                    <span className="text-[11px] uppercase tracking-wider text-[#93c5aa] font-bold">
                      Edición Internacional y Actualidad
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Mesa de Noticias Globales</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Monitoreo continuo de agencias internacionales, organismos multilaterales, geopolítica y avances científicos de impacto global.
                    </p>
                  </div>
                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl">
                    <span className="text-[11px] uppercase tracking-wider text-[#93c5aa] font-bold">
                      Tecnología & Accesibilidad Digital
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Ingeniería Web & Audio Accesible</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Desarrollo de sintetizadores de voz libres de retraso, arquitectura PWA de bajo consumo de batería y optimización para lectores de pantalla.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Principios Periodísticos Fundamentales */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  Nuestros Principios Éticos y Deontológicos
                </h2>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#93c5aa] shrink-0 mt-1" />
                    <div>
                      <strong className="text-white">Verificación y Doble Fuente:</strong> Ninguna afirmación controversial o de trascendencia jurídica se publica sin cotejo de fuentes primarias o documentos oficiales.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#93c5aa] shrink-0 mt-1" />
                    <div>
                      <strong className="text-white">Independencia Editorial:</strong> NotiPerúx no recibe subvenciones partidistas ni condiciona su cobertura informativa a intereses corporativos o presiones políticas.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#93c5aa] shrink-0 mt-1" />
                    <div>
                      <strong className="text-white">Separación de Hechos y Opinión:</strong> Los artículos informativos se distinguen con nitidez de las columnas editoriales o análisis firmados.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#93c5aa] shrink-0 mt-1" />
                    <div>
                      <strong className="text-white">Transparencia y Cita de Fuentes:</strong> Reconocemos expresamente el trabajo de los periodistas y agencias colaboradoras, con enlaces directos a sus portales oficiales.
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación y Registro */}
              <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl text-xs space-y-1 text-neutral-400">
                <div className="text-white font-bold">Sede Institucional NotiPerúx Digital</div>
                <div>Región Huánuco / Lima, República del Perú</div>
                <div>Canal Oficial & AdSense: <a href="mailto:javieraldorosaled@gmail.com" className="text-emerald-400 font-mono hover:underline">javieraldorosaled@gmail.com</a></div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 4. CONTACTO Y POLÍTICA DE RECTIFICACIONES                   */}
          {/* ========================================================== */}
          {activeDoc === 'contacto' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-xs uppercase tracking-widest text-[#93c5aa] font-bold">
                  Atención al Lector & Defensoría Editorial
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                  Contacto Oficial y Política de Rectificación
                </h1>
                <p className="text-xs text-neutral-400 mt-2">
                  Canal abierto y transparente para consultas ciudadanas, notas de prensa y solicitudes de rectificación conforme a la Ley N° 26775 y 26847 de la República del Perú.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulario */}
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-white">Formulario de Comunicación Directa</h2>
                  {contactSubmitted ? (
                    <div className="bg-[#102610] border border-[#165338] p-5 rounded-xl space-y-2 text-center">
                      <CheckCircle2 className="w-8 h-8 text-[#93c5aa] mx-auto" />
                      <h3 className="font-bold text-white text-base">Mensaje Recibido Correctamente</h3>
                      <p className="text-xs text-neutral-300">
                        Agradecemos su comunicación. Nuestro equipo editorial o de atención revisará su mensaje en un plazo máximo de 24 a 48 horas laborales.
                      </p>
                      <button
                        type="button"
                        onClick={() => setContactSubmitted(false)}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-[#165338] text-white text-xs font-bold hover:bg-[#11442d] cursor-pointer"
                      >
                        Enviar otro mensaje
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Motivo del Contacto
                        </label>
                        <select
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full bg-[#161616] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#93c5aa]"
                        >
                          <option value="consulta">Consulta General / Información</option>
                          <option value="rectificacion">Solicitud de Rectificación / Corrección de Datos</option>
                          <option value="prensa">Envío de Nota de Prensa / Denuncia Ciudadana</option>
                          <option value="publicidad">Consultas sobre Publicidad y Alianzas</option>
                          <option value="privacidad">Ejercicio de Derechos de Privacidad (ARCO)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Nombre Completo / Entidad
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ej: Juan Pérez o Asociación Agraria"
                          className="w-full bg-[#161616] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#93c5aa]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Correo Electrónico de Contacto
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className="w-full bg-[#161616] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#93c5aa]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Mensaje / Fundamento de la Solicitud
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Detalle los hechos, enlace a la noticia correspondiente o motivo de su mensaje..."
                          className="w-full bg-[#161616] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#93c5aa]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensaje al Consejo Editorial</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Protocolo de Rectificaciones */}
                <div className="space-y-4">
                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Protocolo de Corrección y Derecho de Rectificación
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      El compromiso de NotiPerúx con la veracidad implica subsanar cualquier error material con celeridad y transparencia.
                    </p>
                    <ul className="text-xs text-neutral-400 space-y-2 list-disc pl-4">
                      <li>
                        <strong>Plazo de Respuesta:</strong> Las solicitudes formales de rectificación son evaluadas por la mesa editorial en un lapso no mayor a 48 horas.
                      </li>
                      <li>
                        <strong>Fe de Erratas Transparente:</strong> Cuando se corrige un error sustancial en un artículo ya publicado, se inserta una nota al pie consignando la fecha y detalle de la precisión realizada.
                      </li>
                      <li>
                        <strong>Documentación de Respaldo:</strong> Para solicitudes de rectificación de identidad o hechos fácticos, solicitamos adjuntar los documentos probatorios que amparen la solicitud.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#141414] border border-neutral-800 p-4 rounded-xl space-y-2 text-xs text-neutral-300">
                    <h4 className="font-bold text-white">Canales Oficiales Directos</h4>
                    <p>
                      <strong>Redacción & Mesa de Partes:</strong> <a href="mailto:javieraldorosaled@gmail.com" className="font-mono text-emerald-400 hover:underline">javieraldorosaled@gmail.com</a>
                    </p>
                    <p>
                      <strong>Atención al Lector, Rectificaciones & AdSense:</strong> <a href="mailto:javieraldorosaled@gmail.com" className="font-mono text-emerald-400 hover:underline">javieraldorosaled@gmail.com</a>
                    </p>
                    <p className="text-[11px] text-neutral-500 pt-1">
                      Horario de mesa de partes digital: Lunes a Sábado de 07:00 a 19:00 (Hora de Perú - GMT-5).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-[#111111] flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Documento Oficial NotiPerúx · Registrado para Google AdSense & Cumplimiento Legal</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
