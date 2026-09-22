const DAY = '2026-10-13'

function at(time) {
  return new Date(`${DAY}T${time}:00`).toISOString()
}

export const EVENT = {
  id: 'mostla-day-2026',
  name: 'MOSTLA DAY 2026',
  tagline: 'Tecnologías del presente para cambiar el futuro.',
  city: 'MOSTLA',
  venue: 'MOSTLA DAY',
  dateLabel: '13 de octubre | 10:00 - 15:00 hrs',
  day: DAY,
  dayStart: at('10:00'),
  dayEnd: at('15:00'),
}

export const ROOMS = [
  { id: 'orion', name: 'Auditorio Orión', capacity: 420 },
  { id: 'quantum', name: 'Sala Quantum', capacity: 180 },
  { id: 'pulse', name: 'Lab Pulse', capacity: 90 },
]

export const SPEAKERS = [
  {
    name: 'Elisa Navarro',
    role: 'Head of Applied AI, Helix',
    photo: '/landing/speaker-elisa.jpg',
  },
  {
    name: 'Marco Peña',
    role: 'Staff Engineer, Nimbus',
    photo: '/landing/speaker-marco.jpg',
  },
  {
    name: 'Sofía Ríos',
    role: 'Principal API, Lumen',
    photo: '/landing/speaker-sofia.jpg',
  },
  {
    name: 'Diego Álvarez',
    role: 'Frontend Architect, Northwind',
    photo: '/landing/speaker-diego.jpg',
  },
  {
    name: 'Camila Ortiz',
    role: 'SRE Lead, Atlas',
    photo: '/landing/speaker-camila.jpg',
  },
  {
    name: 'Valeria Soto',
    role: 'AppSec, Faro',
    photo: '/landing/speaker-valeria.jpg',
  },
]

export function speakerPhoto(name) {
  const match = SPEAKERS.find((speaker) => name.startsWith(speaker.name))
  return match?.photo
}

export const TALKS = [
  {
    id: 't-keynote',
    title: 'IA que no alucina: contratos, evaluación y producto',
    speaker: 'Elisa Navarro',
    role: 'Head of Applied AI, Helix',
    roomId: 'orion',
    track: 'IA',
    start: at('09:00'),
    end: at('09:50'),
    summary:
      'Cómo pasar de demos brillantes a sistemas medibles: evaluación continua, límites de confianza y el rol de las personas en el loop.',
  },
  {
    id: 't-wasm',
    title: 'WebAssembly en el edge: de experimento a latencia real',
    speaker: 'Marco Peña',
    role: 'Staff Engineer, Nimbus',
    roomId: 'quantum',
    track: 'Infra',
    start: at('09:00'),
    end: at('09:50'),
    summary:
      'Patrones para empaquetar lógica de negocio en WASM, aislar runtimes y medir p99 sin magia.',
  },
  {
    id: 't-apis',
    title: 'APIs a prueba de equipos: contratos que sobreviven al roadmap',
    speaker: 'Sofía Ríos',
    role: 'Principal API, Lumen',
    roomId: 'pulse',
    track: 'Producto',
    start: at('09:00'),
    end: at('09:50'),
    summary:
      'Versionado, compatibilidad y el arte de decir no a un breaking change el viernes a las 6.',
  },
  {
    id: 't-react',
    title: 'React sin magia: arquitectura de estados que escala',
    speaker: 'Diego Álvarez',
    role: 'Frontend Architect, Northwind',
    roomId: 'orion',
    track: 'Frontend',
    start: at('10:00'),
    end: at('11:00'),
    summary:
      'Qué vive en el servidor, qué en el cliente y cómo evitar que el store se convierta en un segundo backend.',
  },
  {
    id: 't-obs',
    title: 'Observabilidad que duele menos',
    speaker: 'Camila Ortiz',
    role: 'SRE Lead, Atlas',
    roomId: 'quantum',
    track: 'Infra',
    start: at('10:00'),
    end: at('11:00'),
    summary:
      'Trazas, métricas y logs con presupuesto: qué instrumentar primero y qué ignorar sin culpa.',
  },
  {
    id: 't-nfc',
    title: 'NFC y credenciales: del badge plástico al wallet',
    speaker: 'Iván Cruz',
    role: 'Product Security, Taplab',
    roomId: 'pulse',
    track: 'Producto',
    start: at('10:30'),
    end: at('11:15'),
    summary:
      'Cómo emitir una credencial NFC para eventos, qué va en el tag y cómo revocar acceso sin drama.',
  },
  {
    id: 't-sec',
    title: 'Amenazas reales en APIs públicas (sin el teatro)',
    speaker: 'Valeria Soto',
    role: 'AppSec, Faro',
    roomId: 'orion',
    track: 'Infra',
    start: at('11:20'),
    end: at('12:10'),
    summary:
      'Auth, rate limits y el clasico IDOR. Un recorrido práctico con checklists que sí se usan.',
  },
  {
    id: 't-design',
    title: 'Sistemas de diseño que los ingenieros no odian',
    speaker: 'Paula Méndez',
    role: 'Design Systems, Kite',
    roomId: 'quantum',
    track: 'Frontend',
    start: at('11:20'),
    end: at('12:10'),
    summary:
      'Tokens, ownership y el momento en que un botón deja de ser un componente y se vuelve política.',
  },
  {
    id: 't-lab',
    title: 'Taller: prototipa un check-in NFC en 40 minutos',
    speaker: 'Iván Cruz',
    role: 'Product Security, Taplab',
    roomId: 'pulse',
    track: 'Producto',
    start: at('11:30'),
    end: at('12:15'),
    summary:
      'Simulamos lectura de tag, estados de acceso y un fallback cuando el lector falla en la fila.',
  },
  {
    id: 't-lunch',
    title: 'Almuerzo y networking',
    speaker: 'NEXUS Crew',
    role: 'Comunidad',
    roomId: 'orion',
    track: 'Comunidad',
    start: at('12:20'),
    end: at('13:20'),
    summary: 'Comida, café y mesas por track. Sin pitch forzado. Sí, hay enchufes.',
    unselectable: false,
  },
  {
    id: 't-dist',
    title: 'Sistemas distribuidos para mortales',
    speaker: 'Andrés Molina',
    role: 'Distributed Systems, Río',
    roomId: 'orion',
    track: 'Infra',
    start: at('13:30'),
    end: at('14:20'),
    summary:
      'Consenso, timeouts y por qué “eventual consistency” no es una disculpa, es un contrato.',
  },
  {
    id: 't-a11y',
    title: 'Accesibilidad como feature, no como auditoria',
    speaker: 'Nuria Vega',
    role: 'A11y Engineer, Bruma',
    roomId: 'quantum',
    track: 'Frontend',
    start: at('13:30'),
    end: at('14:20'),
    summary:
      'Patrones de foco, live regions y cómo medir que un schedule interactivo sea usable con teclado.',
  },
  {
    id: 't-mlops',
    title: 'MLOps en equipos de 8, no de 80',
    speaker: 'Elisa Navarro',
    role: 'Head of Applied AI, Helix',
    roomId: 'pulse',
    track: 'IA',
    start: at('13:40'),
    end: at('14:25'),
    summary:
      'Pipelines mínimos, datasets versionados y el momento de no entrenar un modelo más.',
  },
  {
    id: 't-edge',
    title: 'Privacidad en el dispositivo: lo que el servidor no tiene que saber',
    speaker: 'Hugo Beltrán',
    role: 'Privacy Engineer, Sombra',
    roomId: 'orion',
    track: 'Producto',
    start: at('14:40'),
    end: at('15:30'),
    summary:
      'On-device inference, minimización de datos y credenciales que no convierten al attendee en un log.',
  },
  {
    id: 't-perf',
    title: 'Performance budgets que el negocio entiende',
    speaker: 'Diego Álvarez',
    role: 'Frontend Architect, Northwind',
    roomId: 'quantum',
    track: 'Frontend',
    start: at('14:40'),
    end: at('15:20'),
    summary:
      'Cómo negociar 100ms con producto y qué métrica deja de ser vanidad.',
  },
  {
    id: 't-data',
    title: 'Datos en tiempo real sin incendiar la factura',
    speaker: 'Camila Ortiz',
    role: 'SRE Lead, Atlas',
    roomId: 'pulse',
    track: 'Infra',
    start: at('14:40'),
    end: at('15:40'),
    summary:
      'Colas, fan-out y cuándo un websocket es una mala idea con disfraz de modernidad.',
  },
  {
    id: 't-close',
    title: 'Cierre: lo que NEXUS se lleva a 2027',
    speaker: 'Elisa Navarro + invitados',
    role: 'Keynote panel',
    roomId: 'orion',
    track: 'Comunidad',
    start: at('16:00'),
    end: at('16:50'),
    summary:
      'Tres apuestas, una crítica y un llamado a construir herramientas que la gente sí quiera usar.',
  },
  {
    id: 't-office',
    title: 'Office hours: trae tu arquitectura',
    speaker: 'Staff panel',
    role: 'Mentores',
    roomId: 'quantum',
    track: 'Comunidad',
    start: at('16:00'),
    end: at('16:50'),
    summary:
      'Slots cortos con speakers. Llega con un diagrama, no con un pitch.',
  },
]

export function getTalkById(id) {
  return TALKS.find((talk) => talk.id === id)
}

export function getRoom(roomId) {
  return ROOMS.find((room) => room.id === roomId)
}
