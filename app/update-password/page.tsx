"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [repetirNuevaPassword, setRepetirNuevaPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    const comprobarSesion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!activo) return;

      if (session) {
        setCargando(false);
        return;
      }

      // Esperamos a que Supabase procese el enlace de recuperación
      const timeout = setTimeout(async () => {
        const {
          data: { session: sesionFinal },
        } = await supabase.auth.getSession();

        if (!activo) return;

        if (sesionFinal) {
          setCargando(false);
        } else {
          setMensaje(
            "❌ El enlace de recuperación no es válido o ha caducado."
          );
          setCargando(false);
        }
      }, 1500);

      return () => clearTimeout(timeout);
    };

    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        session
      ) {
        setCargando(false);
        setMensaje("");
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);
  const guardarNuevaPassword = async () => {
    setMensaje("");

    if (!nuevaPassword || !repetirNuevaPassword) {
      setMensaje("⚠️ Completa las dos contraseñas.");
      return;
    }

    if (nuevaPassword.length < 6) {
      setMensaje("⚠️ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== repetirNuevaPassword) {
      setMensaje("⚠️ Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (error) {
      setMensaje(`❌ ${error.message}`);
      setGuardando(false);
      return;
    }

    setMensaje("✅ Contraseña cambiada correctamente.");

    setNuevaPassword("");
    setRepetirNuevaPassword("");

    await supabase.auth.signOut();

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  };

  if (cargando) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, #291316 0%, #111418 45%, #070b11 100%)",
          color: "#ef5363",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/vitorfit-logo.png"
            alt="VitorFit"
            style={{
              width: 90,
              height: 90,
              objectFit: "contain",
              borderRadius: 18,
              marginBottom: 18,
            }}
          />

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            VITOR FIT
          </div>

          <div
            style={{
              color: "#aaa",
              marginTop: 10,
              fontSize: 14,
            }}
          >
            Comprobando enlace...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(circle at top, #291316 0%, #111418 45%, #070b11 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 430 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <img
            src="/vitorfit-logo.png"
            alt="VitorFit"
            style={{
              width: 100,
              height: 100,
              objectFit: "contain",
              borderRadius: 20,
              marginBottom: 16,
            }}
          />

          <h1
            style={{
              margin: 0,
              color: "#ef5363",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            VITOR FIT
          </h1>

          <p
            style={{
              color: "#ef5363",
              fontWeight: 700,
              letterSpacing: 2,
              fontSize: 13,
            }}
          >
            SUPERA TUS LÍMITES
          </p>
        </div>

        <div
          style={{
            background: "rgba(8, 16, 29, 0.88)",
            border: "1px solid rgba(239,83,99,0.35)",
            borderRadius: 28,
            padding: 26,
          }}
        >
          <h2
            style={{
              color: "#ef5363",
              textAlign: "center",
              marginTop: 0,
            }}
          >
            🔐 NUEVA CONTRASEÑA
          </h2>

          <p
            style={{
              color: "#aeb3bd",
              textAlign: "center",
              fontSize: 14,
              marginBottom: 25,
            }}
          >
            Introduce la nueva contraseña para tu cuenta VitorFit.
          </p>

          <input
            type="password"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 15,
              marginBottom: 15,
              borderRadius: 14,
              border: "1px solid #323b4b",
              background: "#080f1c",
              color: "white",
              fontSize: 16,
            }}
          />

          <input
            type="password"
            value={repetirNuevaPassword}
            onChange={(e) => setRepetirNuevaPassword(e.target.value)}
            placeholder="Repetir nueva contraseña"
            autoComplete="new-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 15,
              marginBottom: 18,
              borderRadius: 14,
              border: "1px solid #323b4b",
              background: "#080f1c",
              color: "white",
              fontSize: 16,
            }}
          />

          {mensaje && (
            <div
              style={{
                padding: "12px 14px",
                marginBottom: 18,
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                color: "#ddd",
                fontSize: 14,
              }}
            >
              {mensaje}
            </div>
          )}

          <button
            type="button"
            onClick={guardarNuevaPassword}
            disabled={guardando || mensaje.includes("no es válido")}
            style={{
              width: "100%",
              padding: 16,
              border: 0,
              borderRadius: 15,
              background: guardando ? "#75343c" : "#ef5363",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              cursor: guardando ? "default" : "pointer",
            }}
          >
            {guardando ? "GUARDANDO..." : "GUARDAR NUEVA CONTRASEÑA"}
          </button>
        </div>
      </div>
    </main>
  );
}