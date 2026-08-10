"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion() {
    if (!email || !password) {
      setMensaje("⚠️ Escribe tu correo y contraseña.");
      return;
    }

    setCargando(true);
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje("❌ " + error.message);
      return;
    }

    router.push("/entrenamiento");
    router.refresh();
  }

  async function crearCuenta() {
    if (!email || !password) {
      setMensaje("⚠️ Escribe tu correo y una contraseña.");
      return;
    }

    if (password.length < 6) {
      setMensaje("⚠️ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    setMensaje("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje("❌ " + error.message);
      return;
    }

    if (!data.session) {
      setMensaje("📩 Cuenta creada. Revisa tu correo para confirmarla.");
      return;
    }

    router.push("/entrenamiento");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "white",
        background:
          "radial-gradient(circle at 15% 15%, rgba(0,77,152,.35), transparent 32%), radial-gradient(circle at 85% 20%, rgba(165,0,68,.30), transparent 30%), linear-gradient(135deg,#020713,#06152f 48%,#230013)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "34px",
          borderRadius: "24px",
          border: "1px solid rgba(246,195,68,.45)",
          background:
            "linear-gradient(145deg,rgba(3,18,42,.96),rgba(35,3,24,.96))",
          boxShadow: "0 25px 70px rgba(0,0,0,.55)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/barca.png"
            alt="VitorFit"
            style={{ width: "78px", height: "78px", objectFit: "contain", marginBottom: "14px" }}
          />

          <h1 style={{ margin: 0, fontSize: "38px", fontWeight: 900, letterSpacing: "1px", color: "#F6C344" }}>
            VITOR<span style={{ color: "#ff2857" }}>FIT</span>
          </h1>

          <div style={{ marginTop: "5px", color: "#F6C344", fontSize: "11px", fontWeight: 900, letterSpacing: "1.4px" }}>
            MÉS QUE UN ENTRENAMIENTO
          </div>

          <p style={{ color: "#9fb0c5", fontSize: "14px", marginTop: "20px" }}>
            Entra en tu cuenta y continúa tu progreso.
          </p>
        </div>

        <label style={{ display: "block", color: "#F6C344", fontWeight: 900, fontSize: "12px", marginBottom: "7px" }}>
          CORREO ELECTRÓNICO
        </label>

        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "15px",
            marginBottom: "18px",
            borderRadius: "11px",
            border: "1px solid #31587e",
            background: "#071529",
            color: "white",
            outline: "none",
            fontSize: "15px",
          }}
        />

        <label style={{ display: "block", color: "#F6C344", fontWeight: 900, fontSize: "12px", marginBottom: "7px" }}>
          CONTRASEÑA
        </label>

        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") iniciarSesion();
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "15px 55px 15px 15px",
              borderRadius: "11px",
              border: "1px solid #31587e",
              background: "#071529",
              color: "white",
              outline: "none",
              fontSize: "15px",
            }}
          />

          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: "#F6C344",
              fontSize: "20px",
            }}
          >
            {mostrarPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={iniciarSesion}
          disabled={cargando}
          style={{
            width: "100%",
            minHeight: "52px",
            borderRadius: "12px",
            border: "1px solid #ff2857",
            background: "linear-gradient(90deg,#004D98,#660543,#A50044)",
            color: "#F6C344",
            fontWeight: 900,
            fontSize: "15px",
            cursor: cargando ? "wait" : "pointer",
          }}
        >
          {cargando ? "CARGANDO..." : "🔐 INICIAR SESIÓN"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "22px 0", color: "#66788d", fontSize: "11px" }}>
          <div style={{ height: "1px", background: "#263c56", flex: 1 }} />
          O
          <div style={{ height: "1px", background: "#263c56", flex: 1 }} />
        </div>

        <button
          onClick={crearCuenta}
          disabled={cargando}
          style={{
            width: "100%",
            minHeight: "48px",
            borderRadius: "12px",
            border: "1px solid #3978b6",
            background: "#071529",
            color: "white",
            fontWeight: 900,
            cursor: cargando ? "wait" : "pointer",
          }}
        >
          ✨ CREAR CUENTA
        </button>

        {mensaje && (
          <div
            style={{
              marginTop: "18px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(0,0,0,.25)",
              border: "1px solid rgba(246,195,68,.25)",
              color: "#F6C344",
              fontSize: "13px",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {mensaje}
          </div>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", color: "#72859c", fontSize: "11px" }}>
          🔒 Tus entrenamientos y datos estarán asociados a tu cuenta.
        </div>
      </section>
    </main>
  );
}
