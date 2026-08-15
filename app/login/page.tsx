"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [modoReset, setModoReset] = useState(false);
const [nuevaPassword, setNuevaPassword] = useState("");
const [repetirNuevaPassword, setRepetirNuevaPassword] = useState("");

  useEffect(() => {
  let activo = true;

  const iniciar = async () => {
    const params = new URLSearchParams(window.location.search);

    // Supabase puede devolver el código de recuperación en ?code=
    const code = params.get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!activo) return;

      if (error) {
        setMensaje("❌ El enlace de recuperación ha caducado o no es válido.");
        setComprobandoSesion(false);
        return;
      }

      setModoReset(true);
      setComprobandoSesion(false);

      // Limpiamos la URL sin cerrar la sesión de recuperación
      window.history.replaceState({}, "", "/login");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!activo) return;

    if (session) {
      router.replace("/entrenamiento");
      return;
    }

    setComprobandoSesion(false);
  };

  iniciar();

  return () => {
    activo = false;
  };
}, [router, supabase]);

  const iniciarSesion = async () => {
    setMensaje("");

    if (!email.trim() || !password) {
      setMensaje("⚠️ Introduce tu email y contraseña.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje(`❌ ${error.message}`);
      return;
    }

    router.replace("/entrenamiento");
  };

  const crearCuenta = async () => {
    setMensaje("");

    if (!email.trim() || !password || !confirmarPassword) {
      setMensaje("⚠️ Completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      setMensaje("⚠️ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setMensaje("⚠️ Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/update-password`,
      },
    });

    setCargando(false);

    if (error) {
      setMensaje(`❌ ${error.message}`);
      return;
    }

    // Si Supabase crea también la sesión directamente,
    // podemos entrar ya en VitorFit.
    if (data.session) {
      router.replace("/entrenamiento");
      return;
    }

    // Si tienes activada la confirmación por email.
    setMensaje(
      "✅ Cuenta creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión."
    );

    setModo("login");
    setPassword("");
    setConfirmarPassword("");
  };
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

  setCargando(true);

  const { error } = await supabase.auth.updateUser({
    password: nuevaPassword,
  });

  setCargando(false);

  if (error) {
    setMensaje(`❌ ${error.message}`);
    return;
  }

  setMensaje("✅ Contraseña cambiada correctamente.");

  setNuevaPassword("");
  setRepetirNuevaPassword("");

  await supabase.auth.signOut();

  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
};
  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modo === "login") {
      await iniciarSesion();
    } else {
      await crearCuenta();
    }
  };
if (modoReset) {
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
            disabled={cargando}
            style={{
              width: "100%",
              padding: 16,
              border: 0,
              borderRadius: 15,
              background: cargando ? "#75343c" : "#ef5363",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              cursor: cargando ? "default" : "pointer",
            }}
          >
            {cargando ? "GUARDANDO..." : "GUARDAR NUEVA CONTRASEÑA"}
          </button>
        </div>
      </div>
    </main>
  );
}
  if (comprobandoSesion) {
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
            Comprobando sesión...
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
      <div
        style={{
          width: "100%",
          maxWidth: 430,
        }}
      >
        {/* LOGO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
          }}
        >
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
              letterSpacing: 1,
            }}
          >
            VITOR FIT
          </h1>

          <p
            style={{
              marginTop: 8,
              color: "#ef5363",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            SUPERA TUS LÍMITES
          </p>
        </div>

        {/* TARJETA */}
        <div
          style={{
            background: "rgba(8, 16, 29, 0.88)",
            border: "1px solid rgba(239,83,99,0.35)",
            borderRadius: 28,
            padding: 26,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              textAlign: "center",
              fontSize: 25,
              color: "#ef5363",
            }}
          >
            {modo === "login" ? "INICIAR SESIÓN" : "CREAR CUENTA"}
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#aeb3bd",
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 25,
            }}
          >
            {modo === "login"
              ? "Accede a tus entrenamientos y a tu progreso."
              : "Crea tu cuenta personal de VitorFit."}
          </p>

          <form onSubmit={enviarFormulario}>
            <label
              style={{
                display: "block",
                color: "#bbb",
                marginBottom: 7,
                fontSize: 13,
              }}
            >
              EMAIL
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@email.com"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                marginBottom: 18,
                borderRadius: 14,
                border: "1px solid #323b4b",
                background: "#080f1c",
                color: "white",
                fontSize: 16,
                outline: "none",
              }}
            />

            <label
              style={{
                display: "block",
                color: "#bbb",
                marginBottom: 7,
                fontSize: 13,
              }}
            >
              CONTRASEÑA
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                modo === "login" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                marginBottom: 18,
                borderRadius: 14,
                border: "1px solid #323b4b",
                background: "#080f1c",
                color: "white",
                fontSize: 16,
                outline: "none",
              }}
            />

            {modo === "registro" && (
              <>
                <label
                  style={{
                    display: "block",
                    color: "#bbb",
                    marginBottom: 7,
                    fontSize: 13,
                  }}
                >
                  REPITE LA CONTRASEÑA
                </label>

                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "15px",
                    marginBottom: 18,
                    borderRadius: 14,
                    border: "1px solid #323b4b",
                    background: "#080f1c",
                    color: "white",
                    fontSize: 16,
                    outline: "none",
                  }}
                />
              </>
            )}

            {mensaje && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  color: "#ddd",
                  fontSize: 14,
                  marginBottom: 18,
                  lineHeight: 1.4,
                }}
              >
                {mensaje}
              </div>
            )}
{modo === "login" && (
  <button
    type="button"
    onClick={async () => {
      setMensaje("");

      if (!email.trim()) {
        setMensaje(
          "⚠️ Escribe primero tu email para recuperar la contraseña."
        );
        return;
      }

      setCargando(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
redirectTo: `${window.location.origin}/login`,        }
      );

      setCargando(false);

      if (error) {
        setMensaje(`❌ ${error.message}`);
        return;
      }

      setMensaje(
        "📧 Te hemos enviado un correo para cambiar tu contraseña."
      );
    }}
    style={{
      display: "block",
      marginLeft: "auto",
      marginTop: "-5px",
      marginBottom: "18px",
      padding: 0,
      background: "transparent",
      border: "none",
      color: "#ef5363",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    ¿Has olvidado tu contraseña?
  </button>
)}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "16px",
                border: 0,
                borderRadius: 15,
                background: cargando ? "#75343c" : "#ef5363",
                color: "white",
                fontWeight: 900,
                fontSize: 16,
                cursor: cargando ? "default" : "pointer",
              }}
            >
              {cargando
                ? "ESPERA..."
                : modo === "login"
                  ? "ENTRAR"
                  : "CREAR MI CUENTA"}
            </button>
          </form>

          <div
            style={{
              marginTop: 25,
              paddingTop: 22,
              borderTop: "1px solid #242d3a",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#999",
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              {modo === "login"
                ? "¿Todavía no tienes cuenta?"
                : "¿Ya tienes una cuenta?"}
            </div>

            <button
              type="button"
              onClick={() => {
                setModo(modo === "login" ? "registro" : "login");
                setMensaje("");
                setPassword("");
                setConfirmarPassword("");
              }}
              style={{
                background: "transparent",
                border: "1px solid #ef5363",
                color: "#ef5363",
                borderRadius: 14,
                padding: "13px 20px",
                width: "100%",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {modo === "login" ? "CREAR CUENTA" : "INICIAR SESIÓN"}
            </button>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#707782",
            fontSize: 12,
            marginTop: 22,
          }}
        >
          Tus entrenamientos están asociados a tu cuenta personal.
        </p>
      </div>
    </main>
  );
}