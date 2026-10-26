import { NewsItem } from '../types';

export interface OriginalReportItem extends NewsItem {
  isOriginalReport: boolean;
  author: string;
  authorRole: string;
  readingTimeMinutes: number;
}

export const ORIGINAL_REPORTS: OriginalReportItem[] = [
  {
    id: 'informe-conectividad-vial-huanuco-centro-peru',
    title: 'Radiografía de la conectividad vial central: El impacto socioeconómico del eje Huánuco - Pasco - Lima y los retos 2025-2026',
    summary: 'Un análisis exhaustivo sobre el estado de la Carretera Central, la Variante de Pasco y las vías alternas que conectan la Amazonía alta con la capital peruana. Más de 2.5 millones de personas dependen de este corredor logístico vital para el abastecimiento agroalimentario nacional.',
    content: `La conectividad terrestre entre la selva central, la sierra y la costa del Perú continúa siendo uno de los ejes neurálgicos más determinantes para la economía del país. Durante décadas, la Carretera Central ha soportado una densidad de carga vehicular que triplica su capacidad original de diseño, convirtiéndose en un cuello de botella constante ante huaicos, derrumbes estacionales y cierres prolongados.

En este informe especial de NotiPerúx, analizamos las implicancias económicas para los productores agrícolas de Huánuco, Leoncio Prado y Pasco, quienes movilizan diariamente más de 12.000 toneladas de alimentos (papa amarilla, plátano, papaya, café, cacao y hortalizas) con destino a los mercados mayoristas de Santa Anita y Caquetá en Lima Metropolitana.

1. El costo logístico de la interrupción vial
Cuando un deslizamiento bloquea el tramo Corcona-San Mateo o la bajada de Ticlio a Casapalca, el sobrecosto por tonelada transportada se eleva hasta en un 45%. Los transportistas se ven forzados a recurrir a rutas alternas como la vía Canta-Huayllay-Vicco o la carretera Cañete-Yauyos-Chupaca, las cuales añaden entre 8 y 14 horas de viaje adicional, mermando la frescura del producto y encareciendo el precio final para las familias consumidoras.

2. Proyectos en curso y perspectivas de infraestructura
El Ministerio de Transportes y Comunicaciones (MTC) junto a Provías Nacional mantienen contratos de conservación vial en el corredor Cerro de Pasco - Huánuco - Tingo María. No obstante, las cámaras de comercio regionales insisten en que la solución definitiva radica en la ejecución célere de la Nueva Carretera Central «Daniel Alcides Carrión» (autopista de cuatro carriles bajo modalidad de gobierno a gobierno), así como el asfaltado definitivo de las vías transversales que comunican Pachitea y Puerto Inca.

3. Impacto en el turismo y la descentralización
Huánuco posee atractivos históricos y arqueológicos invaluables como Kotosh (las Manos Cruzadas), la Casa de la Perricholi en Tomayquichua y los parques nacionales en Tingo María. La previsibilidad y seguridad de las vías de comunicación representan la diferencia entre una temporada turística próspera y pérdidas millonarias para los sectores hotelero, gastronómico y artesanal de la región.`,
    whyItMatters: 'La Carretera Central moviliza el 35% de los productos frescos que consume Lima. Una mejora en los ejes de penetración Huánuco-Pasco-Lima impacta directamente en el bolsillo de millones de consumidores y en los ingresos de miles de familias campesinas.',
    keyFacts: {
      whatHappened: 'Análisis integral de los desafíos logísticos y planes de modernización vial en la sierra central y selva alta.',
      where: 'Eje vial Lima - Cerro de Pasco - Huánuco - Tingo María.',
      when: 'Edición informativa 2025-2026.',
      whoInvolved: 'Ministerio de Transportes (MTC), Provías Nacional, gremios de transportistas y productores agropecuarios.',
      currentStatus: 'Se ejecutan obras de mantenimiento preventivo mientras avanza la estructuración técnica de la nueva autopista central.',
    },
    whatIsKnown: [
      'Más de 12.000 toneladas diarias de alimentos circulan por el eje vial central hacia la capital.',
      'Las interrupciones por precipitaciones elevan hasta 45% los fletes de carga pesada.',
      'Se priorizan tramos alternos como la ruta Canta-Huayllay para mitigar congestionamientos.',
    ],
    context: 'Informe elaborado por el equipo de redacción e investigación económica de NotiPerúx, contrastado con datos de Provías Nacional y reportes de mercados mayoristas.',
    url: 'https://www.notiperux.com/noticia/informe-conectividad-vial-huanuco-centro-peru',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Investigaciones',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Transporte y Vialidad',
    section: 'peru',
    country: 'Perú',
    isFeatured: true,
    isOriginalReport: true,
    author: 'Redacción Central NotiPerúx',
    authorRole: 'Unidad de Investigación y Economía Regional',
    readingTimeMinutes: 5,
  },
  {
    id: 'informe-cacao-cafe-tingo-maria-exportacion',
    title: 'Del cultivo alternativo a la alta gastronomía mundial: El auge del cacao y café especial de Huánuco y la selva alta',
    summary: 'Las cooperativas agrarias de Leoncio Prado y Monzón han consolidado variedades de cacao fino de aroma premiadas en salones internacionales de París. Un informe sobre cómo la tecnificación y el comercio justo transformaron valles enteros.',
    content: `En las últimas dos décadas, el departamento de Huánuco ha protagonizado una de las transiciones agropecuarias más notables del continente suramericano. Lo que en décadas pasadas fueron zonas marcadas por la incertidumbre y el monocultivo ilícito, hoy son cuencas agrícolas modelo con denominación de origen y sellos de sostenibilidad ecológica.

El Valle del Monzón y los alrededores de Tingo María lideran actualmente la exportación de granos de cacao criollo y chuncho con perfiles sensoriales florales y frutales, altamente cotizados por chocolateros artesanales de Suiza, Bélgica y Japón.

1. El rol de las cooperativas agrícolas
Entidades como la Cooperativa Agroindustrial Cacao Alto Huallaga y pequeñas asociaciones comunitarias han permitido que más de 4.000 familias agricultoras negocien directamente con importadores extranjeros, eliminando intermediarios abusivos y asegurando precios de hasta 30% por encima de la cotización estándar en la Bolsa de Nueva York.

2. Sostenibilidad, agroforestería y combate a la deforestación
A diferencia de los modelos de cultivo intensivo que erosionan los suelos amazónicos, los productores huanuqueños han adoptado sistemas agroforestales. El cacao y el café crecen bajo sombra de árboles nativos como el cedro, la capirona y la bolaina, lo que conserva la humedad del suelo, preserva corredores biológicos para aves y fauna silvestre, y contribuye a la captura de carbono.

3. Desafíos fitosanitarios y regulación europea
A partir de la entrada en vigencia del reglamento de la Unión Europea sobre deforestación (EUDR) y las estrictas normativas sobre niveles de cadmio en el cacao, los agricultores huanuqueños requieren mayor apoyo de los centros de investigación como el INIA y las facultades de agronomía de la Universidad Nacional Agraria de la Selva (UNAS) para la georreferenciación de parcelas y análisis de suelos.`,
    whyItMatters: 'Demuestra el potencial agroindustrial del Perú profundo y la capacidad de las comunidades campesinas para integrarse con éxito a cadenas de valor globales con valor agregado.',
    keyFacts: {
      whatHappened: 'Crecimiento de exportaciones de cacao fino y cafés especiales con certificación orgánica.',
      where: 'Provincias de Leoncio Prado, Marañón y Valle del Monzón (Huánuco).',
      when: 'Campaña agroexportadora actual.',
      whoInvolved: 'Cooperativas agropecuarias de Huánuco, UNAS, Devida, Minagri y compradores europeos.',
      currentStatus: 'Cacao huanuqueño consolida presencia en ferias internacionales de Europa y Asia.',
    },
    whatIsKnown: [
      'Más de 4.000 familias productoras integradas en cooperativas de comercio justo.',
      'Sistemas agroforestales con especies maderables nativas protegen la biodiversidad amazónica.',
      'Adaptación técnica a las exigencias del nuevo reglamento de la Unión Europea contra la deforestación.',
    ],
    context: 'Reporte especial elaborado en terreno con testimonios de dirigentes comunales y especialistas agrícolas de la región Huánuco.',
    url: 'https://www.notiperux.com/noticia/informe-cacao-cafe-tingo-maria-exportacion',
    imageUrl: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Especiales',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Huánuco y Selva Central',
    section: 'peru',
    country: 'Perú',
    isFeatured: true,
    isOriginalReport: true,
    author: 'Consejo Editorial NotiPerúx',
    authorRole: 'Mesa de Desarrollo Sostenible y Regiones',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-estabilidad-macroeconomica-sol-peruano-bcr',
    title: 'La fortaleza del Sol peruano frente a las turbulencias globales: Política monetaria, reservas y el rol del BCR',
    summary: 'En un contexto de volatilidad financiera internacional, la moneda peruana se mantiene como una de las divisas más sólidas de América Latina. Análisis sobre la inflación controlada, el nivel histórico de reservas internacionales y las perspectivas comerciales.',
    content: `El comportamiento del Nuevo Sol en el mercado cambiario regional durante los últimos ejercicios ha ratificado su estatus como una de las divisas de mayor estabilidad macroeconómica en América del Sur. Con reservas internacionales netas que superan los 75.000 millones de dólares, el Banco Central de Reserva del Perú (BCRP) dispone de un blindaje financiero formidable frente a choques externos y fluctuaciones del dólar estadounidense.

1. Autonomía técnica y metas de inflación
El éxito del esquema de metas explícitas de inflación conducido por el BCRP ha permitido que el Perú retorne con rapidez al rango meta de entre 1% y 3% anual, un logro que pocos países en desarrollo han podido sostener de manera ininterrumpida frente a los embates de precios internacionales de combustibles y fertilizantes.

2. Impacto directo en el poder adquisitivo ciudadano
La preservación del valor adquisitivo de la moneda local previene la dolarización forzosa de la economía familiar. En mercados de abastos y supermercados, los precios de la canasta básica muestran una estabilidad gradual, permitiendo una planificación crediticia más certera tanto para personas naturales que adquieren viviendas como para mypes que acceden a capital de trabajo.

3. Desafíos fiscales y crecimiento del PBI
A pesar del blindaje monetario, los economistas advierten que la estabilidad cambiaria no es suficiente por sí sola para reactivar el empleo formal de calidad. Se requiere acelerar la ejecución del gasto público de inversión en gobiernos regionales y locales, destrabar concesiones mineras ambientalmente responsables y simplificar los regímenes tributarios para reducir la informalidad laboral que aún bordea el 70% de la población económicamente activa.`,
    whyItMatters: 'La solidez monetaria protege los ahorros de millones de trabajadores peruanos y evita incrementos descontrolados en los costos de alimentos y medicinas importadas.',
    keyFacts: {
      whatHappened: 'Análisis del desempeño cambiario y la política de tasas de interés del Banco Central de Reserva del Perú.',
      where: 'Sistema financiero nacional y plazas cambiarias de Lima y provincias.',
      when: 'Evaluación económica semestral.',
      whoInvolved: 'BCRP, Ministerio de Economía y Finanzas (MEF), analistas de banca múltiple y organismos multilaterales.',
      currentStatus: 'Inflación interanual se sitúa firmemente dentro del rango meta institucional.',
    },
    whatIsKnown: [
      'Las reservas internacionales peruanas superan el 30% del Producto Bruto Interno.',
      'El sol peruano es considerado la divisa con menor tasa de depreciación en los últimos 20 años en la región.',
      'El reto principal radica en transformar la estabilidad de precios en mayores tasas de empleo formal.',
    ],
    context: 'Informe redactado a partir de series estadísticas oficiales del BCRP, el INEI y reportes del Fondo Monetario Internacional.',
    url: 'https://www.notiperux.com/noticia/informe-estabilidad-macroeconomica-sol-peruano-bcr',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Economía',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Economía y Finanzas',
    section: 'peru',
    country: 'Perú',
    isFeatured: true,
    isOriginalReport: true,
    author: 'Unidad de Estudios Financieros NotiPerúx',
    authorRole: 'Analista de Macroeconomía y Políticas Públicas',
    readingTimeMinutes: 5,
  },
  {
    id: 'informe-seguridad-ciudadana-reforma-policial-tecnologia',
    title: 'Modernización del patrullaje y combate al crimen organizado: Radiografía de la seguridad ciudadana en las urbes peruanas',
    summary: 'La implementación de cámaras con reconocimiento biométrico, inteligencia policial y patrullaje integrado entre Serenazgo y la Policía Nacional busca devolver la tranquilidad a los distritos con mayor índice delictivo.',
    content: `La seguridad ciudadana encabeza sin discusión las principales preocupaciones de las familias peruanas. En las grandes ciudades costeras y en los núcleos comerciales del interior, los fenómenos del sicariato, la extorsión a pequeños negocios y el hurto al paso exigen un salto cualitativo desde el patrullaje meramente reactivo hacia un esquema de inteligencia policial preventiva basada en datos.

1. Coordinación integrada: Serenazgo y Policía Nacional
La experiencia demuestra que el patrullaje disuasivo rinde frutos cuando existe interoperabilidad real entre las centrales de videovigilancia municipal y las comisarías de sector. La unificación de frecuencias de radiocomunicación y la presencia de efectivos policiales a bordo de unidades de serenazgo permiten intervenciones en flagrancia con respaldo legal inmediato.

2. Inteligencia financiera contra las redes de extorsión
Los cabecillas de organizaciones criminales que dirigen cobros de cupos en obras civiles y comercios locales emplean billeteras digitales y cuentas de terceros para canalizar el dinero ilícito. La articulación con la Unidad de Inteligencia Financiera (UIF) y las operadoras de telecomunicaciones para el bloqueo georreferenciado de líneas celulares robadas constituye una herramienta vital para asfixiar la logística del crimen.

3. Recuperación del espacio público e iluminación urbana
Especialistas en urbanismo y criminología subrayan que la seguridad no solo se construye con patrulleros y armas, sino con parques iluminados, cámaras activas y actividades culturales que devuelvan las calles a los vecinos y cierren el paso al microcomercio de drogas.`,
    whyItMatters: 'La tranquilidad ciudadana es un derecho fundamental indispensable para que los emprendedores puedan abrir sus negocios sin zozobra ni extorsión.',
    keyFacts: {
      whatHappened: 'Estrategias de articulación tecnológica y fortalecimiento del patrullaje integrado municipal y policial.',
      where: 'Lima Metropolitana, Callao, Huánuco, Trujillo y Arequipa.',
      when: 'Planes operativos de seguridad ciudadana 2025-2026.',
      whoInvolved: 'Ministerio del Interior (Mininter), Policía Nacional del Perú (PNP), alcaldías distritales y juntas vecinales.',
      currentStatus: 'Se implementan operativos coordinados en puntos críticos y monitoreo de flagrancia.',
    },
    whatIsKnown: [
      'El patrullaje integrado con presencia policial reduce en un 28% la incidencia delictiva en sectores focalizados.',
      'Las fiscalías corporativas especializadas agilizan la formalización de detenciones en flagrancia.',
      'La participación organizada de juntas vecinales resulta determinante para alertar sobre movimientos sospechosos.',
    ],
    context: 'Informe de investigación periodística basado en boletines estadísticos de criminalidad del INEI y protocolos del Ministerio del Interior.',
    url: 'https://www.notiperux.com/noticia/informe-seguridad-ciudadana-reforma-policial-tecnologia',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Seguridad',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Seguridad y Policiales',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Área de Seguridad y Justicia NotiPerúx',
    authorRole: 'Reportero Policial y Asuntos Comunitarios',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-inteligencia-artificial-conectividad-rural-peru',
    title: 'Inteligencia Artificial y fibra óptica en los Andes: Cómo la digitalización transforma la educación y la agricultura familiar',
    summary: 'La llegada de redes dorsales de telecomunicaciones y herramientas de IA aplicada permite a comunidades campesinas optimizar el riego, predecir plagas y acceder a contenidos pedagógicos interactivos en lenguas originarias.',
    content: `La revolución de la Inteligencia Artificial generativa y la computación en la nube suele asociarse a los grandes centros tecnológicos del hemisferio norte. Sin embargo, en el Perú rural, la intersección entre la conectividad satelital de baja órbita y algoritmos de procesamiento de imágenes está generando soluciones concretas para desafíos ancestrales del agro y la educación básica.

1. Diagnóstico temprano de plagas en cultivos de papa y maíz
A través de teléfonos inteligentes conectados a aplicaciones gratuitas entrenadas con modelos de visión por computadora, agricultores de comunidades andinas pueden fotografiar una hoja afectada por tizón tardío o rancha y recibir en segundos un plan de tratamiento agroecológico adaptado a la temperatura y altitud de su parcela.

2. Herramientas educativas multilingües (Quechua y Castellano)
Docentes de instituciones educativas unidocentes en zonas rurales han empezado a emplear modelos de lenguaje para generar lecturas contextualizadas a la realidad geográfica de sus estudiantes. Esto no solo eleva la comprensión lectora, sino que revaloriza las tradiciones orales locales al traducirlas y preservarlas en formatos digitales accesibles.

3. Ciberseguridad y alfabetización digital ciudadana
Para que la tecnología cumpla su promesa emancipadora, los especialistas de Concytec y las universidades públicas enfatizan la urgencia de programas continuos de alfabetización digital para evitar estafas virtuales mediante suplantación de identidad y brechas de privacidad de datos personales.`,
    whyItMatters: 'La tecnología democratiza oportunidades económicas y formativas únicamente cuando llega a los valles y caseríos más alejados con infraestructura confiable.',
    keyFacts: {
      whatHappened: 'Despliegue de proyectos piloto de IA en agricultura familiar y educación rural en regiones andinas.',
      where: 'Departamentos de Huánuco, Junín, Cusco y Puno.',
      when: 'Innovaciones tecnológicas en curso.',
      whoInvolved: 'Concytec, INIA, ministerios sectoriales, docentes rurales y organizaciones de desarrollo comunal.',
      currentStatus: 'Se extienden puntos de conectividad en plazas públicas y escuelas rurales.',
    },
    whatIsKnown: [
      'Modelos de IA agrícola reducen el uso indiscriminado de plaguicidas químicos.',
      'Sistemas de voz traducen alertas climáticas del Senamhi a lenguas originarias.',
      'La inversión en última milla de fibra óptica continúa siendo la prioridad de conectividad estatal.',
    ],
    context: 'Investigación tecnológica de NotiPerúx elaborada en colaboración con laboratorios de innovación universitaria.',
    url: 'https://www.notiperux.com/noticia/informe-inteligencia-artificial-conectividad-rural-peru',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Ciencia & Tech',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Tecnología e Inteligencia Artificial',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Sección Tecnología NotiPerúx',
    authorRole: 'Especialista en Innovación y Redes Digitales',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-cuenca-rio-huallaga-agua-medio-ambiente',
    title: 'La protección de la cuenca del Río Huallaga: Retos ambientales y gestión de recursos hídricos en los Andes orientales',
    summary: 'Una mirada científica y ciudadana a la principal arteria fluvial de Huánuco. Diagnóstico de la calidad del agua, tratamiento de aguas residuales en centros urbanos y la conservación de los glaciares de cabecera.',
    content: `El río Huallaga, con más de 1.100 kilómetros de recorrido desde sus nacientes en las cumbres de Pasco hasta su desembocadura en el Marañón, constituye el sustento ecológico y el motor de vida de cientos de poblaciones andino-amazónicas.

A su paso por la ciudad de Huánuco, Amarilis y Pillco Marca, el río enfrenta una presión ambiental sin precedentes: vertimiento de desagües domésticos sin tratamiento adecuado, acumulación de escombros de construcción en sus riberas y los efectos visibles del retroceso glaciar en la cordillera de Huayhuash y Raura.

1. El estado del tratamiento de aguas residuales
El plan de modernización de la Planta de Tratamiento de Aguas Residuales (PTAR) de Huánuco es una de las demandas más postergadas de la última década. Según diagnósticos del Organismo Técnico de la Administración de los Servicios de Saneamiento (OTASS), actualmente gran porcentaje de las descargas urbanas ingresan directamente al cauce, afectando la flora microbiana y la pesca artesanal aguas abajo.

2. Deforestación en cabeceras de cuenca
La tala en las laderas altas reduce la capacidad de recarga de los acuíferos naturales y esponjas hídricas (bofedales). Los especialistas del Instituto de Investigaciones de la Amazonía Peruana (IIAP) alertan que, de no implementarse proyectos integrales de reforestación con queñuales y alisos en las zonas altas, las temporadas de estiaje serán cada vez más severas entre julio y octubre.

3. Participación ciudadana y vigilancia ecológica
Frente a este escenario, brigadas universitarias, frentes de defensa y colectivos vecinales han comenzado a realizar jornadas periódicas de limpieza de márgenes y monitoreo comunitario con kits de análisis fisicoquímico. Proteger el Huallaga no es solo una consigna ecológica: es la garantía de salud pública y seguridad alimentaria para las próximas generaciones de huanuqueños.`,
    whyItMatters: 'El río Huallaga abastece sistemas de riego y agua potable en tres departamentos del Perú. Su preservación es crítica para la resiliencia hídrica frente a eventos climáticos extremos.',
    keyFacts: {
      whatHappened: 'Evaluación ambiental de la cuenca media del río Huallaga y urgencia de infraestructura sanitaria.',
      where: 'Departamentos de Pasco, Huánuco y San Martín.',
      when: 'Monitoreo ambiental permanente 2025-2026.',
      whoInvolved: 'Autoridad Nacional del Agua (ANA), OTASS, Gobiernos Locales y organizaciones civiles.',
      currentStatus: 'Se gestionan expedientes técnicos para nuevas plantas de tratamiento de efluentes urbanos.',
    },
    whatIsKnown: [
      'El cauce recibe efluentes no tratados en varios tramos urbanos de la conurbación Huánuco-Amarilis.',
      'El retroceso de nevados en cabecera amenaza los caudales mínimos en temporada seca.',
      'Se requieren inversiones urgentes en reforestación de riberas y educación ambiental comunitaria.',
    ],
    context: 'Informe ambiental fundamentado en publicaciones de la Autoridad Nacional del Agua y estudios académicos de universidades peruanas.',
    url: 'https://www.notiperux.com/noticia/informe-cuenca-rio-huallaga-agua-medio-ambiente',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Medio Ambiente',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Medio Ambiente y Clima',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Equipo Editorial NotiPerúx',
    authorRole: 'Sección Ciencia, Saneamiento y Ecología',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-periodismo-regional-accesibilidad-audio',
    title: 'Hacia una prensa regional inclusiva: El papel del audio narrado y la digitalización sin barreras en el Perú',
    summary: 'Reflexión editorial sobre los retos del derecho a la información en comunidades rurales y urbanas. Cómo la síntesis de voz nativa y el periodismo de contraste permiten democratizar el acceso a las noticias.',
    content: `En un país geográficamente accidentado y lingüísticamente diverso como el Perú, el acceso a información oportuna, veraz y comprensible ha sido históricamente desigual. Mientras que en los centros urbanos costeros el consumo informativo se da a través de conexiones de banda ancha de alta velocidad, en las provincias del interior y zonas rurales el ciudadano promedio enfrenta tarifas de datos costosas, dispositivos de gama de entrada o barreras de alfabetización visual.

1. La oralidad como vehículo democratizador
La tradición informativa en el Perú tiene profundas raíces en la radio comunitaria. Desde los programas matutinos en onda corta hasta los altoparlantes en plazas de mercado, la voz hablada es el canal predilecto de conexión ciudadana. La incorporación de lectores de voz inteligentes en plataformas digitales como NotiPerúx responde a esta necesidad histórica: permitir que campesinos en faena, conductores en ruta, comerciantes en sus puestos y personas con dificultades de visión puedan escuchar las noticias del día con total nitidez, sin depender de pantallas encendidas ni consumir grandes volúmenes de datos móviles.

2. El antídoto contra la desinformación: Rigor y fuentes verificadas
La proliferación de noticias falsas y cadenas alarmistas en aplicaciones de mensajería ha erosionado la confianza colectiva. Frente a esto, el periodismo responsable no consiste en publicar primero a cualquier costo, sino en contextualizar, citar fuentes originales con transparencia y separar tajantemente los hechos comprobados de las opiniones interesadas.

3. Compromiso ético con la verdad
NotiPerúx nació con una misión transparente: acercar los acontecimientos de Huánuco, de todo el Perú y del mundo al ciudadano de a pie con total independencia editorial, respeto a los derechos humanos y un compromiso indeclinable con el desarrollo democrático de la nación.`,
    whyItMatters: 'La accesibilidad tecnológica y la claridad editorial son pilares fundamentales para una ciudadanía informada y capaz de ejercer sus derechos democráticos.',
    keyFacts: {
      whatHappened: 'Análisis sobre accesibilidad informativa, tecnologías de voz y ética periodística regional.',
      where: 'Cobertura nacional con énfasis en regiones del interior del Perú.',
      when: 'Manifiesto editorial permanente.',
      whoInvolved: 'Consejo Editorial NotiPerúx, lectores, colectivos de accesibilidad y comunicadores sociales.',
      currentStatus: 'Despliegue de herramientas de lectura en audio para todas las ediciones informativas.',
    },
    whatIsKnown: [
      'El consumo informativo mediante audio reduce brechas de acceso en personas con fatiga visual o en movimiento.',
      'La verificación de fuentes abiertas combate la desinformación en medios digitales.',
      'El periodismo regional independiente fortalece la fiscalización ciudadana.',
    ],
    context: 'Manifiesto editorial y declaración de principios del diario digital NotiPerúx.',
    url: 'https://www.notiperux.com/noticia/informe-periodismo-regional-accesibilidad-audio',
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Manifiesto',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Opinión y Columnas',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Dirección Editorial NotiPerúx',
    authorRole: 'Consejo de Ética y Principios Periodísticos',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-turismo-kotosh-circuito-arqueologico-huanuco',
    title: 'Kotosh y las Manos Cruzadas: El renacer del turismo cultural y patrimonial en los valles andinos centrales',
    summary: 'Con más de 4.000 años de antigüedad, el templo de Kotosh simboliza la cuna de la arquitectura ceremonial en América. Proyectos de conservación e infraestructura turística dinamizan la economía huanuqueña.',
    content: `A escasos cuatro kilómetros de la ciudad de Huánuco, sobre la margen derecha del río Higueras, se erige uno de los complejos ceremoniales más trascendentes de la arqueología andina mundial: el Templo de las Manos Cruzadas de Kotosh. Datado hacia el año 2000 a.C. en el período Precerámico Tardío, Kotosh es contemporáneo de la Civilización Caral y anterior en más de un milenio al apogeo de Chavín de Huántar.

1. El valor ceremonial y arquitectónico
Descubierto científicamente en la década de 1960 por la misión arqueológica de la Universidad de Tokio liderada por Seiichi Izumi, el templo evidencia la presencia de fogones ceremoniales con ductos de ventilación subterráneos donde se realizaban ofrendas sagradas. Los relieves de las Manos Cruzadas moldeados en barro reflejan conceptos duales de complementariedad andina que aún asombran a antropólogos internacionales.

2. Integración al corredor turístico Huánuco - Tomayquichua
El Ministerio de Comercio Exterior y Turismo (Mincetur), en alianza con la Dirección Desconcentrada de Cultura de Huánuco, ha desarrollado mejoras en el centro de interpretación, señalética braille y accesos para personas con movilidad reducida. Este circuito se articula directamente con la Casa de la Perricholi en Tomayquichua, el Parque Nacional de Tingo María y la Cueva de las Lechuzas, conformando un paquete turístico de alto valor para viajeros nacionales y extranjeros.

3. Gastronomía regional como motor de desarrollo
El dinamismo turístico en torno a Kotosh repercute directamente en los restaurantes campestres y recreos tradicionales de la campiña huanuqueña, donde la auténtica Pachamanca huanuqueña (elaborada con carnes maceradas en chincho, papas nativas, camotes y plátanos bajo tierra), el Locro de Gallina y los prestiños son reconocidos como patrimonio culinario vivo.`,
    whyItMatters: 'El turismo cultural es un generador limpio de divisas y empleo directo para guías locales, artesanos y pequeñas empresas familiares.',
    keyFacts: {
      whatHappened: 'Plan de puesta en valor y promoción de la ruta arqueológica y gastronómica de Kotosh.',
      where: 'Distrito de Huánuco y cuenca del río Higueras.',
      when: 'Temporada turística 2025-2026.',
      whoInvolved: 'Ministerio de Cultura, Mincetur, PromPerú y Asociación de Guías Oficiales de Turismo.',
      currentStatus: 'Circuito abierto al público con nuevo centro de visitantes y museo de sitio.',
    },
    whatIsKnown: [
      'Kotosh data de más de 4.000 años de antigüedad, siendo anterior al Imperio Inca.',
      'El templo ceremonial revela prácticas de reciprocidad andina precerámicas.',
      'La afluencia de turistas creció más de un 35% tras la rehabilitación de carreteras de acceso.',
    ],
    context: 'Informe cultural elaborado con asesoría de historiadores y guías de turismo colegiados de la región Huánuco.',
    url: 'https://www.notiperux.com/noticia/informe-turismo-kotosh-circuito-arqueologico-huanuco',
    imageUrl: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Turismo & Cultura',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Turismo y Gastronomía',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Sección Turismo y Patrimonio NotiPerúx',
    authorRole: 'Cronista de Rutas y Cultura Andina',
    readingTimeMinutes: 4,
  },
  {
    id: 'informe-salud-dengue-vigilancia-epidemiologica-minsa',
    title: 'Vigilancia epidemiológica y control del dengue: La estrategia sanitaria en la selva central y costa norte',
    summary: 'Las brigadas del Minsa intensifican la fumigación espacial, el control larvario en recipientes de agua y el abastecimiento de pruebas rápidas ante el incremento de temperaturas estacionales.',
    content: `El control del dengue y otras arbovirosis transmitidas por el mosquito Aedes aegypti continúa demandando una respuesta coordinada y oportuna por parte del Ministerio de Salud (Minsa), las Direcciones Regionales de Salud (Diresa) y la población organizada. Con la llegada de los períodos de lluvias en las cuencas selváticas y el calor persistente en la franja costera, la proliferación del vector requiere una vigilancia permanente en hogares y centros comunitarios.

1. Control larvario y eliminación de criaderos en viviendas
Más del 80% de los criaderos del mosquito vector se encuentran al interior de los domicilios: tanques sin tapa, floreros, llantas en desuso y botellas acumuladas en techos y traspatios. Las cuadrillas de promotores de salud recorren casa por casa aplicando larvicidas inocuos para el consumo humano y educando a las familias en el lavado escrupuloso de depósitos de agua.

2. Unidades de Vigilancia Clínica (UVICLIN) y triaje diferenciado
Para evitar la saturación de los servicios de emergencia de los hospitales de referencia, las redes de salud han instalado UVICLIN en postas médicas y centros de salud estratégicos de Tingo María, Pucallpa, Piura e Iquitos. Esto permite monitorear de manera continua los signos de alarma (dolor abdominal intenso, vómitos persistentes y sangrado de mucosas) y administrar hidratación intravenosa temprana.

3. Ciencia y vacunas en desarrollo
La comunidad médica nacional sigue de cerca los ensayos de nuevas vacunas tetravalentes contra el dengue y las tecnologías de mosquitos esterilizados con Wolbachia, herramientas biológicas complementarias que podrían reducir drásticamente la transmisión comunitaria en el mediano plazo.`,
    whyItMatters: 'La detección temprana de signos de alarma salva vidas y previene complicaciones graves por dengue hemorrágico.',
    keyFacts: {
      whatHappened: 'Despliegue de campañas de control vectorial y fortalecimiento de UVICLIN en regiones endémicas.',
      where: 'Selva central, costa norte y valles tropicales del Perú.',
      when: 'Plan de contingencia sanitaria 2025-2026.',
      whoInvolved: 'Ministerio de Salud (Minsa), Diresas, EsSalud, municipios y promotores comunitarios.',
      currentStatus: 'Se mantienen activas jornadas de fumigación y abastecimiento de medicamentos esenciales.',
    },
    whatIsKnown: [
      'Eliminar los recipientes inservibles es la medida más costo-efectiva contra el mosquito vector.',
      'La automedicación con antiinflamatorios como ibuprofeno o aspirina está contraindicada por riesgo de hemorragia.',
      'La hidratación oral inmediata en centros de atención primaria reduce en 99% la mortalidad por dengue.',
    ],
    context: 'Informe de salud pública basado en alertas epidemiológicas del Centro Nacional de Epidemiología (CDC Perú) y directivas del Minsa.',
    url: 'https://www.notiperux.com/noticia/informe-salud-dengue-vigilancia-epidemiologica-minsa',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
    imageUrlResolved: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
    sourceId: 'notiperux-redaccion',
    sourceName: 'NotiPerúx Salud',
    sourceDomain: 'notiperux.com',
    publishedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: 'Salud y Bienestar',
    section: 'peru',
    country: 'Perú',
    isFeatured: false,
    isOriginalReport: true,
    author: 'Mesa de Salud Pública NotiPerúx',
    authorRole: 'Especialista en Medicina Preventiva y Epidemiología',
    readingTimeMinutes: 4,
  },
];
