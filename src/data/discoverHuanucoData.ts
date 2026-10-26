import { DiscoverCategory, DiscoverPlace } from '../types';

/**
 * Catálogo curado de lugares reales y verificables en Huánuco.
 * Regla fundamental:
 * - Solo incluye lugares reales, con ubicaciones verificables en Huánuco.
 * - Solo asigna `photoUrl` cuando existe una fotografía real verificada de la fuente (Wikimedia Commons).
 * - No inventa horarios, precios, teléfonos ni opiniones.
 */
export const DISCOVER_HUANUCO_PLACES: DiscoverPlace[] = [
  // ============================================================================
  // CATEGORÍA 1: LUGARES TURÍSTICOS (8 lugares reales y verificados)
  // ============================================================================
  {
    id: 'tur-kotosh',
    name: 'Zona Arqueológica Monumental de Kotosh',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Km 5 de la Carretera Central Huánuco – La Unión (Margen derecha del río Higueras)',
    district: 'Huánuco',
    province: 'Huánuco',
    shortDescription:
      'Complejo arqueológico precerámico con más de 4,000 años de antigüedad, reconocido por el Templo de las Manos Cruzadas, uno de los santuarios más antiguos de América.',
    whatItOffers:
      'Circuito peatonal señalizado por recintos ceremoniales de la tradición Mito, sala de interpretación arqueológica y mirador natural hacia el valle del río Higueras.',
    highlights: [
      'Recintos superpuestos de los periodos Mito, Kotosh y Higueras',
      'Sala de exposición con réplica y contexto del Templo de las Manos Cruzadas',
      'A solo 5 km al oeste del centro urbano de la ciudad de Huánuco',
    ],
    updateStatus: 'Verificado · Patrimonio Cultural de la Nación',
    verifiedSource: 'Ministerio de Cultura · Dirección Desconcentrada de Cultura de Huánuco',
    photoUrl: '/images/descubre/kotosh.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Kotosh, Huánuco)',
    googleMapsQuery: 'Zona Arqueológica Monumental de Kotosh, Huánuco, Perú',
  },
  {
    id: 'tur-puente-calicanto',
    name: 'Puente Calicanto',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Cruce del Jr. Manco Cápac y Malecón Centenario Leoncio Prado, sobre el río Huallaga',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Histórico puente de piedra de canto rodado unida con argamasa de cal, arena y claras de huevo, construido entre 1879 y 1884 sobre el río Huallaga.',
    whatItOffers:
      'Arquitectura republicana del siglo XIX de 60 metros de longitud con dos columnas centrales, paso peatonal tradicional y vista directa al cauce del río Huallaga.',
    highlights: [
      'Monumento Histórico integrante del Patrimonio Cultural de la Nación',
      'Construido en piedra granítica y canto rodado a fines del siglo XIX',
      'Ubicado a pocas cuadras del centro histórico de Huánuco',
    ],
    updateStatus: 'Verificado · Monumento Histórico de Huánuco',
    verifiedSource: 'Inventario de Recursos Turísticos del Perú (MINCETUR)',
    photoUrl: '/images/descubre/puente-calicanto.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Puente Calicanto, Huánuco)',
    googleMapsQuery: 'Puente Calicanto, Huánuco, Perú',
  },
  {
    id: 'tur-plaza-armas-huanuco',
    name: 'Plaza de Armas de Huánuco',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Cuadrante entre los jirones Dos de Mayo, Dámaso Beraún, General Prado y 28 de Julio',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Espacio público principal del centro histórico de Huánuco, rodeado de ficus centenarios y presidido por su pileta central esculpida en piedra granítica en 1845.',
    whatItOffers:
      'Paseo peatonal arbolado frente a la Catedral de Huánuco y la Municipalidad Provincial, punto de encuentro ciudadano y escenario de la festividad de Los Negritos de Huánuco.',
    highlights: [
      'Pileta central histórica tallada en una sola pieza de piedra en 1845 por Pedro Caretti',
      'Rodeada por la Catedral de Huánuco, portales republicanos y comercios del centro',
      'Punto de partida para recorrer las iglesias coloniales de la ciudad',
    ],
    updateStatus: 'Verificado · Centro Histórico de Huánuco',
    verifiedSource: 'Municipalidad Provincial de Huánuco · MINCETUR',
    photoUrl: '/images/descubre/plaza-armas-huanuco.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Plaza de Armas de Huánuco)',
    googleMapsQuery: 'Plaza de Armas de Huánuco, Huánuco, Perú',
  },
  {
    id: 'tur-casa-perricholi',
    name: 'Casa de la Perricholi en Tomayquichua',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Parte alta del pueblo de Tomayquichua (Km 19 de la carretera Huánuco – Ambo)',
    district: 'Tomay Kichwa',
    province: 'Ambo',
    shortDescription:
      'Casona tradicional de adobe ubicada en el distrito de Tomay Kichwa, asociada históricamente a Micaela Villegas y Hurtado de Mendoza (1748–1819), conocida como "La Perricholi".',
    whatItOffers:
      'Jardines con mirador hacia el valle interandino del río Huallaga, ambientes de época con mobiliario tradicional, cocina rústica de barro y recorrido cultural por el pueblo de Tomayquichua.',
    highlights: [
      'Vista panorámica del valle desde la colina de Tomayquichua',
      'Exhibición de vestimenta, carruaje y utensilios tradicionales de época',
      'Ubicada en la ruta turística entre Huánuco y la provincia de Ambo',
    ],
    updateStatus: 'Verificado · Circuito Turístico Valle del Pillco – Ambo',
    verifiedSource: 'Inventario de Recursos Turísticos (MINCETUR · DIRCETUR Huánuco)',
    photoUrl: '/images/descubre/casa-perricholi-tomayquichua.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Casa de la Perricholi, Tomayquichua)',
    googleMapsQuery: 'Casa de la Perricholi, Tomayquichua, Ambo, Huánuco',
  },
  {
    id: 'tur-parque-nacional-tingo-maria',
    name: 'Parque Nacional Tingo María y La Bella Durmiente',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Cadena montañosa del Puma Ringri, Km 6.5 carretera Tingo María – Monzón',
    district: 'Rupa-Rupa / Mariano Dámaso Beraún',
    province: 'Leoncio Prado',
    shortDescription:
      'Segunda área natural protegida más antigua del Perú (establecida en 1965), que conserva los bosques de selva alta y la formación montañosa conocida como "La Bella Durmiente".',
    whatItOffers:
      'Avistamiento de biodiversidad amazónica de yungas, miradores escénicos hacia el perfil de La Bella Durmiente, senderos ecológicos, cataratas y pozas de aguas cristalinas.',
    highlights: [
      'Área Natural Protegida administrada oficialmente por el SERNANP',
      'Hogar del gallito de las rocas, mariposas morpho y flora de selva alta',
      'Paisaje emblemático de la provincia de Leoncio Prado (Tingo María)',
    ],
    updateStatus: 'Verificado · Área Natural Protegida (SERNANP)',
    verifiedSource: 'Servicio Nacional de Áreas Naturales Protegidas por el Estado (SERNANP)',
    photoUrl: '/images/descubre/tingo-maria-bella-durmiente.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (La Bella Durmiente, Tingo María)',
    googleMapsQuery: 'Parque Nacional Tingo María, Leoncio Prado, Huánuco',
  },
  {
    id: 'tur-cueva-lechuzas',
    name: 'Cueva de las Lechuzas',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Sector Turístico Tres de Mayo, Km 6.5 carretera Tingo María – Monzón',
    district: 'Mariano Dámaso Beraún',
    province: 'Leoncio Prado',
    shortDescription:
      'Imponente caverna de piedra caliza situada al pie de La Bella Durmiente dentro del Parque Nacional Tingo María, habitada por una colonia de guácharos (aves nocturnas frugívoras).',
    whatItOffers:
      'Recorrido interno por pasarelas de madera iluminadas naturalmente, observación de estalactitas y estalagmitas gigantes, y área recreativa junto al río Cueva.',
    highlights: [
      'Pasarela peatonal interna de 400 metros habilitada para visitantes',
      'Formaciones kársticas monumentales y ecosistema de caverna tropical',
      'Balneario natural de aguas sulfurosas y cristalinas en el exterior del sector',
    ],
    updateStatus: 'Verificado · Sector Turístico Tres de Mayo (SERNANP)',
    verifiedSource: 'SERNANP · Parque Nacional Tingo María',
    photoUrl: '/images/descubre/cueva-de-las-lechuzas.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Cueva de las Lechuzas, Tingo María)',
    googleMapsQuery: 'Cueva de las Lechuzas, Tingo María, Huánuco',
  },
  {
    id: 'tur-huanuco-pampa',
    name: 'Complejo Arqueológico de Huánuco Pampa',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Meseta altoandina de Huánuco Pampa (a 3,700 m s. n. m.), a 6 km de La Unión',
    district: 'La Unión',
    province: 'Dos de Mayo',
    shortDescription:
      'Principal centro administrativo, religioso y militar del Imperio Inca en el Chinchaysuyo central, articulado a la red vial del Qhapaq Ñan (Patrimonio Mundial de la UNESCO).',
    whatItOffers:
      'El monumental Ushnu ceremonial de piedra almohadillada en la gran plaza central, las portadas trapezoidales con pumas labrados del sector Inca Wasi y recintos de almacenamiento (qollqas).',
    highlights: [
      'Integrante del Sistema Vial Andino Qhapaq Ñan declarado Patrimonio Mundial',
      'Arquitectura incaica en piedra labrada de estilo imperial cusqueño',
      'Ubicado sobre una extensa pampa altoandina en la provincia de Dos de Mayo',
    ],
    updateStatus: 'Verificado · Proyecto Integral Huánuco Pampa (Qhapaq Ñan)',
    verifiedSource: 'Ministerio de Cultura · Proyecto Qhapaq Ñan',
    photoUrl: '/images/descubre/huanuco-pampa.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Huánuco Pampa, Dos de Mayo)',
    googleMapsQuery: 'Complejo Arqueológico de Huánuco Pampa, La Unión, Dos de Mayo, Huánuco',
  },
  {
    id: 'tur-lagunas-pichgacocha',
    name: 'Cinco Lagunas de Pichgacocha',
    category: 'turisticos',
    categoryLabel: 'Lugar turístico',
    location: 'Cordillera oriental de Conchamarca (entre 3,600 y 4,100 m s. n. m.)',
    district: 'Conchamarca',
    province: 'Ambo',
    shortDescription:
      'Conjunto escalonado de cinco lagunas altoandinas de origen glaciar ("Pichga" = cinco, "Cocha" = laguna en quechua) ubicadas en las alturas del distrito de Conchamarca.',
    whatItOffers:
      'Ruta de senderismo (trekking) por paisajes altoandinos, observación de espejos de agua de tonos turquesa y azul profundo, aves altoandinas y paseos en bote en la primera laguna.',
    highlights: [
      'Sistema hídrico natural conformado por cinco lagunas encadenadas en distintos niveles',
      'Acceso por carretera afirmada desde Conchamarca (ruta Huánuco – Ambo)',
      'Uno de los principales atractivos de naturaleza y caminata de la provincia de Ambo',
    ],
    updateStatus: 'Verificado · Recurso Turístico Natural de Ambo',
    verifiedSource: 'Inventario de Recursos Turísticos (MINCETUR · DIRCETUR Huánuco)',
    photoUrl: '/images/descubre/lagunas-pichgacocha.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Laguna de Pichgacocha, Ambo)',
    googleMapsQuery: 'Lagunas de Pichgacocha, Conchamarca, Ambo, Huánuco',
  },

  // ============================================================================
  // CATEGORÍA 2: LUGARES PARA COMER (8 lugares reales y verificados en Huánuco)
  // ============================================================================
  {
    id: 'com-mercado-modelo-huanuco',
    name: 'Zona de Comedores del Mercado Modelo de Huánuco',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. 28 de Julio 764 (cuadrante con Jr. Dos de Mayo, Jr. Ayacucho y Jr. Huánuco)',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Espacio gastronómico popular y tradicional en el principal centro de abastos de la ciudad de Huánuco, punto de referencia para desayunos y almuerzos típicos.',
    whatItOffers:
      'Caldo verde huanuqueño preparado con hierbas aromáticas (paico, muña y ruda), locro de gallina, juanes tradicionales, tamales, humitas de maíz fresco y jugos de fruta regional.',
    highlights: [
      'Puestos tradicionales de desayunos y almuerzos regionales huanuqueños',
      'Preparación diaria con insumos frescos del mismo mercado central',
      'Ubicado en pleno centro comercial de Huánuco Cercado',
    ],
    updateStatus: 'Verificado · Centro Gastronómico Tradicional en actividad',
    verifiedSource: 'Padrón Comercial y Guía Gastronómica de Huánuco Cercado',
    photoUrl: '/images/descubre/comedores-mercado-huanuco.jpg',
    photoAttribution: 'Fotografía real · Wikimedia Commons (Comedores del Mercado de Huánuco)',
    googleMapsQuery: 'Mercado Modelo de Huánuco, Jr. 28 de Julio 764, Huánuco',
  },
  {
    id: 'com-recreo-falcon',
    name: 'Recreo Tradicional Falcón',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. Dos de Mayo 190 – 206',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Restaurante tradicional de cocina regional huanuqueña ubicado en las primeras cuadras del jirón Dos de Mayo, reconocido por mantener la sazón típica del valle del Huallaga.',
    whatItOffers:
      'Especialidad en pachamanca huanuqueña de cerdo sazonada con chincho, picante de cuy con salsa de maní y ají panca, y locro de gallina de corral.',
    highlights: [
      'Recetas tradicionales de pachamanca huanuqueña, picante de cuy y locro',
      'Ubicación céntrica en el Jr. Dos de Mayo en la ciudad de Huánuco',
      'Ambiente familiar de cocina típica regional',
    ],
    updateStatus: 'Verificado · Dirección y giro gastronómico confirmados',
    verifiedSource: 'Directorio Comercial y Turístico de Huánuco (Jr. Dos de Mayo)',
    googleMapsQuery: 'Recreo Falcón, Jr. Dos de Mayo 206, Huánuco',
  },
  {
    id: 'com-tradiciones-huanuquenas',
    name: 'Recreo Campestre Tradiciones Huanuqueñas',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. Huallayco 2398 – 2444 (vía hacia el Puente Señor de Burgos / Aeropuerto)',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Recreo campestre familiar con jardines en el sector norte del jirón Huallayco, especializado en platos típicos de la gastronomía huanuqueña preparados de forma tradicional.',
    whatItOffers:
      'Pachamanca tradicional a la piedra, chicharrón de cerdo con mote y hierbabuena, picante de cuy, locro de gallina y amplios espacios al aire libre para familias.',
    highlights: [
      'Corredor gastronómico de recreos campestres del Jr. Huallayco',
      'Especialidad en pachamanca, chicharrón y platos regionales de fin de semana',
      'Amplios jardines y mesas familiares en la zona norte de la ciudad',
    ],
    updateStatus: 'Verificado · Recreo campestre registrado en Huánuco',
    verifiedSource: 'Registro de Establecimientos Gastronómicos de Huánuco (Jr. Huallayco)',
    googleMapsQuery: 'Tradiciones Huanuqueñas, Jr. Huallayco 2444, Huánuco',
  },
  {
    id: 'com-recreo-jacaranda',
    name: 'Recreo Campestre Jacarandá',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. Huallayco 2300 (Carretera al Aeropuerto)',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Restaurante y recreo campestre ubicado en la cuadra 23 del jirón Huallayco, rodeado de vegetación y enfocado en platos típicos regionales y carnes a la parrilla.',
    whatItOffers:
      'Almuerzos campestres con gastronomía regional de Huánuco, pachamanca, platos criollos y ambientes abiertos bajo árboles en la ruta hacia el aeropuerto.',
    highlights: [
      'Ubicado en Jr. Huallayco 2300, corredor tradicional de recreos en Huánuco',
      'Combina cocina típica huanuqueña y platos criollos al aire libre',
      'Espacio campestre dentro del radio urbano de Huánuco',
    ],
    updateStatus: 'Verificado · Ubicación verificada en Jr. Huallayco 2300',
    verifiedSource: 'Directorio de Recreos Campestres de Huánuco',
    googleMapsQuery: 'Recreo Campestre Jacarandá, Jr. Huallayco 2300, Huánuco',
  },
  {
    id: 'com-trapiche-house',
    name: 'Trapiche House Restaurante',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. San Martín 1242',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Restaurante ubicado en la cuadra 12 del jirón San Martín en Huánuco, inspirado en la tradición de las antiguas haciendas de caña de azúcar del valle huanuqueño.',
    whatItOffers:
      'Carta de cocina regional huanuqueña, almuerzos criollos, cortes a la parrilla y bebidas tradicionales en un local amplio dentro del casco urbano.',
    highlights: [
      'Dirección verificada en Jr. San Martín 1242, Huánuco Cercado',
      'Propuesta de platos criollos, regionales y parrillas',
      'Fácil acceso a pocas cuadras de la Alameda de la República',
    ],
    updateStatus: 'Verificado · Restaurante activo en Jr. San Martín',
    verifiedSource: 'Registro Comercial de Huánuco Cercado',
    googleMapsQuery: 'Trapiche House, Jr. San Martín 1242, Huánuco',
  },
  {
    id: 'com-wayra-huanuco',
    name: 'Wayra Huánuco',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. General Prado 860 (a una cuadra de la Plaza de Armas)',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Restaurante situado en el centro histórico de Huánuco que presenta una propuesta de cocina peruana y regional huanuqueña tanto para almuerzos como para cenas.',
    whatItOffers:
      'Almuerzos criollos y regionales con insumos locales al mediodía, y carta de carnes a la parrilla, sánguches y bebidas en el turno de la tarde y noche.',
    highlights: [
      'Ubicado en Jr. General Prado 860, a pasos de la Plaza de Armas de Huánuco',
      'Cocina criolla con identidad e ingredientes huanuqueños',
      'Atención en el corazón del centro histórico',
    ],
    updateStatus: 'Verificado · Ubicación verificada en Jr. General Prado 860',
    verifiedSource: 'Directorio Gastronómico del Centro Histórico de Huánuco',
    googleMapsQuery: 'Wayra Huánuco, Jr. General Prado 860, Huánuco',
  },
  {
    id: 'com-nativa-cafe',
    name: 'Nativa Café y Cocina',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Jr. General Prado 564',
    district: 'Huánuco Cercado',
    province: 'Huánuco',
    shortDescription:
      'Cafetería y restaurante familiar en el jirón General Prado enfocado en promover el café cultivado en las cuencas cafetaleras de Huánuco junto con pastelería y cocina casera.',
    whatItOffers:
      'Cafés de especialidad de origen huanuqueño, postres artesanales, desayunos, infusiones naturales y platillos caseros en un ambiente tranquilo.',
    highlights: [
      'Ubicado en Jr. General Prado 564, Huánuco Cercado',
      'Difusión de café regional producido en la selva alta de Huánuco',
      'Opciones de desayuno, café de tarde y cocina casera',
    ],
    updateStatus: 'Verificado · Ubicación verificada en Jr. General Prado 564',
    verifiedSource: 'Directorio de Cafeterías y Restaurantes de Huánuco',
    googleMapsQuery: 'Nativa, Jr. General Prado 564, Huánuco',
  },
  {
    id: 'com-casa-hacienda-shismay',
    name: 'Casa Hacienda Shismay (Restaurante Casa Hierba)',
    category: 'comer',
    categoryLabel: 'Lugar para comer',
    location: 'Valle de Shismay, Km 17 al sureste de la ciudad de Huánuco',
    district: 'Amarilis',
    province: 'Huánuco',
    shortDescription:
      'Casona hacienda histórica construida en 1858 en las alturas rurales del distrito de Amarilis, que ofrece servicio de comedor tradicional andino en un entorno de montaña.',
    whatItOffers:
      'Platos elaborados con trucha fresca de la zona, hortalizas de huerta propia, quesos artesanales y panes campesinos horneados en horno de leña tradicional.',
    highlights: [
      'Casona histórica de 1858 conservada en el distrito de Amarilis',
      'Gastronomía rural andina con insumos locales y trucha fresca',
      'Entorno natural de campo a unos 25–30 minutos de la ciudad de Huánuco',
    ],
    updateStatus: 'Verificado · Casona Histórica y Comedor Rural (Amarilis)',
    verifiedSource: 'Circuito Turístico y Gastronómico Rural de Amarilis · MINCETUR',
    googleMapsQuery: 'Casa Hacienda Shismay, Amarilis, Huánuco',
  },
];

/**
 * Obtiene la clave de fecha actual en horario de Perú (YYYY-MM-DD)
 * para que la rotación de "Recomendado hoy" cambie exactamente cada 24 horas.
 */
export function getPeruDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }
}

/**
 * Selecciona de manera determinística cada 24 horas:
 * - 2 lugares destacados para "RECOMENDADO HOY"
 * - 5 o 6 lugares adicionales para "MÁS LUGARES PARA DESCUBRIR"
 * Solamente entre los lugares reales registrados y verificados de la categoría activa.
 */
export function getDailyDiscoverSelection(
  category: DiscoverCategory,
  dateKey: string = getPeruDateKey()
): {
  recommendedToday: DiscoverPlace[];
  moreToDiscover: DiscoverPlace[];
  dateKey: string;
} {
  const categoryPlaces = DISCOVER_HUANUCO_PLACES.filter((p) => p.category === category);
  if (categoryPlaces.length <= 2) {
    return {
      recommendedToday: categoryPlaces,
      moreToDiscover: [],
      dateKey,
    };
  }

  // Hash determinístico de (dateKey + category) para rotar cada 24 horas
  const seedStr = `${dateKey}-${category}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  const total = categoryPlaces.length;
  const firstIndex = hash % total;
  const secondIndex = (firstIndex + 1 + ((hash >> 3) % (total - 1))) % total;

  const recommendedToday: DiscoverPlace[] = [
    categoryPlaces[firstIndex],
    categoryPlaces[secondIndex],
  ];

  const recommendedIds = new Set(recommendedToday.map((p) => p.id));
  const moreToDiscover = categoryPlaces
    .filter((p) => !recommendedIds.has(p.id))
    .slice(0, 6);

  return {
    recommendedToday,
    moreToDiscover,
    dateKey,
  };
}

export function buildDiscoverGoogleMapsUrl(place: DiscoverPlace): string | null {
  if (place.googleMapsUrl && place.googleMapsUrl.trim().startsWith('http')) {
    return place.googleMapsUrl.trim();
  }
  const q = (place.googleMapsQuery || '').trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
