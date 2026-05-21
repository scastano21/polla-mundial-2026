export const COPY = {
  hero: {
    eyebrow: "FIFA MUNDIAL 2026 · USA / CANADÁ / MÉXICO",
    title: "¿Quién sabe más de fútbol en tu grupo?",
    subtitle:
      "Pronóstica los 104 partidos, compite con tus amigos y demuéstralo partido a partido. El que la empuja, gana.",
    cta_main: "⚽ Crear mi polla",
    cta_join: "Tengo un código de invitación",
    trust: "Cupos amplios · Sin trampa · Puntos automáticos",
  },
  urgency: {
    starts_in: (days: number) =>
      `⏳ El Mundial empieza en ${days} días. Tus pronósticos deben estar listos.`,
    deadline: "🔴 ¡Hoy cierra el plazo para los pronósticos de grupos!",
    match_soon: (mins: number) => `⚡ Este partido empieza en ${mins} minutos`,
    locked: "🔒 Pronóstico cerrado — el partido ya empezó",
  },
  invite: {
    title: "🎯 Invita antes de que arranque el primer partido",
    body: "Quien no haga sus pronósticos a tiempo, se queda sin puntos. Mándale el link ahora.",
    whatsapp: (name: string, code: string, url: string) =>
      `⚽ Te invito a la polla del Mundial 2026 — ${name}\n\nHaz tus pronósticos antes del primer partido:\n${url}/join/${code}\n\nA ver quién sabe más de fútbol 🏆 ¿O te da miedo perder? 😏`,
    copied: "¡Link copiado! Mándalo por WhatsApp, Instagram, Telegram...",
  },
  leaderboard: {
    leader: (name: string) => `${name} va primero — pero el torneo apenas empieza 👀`,
    last: "¡Sin pronósticos no hay gloria! Entra y ponlos antes de que cierre.",
    tied: "Empate técnico. Todo se decide en los próximos partidos.",
    after_exact: "🎯 ¡Marcador exacto! Así se juega.",
    after_point: "✅ Resultado correcto. Siguen sumando.",
    zero: "😬 Esta vez no. El próximo partido es tuyo.",
  },
  honor: {
    title: "🏆 Cuadro de honor — una sola oportunidad",
    subtitle:
      "Complétalo antes del cierre global (5 min antes del inaugural). Puedes editarlo hasta ese momento.",
    deadline:
      "Cierra 5 minutos antes del pitazo inaugural (México vs Sudáfrica). Todo incompleto suma 0 puntos.",
    sections: {
      champion: "Campeón del mundo",
      runner_up: "Subcampeón",
      third: "Tercer puesto",
      top_scorer: "⚽ Goleador del torneo",
      best_player: "🌟 Mejor jugador (Balón de Oro)",
      best_keeper: "🧤 Mejor portero (Guante de Oro)",
      best_young: "🔥 Mejor jugador sub-21",
    },
    hint_text:
      "Escribe el nombre completo del jugador tal como aparece en FIFA.",
  },
  empty: {
    no_pools_title: "Aún no tienes ninguna polla activa",
    no_pools_body:
      "El Mundial empieza el 11 de junio. Crea tu grupo hoy y dale tiempo a tus amigos de hacer sus pronósticos.",
    no_pools_cta: "Crear mi primera polla",
    no_predictions:
      "¡No has hecho tus pronósticos! Tienes hasta 5 minutos antes del partido inaugural para completar toda la polla.",
  },
  upgrade: {
    banner_2: "🔥 Quedan pocos cupos en el grupo. Pide al admin que suba el límite si hace falta.",
    banner_max: "🔒 Grupo lleno. Pide al admin que suba cupos o libere un lugar.",
    modal_hook: (n: number) =>
      `Ya van ${n} en la polla. ¿Falta alguien? Pide más cupos al admin.`,
    price: "$9.900 COP · Un solo pago · Todo el Mundial 2026",
    methods: "PSE · Nequi · Daviplata · Tarjetas vía MercadoPago",
  },
  donate: {
    title: "❤️ Apoya la polla",
    subtitle:
      "Si te sirve la app, puedes dejar un donativo voluntario en COP vía MercadoPago.",
    thanks: (name: string) =>
      `¡Gracias ${name}! Tu apoyo mantiene esto funcionando durante todo el torneo 🏆`,
    wall_title: "Quienes apoyaron",
    anonymous: "Un hincha anónimo",
    /** Banner inferior (no usar jerga de interfaz aquí). */
    nudge: {
      before: "¿Te gusta Chocogol? Échanos una mano para mantenerlo, lo que te nazca. ",
      linkCta: "Clic aquí para donar",
      after: "",
    },
  },
  /** Textos de la guía en la página de inicio (#guia). */
  homeGuide: {
    title: "Cómo funciona la Polla Mundialista",
    intro:
      "Te resumimos lo importante: crear o entrar en una polla con amigos y familia, ver la tabla, cargar tus pronósticos, el cuadro de honor de una sola vez y la vista de transparencia para que nadie dude de lo que marcó antes del pitazo.",
    donateCardTitle: "¿Nos echas una mano?",
    donateCardBody:
      "Mantener la polla prendida todo el Mundial cuesta tiempo y servidor. Si te ha dado risa, polémica sana o bravazo con los parceros, un aportico en COP nos ayuda un montón — sin presión, solo si te nace.",
    donateCardFootnote:
      "PSE, Nequi, Daviplata o tarjeta por Mercado Pago. Rápido y sin enredos.",
    sections: [
      {
        title: "Pollas, grupos e invitación",
        bullets: [
          "Cada polla es un grupo privado: quien la crea es el administrador y obtiene un código de invitación.",
          "Comparte el código o el enlace de unión; quien entre con su cuenta queda en la tabla de esa polla.",
          "Los cupos los define el admin; si el grupo se llena, hay que pedirle que ajuste el límite si la app lo permite.",
        ],
      },
      {
        title: "Varias pollas a la vez",
        bullets: [
          "En «Mis pollas» (panel) ves todas las pollas en las que participas: la del trabajo, la del barrio, la familiar, etc.",
          "Puedes crear nuevas pollas o unirte a otras con distintos códigos; cada una tiene su propia tabla y sus propios pronósticos.",
        ],
      },
      {
        title: "Tabla de posiciones y puntos",
        bullets: [
          "Dentro de cada polla, la tabla ordena a los jugadores por puntos, marcadores exactos y aciertos de resultado.",
          "Los puntos se calculan según las reglas de la polla (marcador exacto, resultado, fases, cuadro de honor, etc.).",
        ],
      },
      {
        title: "Pronósticos y cuadro de honor",
        bullets: [
          "En «Pronósticos» marcas el marcador de cada partido; se bloquean cuando el partido ya no está programado o el admin cierra el resultado.",
          "El cuadro de honor (campeón, goleador, premios FIFA, etc.) se llena una sola vez antes del arranque: no se puede editar después de guardar.",
        ],
      },
      {
        title: "Transparencia total",
        bullets: [
          "En cada polla hay una vista «Transparencia» con todos los pronósticos de todos los miembros, partido por partido, más el cuadro de honor.",
          "Puedes imprimir o guardar en PDF desde el navegador para archivar o compartir. Así nadie discute quién dijo qué antes del pitazo.",
        ],
      },
    ],
  },
} as const;
