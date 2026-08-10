"use client";
import { useState } from "react";
type ExerciseCardProps = {
  numero: number;
  nombre: string;
  musculo: string;
  series: string;
  rir: string;
};

export default function ExerciseCard({
  numero,
  nombre,
  musculo,
  series,
  rir,
}: ExerciseCardProps) {
  const [mostrarSeries, setMostrarSeries] = useState(false);
  return (
    <div
      style={{
        background: "#141922",
        border: "1px solid #252b36",
        borderRadius: "18px",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: "#9DFF00",
              fontWeight: "bold",
            }}
          >
            {numero}
          </div>

          <h2>{nombre}</h2>

          <p
            style={{
              color: "#9ca3af",
            }}
          >
            {series} · RIR {rir}
          </p>
        </div>

        <span
          style={{
            background: "#202733",
            padding: "8px 12px",
            borderRadius: "999px",
          }}
        >
          {musculo}
        </span>
      </div>

      <button
       onClick={() => setMostrarSeries(!mostrarSeries)}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: "#9DFF00",
          color: "black",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Registrar series
      </button>
    </div>
  );
}