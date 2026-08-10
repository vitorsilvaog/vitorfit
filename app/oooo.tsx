"use client";

import { useEffect, useMemo, useState } from "react";

type Serie = {
  kg: string;
  reps: string;
  rir: string;
};

type Registro = {
  fecha: string;
  nombre: string;
  variante: string;
  patron: string;
  series: Serie[];
};

type Variante = {
  nombre: string;
  etiqueta: string;
};

type Ejercicio = {
  id: string;
  nombre: string;
  musculo: string;
  patron: string;
  series: number;
  reps: string;
  rir: string;
  icono: string;
  alternativas: Variante[];
};

type DiaRutina = {
  id: number;
  titulo: string;
  subtitulo: string;
  ejercicios: Ejercicio[];
};

type HistorialV2 = Record<string, Registro[]>;
type RegistrosV2 = Record<string, Serie[]>;
type VariantesV2 = Record<string, string>;

type Ajustes = {
  descanso: number;
  mostrarComparacion: boolean;
  mostrarRir: boolean;
};

const seriesVacias = (cantidad: number): Serie[] =>
  Array.from({ length: cantidad }, () => ({ kg: "", reps: "", rir: "" }));

const rutinas: DiaRutina[] = [
  {
    id: 1,
    titulo: "DÍA 1",
    subtitulo: "Pecho · Tríceps · Hombro",
    ejercicios: [
      {
        id: "d1-press-inclinado",
        nombre: "Press Inclinado",
        musculo: "Pecho superior",
        patron: "Empuje inclinado",
        series: 3,
        reps: "8-10",
        rir: "1-2",
        icono: "🏋️",
        alternativas: [
          { nombre: "Press Inclinado", etiqueta: "Principal" },
          { nombre: "Press Inclinado Multipower", etiqueta: "Mismo patrón" },
          { nombre: "Press Inclinado Mancuernas", etiqueta: "Mismo patrón" },
          { nombre: "Press Inclinado Máquina", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-press-plano",
        nombre: "Press Plano con Mancuernas",
        musculo: "Pecho",
        patron: "Empuje horizontal",
        series: 3,
        reps: "8-10",
        rir: "1-2",
        icono: "💪",
        alternativas: [
          { nombre: "Press Plano con Mancuernas", etiqueta: "Principal" },
          { nombre: "Press Banca", etiqueta: "Mismo patrón" },
          { nombre: "Press Pecho Máquina", etiqueta: "Mismo patrón" },
          { nombre: "Press Plano Multipower", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-cruce-polea",
        nombre: "Cruce de Poleas",
        musculo: "Pecho",
        patron: "Aducción horizontal",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🎯",
        alternativas: [
          { nombre: "Cruce de Poleas", etiqueta: "Principal" },
          { nombre: "Pec Deck", etiqueta: "Mismo patrón" },
          { nombre: "Aperturas con Mancuernas", etiqueta: "Mismo patrón" },
          { nombre: "Cruce Polea Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-laterales",
        nombre: "Elevaciones Laterales",
        musculo: "Hombro lateral",
        patron: "Abducción de hombro",
        series: 3,
        reps: "12-20",
        rir: "1-2",
        icono: "🪽",
        alternativas: [
          { nombre: "Elevaciones Laterales", etiqueta: "Principal" },
          { nombre: "Elevación Lateral Polea", etiqueta: "Mismo patrón" },
          { nombre: "Elevación Lateral Máquina", etiqueta: "Mismo patrón" },
          { nombre: "Elevación Lateral Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-triceps-polea",
        nombre: "Tríceps Polea",
        musculo: "Tríceps",
        patron: "Extensión de codo",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🔥",
        alternativas: [
          { nombre: "Tríceps Polea", etiqueta: "Principal" },
          { nombre: "Tríceps Barra V", etiqueta: "Mismo patrón" },
          { nombre: "Tríceps Barra Recta", etiqueta: "Mismo patrón" },
          { nombre: "Tríceps Polea Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-triceps-overhead",
        nombre: "Tríceps Overhead",
        musculo: "Tríceps largo",
        patron: "Extensión de codo sobre cabeza",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "⚡",
        alternativas: [
          { nombre: "Tríceps Overhead", etiqueta: "Principal" },
          { nombre: "Extensión Overhead Cuerda", etiqueta: "Mismo patrón" },
          { nombre: "Extensión Mancuerna Sobre Cabeza", etiqueta: "Mismo patrón" },
          { nombre: "Extensión Francesa", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d1-press-hombro",
        nombre: "Press de Hombro",
        musculo: "Hombro",
        patron: "Empuje vertical",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🚀",
        alternativas: [
          { nombre: "Press de Hombro", etiqueta: "Principal" },
          { nombre: "Press Militar Multipower", etiqueta: "Mismo patrón" },
          { nombre: "Press Hombro Mancuernas", etiqueta: "Mismo patrón" },
          { nombre: "Press Hombro Máquina", etiqueta: "Mismo patrón" },
        ],
      },
    ],
  },
  {
    id: 2,
    titulo: "DÍA 2",
    subtitulo: "Espalda · Bíceps · Hombro posterior",
    ejercicios: [
      {
        id: "d2-jalon",
        nombre: "Jalón al Pecho",
        musculo: "Dorsal",
        patron: "Tracción vertical",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🧗",
        alternativas: [
          { nombre: "Jalón al Pecho", etiqueta: "Principal" },
          { nombre: "Dominadas Asistidas", etiqueta: "Mismo patrón" },
          { nombre: "Jalón Neutro", etiqueta: "Mismo patrón" },
          { nombre: "Jalón Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-remo-t",
        nombre: "Remo T",
        musculo: "Espalda media",
        patron: "Tracción horizontal",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🚣",
        alternativas: [
          { nombre: "Remo T", etiqueta: "Principal" },
          { nombre: "Remo Máquina", etiqueta: "Mismo patrón" },
          { nombre: "Remo Pecho Apoyado", etiqueta: "Mismo patrón" },
          { nombre: "Remo Barra", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-remo-unilateral",
        nombre: "Remo Cable 1 Mano",
        musculo: "Dorsal",
        patron: "Tracción horizontal unilateral",
        series: 3,
        reps: "10-12",
        rir: "1-2",
        icono: "🎣",
        alternativas: [
          { nombre: "Remo Cable 1 Mano", etiqueta: "Principal" },
          { nombre: "Remo Mancuerna 1 Mano", etiqueta: "Mismo patrón" },
          { nombre: "Remo Máquina Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-jalon-rectos",
        nombre: "Jalón Brazos Rectos",
        musculo: "Dorsal",
        patron: "Extensión de hombro",
        series: 3,
        reps: "12-15",
        rir: "1-2",
        icono: "🏹",
        alternativas: [
          { nombre: "Jalón Brazos Rectos", etiqueta: "Principal" },
          { nombre: "Pullover Polea", etiqueta: "Mismo patrón" },
          { nombre: "Pullover Máquina", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-curl-inclinado",
        nombre: "Curl Inclinado",
        musculo: "Bíceps",
        patron: "Flexión de codo en extensión de hombro",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "💪",
        alternativas: [
          { nombre: "Curl Inclinado", etiqueta: "Principal" },
          { nombre: "Curl Bayesiano", etiqueta: "Mismo patrón" },
          { nombre: "Curl Polea Atrás", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-curl-predicador",
        nombre: "Curl Predicador",
        musculo: "Bíceps",
        patron: "Flexión de codo con hombro flexionado",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🦾",
        alternativas: [
          { nombre: "Curl Predicador", etiqueta: "Principal" },
          { nombre: "Curl Scott Máquina", etiqueta: "Mismo patrón" },
          { nombre: "Curl Concentrado", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d2-posterior",
        nombre: "Pájaros / Reverse Fly",
        musculo: "Hombro posterior",
        patron: "Abducción horizontal",
        series: 3,
        reps: "12-20",
        rir: "1-2",
        icono: "🪽",
        alternativas: [
          { nombre: "Pájaros / Reverse Fly", etiqueta: "Principal" },
          { nombre: "Reverse Pec Deck", etiqueta: "Mismo patrón" },
          { nombre: "Face Pull", etiqueta: "Mismo patrón" },
        ],
      },
    ],
  },
  {
    id: 3,
    titulo: "DÍA 3",
    subtitulo: "Cuádriceps · Gemelo · Abdomen",
    ejercicios: [
      {
        id: "d3-hack",
        nombre: "Sentadilla Hack",
        musculo: "Cuádriceps",
        patron: "Dominante de rodilla",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🦵",
        alternativas: [
          { nombre: "Sentadilla Hack", etiqueta: "Principal" },
          { nombre: "Prensa", etiqueta: "Mismo patrón" },
          { nombre: "Sentadilla Multipower", etiqueta: "Mismo patrón" },
          { nombre: "Búlgara", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d3-prensa",
        nombre: "Prensa",
        musculo: "Cuádriceps",
        patron: "Dominante de rodilla",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🦿",
        alternativas: [
          { nombre: "Prensa", etiqueta: "Principal" },
          { nombre: "Hack", etiqueta: "Mismo patrón" },
          { nombre: "Búlgara", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d3-extension",
        nombre: "Extensión de Cuádriceps",
        musculo: "Cuádriceps",
        patron: "Extensión de rodilla",
        series: 3,
        reps: "12-15",
        rir: "1-2",
        icono: "⚙️",
        alternativas: [
          { nombre: "Extensión de Cuádriceps", etiqueta: "Principal" },
          { nombre: "Extensión Unilateral", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d3-aductor",
        nombre: "Aductor Máquina",
        musculo: "Aductores",
        patron: "Aducción de cadera",
        series: 3,
        reps: "12-20",
        rir: "1-2",
        icono: "🧲",
        alternativas: [
          { nombre: "Aductor Máquina", etiqueta: "Principal" },
          { nombre: "Aducción Polea", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d3-gemelo",
        nombre: "Gemelo",
        musculo: "Pantorrilla",
        patron: "Flexión plantar",
        series: 3,
        reps: "10-20",
        rir: "1-2",
        icono: "🦶",
        alternativas: [
          { nombre: "Gemelo", etiqueta: "Principal" },
          { nombre: "Gemelo Prensa", etiqueta: "Mismo patrón" },
          { nombre: "Gemelo Sentado", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d3-crunch",
        nombre: "Crunch Cable",
        musculo: "Abdomen",
        patron: "Flexión de tronco",
        series: 3,
        reps: "10-20",
        rir: "1-2",
        icono: "🧱",
        alternativas: [
          { nombre: "Crunch Cable", etiqueta: "Principal" },
          { nombre: "Crunch Declinado", etiqueta: "Mismo patrón" },
          { nombre: "Crunch Máquina", etiqueta: "Mismo patrón" },
        ],
      },
    ],
  },
  {
    id: 4,
    titulo: "DÍA 4",
    subtitulo: "Femoral · Glúteo · Abdomen",
    ejercicios: [
      {
        id: "d4-rdl",
        nombre: "Peso Muerto Piernas Rígidas",
        musculo: "Femoral",
        patron: "Bisagra de cadera",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🏗️",
        alternativas: [
          { nombre: "Peso Muerto Piernas Rígidas", etiqueta: "Principal" },
          { nombre: "Peso Muerto Rumano", etiqueta: "Mismo patrón" },
          { nombre: "Buenos Días Multipower", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d4-curl-femoral",
        nombre: "Curl Femoral",
        musculo: "Femoral",
        patron: "Flexión de rodilla",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🪢",
        alternativas: [
          { nombre: "Curl Femoral", etiqueta: "Principal" },
          { nombre: "Curl Femoral Sentado", etiqueta: "Mismo patrón" },
          { nombre: "Curl Femoral Tumbado", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d4-hip-thrust",
        nombre: "Hip Thrust",
        musculo: "Glúteo",
        patron: "Extensión de cadera",
        series: 3,
        reps: "8-12",
        rir: "1-2",
        icono: "🍑",
        alternativas: [
          { nombre: "Hip Thrust", etiqueta: "Principal" },
          { nombre: "Hip Thrust Máquina", etiqueta: "Mismo patrón" },
          { nombre: "Glute Bridge", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d4-abductor",
        nombre: "Abductor Máquina",
        musculo: "Glúteo medio",
        patron: "Abducción de cadera",
        series: 3,
        reps: "12-20",
        rir: "1-2",
        icono: "↔️",
        alternativas: [
          { nombre: "Abductor Máquina", etiqueta: "Principal" },
          { nombre: "Abducción Polea", etiqueta: "Mismo patrón" },
          { nombre: "Abducción Banda", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d4-extension-cadera",
        nombre: "Extensión de Cadera",
        musculo: "Glúteo",
        patron: "Extensión de cadera unilateral",
        series: 3,
        reps: "10-15",
        rir: "1-2",
        icono: "🎯",
        alternativas: [
          { nombre: "Extensión de Cadera", etiqueta: "Principal" },
          { nombre: "Patada Glúteo Polea", etiqueta: "Mismo patrón" },
          { nombre: "Patada Glúteo Máquina", etiqueta: "Mismo patrón" },
        ],
      },
      {
        id: "d4-abdomen",
        nombre: "Crunch Cable",
        musculo: "Abdomen",
        patron: "Flexión de tronco",
        series: 3,
        reps: "10-20",
        rir: "1-2",
        icono: "🧱",
        alternativas: [
          { nombre: "Crunch Cable", etiqueta: "Principal" },
          { nombre: "Crunch Declinado", etiqueta: "Mismo patrón" },
          { nombre: "Crunch Máquina", etiqueta: "Mismo patrón" },
        ],
      },
    ],
  },
];

const keyRegistros = "vitorfit-registros-v2";
const keyHistorial = "vitorfit-historial-v2";
const keyVariantes = "vitorfit-variantes-v2";
const keyAjustes = "vitorfit-ajustes-v2";

export default function Entrenamiento() {
  const [diaActual, setDiaActual] = useState(1);
  const [vista, setVista] = useState<"entreno" | "historial" | "progreso" | "rutinas" | "ajustes">("entreno");
  const [registros, setRegistros] = useState<RegistrosV2>({});
  const [historial, setHistorial] = useState<HistorialV2>({});
  const [variantes, setVariantes] = useState<VariantesV2>({});
  const [alternativasAbiertas, setAlternativasAbiertas] = useState<Record<string, boolean>>({});
  const [inicioEntreno] = useState(() => Date.now());
  const [segundos, setSegundos] = useState(0);
  const [descansoRestante, setDescansoRestante] = useState(0);
  const [ajustes, setAjustes] = useState<Ajustes>({
    descanso: 90,
    mostrarComparacion: true,
    mostrarRir: true,
  });
  const [mensaje, setMensaje] = useState("");

  const rutina = rutinas.find((r) => r.id === diaActual) ?? rutinas[0];

  useEffect(() => {
    const t = window.setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicioEntreno) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, [inicioEntreno]);

  useEffect(() => {
    if (descansoRestante <= 0) return;
    const t = window.setInterval(() => {
      setDescansoRestante((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [descansoRestante]);

  useEffect(() => {
    try {
      const r = localStorage.getItem(keyRegistros);
      const h = localStorage.getItem(keyHistorial);
      const v = localStorage.getItem(keyVariantes);
      const a = localStorage.getItem(keyAjustes);

      if (r) setRegistros(JSON.parse(r));
      if (h) {
        setHistorial(JSON.parse(h));
      } else {
        // Migración del historial antiguo para no perder lo que ya tenías.
        const antiguo = localStorage.getItem("vitorfit-historial");
        if (antiguo) {
          const parsed = JSON.parse(antiguo) as Record<string, Array<{ fecha: string; nombre?: string; series: Serie[] }>>;
          const migrado: HistorialV2 = {};
          rutinas[0].ejercicios.forEach((ej, index) => {
            const regs = parsed[String(index)] ?? [];
            if (regs.length) {
              migrado[ej.id] = regs.map((x) => ({
                fecha: x.fecha,
                nombre: x.nombre ?? ej.nombre,
                variante: x.nombre ?? ej.nombre,
                patron: ej.patron,
                series: x.series,
              }));
            }
          });
          setHistorial(migrado);
          localStorage.setItem(keyHistorial, JSON.stringify(migrado));
        }
      }
      if (v) setVariantes(JSON.parse(v));
      if (a) setAjustes(JSON.parse(a));

      if (!r) {
        const antiguoRegistros = localStorage.getItem("vitorfit-registros");
        if (antiguoRegistros) {
          const parsed = JSON.parse(antiguoRegistros) as Record<string, Serie[]>;
          const migrado: RegistrosV2 = {};
          rutinas[0].ejercicios.forEach((ej, index) => {
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

  useEffect(() => {
    localStorage.setItem(keyRegistros, JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem(keyVariantes, JSON.stringify(variantes));
  }, [variantes]);

  useEffect(() => {
    localStorage.setItem(keyAjustes, JSON.stringify(ajustes));
  }, [ajustes]);

  const nombreVariante = (ej: Ejercicio) => variantes[ej.id] || ej.nombre;

  const claveRegistro = (ej: Ejercicio) => ej.id;

  const ultimoRegistro = (ej: Ejercicio) => {
    const lista = historial[ej.id] ?? [];
    const actual = nombreVariante(ej);
    const mismaVariante = [...lista].reverse().find((r) => r.variante === actual);
    return mismaVariante ?? lista[lista.length - 1] ?? null;
  };

  const setSerie = (ej: Ejercicio, serieIndex: number, campo: keyof Serie, valor: string) => {
    const key = claveRegistro(ej);
    const base = registros[key] ? [...registros[key]] : seriesVacias(ej.series);
    while (base.length < ej.series) base.push({ kg: "", reps: "", rir: "" });
    base[serieIndex] = { ...base[serieIndex], [campo]: valor };
    setRegistros((prev) => ({ ...prev, [key]: base }));
  };

  const compararSerie = (ej: Ejercicio, i: number) => {
    if (!ajustes.mostrarComparacion) return "";
    const ultimo = ultimoRegistro(ej);
    const actual = registros[claveRegistro(ej)]?.[i];
    if (!ultimo || !actual || !actual.kg || !actual.reps) return "";
    if (ultimo.variante !== nombreVariante(ej)) return "🔁 Alternativa distinta: comparación de carga pausada";

    const anterior = ultimo.series[i];
    if (!anterior?.kg || !anterior?.reps) return "";
    const kgA = Number(anterior.kg);
    const repsA = Number(anterior.reps);
    const kgH = Number(actual.kg);
    const repsH = Number(actual.reps);

    if (kgH > kgA) return `🔥 +${kgH - kgA} KG`;
    if (kgH === kgA && repsH > repsA) return `📈 +${repsH - repsA} REPS`;
    if (kgH === kgA && repsH === repsA) return "✅ IGUAL QUE LA ÚLTIMA";
    if (kgH < kgA || repsH < repsA) return "🎯 SESIÓN REGISTRADA";
    return "";
  };

  const guardarEjercicio = (ej: Ejercicio) => {
    const series = registros[claveRegistro(ej)] ?? seriesVacias(ej.series);
    const tieneDatos = series.some((s) => s.kg || s.reps || s.rir);
    if (!tieneDatos) {
      setMensaje("Añade al menos una serie antes de guardar.");
      return;
    }

    const nuevo: Registro = {
      fecha: new Date().toLocaleString("es-ES"),
      nombre: ej.nombre,
      variante: nombreVariante(ej),
      patron: ej.patron,
      series,
    };

    const nuevoHistorial = {
      ...historial,
      [ej.id]: [...(historial[ej.id] ?? []), nuevo],
    };

    setHistorial(nuevoHistorial);
    localStorage.setItem(keyHistorial, JSON.stringify(nuevoHistorial));

    // Conserva compatibilidad con tu historial anterior en el Día 1.
    if (diaActual === 1) {
      const antiguoCrudo = localStorage.getItem("vitorfit-historial");
      const antiguo = antiguoCrudo ? JSON.parse(antiguoCrudo) : {};
      const indice = rutina.ejercicios.findIndex((x) => x.id === ej.id);
      antiguo[indice] = [...(antiguo[indice] ?? []), { fecha: nuevo.fecha, nombre: nuevo.variante, series }];
      localStorage.setItem("vitorfit-historial", JSON.stringify(antiguo));
    }

    setMensaje(`✅ ${nombreVariante(ej)} guardado en el historial`);
  };

  const completados = rutina.ejercicios.filter((ej) => {
    const s = registros[ej.id] ?? [];
    return s.length >= ej.series && s.slice(0, ej.series).every((x) => x.kg && x.reps);
  }).length;

  const seriesCompletadas = rutina.ejercicios.reduce((acc, ej) => {
    return acc + (registros[ej.id] ?? []).filter((x) => x.kg && x.reps).length;
  }, 0);

  const kcal = Math.max(0, Math.round((segundos / 60) * 6.2));

  const formatoTiempo = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const progreso = useMemo(() => {
    return rutinas.flatMap((dia) =>
      dia.ejercicios.map((ej) => {
        const lista = historial[ej.id] ?? [];
        let mejorKg = 0;
        let mejorE1rm = 0;
        let mejorTexto = "—";

        lista.forEach((reg) => {
          reg.series.forEach((s) => {
            const kg = Number(s.kg || 0);
            const reps = Number(s.reps || 0);
            if (kg > mejorKg) mejorKg = kg;
            if (kg > 0 && reps > 0) {
              const e1rm = kg * (1 + reps / 30);
              if (e1rm > mejorE1rm) {
                mejorE1rm = e1rm;
                mejorTexto = `${kg} kg × ${reps}`;
              }
            }
          });
        });

        const ultima = lista[lista.length - 1];
        const penultima = lista[lista.length - 2];
        let tendencia = "Sin datos";
        if (ultima && penultima) {
          const top = (r: Registro) => Math.max(0, ...r.series.map((s) => Number(s.kg || 0)));
          const diff = top(ultima) - top(penultima);
          tendencia = diff > 0 ? `+${diff} kg` : diff === 0 ? "Estable" : `${diff} kg`;
        } else if (ultima) tendencia = "1 sesión";

        return {
          dia: dia.titulo,
          nombre: ej.nombre,
          sesiones: lista.length,
          mejorKg,
          mejorE1rm,
          mejorTexto,
          tendencia,
        };
      })
    );
  }, [historial]);

  const cambiarDia = (delta: number) => {
    setDiaActual((d) => {
      const n = d + delta;
      if (n < 1) return rutinas.length;
      if (n > rutinas.length) return 1;
      return n;
    });
    setVista("entreno");
  };

  return (
    <main className="vf-app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #020713; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .vf-app {
          min-height: 100vh;
          color: #fff;
          font-family: Inter, Arial, sans-serif;
          background:
            radial-gradient(circle at 14% 4%, rgba(0,77,152,.28), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(165,0,68,.24), transparent 30%),
            linear-gradient(135deg, #020713 0%, #06152f 48%, #230013 100%);
          padding: 18px 16px 110px;
        }
        .vf-shell { width: min(100%, 980px); margin: 0 auto; }
        .vf-topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
          padding: 12px 4px 18px;
        }
        .vf-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .vf-logo { width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 0 12px rgba(246,195,68,.28)); }
        .vf-brand-title { font-size: 26px; font-weight: 1000; letter-spacing: .6px; line-height: 1; color: #F6C344; }
        .vf-brand-title span { color: #ff2656; }
        .vf-brand-sub { margin-top: 5px; color: #F6C344; font-size: 10px; font-weight: 800; letter-spacing: 1.1px; }
        .vf-day { display: flex; align-items: center; gap: 8px; }
        .vf-day button, .vf-icon-button {
          width: 42px; height: 42px; border-radius: 12px; border: 1px solid #1c6bb7; background: rgba(1,12,30,.88); color: #F6C344; font-size: 22px; cursor: pointer;
        }
        .vf-day-pill { min-width: 150px; text-align: center; padding: 12px 18px; border: 1px solid #3978b6; border-radius: 13px; color: #F6C344; font-weight: 900; background: rgba(2,11,28,.72); }
        .vf-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .vf-stats {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1.35fr;
          border: 1px solid #1b456f;
          border-radius: 18px;
          overflow: hidden;
          background: rgba(2,10,25,.72);
          margin-bottom: 22px;
        }
        .vf-stat { min-height: 132px; padding: 20px 12px; text-align: center; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
        .vf-stat + .vf-stat:before { content:""; position:absolute; left:0; top:26px; bottom:26px; width:1px; background:rgba(84,124,165,.4); }
        .vf-ring { width: 92px; height: 92px; border-radius: 50%; display:flex; align-items:center; justify-content:center; background: conic-gradient(#df1f4c calc(var(--progress) * 1%), #2463af 0 72%, #0d244b 0); position:relative; }
        .vf-ring:after { content:""; position:absolute; inset:9px; border-radius:50%; background:#071327; }
        .vf-ring-text { position:relative; z-index:1; font-weight:1000; font-size:24px; }
        .vf-stat-icon { font-size: 28px; margin-bottom: 8px; }
        .vf-stat-value { font-size: 24px; font-weight: 1000; }
        .vf-stat-label { color: #F6C344; font-size: 11px; font-weight: 900; letter-spacing:.6px; margin-top: 5px; }
        .vf-stat-sub { color: #c4cedd; font-size: 11px; line-height: 1.35; margin-top: 4px; }
        .vf-card {
          border: 1px solid rgba(234,28,75,.8);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(4,24,58,.96), rgba(9,18,38,.98) 58%, rgba(54,3,25,.96));
          margin-bottom: 18px;
          overflow: hidden;
          box-shadow: 0 16px 34px rgba(0,0,0,.22);
        }
        .vf-card-head { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:center; padding:16px 18px 12px; }
        .vf-num { width:50px; height:50px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:1000; color:#F6C344; background:linear-gradient(135deg,#6f002d,#a50044); border:1px solid #ff295d; box-shadow:0 0 18px rgba(165,0,68,.25); }
        .vf-title-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
        .vf-ex-title { font-size:23px; font-weight:1000; text-transform:uppercase; line-height:1.08; }
        .vf-tag { color:#ff3764; border:1px solid rgba(255,55,100,.55); background:rgba(165,0,68,.2); border-radius:7px; padding:5px 9px; font-size:10px; font-weight:1000; text-transform:uppercase; }
        .vf-prescription { margin-top:7px; color:#F6C344; font-size:13px; font-weight:700; }
        .vf-ex-icon { font-size:44px; min-width:56px; text-align:center; }
        .vf-alt-wrap { padding:0 18px 12px; }
        .vf-alt-button { width:100%; border:1px dashed rgba(246,195,68,.38); background:rgba(0,0,0,.18); color:#f2d77a; border-radius:10px; padding:9px 12px; cursor:pointer; font-weight:800; font-size:12px; }
        .vf-alt-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:8px; }
        .vf-alt-option { border:1px solid #284b73; background:#08172d; color:#dce7f4; padding:10px; border-radius:10px; cursor:pointer; text-align:left; font-size:12px; }
        .vf-alt-option.active { border-color:#F6C344; color:#F6C344; box-shadow:0 0 0 1px rgba(246,195,68,.18) inset; }
        .vf-compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 18px 14px; }
        .vf-panel { border-radius:14px; padding:14px; min-width:0; }
        .vf-panel.last { border:1px solid #1e72ca; background:rgba(3,21,46,.74); }
        .vf-panel.today { border:1px solid #e51b4e; background:rgba(19,8,24,.76); }
        .vf-panel-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; font-size:13px; font-weight:1000; color:#F6C344; }
        .vf-date { border:1px solid #1f5f9f; border-radius:8px; padding:5px 8px; color:#74b3ff; font-size:10px; white-space:nowrap; }
        .vf-series-row { display:grid; grid-template-columns:36px repeat(3,minmax(0,1fr)); gap:8px; align-items:center; margin-bottom:9px; }
        .vf-slabel { color:#438cff; font-weight:1000; font-size:16px; }
        .vf-box { min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:1px solid #36587c; background:#081426; border-radius:9px; text-align:center; }
        .vf-box strong { font-size:18px; }
        .vf-box small { color:#9cacbe; font-size:9px; margin-top:2px; }
        .vf-input { width:100%; min-width:0; min-height:52px; border:1px solid #36587c; background:#081426; color:white; border-radius:9px; text-align:center; outline:none; font-size:16px; font-weight:800; }
        .vf-input:focus { border-color:#e91e50; box-shadow:0 0 0 2px rgba(233,30,80,.12); }
        .vf-compare { grid-column:2 / 5; color:#F6C344; font-size:10px; font-weight:900; margin-top:-4px; line-height:1.2; }
        .vf-card-actions { display:grid; grid-template-columns:1fr 190px; gap:12px; padding:0 18px 18px; }
        .vf-save { border:1px solid #e22855; color:#F6C344; background:linear-gradient(90deg,#084692,#820a4d,#a50044); border-radius:11px; min-height:48px; font-weight:1000; cursor:pointer; font-size:14px; letter-spacing:.3px; }
        .vf-rest { border:1px solid #446185; color:#F6C344; background:#071126; border-radius:11px; min-height:48px; font-weight:1000; cursor:pointer; }
        .vf-message { position:fixed; left:50%; transform:translateX(-50%); bottom:88px; z-index:30; max-width:min(92vw,620px); padding:10px 14px; background:#07152a; border:1px solid #F6C344; border-radius:10px; color:#F6C344; font-weight:800; font-size:12px; box-shadow:0 12px 30px rgba(0,0,0,.45); }
        .vf-page-title { margin: 4px 0 16px; font-size: 28px; font-weight:1000; color:#F6C344; }
        .vf-section-card { border:1px solid #22496f; background:rgba(3,13,30,.76); border-radius:16px; padding:16px; margin-bottom:12px; }
        .vf-history-ex { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:start; padding:12px 0; border-bottom:1px solid rgba(80,111,146,.24); }
        .vf-history-ex:last-child { border-bottom:0; }
        .vf-history-name { font-weight:900; }
        .vf-muted { color:#9aabc0; font-size:12px; }
        .vf-mini-series { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
        .vf-mini-chip { border:1px solid #315477; background:#071527; border-radius:8px; padding:6px 8px; font-size:10px; }
        .vf-progress-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .vf-record { border:1px solid #294f75; border-radius:14px; background:linear-gradient(135deg,rgba(3,30,65,.8),rgba(38,3,25,.72)); padding:14px; }
        .vf-record h3 { margin:0 0 6px; font-size:15px; }
        .vf-record-big { font-size:24px; color:#F6C344; font-weight:1000; margin:8px 0 2px; }
        .vf-routines { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .vf-routine-day { border:1px solid #2e5c8d; border-radius:16px; background:rgba(4,17,38,.78); padding:16px; cursor:pointer; }
        .vf-routine-day:hover { border-color:#F6C344; }
        .vf-routine-day h3 { color:#F6C344; margin:0 0 4px; }
        .vf-routine-list { margin:12px 0 0; padding:0; list-style:none; }
        .vf-routine-list li { padding:8px 0; border-top:1px solid rgba(66,94,125,.22); font-size:12px; }
        .vf-setting { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid rgba(66,94,125,.25); }
        .vf-setting:last-child { border-bottom:0; }
        .vf-setting select, .vf-setting button { background:#09192f; color:white; border:1px solid #31577e; border-radius:9px; padding:9px 12px; }
        .vf-bottom { position:fixed; left:50%; transform:translateX(-50%); bottom:12px; z-index:20; width:min(calc(100% - 24px), 980px); display:grid; grid-template-columns:repeat(5,1fr); border:1px solid #1a63a9; background:rgba(1,10,24,.94); backdrop-filter:blur(14px); border-radius:14px; overflow:hidden; box-shadow:0 14px 40px rgba(0,0,0,.45); }
        .vf-nav { min-height:64px; border:0; border-right:1px solid rgba(52,89,129,.32); background:transparent; color:#d5dfeb; cursor:pointer; font-size:11px; font-weight:800; }
        .vf-nav:last-child { border-right:0; }
        .vf-nav span { display:block; font-size:22px; margin-bottom:4px; }
        .vf-nav.active { color:#F6C344; background:linear-gradient(180deg,rgba(12,63,118,.24),rgba(165,0,68,.16)); box-shadow:inset 0 -3px 0 #F6C344; }
        .vf-home { display:inline-block; color:#9aabc0; text-decoration:none; font-size:11px; margin:4px 0 84px; }
        @media (max-width: 760px) {
          .vf-app { padding:10px 8px 98px; }
          .vf-topbar { grid-template-columns:1fr auto; }
          .vf-day { grid-column:1 / -1; grid-row:2; justify-content:center; }
          .vf-actions { display:none; }
          .vf-brand-title { font-size:22px; }
          .vf-logo { width:46px; height:46px; }
          .vf-stats { grid-template-columns:1fr 1fr; }
          .vf-stat:nth-child(3), .vf-stat:nth-child(4) { border-top:1px solid rgba(84,124,165,.35); }
          .vf-stat:nth-child(3):before { display:none; }
          .vf-card-head { grid-template-columns:auto 1fr; }
          .vf-ex-icon { display:none; }
          .vf-ex-title { font-size:18px; }
          .vf-compare-grid { grid-template-columns:1fr; }
          .vf-card-actions { grid-template-columns:1fr 130px; }
          .vf-alt-list { grid-template-columns:1fr; }
          .vf-progress-grid, .vf-routines { grid-template-columns:1fr; }
          .vf-bottom { bottom:6px; }
          .vf-nav { min-height:58px; font-size:9px; }
          .vf-nav span { font-size:19px; }
        }
        @media (max-width: 430px) {
          .vf-series-row { grid-template-columns:28px repeat(3,minmax(0,1fr)); gap:5px; }
          .vf-panel { padding:10px 8px; }
          .vf-box, .vf-input { min-height:46px; }
          .vf-card-actions { grid-template-columns:1fr; }
          .vf-rest { min-height:42px; }
        }
      `}</style>

      <div className="vf-shell">
        <header className="vf-topbar">
          <div className="vf-brand">
            <img className="vf-logo" src="/barca.png" alt="FC Barcelona" />
            <div>
              <div className="vf-brand-title">VITOR<span>FIT</span></div>
              <div className="vf-brand-sub">MÉS QUE UN ENTRENAMIENTO</div>
            </div>
          </div>

          <div className="vf-day">
            <button onClick={() => cambiarDia(-1)}>‹</button>
            <div className="vf-day-pill">🗓️ {rutina.titulo}</div>
            <button onClick={() => cambiarDia(1)}>›</button>
          </div>

          <div className="vf-actions">
            <button className="vf-icon-button" onClick={() => setVista("progreso")}>📈</button>
            <button className="vf-icon-button" onClick={() => setVista("ajustes")}>☰</button>
          </div>
        </header>

        {vista === "entreno" && (
          <>
            <section className="vf-stats">
              <div className="vf-stat">
                <div className="vf-ring" style={{ ["--progress" as string]: Math.round((completados / rutina.ejercicios.length) * 100) }}>
                  <div className="vf-ring-text">{completados}/{rutina.ejercicios.length}</div>
                </div>
                <div className="vf-stat-label">EJERCICIOS</div>
                <div className="vf-stat-sub">completados</div>
              </div>
              <div className="vf-stat">
                <div className="vf-stat-icon">🕘</div>
                <div className="vf-stat-value">{formatoTiempo(segundos)}</div>
                <div className="vf-stat-label">DURACIÓN</div>
                <div className="vf-stat-sub">del entrenamiento</div>
              </div>
              <div className="vf-stat">
                <div className="vf-stat-icon">🔥</div>
                <div className="vf-stat-value">{kcal}</div>
                <div className="vf-stat-label">KCAL</div>
                <div className="vf-stat-sub">estimadas</div>
              </div>
              <div className="vf-stat">
                <div className="vf-stat-icon">🏆</div>
                <div className="vf-stat-value" style={{ fontSize: 20 }}>¡TÚ PUEDES!</div>
                <div className="vf-stat-sub">Cada repetición<br />te acerca a tu mejor versión</div>
                <div className="vf-stat-sub" style={{ marginTop: 8, color: "#F6C344" }}>{seriesCompletadas} series hechas</div>
              </div>
            </section>

            {rutina.ejercicios.map((ej, index) => {
              const anterior = ultimoRegistro(ej);
              const actuales = registros[ej.id] ?? seriesVacias(ej.series);
              const varianteActual = nombreVariante(ej);

              return (
                <section className="vf-card" key={ej.id}>
                  <div className="vf-card-head">
                    <div className="vf-num">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="vf-title-row">
                        <div className="vf-ex-title">{varianteActual}</div>
                        <span className="vf-tag">{ej.musculo}</span>
                      </div>
                      <div className="vf-prescription">🎯 {ej.series} series · {ej.reps} reps · RIR {ej.rir}</div>
                    </div>
                    <div className="vf-ex-icon">{ej.icono}</div>
                  </div>

                  <div className="vf-alt-wrap">
                    <button
                      className="vf-alt-button"
                      onClick={() => setAlternativasAbiertas((p) => ({ ...p, [ej.id]: !p[ej.id] }))}
                    >
                      🔄 ¿Está ocupado o no puedes hacerlo? ALTERNAR · patrón: {ej.patron}
                    </button>
                    {alternativasAbiertas[ej.id] && (
                      <div className="vf-alt-list">
                        {ej.alternativas.map((alt) => (
                          <button
                            key={alt.nombre}
                            className={`vf-alt-option ${varianteActual === alt.nombre ? "active" : ""}`}
                            onClick={() => {
                              setVariantes((p) => ({ ...p, [ej.id]: alt.nombre }));
                              setAlternativasAbiertas((p) => ({ ...p, [ej.id]: false }));
                              setMensaje(`🔄 Cambiado a ${alt.nombre}. Mantiene series, reps y RIR del mismo patrón.`);
                            }}
                          >
                            <strong>{alt.nombre}</strong><br />
                            <span className="vf-muted">{alt.etiqueta}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="vf-compare-grid">
                    <div className="vf-panel last">
                      <div className="vf-panel-head">
                        <span>📈 ÚLTIMA SESIÓN</span>
                        {anterior && <span className="vf-date">{anterior.fecha.split(",")[0]}</span>}
                      </div>
                      {Array.from({ length: ej.series }, (_, i) => {
                        const s = anterior?.series?.[i];
                        return (
                          <div className="vf-series-row" key={i}>
                            <div className="vf-slabel">S{i + 1}</div>
                            <div className="vf-box"><strong>{s?.kg || "—"}</strong><small>KG</small></div>
                            <div className="vf-box"><strong>{s?.reps || "—"}</strong><small>REPS</small></div>
                            <div className="vf-box"><strong>{s?.rir || "—"}</strong><small>RIR</small></div>
                          </div>
                        );
                      })}
                      {anterior && anterior.variante !== varianteActual && (
                        <div className="vf-muted">Último registro: {anterior.variante}</div>
                      )}
                    </div>

                    <div className="vf-panel today">
                      <div className="vf-panel-head"><span>✏️ HOY</span><span className="vf-muted">{varianteActual}</span></div>
                      {Array.from({ length: ej.series }, (_, i) => {
                        const s = actuales[i] ?? { kg: "", reps: "", rir: "" };
                        const comparacion = compararSerie(ej, i);
                        return (
                          <div className="vf-series-row" key={i}>
                            <div className="vf-slabel">S{i + 1}</div>
                            <input className="vf-input" type="number" placeholder="KG" value={s.kg} onChange={(e) => setSerie(ej, i, "kg", e.target.value)} />
                            <input className="vf-input" type="number" placeholder="REPS" value={s.reps} onChange={(e) => setSerie(ej, i, "reps", e.target.value)} />
                            <input className="vf-input" type="number" placeholder="RIR" value={s.rir} onChange={(e) => setSerie(ej, i, "rir", e.target.value)} />
                            {comparacion && <div className="vf-compare">{comparacion}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="vf-card-actions">
                    <button className="vf-save" onClick={() => guardarEjercicio(ej)}>💾 GUARDAR ENTRENAMIENTO</button>
                    <button className="vf-rest" onClick={() => setDescansoRestante(ajustes.descanso)}>
                      ⏱️ {descansoRestante > 0 ? `DESCANSO ${descansoRestante}s` : `DESCANSO ${ajustes.descanso}s`}
                    </button>
                  </div>
                </section>
              );
            })}

            <a className="vf-home" href="/">← Volver al inicio</a>
          </>
        )}

        {vista === "historial" && (
          <>
            <h1 className="vf-page-title">📚 HISTORIAL</h1>
            {rutinas.flatMap((d) => d.ejercicios).map((ej) => {
              const lista = [...(historial[ej.id] ?? [])].reverse();
              if (!lista.length) return null;
              return (
                <section className="vf-section-card" key={ej.id}>
                  <div className="vf-history-name">{ej.nombre}</div>
                  <div className="vf-muted">{ej.patron} · {lista.length} sesiones</div>
                  {lista.slice(0, 5).map((r, i) => (
                    <div className="vf-history-ex" key={`${r.fecha}-${i}`}>
                      <div>
                        <strong>{r.variante}</strong>
                        <div className="vf-muted">{r.fecha}</div>
                        <div className="vf-mini-series">
                          {r.series.map((s, si) => <span className="vf-mini-chip" key={si}>S{si + 1}: {s.kg || "—"}kg · {s.reps || "—"} reps · RIR {s.rir || "—"}</span>)}
                        </div>
                      </div>
                      <span className="vf-tag">{ej.musculo}</span>
                    </div>
                  ))}
                </section>
              );
            })}
            {Object.keys(historial).length === 0 && <div className="vf-section-card">Todavía no hay entrenamientos guardados.</div>}
          </>
        )}

        {vista === "progreso" && (
          <>
            <h1 className="vf-page-title">📈 PROGRESO Y RÉCORDS</h1>
            <div className="vf-progress-grid">
              {progreso.filter((p) => p.sesiones > 0).map((p) => (
                <div className="vf-record" key={`${p.dia}-${p.nombre}`}>
                  <div className="vf-muted">{p.dia}</div>
                  <h3>{p.nombre}</h3>
                  <div className="vf-record-big">{p.mejorKg ? `${p.mejorKg} KG` : "—"}</div>
                  <div className="vf-muted">Récord de peso</div>
                  <div style={{ marginTop: 10 }}><strong>🏆 Mejor serie:</strong> {p.mejorTexto}</div>
                  <div className="vf-muted">e1RM aprox.: {p.mejorE1rm ? `${p.mejorE1rm.toFixed(1)} kg` : "—"}</div>
                  <div style={{ marginTop: 8, color: "#F6C344", fontWeight: 900 }}>Tendencia: {p.tendencia}</div>
                  <div className="vf-muted">{p.sesiones} sesiones guardadas</div>
                </div>
              ))}
            </div>
            {progreso.every((p) => p.sesiones === 0) && <div className="vf-section-card">Guarda entrenamientos y aquí aparecerán tus récords y evolución automáticamente.</div>}
          </>
        )}

        {vista === "rutinas" && (
          <>
            <h1 className="vf-page-title">📋 RUTINAS</h1>
            <div className="vf-routines">
              {rutinas.map((d) => (
                <div className="vf-routine-day" key={d.id} onClick={() => { setDiaActual(d.id); setVista("entreno"); }}>
                  <h3>{d.titulo}</h3>
                  <div className="vf-muted">{d.subtitulo}</div>
                  <ul className="vf-routine-list">
                    {d.ejercicios.map((ej, i) => (
                      <li key={ej.id}><strong>{String(i + 1).padStart(2, "0")}</strong> · {ej.nombre}<br /><span className="vf-muted">{ej.series} × {ej.reps} · {ej.patron}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {vista === "ajustes" && (
          <>
            <h1 className="vf-page-title">⚙️ AJUSTES</h1>
            <section className="vf-section-card">
              <div className="vf-setting">
                <div><strong>Descanso automático</strong><div className="vf-muted">Tiempo del botón DESCANSO</div></div>
                <select value={ajustes.descanso} onChange={(e) => setAjustes((a) => ({ ...a, descanso: Number(e.target.value) }))}>
                  <option value={60}>60 s</option><option value={90}>90 s</option><option value={120}>120 s</option><option value={180}>180 s</option>
                </select>
              </div>
              <div className="vf-setting">
                <div><strong>Comparación automática</strong><div className="vf-muted">Muestra +KG, +REPS o igual que la última</div></div>
                <button onClick={() => setAjustes((a) => ({ ...a, mostrarComparacion: !a.mostrarComparacion }))}>{ajustes.mostrarComparacion ? "ACTIVADA" : "DESACTIVADA"}</button>
              </div>
              <div className="vf-setting">
                <div><strong>RIR</strong><div className="vf-muted">Se mantiene guardado en todas las sesiones</div></div>
                <button onClick={() => setAjustes((a) => ({ ...a, mostrarRir: !a.mostrarRir }))}>{ajustes.mostrarRir ? "ACTIVO" : "ACTIVO"}</button>
              </div>
              <div className="vf-setting">
                <div><strong>Limpiar datos de HOY</strong><div className="vf-muted">No borra tu historial ni tus récords</div></div>
                <button onClick={() => { setRegistros({}); setMensaje("🧹 Campos de HOY limpiados. El historial sigue intacto."); }}>LIMPIAR</button>
              </div>
            </section>
            <section className="vf-section-card">
              <strong>🔒 Datos</strong>
              <p className="vf-muted" style={{ lineHeight: 1.6 }}>Tus registros se guardan en el navegador mediante localStorage. Esta versión también intenta migrar automáticamente el historial antiguo de VitorFit para que no pierdas lo que ya habías registrado.</p>
            </section>
          </>
        )}
      </div>

      {mensaje && <div className="vf-message" onClick={() => setMensaje("")}>{mensaje}</div>}

      <nav className="vf-bottom">
        <button className={`vf-nav ${vista === "entreno" ? "active" : ""}`} onClick={() => setVista("entreno")}><span>🏋️</span>ENTRENAMIENTO</button>
        <button className={`vf-nav ${vista === "historial" ? "active" : ""}`} onClick={() => setVista("historial")}><span>🕘</span>HISTORIAL</button>
        <button className={`vf-nav ${vista === "progreso" ? "active" : ""}`} onClick={() => setVista("progreso")}><span>📈</span>PROGRESO</button>
        <button className={`vf-nav ${vista === "rutinas" ? "active" : ""}`} onClick={() => setVista("rutinas")}><span>📋</span>RUTINAS</button>
        <button className={`vf-nav ${vista === "ajustes" ? "active" : ""}`} onClick={() => setVista("ajustes")}><span>⚙️</span>AJUSTES</button>
      </nav>
    </main>
  );
}
