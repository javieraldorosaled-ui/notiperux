export interface NewsCategoryDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
  iconName?: string;
  color?: string;
}

/**
 * 19 Categorías periodísticas profesionales de NotiPerúx
 * Cubren el mínimo requerido de 18 categorías de noticias para la acreditación editorial y Google AdSense.
 */
export const NEWS_CATEGORIES: NewsCategoryDef[] = [
  {
    id: 'todas',
    name: 'Todas las noticias',
    shortName: 'Portada',
    description: 'Flujo completo y en tiempo real de noticias nacionales e internacionales.',
    keywords: [],
  },
  {
    id: 'politica',
    name: 'Política y Gobierno',
    shortName: 'Política',
    description: 'Congreso, Ejecutivo, ministerios, leyes, elecciones y decisiones de Estado.',
    keywords: [
      'politica', 'politico', 'congreso', 'congresista', 'presidente', 'presidencia',
      'dina boluarte', 'premier', 'ministro', 'ministerio', 'canciller', 'ejecutivo',
      'legislativo', 'elecciones', 'partido', 'mocion', 'vacancia', 'interpelacion',
      'gabinete', 'fujimori', 'castillo', 'otarola', 'adrianzen', 'jne', 'onpe', 'reniec',
      'bancada', 'senado', 'parlamento', 'contraloria', 'alcalde', 'gobernador', 'corrupcion',
    ],
  },
  {
    id: 'economia',
    name: 'Economía y Finanzas',
    shortName: 'Economía',
    description: 'Mercados, inflación, tipo de cambio, BCR, empleo, inversión y agroexportación.',
    keywords: [
      'economia', 'economico', 'bcr', 'julio velarde', 'inflacion', 'pbi', 'sunat',
      'dolar', 'tipo de cambio', 'tasa de interes', 'mef', 'empleo', 'sueldo', 'salario',
      'exportacion', 'importacion', 'afp', 'onp', 'pension', 'inversion', 'bolsa de valores',
      'pymes', 'mypes', 'canasta basica', 'recesion', 'tributario', 'remuneracion', 'consumo',
    ],
  },
  {
    id: 'seguridad',
    name: 'Seguridad y Policiales',
    shortName: 'Seguridad',
    description: 'Operativos policiales, lucha contra la delincuencia organizada y orden público.',
    keywords: [
      'seguridad', 'delincuencia', 'delincuente', 'extorsion', 'sicariato', 'sicario',
      'robo', 'asalto', 'policia', 'pnp', 'serenazgo', 'crimen', 'criminal', 'banda',
      'captura', 'detencion', 'homicidio', 'secuestro', 'estado de emergencia', 'armas',
      'operativo policial', 'estafa', 'penal', 'penitenciario', 'dirincri',
    ],
  },
  {
    id: 'judicial',
    name: 'Judicial y Fiscalía',
    shortName: 'Judicial',
    description: 'Poder Judicial, Ministerio Público, juicios, sentencias y estado de derecho.',
    keywords: [
      'fiscalia', 'fiscal', 'poder judicial', 'tribunal constitucional', 'tc', 'jueces',
      'juez', 'audiencia', 'prision preventiva', 'sentencia', 'investigacion fiscal',
      'colaborador eficaz', 'lavado de activos', 'casacion', 'corte suprema', 'corte superior',
      'procuraduria', 'extradicion', 'ministerio publico', 'tutela de derechos',
    ],
  },
  {
    id: 'deportes',
    name: 'Deportes y Fútbol',
    shortName: 'Deportes',
    description: 'Liga 1 Te Apuesto, Selección Peruana, copas continentales y disciplinas olímpicas.',
    keywords: [
      'deporte', 'deportes', 'futbol', 'seleccion', 'blanquirroja', 'liga 1',
      'alianza lima', 'universitario', 'sporting cristal', 'gareca', 'fossati',
      'conmebol', 'libertadores', 'sudamericana', 'fifa', 'voley', 'atletismo',
      'gol', 'goles', 'partido', 'campeonato', 'torneo', 'dakar', 'surf', 'maraton',
      'ipd', 'estadio', 'olimpicos', 'champions league', 'copa america',
    ],
  },
  {
    id: 'espectaculos',
    name: 'Farándula y Espectáculos',
    shortName: 'Espectáculos',
    description: 'Cine, televisión, música, conciertos, certámenes y entretenimiento popular.',
    keywords: [
      'farandula', 'espectaculo', 'espectaculos', 'magaly', 'reality', 'esto es guerra',
      'eeg', 'cantante', 'actor', 'actriz', 'concierto', 'cumbia', 'salsa', 'chisme',
      'ampay', 'modelo', 'influencer', 'tiktok', 'afhs', 'al fondo hay sitio', 'miss peru',
      'chollywood', 'famosos', 'musica', 'artista', 'estreno de cine', 'hollywood',
    ],
  },
  {
    id: 'huanuco',
    name: 'Huánuco y Selva Central',
    shortName: 'Huánuco',
    description: 'Actualidad informativa de Huánuco, Tingo María, Leoncio Prado, Pasco y valles orientales.',
    keywords: [
      'huanuco', 'huánuco', 'tingo maria', 'tingo maría', 'leoncio prado', 'amarilis',
      'pillco marca', 'tomayquichua', 'kotosh', 'rio huallaga', 'río huallaga', 'monzon',
      'pachitea', 'ambon', 'ambó', 'dos de mayo', 'la union', 'huanuco pampa', 'puente calicanto',
      'panao', 'puerto inca', 'cerro de pasco', 'pasco', 'selva central', 'unas',
    ],
  },
  {
    id: 'regiones',
    name: 'Regiones y Descentralización',
    shortName: 'Regiones',
    description: 'Arequipa, Cusco, Piura, Trujillo, Puno, Loreto, Ica y desarrollo provincial.',
    keywords: [
      'region', 'regiones', 'descentralizacion', 'arequipa', 'cusco', 'piura', 'trujillo',
      'la libertad', 'lambayeque', 'chiclayo', 'puno', 'juliaca', 'loreto', 'iquitos',
      'ucayali', 'pucallpa', 'ancash', 'chimbote', 'huaraz', 'ica', 'chincha', 'tacna',
      'moquegua', 'ayacucho', 'huancavelica', 'junin', 'huancayo', 'cajamarca', 'san martin',
    ],
  },
  {
    id: 'mundo',
    name: 'Mundo e Internacional',
    shortName: 'Mundo',
    description: 'Geopolítica mundial, América Latina, Estados Unidos, Europa, Asia y organismos internacionales.',
    keywords: [
      'mundo', 'internacional', 'estados unidos', 'eeuu', 'biden', 'trump', 'europa',
      'espana', 'ucrania', 'rusia', 'putin', 'china', 'america latina', 'venezuela',
      'maduro', 'colombia', 'petro', 'chile', 'boric', 'argentina', 'milei', 'onu',
      'otan', 'gaza', 'israel', 'medio oriente', 'conflicto', 'diplomacia', 'geopolitica',
    ],
  },
  {
    id: 'tecnologia',
    name: 'Tecnología e Inteligencia Artificial',
    shortName: 'Tecnología',
    description: 'IA generativa, telecomunicaciones, ciberseguridad, smartphones, apps y desarrollo digital.',
    keywords: [
      'tecnologia', 'inteligencia artificial', 'ia', 'robot', 'ciberseguridad', 'internet',
      'app', 'aplicacion', 'software', 'celular', 'celulares', 'smartphone', 'innovacion',
      'redes sociales', 'hackeo', 'digital', 'openai', 'chatgpt', 'google', 'apple',
      'android', 'meta', 'algoritmo', 'startup', 'nube', 'cloud', 'gadgets',
    ],
  },
  {
    id: 'educacion',
    name: 'Educación y Universidades',
    shortName: 'Educación',
    description: 'Minedu, Sunedu, año escolar, colegios, universidades, becas e investigación.',
    keywords: [
      'educacion', 'educativo', 'minedu', 'colegio', 'colegios', 'clases', 'escolar',
      'escolares', 'profesor', 'profesores', 'docente', 'docentes', 'sutep', 'sunedu',
      'universidad', 'universidades', 'beca 18', 'pronabec', 'estudiante', 'estudiantes',
      'ano escolar', 'año escolar', 'matricula', 'instituto', 'aulas', 'pedagogico',
    ],
  },
  {
    id: 'salud',
    name: 'Salud y Bienestar',
    shortName: 'Salud',
    description: 'Minsa, EsSalud, prevención médica, nutrición, epidemiología, vacunas y hospitales.',
    keywords: [
      'salud', 'minsa', 'essalud', 'hospital', 'medico', 'medicos', 'doctor', 'doctores',
      'enfermero', 'enfermera', 'dengue', 'covid', 'vacuna', 'vacunas', 'epidemia',
      'paciente', 'pacientes', 'medicamento', 'farmacia', 'cirugia', 'enfermedad',
      'posta', 'anemia', 'nutricion', 'oms', 'contagio', 'tratamiento', 'clinica',
    ],
  },
  {
    id: 'medio-ambiente',
    name: 'Medio Ambiente y Clima',
    shortName: 'Clima & Ambiente',
    description: 'Senamhi, pronóstico meteorológico, El Niño, prevención de desastres y biodiversidad.',
    keywords: [
      'medio ambiente', 'ambiental', 'clima', 'senamhi', 'lluvias', 'huaico', 'calor',
      'frio', 'friaje', 'heladas', 'temperatura', 'pronostico', 'sequia', 'precipitaciones',
      'minam', 'deforestacion', 'mineria ilegal', 'contaminacion', 'amazonia', 'bosque',
      'parques nacionales', 'sernanp', 'sostenibilidad', 'biodiversidad', 'el nino', 'el niño',
    ],
  },
  {
    id: 'turismo',
    name: 'Turismo y Gastronomía',
    shortName: 'Turismo & Cocina',
    description: 'Destinos turísticos del Perú, gastronomía nacional, cocina regional y rutas de viaje.',
    keywords: [
      'turismo', 'turistico', 'viajes', 'viajeros', 'gastronomia', 'cocina peruana',
      'ceviche', 'pachamanca', 'restaurante', 'mistura', 'chef', 'rutas turisticas',
      'machu picchu', 'valle sagrado', 'colca', 'paracas', 'cueva de las lechuzas',
      'turistas', 'hoteleria', 'peruano', 'sabor', 'plato bandera', 'mincetur', 'promperu',
    ],
  },
  {
    id: 'cultura',
    name: 'Cultura y Tradiciones',
    shortName: 'Cultura',
    description: 'Patrimonio histórico, literatura, arte, festividades tradicionales, museos y danzas.',
    keywords: [
      'cultura', 'cultural', 'patrimonio', 'incas', 'historia', 'historico', 'museo',
      'teatro', 'literatura', 'libros', 'arte', 'exposicion', 'cine peruano',
      'ministerio de cultura', 'ruinas', 'arqueologia', 'tradiciones', 'folklore',
      'danza', 'danzas', 'carnaval', 'fiesta patronal', 'negritos de huanuco', 'costumbres',
    ],
  },
  {
    id: 'empleo',
    name: 'Empleo y Emprendimiento',
    shortName: 'Empleo & Mypes',
    description: 'Convocatorias laborales, derechos de trabajadores, desarrollo de negocios e innovación pyme.',
    keywords: [
      'empleo', 'trabajo', 'convocatoria', 'bolsa de trabajo', 'cas', 'servir',
      'sunafil', 'derechos laborales', 'emprendimiento', 'emprendedor', 'mypes',
      'pequena empresa', 'negocio', 'financiamiento', 'capacitacion', 'formalizacion',
      'teletrabajo', 'sueldo minimo', 'gratificacion', 'cts', 'liquidaciones',
    ],
  },
  {
    id: 'transporte',
    name: 'Transporte y Vialidad',
    shortName: 'Transporte',
    description: 'Sutran, ATU, Carretera Central, carreteras nacionales, vuelos y seguridad vial.',
    keywords: [
      'transporte', 'transito', 'vialidad', 'sutran', 'atu', 'metropolitano',
      'linea 1', 'linea 2', 'metro de lima', 'carretera central', 'corredor',
      'peajes', 'provias', 'mtc', 'papeletas', 'licencia de conducir', 'brebete',
      'aeropuerto', 'jorge chavez', 'vuelos', 'terminal terrestre', 'buses', 'combis',
    ],
  },
  {
    id: 'ciencia',
    name: 'Ciencia y Espacio',
    shortName: 'Ciencia',
    description: 'Descubrimientos científicos, astronomía, arqueología, paleontología y salud preventiva.',
    keywords: [
      'ciencia', 'cientifico', 'cientificos', 'concytec', 'nasa', 'espacio', 'astronomia',
      'telescopio', 'satelite', 'investigacion cientifica', 'arqueologia', 'fosil',
      'paleontologia', 'adn', 'genetica', 'laboratorio', 'unmsm', 'uni', 'descubrimiento',
    ],
  },
  {
    id: 'opinion',
    name: 'Opinión y Columnas',
    shortName: 'Opinión',
    description: 'Análisis editorial, tribunas de debate, ensayos y columnas firmadas por periodistas.',
    keywords: [
      'opinion', 'editorial', 'columna', 'columnista', 'analisis', 'tribuna',
      'debate', 'comentario', 'ensayo', 'postura', 'manifiesto', 'cronica',
    ],
  },
];
