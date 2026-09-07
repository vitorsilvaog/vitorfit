"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async () => {
    if (!email || !password) {
      setMensaje("Introduce tu email y contraseña.");
      return;
    }

    setLoading(true);
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMensaje("Email o contraseña incorrectos.");
      return;
    }

    router.push("/entrenamiento");
    router.refresh();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08090c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#101116",
          border: "1px solid #292b33",
          borderRadius: "22px",
          padding: "30px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              color: "#ff2948",
            }}
          >
            V
          </div>

          <h1 style={{ fontSize: "28px", margin: "5px 0" }}>
            VitorFit
          </h1>

          <p style={{ color: "#888" }}>
            Inicia sesión para continuar
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            marginBottom: "14px",
            borderRadius: "12px",
            border: "1px solid #333",
            background: "#17181d",
            color: "white",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") iniciarSesion();
          }}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            borderRadius: "12px",
            border: "1px solid #333",
            background: "#17181d",
            color: "white",
            fontSize: "16px",
          }}
        />

        {mensaje && (
          <p
            style={{
              color: "#ff647b",
              marginTop: "15px",
              textAlign: "center",
            }}
          >
            {mensaje}
          </p>
        )}

        <button
          onClick={iniciarSesion}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#ff2948",
            color: "white",
            fontWeight: 800,
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading ? "ENTRANDO..." : "INICIAR SESIÓN"}
        </button>

        <button
          onClick={() => router.push("/update-password")}
          style={{
            width: "100%",
            marginTop: "12px",
            border: "none",
            background: "transparent",
            color: "#999",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          ¿Has olvidado tu contraseña?
        </button>
      </div>
    </main>
  );
}