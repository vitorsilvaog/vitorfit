"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";



import { createClient } from "../../utils/supabase/client";

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

type CalendarEntry = {
  rutinaId: string;
  diaIndex: number;
  completado: boolean;
};

type CalendarMap = Record<string, CalendarEntry>;
type CreatinaMap = Record<string, boolean>;

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

const BASE_LIBRARY: LibraryExercise[] = FAMILIAS.flatMap((f) =>
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

// VitorFit amplía la biblioteca base con variantes útiles del mismo movimiento.
// Así llegamos a 1000 entradas reales para búsqueda y ALTERNAR sin perder
// la clasificación por músculo, patrón, equipo y tipo.
const REGLAS_VARIANTES = [
  { id: "pausa", etiqueta: "Pausa 1 s", sufijo: " · Pausa 1 s" },
  { id: "tempo", etiqueta: "Tempo 3-1-1", sufijo: " · Tempo 3-1-1" },
  { id: "control", etiqueta: "Recorrido controlado", sufijo: " · Recorrido controlado" },
  { id: "unilateral", etiqueta: "Unilateral", sufijo: " · Unilateral" },
  { id: "bilateral", etiqueta: "Bilateral", sufijo: " · Bilateral" },
  { id: "agarre-neutro", etiqueta: "Agarre neutro", sufijo: " · Agarre neutro" },
  { id: "agarre-prono", etiqueta: "Agarre prono", sufijo: " · Agarre prono" },
  { id: "agarre-supino", etiqueta: "Agarre supino", sufijo: " · Agarre supino" },
] as const;

const reglaValida = (e: LibraryExercise, reglaId: string) => {
  const texto = `${e.nombre} ${e.patron} ${e.equipo}`.toLowerCase();
  const esCardio = /cinta|bicicleta|remo erg|elíptica|trineo|sled|carrera|caminata/.test(texto);
  const esCoreEstatico = /plancha|plank|hold|hollow|bird dog|dead bug/.test(texto);
  const yaUnilateral = /unilateral|1 mano|una mano|1 pierna|una pierna/.test(texto);
  const yaBilateral = /bilateral/.test(texto);
  const admiteAgarres = /jalón|jalon|remo|dominada|curl|pullover|tríceps|triceps|polea|barra/.test(texto);

  if (reglaId === "unilateral") return !esCardio && !esCoreEstatico && !yaUnilateral;
  if (reglaId === "bilateral") return !esCardio && !esCoreEstatico && !yaBilateral && yaUnilateral;
  if (reglaId.startsWith("agarre-")) return admiteAgarres;
  if (reglaId === "tempo" || reglaId === "pausa" || reglaId === "control") return !esCardio;
  return true;
};

const BUILTIN_LIBRARY: LibraryExercise[] = (() => {
  const salida: LibraryExercise[] = [...BASE_LIBRARY];
  const usados = new Set(salida.map((e) => e.nombre.toLowerCase()));

  for (const regla of REGLAS_VARIANTES) {
    for (const base of BASE_LIBRARY) {
      if (salida.length >= 1000) break;
      if (!reglaValida(base, regla.id)) continue;
      const nombre = `${base.nombre}${regla.sufijo}`;
      if (usados.has(nombre.toLowerCase())) continue;
      usados.add(nombre.toLowerCase());
      salida.push({
        ...base,
        id: `${base.id}-${regla.id}`,
        nombre,
      });
    }
    if (salida.length >= 1000) break;
  }

  // Si alguna familia tuviera pocas variantes aplicables, completamos con
  // variantes técnicas seguras manteniendo exactamente el mismo patrón.
  let vuelta = 1;
  while (salida.length < 1000) {
    for (const base of BASE_LIBRARY) {
      if (salida.length >= 1000) break;
      const nombre = `${base.nombre} · Variante técnica ${vuelta}`;
      if (usados.has(nombre.toLowerCase())) continue;
      usados.add(nombre.toLowerCase());
      salida.push({ ...base, id: `${base.id}-tecnica-${vuelta}`, nombre });
    }
    vuelta += 1;
  }

  return salida.slice(0, 1000);
})();

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
const keyCalendario = "vitorfit-calendario-v1";
const keyCreatina = "vitorfit-creatina-v1";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export default function Entrenamiento() {
const supabase = useMemo(() => createClient(), []);
const router = useRouter();

async function cerrarSesion() {
  await supabase.auth.signOut();
  window.location.href = "/login";
}
  const [vista, setVista] = useState<"inicio" | "entreno" | "historial" | "progreso" | "rutinas" | "biblioteca" | "calendario" | "ajustes">("inicio");
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
  const [inicioEntreno, setInicioEntreno] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [entrenoPausado, setEntrenoPausado] = useState(false);
  const [descansoRestante, setDescansoRestante] = useState(0);
  const [ajustes, setAjustes] = useState<Ajustes>({ descanso: 90, mostrarComparacion: true, mostrarRir: true });
  const [mensaje, setMensaje] = useState("");
  const [calendario, setCalendario] = useState<CalendarMap>({});
  const [mesCalendario, setMesCalendario] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [rutinaPlanId, setRutinaPlanId] = useState(DEFAULT_ROUTINES[0].id);
  const [diaPlanIndex, setDiaPlanIndex] = useState(0);
  const [creatina, setCreatina] = useState<CreatinaMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [nubeLista, setNubeLista] = useState(false);

  const biblioteca = useMemo(() => [...BUILTIN_LIBRARY, ...bibliotecaPersonal], [bibliotecaPersonal]);
  const rutinaActual = rutinas.find((r) => r.id === rutinaActualId) ?? rutinas[0] ?? DEFAULT_ROUTINES[0];
  const diaActual = rutinaActual?.dias?.[diaActualIndex] ?? rutinaActual?.dias?.[0];

  // Identifica al usuario y, si existe, carga su copia personal desde Supabase.
  useEffect(() => {
    let activo = true;

    const cargarUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      if (!activo) return;
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("vitorfit_user_data")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!activo) return;

      if (error) {
        console.error("VitorFit: no se pudo cargar Supabase", error);
        setMensaje("⚠️ No pude cargar la nube. Tus datos locales siguen disponibles.");
        setNubeLista(true);
        return;
      }

      const nube = data?.data as any;
      if (nube) {
        if (nube.registros) setRegistros(nube.registros);
        if (nube.historial) setHistorial(nube.historial);
        if (nube.variantes) setVariantes(nube.variantes);
        if (nube.ajustes) setAjustes(nube.ajustes);
        if (nube.rutinas) setRutinas(nube.rutinas);
        if (nube.bibliotecaPersonal) setBibliotecaPersonal(nube.bibliotecaPersonal);
        if (nube.rutinaActualId) setRutinaActualId(nube.rutinaActualId);
        if (typeof nube.diaActualIndex === "number") setDiaActualIndex(nube.diaActualIndex);
        if (nube.calendario) setCalendario(nube.calendario);
        if (nube.creatina) setCreatina(nube.creatina);
      }

      setNubeLista(true);
    };

    cargarUsuario();
    return () => { activo = false; };
  }, [router, supabase]);

  useEffect(() => {
    if (inicioEntreno === null || entrenoPausado) return;
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicioEntreno) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [inicioEntreno, entrenoPausado]);

  const abrirEntrenamiento = () => {
    if (inicioEntreno === null) {
      setInicioEntreno(Date.now());
      setSegundos(0);
      setEntrenoPausado(false);
    }
    setVista("entreno");
  };

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
      const cal = localStorage.getItem(keyCalendario);
      const cr = localStorage.getItem(keyCreatina);

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
      if (cal) setCalendario(JSON.parse(cal));
      if (cr) setCreatina(JSON.parse(cr));
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
  useEffect(() => localStorage.setItem(keyCalendario, JSON.stringify(calendario)), [calendario]);
  useEffect(() => localStorage.setItem(keyCreatina, JSON.stringify(creatina)), [creatina]);

  // Mantiene una copia en Supabase separada por usuario. Espera a terminar la carga
  // inicial para no sobrescribir accidentalmente datos existentes con valores vacíos.
  useEffect(() => {
    if (!userId || !nubeLista) return;

    const timer = window.setTimeout(async () => {
      const data = {
        registros,
        historial,
        variantes,
        ajustes,
        rutinas,
        bibliotecaPersonal,
        rutinaActualId,
        diaActualIndex,
        calendario,
        creatina,
      };

      const { error } = await supabase
        .from("vitorfit_user_data")
        .upsert(
          { user_id: userId, data, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("VitorFit: no se pudo guardar en Supabase", error);
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    userId, nubeLista, registros, historial, variantes, ajustes, rutinas,
    bibliotecaPersonal, rutinaActualId, diaActualIndex, calendario, creatina, supabase,
  ]);

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
    abrirEntrenamiento();
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

  const claveFecha = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const hoyClave = claveFecha(new Date());
  const creatinaHoy = !!creatina[hoyClave];

  const toggleCreatinaFecha = (fecha: Date) => {
    const k = claveFecha(fecha);
    setCreatina((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k]; else next[k] = true;
      return next;
    });
  };

  const marcarCreatinaHoy = () => {
    if (creatinaHoy) {
      setMensaje("💊 La creatina de hoy ya estaba marcada.");
      return;
    }
    setCreatina((prev) => ({ ...prev, [hoyClave]: true }));
    setMensaje("✅ Creatina de hoy marcada como tomada");
  };

  const estadisticasCreatina = useMemo(() => {
    const hoy = new Date();
    const y = mesCalendario.getFullYear();
    const m = mesCalendario.getMonth();
    const diasMes = new Date(y, m + 1, 0).getDate();
    const limite = y === hoy.getFullYear() && m === hoy.getMonth() ? hoy.getDate() : (new Date(y, m + 1, 0) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) ? diasMes : 0);
    let tomadosMes = 0;
    for (let d = 1; d <= diasMes; d++) {
      const k = claveFecha(new Date(y, m, d));
      if (creatina[k]) tomadosMes++;
    }

    let rachaActual = 0;
    const cursor = new Date();
    cursor.setHours(0,0,0,0);
    if (!creatina[claveFecha(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (creatina[claveFecha(cursor)]) {
      rachaActual++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const fechas = Object.keys(creatina).filter((k) => creatina[k]).sort();
    let mejorRacha = 0, racha = 0, anterior: Date | null = null;
    for (const k of fechas) {
      const [yy, mm, dd] = k.split("-").map(Number);
      const actual = new Date(yy, mm - 1, dd);
      if (anterior) {
        const esperado = new Date(anterior);
        esperado.setDate(esperado.getDate() + 1);
        racha = claveFecha(esperado) === k ? racha + 1 : 1;
      } else racha = 1;
      if (racha > mejorRacha) mejorRacha = racha;
      anterior = actual;
    }
    const porcentaje = limite > 0 ? Math.round((tomadosMes / limite) * 100) : 0;
    return { tomadosMes, limite, porcentaje, rachaActual, mejorRacha };
  }, [creatina, mesCalendario]);

  const rutinaPlan = rutinas.find((r) => r.id === rutinaPlanId) ?? rutinas[0] ?? DEFAULT_ROUTINES[0];
  const diaPlan = rutinaPlan?.dias?.[diaPlanIndex] ?? rutinaPlan?.dias?.[0];

  const planificarFecha = (fecha: Date) => {
    if (!rutinaPlan || !diaPlan) return;
    const k = claveFecha(fecha);
    setCalendario((prev) => {
      const actual = prev[k];
      if (!actual) return { ...prev, [k]: { rutinaId: rutinaPlan.id, diaIndex: diaPlanIndex, completado: false } };
      if (!actual.completado) return { ...prev, [k]: { ...actual, completado: true } };
      const copia = { ...prev }; delete copia[k]; return copia;
    });
  };

  const abrirEntrenoCalendario = (entry: CalendarEntry) => {
    const rut = rutinas.find((r) => r.id === entry.rutinaId);
    if (!rut) return;
    setRutinaActualId(rut.id);
    setDiaActualIndex(Math.min(entry.diaIndex, Math.max(0, rut.dias.length - 1)));
    abrirEntrenamiento();
  };

  const diasDelMes = useMemo(() => {
    const y = mesCalendario.getFullYear(), m = mesCalendario.getMonth();
    const primero = new Date(y, m, 1);
    const ultimo = new Date(y, m + 1, 0);
    const offsetLunes = (primero.getDay() + 6) % 7;
    const celdas: Array<Date | null> = Array.from({ length: offsetLunes }, () => null);
    for (let d = 1; d <= ultimo.getDate(); d++) celdas.push(new Date(y, m, d));
    while (celdas.length % 7 !== 0) celdas.push(null);
    return celdas;
  }, [mesCalendario]);

  const resumenCalendario = useMemo(() => {
    const pref = `${mesCalendario.getFullYear()}-${String(mesCalendario.getMonth()+1).padStart(2,"0")}-`;
    const entries = (Object.entries(calendario) as Array<[string, CalendarEntry]>).filter(([k]) => k.startsWith(pref));
    return { planificados: entries.length, completados: entries.filter(([,v]) => v.completado).length };
  }, [calendario, mesCalendario]);

  const rachaCalendario = useMemo(() => {
    let racha = 0; const d = new Date(); d.setHours(0,0,0,0);
    while (true) { const e = calendario[claveFecha(d)]; if (!e?.completado) break; racha++; d.setDate(d.getDate()-1); }
    return racha;
  }, [calendario]);

  const togglePausaEntreno = () => {
    if (inicioEntreno === null) { abrirEntrenamiento(); return; }
    if (entrenoPausado) {
      setInicioEntreno(Date.now() - segundos * 1000);
      setEntrenoPausado(false);
      setMensaje("▶️ Entrenamiento reanudado");
    } else {
      setEntrenoPausado(true);
      setMensaje("⏸️ Entrenamiento pausado");
    }
  };

  const Anatomia = ({ musculo }: { musculo: string }) => {
    const m = musculo.toLowerCase();
    const espalda = /dorsal|espalda|trapecio|lumbar|femoral|glúteo|gluteo|tríceps|triceps|gemelo|sóleo|soleo/.test(m);
    const activo = (zona: string) => {
      if (zona === "pecho") return m.includes("pecho");
      if (zona === "hombro") return m.includes("hombro") || m.includes("deltoide");
      if (zona === "biceps") return m.includes("bíceps") || m.includes("biceps") || m.includes("braquial");
      if (zona === "triceps") return m.includes("tríceps") || m.includes("triceps");
      if (zona === "espalda") return m.includes("dorsal") || m.includes("espalda") || m.includes("trapecio");
      if (zona === "lumbar") return m.includes("lumbar");
      if (zona === "abdomen") return m.includes("abdomen") || m.includes("core") || m.includes("oblic");
      if (zona === "cuadriceps") return m.includes("cuádriceps") || m.includes("cuadriceps") || m.includes("aductor");
      if (zona === "femoral") return m.includes("femoral");
      if (zona === "gluteo") return m.includes("glúteo") || m.includes("gluteo");
      if (zona === "gemelo") return m.includes("gemelo") || m.includes("sóleo") || m.includes("soleo");
      if (zona === "antebrazo") return m.includes("antebrazo") || m.includes("agarre");
      return false;
    };
    const cls = (zona: string) => activo(zona) ? "an-muscle active" : "an-muscle";
    return <div className="vf-anatomy" title={`Zona principal: ${musculo}`}>
      <svg viewBox="0 0 120 180" role="img" aria-label={`Músculos trabajados: ${musculo}`}>
        <defs><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#111111"/><stop offset=".48" stopColor="#353535"/><stop offset=".78" stopColor="#666666"/><stop offset="1" stopColor="#1b1b1b"/></linearGradient></defs>
        <circle cx="60" cy="17" r="12" className="an-body"/><path d="M51 28 Q60 32 69 28 L73 35 Q88 39 91 51 L84 78 76 73 77 55 72 49 73 91 68 108 70 119 66 169 55 169 52 121 48 169 37 169 40 119 42 108 37 91 47 49 42 50 36 56 34 74 26 78 29 51 Q32 39 47 35Z" className="an-body"/>
        {!espalda ? <>
          <path d="M47 38 Q53 34 59 38 L58 55 Q50 57 43 50Z" className={cls("pecho")}/><path d="M61 38 Q67 34 73 38 L77 50 Q69 57 62 55Z" className={cls("pecho")}/><ellipse cx="39" cy="43" rx="7" ry="8" className={cls("hombro")}/><ellipse cx="81" cy="43" rx="7" ry="8" className={cls("hombro")}/><path d="M32 51 Q37 48 41 52 L37 70 Q33 71 29 68Z" className={cls("biceps")}/><path d="M79 52 Q84 48 88 51 L91 68 Q87 71 83 70Z" className={cls("biceps")}/><path d="M27 73 Q31 70 36 73 L33 91 Q29 93 25 89Z" className={cls("antebrazo")}/><path d="M84 73 Q89 70 93 73 L95 89 Q91 93 87 91Z" className={cls("antebrazo")}/><path d="M50 57 L58 57 58 88 48 88 45 72Z" className={cls("abdomen")}/><path d="M62 57 L70 57 75 72 72 88 62 88Z" className={cls("abdomen")}/><path d="M41 109 Q47 104 53 110 L51 137 42 137Z" className={cls("cuadriceps")}/><path d="M57 110 Q63 104 69 109 L68 137 59 137Z" className={cls("cuadriceps")}/>
        </> : <>
          <path d="M49 34 Q60 29 71 34 L76 48 69 54 60 47 51 54 44 48Z" className={cls("espalda")}/><path d="M44 48 Q51 50 59 56 L56 88 43 82 39 62Z" className={cls("espalda")}/><path d="M76 48 Q69 50 61 56 L64 88 77 82 81 62Z" className={cls("espalda")}/><path d="M51 82 L59 85 58 104 47 101Z" className={cls("lumbar")}/><path d="M61 85 L69 82 73 101 62 104Z" className={cls("lumbar")}/><path d="M31 51 Q36 48 41 52 L37 71 31 69Z" className={cls("triceps")}/><path d="M79 52 Q84 48 89 51 L89 69 83 71Z" className={cls("triceps")}/><path d="M42 104 Q50 99 58 106 L54 119 41 118Z" className={cls("gluteo")}/><path d="M62 106 Q70 99 78 104 L79 118 66 119Z" className={cls("gluteo")}/><path d="M41 119 L53 120 51 143 42 145Z" className={cls("femoral")}/><path d="M67 120 L79 119 78 145 69 143Z" className={cls("femoral")}/><path d="M41 143 L50 142 49 164 40 164Z" className={cls("gemelo")}/><path d="M70 142 L79 143 80 164 71 164Z" className={cls("gemelo")}/>
        </>}
        <path d="M50 31 Q60 36 70 31 M47 92 Q60 98 73 92 M52 120 L60 112 68 120" className="an-detail"/>
      </svg><span>{musculo}</span></div>;
  };

  const editorRutina = rutinas.find((r) => r.id === editorRutinaId) ?? null;
  const editorDia = editorRutina?.dias.find((d) => d.id === editorDiaId) ?? editorRutina?.dias[0] ?? null;

  return (
    <main className="vf-app">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#020402} button,input,select{font:inherit}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        .vf-app{min-height:100vh;color:#fff;font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 50% -10%,rgba(141,255,0,.10),transparent 32%),linear-gradient(135deg,#020402 0%,#070a07 50%,#020402 100%);padding:18px 16px 110px}
        .vf-shell{width:min(100%,1100px);margin:0 auto}.vf-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding:12px 4px 18px}
        .vf-brand{display:flex;align-items:center;gap:12px;min-width:0}.vf-logo{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(246,195,68,.28))}.vf-brand-title{font-size:26px;font-weight:1000;letter-spacing:.6px;line-height:1;color:#8DFF00}.vf-brand-title span{color:#8DFF00}.vf-brand-sub{margin-top:5px;color:#8DFF00;font-size:10px;font-weight:800;letter-spacing:1.1px}
        .vf-day{display:flex;align-items:center;gap:8px}.vf-day button,.vf-icon-button{width:42px;height:42px;border-radius:12px;border:1px solid #263126;background:rgba(1,12,30,.88);color:#8DFF00;font-size:22px;cursor:pointer}.vf-day-pill{min-width:170px;text-align:center;padding:12px 18px;border:1px solid #344234;border-radius:13px;color:#8DFF00;font-weight:900;background:rgba(2,11,28,.72)}.vf-actions{display:flex;justify-content:flex-end;gap:10px}
        .vf-routine-name{text-align:center;color:#aab4aa;font-size:11px;margin:-7px 0 12px}.vf-stats{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.35fr;border:1px solid #293329;border-radius:18px;overflow:hidden;background:rgba(2,10,25,.72);margin-bottom:22px}.vf-stat{min-height:132px;padding:20px 12px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}.vf-stat+.vf-stat:before{content:"";position:absolute;left:0;top:26px;bottom:26px;width:1px;background:rgba(84,124,165,.4)}.vf-ring{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(#8DFF00 calc(var(--progress)*1%),#314331 0 72%,#111811 0);position:relative}.vf-ring:after{content:"";position:absolute;inset:9px;border-radius:50%;background:#080c08}.vf-ring-text{position:relative;z-index:1;font-weight:1000;font-size:24px}.vf-stat-icon{font-size:28px;margin-bottom:8px}.vf-stat-value{font-size:24px;font-weight:1000}.vf-stat-label{color:#8DFF00;font-size:11px;font-weight:900;letter-spacing:.6px;margin-top:5px}.vf-stat-sub{color:#b8c0b8;font-size:11px;line-height:1.35;margin-top:4px}
        .vf-card{border:1px solid rgba(234,28,75,.8);border-radius:18px;background:linear-gradient(135deg,rgba(7,10,7,.98),rgba(12,16,12,.98));margin-bottom:18px;overflow:hidden;box-shadow:0 16px 34px rgba(0,0,0,.22)}.vf-card-head{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px 12px}.vf-num{width:50px;height:50px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:1000;color:#8DFF00;background:linear-gradient(135deg,#172500,#4b7600);border:1px solid #8DFF00}.vf-title-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.vf-ex-title{font-size:23px;font-weight:1000;text-transform:uppercase;line-height:1.08}.vf-tag{color:#8DFF00;border:1px solid rgba(141,255,0,.45);background:rgba(141,255,0,.10);border-radius:7px;padding:5px 9px;font-size:10px;font-weight:1000;text-transform:uppercase}.vf-prescription{margin-top:7px;color:#8DFF00;font-size:13px;font-weight:700}.vf-ex-icon{font-size:44px;min-width:56px;text-align:center}
        .vf-anatomy{width:82px;min-width:82px;text-align:center;color:#8DFF00;font-size:8px;font-weight:900;text-transform:uppercase}.vf-anatomy svg{display:block;width:64px;height:78px;margin:auto;filter:drop-shadow(0 0 7px rgba(141,255,0,.12))}.vf-anatomy .an-body{fill:url(#skin);stroke:#8a8a8a;stroke-width:1.15}.vf-anatomy .an-muscle{fill:rgba(120,120,120,.14);stroke:#242424;stroke-width:.65}.vf-anatomy .an-muscle.active{fill:#ef2323;stroke:#8f0000;stroke-width:1;filter:drop-shadow(0 0 3px rgba(255,25,25,.78))}.vf-anatomy .an-detail{fill:none;stroke:#9a9a9a;stroke-width:.8;opacity:.75}.vf-pause{margin-top:9px;border:1px solid #8DFF00;background:#0a1107;color:#8DFF00;border-radius:8px;padding:6px 10px;font-size:10px;font-weight:1000;cursor:pointer}.vf-pause.paused{background:#8DFF00;color:#050805}.vf-lib-top{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.vf-lib-muscle{color:#ff3b3b;font-size:10px;font-weight:1000;text-transform:uppercase;margin-top:4px}
        .vf-alt-wrap{padding:0 18px 12px}.vf-alt-button{width:100%;border:1px dashed rgba(246,195,68,.38);background:rgba(0,0,0,.18);color:#f2d77a;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:800;font-size:12px}.vf-alt-tools{display:flex;gap:8px;margin-top:8px}.vf-alt-tools button{flex:1;border:1px solid #303a30;background:#07162b;color:#bdc5bd;border-radius:9px;padding:8px;cursor:pointer;font-size:11px;font-weight:800}.vf-alt-tools button.active{border-color:#8DFF00;color:#8DFF00}.vf-alt-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px;max-height:260px;overflow:auto}.vf-alt-option{border:1px solid #303a30;background:#090e09;color:#e5ebe5;padding:10px;border-radius:10px;cursor:pointer;text-align:left;font-size:12px}.vf-alt-option.active{border-color:#8DFF00;color:#8DFF00;box-shadow:0 0 0 1px rgba(246,195,68,.18) inset}
        .vf-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 18px 14px}.vf-panel{border-radius:14px;padding:14px;min-width:0}.vf-panel.last{border:1px solid #526052;background:rgba(3,21,46,.74)}.vf-panel.today{border:1px solid #8DFF00;background:rgba(19,8,24,.76)}.vf-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;font-size:13px;font-weight:1000;color:#8DFF00}.vf-date{border:1px solid #526052;border-radius:8px;padding:5px 8px;color:#b9c5b9;font-size:10px;white-space:nowrap}.vf-series-row{display:grid;grid-template-columns:36px repeat(3,minmax(0,1fr));gap:8px;align-items:center;margin-bottom:9px}.vf-slabel{color:#8DFF00;font-weight:1000;font-size:16px}.vf-box{min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #3a453a;background:#090d09;border-radius:9px;text-align:center}.vf-box strong{font-size:18px}.vf-box small{color:#9da79d;font-size:9px;margin-top:2px}.vf-input{width:100%;min-width:0;min-height:52px;border:1px solid #3a453a;background:#090d09;color:white;border-radius:9px;text-align:center;outline:none;font-size:16px;font-weight:800}.vf-input:focus{border-color:#8DFF00;box-shadow:0 0 0 2px rgba(233,30,80,.12)}.vf-compare{grid-column:2/5;color:#8DFF00;font-size:10px;font-weight:900;margin-top:-4px;line-height:1.2}.vf-card-actions{display:grid;grid-template-columns:1fr 190px;gap:12px;padding:0 18px 18px}.vf-save{border:1px solid #8DFF00;color:#8DFF00;background:linear-gradient(90deg,#5ba800,#75d600,#4b7600);border-radius:11px;min-height:48px;font-weight:1000;cursor:pointer;font-size:14px}.vf-rest{border:1px solid #3b473b;color:#8DFF00;background:#080d08;border-radius:11px;min-height:48px;font-weight:1000;cursor:pointer}
        .vf-message{position:fixed;left:50%;transform:translateX(-50%);bottom:88px;z-index:50;max-width:min(92vw,720px);padding:10px 14px;background:#090e09;border:1px solid #8DFF00;border-radius:10px;color:#8DFF00;font-weight:800;font-size:12px;box-shadow:0 12px 30px rgba(0,0,0,.45)}.vf-page-title{margin:4px 0 16px;font-size:28px;font-weight:1000;color:#8DFF00}.vf-section-card{border:1px solid #283228;background:rgba(3,13,30,.76);border-radius:16px;padding:16px;margin-bottom:12px}.vf-muted{color:#9ca89c;font-size:12px}.vf-history-ex{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;padding:12px 0;border-bottom:1px solid rgba(80,111,146,.24)}.vf-history-ex:last-child{border-bottom:0}.vf-history-name{font-weight:900}.vf-mini-series{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.vf-mini-chip{border:1px solid #354035;background:#090d09;border-radius:8px;padding:6px 8px;font-size:10px}.vf-progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.vf-record{border:1px solid #303a30;border-radius:14px;background:linear-gradient(135deg,rgba(8,14,8,.9),rgba(3,6,3,.9));padding:14px}.vf-record h3{margin:0 0 6px;font-size:15px}.vf-record-big{font-size:24px;color:#8DFF00;font-weight:1000;margin:8px 0 2px}
        .vf-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.vf-primary,.vf-secondary,.vf-danger{border-radius:10px;padding:10px 13px;font-weight:900;cursor:pointer}.vf-primary{border:1px solid #8DFF00;background:linear-gradient(90deg,#5ca900,#78db00,#4b7600);color:#8DFF00}.vf-secondary{border:1px solid #354035;background:#090e09;color:#e5ebe5}.vf-danger{border:1px solid #7f2940;background:#2a0815;color:#ff9bad}.vf-routines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.vf-routine-day{border:1px solid #303b30;border-radius:16px;background:rgba(4,17,38,.78);padding:16px}.vf-routine-day h3{color:#8DFF00;margin:0 0 4px}.vf-routine-list{margin:12px 0 0;padding:0;list-style:none}.vf-routine-list li{padding:8px 0;border-top:1px solid rgba(66,94,125,.22);font-size:12px}
        .vf-editor{border:1px solid #8DFF00;background:rgba(3,13,30,.88);border-radius:18px;padding:18px;margin-top:18px}.vf-editor-head{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vf-text{width:100%;background:#090e09;border:1px solid #354035;color:white;border-radius:9px;padding:10px;outline:none}.vf-day-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.vf-day-tab{border:1px solid #354035;background:#090e09;color:#e5ebe5;border-radius:9px;padding:9px 12px;cursor:pointer}.vf-day-tab.active{border-color:#8DFF00;color:#8DFF00}.vf-edit-ex{display:grid;grid-template-columns:36px minmax(180px,1fr) 90px 90px 80px auto;gap:8px;align-items:center;padding:10px 0;border-top:1px solid rgba(66,94,125,.22)}.vf-edit-ex:first-of-type{border-top:0}.vf-edit-controls{display:flex;gap:4px}.vf-edit-controls button{border:1px solid #354035;background:#090e09;color:#e5ebe5;border-radius:7px;padding:7px;cursor:pointer}
        .vf-library-head{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:9px;margin-bottom:12px}.vf-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.vf-lib-card{border:1px solid #303a30;background:linear-gradient(135deg,rgba(8,14,8,.9),rgba(3,6,3,.9));border-radius:13px;padding:12px}.vf-lib-card h3{font-size:14px;margin:0 0 6px}.vf-lib-meta{font-size:10px;color:#9ca89c;line-height:1.5}.vf-lib-card button{margin-top:9px;width:100%}.vf-lib-count{color:#8DFF00;font-weight:900;margin:0 0 12px}.vf-custom-form{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:8px;margin:12px 0}.vf-setting{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid rgba(66,94,125,.25)}.vf-setting:last-child{border-bottom:0}.vf-setting select,.vf-setting button{background:#09192f;color:white;border:1px solid #354035;border-radius:9px;padding:9px 12px}
        .vf-start{display:grid;gap:16px;padding:12px 0 24px}.vf-start-hero{border:1px solid #6b5614;background:linear-gradient(135deg,rgba(246,195,68,.12),rgba(2,10,25,.82));border-radius:22px;padding:28px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.28)}.vf-start-hero h1{margin:0;color:#8DFF00;font-size:clamp(28px,6vw,48px);font-weight:1000}.vf-start-hero p{margin:10px 0 0;color:#aab4aa}.vf-start-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.vf-start-card{border:1px solid #303a30;background:rgba(3,13,30,.82);border-radius:18px;padding:20px;text-align:left;color:#fff;cursor:pointer;min-height:118px}.vf-start-card strong{display:block;color:#8DFF00;font-size:18px;margin:8px 0 5px}.vf-start-card span{color:#a9b3a9;font-size:12px;line-height:1.5}.vf-start-card .vf-start-icon{font-size:28px}.vf-start-card.primary{grid-column:1/-1;border-color:#8DFF00;background:linear-gradient(135deg,rgba(246,195,68,.18),rgba(165,0,68,.12))}@media(max-width:650px){.vf-start-grid{grid-template-columns:1fr}.vf-start-card.primary{grid-column:auto}}
        .vf-bottom{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:20;width:min(calc(100% - 24px),1100px);display:grid;grid-template-columns:repeat(8,1fr);border:1px solid #334033;background:rgba(1,10,24,.94);backdrop-filter:blur(14px);border-radius:14px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.45)}.vf-nav{min-height:64px;border:0;border-right:1px solid rgba(52,89,129,.32);background:transparent;color:#e3e8e3;cursor:pointer;font-size:10px;font-weight:800}.vf-nav:last-child{border-right:0}.vf-nav span{display:block;font-size:20px;margin-bottom:4px}.vf-nav.active{color:#8DFF00;background:linear-gradient(180deg,rgba(12,63,118,.24),rgba(165,0,68,.16));box-shadow:inset 0 -3px 0 #8DFF00}.vf-home{display:inline-block;color:#9ca89c;text-decoration:none;font-size:11px;margin:4px 0 84px}
        .vf-calendar-top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:end;margin-bottom:14px}.vf-calendar-controls{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vf-calendar-month{display:flex;align-items:center;gap:10px}.vf-calendar-month button{width:42px;height:42px;border-radius:10px;border:1px solid #354035;background:#09192f;color:#8DFF00;cursor:pointer;font-size:20px}.vf-calendar-title{font-size:22px;font-weight:1000;color:#8DFF00;text-transform:capitalize}.vf-calendar-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.vf-calendar-stat{border:1px solid #303a30;background:rgba(3,13,30,.78);border-radius:13px;padding:12px;text-align:center}.vf-calendar-stat strong{display:block;font-size:22px;color:#8DFF00}.vf-calendar-week{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-bottom:6px}.vf-calendar-week div{text-align:center;color:#7f93aa;font-size:11px;font-weight:900;padding:6px}.vf-calendar-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}.vf-cal-day{min-height:112px;border:1px solid #283228;background:rgba(4,17,38,.78);border-radius:12px;padding:9px;cursor:pointer;position:relative;transition:.15s}.vf-cal-day:hover{border-color:#8DFF00;transform:translateY(-1px)}.vf-cal-day.empty{opacity:0;pointer-events:none}.vf-cal-day.today{box-shadow:inset 0 0 0 2px #8DFF00}.vf-cal-day.planned{border-color:#526052;background:linear-gradient(135deg,rgba(0,77,152,.28),rgba(4,17,38,.9))}.vf-cal-day.done{border-color:#8DFF00;background:linear-gradient(135deg,rgba(0,105,76,.28),rgba(4,17,38,.9))}.vf-cal-num{font-weight:1000;font-size:15px}.vf-cal-badge{margin-top:8px;font-size:10px;font-weight:900;color:#8DFF00;line-height:1.35}.vf-cal-done{color:#8DFF00}.vf-cal-open{margin-top:8px;width:100%;border:1px solid #354035;background:#090d09;color:#e5ebe5;border-radius:7px;padding:6px;font-size:9px;font-weight:900;cursor:pointer}.vf-calendar-help{color:#9ca89c;font-size:11px;line-height:1.55;margin:8px 0 16px}
        @media(max-width:850px){.vf-topbar{grid-template-columns:1fr auto}.vf-day{grid-column:1/-1;grid-row:2;justify-content:center}.vf-actions{display:none}.vf-stats{grid-template-columns:1fr 1fr}.vf-stat:nth-child(3),.vf-stat:nth-child(4){border-top:1px solid rgba(84,124,165,.35)}.vf-stat:nth-child(3):before{display:none}.vf-progress-grid,.vf-routines,.vf-library-grid{grid-template-columns:1fr 1fr}.vf-library-head{grid-template-columns:1fr 1fr}.vf-custom-form{grid-template-columns:1fr 1fr}.vf-edit-ex{grid-template-columns:32px 1fr 75px 75px 65px}.vf-edit-controls{grid-column:2/-1}.vf-bottom{grid-template-columns:repeat(3,1fr)}}
        .vf-creatine-today{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;border:1px solid rgba(56,217,150,.55);background:linear-gradient(135deg,rgba(2,70,48,.34),rgba(4,17,38,.88));border-radius:16px;padding:14px 16px;margin-bottom:16px;box-shadow:0 12px 28px rgba(0,0,0,.18)}.vf-creatine-today.pending{border-color:rgba(246,195,68,.58);background:linear-gradient(135deg,rgba(104,70,0,.22),rgba(4,17,38,.9))}.vf-creatine-title{font-size:13px;font-weight:1000;color:#8DFF00;letter-spacing:.6px}.vf-creatine-status{font-size:21px;font-weight:1000;margin-top:4px;color:#8DFF00}.vf-creatine-today.pending .vf-creatine-status{color:#8DFF00}.vf-creatine-button{border:1px solid #8DFF00;background:linear-gradient(90deg,#4d9000,#6ac400);color:white;border-radius:10px;padding:11px 14px;font-weight:1000;cursor:pointer;white-space:nowrap}.vf-creatine-button.done{background:#090d09;border-color:#354035;color:#a9b3a9}.vf-creatine-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0 16px}.vf-creatine-stat{border:1px solid #303a30;background:rgba(3,13,30,.78);border-radius:13px;padding:12px;text-align:center}.vf-creatine-stat strong{display:block;font-size:21px;color:#8DFF00}.vf-creatine-stat span{display:block;margin-top:3px}.vf-creatine-ring{width:92px;height:92px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;background:conic-gradient(#8DFF00 calc(var(--creatine-pct) * 1%),#151d15 0);position:relative}.vf-creatine-ring:after{content:"";position:absolute;inset:9px;background:#080c08;border-radius:50%}.vf-creatine-ring strong{position:relative;z-index:1;font-size:22px;color:#fff}.vf-creatine-day{margin-top:7px;width:100%;border:1px solid #354035;background:#090d09;color:#a9b3a9;border-radius:7px;padding:5px 4px;font-size:9px;font-weight:900;cursor:pointer}.vf-creatine-day.taken{border-color:#8DFF00;background:rgba(7,112,67,.35);color:#baff68}.vf-creatine-note{border:1px solid rgba(56,217,150,.34);background:rgba(4,40,30,.28);border-radius:12px;padding:12px 14px;color:#b8c8d9;font-size:11px;line-height:1.55;margin:12px 0 16px}
        @media(max-width:620px){.vf-creatine-today{grid-template-columns:1fr}.vf-creatine-button{width:100%}.vf-creatine-summary{grid-template-columns:1fr 1fr}.vf-app{padding:10px 8px 120px}.vf-brand-title{font-size:22px}.vf-logo{width:46px;height:46px}.vf-compare-grid{grid-template-columns:1fr}.vf-card-actions{grid-template-columns:1fr}.vf-alt-list,.vf-library-grid,.vf-progress-grid,.vf-routines{grid-template-columns:1fr}.vf-library-head,.vf-custom-form,.vf-editor-head{grid-template-columns:1fr}.vf-card-head{grid-template-columns:auto 1fr auto}.vf-anatomy{width:58px;min-width:58px}.vf-anatomy svg{width:48px;height:62px}.vf-anatomy span{display:none}.vf-ex-title{font-size:18px}.vf-series-row{grid-template-columns:28px repeat(3,minmax(0,1fr));gap:5px}.vf-panel{padding:10px 8px}.vf-bottom{bottom:6px}.vf-nav{min-height:54px;font-size:8px}.vf-nav span{font-size:17px}.vf-edit-ex{grid-template-columns:30px 1fr 58px 58px 58px;gap:5px}.vf-edit-ex .vf-text{padding:7px;font-size:11px}.vf-calendar-top{grid-template-columns:1fr}.vf-calendar-controls{grid-template-columns:1fr}.vf-calendar-stats{grid-template-columns:repeat(3,1fr)}.vf-cal-day{min-height:84px;padding:6px}.vf-cal-badge{font-size:8px}.vf-cal-open{display:none}}
      `}</style>

      <div className="vf-shell">
        <header className="vf-topbar">
          <div className="vf-brand"><img className="vf-logo" src="/icon-192.png" alt="VitorFit" /><div><div className="vf-brand-title">VITOR<span>FIT</span></div><div className="vf-brand-sub">SUPERA TUS LÍMITES</div></div></div>
          <div className="vf-day">
            <button onClick={() => cambiarDia(-1)}>‹</button>
            <div className="vf-day-pill">🗓️ {diaActual?.titulo ?? "SIN DÍA"}</div>
            <button onClick={() => cambiarDia(1)}>›</button>
          </div>
          <div className="vf-actions"><button className="vf-icon-button" onClick={() => setVista("progreso")}>📈</button><button className="vf-icon-button" onClick={() => setVista("ajustes")}>☰</button></div>
        </header>
        <div className="vf-routine-name">{rutinaActual?.nombre} · {diaActual?.subtitulo}</div>

        {vista === "inicio" && <>
          <section className="vf-start">
            <div className="vf-start-hero">
              <h1>VITORFIT</h1>
              <p>Elige qué quieres hacer. El entrenamiento no empieza hasta que tú pulses Entrenar.</p>
            </div>
            <div className="vf-start-grid">
              <button className="vf-start-card primary" onClick={abrirEntrenamiento}><div className="vf-start-icon">🏋️</div><strong>EMPEZAR ENTRENAMIENTO</strong><span>{diaActual?.titulo} · {diaActual?.subtitulo}</span></button>
              <button className="vf-start-card" onClick={()=>setVista("rutinas")}><div className="vf-start-icon">↕️</div><strong>ORDENAR EJERCICIOS</strong><span>Entra en Rutinas, abre cualquiera de tus 4 días y usa ↑ ↓ para cambiar solo el orden.</span></button>
              <button className="vf-start-card" onClick={()=>setVista("progreso")}><div className="vf-start-icon">📈</div><strong>PROGRESO</strong><span>Consulta marcas, sesiones e historial de evolución.</span></button>
              <button className="vf-start-card" onClick={()=>setVista("calendario")}><div className="vf-start-icon">📅</div><strong>CALENDARIO</strong><span>Planifica entrenamientos y registra tu creatina.</span></button>
              <button className="vf-start-card" onClick={()=>setVista("historial")}><div className="vf-start-icon">🕘</div><strong>HISTORIAL</strong><span>Revisa tus entrenamientos anteriores.</span></button>
            </div>
          </section>
        </>}

        {vista === "entreno" && diaActual && <>
          <section className="vf-stats">
            <div className="vf-stat"><div className="vf-ring" style={{ ["--progress" as string]: Math.round((completados / Math.max(1, diaActual.ejercicios.length)) * 100) }}><div className="vf-ring-text">{completados}/{diaActual.ejercicios.length}</div></div><div className="vf-stat-label">EJERCICIOS</div><div className="vf-stat-sub">completados</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🕘</div><div className="vf-stat-value">{formatoTiempo(segundos)}</div><div className="vf-stat-label">DURACIÓN</div><div className="vf-stat-sub">{entrenoPausado ? "PAUSADO" : "del entrenamiento"}</div><button className={`vf-pause ${entrenoPausado?"paused":""}`} onClick={togglePausaEntreno}>{entrenoPausado?"▶ REANUDAR":"⏸ PAUSAR"}</button></div>
            <div className="vf-stat"><div className="vf-stat-icon">🔥</div><div className="vf-stat-value">{kcal}</div><div className="vf-stat-label">KCAL</div><div className="vf-stat-sub">estimadas</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🏆</div><div className="vf-stat-value" style={{fontSize:20}}>¡TÚ PUEDES!</div><div className="vf-stat-sub">Cada repetición te acerca a tu mejor versión</div><div className="vf-stat-sub" style={{marginTop:8,color:"#8DFF00"}}>{seriesCompletadas} series hechas</div></div>
          </section>

          {diaActual.ejercicios.map((ej,index)=>{
            const anterior=ultimoRegistro(ej), actuales=registros[ej.id]??seriesVacias(ej.series), varianteActual=nombreVariante(ej), alternativas=alternativasPara(ej);
            return <section className="vf-card" key={ej.id}>
              <div className="vf-card-head"><div className="vf-num">{String(index+1).padStart(2,"0")}</div><div><div className="vf-title-row"><div className="vf-ex-title">{varianteActual}</div><span className="vf-tag">{ej.musculo}</span></div><div className="vf-prescription">🎯 {ej.series} series · {ej.reps} reps · RIR {ej.rir} · {ej.equipo}</div></div><Anatomia musculo={ej.musculo} /></div>
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

        {vista==="progreso"&&<><h1 className="vf-page-title">📈 PROGRESO Y RÉCORDS</h1><div className="vf-progress-grid">{progreso.filter(p=>p.sesiones>0).map((p,i)=><div className="vf-record" key={`${p.rutina}-${p.dia}-${p.nombre}-${i}`}><div className="vf-muted">{p.rutina} · {p.dia}</div><h3>{p.nombre}</h3><div className="vf-record-big">{p.mejorKg?`${p.mejorKg} KG`:"—"}</div><div className="vf-muted">Récord de peso</div><div style={{marginTop:10}}><strong>🏆 Mejor serie:</strong> {p.mejorTexto}</div><div className="vf-muted">e1RM aprox.: {p.mejorE1rm?`${p.mejorE1rm.toFixed(1)} kg`:"—"}</div><div style={{marginTop:8,color:"#8DFF00",fontWeight:900}}>Tendencia: {p.tendencia}</div><div className="vf-muted">{p.sesiones} sesiones guardadas</div></div>)}</div>{progreso.every(p=>p.sesiones===0)&&<div className="vf-section-card">Guarda entrenamientos y aquí aparecerán tus récords y evolución automáticamente.</div>}</>}

        {vista==="rutinas"&&<><h1 className="vf-page-title">📋 MIS RUTINAS</h1><div className="vf-toolbar"><button className="vf-primary" onClick={crearRutina}>＋ CREAR RUTINA</button><button className="vf-secondary" onClick={()=>setVista("biblioteca")}>📚 BIBLIOTECA ({biblioteca.length})</button></div><div className="vf-routines">{rutinas.map(r=><div className="vf-routine-day" key={r.id}><h3>{r.nombre}</h3><div className="vf-muted">{r.descripcion} · {r.dias.length} días</div><ul className="vf-routine-list">{r.dias.map(d=><li key={d.id}><strong>{d.titulo}</strong> · {d.subtitulo}<br/><span className="vf-muted">{d.ejercicios.length} ejercicios</span></li>)}</ul><div className="vf-toolbar" style={{marginTop:12,marginBottom:0}}><button className="vf-primary" onClick={()=>{setRutinaActualId(r.id);setDiaActualIndex(0);setVista("entreno")}}>▶ USAR</button><button className="vf-secondary" onClick={()=>{setEditorRutinaId(r.id);setEditorDiaId(r.dias[0]?.id??null)}}>✏️ EDITAR</button><button className="vf-secondary" onClick={()=>duplicarRutina(r)}>⧉ DUPLICAR</button><button className="vf-danger" onClick={()=>eliminarRutina(r.id)}>🗑️</button></div></div>)}</div>
          {editorRutina&&<section className="vf-editor"><h2 style={{color:"#8DFF00",marginTop:0}}>✏️ EDITAR RUTINA</h2><div className="vf-editor-head"><input className="vf-text" value={editorRutina.nombre} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,nombre:e.target.value}))}/><input className="vf-text" value={editorRutina.descripcion} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,descripcion:e.target.value}))}/></div><div className="vf-day-tabs">{editorRutina.dias.map(d=><button className={`vf-day-tab ${editorDia?.id===d.id?"active":""}`} key={d.id} onClick={()=>setEditorDiaId(d.id)}>{d.titulo}</button>)}<button className="vf-primary" onClick={()=>crearDia(editorRutina.id)}>＋ DÍA</button></div>{editorDia&&<><div className="vf-editor-head"><input className="vf-text" value={editorDia.titulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{titulo:e.target.value})}/><input className="vf-text" value={editorDia.subtitulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{subtitulo:e.target.value})}/></div><div className="vf-toolbar" style={{marginTop:12}}><button className="vf-primary" onClick={()=>{setTargetBiblioteca({rutinaId:editorRutina.id,diaId:editorDia.id});setVista("biblioteca")}}>＋ AÑADIR EJERCICIO</button><button className="vf-danger" onClick={()=>eliminarDia(editorRutina.id,editorDia.id)}>🗑️ ELIMINAR DÍA</button></div>{editorDia.ejercicios.map((ex,i)=><div className="vf-edit-ex" key={ex.id}><strong>{i+1}</strong><div><strong>{ex.nombre}</strong><div className="vf-muted">{ex.musculo} · {ex.patron}</div></div><input className="vf-text" type="number" min={1} value={ex.series} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{series:Math.max(1,Number(e.target.value)||1)})}/><input className="vf-text" value={ex.reps} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{reps:e.target.value})}/><input className="vf-text" value={ex.rir} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{rir:e.target.value})}/><div className="vf-edit-controls"><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,-1)}>↑</button><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,1)}>↓</button><button onClick={()=>eliminarEjercicioRutina(editorRutina.id,editorDia.id,ex.id)}>🗑️</button></div></div>)}{!editorDia.ejercicios.length&&<div className="vf-muted" style={{padding:"18px 0"}}>Este día está vacío. Pulsa “Añadir ejercicio”.</div>}</>}</section>}
        </>}

        {vista==="biblioteca"&&<><h1 className="vf-page-title">📚 BIBLIOTECA DE EJERCICIOS</h1><p className="vf-lib-count">{biblioteca.length} ejercicios disponibles · {resultadosBiblioteca.length} visibles</p>{targetBiblioteca&&<div className="vf-section-card" style={{borderColor:"#8DFF00"}}>➕ Estás añadiendo ejercicios a una rutina. Pulsa <strong>AÑADIR</strong> en todos los que quieras y después vuelve a RUTINAS.</div>}<div className="vf-library-head"><input className="vf-text" placeholder="🔎 Buscar ejercicio, músculo, patrón..." value={busquedaBiblioteca} onChange={e=>setBusquedaBiblioteca(e.target.value)}/><select className="vf-text" value={filtroMusculo} onChange={e=>setFiltroMusculo(e.target.value)}>{musculos.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroPatron} onChange={e=>setFiltroPatron(e.target.value)}>{patrones.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroEquipo} onChange={e=>setFiltroEquipo(e.target.value)}>{equipos.map(x=><option key={x}>{x}</option>)}</select></div><div className="vf-toolbar"><button className="vf-primary" onClick={()=>setMostrarCrearEjercicio(!mostrarCrearEjercicio)}>⭐ CREAR EJERCICIO PERSONALIZADO</button>{targetBiblioteca&&<button className="vf-secondary" onClick={()=>setVista("rutinas")}>← VOLVER AL EDITOR</button>}</div>{mostrarCrearEjercicio&&<div className="vf-section-card"><strong>⭐ Nuevo ejercicio personalizado</strong><div className="vf-custom-form"><input className="vf-text" placeholder="Nombre" value={nuevoEjercicio.nombre} onChange={e=>setNuevoEjercicio(n=>({...n,nombre:e.target.value}))}/><input className="vf-text" placeholder="Músculo" value={nuevoEjercicio.musculo} onChange={e=>setNuevoEjercicio(n=>({...n,musculo:e.target.value}))}/><input className="vf-text" placeholder="Patrón" value={nuevoEjercicio.patron} onChange={e=>setNuevoEjercicio(n=>({...n,patron:e.target.value}))}/><input className="vf-text" placeholder="Equipo" value={nuevoEjercicio.equipo} onChange={e=>setNuevoEjercicio(n=>({...n,equipo:e.target.value}))}/><select className="vf-text" value={nuevoEjercicio.tipo} onChange={e=>setNuevoEjercicio(n=>({...n,tipo:e.target.value as "Compuesto"|"Aislamiento"}))}><option>Compuesto</option><option>Aislamiento</option></select></div><button className="vf-primary" onClick={crearEjercicioPersonal}>GUARDAR EN BIBLIOTECA</button></div>}<div className="vf-library-grid">{resultadosBiblioteca.map(ex=><div className="vf-lib-card" key={ex.id}><div className="vf-lib-top"><div><h3>{ex.nombre}</h3><div className="vf-lib-muscle">{ex.musculo}</div></div><Anatomia musculo={ex.musculo} /></div><div className="vf-lib-meta">💪 {ex.musculo}<br/>🎯 {ex.patron}<br/>⚙️ {ex.equipo} · {ex.tipo}</div>{targetBiblioteca&&<button className="vf-primary" onClick={()=>añadirDesdeBiblioteca(ex)}>＋ AÑADIR</button>}</div>)}</div>{!resultadosBiblioteca.length&&<div className="vf-section-card">No encontré ejercicios con esos filtros.</div>}</>}

        {vista==="calendario"&&<>
          <h1 className="vf-page-title">📅 CALENDARIO GYM</h1>
          <div className="vf-calendar-top">
            <div className="vf-calendar-month">
              <button onClick={()=>setMesCalendario(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>‹</button>
              <div className="vf-calendar-title">{mesCalendario.toLocaleDateString("es-ES",{month:"long",year:"numeric"})}</div>
              <button onClick={()=>setMesCalendario(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>›</button>
            </div>
            <div className="vf-calendar-controls">
              <select className="vf-text" value={rutinaPlanId} onChange={e=>{setRutinaPlanId(e.target.value);setDiaPlanIndex(0)}}>{rutinas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select>
              <select className="vf-text" value={diaPlanIndex} onChange={e=>setDiaPlanIndex(Number(e.target.value))}>{(rutinaPlan?.dias??[]).map((d,i)=><option key={d.id} value={i}>{d.titulo} · {d.subtitulo}</option>)}</select>
            </div>
          </div>
          <div className="vf-calendar-stats">
            <div className="vf-calendar-stat"><strong>{resumenCalendario.planificados}</strong><span className="vf-muted">Planificados</span></div>
            <div className="vf-calendar-stat"><strong>{resumenCalendario.completados}</strong><span className="vf-muted">Completados</span></div>
            <div className="vf-calendar-stat"><strong>{rachaCalendario}</strong><span className="vf-muted">Racha actual 🔥</span></div>
          </div>
          <div className="vf-creatine-summary">
            <div className="vf-creatine-stat"><strong>{estadisticasCreatina.tomadosMes}/{estadisticasCreatina.limite || "—"}</strong><span className="vf-muted">Creatina este mes</span></div>
            <div className="vf-creatine-stat"><strong>{estadisticasCreatina.porcentaje}%</strong><span className="vf-muted">Cumplimiento</span></div>
            <div className="vf-creatine-stat"><strong>{estadisticasCreatina.rachaActual} 🔥</strong><span className="vf-muted">Racha actual</span></div>
            <div className="vf-creatine-stat"><strong>{estadisticasCreatina.mejorRacha}</strong><span className="vf-muted">Mejor racha</span></div>
          </div>
          <div className="vf-creatine-note"><strong>💊 GYM + CREATINA:</strong> el gimnasio solo se marca los días que entrenas, pero la creatina puede marcarse todos los días. Usa el botón verde dentro de cada fecha para registrar la toma sin modificar el entrenamiento planificado.</div>
          <div className="vf-calendar-help">Selecciona arriba la rutina y el día. Haz clic una vez en una fecha para <strong>planificar</strong>; otra vez para marcarlo <strong>completado</strong>; una tercera vez para quitarlo. En los días planificados puedes pulsar “ENTRENAR” para abrir directamente esa sesión.</div>
          <div className="vf-calendar-week">{["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map(x=><div key={x}>{x}</div>)}</div>
          <div className="vf-calendar-grid">
            {diasDelMes.map((fecha,i)=>{
              if(!fecha)return <div className="vf-cal-day empty" key={`e-${i}`}/>;
              const k=claveFecha(fecha), entry=calendario[k];
              const rut=entry?rutinas.find(r=>r.id===entry.rutinaId):null;
              const dia=entry?rut?.dias?.[entry.diaIndex]:null;
              const hoy=claveFecha(new Date())===k;
              return <div key={k} className={`vf-cal-day ${entry?(entry.completado?"done":"planned"):""} ${hoy?"today":""}`} onClick={()=>planificarFecha(fecha)}>
                <div className="vf-cal-num">{fecha.getDate()}</div>
                {entry&&<><div className={`vf-cal-badge ${entry.completado?"vf-cal-done":""}`}>{entry.completado?"✅ COMPLETADO":"🏋️ PLANIFICADO"}<br/>{rut?.nombre??"Rutina"}<br/>{dia?.titulo??"Día"}</div><button className="vf-cal-open" onClick={e=>{e.stopPropagation();abrirEntrenoCalendario(entry)}}>▶ ENTRENAR</button></>}
                <button className={`vf-creatine-day ${creatina[k]?"taken":""}`} onClick={e=>{e.stopPropagation();toggleCreatinaFecha(fecha)}}>{creatina[k]?"💊 CREATINA ✓":"💊 CREATINA"}</button>
              </div>;
            })}
          </div>
        </>}

        {vista === "ajustes" && (
  <>
    <h1 className="vf-page-title">⚙ AJUSTES</h1>

    <section className="vf-section-card">
      <h2>👤 CUENTA</h2>
      <p className="vf-muted">
        Gestiona tu sesión de VitorFit.
      </p>

      <button
        onClick={cerrarSesion}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "16px",
          borderRadius: "12px",
          border: "1px solid #ff2857",
          background: "#1a0b16",
          color: "#ff6b8f",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        🚪 CERRAR SESIÓN
      </button>
    </section>
  </>
)}
      </div>
        
      {mensaje&&<div className="vf-message" onClick={()=>setMensaje("")}>{mensaje}</div>}
      <nav className="vf-bottom">
        <button className={`vf-nav ${vista==="inicio"?"active":""}`} onClick={()=>setVista("inicio")}><span>⌂</span>INICIO</button>
        <button className={`vf-nav ${vista==="entreno"?"active":""}`} onClick={abrirEntrenamiento}><span>🏋️</span>ENTRENO</button>
        <button className={`vf-nav ${vista==="historial"?"active":""}`} onClick={()=>setVista("historial")}><span>🕘</span>HISTORIAL</button>
        <button className={`vf-nav ${vista==="progreso"?"active":""}`} onClick={()=>setVista("progreso")}><span>📈</span>PROGRESO</button>
        <button className={`vf-nav ${vista==="rutinas"?"active":""}`} onClick={()=>setVista("rutinas")}><span>📋</span>RUTINAS</button>
        <button className={`vf-nav ${vista==="biblioteca"?"active":""}`} onClick={()=>{setTargetBiblioteca(null);setVista("biblioteca")}}><span>📚</span>BIBLIOTECA</button>
        <button className={`vf-nav ${vista==="calendario"?"active":""}`} onClick={()=>setVista("calendario")}><span>📅</span>CALENDARIO</button>
        <button className={`vf-nav ${vista==="ajustes"?"active":""}`} onClick={()=>setVista("ajustes")}><span>⚙️</span>AJUSTES</button>
      </nav>
    </main>
  );
}
