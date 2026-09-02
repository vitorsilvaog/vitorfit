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
  demo_url?: string;
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

type GeneratorConfig = {
  objetivo: "recomposicion" | "hipertrofia" | "fuerza" | "perdida-grasa";
  dias: 2 | 3 | 4 | 5 | 6;
  minutos: 45 | 60 | 90 | 120;
  nivel: "principiante" | "intermedio" | "avanzado";
  prioridad: string;
  material: "gimnasio" | "mancuernas" | "casa";
  evitar: string;
};

type CalendarEntry = {
  rutinaId: string;
  diaIndex: number;
  completado: boolean;
  realizadoRutinaId?: string;
  realizadoDiaIndex?: number;
};

type CalendarMap = Record<string, CalendarEntry>;
type CreatinaMap = Record<string, boolean>;

type NutritionCategory = "desayuno" | "comida" | "snack" | "cena";

type NutritionMeal = {
  id: string;
  name: string;
  category: NutritionCategory;
  description: string | null;
  image_url: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: Array<{ nombre: string; cantidad: string }>;
  preparation: string | null;
  published: boolean;
  created_by: string;
  moderation_status?: "pending" | "published" | "rejected";
  author_name?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

type MealPlanEntry = {
  id: string;
  user_id: string;
  meal_id: string;
  plan_date: string;
  meal_type: NutritionCategory;
  nutrition_meals?: NutritionMeal | null;
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

const BASE_LIBRARY: LibraryExercise[] = FAMILIAS.flatMap((f) =>
  f.ejercicios.map(([nombre, equipo], idx) => ({
    id: `lib-${slug(f.patron)}-${idx}-${slug(nombre)}`,
    nombre,
    musculo: f.musculo,
    patron: f.patron,
    equipo,
    tipo: f.tipo,
    icono: f.icono,
    demo_url: ({
      "Press Banca": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/01-press-banca.mp4",
      "Press Inclinado con Barra": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/02-press-inclinado-barra.mp4",
      "Elevaciones Laterales Mancuernas": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/03-elevaciones-laterales.mp4",
      "Tríceps Barra V": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/04-triceps-polea-v.mp4",
      "Press Inclinado Mancuernas": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/05-press-inclinado-mancuernas.mp4",
      "Jalón al Pecho Agarre Ancho": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/06-jalon-al-pecho.mp4",
      "Remo Cable Sentado": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/07-remo-sentado-polea.mp4",
      "Curl Inclinado": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/08-curl-biceps-inclinado.mp4",
      "Búlgara": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/09-sentadilla-bulgara.mp4",
      "Hip Thrust Barra": "https://gfklswkapmhumpjkgvao.supabase.co/storage/v1/object/public/exercise-demos/10-hip-thrust-barra.mp4",
    } as Record<string, string>)[nombre],
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
const keyAnatomiaOverrides = "vitorfit-anatomia-overrides-v1";
const keyUsuarioActual = "vitorfit-usuario-actual";
const keyDescansoFin = "vitorfit-descanso-fin-v1";
const keySeriesConfirmadas = "vitorfit-series-confirmadas-v1";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const claveDiaRegistro = (fecha: string) => {
  const parte = (fecha || "").split(",")[0].trim();
  const trozos = parte.split("/").map((x) => Number(x));
  if (trozos.length !== 3 || trozos.some((x) => !Number.isFinite(x))) return parte;
  const [d, m, y] = trozos;
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
};

const puntuacionRegistro = (r: Registro) =>
  r.series.reduce((acc, s) => acc + Number(Boolean(s.kg)) + Number(Boolean(s.reps)) + Number(Boolean(s.rir)), 0);

const compactarRegistros = (lista: Registro[]) => {
  const mejores = new Map<string, Registro>();
  for (const r of lista) {
    const clave = `${claveDiaRegistro(r.fecha)}|${r.variante || r.nombre}`;
    const actual = mejores.get(clave);
    if (!actual || puntuacionRegistro(r) >= puntuacionRegistro(actual)) mejores.set(clave, r);
  }
  return Array.from(mejores.values());
};
const NUTRITION_ADMIN_ID = "95250377-5141-49fc-ae6c-27db3f25f9e3";
const NUTRITION_LABELS: Record<NutritionCategory, string> = {
  desayuno: "Desayunos",
  comida: "Comidas",
  snack: "Meriendas",
  cena: "Cenas",
};
export default function Entrenamiento() {
const supabase = useMemo(() => createClient(), []);
const router = useRouter();

async function cerrarSesion() {
  await supabase.auth.signOut();
  window.location.href = "/login";
}
  const [vista, setVista] = useState<"inicio" | "entreno" | "historial" | "progreso" | "rutinas" | "biblioteca" | "nutricion" | "calendario" | "ajustes">("inicio");
  const [seccionNutricion, setSeccionNutricion] = useState<"inicio" | NutritionCategory | "plan" | "proponer" | "pendientes">("inicio");
  const [platosNutricion, setPlatosNutricion] = useState<NutritionMeal[]>([]);
  const [planNutricion, setPlanNutricion] = useState<MealPlanEntry[]>([]);
  const [cargandoNutricion, setCargandoNutricion] = useState(false);
  const [busquedaNutricion, setBusquedaNutricion] = useState("");
  const [platoAbiertoId, setPlatoAbiertoId] = useState<string | null>(null);
  const [mostrarEditorPlato, setMostrarEditorPlato] = useState(false);
  const [editandoPlatoId, setEditandoPlatoId] = useState<string | null>(null);
  const [archivoNutricion, setArchivoNutricion] = useState<File | null>(null);
  const [platoParaPlan, setPlatoParaPlan] = useState<NutritionMeal | null>(null);
  const [fechaPlanNutricion, setFechaPlanNutricion] = useState(() => new Date().toISOString().slice(0,10));
  const [tipoPlanNutricion, setTipoPlanNutricion] = useState<NutritionCategory>("desayuno");
  const [semanaNutricion, setSemanaNutricion] = useState(() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
  });
  const [formPlato, setFormPlato] = useState({
    name: "", category: "desayuno" as NutritionCategory, description: "", image_url: "",
    calories: "", protein: "", carbs: "", fats: "", ingredients: "", preparation: "", published: true,
  });
  const [nombreAutorPropuesta, setNombreAutorPropuesta] = useState("");
  const [guardandoPropuesta, setGuardandoPropuesta] = useState(false);
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
  const historialPlano = Object.values(historial).flatMap((lista) => compactarRegistros(lista));

const ultimoRegistroHistorial =
  historialPlano.length > 0
    ? historialPlano[historialPlano.length - 1]
    : null;
  const [variantes, setVariantes] = useState<VariantesV2>({});
  const [alternativasAbiertas, setAlternativasAbiertas] = useState<Record<string, boolean>>({});
  const [modoAlternativa, setModoAlternativa] = useState<Record<string, "inteligente" | "patron" | "musculo">>({});
  const [inicioEntreno, setInicioEntreno] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [entrenoPausado, setEntrenoPausado] = useState(false);
  const [descansoRestante, setDescansoRestante] = useState(0);
  const [descansoFin, setDescansoFin] = useState<number | null>(null);
  const [descansoSerieActiva, setDescansoSerieActiva] = useState<{ ejId: string; serieIndex: number } | null>(null);
  const [seriesSesion, setSeriesSesion] = useState<Record<string, number>>({});
  const [seriesConfirmadas, setSeriesConfirmadas] = useState<Record<string, number>>({});
  const [serieEditando, setSerieEditando] = useState<{ ejId: string; serieIndex: number } | null>(null);
  const [ajustes, setAjustes] = useState<Ajustes>({ descanso: 90, mostrarComparacion: true, mostrarRir: true });
  const [mensaje, setMensaje] = useState("");
  const [calendario, setCalendario] = useState<CalendarMap>({});
  const [fechaEditCalendario, setFechaEditCalendario] = useState<string | null>(null);
  const [rutinaRealizadaId, setRutinaRealizadaId] = useState(DEFAULT_ROUTINES[0].id);
  const [diaRealizadoIndex, setDiaRealizadoIndex] = useState(0);
  const [mesCalendario, setMesCalendario] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [rutinaPlanId, setRutinaPlanId] = useState(DEFAULT_ROUTINES[0].id);
  const [diaPlanIndex, setDiaPlanIndex] = useState(0);
  const [creatina, setCreatina] = useState<CreatinaMap>({});
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const keyUsuario = (base: string) =>
  userId ? `${base}-${userId}` : base;
  const [nubeLista, setNubeLista] = useState(false);
  const [anatomiaOverrides, setAnatomiaOverrides] = useState<Record<string, string>>({});
  const [editorAnatomiaId, setEditorAnatomiaId] = useState<string | null>(null);
  const [rutinaCompartida, setRutinaCompartida] = useState<Routine | null>(null);
  const [cargandoRutinaCompartida, setCargandoRutinaCompartida] = useState(false);
  const [mostrarGenerador, setMostrarGenerador] = useState(false);
  const [configGenerador, setConfigGenerador] = useState<GeneratorConfig>({
    objetivo: "recomposicion",
    dias: 4,
    minutos: 60,
    nivel: "intermedio",
    prioridad: "Pecho",
    material: "gimnasio",
    evitar: "",
  });

  // Splash de entrada VitorFit: dura ~6,2 s y desaparece con una transición suave.
  // Solo se ejecuta al montar esta página; cambiar de sección no vuelve a mostrarla.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const DURACION = 6200;
    const inicio = performance.now();
    let raf = 0;
    let cierre: number | undefined;

    const calcularProgreso = (ms: number) => {
      if (ms < 450) return 0;
      const t = ms - 450;
      if (t < 1250) return Math.round((t / 1250) * 30);
      if (t < 3350) return Math.round(30 + ((t - 1250) / 2100) * 47);
      if (t < 4750) return Math.round(77 + ((t - 3350) / 1400) * 16);
      return Math.min(100, Math.round(93 + ((t - 4750) / 1000) * 7));
    };

    const animar = (ahora: number) => {
      const transcurrido = ahora - inicio;
      setSplashProgress(calcularProgreso(transcurrido));

      if (transcurrido < DURACION) {
        raf = window.requestAnimationFrame(animar);
        return;
      }

      setSplashProgress(100);
      setSplashLeaving(true);
      cierre = window.setTimeout(() => setSplashVisible(false), 650);
    };

    raf = window.requestAnimationFrame(animar);
    return () => {
      window.cancelAnimationFrame(raf);
      if (cierre) window.clearTimeout(cierre);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !splashVisible) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflowAnterior; };
  }, [splashVisible]);

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
        if (nube.anatomiaOverrides) setAnatomiaOverrides(nube.anatomiaOverrides);
      }

      setNubeLista(true);
    };

    cargarUsuario();
    return () => { activo = false; };
  }, [router, supabase]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("rutina");
    if (!code) return;

    let activo = true;
    setCargandoRutinaCompartida(true);
    supabase
      .from("shared_routines")
      .select("routine_data")
      .eq("share_code", code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!activo) return;
        setCargandoRutinaCompartida(false);
        if (error || !data?.routine_data) {
          setMensaje("⚠️ No pude cargar la rutina compartida.");
          return;
        }
        setRutinaCompartida(data.routine_data as Routine);
        setVista("rutinas");
      });

    return () => { activo = false; };
  }, [userId, supabase]);

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

  // Descanso basado en una hora de fin real: sigue siendo correcto aunque
  // Android/iOS suspendan la PWA al bloquear la pantalla.
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const clave = keyUsuario(keyDescansoFin);
    const guardado = Number(localStorage.getItem(clave) || 0);

    if (guardado > Date.now()) {
      setDescansoFin(guardado);
      setDescansoRestante(Math.max(0, Math.ceil((guardado - Date.now()) / 1000)));
    } else {
      localStorage.removeItem(clave);
    }
  }, [userId]);

  useEffect(() => {
    if (!descansoFin || typeof window === "undefined") return;

    const actualizarDescanso = () => {
      const restante = Math.max(0, Math.ceil((descansoFin - Date.now()) / 1000));
      setDescansoRestante(restante);
      if (restante <= 0) {
        setDescansoFin(null);
        if (userId) localStorage.removeItem(keyUsuario(keyDescansoFin));
      }
    };

    actualizarDescanso();
    const t = window.setInterval(actualizarDescanso, 250);
    window.addEventListener("focus", actualizarDescanso);
    document.addEventListener("visibilitychange", actualizarDescanso);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", actualizarDescanso);
      document.removeEventListener("visibilitychange", actualizarDescanso);
    };
  }, [descansoFin, userId]);

  useEffect(() => {
  if (!userId) return;

  try {
    const r = localStorage.getItem(keyUsuario(keyRegistros));
    const h = localStorage.getItem(keyUsuario(keyHistorial));
    const v = localStorage.getItem(keyUsuario(keyVariantes));
    const a = localStorage.getItem(keyUsuario(keyAjustes));
    const rr = localStorage.getItem(keyUsuario(keyRutinas));
    const cl = localStorage.getItem(keyUsuario(keyCustomLibrary));
    const sel = localStorage.getItem(keyUsuario(keyRoutineSelection));
    const cal = localStorage.getItem(keyUsuario(keyCalendario));
    const cr = localStorage.getItem(keyUsuario(keyCreatina));
    const ao = localStorage.getItem(keyUsuario(keyAnatomiaOverrides));
    const sc = localStorage.getItem(keyUsuario(keySeriesConfirmadas));

    if (r) setRegistros(JSON.parse(r));
    if (h) setHistorial(JSON.parse(h));
    if (v) setVariantes(JSON.parse(v));
    if (a) setAjustes(JSON.parse(a));
    if (rr) setRutinas(JSON.parse(rr));
    if (cl) setBibliotecaPersonal(JSON.parse(cl));

    if (sel) {
      const s = JSON.parse(sel);

      if (s.rutinaActualId) {
        setRutinaActualId(s.rutinaActualId);
      }

      if (typeof s.diaActualIndex === "number") {
        setDiaActualIndex(s.diaActualIndex);
      }
    }

    if (cal) setCalendario(JSON.parse(cal));
    if (cr) setCreatina(JSON.parse(cr));
    if (ao) setAnatomiaOverrides(JSON.parse(ao));
    if (sc) setSeriesConfirmadas(JSON.parse(sc));

  } catch {
    setMensaje(
      "No pude leer los datos locales de este usuario, pero VitorFit puede seguir funcionando."
    );
  }
}, [userId]);

 useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyRegistros), JSON.stringify(registros));
}, [userId, registros]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyVariantes), JSON.stringify(variantes));
}, [userId, variantes]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyAjustes), JSON.stringify(ajustes));
}, [userId, ajustes]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyRutinas), JSON.stringify(rutinas));
}, [userId, rutinas]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    keyUsuario(keyCustomLibrary),
    JSON.stringify(bibliotecaPersonal)
  );
}, [userId, bibliotecaPersonal]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    keyUsuario(keyRoutineSelection),
    JSON.stringify({ rutinaActualId, diaActualIndex })
  );
}, [userId, rutinaActualId, diaActualIndex]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyCalendario), JSON.stringify(calendario));
}, [userId, calendario]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keyCreatina), JSON.stringify(creatina));
}, [userId, creatina]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(keyUsuario(keySeriesConfirmadas), JSON.stringify(seriesConfirmadas));
}, [userId, seriesConfirmadas]);

useEffect(() => {
  if (!userId) return;
  localStorage.setItem(
    keyUsuario(keyAnatomiaOverrides),
    JSON.stringify(anatomiaOverrides)
  );
}, [userId, anatomiaOverrides]);
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
        anatomiaOverrides,
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
    bibliotecaPersonal, rutinaActualId, diaActualIndex, calendario, creatina, anatomiaOverrides, supabase,
  ]);

  const nombreVariante = (ej: RoutineExercise) => variantes[ej.id] || ej.nombre;

  const ultimoRegistro = (ej: RoutineExercise) => {
    const lista = compactarRegistros(historial[ej.id] ?? []);
    const actual = nombreVariante(ej);
    const mismaVariante = [...lista].reverse().find((r) => r.variante === actual);
    return mismaVariante ?? lista[lista.length - 1] ?? null;
  };

  const cantidadSeriesSesion = (ej: RoutineExercise) => seriesSesion[ej.id] ?? ej.series;

  const cambiarSeriesSesion = (ej: RoutineExercise, delta: number) => {
    const actual = cantidadSeriesSesion(ej);
    const confirmadas = seriesConfirmadas[ej.id] ?? 0;
    const nueva = Math.max(Math.max(1, confirmadas), Math.min(10, actual + delta));
    if (nueva === actual) return;
    setSeriesSesion((prev) => ({ ...prev, [ej.id]: nueva }));
    setRegistros((prev) => {
      const base = [...(prev[ej.id] ?? seriesVacias(actual))];
      while (base.length < nueva) base.push({ kg: "", reps: "", rir: "" });
      return { ...prev, [ej.id]: base.slice(0, nueva) };
    });
  };

  const setSerie = (ej: RoutineExercise, serieIndex: number, campo: keyof Serie, valor: string) => {
    const cantidad = cantidadSeriesSesion(ej);
    const base = registros[ej.id] ? [...registros[ej.id]] : seriesVacias(cantidad);
    while (base.length < cantidad) base.push({ kg: "", reps: "", rir: "" });
    base[serieIndex] = { ...base[serieIndex], [campo]: valor };
    setRegistros((prev) => ({ ...prev, [ej.id]: base }));
  };

  const completarSerie = (ej: RoutineExercise, serieIndex: number) => {
    const cantidad = cantidadSeriesSesion(ej);
    const esperada = seriesConfirmadas[ej.id] ?? 0;
    const serie = registros[ej.id]?.[serieIndex];
    if (serieIndex !== esperada) {
      setMensaje(`Completa primero la serie ${esperada + 1}.`);
      return;
    }
    if (!serie?.kg || !serie?.reps) {
      setMensaje("Añade KG y REPS antes de completar la serie.");
      return;
    }
    const hechas = serieIndex + 1;
    const nuevasConfirmadas = { ...seriesConfirmadas, [ej.id]: hechas };
    setSeriesConfirmadas(nuevasConfirmadas);

    // Autoguardado inmediato del progreso de la serie.
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(keyUsuario(keyRegistros), JSON.stringify(registros));
      localStorage.setItem(keyUsuario(keySeriesConfirmadas), JSON.stringify(nuevasConfirmadas));
    }

    if (hechas < cantidad) {
      setDescansoSerieActiva({ ejId: ej.id, serieIndex });
      iniciarDescanso(ej.descanso ?? ajustes.descanso);
      setMensaje(`✅ Serie ${hechas} completada · descanso iniciado`);
    } else {
      setDescansoSerieActiva(null);
      setDescansoFin(null);
      setDescansoRestante(0);
      if (userId && typeof window !== "undefined") {
        localStorage.removeItem(keyUsuario(keyDescansoFin));
      }
      setMensaje(`✅ ${nombreVariante(ej)} · todas las series completadas`);
    }
  };

  const editarSerieConfirmada = (ej: RoutineExercise, serieIndex: number) => {
    setSerieEditando({ ejId: ej.id, serieIndex });
    setMensaje(`✏️ Editando serie ${serieIndex + 1} de ${nombreVariante(ej)}`);
  };

  const guardarEdicionSerie = (ej: RoutineExercise, serieIndex: number) => {
    const serie = registros[ej.id]?.[serieIndex];
    if (!serie?.kg || !serie?.reps) {
      setMensaje("⚠️ Completa KG y REPS antes de guardar el cambio.");
      return;
    }

    // La serie ya estaba confirmada: solo corregimos sus datos.
    // No reiniciamos descanso ni alteramos las series posteriores.
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(keyUsuario(keyRegistros), JSON.stringify(registros));
      localStorage.setItem(keyUsuario(keySeriesConfirmadas), JSON.stringify(seriesConfirmadas));
    }

    setSerieEditando(null);
    setMensaje(`✅ Serie ${serieIndex + 1} corregida y guardada`);
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
    const cantidad = cantidadSeriesSesion(ej);
    const series = (registros[ej.id] ?? seriesVacias(cantidad)).slice(0, cantidad);
    const confirmadas = seriesConfirmadas[ej.id] ?? 0;
    if (confirmadas < cantidad) {
      setMensaje(`Completa las ${cantidad} series antes de guardar el ejercicio.`);
      return;
    }
    if (!series.some((s) => s.kg || s.reps || s.rir)) {
      setMensaje("Añade al menos una serie antes de guardar.");
      return;
    }

    const ahora = new Date();
    const nuevo: Registro = {
      fecha: ahora.toLocaleString("es-ES"),
      nombre: ej.nombre,
      variante: nombreVariante(ej),
      patron: ej.patron,
      series: clone(series),
    };

    // Un ejercicio cuenta como UNA sesión al día.
    // Si vuelves a pulsar Guardar durante el mismo entrenamiento,
    // actualizamos esa sesión en lugar de crear 5, 6, 7 copias.
    const hoy = claveDiaRegistro(nuevo.fecha);
    const listaLimpia = compactarRegistros(historial[ej.id] ?? []);
    const indiceHoy = listaLimpia.findIndex(
      (r) => claveDiaRegistro(r.fecha) === hoy && r.variante === nuevo.variante
    );

    const listaNueva = [...listaLimpia];
    if (indiceHoy >= 0) listaNueva[indiceHoy] = nuevo;
    else listaNueva.push(nuevo);

    const nuevoHistorial = { ...historial, [ej.id]: listaNueva };
    setHistorial(nuevoHistorial);
    localStorage.setItem(keyUsuario(keyHistorial), JSON.stringify(nuevoHistorial));
    setRegistros((prev) => ({ ...prev, [ej.id]: seriesVacias(ej.series) }));
    setSeriesSesion((prev) => { const next = { ...prev }; delete next[ej.id]; return next; });
    setSeriesConfirmadas((prev) => {
      const copia = { ...prev, [ej.id]: 0 };
      if (userId && typeof window !== "undefined") {
        localStorage.setItem(keyUsuario(keySeriesConfirmadas), JSON.stringify(copia));
      }
      return copia;
    });
    if (descansoSerieActiva?.ejId === ej.id) setDescansoSerieActiva(null);
    setMensaje(indiceHoy >= 0
      ? `✅ ${nombreVariante(ej)} actualizado en la sesión de hoy`
      : `✅ ${nombreVariante(ej)} guardado en el historial`
    );
  };

  const iniciarDescanso = (duracion: number) => {
    const fin = Date.now() + duracion * 1000;
    setDescansoFin(fin);
    setDescansoRestante(duracion);
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(keyUsuario(keyDescansoFin), String(fin));
    }
  };

  const formatoTiempo = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const completados = (diaActual?.ejercicios ?? []).filter((ej) => {
    const s = registros[ej.id] ?? [];
    const cantidad = cantidadSeriesSesion(ej);
    return (seriesConfirmadas[ej.id] ?? 0) >= cantidad && s.slice(0, cantidad).every((x) => x.kg && x.reps);
  }).length;
  const seriesCompletadas = (diaActual?.ejercicios ?? []).reduce((acc, ej) => acc + (seriesConfirmadas[ej.id] ?? 0), 0);
  const kcal = Math.max(0, Math.round((segundos / 60) * 6.2));

  const progreso = useMemo(() => {
    return rutinas.flatMap((rut) => rut.dias.flatMap((dia) => dia.ejercicios.map((ej) => {
      const lista = compactarRegistros(historial[ej.id] ?? []);
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
    const modo = modoAlternativa[ej.id] ?? "inteligente";
    const actual = nombreVariante(ej);
    const candidatos = biblioteca.filter((x) => x.nombre !== actual);

    if (modo === "patron") {
      return candidatos
        .filter((x) => x.patron === ej.patron)
        .sort((a,b) => Number(b.musculo === ej.musculo) - Number(a.musculo === ej.musculo) || a.nombre.localeCompare(b.nombre))
        .slice(0, 18);
    }

    if (modo === "musculo") {
      const mismoMusculo = candidatos
        .filter((x) => x.musculo === ej.musculo)
        .sort((a,b) => Number(b.patron === ej.patron) - Number(a.patron === ej.patron) || a.nombre.localeCompare(b.nombre));

      // Único ajuste pedido: para Remo Cable 1 Mano, forzar el Jalón al Pecho
      // Agarre Neutro como primera opción de MISMO MÚSCULO.
      const esRemoCable1Mano =
        ej.id === "d2-remo-unilateral" ||
        ej.nombre === "Remo Cable 1 Mano" ||
        actual === "Remo Cable 1 Mano";

      if (esRemoCable1Mano) {
        const preferida = biblioteca.find((x) => x.nombre === "Jalón al Pecho Agarre Neutro");
        if (preferida) {
          return [preferida, ...mismoMusculo.filter((x) => x.id !== preferida.id)].slice(0, 18);
        }
      }

      return mismoMusculo.slice(0, 18);
    }

    // Modo inteligente: primero mismo músculo + mismo patrón, después mismo patrón,
    // y por último mismo músculo. Así, si una máquina está ocupada, las primeras
    // opciones son las más equivalentes al ejercicio programado.
    return candidatos
      .filter((x) => x.patron === ej.patron || x.musculo === ej.musculo)
      .map((x) => ({
        x,
        score:
          (x.patron === ej.patron ? 4 : 0) +
          (x.musculo === ej.musculo ? 4 : 0) +
          (x.equipo !== ej.equipo ? 1 : 0) +
          (x.tipo === (biblioteca.find(b=>b.id===ej.libraryId)?.tipo ?? x.tipo) ? 1 : 0),
      }))
      .sort((a,b) => b.score - a.score || a.x.nombre.localeCompare(b.x.nombre))
      .map(({x}) => x)
      .slice(0, 18);
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

  const compartirRutina = async (r: Routine) => {
    if (!userId) return;
    const shareCode = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
    const { error } = await supabase.from("shared_routines").insert({
      share_code: shareCode,
      owner_id: userId,
      routine_data: r,
      title: r.nombre,
    });
    if (error) {
      setMensaje(`❌ No pude compartir la rutina: ${error.message}`);
      return;
    }

    const url = `${window.location.origin}/entrenamiento?rutina=${shareCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Rutina VitorFit · ${r.nombre}`, text: `Guarda mi rutina "${r.nombre}" en VitorFit`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMensaje("📋 Enlace de la rutina copiado.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setMensaje("📋 Enlace de la rutina copiado.");
      } catch {
        setMensaje(`🔗 Comparte este enlace: ${url}`);
      }
    }
  };

  const guardarRutinaCompartida = () => {
    if (!rutinaCompartida) return;
    const copia = clone(rutinaCompartida);
    copia.id = uid("rutina-compartida");
    copia.nombre = `${rutinaCompartida.nombre} · compartida`;
    copia.creadaPorUsuario = true;
    copia.dias = copia.dias.map((d, di) => ({
      ...d,
      id: uid(`dia-compartido-${di + 1}`),
      ejercicios: d.ejercicios.map((e) => ({ ...e, id: uid("rex-compartido") })),
    }));
    setRutinas((prev) => [...prev, copia]);
    setRutinaActualId(copia.id);
    setDiaActualIndex(0);
    setRutinaCompartida(null);
    setMensaje("✅ Rutina guardada en Mis Rutinas.");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("rutina");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const crearEjercicioGenerado = (lib: LibraryExercise, index: number): RoutineExercise => {
    const compuesto = lib.tipo === "Compuesto";
    const fuerza = configGenerador.objetivo === "fuerza";
    const principiante = configGenerador.nivel === "principiante";
    const avanzado = configGenerador.nivel === "avanzado";

    let series = principiante ? 2 : avanzado ? 4 : 3;
    if (configGenerador.minutos === 45 && series > 3) series = 3;
    if (!compuesto && configGenerador.minutos <= 60) series = Math.min(series, 3);

    const reps = fuerza && compuesto ? "4-6" : compuesto ? "6-10" : "10-15";
    const rir = fuerza ? "2" : configGenerador.objetivo === "hipertrofia" ? "1-2" : "2";
    const descanso = compuesto ? (fuerza ? 180 : 150) : 90;

    return {
      id: uid(`gen-${index+1}`),
      libraryId: lib.id,
      nombre: lib.nombre,
      musculo: lib.musculo,
      patron: lib.patron,
      equipo: lib.equipo,
      series,
      reps,
      rir,
      descanso,
      icono: lib.icono,
    };
  };

  const generarRutinaObjetivos = () => {
    const evitar = configGenerador.evitar.toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
    const prioridad = configGenerador.prioridad.toLowerCase();

    const materialValido = (e: LibraryExercise) => {
      const eq = e.equipo.toLowerCase();
      if (configGenerador.material === "gimnasio") return true;
      if (configGenerador.material === "mancuernas") return /mancuerna|peso corporal|banda|banco/.test(eq);
      return /peso corporal|banda|mancuerna|fitball/.test(eq);
    };

    const base = BASE_LIBRARY.filter((e) =>
      materialValido(e) &&
      !evitar.some((v) => `${e.nombre} ${e.musculo} ${e.patron}`.toLowerCase().includes(v))
    );

    const elegir = (tokens: string[], usados: Set<string>, preferirCompuesto = false) => {
      const scored = base
        .filter(e => !usados.has(e.nombre))
        .map(e => {
          const t = `${e.nombre} ${e.musculo} ${e.patron}`.toLowerCase();
          let score = tokens.reduce((acc, token) => acc + (t.includes(token) ? 4 : 0), 0);
          if (prioridad && t.includes(prioridad)) score += 3;
          if (preferirCompuesto && e.tipo === "Compuesto") score += 2;
          if (!preferirCompuesto && e.tipo === "Aislamiento") score += 1;
          return {e, score};
        })
        .filter(x => x.score > 0)
        .sort((a,b) => b.score - a.score || a.e.nombre.localeCompare(b.e.nombre));

      const elegido = scored[0]?.e;
      if (elegido) usados.add(elegido.nombre);
      return elegido;
    };

    const splits: Record<number, Array<{titulo:string; subtitulo:string; focos:Array<[string[], boolean]>}>> = {
      2: [
        {titulo:"DÍA 1", subtitulo:"Full Body A", focos:[
          [["pecho","empuje horizontal"],true],[["dorsal","tracción vertical"],true],[["cuádriceps","dominante de rodilla"],true],
          [["femoral","bisagra"],true],[["hombro lateral"],false],[["bíceps"],false],[["tríceps"],false],
        ]},
        {titulo:"DÍA 2", subtitulo:"Full Body B", focos:[
          [["pecho superior","empuje inclinado"],true],[["espalda media","tracción horizontal"],true],[["glúteo","extensión de cadera"],true],
          [["cuádriceps","extensión de rodilla"],false],[["hombro posterior"],false],[["abdomen"],false],
        ]},
      ],
      3: [
        {titulo:"DÍA 1", subtitulo:"Push · Pecho · Hombro · Tríceps", focos:[
          [["pecho superior","empuje inclinado"],true],[["pecho","empuje horizontal"],true],[["hombro","empuje vertical"],true],
          [["hombro lateral"],false],[["tríceps","extensión de codo"],false],[["tríceps cabeza larga"],false],
        ]},
        {titulo:"DÍA 2", subtitulo:"Pull · Espalda · Bíceps", focos:[
          [["dorsal","tracción vertical"],true],[["espalda media","tracción horizontal"],true],[["dorsal","tracción horizontal unilateral"],true],
          [["hombro posterior"],false],[["bíceps cabeza larga"],false],[["bíceps cabeza corta"],false],
        ]},
        {titulo:"DÍA 3", subtitulo:"Pierna · Core", focos:[
          [["cuádriceps","dominante de rodilla"],true],[["femoral","bisagra"],true],[["glúteo","extensión de cadera"],true],
          [["cuádriceps","extensión de rodilla"],false],[["gemelos"],false],[["abdomen"],false],
        ]},
      ],
      4: [
        {titulo:"DÍA 1", subtitulo:"Torso A · Pecho prioritario", focos:[
          [["pecho superior"],true],[["pecho","empuje horizontal"],true],[["dorsal","tracción vertical"],true],
          [["espalda media","tracción horizontal"],true],[["hombro lateral"],false],[["tríceps"],false],
        ]},
        {titulo:"DÍA 2", subtitulo:"Pierna A · Cuádriceps", focos:[
          [["cuádriceps","dominante de rodilla"],true],[["cuádriceps","extensión de rodilla"],false],[["aductores"],false],
          [["gemelos"],false],[["abdomen"],false],
        ]},
        {titulo:"DÍA 3", subtitulo:"Torso B · Espalda y brazos", focos:[
          [["dorsal","tracción vertical"],true],[["espalda media","tracción horizontal"],true],[["pecho","empuje horizontal"],true],
          [["hombro posterior"],false],[["bíceps"],false],[["tríceps cabeza larga"],false],
        ]},
        {titulo:"DÍA 4", subtitulo:"Pierna B · Femoral y glúteo", focos:[
          [["femoral","bisagra"],true],[["femoral","flexión de rodilla"],false],[["glúteo","extensión de cadera"],true],
          [["glúteo medio"],false],[["gemelos"],false],[["abdomen"],false],
        ]},
      ],
      5: [
        {titulo:"DÍA 1", subtitulo:"Push", focos:[[["pecho superior"],true],[["pecho","empuje horizontal"],true],[["hombro"],true],[["hombro lateral"],false],[["tríceps"],false]]},
        {titulo:"DÍA 2", subtitulo:"Pull", focos:[[["dorsal","tracción vertical"],true],[["espalda media","tracción horizontal"],true],[["dorsal","unilateral"],true],[["hombro posterior"],false],[["bíceps"],false]]},
        {titulo:"DÍA 3", subtitulo:"Pierna", focos:[[["cuádriceps","dominante de rodilla"],true],[["femoral","bisagra"],true],[["glúteo"],true],[["cuádriceps","extensión de rodilla"],false],[["gemelos"],false]]},
        {titulo:"DÍA 4", subtitulo:"Torso", focos:[[["pecho"],true],[["dorsal"],true],[["espalda media"],true],[["hombro lateral"],false],[["bíceps"],false],[["tríceps"],false]]},
        {titulo:"DÍA 5", subtitulo:"Pierna + Core", focos:[[["glúteo","extensión de cadera"],true],[["femoral","flexión de rodilla"],false],[["cuádriceps"],true],[["glúteo medio"],false],[["abdomen"],false]]},
      ],
      6: [
        {titulo:"DÍA 1", subtitulo:"Push A", focos:[[["pecho superior"],true],[["pecho"],true],[["hombro"],true],[["hombro lateral"],false],[["tríceps"],false]]},
        {titulo:"DÍA 2", subtitulo:"Pull A", focos:[[["dorsal"],true],[["espalda media"],true],[["hombro posterior"],false],[["bíceps cabeza larga"],false],[["bíceps cabeza corta"],false]]},
        {titulo:"DÍA 3", subtitulo:"Pierna A", focos:[[["cuádriceps","dominante de rodilla"],true],[["cuádriceps","extensión de rodilla"],false],[["aductores"],false],[["gemelos"],false],[["abdomen"],false]]},
        {titulo:"DÍA 4", subtitulo:"Push B", focos:[[["pecho","empuje horizontal"],true],[["pecho inferior"],true],[["hombro lateral"],false],[["tríceps cabeza larga"],false],[["tríceps"],false]]},
        {titulo:"DÍA 5", subtitulo:"Pull B", focos:[[["dorsal","tracción horizontal unilateral"],true],[["espalda alta"],true],[["hombro posterior"],false],[["bíceps"],false],[["braquial"],false]]},
        {titulo:"DÍA 6", subtitulo:"Pierna B", focos:[[["femoral","bisagra"],true],[["femoral","flexión de rodilla"],false],[["glúteo"],true],[["glúteo medio"],false],[["abdomen"],false]]},
      ],
    };

    const maxEjercicios = configGenerador.minutos === 45 ? 5 : configGenerador.minutos === 60 ? 6 : configGenerador.minutos === 90 ? 7 : 8;
    const plantilla = splits[configGenerador.dias];
    const usadosGlobal = new Set<string>();

    const dias: RoutineDay[] = plantilla.map((d, di) => {
      const usadosDia = new Set<string>();
      const ejercicios = d.focos
        .slice(0, maxEjercicios)
        .map(([tokens, compuesto], i) => elegir(tokens, usadosDia, compuesto))
        .filter((x): x is LibraryExercise => Boolean(x))
        .map((lib, i) => {
          usadosGlobal.add(lib.nombre);
          return crearEjercicioGenerado(lib, di*10+i);
        });

      return {
        id: uid(`gen-dia-${di+1}`),
        titulo: d.titulo,
        subtitulo: d.subtitulo,
        ejercicios,
      };
    });

    const objetivoTexto = {
      recomposicion: "Recomposición corporal",
      hipertrofia: "Ganancia muscular",
      fuerza: "Fuerza",
      "perdida-grasa": "Pérdida de grasa",
    }[configGenerador.objetivo];

    const id = uid("rutina-generada");
    const nueva: Routine = {
      id,
      nombre: `${objetivoTexto} · ${configGenerador.dias} días`,
      descripcion: `${configGenerador.nivel} · ${configGenerador.minutos} min · prioridad ${configGenerador.prioridad}`,
      creadaPorUsuario: true,
      dias,
    };

    setRutinas((prev) => [...prev, nueva]);
    setRutinaActualId(id);
    setDiaActualIndex(0);
    setEditorRutinaId(id);
    setEditorDiaId(dias[0]?.id ?? null);
    setMostrarGenerador(false);
    setMensaje("✨ Rutina generada según tus objetivos. Revísala y edítala si quieres.");
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

  const abrirEditorCalendario = (fecha: Date, entry: CalendarEntry) => {
    const k = claveFecha(fecha);
    setFechaEditCalendario(k);
    setRutinaRealizadaId(entry.realizadoRutinaId ?? entry.rutinaId);
    setDiaRealizadoIndex(entry.realizadoDiaIndex ?? entry.diaIndex);
  };

  const guardarRealizadoCalendario = () => {
    if (!fechaEditCalendario) return;
    setCalendario((prev) => {
      const actual = prev[fechaEditCalendario];
      if (!actual) return prev;
      return {
        ...prev,
        [fechaEditCalendario]: {
          ...actual,
          realizadoRutinaId: rutinaRealizadaId,
          realizadoDiaIndex: diaRealizadoIndex,
          completado: true,
        },
      };
    });
    setFechaEditCalendario(null);
    setMensaje("✅ Calendario actualizado con lo que realmente entrenaste.");
  };

  const quitarRealizadoCalendario = () => {
    if (!fechaEditCalendario) return;
    setCalendario((prev) => {
      const actual = prev[fechaEditCalendario];
      if (!actual) return prev;
      const { realizadoRutinaId, realizadoDiaIndex, ...resto } = actual;
      return { ...prev, [fechaEditCalendario]: resto };
    });
    setFechaEditCalendario(null);
    setMensaje("↩️ Se volvió a mostrar la planificación original.");
  };

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


  const esAdminNutricion = userId === NUTRITION_ADMIN_ID;

  const cargarNutricion = async () => {
    if (!userId) return;
    setCargandoNutricion(true);
    const [{ data: meals, error: mealsError }, { data: plan, error: planError }] = await Promise.all([
      supabase.from("nutrition_meals").select("*").order("created_at", { ascending: false }),
      supabase.from("user_meal_plan").select("id,user_id,meal_id,plan_date,meal_type,nutrition_meals(*)").order("plan_date", { ascending: true }),
    ]);
    if (mealsError) console.error("VitorFit nutrición: platos", mealsError);
    if (planError) console.error("VitorFit nutrición: plan", planError);
    setPlatosNutricion((meals ?? []).map((m: any) => ({ ...m, ingredients: Array.isArray(m.ingredients) ? m.ingredients : [] })) as NutritionMeal[]);
    setPlanNutricion((plan ?? []) as unknown as MealPlanEntry[]);
    setCargandoNutricion(false);
  };

  useEffect(() => {
    if (!userId) return;
    cargarNutricion();
  }, [userId]);

  const abrirNutricion = (seccion: "inicio" | NutritionCategory | "plan" | "proponer" | "pendientes" = "inicio") => {
    setSeccionNutricion(seccion);
    setVista("nutricion");
    if (userId) cargarNutricion();
  };

  const resetFormPlato = () => {
    setEditandoPlatoId(null);
    setArchivoNutricion(null);
    setFormPlato({ name: "", category: "desayuno", description: "", image_url: "", calories: "", protein: "", carbs: "", fats: "", ingredients: "", preparation: "", published: true });
  };

  const ingredientesDesdeTexto = (texto: string) => texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [cantidad, ...resto] = linea.split("|");
      return resto.length ? { cantidad: cantidad.trim(), nombre: resto.join("|").trim() } : { cantidad: "", nombre: linea };
    });

  const textoDesdeIngredientes = (ingredientes: Array<{nombre:string;cantidad:string}>) =>
    (ingredientes ?? []).map((i) => i.cantidad ? `${i.cantidad} | ${i.nombre}` : i.nombre).join("\n");

  const guardarPlatoNutricion = async () => {
    if (!esAdminNutricion || !userId) return;
    if (!formPlato.name.trim()) { setMensaje("⚠️ Pon un nombre al plato."); return; }
    setCargandoNutricion(true);
    let imageUrl = formPlato.image_url || null;

    if (archivoNutricion) {
      const ext = archivoNutricion.name.split(".").pop() || "jpg";
      const ruta = `${formPlato.category}/${Date.now()}-${slug(formPlato.name)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("nutrition-images").upload(ruta, archivoNutricion, { upsert: true });
      if (uploadError) {
        setMensaje(`❌ No pude subir la foto: ${uploadError.message}`);
        setCargandoNutricion(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("nutrition-images").getPublicUrl(ruta);
      imageUrl = publicData.publicUrl;
    }

    const payload = {
      name: formPlato.name.trim(),
      category: formPlato.category,
      description: formPlato.description.trim() || null,
      image_url: imageUrl,
      calories: Number(formPlato.calories || 0),
      protein: Number(formPlato.protein || 0),
      carbs: Number(formPlato.carbs || 0),
      fats: Number(formPlato.fats || 0),
      ingredients: ingredientesDesdeTexto(formPlato.ingredients),
      preparation: formPlato.preparation.trim() || null,
      published: formPlato.published,
      moderation_status: formPlato.published ? "published" : "pending",
      author_name: "VitorFit",
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    const query = editandoPlatoId
      ? supabase.from("nutrition_meals").update(payload).eq("id", editandoPlatoId)
      : supabase.from("nutrition_meals").insert(payload);
    const { error } = await query;
    setCargandoNutricion(false);
    if (error) { setMensaje(`❌ ${error.message}`); return; }
    setMensaje(editandoPlatoId ? "✅ Plato actualizado" : "✅ Plato publicado en Nutrición");
    setMostrarEditorPlato(false);
    resetFormPlato();
    await cargarNutricion();
  };

  const editarPlatoNutricion = (m: NutritionMeal) => {
    if (!esAdminNutricion) return;
    setEditandoPlatoId(m.id);
    setArchivoNutricion(null);
    setFormPlato({
      name: m.name, category: m.category, description: m.description ?? "", image_url: m.image_url ?? "",
      calories: String(m.calories ?? 0), protein: String(m.protein ?? 0), carbs: String(m.carbs ?? 0), fats: String(m.fats ?? 0),
      ingredients: textoDesdeIngredientes(m.ingredients ?? []), preparation: m.preparation ?? "", published: m.published,
    });
    setMostrarEditorPlato(true);
    setSeccionNutricion(m.category);
  };

  const borrarPlatoNutricion = async (m: NutritionMeal) => {
    if (!esAdminNutricion) return;
    if (!window.confirm(`¿Borrar ${m.name}?`)) return;
    const { error } = await supabase.from("nutrition_meals").delete().eq("id", m.id);
    if (error) { setMensaje(`❌ ${error.message}`); return; }
    setMensaje("🗑️ Plato eliminado");
    await cargarNutricion();
  };

  const enviarPropuestaPlato = async () => {
    if (!userId) return;
    if (!formPlato.name.trim()) { setMensaje("⚠️ Pon un nombre al plato."); return; }
    if (!nombreAutorPropuesta.trim()) { setMensaje("⚠️ Escribe el nombre que quieres mostrar como autor."); return; }
    setGuardandoPropuesta(true);
    let imageUrl = formPlato.image_url || null;

    if (archivoNutricion) {
      const ext = archivoNutricion.name.split(".").pop() || "jpg";
      const ruta = `proposals/${userId}/${Date.now()}-${slug(formPlato.name)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("nutrition-images").upload(ruta, archivoNutricion, { upsert: false });
      if (uploadError) {
        setMensaje(`❌ No pude subir la foto: ${uploadError.message}`);
        setGuardandoPropuesta(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("nutrition-images").getPublicUrl(ruta);
      imageUrl = publicData.publicUrl;
    }

    const payload = {
      name: formPlato.name.trim(),
      category: formPlato.category,
      description: formPlato.description.trim() || null,
      image_url: imageUrl,
      calories: Number(formPlato.calories || 0),
      protein: Number(formPlato.protein || 0),
      carbs: Number(formPlato.carbs || 0),
      fats: Number(formPlato.fats || 0),
      ingredients: ingredientesDesdeTexto(formPlato.ingredients),
      preparation: formPlato.preparation.trim() || null,
      published: false,
      moderation_status: "pending",
      author_name: nombreAutorPropuesta.trim(),
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("nutrition_meals").insert(payload);
    setGuardandoPropuesta(false);
    if (error) { setMensaje(`❌ ${error.message}`); return; }

    setMensaje("✅ Propuesta enviada. Queda pendiente de aprobación.");
    resetFormPlato();
    setNombreAutorPropuesta("");
    setSeccionNutricion("inicio");
    await cargarNutricion();
  };

  const revisarPropuesta = async (m: NutritionMeal, estado: "published" | "rejected") => {
    if (!esAdminNutricion || !userId) return;
    const { error } = await supabase.from("nutrition_meals").update({
      moderation_status: estado,
      published: estado === "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", m.id);
    if (error) { setMensaje(`❌ ${error.message}`); return; }
    setMensaje(estado === "published" ? "✅ Plato aprobado y publicado para todos." : "❌ Propuesta rechazada.");
    await cargarNutricion();
  };

  const prepararAñadirPlan = (m: NutritionMeal) => {
    setPlatoParaPlan(m);
    setTipoPlanNutricion(m.category);
    setFechaPlanNutricion(new Date().toISOString().slice(0,10));
  };

  const añadirPlatoAlPlan = async () => {
    if (!userId || !platoParaPlan) return;
    const { error } = await supabase.from("user_meal_plan").insert({
      user_id: userId, meal_id: platoParaPlan.id, plan_date: fechaPlanNutricion, meal_type: tipoPlanNutricion,
    });
    if (error) { setMensaje(`❌ ${error.message}`); return; }
    setMensaje(`✅ ${platoParaPlan.name} añadido al plan`);
    setPlatoParaPlan(null);
    await cargarNutricion();
  };

  const quitarDelPlan = async (id: string) => {
    const { error } = await supabase.from("user_meal_plan").delete().eq("id", id);
    if (error) { setMensaje(`❌ ${error.message}`); return; }
    await cargarNutricion();
  };

  const moverSemanaNutricion = (delta: number) => setSemanaNutricion((prev) => {
    const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d;
  });

  const diasSemanaNutricion = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaNutricion); d.setDate(d.getDate() + i); return d;
  }), [semanaNutricion]);

  const platosFiltradosNutricion = useMemo(() => {
    if (!["desayuno","comida","snack","cena"].includes(seccionNutricion)) return [];
    const q = busquedaNutricion.trim().toLowerCase();
    return platosNutricion.filter((m) =>
      m.category === seccionNutricion &&
      m.moderation_status !== "pending" &&
      m.moderation_status !== "rejected" &&
      (esAdminNutricion || m.published) &&
      (!q || `${m.name} ${m.description ?? ""}`.toLowerCase().includes(q))
    );
  }, [platosNutricion, seccionNutricion, busquedaNutricion, esAdminNutricion]);

  const propuestasPendientes = useMemo(
    () => platosNutricion.filter((m) => m.moderation_status === "pending"),
    [platosNutricion]
  );

  const tecnicaEjercicio = (ex: LibraryExercise) => {
    const t = `${ex.nombre} ${ex.musculo} ${ex.patron}`.toLowerCase();
    let pasos = [
      "Colócate estable y ajusta la máquina o material a tu altura.",
      "Mantén el tronco firme y controla todo el recorrido.",
      "Haz la fase de vuelta más lenta y evita rebotes.",
    ];
    let errores = ["Usar demasiado peso", "Perder el control del recorrido", "Compensar con otras zonas del cuerpo"];
    let consejo = "Prioriza técnica y rango de movimiento antes de subir el peso.";

    if (/press|empuje/.test(t) && /pecho/.test(t)) {
      pasos = ["Apoya bien los pies y fija las escápulas.", "Baja el peso de forma controlada hacia el pecho.", "Empuja manteniendo muñecas y codos estables."];
      errores = ["Rebotar el peso", "Despegar hombros del apoyo", "Abrir demasiado los codos"];
      consejo = "Piensa en acercar los brazos entre sí al empujar.";
    } else if (/jalón|dominada|tracción vertical/.test(t)) {
      pasos = ["Saca ligeramente el pecho y fija el tronco.", "Lleva los codos hacia abajo, no solo las manos.", "Vuelve arriba de forma controlada sin perder tensión."];
      errores = ["Balancearse", "Tirar solo con bíceps", "Acortar demasiado el recorrido"];
      consejo = "Imagina que metes los codos en los bolsillos.";
    } else if (/remo|tracción horizontal/.test(t)) {
      pasos = ["Mantén pecho estable y columna neutra.", "Lleva el codo hacia atrás siguiendo el torso.", "Aprieta la espalda al final sin encoger los hombros."];
      errores = ["Tirar con impulso", "Elevar los hombros", "Redondear la zona lumbar"];
      consejo = "Inicia el movimiento llevando la escápula hacia atrás.";
    } else if (/curl/.test(t)) {
      pasos = ["Mantén el brazo estable.", "Flexiona el codo sin balancear el cuerpo.", "Baja lentamente hasta casi extender por completo."];
      errores = ["Mover el hombro", "Usar impulso", "Soltar la bajada"];
      consejo = "Controla especialmente la fase excéntrica.";
    } else if (/tríceps|triceps|extensión de codo/.test(t)) {
      pasos = ["Fija los codos.", "Extiende hasta contraer fuerte el tríceps.", "Regresa sin dejar que los codos se desplacen."];
      errores = ["Abrir los codos", "Mover el hombro", "Usar impulso del tronco"];
      consejo = "Mantén tensión continua, sin descansar arriba.";
    } else if (/sentadilla|hack|prensa|cuádriceps|cuadriceps/.test(t)) {
      pasos = ["Coloca los pies estables y alinea rodillas con las puntas.", "Baja con control hasta tu rango seguro.", "Empuja con todo el pie sin despegar talones."];
      errores = ["Rodillas colapsando hacia dentro", "Rebotar abajo", "Perder apoyo del pie"];
      consejo = "Controla la bajada y acelera al subir.";
    } else if (/peso muerto|rumano|bisagra/.test(t)) {
      pasos = ["Mantén columna neutra y abdomen firme.", "Lleva la cadera hacia atrás manteniendo el peso cerca.", "Sube extendiendo la cadera sin hiperextender la espalda."];
      errores = ["Redondear la espalda", "Separar el peso del cuerpo", "Convertirlo en sentadilla"];
      consejo = "Busca tensión en femorales durante toda la bajada.";
    } else if (/elevación lateral|abducción de hombro/.test(t)) {
      pasos = ["Mantén el torso estable.", "Eleva los brazos hacia los lados con codos suaves.", "Baja lentamente sin perder tensión."];
      errores = ["Encoger trapecios", "Lanzar el peso", "Subir muy por encima del hombro"];
      consejo = "Piensa en separar las manos del cuerpo, no en subirlas.";
    }

    return { pasos, errores, consejo };
  };

  const normalizarZona = (valor: string) =>
    (valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const OPCIONES_ANATOMIA = [
    ["pecho-superior","Pecho superior"],["pecho-medio","Pecho medio"],["pecho-inferior","Pecho inferior"],
    ["dorsal","Dorsal ancho"],["espalda-superior","Espalda superior"],["espalda-media","Espalda media"],
    ["lumbar","Lumbar / erectores"],["trapecio","Trapecio"],
    ["hombro-anterior","Hombro anterior"],["hombro-lateral","Hombro lateral"],["hombro-posterior","Hombro posterior"],
    ["biceps","Bíceps"],["triceps","Tríceps"],["antebrazo","Antebrazo"],
    ["abdominales","Abdominales"],["oblicuos","Oblicuos"],["serrato","Serrato"],
    ["cuadriceps","Cuádriceps"],["femoral","Femoral / isquios"],["gluteos","Glúteos"],
    ["gemelos","Gemelos"],["soleo","Sóleo"],["aductores","Aductores"],["abductores","Abductores"],
    ["vista-completa-frente","Cuerpo completo frente"],["vista-completa-espalda","Cuerpo completo espalda"],
  ] as const;

  const imagenAnatomia = (musculo: string, patron = "", nombre = "") => {
    const m = normalizarZona(musculo);
    const p = normalizarZona(patron);
    const n = normalizarZona(nombre);
    const extra = `${p} ${n}`;

    // REGLA PRINCIPAL:
    // primero manda SIEMPRE el campo musculo.
    // nombre/patron solo sirven para afinar dentro del mismo grupo muscular.

    // Bíceps / brazos
    if (/biceps|braquial/.test(m)) return "/anatomia/biceps.png";
    if (/triceps/.test(m)) return "/anatomia/triceps.png";
    if (/antebrazo/.test(m)) return "/anatomia/antebrazo.png";

    // Hombro
    if (/posterior/.test(m) && /hombro|deltoide/.test(m)) return "/anatomia/hombro-posterior.png";
    if (/lateral/.test(m) && /hombro|deltoide/.test(m)) return "/anatomia/hombro-lateral.png";
    if (/anterior/.test(m) && /hombro|deltoide/.test(m)) return "/anatomia/hombro-anterior.png";
    if (/hombro|deltoide/.test(m)) {
      if (/posterior|face pull|pajaro/.test(extra)) return "/anatomia/hombro-posterior.png";
      if (/frontal|anterior/.test(extra)) return "/anatomia/hombro-anterior.png";
      return "/anatomia/hombro-lateral.png";
    }

    // Pecho
    if (/superior/.test(m) && /pecho|pectoral/.test(m)) return "/anatomia/pecho-superior.png";
    if (/inferior/.test(m) && /pecho|pectoral/.test(m)) return "/anatomia/pecho-inferior.png";
    if (/pecho|pectoral/.test(m)) {
      if (/declinado/.test(extra)) return "/anatomia/pecho-inferior.png";
      if (/inclinado/.test(extra)) return "/anatomia/pecho-superior.png";
      return "/anatomia/pecho-medio.png";
    }

    // Espalda
    if (/lumbar|erector/.test(m)) return "/anatomia/lumbar.png";
    if (/trapecio/.test(m)) return "/anatomia/trapecio.png";
    if (/espalda superior|romboide/.test(m)) return "/anatomia/espalda-superior.png";
    if (/espalda media/.test(m)) return "/anatomia/espalda-media.png";
    if (/dorsal/.test(m)) return "/anatomia/dorsal.png";
    if (/espalda/.test(m)) {
      if (/lumbar|hiperextension/.test(extra)) return "/anatomia/lumbar.png";
      if (/remo alto|superior|romboide/.test(extra)) return "/anatomia/espalda-superior.png";
      if (/remo/.test(extra)) return "/anatomia/espalda-media.png";
      return "/anatomia/dorsal.png";
    }

    // Core
    if (/oblicuo/.test(m)) return "/anatomia/oblicuos.png";
    if (/serrato/.test(m)) return "/anatomia/serrato.png";
    if (/abdomen|abdominal|core/.test(m)) return "/anatomia/abdominales.png";

    // Piernas / glúteo
    if (/abductor/.test(m)) return "/anatomia/abductores.png";
    if (/aductor/.test(m)) return "/anatomia/aductores.png";
    if (/gluteo/.test(m)) return "/anatomia/gluteos.png";
    if (/femoral|isquio/.test(m)) return "/anatomia/femoral.png";
    if (/cuadriceps/.test(m)) return "/anatomia/cuadriceps.png";
    if (/soleo/.test(m)) return "/anatomia/soleo.png";
    if (/gemelo|pantorrilla/.test(m)) return "/anatomia/gemelos.png";

    // Fallback SOLO cuando el campo músculo no nos da una categoría conocida.
    const t = `${m} ${extra}`;
    if (/triceps/.test(t)) return "/anatomia/triceps.png";
    if (/biceps|braquial|curl/.test(t)) return "/anatomia/biceps.png";
    if (/dorsal|jalon|dominada|pullover/.test(t)) return "/anatomia/dorsal.png";
    if (/remo/.test(t)) return "/anatomia/espalda-media.png";
    if (/lumbar|hiperextension/.test(t)) return "/anatomia/lumbar.png";
    if (/pecho|pectoral/.test(t)) return "/anatomia/pecho-medio.png";
    if (/cuadriceps|sentadilla|hack|prensa/.test(t)) return "/anatomia/cuadriceps.png";
    if (/femoral|isquio/.test(t)) return "/anatomia/femoral.png";
    if (/gluteo/.test(t)) return "/anatomia/gluteos.png";

    return "/anatomia/vista-completa-frente.png";
  };

  const AnatomiaPro = ({
    id,
    musculo,
    patron = "",
    nombre = "",
    compact = false,
  }: {
    id?: string;
    musculo: string;
    patron?: string;
    nombre?: string;
    compact?: boolean;
  }) => {
    const override = id ? anatomiaOverrides[id] : "";
    const src = override ? `/anatomia/${override}.png` : imagenAnatomia(musculo, patron, nombre);
    return (
      <div className={`vf-anatomia-pro ${compact ? "compact" : ""}`} title={`Zona principal: ${musculo}`}>
        <img src={src} alt={`Anatomía: ${musculo}`} loading="lazy" />
        {!compact && <span>{musculo}</span>}
      </div>
    );
  };

  const editorRutina = rutinas.find((r) => r.id === editorRutinaId) ?? null;
  const editorDia = editorRutina?.dias.find((d) => d.id === editorDiaId) ?? editorRutina?.dias[0] ?? null;

  return (
    <main className="vf-app">
      <style>{`
        *{box-sizing:border-box}
        :root{color-scheme:dark;--red:#ff304a;--red2:#c8102e;--bg:#09090b;--panel:#121418;--panel2:#181b20;--line:#2e3138;--muted:#858b96}
        html,body{margin:0;background:#09090b}button,input,select{font:inherit}button{cursor:pointer}
        body{overflow-x:hidden}.vf-app{min-height:100vh;color:#f7f7f8;font-family:Inter,Arial,sans-serif;background:
radial-gradient(circle at 88% 5%,rgba(255,32,58,.40),transparent 28%),
radial-gradient(circle at 78% 18%,rgba(190,0,28,.22),transparent 38%),
radial-gradient(circle at 62% 92%,rgba(145,0,22,.12),transparent 34%),
linear-gradient(145deg,#09090b 0%,#101216 44%,#15070c 72%,#09090b 100%);
padding:0;position:relative}
.vf-app:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:
linear-gradient(180deg,rgba(255,255,255,.012),transparent 24%),
radial-gradient(circle at 50% -10%,rgba(255,48,74,.11),transparent 42%)}

/* ===== SPLASH VITORFIT PRO ===== */
.vf-splash{position:fixed;inset:0;z-index:9999;overflow:hidden;display:grid;place-items:center;background-color:#000;background-image:url("/vitorfit-splash-bg.png?v=20260902-gym");background-repeat:no-repeat;background-position:center center;background-size:contain;opacity:1;transform:scale(1);transition:opacity .75s ease,transform .75s cubic-bezier(.2,.8,.2,1)}
.vf-splash.leaving{opacity:0;transform:scale(1.018);pointer-events:none}
.vf-splash-bg,.vf-splash-gym,.vf-splash-center{display:none!important}
.vf-splash:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.86),transparent 22%,transparent 78%,rgba(0,0,0,.86));z-index:1}
.vf-splash:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.02) 0%,transparent 68%,rgba(0,0,0,.12) 100%);z-index:1}
.vf-splash-bottom{position:absolute;left:50%;bottom:max(6.3vh,env(safe-area-inset-bottom) + 22px);transform:translateX(-50%);width:min(46vh,560px);max-width:72vw;z-index:3;text-align:center}
.vf-splash-loading{margin-bottom:13px;color:#ff243c;font-size:clamp(15px,1.4vw,22px);font-weight:900;letter-spacing:6px;text-transform:uppercase;text-shadow:0 2px 12px #000,0 0 18px rgba(255,25,48,.3)}
.vf-splash-track{position:relative;height:14px;border-radius:999px;padding:2px;background:#08090b;border:2px solid rgba(255,255,255,.13);box-shadow:inset 0 3px 10px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.7)}
.vf-splash-track i{position:relative;display:block;height:100%;border-radius:inherit;background:linear-gradient(180deg,#ff4658 0%,#ff1732 45%,#c90019 100%);box-shadow:0 0 10px rgba(255,20,43,.9),0 0 22px rgba(255,20,43,.35);transition:width .1s linear}
.vf-splash-track i:after{content:"";position:absolute;inset:1px 3px auto 3px;height:35%;border-radius:999px;background:rgba(255,255,255,.35)}
.vf-splash-percent{position:absolute;right:0;top:-20px;color:transparent;font-size:1px}
@media(max-aspect-ratio:3/4){
  .vf-splash{background-size:cover;background-position:center center}
  .vf-splash:before{background:linear-gradient(180deg,rgba(0,0,0,.04),transparent 72%,rgba(0,0,0,.18))}
  .vf-splash-bottom{width:68vw;max-width:430px;bottom:max(7vh,env(safe-area-inset-bottom) + 24px)}
  .vf-splash-loading{font-size:17px;letter-spacing:5px;margin-bottom:12px}
  .vf-splash-track{height:15px}
}
@media(max-width:760px) and (max-aspect-ratio:3/4){
  .vf-splash{background-position:center center}
  .vf-splash-bottom{width:70vw;bottom:max(7.2vh,env(safe-area-inset-bottom) + 22px)}
}
/* ===== FIN SPLASH ===== */

.vf-shell{position:relative;z-index:1}
        .vf-shell{width:100%;min-height:100vh;display:grid;grid-template-columns:260px minmax(0,1fr)}
        .vf-sidebar{position:sticky;top:0;height:100vh;padding:26px 18px;border-right:1px solid rgba(255,48,74,.16);background:
linear-gradient(180deg,rgba(8,9,12,.98),rgba(10,10,13,.96)),
radial-gradient(circle at 100% 0,rgba(255,48,74,.10),transparent 38%);
display:flex;flex-direction:column;z-index:30;box-shadow:18px 0 50px rgba(0,0,0,.22)}
        .vf-side-brand{display:flex;align-items:center;gap:12px;padding:0 10px 28px}.vf-side-brand img{width:48px;height:48px;object-fit:contain}.vf-side-brand b{font-size:20px;letter-spacing:.8px}.vf-side-brand b span{color:var(--red)}.vf-side-brand small{display:block;color:#646a74;font-size:8px;letter-spacing:1.4px;margin-top:4px}
        .vf-side-nav{display:grid;gap:6px}.vf-side-nav button{display:grid;grid-template-columns:36px 1fr;align-items:center;text-align:left;min-height:50px;border:1px solid transparent;border-radius:11px;background:transparent;color:#8c929c;padding:0 12px}.vf-side-nav button span{font-size:18px;text-align:center}.vf-side-nav button b{font-size:12px;letter-spacing:.3px}.vf-side-nav button:hover{color:#fff;background:#12151a}.vf-side-nav button.active{color:#fff;border-color:rgba(255,48,74,.28);background:linear-gradient(90deg,rgba(255,48,74,.16),rgba(255,48,74,.03));box-shadow:inset 3px 0 0 var(--red)}
        .vf-side-footer{margin-top:auto;border-top:1px solid #20242a;padding:20px 10px 0;display:flex;align-items:center;gap:10px}.vf-online-dot{width:8px;height:8px;border-radius:50%;background:#31d27c;box-shadow:0 0 10px #31d27c}.vf-side-footer b{font-size:11px}.vf-side-footer small{display:block;color:#646a74;font-size:9px;margin-top:2px}
        .vf-content{min-width:0;width:100%;max-width:1540px;margin:0 auto;padding:26px 42px 110px}
        .vf-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;margin-bottom:26px}.vf-brand{display:none}.vf-day{display:flex;align-items:center;justify-content:center;gap:8px}.vf-day button,.vf-icon-button{width:42px;height:42px;border:1px solid var(--line);border-radius:10px;background:#12151a;color:#fff}.vf-day button:hover,.vf-icon-button:hover{border-color:#5a2c34;color:var(--red)}.vf-day-pill{min-width:180px;padding:12px 16px;text-align:center;border:1px solid var(--line);border-radius:10px;background:#12151a;font-size:11px;font-weight:900}.vf-actions{display:flex;justify-content:flex-end;gap:8px}.vf-routine-name{text-align:center;color:#626873;font-size:10px;margin:-18px 0 22px}
        .vf-dashboard-head{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;padding:30px 0 26px;border-bottom:1px solid #20242a}.vf-eyebrow,.vf-card-kicker{color:var(--red);font-size:10px;font-weight:1000;letter-spacing:1.6px}.vf-dashboard-head h1{font-size:clamp(34px,4vw,58px);line-height:1;margin:8px 0 10px;letter-spacing:-2px}.vf-dashboard-head h1 span{color:#7f858f}.vf-dashboard-head p{margin:0;color:#7d838d;font-size:13px}.vf-hero-cta,.vf-wide-cta{border:0;border-radius:11px;background:linear-gradient(135deg,var(--red2),var(--red));color:#fff;font-weight:1000;letter-spacing:.5px;box-shadow:0 14px 34px rgba(200,16,46,.20)}.vf-hero-cta{padding:15px 19px;white-space:nowrap}.vf-hero-cta span,.vf-wide-cta span{margin-left:16px}
        .vf-home-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.vf-home-metrics article{min-height:116px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,#15181d,#0f1115);padding:18px;display:flex;align-items:center;gap:14px}.vf-metric-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:10px;background:rgba(255,48,74,.09);border:1px solid rgba(255,48,74,.20);font-size:20px}.vf-home-metrics small{display:block;color:#777e88;font-size:9px;font-weight:900;letter-spacing:1px}.vf-home-metrics strong{display:block;font-size:23px;margin:5px 0 2px}.vf-home-metrics span{color:#666d77;font-size:10px}
        .vf-home-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:14px}.vf-home-grid>article{border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#15181d,#0f1115);padding:22px;min-width:0}.vf-next-workout{grid-row:span 2}.vf-next-top{display:flex;justify-content:space-between;gap:18px;align-items:center;margin:10px 0 20px}.vf-next-top h2{font-size:28px;margin:0 0 5px}.vf-next-top p{margin:0;color:#777e88;font-size:11px}.vf-day-number{width:58px;height:58px;display:grid;place-items:center;border-radius:14px;border:1px solid rgba(255,48,74,.35);background:rgba(255,48,74,.08);font-size:26px;font-weight:1000;color:var(--red)}.vf-ex-preview{display:grid;gap:7px}.vf-ex-preview>div{display:grid;grid-template-columns:38px 1fr;align-items:center;gap:10px;padding:11px 12px;border:1px solid #242830;border-radius:10px;background:#0e1014}.vf-ex-preview>div>span{color:#555c66;font-size:11px;font-weight:1000}.vf-ex-preview b{font-size:12px}.vf-ex-preview small{display:block;color:#686f79;font-size:9px;margin-top:3px}.vf-wide-cta{width:100%;padding:14px;margin-top:14px}.vf-card-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.vf-card-title-row h3,.vf-creatine-home h3{margin:5px 0 0;font-size:19px}.vf-card-title-row button,.vf-creatine-home button{border:1px solid #30353d;background:#111419;color:#9ba1aa;border-radius:8px;padding:8px 10px;font-size:8px;font-weight:900}.vf-week-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:20px 0}.vf-week-days div{text-align:center}.vf-week-days span{display:block;color:#666d76;font-size:8px;margin-bottom:6px}.vf-week-days b{width:30px;height:30px;margin:auto;display:grid;place-items:center;border-radius:50%;background:#0d0f13;border:1px solid #272b32;color:#555b64;font-size:10px}.vf-week-days div.done b{background:rgba(255,48,74,.12);border-color:rgba(255,48,74,.45);color:var(--red)}.vf-week-progress>div:first-child{display:flex;justify-content:space-between;color:#777e88;font-size:9px}.vf-progress-track{height:5px;background:#242830;border-radius:10px;margin-top:8px;overflow:hidden}.vf-progress-track i{display:block;height:100%;background:var(--red);border-radius:10px}.vf-last-title{display:block;margin:18px 0 10px;font-size:15px}.vf-last-series{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.vf-last-series div{padding:11px;border:1px solid #262a31;border-radius:9px;background:#0d0f13}.vf-last-series small{display:block;color:#666d76;font-size:7px}.vf-last-series b{display:block;margin:5px 0 2px}.vf-last-series span{color:#858b94;font-size:9px}.vf-creatine-home{text-align:center}.vf-creatine-home .vf-card-kicker,.vf-creatine-home h3{text-align:left}.vf-creatine-circle{width:104px;height:104px;margin:17px auto 10px;border-radius:50%;display:grid;place-content:center;border:8px solid #2a2e35;outline:2px solid rgba(255,48,74,.30);background:#101217}.vf-creatine-circle strong{font-size:24px}.vf-creatine-circle span{font-size:8px;color:#737a84}.vf-creatine-home p{color:#727983;font-size:9px}.vf-creatine-home button{width:100%;margin-top:7px}
        .vf-stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#111419;margin-bottom:16px}.vf-stat{padding:18px;text-align:center;min-height:125px;border-right:1px solid var(--line)}.vf-stat:last-child{border:0}.vf-ring{width:70px;height:70px;border-radius:50%;margin:auto;display:grid;place-items:center;background:conic-gradient(var(--red) calc(var(--progress)*1%),#292d34 0);position:relative}.vf-ring:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#111419}.vf-ring-text{position:relative;z-index:1;font-weight:1000}.vf-stat-icon{font-size:24px}.vf-stat-value{font-size:22px;font-weight:1000;margin:6px 0}.vf-stat-label{font-size:9px;color:var(--red);font-weight:1000;letter-spacing:1px}.vf-stat-sub{font-size:9px;color:#737a84;margin-top:4px}
        .vf-card,.vf-section-card,.vf-record,.vf-routine-day,.vf-editor,.vf-lib-card{
border:1px solid rgba(255,74,92,.22);
background:
linear-gradient(145deg,rgba(23,25,30,.96),rgba(13,15,19,.96));
box-shadow:0 18px 42px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.015)}.vf-card{border-radius:15px;margin-bottom:12px;overflow:hidden}.vf-card-head{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:15px}.vf-num{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:#0d0f13;border:1px solid rgba(255,48,74,.45);font-weight:1000;color:var(--red)}.vf-title-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.vf-ex-title{font-size:18px;font-weight:1000;text-transform:uppercase}.vf-tag{padding:4px 7px;border-radius:6px;border:1px solid rgba(255,48,74,.28);background:rgba(255,48,74,.08);color:#ff7384;font-size:8px;font-weight:900}.vf-prescription{color:#777e88;font-size:10px;margin-top:5px}.vf-anatomia-pro{width:100px;min-width:100px;height:112px;border:1px solid #292d34;border-radius:10px;overflow:hidden;background:#0d0f13;position:relative}.vf-anatomia-pro img{width:100%;height:100%;object-fit:cover}.vf-anatomia-pro span{position:absolute;left:5px;right:5px;bottom:5px;padding:4px;background:rgba(5,6,8,.84);border-radius:5px;font-size:7px;text-align:center}.vf-anatomia-pro.compact{width:76px;min-width:76px;height:86px}.vf-ex-preview>div{grid-template-columns:42px minmax(0,1fr) 76px;align-items:center}.vf-ex-preview .vf-anatomia-pro.compact{justify-self:end}
        .vf-alt-wrap{padding:0 15px 11px}.vf-alt-button,.vf-alt-tools button,.vf-alt-option{border:1px solid #30353d;background:#111419;color:#aab0b8;border-radius:8px;padding:9px;font-size:9px}.vf-alt-button{width:100%}.vf-alt-tools{display:flex;gap:7px;margin-top:7px}.vf-alt-tools button{flex:1}.vf-alt-tools .active,.vf-alt-option.active{border-color:var(--red);color:#fff}.vf-alt-list{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:7px}
        .vf-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 15px 12px}.vf-panel{padding:12px;border:1px solid #292d34;border-radius:11px;background:#0e1014}.vf-panel.today{border-color:rgba(255,48,74,.38)}.vf-panel-head{display:flex;justify-content:space-between;gap:8px;font-size:10px;font-weight:900;margin-bottom:9px}.vf-date{color:#6f7680}.vf-series-row{display:grid;grid-template-columns:30px repeat(3,1fr) 94px;gap:6px;align-items:center;margin-bottom:6px}.vf-slabel{color:var(--red);font-weight:1000}.vf-box,.vf-input{min-height:46px;border:1px solid #30353d;border-radius:8px;background:#0b0d10;color:#fff;text-align:center}.vf-box{display:grid;place-content:center}.vf-box small{font-size:7px;color:#666d76}.vf-input{width:100%;outline:none}.vf-input:focus,.vf-text:focus{border-color:var(--red)}.vf-compare{grid-column:2/6;color:#ff7484;font-size:8px}.vf-series-rest{min-height:46px;border:1px solid rgba(255,48,74,.35);border-radius:8px;background:rgba(255,48,74,.08);color:#fff;font-weight:900;font-size:9px}.vf-series-rest.active{background:linear-gradient(135deg,var(--red2),var(--red));border-color:transparent}.vf-series-rest.done{border-color:rgba(90,220,130,.45);background:rgba(90,220,130,.10)}.vf-series-row.locked{opacity:.42}.vf-input:disabled,.vf-series-rest:disabled,.vf-save:disabled{cursor:not-allowed;opacity:.48}.vf-session-series{display:flex;align-items:center;gap:7px;margin-top:8px}.vf-session-series button{width:30px;height:28px;border:1px solid #30353d;border-radius:7px;background:#111419;color:#fff;font-weight:1000}.vf-session-series strong{font-size:9px;color:#ff8b98}.vf-rest-status{display:grid;place-items:center;text-align:center;font-size:9px}.vf-technique{margin-top:10px;border-top:1px solid #292d34;padding-top:10px}.vf-technique summary{cursor:pointer;color:#ff7484;font-size:9px;font-weight:900}.vf-technique-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.vf-technique-box{border:1px solid #30353d;border-radius:9px;padding:10px;background:#0d0f13}.vf-technique-box h4{margin:0 0 7px;color:#fff}.vf-technique-box ul{margin:0;padding-left:16px;font-size:9px;line-height:1.6;color:#aeb3bb}.vf-technique-tip{margin-top:9px;padding:9px;border-radius:8px;background:rgba(255,48,74,.08);color:#ff9aa6;font-size:9px}.vf-demo{margin-top:10px;border-top:1px solid #292d34;padding-top:10px}.vf-demo summary{cursor:pointer;color:#fff;font-size:9px;font-weight:1000}.vf-demo-wrap{margin-top:10px;border:1px solid rgba(255,48,74,.35);border-radius:10px;overflow:hidden;background:#050608}.vf-demo-video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#050608}.vf-demo-label{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 10px;color:#aeb3bb;font-size:8px;background:#0d0f13}.vf-demo-live{color:#ff5368;font-weight:1000}.vf-calendar-editor-overlay{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}.vf-calendar-editor{width:min(620px,100%);max-height:90vh;overflow:auto;padding:20px;border:1px solid rgba(255,48,74,.48);border-radius:16px;background:linear-gradient(145deg,#17191e,#0d0f13);box-shadow:0 26px 80px rgba(0,0,0,.55),0 0 50px rgba(255,48,74,.12)}.vf-calendar-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.vf-calendar-editor-head strong{font-size:16px;color:#fff}.vf-calendar-editor-close{width:36px;height:36px;border:1px solid #343840;border-radius:9px;background:#0d0f13;color:#fff;font-weight:900}.vf-calendar-editor-plan{padding:10px 12px;margin:10px 0;border:1px solid #2d3138;border-radius:10px;background:#0d0f13;color:#9da3ad;font-size:10px;line-height:1.55}.vf-calendar-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}.vf-calendar-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.vf-share-banner{margin-bottom:14px;padding:14px;border:1px solid rgba(255,48,74,.4);border-radius:12px;background:linear-gradient(120deg,rgba(255,48,74,.10),#111318)}.vf-card-actions{display:grid;grid-template-columns:1fr 180px;gap:9px;padding:0 15px 15px}.vf-save,.vf-primary,.vf-creatine-button{border:0;background:linear-gradient(135deg,var(--red2),var(--red));color:#fff}.vf-save,.vf-rest{min-height:45px;border-radius:9px;font-weight:1000}.vf-rest{border:1px solid #30353d;background:#111419;color:#fff}
        .vf-page-title{font-size:32px;margin:12px 0 20px}.vf-page-title:after{content:"";display:block;width:46px;height:3px;background:var(--red);margin-top:8px}.vf-section-card{padding:16px;border-radius:13px;margin-bottom:11px}.vf-muted{color:#777e88;font-size:10px}.vf-history-ex{display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #292d34}.vf-mini-series{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.vf-mini-chip{padding:5px 7px;border:1px solid #30353d;border-radius:7px;font-size:8px}.vf-progress-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.vf-record{padding:14px;border-radius:12px}.vf-record-big{font-size:24px;color:var(--red);font-weight:1000}.vf-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.vf-primary,.vf-secondary,.vf-danger{padding:10px 12px;border-radius:9px;font-weight:900}.vf-secondary{border:1px solid #30353d;background:#15181d;color:#fff}.vf-danger{border:1px solid #71323a;background:#29171b;color:#ff9aa6}.vf-routines{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.vf-generator{padding:16px;margin-bottom:14px;border:1px solid rgba(255,48,74,.35);border-radius:14px;background:linear-gradient(145deg,rgba(255,48,74,.08),#111419)}.vf-generator-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.vf-generator label{display:grid;gap:5px;font-size:9px;color:#8d949e}.vf-generator-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.vf-generator-title h2{margin:0;color:#fff}.vf-generator-note{font-size:9px;color:#777e88;line-height:1.5;margin-top:9px}.vf-routine-day{padding:15px;border-radius:13px}.vf-routine-list{padding:0;list-style:none}.vf-routine-list li{padding:8px 0;border-top:1px solid #292d34;font-size:10px}.vf-editor{padding:16px;border-radius:14px}.vf-editor-head,.vf-library-head{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vf-day-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.vf-day-tab,.vf-edit-controls button{border:1px solid #30353d;background:#15181d;color:#fff;border-radius:8px;padding:8px}.vf-day-tab.active{border-color:var(--red)}.vf-edit-ex{display:grid;grid-template-columns:30px 1fr 80px 80px 70px auto;gap:7px;align-items:center;padding:9px 0;border-top:1px solid #292d34}.vf-text{width:100%;border:1px solid #30353d;background:#0d0f13;color:#fff;border-radius:8px;padding:10px;outline:none}.vf-library-head{grid-template-columns:2fr repeat(3,1fr)}.vf-library-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.vf-lib-card{padding:12px;border-radius:12px}.vf-lib-meta,.vf-lib-muscle{font-size:9px;color:#777e88}.vf-lib-muscle{color:#ff7484}.vf-custom-form{display:grid;grid-template-columns:2fr repeat(4,1fr);gap:7px;margin:10px 0}.vf-anatomy-editor{display:grid;grid-template-columns:1fr auto;gap:7px}.vf-settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.vf-toggle-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #292d34}.vf-toggle,.vf-rest-choice{border:1px solid #30353d;background:#111419;color:#aaa;border-radius:8px;padding:9px}.vf-toggle.on,.vf-rest-choice.active{border-color:var(--red);color:#fff;background:rgba(255,48,74,.08)}.vf-rest-options{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.vf-settings-note{color:#777e88;font-size:9px;margin-top:10px}
        .vf-calendar-top{display:grid;grid-template-columns:1fr auto;gap:12px}.vf-calendar-month{display:flex;align-items:center;gap:8px}.vf-calendar-month button{width:38px;height:38px;border:1px solid #30353d;background:#111419;color:#fff;border-radius:8px}.vf-calendar-title{font-size:18px;font-weight:1000}.vf-calendar-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px}.vf-calendar-stats,.vf-creatine-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.vf-creatine-summary{grid-template-columns:repeat(4,1fr)}.vf-calendar-stat,.vf-creatine-stat{padding:12px;border:1px solid var(--line);border-radius:10px;background:#111419;text-align:center}.vf-calendar-stat strong,.vf-creatine-stat strong{display:block;color:var(--red);font-size:20px}.vf-calendar-week,.vf-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.vf-calendar-week div{text-align:center;color:#666d76;font-size:9px}.vf-cal-day{position:relative;min-height:105px;padding:8px;border:1px solid #292d34;border-radius:9px;background:#111419;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.vf-cal-day.today{border-color:var(--red)}.vf-cal-day.done{border-color:#35d07f;box-shadow:inset 0 0 0 1px rgba(53,208,127,.12),0 0 18px rgba(53,208,127,.06)}.vf-done-tick{position:absolute;top:6px;right:6px;width:21px;height:21px;border-radius:50%;display:grid;place-items:center;background:#23c875;color:#04170d;border:1px solid #6ff0ac;box-shadow:0 0 15px rgba(35,200,117,.32);font-size:13px;font-weight:1000;animation:vfCheckPop .28s cubic-bezier(.2,.9,.25,1.35)}.vf-cal-badge{font-size:8px;color:#ff7484;margin-top:7px;padding-right:18px}.vf-cal-badge.vf-cal-done{color:#54df96}.vf-cal-open,.vf-creatine-day{width:100%;margin-top:7px;padding:5px;border:1px solid #30353d;border-radius:6px;background:#0d0f13;color:#fff;font-size:8px}.vf-creatine-day{transition:all .18s ease}.vf-creatine-day.taken{border-color:#35d07f;background:linear-gradient(135deg,rgba(35,200,117,.17),rgba(35,200,117,.07));color:#7af1b0;box-shadow:inset 0 0 0 1px rgba(35,200,117,.08)}.vf-creatine-check{display:inline-grid;place-items:center;width:16px;height:16px;margin-right:3px;border-radius:50%;background:#23c875;color:#04170d;font-size:11px;font-weight:1000;vertical-align:-3px;animation:vfCheckPop .28s cubic-bezier(.2,.9,.25,1.35)}.vf-creatine-today{margin:13px 0 4px;padding:10px 12px;border:1px solid #2a2e35;border-radius:10px;background:#0d0f13;display:flex;align-items:center;justify-content:center;gap:8px;color:#858b94;font-size:9px;font-weight:900}.vf-creatine-today.done{border-color:rgba(53,208,127,.65);background:rgba(35,200,117,.09);color:#63e9a1}.vf-creatine-today>span{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#181c22}.vf-creatine-today.done>span{background:#23c875;color:#04170d;box-shadow:0 0 14px rgba(35,200,117,.25)}.vf-creatine-note,.vf-calendar-help{color:#777e88;font-size:9px;line-height:1.5}@keyframes vfCheckPop{0%{transform:scale(.4);opacity:.2}70%{transform:scale(1.18);opacity:1}100%{transform:scale(1)}}.vf-message{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:99;padding:10px 14px;border:1px solid var(--red);border-radius:9px;background:#111419;color:#fff;font-size:10px}.vf-bottom{display:none}
        .vf-nutrition-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:20px}.vf-nutrition-hero h1{margin:4px 0;font-size:clamp(30px,4vw,50px)}.vf-nutrition-hero p{margin:0;color:#7f858f}.vf-nutrition-categories{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.vf-nutrition-cat{border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,#15181d,#0f1115);padding:22px;text-align:left;color:#fff;min-height:160px}.vf-nutrition-cat:hover{border-color:rgba(255,48,74,.45);transform:translateY(-1px)}.vf-nutrition-cat span{font-size:30px}.vf-nutrition-cat h3{font-size:20px;margin:12px 0 5px}.vf-nutrition-cat p{margin:0;color:#727983;font-size:10px}.vf-nutrition-plan-card{margin-top:12px;border:1px solid rgba(255,48,74,.32);border-radius:16px;padding:22px;background:linear-gradient(120deg,rgba(255,48,74,.10),#111318);display:flex;justify-content:space-between;align-items:center;gap:20px}.vf-nutrition-plan-card h3{margin:0 0 6px}.vf-nutrition-toolbar{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}.vf-nutrition-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.vf-meal-card{border:1px solid var(--line);border-radius:16px;background:#111318;overflow:hidden}.vf-meal-image{width:100%;aspect-ratio:16/10;object-fit:cover;background:#0b0d11}.vf-meal-placeholder{width:100%;aspect-ratio:16/10;display:grid;place-items:center;background:linear-gradient(145deg,#17191f,#0d0f13);font-size:46px}.vf-meal-body{padding:16px}.vf-meal-body h3{margin:0 0 5px;font-size:18px}.vf-meal-macros{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:13px 0}.vf-meal-macros div{background:#0d0f13;border:1px solid #252932;border-radius:8px;padding:8px;text-align:center}.vf-meal-macros strong{display:block;font-size:12px}.vf-meal-macros small{color:#6e7580;font-size:7px}.vf-meal-actions{display:flex;gap:7px;flex-wrap:wrap}.vf-meal-detail{margin-top:14px;border-top:1px solid #242830;padding-top:13px}.vf-meal-detail h4{color:var(--red);margin:10px 0 7px}.vf-meal-detail ul{margin:0;padding-left:18px;color:#c5c8ce;font-size:11px;line-height:1.7;white-space:normal}.vf-meal-prep{white-space:pre-wrap;color:#c5c8ce;font-size:11px;line-height:1.7}.vf-admin-badge{display:inline-flex;padding:4px 7px;border-radius:6px;background:rgba(255,48,74,.12);border:1px solid rgba(255,48,74,.3);color:#ff7586;font-size:8px;font-weight:900}.vf-nutrition-form{display:grid;gap:10px;margin:15px 0}.vf-nutrition-form-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:8px}.vf-nutrition-form textarea{min-height:120px;resize:vertical}.vf-plan-modal{border:1px solid rgba(255,48,74,.35);border-radius:14px;background:#12151a;padding:16px;margin:14px 0}.vf-plan-modal-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.vf-week-plan-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0}.vf-week-plan-head div{font-weight:900;text-transform:capitalize}.vf-meal-week{display:grid;grid-template-columns:repeat(7,minmax(160px,1fr));gap:10px;overflow-x:auto;padding-bottom:8px}.vf-meal-day{border:1px solid var(--line);border-radius:13px;background:#111318;padding:10px;min-width:160px}.vf-meal-day h4{margin:0 0 10px;color:#fff}.vf-meal-day h4 span{display:block;color:#6d747e;font-size:8px;margin-top:3px}.vf-meal-slot{border-top:1px solid #242830;padding:8px 0}.vf-meal-slot:first-of-type{border-top:0}.vf-meal-slot>small{color:var(--red);font-size:7px;font-weight:900}.vf-plan-item{display:flex;justify-content:space-between;gap:6px;align-items:flex-start;margin-top:5px;font-size:9px}.vf-plan-item button{border:0;background:transparent;color:#8a9099;padding:0}.vf-back-nutrition{margin-bottom:12px}.vf-unpublished{opacity:.65;outline:1px dashed #555}.vf-publish-chip{color:#f0b75d;font-size:8px;font-weight:900}
        @media(max-width:1050px){.vf-shell{grid-template-columns:210px 1fr}.vf-content{padding:22px 24px 100px}.vf-home-metrics{grid-template-columns:1fr 1fr}.vf-home-grid{grid-template-columns:1fr}.vf-next-workout{grid-row:auto}.vf-library-grid{grid-template-columns:1fr 1fr}.vf-nutrition-categories{grid-template-columns:1fr 1fr}.vf-nutrition-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:760px){.vf-shell{display:block}.vf-sidebar{display:none}.vf-content{padding:14px 12px 110px}.vf-topbar{grid-template-columns:1fr auto}.vf-brand{display:flex;align-items:center;gap:8px}.vf-logo{width:42px;height:42px}.vf-brand-title{font-weight:1000}.vf-brand-title span{color:var(--red)}.vf-brand-sub{font-size:7px;color:#666d76}.vf-day{grid-column:1/-1;grid-row:2}.vf-actions{display:none}.vf-dashboard-head{align-items:flex-start;flex-direction:column}.vf-dashboard-head h1{font-size:38px}.vf-hero-cta{width:100%}.vf-home-metrics{grid-template-columns:1fr 1fr}.vf-stats{grid-template-columns:1fr 1fr}.vf-stat:nth-child(2){border-right:0}.vf-stat:nth-child(-n+2){border-bottom:1px solid var(--line)}.vf-compare-grid{grid-template-columns:1fr}.vf-card-actions{grid-template-columns:1fr}.vf-routines,.vf-progress-grid{grid-template-columns:1fr}.vf-library-head,.vf-custom-form,.vf-editor-head,.vf-settings-grid{grid-template-columns:1fr}.vf-library-grid{grid-template-columns:1fr}.vf-nutrition-categories,.vf-nutrition-grid{grid-template-columns:1fr}.vf-nutrition-form-grid,.vf-plan-modal-grid{grid-template-columns:1fr}.vf-nutrition-plan-card,.vf-nutrition-hero{align-items:stretch;flex-direction:column}.vf-bottom{position:fixed;display:grid;grid-template-columns:repeat(5,1fr);left:6px;right:6px;bottom:6px;z-index:80;border:1px solid rgba(255,48,74,.18);border-radius:13px;overflow:hidden;background:
linear-gradient(180deg,rgba(18,12,15,.97),rgba(11,12,15,.98));backdrop-filter:blur(16px);box-shadow:0 -10px 40px rgba(120,0,18,.16)}.vf-nav{min-height:54px;border:0;background:transparent;color:#777e88;font-size:7px}.vf-nav span{display:block;font-size:16px;margin-bottom:3px}.vf-nav.active{color:#fff;background:rgba(255,48,74,.10);box-shadow:inset 0 -2px 0 var(--red)}.vf-calendar-top{grid-template-columns:1fr}.vf-calendar-controls{grid-template-columns:1fr}.vf-cal-day{min-height:82px;padding:5px}.vf-cal-open{display:block;width:100%;margin-top:5px;padding:5px 2px;font-size:7px}.vf-edit-ex{grid-template-columns:28px 1fr 58px 58px 58px}.vf-edit-controls{grid-column:2/-1}}
        @media(max-width:500px){.vf-home-metrics{grid-template-columns:1fr}.vf-home-grid>article{padding:16px}.vf-card-head{grid-template-columns:auto 1fr auto;padding:11px}.vf-anatomia-pro{width:70px;min-width:70px;height:82px}.vf-ex-title{font-size:14px}.vf-alt-list{grid-template-columns:1fr}.vf-series-row{grid-template-columns:25px repeat(3,1fr) 76px;gap:4px}.vf-series-rest{font-size:7px;padding:4px}.vf-technique-grid,.vf-calendar-editor-grid,.vf-calendar-editor-actions,.vf-generator-grid{grid-template-columns:1fr}.vf-calendar-editor{padding:16px}.vf-calendar-editor-head strong{font-size:14px}.vf-panel{padding:8px}.vf-calendar-stats{grid-template-columns:repeat(3,1fr)}.vf-creatine-summary{grid-template-columns:1fr 1fr}.vf-calendar-grid,.vf-calendar-week{gap:3px}.vf-cal-day{min-height:70px}.vf-cal-badge{font-size:6px}.vf-rest-options{grid-template-columns:1fr 1fr}}


        

      `}</style>

 {splashVisible && (
   <div className={`vf-splash ${splashLeaving ? "leaving" : ""}`} aria-label="VitorFit cargando">
     <div className="vf-splash-bg" aria-hidden="true" />
     <div className="vf-splash-gym" aria-hidden="true">
       <div className="vf-splash-left" />
       <div className="vf-splash-right" />
       <div className="vf-splash-floor" />
       <div className="vf-splash-fog" />
       <div className="vf-splash-embers" />
       <div className="vf-splash-light left" />
       <div className="vf-splash-light right" />
       <div className="vf-splash-redline one" />
       <div className="vf-splash-redline two" />
       <div className="vf-splash-redline three" />
     </div>

     <div className="vf-splash-center">
       <div className="vf-splash-halo" aria-hidden="true" />
       <div className="vf-splash-logo-wrap">
         <div className="vf-splash-barbell" aria-hidden="true">
           <span className="plate" />
           <span className="bar" />
           <span className="plate" />
         </div>
         <img className="vf-splash-logo" src="/vitorfit-logo.png" alt="VitorFit" />
       </div>
       <div className="vf-splash-wordmark" aria-label="VitorFit">
         <span className="vitor">VITOR</span>
         <span className="fit">FIT</span>
       </div>
       <div className="vf-splash-tagline">MÁS QUE UN ENTRENAMIENTO</div>
     </div>

     <div className="vf-splash-bottom">
       <div className="vf-splash-loading">CARGANDO...</div>
       <div className="vf-splash-track">
         <i style={{ width: `${splashProgress}%` }} />
         <span className="vf-splash-percent">{splashProgress}%</span>
       </div>
     </div>
   </div>
 )}

 <div className="vf-shell">

  <aside className="vf-sidebar">
    <div className="vf-side-brand">
      <img src="/vitorfit-logo.png" alt="VitorFit" />
    </div>

    <nav className="vf-side-nav">
      <button className={vista === "inicio" ? "active" : ""} onClick={() => setVista("inicio")}>
        <span>⌂</span><b>Inicio</b>
      </button>

      <button className={vista === "entreno" ? "active" : ""} onClick={abrirEntrenamiento}>
        <span>🏋️</span><b>Entrenamiento</b>
      </button>

      <button className={vista === "historial" ? "active" : ""} onClick={() => setVista("historial")}>
        <span>◷</span><b>Historial</b>
      </button>

      <button className={vista === "progreso" ? "active" : ""} onClick={() => setVista("progreso")}>
        <span>⌁</span><b>Progreso</b>
      </button>

      <button className={vista === "rutinas" ? "active" : ""} onClick={() => setVista("rutinas")}>
        <span>☰</span><b>Rutinas</b>
      </button>

      <button
        className={vista === "biblioteca" ? "active" : ""}
        onClick={() => {
          setTargetBiblioteca(null);
          setVista("biblioteca");
        }}
      >
        <span>▦</span><b>Biblioteca</b>
      </button>

      <button className={vista === "nutricion" ? "active" : ""} onClick={() => abrirNutricion("inicio")}>
        <span>🍽️</span><b>Nutrición</b>
      </button>

      <button className={vista === "calendario" ? "active" : ""} onClick={() => setVista("calendario")}>
        <span>□</span><b>Calendario</b>
      </button>

      <button className={vista === "ajustes" ? "active" : ""} onClick={() => setVista("ajustes")}>
        <span>⚙</span><b>Ajustes</b>
      </button>
    </nav>

    <div className="vf-side-footer">
      <span className="vf-online-dot"></span>
      <div>
        <b>VitorFit</b>
        <small>Datos sincronizados</small>
      </div>
    </div>
  </aside>

  <div className="vf-content">
    <header className="vf-topbar">

      <div className="vf-brand">
        <img
          className="vf-logo"
          src="/vitorfit-logo.png"
          alt="VitorFit"
        />
      </div>

      <div className="vf-day">
        <button onClick={() => cambiarDia(-1)}>‹</button>
        <div className="vf-day-pill">
          📅 {diaActual?.titulo ?? "SIN DÍA"}
        </div>
        <button onClick={() => cambiarDia(1)}>›</button>
      </div>

      <div className="vf-actions">
        <button
          className="vf-icon-button"
          onClick={() => setVista("progreso")}
        >
          📈
        </button>
      </div>

    </header>

    <div className="vf-routine-name">
      {rutinaActual?.nombre} · {diaActual?.subtitulo}
    </div>
        {vista === "inicio" && <>
          <section className="vf-dashboard-head">
<div>
  <img
    src="/vitorfit-logo.png"
    alt="VitorFit"
    style={{ width: "70px", height: "70px", objectFit: "contain", marginBottom: "12px" }}
  />
  <div className="vf-eyebrow">VITORFIT DASHBOARD</div>
  <h1>Hola, <span>vamos a entrenar.</span></h1>
  <p>Todo tu progreso, rutina y constancia en un solo lugar.</p>
</div>            <button className="vf-hero-cta" onClick={abrirEntrenamiento}>INICIAR ENTRENAMIENTO <span>→</span></button>
          </section>

          <section className="vf-home-metrics">
            <article><div className="vf-metric-icon">🔥</div><div><small>RACHA ACTUAL</small><strong>{rachaCalendario} días</strong><span>Sigue sumando</span></div></article>
            <article><div className="vf-metric-icon">▥</div><div><small>CREATINA</small><strong>{estadisticasCreatina.porcentaje}%</strong><span>{estadisticasCreatina.rachaActual} días de racha</span></div></article>
          </section>

          <section className="vf-home-grid">
            <article className="vf-next-workout">
              <div className="vf-card-kicker">PRÓXIMO ENTRENAMIENTO</div>
              <div className="vf-next-top"><div><h2>{diaActual?.titulo ?? "ENTRENAMIENTO"}</h2><p>{diaActual?.subtitulo ?? rutinaActual?.nombre}</p></div><div className="vf-day-number">{diaActualIndex+1}</div></div>
              <div className="vf-ex-preview">{(diaActual?.ejercicios??[]).slice(0,4).map((e,i)=><div key={e.id}><span>{String(i+1).padStart(2,"0")}</span><div><b>{e.nombre}</b><small>{e.series} series · {e.reps} reps</small></div><AnatomiaPro id={e.id} musculo={e.musculo} patron={e.patron} nombre={e.nombre} compact /></div>)}</div>
              <button className="vf-wide-cta" onClick={abrirEntrenamiento}>EMPEZAR AHORA <span>→</span></button>
            </article>

            <article className="vf-week-card">
              <div className="vf-card-title-row"><div><div className="vf-card-kicker">ESTA SEMANA</div><h3>Constancia</h3></div><button onClick={()=>setVista("calendario")}>VER CALENDARIO</button></div>
              <div className="vf-week-days">{["L","M","X","J","V","S","D"].map((d,i)=><div key={d+i} className={i<Math.min(7,resumenCalendario.completados)?"done":""}><span>{d}</span><b>{i<Math.min(7,resumenCalendario.completados)?"✓":"·"}</b></div>)}</div>
              <div className="vf-week-progress"><div><span>Objetivo semanal</span><b>{resumenCalendario.completados} completados</b></div><div className="vf-progress-track"><i style={{width:`${Math.min(100,(resumenCalendario.completados/4)*100)}%`}}/></div></div>
            </article>

            <article className="vf-last-card">
              <div className="vf-card-title-row"><div><div className="vf-card-kicker">ÚLTIMA ACTIVIDAD</div><h3>Entrenamiento reciente</h3></div><button onClick={()=>setVista("historial")}>HISTORIAL</button></div>
{ultimoRegistroHistorial ? (
  <>
    <strong className="vf-last-title">
      {ultimoRegistroHistorial.nombre}
    </strong>

    <div className="vf-last-series">
      {ultimoRegistroHistorial.series.slice(0, 3).map((serie: Serie, i: number) => (
        <span key={i}>
          {serie.kg || "0"} kg × {serie.reps || "0"} reps
        </span>
      ))}
    </div>
  </>
) : (
  <span>Sin entrenamientos registrados todavía</span>
)}
</article>

            <article className="vf-creatine-home">
              <div className="vf-card-kicker">GYM + CREATINA</div>
              <h3>Constancia diaria</h3>
              <div className="vf-creatine-circle"><strong>{estadisticasCreatina.porcentaje}%</strong><span>este mes</span></div>
              <div className={`vf-creatine-today ${creatinaHoy ? "done" : ""}`}>
                <span>{creatinaHoy ? "✓" : "💊"}</span>
                <b>{creatinaHoy ? "CREATINA TOMADA HOY" : "CREATINA PENDIENTE HOY"}</b>
              </div>
              <p>{estadisticasCreatina.tomadosMes} tomas registradas · mejor racha {estadisticasCreatina.mejorRacha}</p>
              {!creatinaHoy ? <button onClick={marcarCreatinaHoy}>✓ MARCAR CREATINA DE HOY</button> : <button onClick={()=>setVista("calendario")}>VER CALENDARIO</button>}
            </article>
          </section>
        </>}

        {vista === "entreno" && diaActual && <>
          <section className="vf-stats">
            <div className="vf-stat"><div className="vf-ring" style={{ ["--progress" as string]: Math.round((completados / Math.max(1, diaActual.ejercicios.length)) * 100) }}><div className="vf-ring-text">{completados}/{diaActual.ejercicios.length}</div></div><div className="vf-stat-label">EJERCICIOS</div><div className="vf-stat-sub">completados</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🕘</div><div className="vf-stat-value">{formatoTiempo(segundos)}</div><div className="vf-stat-label">DURACIÓN</div><div className="vf-stat-sub">{entrenoPausado ? "PAUSADO" : "del entrenamiento"}</div><button className={`vf-pause ${entrenoPausado?"paused":""}`} onClick={togglePausaEntreno}>{entrenoPausado?"▶ REANUDAR":"⏸ PAUSAR"}</button></div>
            <div className="vf-stat"><div className="vf-stat-icon">🔥</div><div className="vf-stat-value">{kcal}</div><div className="vf-stat-label">KCAL</div><div className="vf-stat-sub">estimadas</div></div>
            <div className="vf-stat"><div className="vf-stat-icon">🏆</div><div className="vf-stat-value" style={{fontSize:20}}>¡TÚ PUEDES!</div><div className="vf-stat-sub">Cada repetición te acerca a tu mejor versión</div><div className="vf-stat-sub" style={{marginTop:8,color:"#D94B55"}}>{seriesCompletadas} series hechas</div></div>
          </section>

          {diaActual.ejercicios.map((ej,index)=>{
            const cantidadSeries=cantidadSeriesSesion(ej), confirmadas=seriesConfirmadas[ej.id]??0, anterior=ultimoRegistro(ej), actuales=registros[ej.id]??seriesVacias(cantidadSeries), varianteActual=nombreVariante(ej), alternativas=alternativasPara(ej);
            return <section className="vf-card" key={ej.id}>
              <div className="vf-card-head"><div className="vf-num">{String(index+1).padStart(2,"0")}</div><div><div className="vf-title-row"><div className="vf-ex-title">{varianteActual}</div><span className="vf-tag">{ej.musculo}</span></div><div className="vf-prescription">🎯 {cantidadSeries} series · {ej.reps} reps · RIR {ej.rir} · {ej.equipo}</div><div className="vf-session-series"><button onClick={()=>cambiarSeriesSesion(ej,-1)} disabled={cantidadSeries<=Math.max(1,confirmadas)}>−</button><strong>{cantidadSeries} SERIES HOY</strong><button onClick={()=>cambiarSeriesSesion(ej,1)} disabled={cantidadSeries>=10}>+</button></div></div><AnatomiaPro id={ej.id} musculo={ej.musculo} patron={ej.patron} nombre={ej.nombre} /></div>
              <div className="vf-alt-wrap">
                <button className="vf-alt-button" onClick={()=>setAlternativasAbiertas(p=>({...p,[ej.id]:!p[ej.id]}))}>🔄 ¿Está ocupado o no puedes hacerlo? ALTERNAR</button>
                {alternativasAbiertas[ej.id]&&<><div className="vf-alt-tools"><button className={(modoAlternativa[ej.id]??"inteligente")==="inteligente"?"active":""} onClick={()=>setModoAlternativa(p=>({...p,[ej.id]:"inteligente"}))}>✨ MEJOR ALTERNATIVA</button><button className={modoAlternativa[ej.id]==="patron"?"active":""} onClick={()=>setModoAlternativa(p=>({...p,[ej.id]:"patron"}))}>🎯 MISMO PATRÓN</button><button className={modoAlternativa[ej.id]==="musculo"?"active":""} onClick={()=>setModoAlternativa(p=>({...p,[ej.id]:"musculo"}))}>💪 MISMO MÚSCULO</button></div><div className="vf-alt-list">{alternativas.map(alt=><button key={alt.id} className={`vf-alt-option ${varianteActual===alt.nombre?"active":""}`} onClick={()=>{setVariantes(p=>({...p,[ej.id]:alt.nombre}));setAlternativasAbiertas(p=>({...p,[ej.id]:false}));setMensaje(`🔄 Cambiado a ${alt.nombre}. Series, reps y RIR se mantienen.`)}}><strong>{alt.nombre}</strong><br/><span className="vf-muted">{alt.equipo} · {alt.patron}</span></button>)}</div></>}
              </div>
              <div className="vf-compare-grid">
                <div className="vf-panel last"><div className="vf-panel-head"><span>📈 ÚLTIMA SESIÓN</span>{anterior&&<span className="vf-date">{anterior.fecha.split(",")[0]}</span>}</div>{Array.from({length:Math.max(cantidadSeries,anterior?.series?.length??0)},(_,i)=>{const s=anterior?.series?.[i];return <div className="vf-series-row" key={i}><div className="vf-slabel">S{i+1}</div><div className="vf-box"><strong>{s?.kg||"—"}</strong><small>KG</small></div><div className="vf-box"><strong>{s?.reps||"—"}</strong><small>REPS</small></div><div className="vf-box"><strong>{s?.rir||"—"}</strong><small>RIR</small></div><div className="vf-box"><strong>—</strong><small>DESCANSO</small></div></div>})}{anterior&&anterior.variante!==varianteActual&&<div className="vf-muted">Último registro: {anterior.variante}</div>}</div>
                <div className="vf-panel today"><div className="vf-panel-head"><span>✏️ HOY</span><span className="vf-muted">{varianteActual}</span></div>{Array.from({length:cantidadSeries},(_,i)=>{const s=actuales[i]??{kg:"",reps:"",rir:""},comp=compararSerie(ej,i),hecha=i<confirmadas,editando=serieEditando?.ejId===ej.id&&serieEditando?.serieIndex===i,activa=i===confirmadas||editando,bloqueada=i>confirmadas&&!editando;return <div className={`vf-series-row ${bloqueada?"locked":""}`} key={i}><div className="vf-slabel">S{i+1}</div><input className="vf-input" disabled={!activa} type="number" placeholder="KG" value={s.kg} onChange={e=>setSerie(ej,i,"kg",e.target.value)}/><input className="vf-input" disabled={!activa} type="number" placeholder="REPS" value={s.reps} onChange={e=>setSerie(ej,i,"reps",e.target.value)}/><input className="vf-input" disabled={!activa} type="number" placeholder="RIR" value={s.rir} onChange={e=>setSerie(ej,i,"rir",e.target.value)}/>{hecha?(editando?<button className="vf-series-rest active" onClick={()=>guardarEdicionSerie(ej,i)}>✓ GUARDAR CAMBIO</button>:<button className="vf-series-rest done" onClick={()=>editarSerieConfirmada(ej,i)}>✏️ EDITAR</button>):<button className={`vf-series-rest ${descansoSerieActiva?.ejId===ej.id&&descansoSerieActiva?.serieIndex===i&&descansoRestante>0?"active":""}`} disabled={!activa} onClick={()=>completarSerie(ej,i)}>{bloqueada?"🔒 BLOQUEADA":`✓ SERIE ${i+1}`}</button>}{comp&&<div className="vf-compare">{comp}</div>}</div>})}</div>
              </div>
              <div className="vf-card-actions"><button className="vf-save" disabled={confirmadas<cantidadSeries} onClick={()=>guardarEjercicio(ej)}>💾 GUARDAR EJERCICIO</button><div className="vf-rest vf-rest-status">{descansoSerieActiva?.ejId===ej.id&&descansoRestante>0?`⏱️ DESCANSO ${descansoRestante}s`:confirmadas>=cantidadSeries?"✅ LISTO PARA GUARDAR":"DESCANSO AUTOMÁTICO"}</div></div>
            </section>
          })}
          {!diaActual.ejercicios.length&&<section className="vf-section-card">Este día todavía no tiene ejercicios. Ve a <strong>RUTINAS</strong> para añadirlos desde la biblioteca.</section>}
          <a className="vf-home" href="/">← Volver al inicio</a>
        </>}

        {vista==="historial"&&<><h1 className="vf-page-title">📚 HISTORIAL</h1>{Object.entries(historial)
  .flatMap(([ejId, registrosEj]) => {
    const ej = rutinas.flatMap(r=>r.dias.flatMap(d=>d.ejercicios)).find(x=>x.id===ejId);
    return compactarRegistros(registrosEj ?? []).map(r => ({ ejId, ej, r }));
  })
  .sort((a,b) => {
    const fechaMs = (fecha:string) => {
      const [parteFecha, parteHora="00:00:00"] = fecha.split(",").map(x=>x.trim());
      const [d,m,y] = parteFecha.split("/").map(Number);
      const [hh=0,mm=0,ss=0] = parteHora.split(":").map(Number);
      return new Date(y, (m||1)-1, d||1, hh, mm, ss).getTime();
    };
    return fechaMs(b.r.fecha) - fechaMs(a.r.fecha);
  })
  .map(({ejId,ej,r},i)=><section className="vf-section-card" key={`${ejId}-${r.fecha}-${i}`}><div className="vf-history-name">{ej?.nombre??r.nombre??"Ejercicio"}</div><div className="vf-muted">{ej?.patron??r.patron??"—"} · {r.fecha}</div><div className="vf-history-ex"><div><strong>{r.variante}</strong><div className="vf-mini-series">{r.series.map((s,si)=><span className="vf-mini-chip" key={si}>S{si+1}: {s.kg||"—"}kg · {s.reps||"—"} reps · RIR {s.rir||"—"}</span>)}</div></div>{ej?.musculo&&<span className="vf-tag">{ej.musculo}</span>}</div></section>)}{Object.values(historial).every(lista=>!lista?.length)&&<div className="vf-section-card">Todavía no hay entrenamientos guardados.</div>}</>}

{vista==="progreso"&&<><h1 className="vf-page-title">📈 PROGRESO Y RÉCORDS</h1><div className="vf-progress-grid">{progreso.filter(p=>p.sesiones>0).map((p,i)=><div className="vf-record" key={`${p.rutina}-${p.dia}-${p.nombre}-${i}`}><div className="vf-muted">{p.rutina} · {p.dia}</div><h3>{p.nombre}</h3><div className="vf-record-big">{p.mejorKg?`${p.mejorKg} KG`:"—"}</div><div className="vf-muted">Récord de peso</div><div style={{marginTop:10}}><strong>🏆 Mejor serie:</strong> {p.mejorTexto}</div><div className="vf-muted">e1RM aprox.: {p.mejorE1rm?`${p.mejorE1rm.toFixed(1)} kg`:"—"}</div><div style={{marginTop:8,color:"#D94B55",fontWeight:900}}>Tendencia: {p.tendencia}</div><div className="vf-muted">{p.sesiones} sesiones guardadas</div></div>)}</div>{progreso.every(p=>p.sesiones===0)&&<div className="vf-section-card">Guarda entrenamientos y aquí aparecerán tus récords y evolución automáticamente.</div>}</>}

        {vista==="rutinas"&&<><h1 className="vf-page-title">📋 MIS RUTINAS</h1>{cargandoRutinaCompartida&&<div className="vf-share-banner">Cargando rutina compartida...</div>}{rutinaCompartida&&<div className="vf-share-banner"><strong>📥 Te han compartido: {rutinaCompartida.nombre}</strong><div className="vf-muted" style={{margin:"6px 0 10px"}}>{rutinaCompartida.descripcion} · {rutinaCompartida.dias.length} días</div><div className="vf-toolbar" style={{margin:0}}><button className="vf-primary" onClick={guardarRutinaCompartida}>＋ GUARDAR EN MIS RUTINAS</button><button className="vf-secondary" onClick={()=>setRutinaCompartida(null)}>CANCELAR</button></div></div>}<div className="vf-toolbar"><button className="vf-primary" onClick={()=>setMostrarGenerador(v=>!v)}>✨ GENERAR SEGÚN MIS OBJETIVOS</button><button className="vf-secondary" onClick={crearRutina}>＋ CREAR RUTINA</button><button className="vf-secondary" onClick={()=>setVista("biblioteca")}>📚 BIBLIOTECA ({biblioteca.length})</button></div>
          {mostrarGenerador&&<section className="vf-generator">
            <div className="vf-generator-title"><div><div className="vf-eyebrow">VITORFIT COACH</div><h2>✨ Generador de rutina</h2></div><button className="vf-secondary" onClick={()=>setMostrarGenerador(false)}>✕ CERRAR</button></div>
            <div className="vf-generator-grid">
              <label>Objetivo<select className="vf-text" value={configGenerador.objetivo} onChange={e=>setConfigGenerador(c=>({...c,objetivo:e.target.value as GeneratorConfig["objetivo"]}))}><option value="recomposicion">Recomposición corporal</option><option value="hipertrofia">Ganar masa muscular</option><option value="fuerza">Fuerza</option><option value="perdida-grasa">Pérdida de grasa</option></select></label>
              <label>Días por semana<select className="vf-text" value={configGenerador.dias} onChange={e=>setConfigGenerador(c=>({...c,dias:Number(e.target.value) as GeneratorConfig["dias"]}))}>{[2,3,4,5,6].map(x=><option key={x} value={x}>{x} días</option>)}</select></label>
              <label>Tiempo por sesión<select className="vf-text" value={configGenerador.minutos} onChange={e=>setConfigGenerador(c=>({...c,minutos:Number(e.target.value) as GeneratorConfig["minutos"]}))}>{[45,60,90,120].map(x=><option key={x} value={x}>{x} min</option>)}</select></label>
              <label>Nivel<select className="vf-text" value={configGenerador.nivel} onChange={e=>setConfigGenerador(c=>({...c,nivel:e.target.value as GeneratorConfig["nivel"]}))}><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select></label>
              <label>Músculo prioritario<select className="vf-text" value={configGenerador.prioridad} onChange={e=>setConfigGenerador(c=>({...c,prioridad:e.target.value}))}>{["Pecho","Espalda","Hombro","Bíceps","Tríceps","Cuádriceps","Femoral","Glúteo","Abdomen"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Material<select className="vf-text" value={configGenerador.material} onChange={e=>setConfigGenerador(c=>({...c,material:e.target.value as GeneratorConfig["material"]}))}><option value="gimnasio">Gimnasio completo</option><option value="mancuernas">Mancuernas + banco</option><option value="casa">Casa / peso corporal</option></select></label>
            </div>
            <label style={{display:"grid",gap:5,marginTop:9}}>Ejercicios o movimientos a evitar (separados por coma)<input className="vf-text" placeholder="Ej.: sentadilla, peso muerto..." value={configGenerador.evitar} onChange={e=>setConfigGenerador(c=>({...c,evitar:e.target.value}))}/></label>
            <div className="vf-generator-note">VitorFit selecciona ejercicios de tu Biblioteca y ajusta series, repeticiones, RIR y descansos según el objetivo, nivel y tiempo disponibles. Después puedes editar la rutina normalmente.</div>
            <div className="vf-toolbar" style={{marginBottom:0,marginTop:12}}><button className="vf-primary" onClick={generarRutinaObjetivos}>✨ GENERAR MI RUTINA</button></div>
          </section>}<div className="vf-routines">{rutinas.map(r=><div className="vf-routine-day" key={r.id}><h3>{r.nombre}</h3><div className="vf-muted">{r.descripcion} · {r.dias.length} días</div><ul className="vf-routine-list">{r.dias.map(d=><li key={d.id}><strong>{d.titulo}</strong> · {d.subtitulo}<br/><span className="vf-muted">{d.ejercicios.length} ejercicios</span></li>)}</ul><div className="vf-toolbar" style={{marginTop:12,marginBottom:0}}><button className="vf-primary" onClick={()=>{setRutinaActualId(r.id);setDiaActualIndex(0);setVista("entreno")}}>▶ USAR</button><button className="vf-secondary" onClick={()=>{setEditorRutinaId(r.id);setEditorDiaId(r.dias[0]?.id??null)}}>✏️ EDITAR</button><button className="vf-secondary" onClick={()=>duplicarRutina(r)}>⧉ DUPLICAR</button><button className="vf-secondary" onClick={()=>compartirRutina(r)}>📤 COMPARTIR</button><button className="vf-danger" onClick={()=>eliminarRutina(r.id)}>🗑️</button></div></div>)}</div>
          {editorRutina&&<section className="vf-editor"><h2 style={{color:"#D94B55",marginTop:0}}>✏️ EDITAR RUTINA</h2><div className="vf-editor-head"><input className="vf-text" value={editorRutina.nombre} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,nombre:e.target.value}))}/><input className="vf-text" value={editorRutina.descripcion} onChange={e=>actualizarRutina(editorRutina.id,r=>({...r,descripcion:e.target.value}))}/></div><div className="vf-day-tabs">{editorRutina.dias.map(d=><button className={`vf-day-tab ${editorDia?.id===d.id?"active":""}`} key={d.id} onClick={()=>setEditorDiaId(d.id)}>{d.titulo}</button>)}<button className="vf-primary" onClick={()=>crearDia(editorRutina.id)}>＋ DÍA</button></div>{editorDia&&<><div className="vf-editor-head"><input className="vf-text" value={editorDia.titulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{titulo:e.target.value})}/><input className="vf-text" value={editorDia.subtitulo} onChange={e=>actualizarDia(editorRutina.id,editorDia.id,{subtitulo:e.target.value})}/></div><div className="vf-toolbar" style={{marginTop:12}}><button className="vf-primary" onClick={()=>{setTargetBiblioteca({rutinaId:editorRutina.id,diaId:editorDia.id});setVista("biblioteca")}}>＋ AÑADIR EJERCICIO</button><button className="vf-danger" onClick={()=>eliminarDia(editorRutina.id,editorDia.id)}>🗑️ ELIMINAR DÍA</button></div>{editorDia.ejercicios.map((ex,i)=><div className="vf-edit-ex" key={ex.id}><strong>{i+1}</strong><div><strong>{ex.nombre}</strong><div className="vf-muted">{ex.musculo} · {ex.patron}</div></div><input className="vf-text" type="number" min={1} value={ex.series} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{series:Math.max(1,Number(e.target.value)||1)})}/><input className="vf-text" value={ex.reps} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{reps:e.target.value})}/><input className="vf-text" value={ex.rir} onChange={e=>actualizarEjercicioRutina(editorRutina.id,editorDia.id,ex.id,{rir:e.target.value})}/><div className="vf-edit-controls"><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,-1)}>↑</button><button onClick={()=>moverEjercicio(editorRutina.id,editorDia.id,i,1)}>↓</button><button onClick={()=>eliminarEjercicioRutina(editorRutina.id,editorDia.id,ex.id)}>🗑️</button></div></div>)}{!editorDia.ejercicios.length&&<div className="vf-muted" style={{padding:"18px 0"}}>Este día está vacío. Pulsa “Añadir ejercicio”.</div>}</>}</section>}
        </>}

        {vista==="biblioteca"&&<><h1 className="vf-page-title">📚 BIBLIOTECA DE EJERCICIOS</h1><p className="vf-lib-count">{biblioteca.length} ejercicios disponibles · {resultadosBiblioteca.length} visibles</p>{targetBiblioteca&&<div className="vf-section-card" style={{borderColor:"#D94B55"}}>➕ Estás añadiendo ejercicios a una rutina. Pulsa <strong>AÑADIR</strong> en todos los que quieras y después vuelve a RUTINAS.</div>}<div className="vf-library-head"><input className="vf-text" placeholder="🔎 Buscar ejercicio, músculo, patrón..." value={busquedaBiblioteca} onChange={e=>setBusquedaBiblioteca(e.target.value)}/><select className="vf-text" value={filtroMusculo} onChange={e=>setFiltroMusculo(e.target.value)}>{musculos.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroPatron} onChange={e=>setFiltroPatron(e.target.value)}>{patrones.map(x=><option key={x}>{x}</option>)}</select><select className="vf-text" value={filtroEquipo} onChange={e=>setFiltroEquipo(e.target.value)}>{equipos.map(x=><option key={x}>{x}</option>)}</select></div><div className="vf-toolbar"><button className="vf-primary" onClick={()=>setMostrarCrearEjercicio(!mostrarCrearEjercicio)}>⭐ CREAR EJERCICIO PERSONALIZADO</button>{targetBiblioteca&&<button className="vf-secondary" onClick={()=>setVista("rutinas")}>← VOLVER AL EDITOR</button>}</div>{mostrarCrearEjercicio&&<div className="vf-section-card"><strong>⭐ Nuevo ejercicio personalizado</strong><div className="vf-custom-form"><input className="vf-text" placeholder="Nombre" value={nuevoEjercicio.nombre} onChange={e=>setNuevoEjercicio(n=>({...n,nombre:e.target.value}))}/><input className="vf-text" placeholder="Músculo" value={nuevoEjercicio.musculo} onChange={e=>setNuevoEjercicio(n=>({...n,musculo:e.target.value}))}/><input className="vf-text" placeholder="Patrón" value={nuevoEjercicio.patron} onChange={e=>setNuevoEjercicio(n=>({...n,patron:e.target.value}))}/><input className="vf-text" placeholder="Equipo" value={nuevoEjercicio.equipo} onChange={e=>setNuevoEjercicio(n=>({...n,equipo:e.target.value}))}/><select className="vf-text" value={nuevoEjercicio.tipo} onChange={e=>setNuevoEjercicio(n=>({...n,tipo:e.target.value as "Compuesto"|"Aislamiento"}))}><option>Compuesto</option><option>Aislamiento</option></select></div><button className="vf-primary" onClick={crearEjercicioPersonal}>GUARDAR EN BIBLIOTECA</button></div>}<div className="vf-library-grid">{resultadosBiblioteca.map(ex=><div className="vf-lib-card" key={ex.id}><div className="vf-lib-top"><div><h3>{ex.nombre}</h3><div className="vf-lib-muscle">{ex.musculo}</div></div><AnatomiaPro id={ex.id} musculo={ex.musculo} patron={ex.patron} nombre={ex.nombre} compact /></div><div className="vf-lib-meta">💪 {ex.musculo}<br/>🎯 {ex.patron}<br/>⚙️ {ex.equipo} · {ex.tipo}</div>
{ex.demo_url&&<details className="vf-demo"><summary>🎬 VER DEMOSTRACIÓN EN MOVIMIENTO</summary><div className="vf-demo-wrap">{ex.demo_url.toLowerCase().endsWith(".gif") ? <img className="vf-demo-video" src={ex.demo_url} alt={`Demostración de ${ex.nombre}`} loading="lazy" /> : <video className="vf-demo-video" src={ex.demo_url} autoPlay loop muted playsInline preload="metadata" controls/>}<div className="vf-demo-label"><span className="vf-demo-live">● DEMO VITORFIT</span><span>Reproducción en bucle</span></div></div></details>}
{(()=>{const tec=tecnicaEjercicio(ex);return <details className="vf-technique"><summary>▶ CÓMO HACERLO CORRECTAMENTE</summary><div className="vf-technique-grid"><div className="vf-technique-box"><h4>✅ Técnica</h4><ul>{tec.pasos.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div className="vf-technique-box"><h4>⚠️ Errores comunes</h4><ul>{tec.errores.map((x,i)=><li key={i}>{x}</li>)}</ul></div></div><div className="vf-technique-tip"><strong>💡 Consejo:</strong> {tec.consejo}</div></details>})()}
<details className="vf-anatomy-edit" open={editorAnatomiaId===ex.id} onToggle={(e)=>{if((e.currentTarget as HTMLDetailsElement).open)setEditorAnatomiaId(ex.id);else if(editorAnatomiaId===ex.id)setEditorAnatomiaId(null)}}>
  <summary>✏️ EDITAR ANATOMÍA</summary>
  <div className="vf-anatomy-editor">
    <select className="vf-text" value={anatomiaOverrides[ex.id] ?? ""} onChange={e=>setAnatomiaOverrides(p=>{const n={...p}; if(e.target.value)n[ex.id]=e.target.value; else delete n[ex.id]; return n;})}>
      <option value="">Automática (recomendada)</option>
      {OPCIONES_ANATOMIA.map(([valor,etiqueta])=><option key={valor} value={valor}>{etiqueta}</option>)}
    </select>
    <button className="vf-anatomy-reset" onClick={()=>setAnatomiaOverrides(p=>{const n={...p};delete n[ex.id];return n;})}>↺ AUTO</button>
  </div>
  <div className="vf-anatomy-saved">{anatomiaOverrides[ex.id] ? "✓ Corrección manual guardada" : "Usando clasificación automática"}</div>
</details>
{targetBiblioteca&&<button className="vf-primary" onClick={()=>añadirDesdeBiblioteca(ex)}>＋ AÑADIR</button>}</div>)}</div>{!resultadosBiblioteca.length&&<div className="vf-section-card">No encontré ejercicios con esos filtros.</div>}</>}

        {vista === "nutricion" && <>
          {seccionNutricion === "inicio" && <>
            <section className="vf-nutrition-hero">
              <div><div className="vf-eyebrow">VITORFIT NUTRICIÓN</div><h1>Nutrición</h1><p>Elige un plato y añádelo a tu plan semanal.</p></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="vf-primary" onClick={()=>{resetFormPlato();setNombreAutorPropuesta("");setSeccionNutricion("proponer")}}>＋ PROPONER PLATO</button>
                {esAdminNutricion && <button className="vf-secondary" onClick={()=>setSeccionNutricion("pendientes")}>🔔 PENDIENTES ({propuestasPendientes.length})</button>}
                {esAdminNutricion && <button className="vf-primary" onClick={()=>{resetFormPlato();setMostrarEditorPlato(true)}}>＋ CREAR PLATO</button>}
              </div>
            </section>
            <div className="vf-nutrition-categories">
              <button className="vf-nutrition-cat" onClick={()=>setSeccionNutricion("desayuno")}><span>🍳</span><h3>Desayunos</h3><p>Ideas para empezar el día.</p></button>
              <button className="vf-nutrition-cat" onClick={()=>setSeccionNutricion("comida")}><span>🍛</span><h3>Comidas</h3><p>Platos completos y equilibrados.</p></button>
              <button className="vf-nutrition-cat" onClick={()=>setSeccionNutricion("snack")}><span>🍓</span><h3>Meriendas</h3><p>Opciones fáciles para media tarde.</p></button>
              <button className="vf-nutrition-cat" onClick={()=>setSeccionNutricion("cena")}><span>🌙</span><h3>Cenas</h3><p>Opciones para terminar el día.</p></button>
            </div>
            <div className="vf-nutrition-plan-card"><div><div className="vf-card-kicker">TU ORGANIZACIÓN</div><h3>📅 Plan semanal</h3><p className="vf-muted">Organiza desayuno, comida, merienda y cena de lunes a domingo.</p></div><button className="vf-primary" onClick={()=>setSeccionNutricion("plan")}>ABRIR PLAN SEMANAL</button></div>
          </>}

          {["desayuno","comida","snack","cena"].includes(seccionNutricion) && <>
            <button className="vf-secondary vf-back-nutrition" onClick={()=>setSeccionNutricion("inicio")}>← VOLVER A NUTRICIÓN</button>
            <div className="vf-nutrition-hero"><div><div className="vf-eyebrow">NUTRICIÓN</div><h1>{seccionNutricion === "snack" ? "🍓 Meriendas" : seccionNutricion === "desayuno" ? "🍳 Desayunos" : seccionNutricion === "comida" ? "🍛 Comidas" : "🌙 Cenas"}</h1><p>{platosFiltradosNutricion.length} platos disponibles</p></div>{esAdminNutricion&&<button className="vf-primary" onClick={()=>{resetFormPlato();setFormPlato(f=>({...f,category:seccionNutricion as NutritionCategory}));setMostrarEditorPlato(true)}}>＋ NUEVO PLATO</button>}</div>
            <div className="vf-nutrition-toolbar"><input className="vf-text" placeholder="🔎 Buscar plato..." value={busquedaNutricion} onChange={e=>setBusquedaNutricion(e.target.value)}/><button className="vf-secondary" onClick={cargarNutricion}>↻ ACTUALIZAR</button></div>

            {mostrarEditorPlato && esAdminNutricion && <section className="vf-section-card"><div className="vf-toolbar" style={{justifyContent:"space-between"}}><div><span className="vf-admin-badge">ADMINISTRADOR</span><h2 style={{margin:"8px 0 0"}}>{editandoPlatoId?"Editar plato":"Crear plato"}</h2></div><button className="vf-secondary" onClick={()=>{setMostrarEditorPlato(false);resetFormPlato()}}>✕ CERRAR</button></div><div className="vf-nutrition-form"><div className="vf-nutrition-form-grid"><input className="vf-text" placeholder="Nombre del plato" value={formPlato.name} onChange={e=>setFormPlato(f=>({...f,name:e.target.value}))}/><select className="vf-text" value={formPlato.category} onChange={e=>setFormPlato(f=>({...f,category:e.target.value as NutritionCategory}))}><option value="desayuno">Desayuno</option><option value="comida">Comida</option><option value="snack">Merienda</option><option value="cena">Cena</option></select><input className="vf-text" type="number" placeholder="kcal" value={formPlato.calories} onChange={e=>setFormPlato(f=>({...f,calories:e.target.value}))}/><input className="vf-text" type="number" placeholder="Proteína g" value={formPlato.protein} onChange={e=>setFormPlato(f=>({...f,protein:e.target.value}))}/><input className="vf-text" type="number" placeholder="Carbos g" value={formPlato.carbs} onChange={e=>setFormPlato(f=>({...f,carbs:e.target.value}))}/></div><div className="vf-nutrition-form-grid" style={{gridTemplateColumns:"1fr 2fr 1fr"}}><input className="vf-text" type="number" placeholder="Grasas g" value={formPlato.fats} onChange={e=>setFormPlato(f=>({...f,fats:e.target.value}))}/><input className="vf-text" placeholder="Descripción" value={formPlato.description} onChange={e=>setFormPlato(f=>({...f,description:e.target.value}))}/><label className="vf-text" style={{display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={formPlato.published} onChange={e=>setFormPlato(f=>({...f,published:e.target.checked}))}/> Publicado</label></div><label className="vf-muted">Foto del plato<input className="vf-text" style={{display:"block",width:"100%",marginTop:6}} type="file" accept="image/*" onChange={e=>setArchivoNutricion(e.target.files?.[0]??null)}/></label><textarea className="vf-text" placeholder={'Ingredientes: una línea por ingrediente. Ejemplo:\n60 g | Avena\n200 ml | Leche'} value={formPlato.ingredients} onChange={e=>setFormPlato(f=>({...f,ingredients:e.target.value}))}/><textarea className="vf-text" placeholder="Preparación paso a paso..." value={formPlato.preparation} onChange={e=>setFormPlato(f=>({...f,preparation:e.target.value}))}/><button className="vf-primary" disabled={cargandoNutricion} onClick={guardarPlatoNutricion}>{cargandoNutricion?"GUARDANDO...":editandoPlatoId?"GUARDAR CAMBIOS":"PUBLICAR PLATO"}</button></div></section>}

            {platoParaPlan && <div className="vf-plan-modal"><strong>📅 Añadir “{platoParaPlan.name}” al plan</strong><div className="vf-plan-modal-grid"><label className="vf-muted">Día<input className="vf-text" type="date" value={fechaPlanNutricion} onChange={e=>setFechaPlanNutricion(e.target.value)}/></label><label className="vf-muted">Momento<select className="vf-text" value={tipoPlanNutricion} onChange={e=>setTipoPlanNutricion(e.target.value as NutritionCategory)}><option value="desayuno">Desayuno</option><option value="comida">Comida</option><option value="snack">Merienda</option><option value="cena">Cena</option></select></label><div className="vf-meal-actions"><button className="vf-primary" onClick={añadirPlatoAlPlan}>AÑADIR</button><button className="vf-secondary" onClick={()=>setPlatoParaPlan(null)}>CANCELAR</button></div></div></div>}

            {cargandoNutricion && <div className="vf-section-card">Cargando Nutrición...</div>}
            {!cargandoNutricion && <div className="vf-nutrition-grid">{platosFiltradosNutricion.map(m=><article className={`vf-meal-card ${!m.published?"vf-unpublished":""}`} key={m.id}>{m.image_url?<img className="vf-meal-image" src={m.image_url} alt={m.name}/>:<div className="vf-meal-placeholder">🍽️</div>}<div className="vf-meal-body"><div style={{display:"flex",justifyContent:"space-between",gap:8}}><div><h3>{m.name}</h3>{m.description&&<div className="vf-muted">{m.description}</div>}</div>{!m.published&&<span className="vf-publish-chip">BORRADOR</span>}</div><div className="vf-meal-macros"><div><strong>{m.calories}</strong><small>KCAL</small></div><div><strong>{m.protein}g</strong><small>PROTEÍNA</small></div><div><strong>{m.carbs}g</strong><small>CARBOS</small></div><div><strong>{m.fats}g</strong><small>GRASAS</small></div></div><div className="vf-meal-actions"><button className="vf-primary" onClick={()=>prepararAñadirPlan(m)}>＋ AÑADIR AL PLAN</button><button className="vf-secondary" onClick={()=>setPlatoAbiertoId(platoAbiertoId===m.id?null:m.id)}>{platoAbiertoId===m.id?"OCULTAR":"VER RECETA"}</button>{esAdminNutricion&&<><button className="vf-secondary" onClick={()=>editarPlatoNutricion(m)}>✏️</button><button className="vf-danger" onClick={()=>borrarPlatoNutricion(m)}>🗑️</button></>}</div>{platoAbiertoId===m.id&&<div className="vf-meal-detail"><h4>Ingredientes</h4>{m.ingredients?.length?<ul>{m.ingredients.map((i,idx)=><li key={idx}>{i.cantidad&&<strong>{i.cantidad} · </strong>}{i.nombre}</li>)}</ul>:<div className="vf-muted">Sin ingredientes añadidos.</div>}<h4>Preparación</h4><div className="vf-meal-prep">{m.preparation||"Sin preparación añadida."}</div></div>}</div></article>)}</div>}
            {!cargandoNutricion && !platosFiltradosNutricion.length && <div className="vf-section-card">Todavía no hay platos publicados en esta categoría.</div>}
          </>}

          {seccionNutricion === "proponer" && <>
            <button className="vf-secondary vf-back-nutrition" onClick={()=>setSeccionNutricion("inicio")}>← VOLVER A NUTRICIÓN</button>
            <div className="vf-nutrition-hero"><div><div className="vf-eyebrow">COMUNIDAD VITORFIT</div><h1>＋ Proponer plato</h1><p>Tu propuesta no se publica automáticamente. Primero la revisará el administrador.</p></div></div>
            <section className="vf-section-card">
              <div className="vf-nutrition-form">
                <div className="vf-nutrition-form-grid">
                  <input className="vf-text" placeholder="Tu nombre visible (ej. Vitor123)" value={nombreAutorPropuesta} onChange={e=>setNombreAutorPropuesta(e.target.value)}/>
                  <input className="vf-text" placeholder="Nombre del plato" value={formPlato.name} onChange={e=>setFormPlato(f=>({...f,name:e.target.value}))}/>
                  <select className="vf-text" value={formPlato.category} onChange={e=>setFormPlato(f=>({...f,category:e.target.value as NutritionCategory}))}><option value="desayuno">Desayuno</option><option value="comida">Comida</option><option value="snack">Merienda</option><option value="cena">Cena</option></select>
                  <input className="vf-text" type="number" placeholder="kcal" value={formPlato.calories} onChange={e=>setFormPlato(f=>({...f,calories:e.target.value}))}/>
                  <input className="vf-text" type="number" placeholder="Proteína g" value={formPlato.protein} onChange={e=>setFormPlato(f=>({...f,protein:e.target.value}))}/>
                  <input className="vf-text" type="number" placeholder="Carbos g" value={formPlato.carbs} onChange={e=>setFormPlato(f=>({...f,carbs:e.target.value}))}/>
                  <input className="vf-text" type="number" placeholder="Grasas g" value={formPlato.fats} onChange={e=>setFormPlato(f=>({...f,fats:e.target.value}))}/>
                </div>
                <input className="vf-text" placeholder="Descripción" value={formPlato.description} onChange={e=>setFormPlato(f=>({...f,description:e.target.value}))}/>
                <label className="vf-muted">Foto del plato<input className="vf-text" style={{display:"block",width:"100%",marginTop:6}} type="file" accept="image/*" onChange={e=>setArchivoNutricion(e.target.files?.[0]??null)}/></label>
                <textarea className="vf-text" placeholder={'Ingredientes: una línea por ingrediente. Ejemplo:\n60 g | Avena\n200 ml | Leche'} value={formPlato.ingredients} onChange={e=>setFormPlato(f=>({...f,ingredients:e.target.value}))}/>
                <textarea className="vf-text" placeholder="Preparación paso a paso..." value={formPlato.preparation} onChange={e=>setFormPlato(f=>({...f,preparation:e.target.value}))}/>
                <button className="vf-primary" disabled={guardandoPropuesta} onClick={enviarPropuestaPlato}>{guardandoPropuesta?"ENVIANDO...":"📨 ENVIAR PARA REVISIÓN"}</button>
              </div>
            </section>
          </>}

          {seccionNutricion === "pendientes" && esAdminNutricion && <>
            <button className="vf-secondary vf-back-nutrition" onClick={()=>setSeccionNutricion("inicio")}>← VOLVER A NUTRICIÓN</button>
            <div className="vf-nutrition-hero"><div><div className="vf-eyebrow">ADMINISTRADOR</div><h1>🔔 Solicitudes pendientes ({propuestasPendientes.length})</h1><p>Revisa cada plato antes de publicarlo para todos.</p></div></div>
            {!propuestasPendientes.length && <div className="vf-section-card">No hay propuestas pendientes.</div>}
            <div className="vf-nutrition-grid">{propuestasPendientes.map(m=><article className="vf-meal-card" key={m.id}>
              {m.image_url?<img className="vf-meal-image" src={m.image_url} alt={m.name}/>:<div className="vf-meal-placeholder">🍽️</div>}
              <div className="vf-meal-body">
                <span className="vf-publish-chip">PENDIENTE</span>
                <h3>{m.name}</h3>
                <div className="vf-muted">👤 Propuesto por {m.author_name || "Usuario"} · {NUTRITION_LABELS[m.category]}</div>
                {m.description&&<p>{m.description}</p>}
                <div className="vf-meal-macros"><div><strong>{m.calories}</strong><small>KCAL</small></div><div><strong>{m.protein}g</strong><small>PROTEÍNA</small></div><div><strong>{m.carbs}g</strong><small>CARBOS</small></div><div><strong>{m.fats}g</strong><small>GRASAS</small></div></div>
                <div className="vf-meal-detail"><h4>Ingredientes</h4>{m.ingredients?.length?<ul>{m.ingredients.map((i,idx)=><li key={idx}>{i.cantidad&&<strong>{i.cantidad} · </strong>}{i.nombre}</li>)}</ul>:<div className="vf-muted">Sin ingredientes.</div>}<h4>Preparación</h4><div className="vf-meal-prep">{m.preparation||"Sin preparación."}</div></div>
                <div className="vf-meal-actions">
                  <button className="vf-primary" onClick={()=>revisarPropuesta(m,"published")}>✅ APROBAR</button>
                  <button className="vf-danger" onClick={()=>revisarPropuesta(m,"rejected")}>❌ RECHAZAR</button>
                  <button className="vf-secondary" onClick={()=>editarPlatoNutricion(m)}>✏️ EDITAR</button>
                </div>
              </div>
            </article>)}</div>
          </>}

          {seccionNutricion === "plan" && <>
            <button className="vf-secondary vf-back-nutrition" onClick={()=>setSeccionNutricion("inicio")}>← VOLVER A NUTRICIÓN</button>
            <div className="vf-nutrition-hero"><div><div className="vf-eyebrow">NUTRICIÓN</div><h1>📅 Plan semanal</h1><p>Tu planificación personal. Solo tú puedes verla y modificarla.</p></div></div>
            <div className="vf-week-plan-head"><button className="vf-secondary" onClick={()=>moverSemanaNutricion(-1)}>‹ SEMANA ANTERIOR</button><div>{semanaNutricion.toLocaleDateString("es-ES",{day:"2-digit",month:"long"})} — {diasSemanaNutricion[6].toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"})}</div><button className="vf-secondary" onClick={()=>moverSemanaNutricion(1)}>SEMANA SIGUIENTE ›</button></div>
            <div className="vf-meal-week">{diasSemanaNutricion.map((d)=>{const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;return <section className="vf-meal-day" key={k}><h4>{d.toLocaleDateString("es-ES",{weekday:"long"})}<span>{d.toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit"})}</span></h4>{(["desayuno","comida","snack","cena"] as NutritionCategory[]).map(tipo=>{const items=planNutricion.filter(e=>e.plan_date===k&&e.meal_type===tipo);return <div className="vf-meal-slot" key={tipo}><small>{NUTRITION_LABELS[tipo].toUpperCase()}</small>{items.map(item=><div className="vf-plan-item" key={item.id}><span>{item.nutrition_meals?.name??"Plato"}</span><button onClick={()=>quitarDelPlan(item.id)}>✕</button></div>)}{!items.length&&<div className="vf-muted" style={{fontSize:8,marginTop:4}}>—</div>}</div>})}</section>})}</div>
          </>}
        </>}

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
          {fechaEditCalendario&&calendario[fechaEditCalendario]&&(()=>{
            const entrada=calendario[fechaEditCalendario];
            const rutPlan=rutinas.find(r=>r.id===entrada.rutinaId);
            const diaPlan=rutPlan?.dias?.[entrada.diaIndex];
            return <div className="vf-calendar-editor-overlay" onClick={()=>setFechaEditCalendario(null)}>
              <div className="vf-calendar-editor" onClick={e=>e.stopPropagation()}>
                <div className="vf-calendar-editor-head">
                  <div>
                    <div className="vf-eyebrow">CORREGIR CALENDARIO</div>
                    <strong>✏️ ¿Qué entrenaste realmente el {fechaEditCalendario}?</strong>
                  </div>
                  <button className="vf-calendar-editor-close" onClick={()=>setFechaEditCalendario(null)}>✕</button>
                </div>
                <div className="vf-calendar-editor-plan">
                  <b>PLANIFICADO:</b> {diaPlan?.subtitulo??diaPlan?.titulo??"Sin planificación"}<br/>
                  <span>Elige abajo lo que hiciste de verdad. Tus kg, reps, RIR e historial no se modifican.</span>
                </div>
                <div className="vf-calendar-editor-grid">
                  <label className="vf-muted">Rutina realizada
                    <select className="vf-text" value={rutinaRealizadaId} onChange={e=>{setRutinaRealizadaId(e.target.value);setDiaRealizadoIndex(0)}}>
                      {rutinas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </label>
                  <label className="vf-muted">Entrenamiento realizado
                    <select className="vf-text" value={diaRealizadoIndex} onChange={e=>setDiaRealizadoIndex(Number(e.target.value))}>
                      {(rutinas.find(r=>r.id===rutinaRealizadaId)?.dias??[]).map((d,i)=><option key={d.id} value={i}>{d.titulo} · {d.subtitulo}</option>)}
                    </select>
                  </label>
                </div>
                <div className="vf-calendar-editor-actions">
                  <button className="vf-primary" onClick={guardarRealizadoCalendario}>✅ GUARDAR LO REALIZADO</button>
                  <button className="vf-secondary" onClick={quitarRealizadoCalendario}>↩️ DEJAR LO PLANIFICADO</button>
                </div>
              </div>
            </div>
          })()}
          <div className="vf-calendar-week">{["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map(x=><div key={x}>{x}</div>)}</div>
          <div className="vf-calendar-grid">
            {diasDelMes.map((fecha,i)=>{
              if(!fecha)return <div className="vf-cal-day empty" key={`e-${i}`}/>;
              const k=claveFecha(fecha), entry=calendario[k];
              const rut=entry?rutinas.find(r=>r.id===entry.rutinaId):null;
              const dia=entry?rut?.dias?.[entry.diaIndex]:null;
              const rutReal=entry?.realizadoRutinaId?rutinas.find(r=>r.id===entry.realizadoRutinaId):null;
              const diaReal=entry?.realizadoRutinaId?rutReal?.dias?.[entry.realizadoDiaIndex??0]:null;
              const hoy=claveFecha(new Date())===k;
              return <div key={k} className={`vf-cal-day ${entry?(entry.completado?"done":"planned"):""} ${hoy?"today":""}`} onClick={()=>planificarFecha(fecha)}>
                <div className="vf-cal-num">{fecha.getDate()}</div>
                {entry?.completado&&<span className="vf-done-tick" title="Entrenamiento completado">✓</span>}
                {entry&&<><div className={`vf-cal-badge ${entry.completado?"vf-cal-done":""}`}>{entry.completado?"COMPLETADO":"🏋️ PLANIFICADO"}<br/>{diaReal?`REAL: ${diaReal.subtitulo}`:(dia?.subtitulo??rut?.nombre??"Rutina")}</div><button className="vf-cal-open" onClick={e=>{e.stopPropagation();abrirEntrenoCalendario(entry)}}>▶ ENTRENAR</button><button className="vf-cal-open" onClick={e=>{e.stopPropagation();abrirEditorCalendario(fecha,entry)}}>✏️ EDITAR</button></>}
                <button className={`vf-creatine-day ${creatina[k]?"taken":""}`} onClick={e=>{e.stopPropagation();toggleCreatinaFecha(fecha)}}>{creatina[k]?<><span className="vf-creatine-check">✓</span> CREATINA TOMADA</>:<>💊 CREATINA</>}</button>
              </div>;
            })}
          </div>
        </>}

        {vista === "ajustes" && (
          <>
            <h1 className="vf-page-title">⚙ AJUSTES</h1>
            <div className="vf-settings-grid">
              <section className="vf-section-card">
                <h2 className="vf-settings-title">⏱️ DESCANSO PREDETERMINADO</h2>
                <p className="vf-muted">Elige el tiempo que aparecerá por defecto. Si un ejercicio tiene un descanso propio, VitorFit respetará ese tiempo.</p>
                <div className="vf-rest-options">
                  {[90,120,150,180].map((seg)=><button key={seg} className={`vf-rest-choice ${ajustes.descanso===seg?"active":""}`} onClick={()=>setAjustes(a=>({...a,descanso:seg}))}>{seg===90?"1:30":seg===120?"2:00":seg===150?"2:30":"3:00"}</button>)}
                </div>
                <div className="vf-settings-note">Recomendación práctica: puedes dejar 2:30–3:00 para ejercicios compuestos y asignar menos tiempo individualmente a ejercicios aislados desde Rutinas.</div>
              </section>

              <section className="vf-section-card">
                <h2 className="vf-settings-title">🏋️ ENTRENAMIENTO</h2>
                <div className="vf-toggle-row"><div><strong>Comparar con última sesión</strong><div className="vf-muted">Muestra si mejoras peso o repeticiones.</div></div><button className={`vf-toggle ${ajustes.mostrarComparacion?"on":""}`} onClick={()=>setAjustes(a=>({...a,mostrarComparacion:!a.mostrarComparacion}))}>{ajustes.mostrarComparacion?"ACTIVADO":"DESACTIVADO"}</button></div>
                <div className="vf-toggle-row"><div><strong>Mostrar RIR</strong><div className="vf-muted">Mantiene visible el objetivo de repeticiones en reserva.</div></div><button className={`vf-toggle ${ajustes.mostrarRir?"on":""}`} onClick={()=>setAjustes(a=>({...a,mostrarRir:!a.mostrarRir}))}>{ajustes.mostrarRir?"ACTIVADO":"DESACTIVADO"}</button></div>
              </section>
            </div>

            <section className="vf-section-card">
              <h2 className="vf-settings-title">👤 CUENTA</h2>
              <p className="vf-muted">Tu sesión y tus datos de VitorFit están asociados a tu usuario.</p>
              <button onClick={cerrarSesion} style={{width:"100%",padding:"14px",marginTop:"16px",borderRadius:"12px",border:"1px solid #D94B55",background:"#1a0b16",color:"#E8878E",fontWeight:900,cursor:"pointer"}}>🚪 CERRAR SESIÓN</button>
            </section>
          </>
        )}
      </div>
        
        </div>
      {mensaje&&<div className="vf-message" onClick={()=>setMensaje("")}>{mensaje}</div>}
      <nav className="vf-bottom">
        <button className={`vf-nav ${vista==="inicio"?"active":""}`} onClick={()=>setVista("inicio")}><span>⌂</span>INICIO</button>
        <button className={`vf-nav ${vista==="entreno"?"active":""}`} onClick={abrirEntrenamiento}><span>🏋️</span>ENTRENO</button>
        <button className={`vf-nav ${vista==="historial"?"active":""}`} onClick={()=>setVista("historial")}><span>🕘</span>HISTORIAL</button>
        <button className={`vf-nav ${vista==="progreso"?"active":""}`} onClick={()=>setVista("progreso")}><span>📈</span>PROGRESO</button>
        <button className={`vf-nav ${vista==="rutinas"?"active":""}`} onClick={()=>setVista("rutinas")}><span>📋</span>RUTINAS</button>
        <button className={`vf-nav ${vista==="biblioteca"?"active":""}`} onClick={()=>{setTargetBiblioteca(null);setVista("biblioteca")}}><span>📚</span>BIBLIOTECA</button>
        <button className={`vf-nav ${vista==="nutricion"?"active":""}`} onClick={()=>abrirNutricion("inicio")}><span>🍽️</span>NUTRICIÓN</button>
        <button className={`vf-nav ${vista==="calendario"?"active":""}`} onClick={()=>setVista("calendario")}><span>📅</span>CALENDARIO</button>
        <button className={`vf-nav ${vista==="ajustes"?"active":""}`} onClick={()=>setVista("ajustes")}><span>⚙️</span>AJUSTES</button>
      </nav>
    </main>
  );
}
