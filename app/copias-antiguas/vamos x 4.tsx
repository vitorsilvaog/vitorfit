"use client";

import { useEffect, useMemo, useState } from "react";

type Serie = { kg: string; reps: string; rir: string };
type Registro = {
  fecha: string;
  nombre: string;
  variante: string;
  patron: string;
  series: Serie[];
};

type LibraryExercise = {
  id: string;
  nombre: string;
  musculo: string;
  patron: string;
  equipo: string;
  tipo: "Compuesto" | "Aislamiento";
  icono: string;
};

type RoutineExercise = {
  id: string;
  libraryId: string;
  nombre: string;
  musculo: string;
  patron: string;
  equipo: string;
  series: number;
  reps: string;
  rir: string;
  descanso?: number;
  icono: string;
};

type RoutineDay = {
  id: string;
  titulo: string;
  subtitulo: string;
  ejercicios: RoutineExercise[];
};

type Routine = {
  id: string;
  nombre: string;
  descripcion: string;
  dias: RoutineDay[];
  creadaPorUsuario?: boolean;
};

type HistorialV2 = Record<string, Registro[]>;
type RegistrosV2 = Record<string, Serie[]>;
type VariantesV2 = Record<string, string>;

type Ajustes = {
  descanso: number;
  mostrarComparacion: boolean;
  mostrarRir: boolean;
};

type Family = {
  musculo: string;
  patron: string;
  tipo: "Compuesto" | "Aislamiento";
  icono: string;
  ejercicios: Array<[string, string]>;
};

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const seriesVacias = (cantidad: number): Serie[] =>
  Array.from({ length: cantidad }, () => ({ kg: "", reps: "", rir: "" }));

const FAMILIAS: Family[] = [
  {
    musculo: "Pecho superior", patron: "Empuje inclinado", tipo: "Compuesto", icono: "🏋️",
    ejercicios: [
      ["Press Inclinado con Barra", "Barra"], ["Press Inclinado Multipower", "Multipower"],
      ["Press Inclinado Mancuernas", "Mancuernas"], ["Press Inclinado Máquina", "Máquina"],
      ["Press Inclinado Hammer Strength", "Máquina"], ["Press Inclinado Convergente", "Máquina"],
      ["Press Inclinado Polea", "Polea"], ["Press Inclinado Unilateral Máquina", "Máquina"],
    ],
  },
  {
    musculo: "Pecho", patron: "Empuje horizontal", tipo: "Compuesto", icono: "💪",
    ejercicios: [
      ["Press Banca", "Barra"], ["Press Plano Mancuernas", "Mancuernas"], ["Press Plano Multipower", "Multipower"],
      ["Press Pecho Máquina", "Máquina"], ["Press Pecho Convergente", "Máquina"], ["Press Hammer Plano", "Máquina"],
      ["Press Pecho Polea", "Polea"], ["Press Plano Unilateral Máquina", "Máquina"], ["Flexiones", "Peso corporal"],
      ["Flexiones Lastradas", "Peso corporal"],
    ],
  },
  {
    musculo: "Pecho inferior", patron: "Empuje declinado", tipo: "Compuesto", icono: "📉",
    ejercicios: [
      ["Press Declinado Barra", "Barra"], ["Press Declinado Mancuernas", "Mancuernas"],
      ["Press Declinado Multipower", "Multipower"], ["Press Declinado Máquina", "Máquina"],
      ["Fondos Pecho", "Peso corporal"], ["Fondos Pecho Asistidos", "Máquina"],
    ],
  },
  {
    musculo: "Pecho", patron: "Aducción horizontal", tipo: "Aislamiento", icono: "🎯",
    ejercicios: [
      ["Cruce de Poleas Medio", "Polea"], ["Cruce de Poleas Bajo a Alto", "Polea"], ["Cruce de Poleas Alto a Bajo", "Polea"],
      ["Cruce Polea Unilateral", "Polea"], ["Pec Deck", "Máquina"], ["Aperturas Mancuernas", "Mancuernas"],
      ["Aperturas Inclinadas Mancuernas", "Mancuernas"], ["Aperturas Máquina", "Máquina"],
    ],
  },
  {
    musculo: "Dorsal", patron: "Tracción vertical", tipo: "Compuesto", icono: "🧗",
    ejercicios: [
      ["Jalón al Pecho Agarre Ancho", "Polea"], ["Jalón al Pecho Agarre Neutro", "Polea"],
      ["Jalón al Pecho Agarre Supino", "Polea"], ["Jalón Unilateral", "Polea"], ["Jalón Máquina", "Máquina"],
      ["Dominadas", "Peso corporal"], ["Dominadas Asistidas", "Máquina"], ["Dominadas Neutras", "Peso corporal"],
      ["Dominadas Supinas", "Peso corporal"], ["Dominadas Lastradas", "Peso corporal"],
    ],
  },
  {
    musculo: "Espalda media", patron: "Tracción horizontal", tipo: "Compuesto", icono: "🚣",
    ejercicios: [
      ["Remo T", "Barra"], ["Remo T Pecho Apoyado", "Máquina"], ["Remo Barra", "Barra"], ["Remo Pendlay", "Barra"],
      ["Remo Máquina", "Máquina"], ["Remo Máquina Convergente", "Máquina"], ["Remo Cable Sentado", "Polea"],
      ["Remo Pecho Apoyado Mancuernas", "Mancuernas"], ["Remo Multipower", "Multipower"],
    ],
  },
  {
    musculo: "Dorsal", patron: "Tracción horizontal unilateral", tipo: "Compuesto", icono: "🎣",
    ejercicios: [
      ["Remo Cable 1 Mano", "Polea"], ["Remo Mancuerna 1 Mano", "Mancuernas"], ["Remo Máquina Unilateral", "Máquina"],
      ["Remo Hammer Unilateral", "Máquina"], ["Remo Polea Arrodillado 1 Mano", "Polea"],
    ],
  },
  {
    musculo: "Dorsal", patron: "Extensión de hombro", tipo: "Aislamiento", icono: "🏹",
    ejercicios: [
      ["Jalón Brazos Rectos", "Polea"], ["Pullover Polea", "Polea"], ["Pullover Máquina", "Máquina"],
      ["Pullover Mancuerna", "Mancuernas"], ["Pullover Polea Unilateral", "Polea"],
    ],
  },
  {
    musculo: "Trapecio", patron: "Elevación escapular", tipo: "Aislamiento", icono: "⛰️",
    ejercicios: [
      ["Encogimientos Barra", "Barra"], ["Encogimientos Mancuernas", "Mancuernas"], ["Encogimientos Multipower", "Multipower"],
      ["Encogimientos Máquina", "Máquina"], ["Encogimientos Polea", "Polea"],
    ],
  },
  {
    musculo: "Hombro", patron: "Empuje vertical", tipo: "Compuesto", icono: "🚀",
    ejercicios: [
      ["Press Militar Barra", "Barra"], ["Press Militar Multipower", "Multipower"], ["Press Hombro Mancuernas", "Mancuernas"],
      ["Press Hombro Máquina", "Máquina"], ["Press Arnold", "Mancuernas"], ["Press Hombro Unilateral Máquina", "Máquina"],
      ["Press Landmine", "Barra"],
    ],
  },
  {
    musculo: "Hombro lateral", patron: "Abducción de hombro", tipo: "Aislamiento", icono: "🪽",
    ejercicios: [
      ["Elevaciones Laterales Mancuernas", "Mancuernas"], ["Elevación Lateral Polea", "Polea"],
      ["Elevación Lateral Máquina", "Máquina"], ["Elevación Lateral Unilateral Polea", "Polea"],
      ["Elevación Lateral Sentado", "Mancuernas"], ["Elevación Lateral Lean Away", "Polea"],
      ["Elevación Lateral Máquina Unilateral", "Máquina"],
    ],
  },
  {
    musculo: "Hombro posterior", patron: "Abducción horizontal", tipo: "Aislamiento", icono: "🪽",
    ejercicios: [
      ["Pájaros Mancuernas", "Mancuernas"], ["Reverse Pec Deck", "Máquina"], ["Face Pull", "Polea"],
      ["Pájaros Polea", "Polea"], ["Reverse Fly Polea Unilateral", "Polea"], ["Pájaros Banco Inclinado", "Mancuernas"],
    ],
  },
  {
    musculo: "Deltoide anterior", patron: "Flexión de hombro", tipo: "Aislamiento", icono: "⬆️",
    ejercicios: [
      ["Elevación Frontal Mancuernas", "Mancuernas"], ["Elevación Frontal Polea", "Polea"],
      ["Elevación Frontal Disco", "Disco"], ["Elevación Frontal Barra", "Barra"],
    ],
  },
  {
    musculo: "Bíceps", patron: "Flexión de codo", tipo: "Aislamiento", icono: "💪",
    ejercicios: [
      ["Curl Barra Recta", "Barra"], ["Curl Barra Z", "Barra"], ["Curl Mancuernas Alterno", "Mancuernas"],
      ["Curl Polea Barra", "Polea"], ["Curl Máquina", "Máquina"], ["Curl Unilateral Polea", "Polea"],
      ["Curl 21", "Barra"],
    ],
  },
  {
    musculo: "Bíceps cabeza larga", patron: "Flexión de codo hombro extendido", tipo: "Aislamiento", icono: "💪",
    ejercicios: [
      ["Curl Inclinado", "Mancuernas"], ["Curl Bayesiano", "Polea"], ["Curl Polea Atrás", "Polea"],
      ["Curl Inclinado Unilateral", "Mancuernas"], ["Curl Bayesiano Unilateral", "Polea"],
    ],
  },
  {
    musculo: "Bíceps cabeza corta", patron: "Flexión de codo hombro flexionado", tipo: "Aislamiento", icono: "🦾",
    ejercicios: [
      ["Curl Predicador Barra Z", "Barra"], ["Curl Predicador Mancuerna", "Mancuernas"], ["Curl Scott Máquina", "Máquina"],
      ["Curl Concentrado", "Mancuernas"], ["Curl Predicador Polea", "Polea"],
    ],
  },
  {
    musculo: "Braquial", patron: "Flexión de codo agarre neutro", tipo: "Aislamiento", icono: "🔨",
    ejercicios: [
      ["Curl Martillo", "Mancuernas"], ["Curl Martillo Cuerda", "Polea"], ["Curl Martillo Cruzado", "Mancuernas"],
      ["Curl Martillo Máquina", "Máquina"], ["Curl Martillo Unilateral Polea", "Polea"],
    ],
  },
  {
    musculo: "Antebrazo", patron: "Flexión de codo pronada", tipo: "Aislamiento", icono: "🦾",
    ejercicios: [
      ["Curl Inverso Barra Z", "Barra"], ["Curl Inverso Polea", "Polea"], ["Curl Inverso Mancuernas", "Mancuernas"],
    ],
  },
  {
    musculo: "Tríceps", patron: "Extensión de codo", tipo: "Aislamiento", icono: "🔥",
    ejercicios: [
      ["Tríceps Polea Cuerda", "Polea"], ["Tríceps Barra V", "Polea"], ["Tríceps Barra Recta", "Polea"],
      ["Tríceps Polea Unilateral", "Polea"], ["Pressdown Agarre Inverso", "Polea"], ["Tríceps Máquina", "Máquina"],
    ],
  },
  {
    musculo: "Tríceps cabeza larga", patron: "Extensión de codo sobre cabeza", tipo: "Aislamiento", icono: "⚡",
    ejercicios: [
      ["Tríceps Overhead Cuerda", "Polea"], ["Extensión Overhead Barra", "Polea"], ["Extensión Mancuerna Sobre Cabeza", "Mancuernas"],
      ["Extensión Francesa Barra Z", "Barra"], ["Skull Crushers", "Barra"], ["Overhead Unilateral Polea", "Polea"],
    ],
  },
  {
    musculo: "Tríceps", patron: "Empuje cerrado", tipo: "Compuesto", icono: "🧱",
    ejercicios: [
      ["Press Banca Cerrado", "Barra"], ["Press Cerrado Multipower", "Multipower"], ["Fondos Tríceps", "Peso corporal"],
      ["Fondos Tríceps Asistidos", "Máquina"], ["Press Cerrado Máquina", "Máquina"],
    ],
  },
  {
    musculo: "Cuádriceps", patron: "Dominante de rodilla", tipo: "Compuesto", icono: "🦵",
    ejercicios: [
      ["Sentadilla Hack", "Máquina"], ["Prensa 45", "Máquina"], ["Prensa Horizontal", "Máquina"], ["Sentadilla Multipower", "Multipower"],
      ["Sentadilla Trasera", "Barra"], ["Sentadilla Frontal", "Barra"], ["Sentadilla Goblet", "Mancuernas"],
      ["Búlgara", "Mancuernas"], ["Búlgara Multipower", "Multipower"], ["Zancadas", "Mancuernas"],
      ["Zancadas Caminando", "Mancuernas"], ["Step Up", "Mancuernas"],
    ],
  },
  {
    musculo: "Cuádriceps", patron: "Extensión de rodilla", tipo: "Aislamiento", icono: "⚙️",
    ejercicios: [
      ["Extensión de Cuádriceps", "Máquina"], ["Extensión Cuádriceps Unilateral", "Máquina"], ["Sissy Squat", "Peso corporal"],
      ["Spanish Squat", "Banda"],
    ],
  },
  {
    musculo: "Femoral", patron: "Bisagra de cadera", tipo: "Compuesto", icono: "🏗️",
    ejercicios: [
      ["Peso Muerto Rumano Barra", "Barra"], ["Peso Muerto Rumano Mancuernas", "Mancuernas"],
      ["Peso Muerto Piernas Rígidas", "Barra"], ["Peso Muerto Rumano Multipower", "Multipower"],
      ["Buenos Días Barra", "Barra"], ["Buenos Días Multipower", "Multipower"], ["Pull Through", "Polea"],
    ],
  },
  {
    musculo: "Femoral", patron: "Flexión de rodilla", tipo: "Aislamiento", icono: "🪢",
    ejercicios: [
      ["Curl Femoral Sentado", "Máquina"], ["Curl Femoral Tumbado", "Máquina"], ["Curl Femoral de Pie", "Máquina"],
      ["Curl Femoral Unilateral", "Máquina"], ["Nordic Curl", "Peso corporal"], ["Curl Femoral Fitball", "Fitball"],
    ],
  },
  {
    musculo: "Glúteo", patron: "Extensión de cadera", tipo: "Compuesto", icono: "🍑",
    ejercicios: [
      ["Hip Thrust Barra", "Barra"], ["Hip Thrust Máquina", "Máquina"], ["Hip Thrust Multipower", "Multipower"],
      ["Glute Bridge Barra", "Barra"], ["Glute Bridge Máquina", "Máquina"], ["Hip Thrust Unilateral", "Peso corporal"],
    ],
  },
  {
    musculo: "Glúteo", patron: "Extensión de cadera unilateral", tipo: "Aislamiento", icono: "🎯",
    ejercicios: [
      ["Patada Glúteo Polea", "Polea"], ["Patada Glúteo Máquina", "Máquina"], ["Extensión de Cadera Polea", "Polea"],
      ["Patada Glúteo Cuadrupedia", "Peso corporal"], ["Patada Glúteo Banda", "Banda"],
    ],
  },
  {
    musculo: "Glúteo medio", patron: "Abducción de cadera", tipo: "Aislamiento", icono: "↔️",
    ejercicios: [
      ["Abductor Máquina", "Máquina"], ["Abducción Polea", "Polea"], ["Abducción Banda", "Banda"],
      ["Abducción Tumbado Lateral", "Peso corporal"], ["Caminata Lateral Banda", "Banda"],
    ],
  },
  {
    musculo: "Aductores", patron: "Aducción de cadera", tipo: "Aislamiento", icono: "🧲",
    ejercicios: [
      ["Aductor Máquina", "Máquina"], ["Aducción Polea", "Polea"], ["Copenhagen Plank", "Peso corporal"],
      ["Aducción Banda", "Banda"],
    ],
  },
  {
    musculo: "Gemelos", patron: "Flexión plantar rodilla extendida", tipo: "Aislamiento", icono: "🦶",
    ejercicios: [
      ["Gemelo de Pie Máquina", "Máquina"], ["Gemelo Prensa", "Máquina"], ["Gemelo Multipower", "Multipower"],
      ["Gemelo de Pie Mancuernas", "Mancuernas"], ["Gemelo Unilateral", "Peso corporal"],
    ],
  },
  {
    musculo: "Sóleo", patron: "Flexión plantar rodilla flexionada", tipo: "Aislamiento", icono: "🦶",
    ejercicios: [
      ["Gemelo Sentado", "Máquina"], ["Sóleo Máquina", "Máquina"], ["Sóleo Mancuerna", "Mancuernas"],
    ],
  },
  {
    musculo: "Abdomen", patron: "Flexión de tronco", tipo: "Aislamiento", icono: "🧱",
    ejercicios: [
      ["Crunch Cable", "Polea"], ["Crunch Declinado", "Banco"], ["Crunch Máquina", "Máquina"],
      ["Crunch Suelo", "Peso corporal"], ["Crunch Fitball", "Fitball"],
    ],
  },
  {
    musculo: "Abdomen inferior", patron: "Flexión de cadera y pelvis", tipo: "Aislamiento", icono: "⬆️",
    ejercicios: [
      ["Elevación de Piernas Colgado", "Peso corporal"], ["Elevación Rodillas Colgado", "Peso corporal"],
      ["Elevación Piernas Banco", "Banco"], ["Reverse Crunch", "Peso corporal"], ["Captain Chair", "Máquina"],
    ],
  },
  {
    musculo: "Core", patron: "Anti-extensión", tipo: "Aislamiento", icono: "🛡️",
    ejercicios: [
      ["Plancha", "Peso corporal"], ["Ab Wheel", "Rueda abdominal"], ["Body Saw", "Peso corporal"],
      ["Dead Bug", "Peso corporal"], ["Plancha con Carga", "Disco"],
    ],
  },
  {
    musculo: "Oblicuos", patron: "Anti-rotación", tipo: "Aislamiento", icono: "🌀",
    ejercicios: [
      ["Pallof Press", "Polea"], ["Pallof Press Banda", "Banda"], ["Plancha Lateral", "Peso corporal"],
      ["Suitcase Carry", "Mancuernas"],
    ],
  },
  {
    musculo: "Oblicuos", patron: "Rotación de tronco", tipo: "Aislamiento", icono: "🌀",
    ejercicios: [
      ["Woodchopper Alto Bajo", "Polea"], ["Woodchopper Bajo Alto", "Polea"], ["Russian Twist", "Peso corporal"],
      ["Rotación Máquina", "Máquina"],
    ],
  },
  {
    musculo: "Lumbar", patron: "Extensión de tronco", tipo: "Aislamiento", icono: "🧱",
    ejercicios: [
      ["Hiperextensiones", "Banco"], ["Hiperextensiones 45 Grados", "Banco"], ["Extensión Lumbar Máquina", "Máquina"],
      ["Superman", "Peso corporal"],
    ],
  },
  {
    musculo: "Antebrazo", patron: "Flexión de muñeca", tipo: "Aislamiento", icono: "✊",
    ejercicios: [
      ["Curl Muñeca Barra", "Barra"], ["Curl Muñeca Mancuernas", "Mancuernas"], ["Curl Muñeca Polea", "Polea"],
    ],
  },
  {
    musculo: "Antebrazo", patron: "Extensión de muñeca", tipo: "Aislamiento", icono: "✊",
    ejercicios: [
      ["Extensión Muñeca Barra", "Barra"], ["Extensión Muñeca Mancuernas", "Mancuernas"], ["Extensión Muñeca Polea", "Polea"],
    ],
  },
  {
    musculo: "Agarre", patron: "Carga transportada", tipo: "Compuesto", icono: "🧳",
    ejercicios: [
      ["Farmer Walk", "Mancuernas"], ["Farmer Walk Trap Bar", "Trap bar"], ["Suitcase Carry", "Mancuernas"],
      ["Plate Pinch Carry", "Discos"],
    ],
  },
  {
    musculo: "Cuerpo completo", patron: "Peso muerto", tipo: "Compuesto", icono: "🏋️",
    ejercicios: [
      ["Peso Muerto Convencional", "Barra"], ["Peso Muerto Sumo", "Barra"], ["Peso Muerto Trap Bar", "Trap bar"],
      ["Rack Pull", "Barra"],
    ],
  },
  {
    musculo: "Cuádriceps y glúteo", patron: "Zancada unilateral", tipo: "Compuesto", icono: "🦵",
    ejercicios: [
      ["Zancada Atrás", "Mancuernas"], ["Zancada Adelante", "Mancuernas"], ["Zancada Multipower", "Multipower"],
      ["Split Squat", "Mancuernas"], ["Step Up Alto", "Mancuernas"],
    ],
  },
  {
    musculo: "Espalda alta", patron: "Tracción alta", tipo: "Compuesto", icono: "🧲",
    ejercicios: [
      ["Remo Alto Polea", "Polea"], ["Remo Alto Máquina", "Máquina"], ["High Row Unilateral", "Máquina"],
      ["High Row Hammer", "Máquina"],
    ],
  },
  {
    musculo: "Trapecio y deltoide", patron: "Remo vertical", tipo: "Compuesto", icono: "⬆️",
    ejercicios: [
      ["Remo al Mentón Barra Z", "Barra"], ["Remo al Mentón Polea", "Polea"], ["Remo al Mentón Mancuernas", "Mancuernas"],
    ],
  },
  {
    musculo: "Glúteo y femoral", patron: "Hiperextensión de cadera", tipo: "Compuesto", icono: "🍑",
    ejercicios: [
      ["Hiperextensión Glúteo 45", "Banco"], ["Reverse Hyper", "Máquina"], ["Hiperextensión con Disco", "Banco"],
    ],
  },
  {
    musculo: "Cuádriceps", patron: "Sentadilla asistida", tipo: "Compuesto", icono: "🦵",
    ejercicios: [
      ["Belt Squat", "Máquina"], ["Pendulum Squat", "Máquina"], ["V-Squat", "Máquina"],
      ["Power Squat", "Máquina"],
    ],
  },
  {
    musculo: "Pecho y tríceps", patron: "Fondos", tipo: "Compuesto", icono: "⬇️",
    ejercicios: [
      ["Fondos Paralelas", "Peso corporal"], ["Fondos Máquina", "Máquina"], ["Fondos Asistidos", "Máquina"],
      ["Fondos Lastrados", "Peso corporal"],
    ],
  },
  {
    musculo: "Core", patron: "Estabilidad global", tipo: "Aislamiento", icono: "🛡️",
    ejercicios: [
      ["Bird Dog", "Peso corporal"], ["Bear Crawl", "Peso corporal"], ["Hollow Hold", "Peso corporal"],
      ["Plank Shoulder Tap", "Peso corporal"],
    ],
  },
  {
    musculo: "Cardio y piernas", patron: "Empuje trineo", tipo: "Compuesto", icono: "🛷",
    ejercicios: [
      ["Sled Push", "Trineo"], ["Sled Drag", "Trineo"], ["Backward Sled Drag", "Trineo"],
    ],
  },
];

const BUILTIN_LIBRARY: LibraryExercise[] = FAMILIAS.flatMap((f) =>
  f.ejercicios.map(([nombre, equipo], idx) => ({
    id: `lib-${slug(f.patron)}-${idx}-${slug(nombre)}`,
    nombre,
    musculo: f.musculo,
    patron: f.patron,
    equipo,
    tipo: f.tipo,
    icono: f.icono,
  }))
);

const libByName = (nombre: string) => BUILTIN_LIBRARY.find((e) => e.nombre === nombre) ?? BUILTIN_LIBRARY[0];

const rx = (id: string, nombre: string, series: number, reps: string, rir: string): RoutineExercise => {
  const lib = libByName(nombre);
  return {
    id,
    libraryId: lib.id,
    nombre: lib.nombre,
    musculo: lib.musculo,
    patron: lib.patron,
    equipo: lib.equipo,
    series,
    reps,
    rir,
    icono: lib.icono,
  };
};

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: "rutina-vitorfit-4d",
    nombre: "VitorFit 4 días",
    descripcion: "Rutina base de 4 días",
    dias: [
      {
        id: "dia-1", titulo: "DÍA 1", subtitulo: "Pecho · Tríceps · Hombro",
        ejercicios: [
          rx("d1-press-inclinado", "Press Inclinado con Barra", 3, "8-10", "1-2"),
          rx("d1-press-plano", "Press Plano Mancuernas", 3, "8-10", "1-2"),
          rx("d1-cruce-polea", "Cruce de Poleas Medio", 3, "10-15", "1-2"),
          rx("d1-laterales", "Elevación Lateral Polea", 3, "12-20", "1-2"),
          rx("d1-triceps-polea", "Tríceps Barra V", 3, "10-15", "1-2"),
          rx("d1-triceps-overhead", "Tríceps Overhead Cuerda", 3, "10-15", "1-2"),
          rx("d1-press-hombro", "Press Hombro Máquina", 3, "8-12", "1-2"),
        ],
      },
      {
        id: "dia-2", titulo: "DÍA 2", subtitulo: "Espalda · Bíceps · Hombro posterior",
        ejercicios: [
          rx("d2-jalon", "Jalón al Pecho Agarre Neutro", 3, "8-12", "1-2"),
          rx("d2-remo-t", "Remo T", 3, "8-12", "1-2"),
          rx("d2-remo-unilateral", "Remo Cable 1 Mano", 3, "10-12", "1-2"),
          rx("d2-jalon-rectos", "Jalón Brazos Rectos", 3, "12-15", "1-2"),
          rx("d2-curl-inclinado", "Curl Inclinado", 3, "8-12", "1-2"),
          rx("d2-curl-predicador", "Curl Predicador Barra Z", 3, "10-15", "1-2"),
          rx("d2-posterior", "Reverse Pec Deck", 3, "12-20", "1-2"),
        ],
      },
      {
        id: "dia-3", titulo: "DÍA 3", subtitulo: "Cuádriceps · Gemelo · Abdomen",
        ejercicios: [
          rx("d3-hack", "Sentadilla Hack", 3, "8-12", "1-2"),
          rx("d3-prensa", "Prensa 45", 3, "10-15", "1-2"),
          rx("d3-extension", "Extensión de Cuádriceps", 3, "12-15", "1-2"),
          rx("d3-aductor", "Aductor Máquina", 3, "12-20", "1-2"),
          rx("d3-gemelo", "Gemelo Prensa", 3, "10-20", "1-2"),
          rx("d3-crunch", "Crunch Cable", 3, "10-20", "1-2"),
        ],
      },
      {
        id: "dia-4", titulo: "DÍA 4", subtitulo: "Femoral · Glúteo · Abdomen",
        ejercicios: [
          rx("d4-rdl", "Peso Muerto Piernas Rígidas", 3, "8-12", "1-2"),
          rx("d4-curl-femoral", "Curl Femoral Sentado", 3, "10-15", "1-2"),
          rx("d4-hip-thrust", "Hip Thrust Máquina", 3, "8-12", "1-2"),
          rx("d4-abductor", "Abductor Máquina", 3, "12-20", "1-2"),
          rx("d4-extension-cadera", "Patada Glúteo Polea", 3, "10-15", "1-2"),
          rx("d4-abdomen", "Crunch Cable", 3, "10-20", "1-2"),
        ],
      },
    ],
  },
];

const keyRegistros = "vitorfit-registros-v2";
const keyHistorial = "vitorfit-historial-v2";
const keyVariantes = "vitorfit-variantes-v2";
const keyAjustes = "vitorfit-ajustes-v2";
const keyRutinas = "vitorfit-rutinas-v3";
const keyCustomLibrary = "vitorfit-biblioteca-personal-v3";
const keyRoutineSelection = "vitorfit-rutina-activa-v3";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default function Entrenamiento() {
  const [vista, setVista] = useState<"entreno" | "historial" | "progreso" | "rutinas" | "biblioteca" | "ajustes">("entreno");
  const [rutinas, setRutinas] = useState<Routine[]>(clone(DEFAULT_ROUTINES));
  const [rutinaActualId, setRutinaActualId] = useState(DEFAULT_ROUTINES[0].id);
  const [diaActualIndex, setDiaActualIndex] = useState(0);
  const [editorRutinaId, setEditorRutinaId] = useState<string | null>(null);
  const [editorDiaId, setEditorDiaId] = useState<string | null>(null);
  const [bibliotecaPersonal, setBibliotecaPersonal] = useState<LibraryExercise[]>([]);
  const [busquedaBiblioteca, setBusquedaBiblioteca] = useState("");
  const [filtroMusculo, setFiltroMusculo] = useState("Todos");
  const [filtroPatron, setFiltroPatron] = useState("Todos");
  const [filtroEquipo, setFiltroEquipo] = useState("Todos");
  const [targetBiblioteca, setTargetBiblioteca] = useState<{ rutinaId: string; diaId: string } | null>(null);
  const [mostrarCrearEjercicio, setMostrarCrearEjercicio] = useState(false);
  const [nuevoEjercicio, setNuevoEjercicio] = useState({ nombre: "", musculo: "", patron: "", equipo: "Máquina", tipo: "Aislamiento" as "Compuesto" | "Aislamiento" });

  const [registros, setRegistros] = useState<RegistrosV2>({});
  const [historial, setHistorial] = useState<HistorialV2>({});
  const [variantes, setVariantes] = useState<VariantesV2>({});
  const [alternativasAbiertas, setAlternativasAbiertas] = useState<Record<string, boolean>>({});
  const [modoAlternativa, setModoAlternativa] = useState<Record<string, "patron" | "musculo">>({});
  const [inicioEntreno] = useState(() => Date.now());
  const [segundos, setSegundos] = useState(0);
  const [descansoRestante, setDescansoRestante] = useState(0);
  const [ajustes, setAjustes] = useState<Ajustes>({ descanso: 90, mostrarComparacion: true, mostrarRir: true });
  const [mensaje, setMensaje] = useState("");

  const biblioteca = useMemo(() => [...BUILTIN_LIBRARY, ...bibliotecaPersonal], [bibliotecaPersonal]);
  const rutinaActual = rutinas.find((r) => r.id === rutinaActualId) ?? rutinas[0] ?? DEFAULT_ROUTINES[0];
  const diaActual = rutinaActual?.dias?.[diaActualIndex] ?? rutinaActual?.dias?.[0];

  useEffect(() => {
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicioEntreno) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [inicioEntreno]);

  useEffect(() => {
    if (descansoRestante <= 0) return;
    const t = window.setInterval(() => setDescansoRestante((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [descansoRestante]);

  useEffect(() => {
    try {
      const r = localStorage.getItem(keyRegistros);
      const h = localStorage.getItem(keyHistorial);
      const v = localStorage.getItem(keyVariantes);
      const a = localStorage.getItem(keyAjustes);
      const rr = localStorage.getItem(keyRutinas);
      const cl = localStorage.getItem(keyCustomLibrary);
      const sel = localStorage.getItem(keyRoutineSelection);

      if (r) setRegistros(JSON.parse(r));
      if (h) setHistorial(JSON.parse(h));
      else {
        const antiguo = localStorage.getItem("vitorfit-historial");
        if (antiguo) {
          const parsed = JSON.parse(antiguo) as Record<string, Array<{ fecha: string; nombre?: string; series: Serie[] }>>;
          const migrado: HistorialV2 = {};
          DEFAULT_ROUTINES[0].dias[0].ejercicios.forEach((ej, index) => {
            const regs = parsed[String(index)] ?? [];
            if (regs.length) {
              migrado[ej.id] = regs.map((x) => ({ fecha: x.fecha, nombre: x.nombre ?? ej.nombre, variante: x.nombre ?? ej.nombre, patron: ej.patron, series: x.series }));
            }
          });
          setHistorial(migrado);
          localStorage.setItem(keyHistorial, JSON.stringify(migrado));
        }
      }
      if (v) setVariantes(JSON.parse(v));
      if (a) setAjustes(JSON.parse(a));
      if (rr) setRutinas(JSON.parse(rr));
      if (cl) setBibliotecaPersonal(JSON.parse(cl));
      if (sel) {
        const s = JSON.parse(sel);
        if (s.rutinaActualId) setRutinaActualId(s.rutinaActualId);
        if (typeof s.diaActualIndex === "number") setDiaActualIndex(s.diaActualIndex);
      }
      if (!r) {
        const antiguoRegistros = localStorage.getItem("vitorfit-registros");
        if (antiguoRegistros) {
          const parsed = JSON.parse(antiguoRegistros) as Record<string, Serie[]>;
          const migrado: RegistrosV2 = {};
          DEFAULT_ROUTINES[0].dias[0].ejercicios.forEach((ej, index) => {
            if (parsed[String(index)]) migrado[ej.id] = parsed[String(index)];
          });
          setRegistros(migrado);
          localStorage.setItem(keyRegistros, JSON.stringify(migrado));
        }
      }
    } catch {
      setMensaje("No pude leer algún dato antiguo, pero VitorFit puede seguir funcionando.");
    }
  }, []);

  useEffect(() => localStorage.setItem(keyRegistros, JSON.stringify(registros)), [registros]);
  useEffect(() => localStorage.setItem(keyVariantes, JSON.stringify(variantes)), [variantes]);
  useEffect(() => localStorage.setItem(keyAjustes, JSON.stringify(ajustes)), [ajustes]);
  useEffect(() => localStorage.setItem(keyRutinas, JSON.stringify(rutinas)), [rutinas]);
  useEffect(() => localStorage.setItem(keyCustomLibrary, JSON.stringify(bibliotecaPersonal)), [bibliotecaPersonal]);
  useEffect(() => localStorage.setItem(keyRoutineSelection, JSON.stringify({ rutinaActualId, diaActualIndex })), [rutinaActualId, diaActualIndex]);

  const nombreVariante = (ej: RoutineExercise) => variantes[ej.id] || ej.nombre;

  const ultimoRegistro = (ej: RoutineExercise) => {
    const lista = historial[ej.id] ?? [];
    const actual = nombreVariante(ej);
    const mismaVariante = [...lista].reverse().find((r) => r.variante === actual);
    return mismaVariante ?? lista[lista.length - 1] ?? null;
  };

  const setSerie = (ej: RoutineExercise, serieIndex: number, campo: keyof Serie, valor: string) => {
    const base = registros[ej.id] ? [...registros[ej.id]] : seriesVacias(ej.series);
    while (base.length < ej.series) base.push({ kg: "", reps: "", rir: "" });
    base[serieIndex] = { ...base[serieIndex], [campo]: valor };
    setRegistros((prev) => ({ ...prev, [ej.id]: base }));
  };

  const compararSerie = (ej: RoutineExercise, i: number) => {
    if (!ajustes.mostrarComparacion) return "";
    const ultimo = ultimoRegistro(ej);
    const actual = registros[ej.id]?.[i];
    if (!ultimo || !actual || !actual.kg || !actual.reps) return "";
    if (ultimo.variante !== nombreVariante(ej)) return "🔁 Alternativa distinta: comparación pausada";
    const anterior = ultimo.series[i];
    if (!anterior?.kg || !anterior?.reps) return "";
    const kgA = Number(anterior.kg), repsA = Number(anterior.reps), kgH = Number(actual.kg), repsH = Number(actual.reps);
    if (kgH > kgA) return `🔥 +${kgH - kgA} KG`;
    if (kgH === kgA && repsH > repsA) return `📈 +${repsH - repsA} REPS`;
    if (kgH === kgA && repsH === repsA) return "✅ IGUAL QUE LA ÚLTIMA";
    return "🎯 SESIÓN REGISTRADA";
  };

  const guardarEjercicio = (ej: RoutineExercise) => {
    const series = registros[ej.id] ?? seriesVacias(ej.series);
    if (!series.some((s) => s.kg || s.reps || s.rir)) {
      setMensaje("Añade al menos una serie antes de guardar.");
      return;
    }
    const nuevo: Registro = {
      fecha: new Date().toLocaleString("es-ES"), nombre: ej.nombre, variante: nombreVariante(ej), patron: ej.patron, series,
    };
    const nuevoHistorial = { ...historial, [ej.id]: [...(historial[ej.id] ?? []), nuevo] };
    setHistorial(nuevoHistorial);
    localStorage.setItem(keyHistorial, JSON.stringify(nuevoHistorial));
    setMensaje(`✅ ${nombreVariante(ej)} guardado en el historial`);
  };

  const formatoTiempo = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const completados = (diaActual?.ejercicios ?? []).filter((ej) => {
    const s = registros[ej.id] ?? [];
    return s.length >= ej.series && s.slice(0, ej.series).every((x) => x.kg && x.reps);
  }).length;
  const seriesCompletadas = (diaActual?.ejercicios ?? []).reduce((acc, ej) => acc + (registros[ej.id] ?? []).filter((x) => x.kg && x.reps).length, 0);
  const kcal = Math.max(0, Math.round((segundos / 60) * 6.2));

  const progreso = useMemo(() => {
    return rutinas.flatMap((rut) => rut.dias.flatMap((dia) => dia.ejercicios.map((ej) => {
      const lista = historial[ej.id] ?? [];
      let mejorKg = 0, mejorE1rm = 0, mejorTexto = "—";
      lista.forEach((reg) => reg.series.forEach((s) => {
        const kg = Number(s.kg || 0), reps = Number(s.reps || 0);
        if (kg > mejorKg) mejorKg = kg;
        if (kg > 0 && reps > 0) {
          const e1rm = kg * (1 + reps / 30);
          if (e1rm > mejorE1rm) { mejorE1rm = e1rm; mejorTexto = `${kg} kg × ${reps}`; }
        }
      }));
      const ultima = lista[lista.length - 1], penultima = lista[lista.length - 2];
      let tendencia = "Sin datos";
      if (ultima && penultima) {
        const top = (r: Registro) => Math.max(0, ...r.series.map((s) => Number(s.kg || 0)));
        const diff = top(ultima) - top(penultima);
        tendencia = diff > 0 ? `+${diff} kg` : diff === 0 ? "Estable" : `${diff} kg`;
      } else if (ultima) tendencia = "1 sesión";
      return { rutina: rut.nombre, dia: dia.titulo, nombre: ej.nombre, sesiones: lista.length, mejorKg, mejorE1rm, mejorTexto, tendencia };
    })));
  }, [historial, rutinas]);

  const musculos = useMemo(() => ["Todos", ...Array.from(new Set(biblioteca.map((e) => e.musculo))).sort()], [biblioteca]);
  const patrones = useMemo(() => ["Todos", ...Array.from(new Set(biblioteca.map((e) => e.patron))).sort()], [biblioteca]);
  const equipos = useMemo(() => ["Todos", ...Array.from(new Set(biblioteca.map((e) => e.equipo))).sort()], [biblioteca]);

  const resultadosBiblioteca = useMemo(() => {
    const q = busquedaBiblioteca.trim().toLowerCase();
    return biblioteca.filter((e) => {
      const okQ = !q || `${e.nombre} ${e.musculo} ${e.patron} ${e.equipo}`.toLowerCase().includes(q);
      return okQ && (filtroMusculo === "Todos" || e.musculo === filtroMusculo) && (filtroPatron === "Todos" || e.patron === filtroPatron) && (filtroEquipo === "Todos" || e.equipo === filtroEquipo);
    });
  }, [biblioteca, busquedaBiblioteca, filtroMusculo, filtroPatron, filtroEquipo]);

  const alternativasPara = (ej: RoutineExercise) => {
    const modo = modoAlternativa[ej.id] ?? "patron";
    const lista = biblioteca.filter((x) => modo === "patron" ? x.patron === ej.patron : x.musculo === ej.musculo);
    return lista.sort((a, b) => (a.nombre === nombreVariante(ej) ? -1 : b.nombre === nombreVariante(ej) ? 1 : a.nombre.localeCompare(b.nombre)));
  };

  const cambiarDia = (delta: number) => {
    if (!rutinaActual?.dias?.length) return;
    setDiaActualIndex((d) => {
      const n = d + delta;
      if (n < 0) return rutinaActual.dias.length - 1;
      if (n >= rutinaActual.dias.length) return 0;
      return n;
    });
    setVista("entreno");
  };

  const actualizarRutina = (rutinaId: string, updater: (r: Routine) => Routine) => {
    setRutinas((prev) => prev.map((r) => r.id === rutinaId ? updater(r) : r));
  };

  const crearRutina = () => {
    const id = uid("rutina");
    const diaId = uid("dia");
    const nueva: Routine = { id, nombre: "Mi nueva rutina", descripcion: "Rutina personalizada", creadaPorUsuario: true, dias: [{ id: diaId, titulo: "DÍA 1", subtitulo: "Personalizado", ejercicios: [] }] };
    setRutinas((p) => [...p, nueva]);
    setRutinaActualId(id);
    setDiaActualIndex(0);
    setEditorRutinaId(id);
    setEditorDiaId(diaId);
    setVista("rutinas");
  };

  const duplicarRutina = (r: Routine) => {
    const nuevaId = uid("rutina");
    const copia: Routine = {
      ...clone(r), id: nuevaId, nombre: `${r.nombre} - copia`, creadaPorUsuario: true,
      dias: r.dias.map((d, di) => ({ ...clone(d), id: uid(`dia-${di + 1}`), ejercicios: d.ejercicios.map((e) => ({ ...clone(e), id: uid("rex") })) })),
    };
    setRutinas((p) => [...p, copia]);
    setEditorRutinaId(copia.id);
    setEditorDiaId(copia.dias[0]?.id ?? null);
    setMensaje("📋 Rutina duplicada. Ya puedes editarla.");
  };

  const eliminarRutina = (id: string) => {
    if (rutinas.length <= 1) { setMensaje("VitorFit necesita al menos una rutina."); return; }
    const nuevas = rutinas.filter((r) => r.id !== id);
    setRutinas(nuevas);
    if (rutinaActualId === id) { setRutinaActualId(nuevas[0].id); setDiaActualIndex(0); }
    if (editorRutinaId === id) setEditorRutinaId(null);
  };

  const crearDia = (rutinaId: string) => {
    const nuevo: RoutineDay = { id: uid("dia"), titulo: `DÍA ${(rutinas.find((r) => r.id === rutinaId)?.dias.length ?? 0) + 1}`, subtitulo: "Personalizado", ejercicios: [] };
    actualizarRutina(rutinaId, (r) => ({ ...r, dias: [...r.dias, nuevo] }));
    setEditorDiaId(nuevo.id);
  };

  const eliminarDia = (rutinaId: string, diaId: string) => {
    actualizarRutina(rutinaId, (r) => r.dias.length <= 1 ? r : ({ ...r, dias: r.dias.filter((d) => d.id !== diaId) }));
    setEditorDiaId(null);
  };

  const actualizarDia = (rutinaId: string, diaId: string, patch: Partial<RoutineDay>) => {
    actualizarRutina(rutinaId, (r) => ({ ...r, dias: r.dias.map((d) => d.id === diaId ? { ...d, ...patch } : d) }));
  };

  const añadirDesdeBiblioteca = (lib: LibraryExercise) => {
    if (!targetBiblioteca) { setMensaje("Primero elige una rutina y un día."); return; }
    const ex: RoutineExercise = { id: uid("rex"), libraryId: lib.id, nombre: lib.nombre, musculo: lib.musculo, patron: lib.patron, equipo: lib.equipo, series: 3, reps: "8-12", rir: "1-2", icono: lib.icono };
    actualizarRutina(targetBiblioteca.rutinaId, (r) => ({ ...r, dias: r.dias.map((d) => d.id === targetBiblioteca.diaId ? { ...d, ejercicios: [...d.ejercicios, ex] } : d) }));
    setMensaje(`➕ ${lib.nombre} añadido a la rutina`);
  };

  const actualizarEjercicioRutina = (rutinaId: string, diaId: string, exId: string, patch: Partial<RoutineExercise>) => {
    actualizarRutina(rutinaId, (r) => ({ ...r, dias: r.dias.map((d) => d.id === diaId ? { ...d, ejercicios: d.ejercicios.map((e) => e.id === exId ? { ...e, ...patch } : e) } : d) }));
  };

  const eliminarEjercicioRutina = (rutinaId: string, diaId: string, exId: string) => {
    actualizarRutina(rutinaId, (r) => ({ ...r, dias: r.dias.map((d) => d.id === diaId ? { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== exId) } : d) }));
  };

  const moverEjercicio = (rutinaId: string, diaId: string, index: number, delta: number) => {
    actualizarRutina(rutinaId, (r) => ({ ...r, dias: r.dias.map((d) => {
      if (d.id !== diaId) return d;
      const arr = [...d.ejercicios], ni = index + delta;
      if (ni < 0 || ni >= arr.length) return d;
      [arr[index], arr[ni]] = [arr[ni], arr[index]];
      return { ...d, ejercicios: arr };
    }) }));
  };

  const crearEjercicioPersonal = () => {
    if (!nuevoEjercicio.nombre.trim() || !nuevoEjercicio.musculo.trim() || !nuevoEjercicio.patron.trim()) {
      setMensaje("Completa nombre, músculo y patrón."); return;
    }
    const ex: LibraryExercise = { id: uid("custom"), nombre: nuevoEjercicio.nombre.trim(), musculo: nuevoEjercicio.musculo.trim(), patron: nuevoEjercicio.patron.trim(), equipo: nuevoEjercicio.equipo.trim() || "Otro", tipo: nuevoEjercicio.tipo, icono: "⭐" };
    setBibliotecaPersonal((p) => [...p, ex]);
    setNuevoEjercicio({ nombre: "", musculo: "", patron: "", equipo: "Máquina", tipo: "Aislamiento" });
    setMostrarCrearEjercicio(false);
    setMensaje(`⭐ ${ex.nombre} añadido a tu biblioteca personal`);
  };

  const restaurarRutinas = () => {
    setRutinas(clone(DEFAULT_ROUTINES));
    setRutinaActualId(DEFAULT_ROUTINES[0].id);
    setDiaActualIndex(0);
    setEditorRutinaId(null);
    setMensaje("♻️ Rutinas predeterminadas restauradas. Tu historial no se ha borrado.");
  };

  const editorRutina = rutinas.find((r) => r.id === editorRutinaId) ?? null;
  const editorDia = editorRutina?.dias.find((d) => d.id === editorDiaId) ?? editorRutina?.dias[0] ?? null;

  return (
    <main className="vf-app">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#020713} button,input,select{font:inherit}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        .vf-app{min-height:100vh;color:#fff;font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 14% 4%,rgba(0,77,152,.28),transparent 28%),radial-gradient(circle at 88% 18%,rgba(165,0,68,.24),transparent 30%),linear-gradient(135deg,#020713 0%,#06152f 48%,#230013 100%);padding:18px 16px 110px}
        .vf-shell{width:min(100%,1100px);margin:0 auto}.vf-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding:12px 4px 18px}
        .vf-brand{display:flex;align-items:center;gap:12px;min-width:0}.vf-logo{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(246,195,68,.28))}.vf-brand-title{font-size:26px;font-weight:1000;letter-spacing:.6px;line-height:1;color:#F6C344}.vf-brand-title span{color:#ff2656}.vf-brand-sub{margin-top:5px;color:#F6C344;font-size:10px;font-weight:800;letter-spacing:1.1px}
        .vf-day{display:flex;align-items:center;gap:8px}.vf-day button,.vf-icon-button{width:42px;height:42px;border-radius:12px;border:1px solid #1c6bb7;background:rgba(1,12,30,.88);color:#F6C344;font-size:22px;cursor:pointer}.vf-day-pill{min-width:170px;text-align:center;padding:12px 18px;border:1px solid #3978b6;border-radius:13px;color:#F6C344;font-weight:900;background:rgba(2,11,28,.72)}.vf-actions{display:flex;justify-content:flex-end;gap:10px}
        .vf-routine-name{text-align:center;color:#a9bad0;font-size:11px;margin:-7px 0 12px}.vf-stats{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.35fr;border:1px solid #1b456f;border-radius:18px;overflow:hidden;background:rgba(2,10,25,.72);margin-bottom:22px}.vf-stat{min-height:132px;padding:20px 12px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}.vf-stat+.vf-stat:before{content:"";position:absolute;left:0;top:26px;bottom:26px;width:1px;background:rgba(84,124,165,.4)}.vf-ring{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(#df1f4c calc(var(--progress)*1%),#2463af 0 72%,#0d244b 0);position:relative}.vf-ring:after{content:"";position:absolute;inset:9px;border-radius:50%;background:#071327}.vf-ring-text{position:relative;z-index:1;font-weight:1000;font-size:24px}.vf-stat-icon{font-size:28px;margin-bottom:8px}.vf-stat-value{font-size:24px;font-weight:1000}.vf-stat-label{color:#F6C344;font-size:11px;font-weight:900;letter-spacing:.6px;margin-top:5px}.vf-stat-sub{color:#c4cedd;font-size:11px;line-height:1.35;margin-top:4px}
        .vf-card{border:1px solid rgba(234,28,75,.8);border-radius:18px;background:linear-gradient(135deg,rgba(4,24,58,.96),rgba(9,18,38,.98) 58%,rgba(54,3,25,.96));margin-bottom:18px;overflow:hidden;box-shadow:0 16px 34px rgba(0,0,0,.22)}.vf-card-head{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px 12px}.vf-num{width:50px;height:50px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:1000;color:#F6C344;background:linear-gradient(135deg,#6f002d,#a50044);border:1px solid #ff295d}.vf-title-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.vf-ex-title{font-size:23px;font-weight:1000;text-transform:uppercase;line-height:1.08}.vf-tag{color:#ff3764;border:1px solid rgba(255,55,100,.55);background:rgba(165,0,68,.2);border-radius:7px;padding:5px 9px;font-size:10px;font-weight:1000;text-transform:uppercase}.vf-prescription{margin-top:7px;color:#F6C344;font-size:13px;font-weight:700}.vf-ex-icon{font-size:44px;min-width:56px;text-align:center}
        .vf-alt-wrap{padding:0 18px 12px}.vf-alt-button{width:100%;border:1px dashed rgba(246,195,68,.38);background:rgba(0,0,0,.18);color:#f2d77a;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:800;font-size:12px}.vf-alt-tools{display:flex;gap:8px;margin-top:8px}.vf-alt-tools button{flex:1;border:1px solid #284b73;background:#07162b;color:#b8c7da;border-radius:9px;padding:8px;cursor:pointer;font-size:11px;font-weight:800}.vf-alt-tools button.active{border-color:#F6C344;color:#F6C344}.vf-alt-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px;max-height:260px;overflow:auto}.vf-alt-option{border:1px solid #284b73;background:#08172d;color:#dce7f4;padding:10px;border-radius:10px;cursor:pointer;text-align:left;font-size:12px}.vf-alt-option.active{border-color:#F6C344;color:#F6C344;box-shadow:0 0 0 1px rgba(246,195,68,.18) inset}
        .vf-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 18px 14px}.vf-panel{border-radius:14px;padding:14px;min-width:0}.vf-panel.last{border:1px solid #1e72ca;background:rgba(3,21,46,.74)}.vf-panel.today{border:1px solid #e51b4e;background:rgba(19,8,24,.76)}.vf-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;font-size:13px;font-weight:1000;color:#F6C344}.vf-date{border:1px solid #1f5f9f;border-radius:8px;padding:5px 8px;color:#74b3ff;font-size:10px;white-space:nowrap}.vf-series-row{display:grid;grid-template-columns:36px repeat(3,minmax(0,1fr));gap:8px;align-items:center;margin-bottom:9px}.vf-slabel{color:#438cff;font-weight:1000;font-size:16px}.vf-box{min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #36587c;background:#081426;border-radius:9px;text-align:center}.vf-box strong{font-size:18px}.vf-box small{color:#9cacbe;font-size:9px;margin-top:2px}.vf-input{width:100%;min-width:0;min-height:52px;border:1px solid #36587c;background:#081426;color:white;border-radius:9px;text-align:center;outline:none;font-size:16px;font-weight:800}.vf-input:focus{border-color:#e91e50;box-shadow:0 0 0 2px rgba(233,30,80,.12)}.vf-compare{grid-column:2/5;color:#F6C344;font-size:10px;font-weight:900;margin-top:-4px;line-height:1.2}.vf-card-actions{display:grid;grid-template-columns:1fr 190px;gap:12px;padding:0 18px 18px}.vf-save{border:1px solid #e22855;color:#F6C344;background:linear-gradient(90deg,#084692,#820a4d,#a50044);border-radius:11px;min-height:48px;font-weight:1000;cursor:pointer;font-size:14px}.vf-rest{border:1px solid #446185;color:#F6C344;background:#071126;border-radius:11px;min-height:48px;font-weight:1000;cursor:pointer}
        .vf-message{position:fixed;left:50%;transform:translateX(-50%);bottom:88px;z-index:50;max-width:min(92vw,720px);padding:10px 14px;background:#07152a;border:1px solid #F6C344;border-radius:10px;color:#F6C344;font-weight:800;font-size:12px;box-shadow:0 12px 30px rgba(0,0,0,.45)}.vf-page-title{margin:4px 0 16px;font-size:28px;font-weight:1000;color:#F6C344}.vf-section-card{border:1px solid #22496f;background:rgba(3,13,30,.76);border-radius:16px;padding:16px;margin-bottom:12px}.vf-muted{color:#9aabc0;font-size:12px}.vf-history-ex{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;padding:12px 0;border-bottom:1px solid rgba(80,111,146,.24)}.vf-history-ex:last-child{border-bottom:0}.vf-history-name{font-weight:900}.vf-mini-series{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.vf-mini-chip{border:1px solid #315477;background:#071527;border-radius:8px;padding:6px 8px;font-size:10px}.vf-progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.vf-record{border:1px solid #294f75;border-radius:14px;background:linear-gradient(135deg,rgba(3,30,65,.8),rgba(38,3,25,.72));padding:14px}.vf-record h3{margin:0 0 6px;font-size:15px}.vf-record-big{font-size:24px;color:#F6C344;font-weight:1000;margin:8px 0 2px}
        .vf-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.vf-primary,.vf-secondary,.vf-danger{border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer}.vf-primary{border:1px solid #f03261;background:linear-gradient(90deg,#0b4b99,#7a0d50,#a50044);color:#F6C344}.vf-secondary{border:1px solid #31577e;background:#08172d;color:#dce7f4}.vf-danger{border:1px solid #7f2940;background:#2a0815;color:#ff9bad}.vf-routines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.vf-routine-day{border:1px solid #2e5c8d;border-radius:16px;background:rgba(4,17,38,.78);padding:16px}.vf-routine-day h3{color:#F6C344;margin:0 0 4px}.vf-routine-list{margin:12px 0 0;padding:0;list-style:none}.vf-routine-list li{padding:8px 0;border-top:1px solid rgba(66,94,125,.22);font-size:12px}
        .vf-editor{border:1px solid #F6C344;background:rgba(3,13,30,.88);border-radius:18px;padding:18px;margin-top:18px}.vf-editor-head{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vf-text{width:100%;background:#07172b;border:1px solid #31577e;color:white;border-radius:9px;padding:10px;outline:none}.vf-day-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.vf-day-tab{border:1px solid #31577e;background:#07172b;color:#dce7f4;border-radius:9px;padding:9px 12px;cursor:pointer}.vf-day-tab.active{border-color:#F6C344;color:#F6C344}.vf-edit-ex{display:grid;grid-template-columns:36px minmax(180px,1fr) 90px 90px 80px auto;gap:8px;align-items:center;padding:10px 0;border-top:1px solid rgba(66,94,125,.22)}.vf-edit-ex:first-of-type{border-top:0}.vf-edit-controls{display:flex;gap:4px}.vf-edit-controls button{border:1px solid #31577e;background:#07172b;color:#dce7f4;border-radius:7px;padding:7px;cursor:pointer}
        .vf-library-head{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:9px;margin-bottom:12px}.vf-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.vf-lib-card{border:1px solid #294f75;background:linear-gradient(135deg,rgba(4,25,56,.82),rgba(26,5,26,.72));border-radius:13px;padding:12px}.vf-lib-card h3{font-size:14px;margin:0 0 6px}.vf-lib-meta{font-size:10px;color:#9aabc0;line-height:1.5}.vf-lib-card button{margin-top:9px;width:100%}.vf-lib-count{color:#F6C344;font-weight:900;margin:0 0 12px}.vf-custom-form{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:8px;margin:12px 0}.vf-setting{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid rgba(66,94,125,.25)}.vf-setting:last-child{border-bottom:0}.vf-setting select,.vf-setting button{background:#09192f;color:white;border:1px solid #31577e;border-radius:9px;padding:9px 12px}
        .vf-bottom{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:20;width:min(calc(100% - 24px),1100px);display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #1a63a9;background:rgba(1,10,24,.94);backdrop-filter:blur(14px);border-radius:14px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.45)}.vf-nav{min-height:64px;border:0;border-right:1px solid rgba(52,89,129,.32);background:transparent;color:#d5dfeb;cursor:pointer;font-size:10px;font-weight:800}.vf-nav:last-child{border-right:0}.vf-nav span{display:block;font-size:20px;margin-bottom:4px}.vf-nav.active{color:#F6C344;background:linear-gradient(180deg,rgba(12,63,118,.24),rgba(165,0,68,.16));box-shadow:inset 0 -3px 0 #F6C344}.vf-home{display:inline-block;color:#9aabc0;text-decoration:none;font-size:11px;margin:4px 0 84px}
        @media(max-width:850px){.vf-topbar{grid-template-columns:1fr auto}.vf-day{grid-column:1/-1;grid-row:2;justify-content:center}.vf-actions{display:none}.vf-stats{grid-template-columns:1fr 1fr}.vf-stat:nth-child(3),.vf-stat:nth-child(4){border-top:1px solid rgba(84,124,165,.35)}.vf-stat:nth-child(3):before{display:none}.vf-progress-grid,.vf-routines,.vf-library-grid{grid-template-columns:1fr 1fr}.vf-library-head{grid-template-columns:1fr 1fr}.vf-custom-form{grid-template-columns:1fr 1fr}.vf-edit-ex{grid-template-columns:32px 1fr 75px 75px 65px}.vf-edit-controls{grid-column:2/-1}.vf-bottom{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:620px){.vf-app{padding:10px 8px 120px}.vf-brand-title{font-size:22px}.vf-logo{width:46px;height:46px}.vf-compare-grid{grid-template-columns:1fr}.vf-card-actions{grid-template-columns:1fr}.vf-alt-list,.vf-library-grid,.vf-progress-grid,.vf-routines{grid-template-columns:1fr}.vf-library-head,.vf-custom-form,.vf-editor-head{grid-template-columns:1fr}.vf-card-head{grid-template-columns:auto 1fr}.vf-ex-icon{display:none}.vf-ex-title{font-size:18px}.vf-series-row{grid-template-columns:28px repeat(3,minmax(0,1fr));gap:5px}.vf-panel{padding:10px 8px}.vf-bottom{bottom:6px}.vf-nav{min-height:54px;font-size:8px}.vf-nav span{font-size:17px}.vf-edit-ex{grid-template-columns:30px 1fr 58px 58px 58px;gap:5px}.vf-edit-ex .vf-text{padding:7px;font-size:11px}}
      `}</style>

      <div className="vf-shell">
        <header className="vf-topbar">
          <div className="vf-brand"><img className="vf-logo" src="/barca.png" alt="FC Barcelona" /><div><div className="vf-brand-title">VITOR<span>FIT</span></div><div className="vf-brand-sub">MÉS QUE UN ENTRENAMIENTO</div></div></div>
          <div className="vf-day">
            <button onClick={() => cambiarDia(-1)}>‹</button>
            <div className="vf-day-pill">🗓️ {diaActual?.titulo ?? "SIN DÍA"}</div>
            <button onClick={() => cambiarDia(1)}>›</button>
          </div>
          <div className="vf-actions"><button className="vf-icon-button" onClick={() => setVista("progreso")}>📈</button><button className="vf-icon-button" onClick={() => setVista("ajustes")}>☰</button></div>
        </header>
        <div className="vf-routine-name">{rutinaActual?.nombre} · {diaActual?.subtitulo}</div>

        {vista === "entreno" && diaActual && <>
          <section className="vf-stats">
            <div className="vf-stat"><div className="vf-ring" style={{ ["--progress" as string]: Math.round((completados / Math.max(1, diaActual.ejercicios.length)) * 100) }}><div className="vf-ring-text">{completados}/{diaActual.ejercicios.length}</div></div><div className="vf-stat-label">EJERCICIOS</div><div className="vf-stat-sub">completados</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🕘</div><div className="vf-stat-value">{formatoTiempo(segundos)}</div><div className="vf-stat-label">DURACIÓN</div><div className="vf-stat-sub">del entrenamiento</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🔥</div><div className="vf-stat-value">{kcal}</div><div className="vf-stat-label">KCAL</div><div className="vf-stat-sub">estimadas</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🏆</div><div className="vf-stat-value" style={{fontSize:20}}>¡TÚ PUEDES!</div><div className="vf-stat-sub">Cada repetición te acerca a tu mejor versión</div><div className="vf-stat-sub" style={{marginTop:8,color:"#F6C344"}}>{seriesCompletadas} series hechas</div></div>
          </section>

          {diaActual.ejercicios.map((ej,index)=>{
            const anterior=ultimoRegistro(ej), actuales=registros[ej.id]??seriesVacias(ej.series), varianteActual=nombreVariante(ej), alternativas=alternativasPara(ej);
            return <section className="vf-card" key={ej.id}>
              <div className="vf-card-head"><div className="vf-num">{String(index+1).padStart(2,"0")}</div><div><div className="vf-title-row"><div className="vf-ex-title">{varianteActual}</div><span className="vf-tag">{ej.musculo}</span></div><div className="vf-prescription">🎯 {ej.series} series · {ej.reps} reps · RIR {ej.rir} · {ej.equipo}</div></div><div className="vf-ex-icon">{ej.icono}</div></div>
              <div className="vf-alt-wrap">
                <button className="vf-alt-button" onClick={()=>setAlternativasAbiertas(p=>({...p,[ej.id]:!p[ej.id]}))}>🔄 ¿Está ocupado o no puedes hacerlo? ALTERNAR</button>
                {alternativasAbiertas[ej.id]&&<><div className="vf-alt-tools"><button className={(modoAlternativa[ej.id]??"patron")==="patron"?"active":""} onClick={()=>setModoAlternativa(p=>({...p,[ej.id]:"patron"}))}>🎯 MISMO PATRÓN</button><button className={modoAlternativa[ej.id]==="musculo"?"active":""} onClick={()=>setModoAlternativa(p=>({...p,[ej.id]:"musculo"}))}>💪 MISMO MÚSCULO</button></div><div className="vf-alt-list">{alternativas.map(alt=><button key={alt.id} className={`vf-alt-option ${varianteActual===alt.nombre?"active":""}`} onClick={()=>{setVariantes(p=>({...p,[ej.id]:alt.nombre}));setAlternativasAbiertas(p=>({...p,[ej.id]:false}));setMensaje(`🔄 Cambiado a ${alt.nombre}. Series, reps y RIR se mantienen.`)}}><strong>{alt.nombre}</strong><br/><span className="vf-muted">{alt.equipo} · {alt.patron}</span></button>)}</div></>}
              </div>
              <div className="vf-compare-grid">
                <div className="vf-panel last"><div className="vf-panel-head"><span>📈 ÚLTIMA SESIÓN</span>{anterior&&<span className="vf-date">{anterior.fecha.split(",")[0]}</span>}</div>{Array.from({length:ej.series},(_,i)=>{const s=anterior?.series?.[i];return <div className="vf-series-row" key={i}><div className="vf-slabel">S{i+1}</div><div className="vf-box"><strong>{s?.kg||"—"}</strong><small>KG</small></div><div className="vf-box"><strong>{s?.reps||"—"}</strong><small>REPS</small></div><div className="vf-box"><strong>{s?.rir||"—"}</strong><small>RIR</small></div></div>})}{anterior&&anterior.variante!==varianteActual&&<div className="vf-muted">Último registro: {anterior.variante}</div>}</div>
                <div className="vf-panel today"><div className="vf-panel-head"><span>✏️ HOY</span><span className="vf-muted">{varianteActual}</span></div>{Array.from({length:ej.series},(_,i)=>{const s=actuales[i]??{kg:"",reps:"",rir:""},comp=compararSerie(ej,i);return <div className="vf-series-row" key={i}><div className="vf-slabel">S{i+1}</div><input className="vf-input" type="number" placeholder="KG" value={s.kg} onChange={e=>setSerie(ej,i,"kg",e.target.value)}/><input className="vf-input" type="number" placeholder="REPS" value={s.reps} onChange={e=>setSerie(ej,i,"reps",e.target.value)}/><input className="vf-input" type="number" placeholder="RIR" value={s.rir} onChange={e=>setSerie(ej,i,"rir",e.target.value)}/>{comp&&<div className="vf-compare">{comp}</div>}</div>})}</div>
              </div>
              <div className="vf-card-actions"><button className="vf-save" onClick={()=>guardarEjercicio(ej)}>💾 GUARDAR ENTRENAMIENTO</button><button className="vf-rest" onClick={()=>setDescansoRestante(ej.descanso??ajustes.descanso)}>⏱️ {descansoRestante>0?`DESCANSO ${descansoRestante}s`:`DESCANSO ${ej.descanso??ajustes.descanso}s`}</button></div>
            </section>
          })}
          {!diaActual.ejercicios.length&&<section className="vf-section-card">Este día todavía no tiene ejercicios. Ve a <strong>RUTINAS</strong> para añadirlos desde la biblioteca.</section>}
          <a className="vf-home" href="/">← Volver al inicio</a>
        </>}

        {vista==="historial"&&<><h1 className="vf-page-title">📚 HISTORIAL</h1>{rutinas.flatMap(r=>r.dias.flatMap(d=>d.ejercicios)).map(ej=>{const lista=[...(historial[ej.id]??[])].reverse();if(!lista.length)return null;return <section className="vf-section-card" key={ej.id}><div className="vf-history-name">{ej.nombre}</div><div className="vf-muted">{ej.patron} · {lista.length} sesiones</div>{lista.slice(0,8).map((r,i)=><div className="vf-history-ex" key={`${r.fecha}-${i}`}><div><strong>{r.variante}</strong><div className="vf-muted">{r.fecha}</div><div className="vf-mini-series">{r.series.map((s,si)=><span className="vf-mini-chip" key={si}>S{si+1}: {s.kg||"—"}kg · {s.reps||"—"} reps · RIR {s.rir||"—"}</span>)}</div></div><span className="vf-tag">{ej.musculo}</span></div>)}</section>})}{Object.keys(historial).length===0&&<div className="vf-section-card">Todavía no hay entrenamientos guardados.</div>}</>}

        {vista==="progreso"&&<><h1 className="vf-page-title">📈 PROGRESO Y RÉCORDS</h1><div className="vf-progress-grid">{progreso.filter(p=>p.sesiones>0).map((p,i)=><div className="vf-record" key={`${p.rutina}-${p.dia}-${p.nombre}-${i}`}><div className="vf-muted">{p.rutina} · {p.dia}</div><h3>{p.nombre}</h3><div className="vf-record-big">{p.mejorKg?`${p.mejorKg} KG`:"—"}</div><div className="vf-muted">Récord de peso</div><div style={{marginTop:10}}><strong>🏆 Mejor serie:</strong> {p.mejorTexto}</div><div className="vf-muted">e1RM aprox.: {p.mejorE1rm?`${p.mejorE1rm.toFixed(1)} kg`:"—"}</div><div style={{marginTop:8,color:"#F6C344",fontWeight:900}}>Tendencia: {p.tendencia}</div><div className="vf-muted">{p.sesiones} sesiones guardadas</div></div>)}</div>{progreso.every(p=>p.sesiones===0)&&<div className="vf-section-card">Guarda entrenamientos y aquí aparecerán tus récords y evolución automáticamente.</div>}</>}

        {vista==="rutinas"&&<><h1 className="vf-page-title">📋 MIS RUTINAS</h1><div className="vf-toolbar"><button className="vf-primary" onClick={crearRutina}>＋ CREAR RUTINA</button><button className="vf-secondary" onClick={()=>setVista("biblioteca")}>📚 BIBLIOTECA ({biblioteca.length})</button></div><div className="vf-routines">{rutinas.map(r=><div className="vf-routine-day" key={r.id}><h3>{r.nombre}</h3><div className="vf-muted">{r.descripcion} · {r.dias.length} días</div><ul className="vf-routine-list">{r.dias.map(d=><li key={d.id}><strong>{d.titulo}</strong> · {d.subtitulo}<br/><span className="vf-muted">{d.ejercicios.length} ejercicios</span></li>)}</ul><div className="vf-toolbar" style={{marginTop:12,marginBottom:0}}><button className="vf-primary" onClick={()=>{setRutinaActualId(r.id);setDiaActualIndex(0);setVista("entreno")}}>▶ USAR</button><button className="vf-secondary" onClick={()=>{setEditorRutinaId(r.id);setEditorDiaId(r.dias[0]?.id??null)}}>✏️ EDITAR</button><button className="vf-secondary" onClick={()=>duplicarRutina(r)}>⧉ DUPLICAR</button><button className="vf-danger" onClick={()=>eliminarRutina(r.id)}>🗑️</button></div></div>)}</div>
          {editorRutina&&<section className="vf-editor"><h2 style={{color:"#F6C344",marginTop:0}}>✏️ EDITAR RUTINA</h2><div className="vf-editor-head"><input className="vf-text" value={editorRutina.nombre} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,nombre:e.target.value}))}/><input className="vf-text" value={editorRutina.descripcion} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,descripcion:e.target.value}))}/></div><div className="vf-day-tabs">{editorRutina.dias.map(d=><button className={`vf-day-tab ${editorDia?.id===d.id?"active":""}`} key={d.id} onClick={()=>setEditorDiaId(d.id)}>{d.titulo}</button>)}<button className="vf-primary" onClick={()=>crearDia(editorRutina.id)}>＋ DÍA</button></div>{editorDia&&<><div className="vf-editor-head"><input className="vf-text" value={editorDia.titulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{titulo:e.target.value})}/><input className="vf-text" value={editorDia.subtitulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{subtitulo:e.target.value})}/></div><div className="vf-toolbar" style={{marginTop:12}}><button className="vf-primary" onClick={()=>{setTargetBiblioteca({rutinaId:editorRutina.id,diaId:editorDia.id});setVista("biblioteca")}}>＋ AÑADIR EJERCICIO</button><button className="vf-danger" onClick={()=>eliminarDia(editorRutina.id,editorDia.id)}>🗑️ ELIMINAR DÍA</button></div>{editorDia.ejercicios.map((ex,i)=><div className="vf-edit-ex" key={ex.id}><strong>{i+1}</strong><div><strong>{ex.nombre}</strong><div className="vf-muted">{ex.musculo} · {ex.patron}</div></div><input className="vf-text" type="number" min={1} value={ex.series} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{series:Math.max(1,Number(e.target.value)||1)})}/><input className="vf-text" value={ex.reps} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{reps:e.target.value})}/><input className="vf-text" value={ex.rir} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{rir:e.target.value})}/><div className="vf-edit-controls"><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,-1)}>↑</button><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,1)}>↓</button><button onClick={()=>eliminarEjercicioRutina(editorRutina.id,editorDia.id,ex.id)}>🗑️</button></div></div>)}{!editorDia.ejercicios.length&&<div className="vf-muted" style={{padding:"18px 0"}}>Este día está vacío. Pulsa “Añadir ejercicio”.</div>}</>}</section>}
        </>}

        {vista==="biblioteca"&&<><h1 className="vf-page-title">📚 BIBLIOTECA DE EJERCICIOS</h1><p className="vf-lib-count">{biblioteca.length} ejercicios disponibles · {resultadosBiblioteca.length} visibles</p>{targetBiblioteca&&<div className="vf-section-card" style={{borderColor:"#F6C344"}}>➕ Estás añadiendo ejercicios a una rutina. Pulsa <strong>AÑADIR</strong> en todos los que quieras y después vuelve a RUTINAS.</div>}<div className="vf-library-head"><input className="vf-text" placeholder="🔎 Buscar ejercicio, músculo, patrón..." value={busquedaBiblioteca} onChange={e=>setBusquedaBiblioteca(e.target.value)}/><select className="vf-text" value={filtroMusculo} onChange={e=>setFiltroMusculo(e.target.value)}>{musculos.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroPatron} onChange={e=>setFiltroPatron(e.target.value)}>{patrones.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroEquipo} onChange={e=>setFiltroEquipo(e.target.value)}>{equipos.map(x=><option key={x}>{x}</option>)}</select></div><div className="vf-toolbar"><button className="vf-primary" onClick={()=>setMostrarCrearEjercicio(!mostrarCrearEjercicio)}>⭐ CREAR EJERCICIO PERSONALIZADO</button>{targetBiblioteca&&<button className="vf-secondary" onClick={()=>setVista("rutinas")}>← VOLVER AL EDITOR</button>}</div>{mostrarCrearEjercicio&&<div className="vf-section-card"><strong>⭐ Nuevo ejercicio personalizado</strong><div className="vf-custom-form"><input className="vf-text" placeholder="Nombre" value={nuevoEjercicio.nombre} onChange={e=>setNuevoEjercicio(n=>({...n,nombre:e.target.value}))}/><input className="vf-text" placeholder="Músculo" value={nuevoEjercicio.musculo} onChange={e=>setNuevoEjercicio(n=>({...n,musculo:e.target.value}))}/><input className="vf-text" placeholder="Patrón" value={nuevoEjercicio.patron} onChange={e=>setNuevoEjercicio(n=>({...n,patron:e.target.value}))}/><input className="vf-text" placeholder="Equipo" value={nuevoEjercicio.equipo} onChange={e=>setNuevoEjercicio(n=>({...n,equipo:e.target.value}))}/><select className="vf-text" value={nuevoEjercicio.tipo} onChange={e=>setNuevoEjercicio(n=>({...n,tipo:e.target.value as "Compuesto"|"Aislamiento"}))}><option>Compuesto</option><option>Aislamiento</option></select></div><button className="vf-primary" onClick={crearEjercicioPersonal}>GUARDAR EN BIBLIOTECA</button></div>}<div className="vf-library-grid">{resultadosBiblioteca.map(ex=><div className="vf-lib-card" key={ex.id}><h3>{ex.icono} {ex.nombre}</h3><div className="vf-lib-meta">💪 {ex.musculo}<br/>🎯 {ex.patron}<br/>⚙️ {ex.equipo} · {ex.tipo}</div>{targetBiblioteca&&<button className="vf-primary" onClick={()=>añadirDesdeBiblioteca(ex)}>＋ AÑADIR</button>}</div>)}</div>{!resultadosBiblioteca.length&&<div className="vf-section-card">No encontré ejercicios con esos filtros.</div>}</>}

        {vista==="ajustes"&&<><h1 className="vf-page-title">⚙️ AJUSTES</h1><section className="vf-section-card"><div className="vf-setting"><div><strong>Descanso automático</strong><div className="vf-muted">Tiempo predeterminado</div></div><select value={ajustes.descanso} onChange={e=>setAjustes(a=>({...a,descanso:Number(e.target.value)}))}><option value={60}>60 s</option><option value={90}>90 s</option><option value={120}>120 s</option><option value={180}>180 s</option></select></div><div className="vf-setting"><div><strong>Comparación automática</strong><div className="vf-muted">Muestra +KG, +REPS o igual</div></div><button onClick={()=>setAjustes(a=>({...a,mostrarComparacion:!a.mostrarComparacion}))}>{ajustes.mostrarComparacion?"ACTIVADA":"DESACTIVADA"}</button></div><div className="vf-setting"><div><strong>Limpiar datos de HOY</strong><div className="vf-muted">No borra historial ni récords</div></div><button onClick={()=>{setRegistros({});setMensaje("🧹 Campos de HOY limpiados. Historial intacto.")}}>LIMPIAR</button></div><div className="vf-setting"><div><strong>Restaurar rutinas base</strong><div className="vf-muted">No borra tu historial ni biblioteca personal</div></div><button onClick={restaurarRutinas}>RESTAURAR</button></div></section><section className="vf-section-card"><strong>📚 Biblioteca</strong><p className="vf-muted" style={{lineHeight:1.6}}>VitorFit incluye {biblioteca.length} ejercicios entre la biblioteca base y tus ejercicios personalizados. Las alternativas se generan automáticamente por mismo patrón o mismo músculo.</p></section><section className="vf-section-card"><strong>🔒 Datos</strong><p className="vf-muted" style={{lineHeight:1.6}}>Rutinas, biblioteca personal, historial, ajustes y registros se guardan en localStorage. Se mantiene la migración de tus datos antiguos.</p></section></>}
      </div>

      {mensaje&&<div className="vf-message" onClick={()=>setMensaje("")}>{mensaje}</div>}
      <nav className="vf-bottom">
        <button className={`vf-nav ${vista==="entreno"?"active":""}`} onClick={()=>setVista("entreno")}><span>🏋️</span>ENTRENO</button>
        <button className={`vf-nav ${vista==="historial"?"active":""}`} onClick={()=>setVista("historial")}><span>🕘</span>HISTORIAL</button>
        <button className={`vf-nav ${vista==="progreso"?"active":""}`} onClick={()=>setVista("progreso")}><span>📈</span>PROGRESO</button>
        <button className={`vf-nav ${vista==="rutinas"?"active":""}`} onClick={()=>setVista("rutinas")}><span>📋</span>RUTINAS</button>
        <button className={`vf-nav ${vista==="biblioteca"?"active":""}`} onClick={()=>{setTargetBiblioteca(null);setVista("biblioteca")}}><span>📚</span>BIBLIOTECA</button>
        <button className={`vf-nav ${vista==="ajustes"?"active":""}`} onClick={()=>setVista("ajustes")}><span>⚙️</span>AJUSTES</button>
      </nav>
    </main>
  );
}
