"use client";

import { useEffect, useState } from "react";

type Serie = {
  kg: string;
  reps: string;
  rir: string;
};

type Registro = {
  fecha: string;
    nombre?: string;

  series: Serie[];
};

export default function Historial() {
  const [historial, setHistorial] = useState<Record<number, Registro[]>>({});

  useEffect(() => {
    const guardado = localStorage.getItem("vitorfit-historial");

    if (guardado) {
      setHistorial(JSON.parse(guardado));
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#090d12",
        color: "white",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            color: "#9DFF00",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}
        >
          VITORFIT
        </p>

        <h1
          style={{
            fontSize: "42px",
            marginBottom: "10px",
          }}
        >
          Historial
        </h1>

        <p style={{ color: "#9ca3af", marginBottom: "30px" }}>
          Tus entrenamientos guardados
        </p>

        {Object.keys(historial).length === 0 ? (
          <div
            style={{
              background: "#141922",
              border: "1px solid #252b36",
              borderRadius: "18px",
              padding: "25px",
            }}
          >
            Todavía no hay entrenamientos guardados.
          </div>
        ) : (
          Object.entries(historial).map(([ejercicio, registros]) => (
            <div
              key={ejercicio}
              style={{
                background: "#141922",
                border: "1px solid #252b36",
                borderRadius: "18px",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
        <h2>{registros[0]?.nombre ?? `Ejercicio ${Number(ejercicio) + 1}`}</h2>

              {registros.map((registro, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: "18px",
                    paddingTop: "18px",
                    borderTop: "1px solid #303744",
                  }}
                >
                  <strong style={{ color: "#9DFF00" }}>
                    {registro.fecha}
                  </strong>

                  {registro.series.map((serie, j) => (
                    <p key={j} style={{ color: "#d1d5db" }}>
                      Serie {j + 1}: {serie.kg} kg · {serie.reps} reps · RIR{" "}
                      {serie.rir}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}

        <a
          href="/entrenamiento"
          style={{
            display: "inline-block",
            marginTop: "20px",
            background: "#9DFF00",
            color: "black",
            padding: "14px 24px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ← Volver al entrenamiento
        </a>
      </div>
    </main>
  );
}