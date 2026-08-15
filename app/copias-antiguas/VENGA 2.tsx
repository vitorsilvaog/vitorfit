export default function Home() {
  return (
    <main
      style={{
        background:  "radial-gradient(circle at 50% 25%, rgba(165,0,68,0.30) 0%, transparent 32%), linear-gradient(135deg, #001845 0%, #07111f 45%, #30001c 100%)",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
        transform: "scale(1.90)",
      }}
    >
     <div
  style={{
    marginBottom: "18px",
  }}
>
  <img
    src="/barca.png"
    alt="FC Barcelona"
    style={{
      width: "90px",
      height: "90px",
      objectFit: "contain",
      filter: "drop-shadow(0 0 15px #004D98) drop-shadow(0 0 25px #A50044)",
    }}
  />
</div> 
      <h1
        style={{
          fontSize: "60px",
          color: "#F6C344",
          textShadow: "0 0 20px rgba(246,195,68,0.35)",
letterSpacing: "-2px",
        }}
      >
        VitorFit
      </h1>

      <h2>Bienvenido, Víctor 💪</h2>

      <p
  style={{
    color: "#F6C344",
    fontWeight: "bold",
    letterSpacing: "2px",
  }}
>
  EL PROGRESO NO SE NEGOCIA.
</p>

      <a
        href="/entrenamiento"
        style={{
          marginTop: "30px",
          padding: "15px 40px",
          background: "linear-gradient(135deg, #004D98 0%, #A50044 100%)",
color: "#F6C344",
border: "1px solid #F6C344",
boxShadow: "0 0 20px rgba(246,195,68,0.18)",
          borderRadius: "12px",
          fontSize: "22px",
          cursor: "pointer",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Empezar entrenamiento
      </a>
    </main>
  );
}