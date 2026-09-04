import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

declare global {
  interface Window {
    __APP_BOOTED__?: boolean;
  }
}

/* ------------------------------------------------------------------ */
/* Tela de erro em DOM puro — funciona mesmo se o React nunca montar   */
/* ------------------------------------------------------------------ */
function showFatalScreen(message: string) {
  try {
    const root = document.getElementById("root");
    if (!root) return;
    root.innerHTML = "";
    const box = document.createElement("div");
    box.style.cssText =
      "min-height:100vh;display:grid;place-items:center;background:#07231a;color:#d9f0e4;" +
      "font-family:'Trebuchet MS',sans-serif;padding:24px;text-align:center;";
    box.innerHTML =
      '<div style="max-width:460px">' +
      "<p style=\"font-family:'Courier New',monospace;font-weight:bold;color:#FBBF24;" +
      'letter-spacing:0.1em;margin:0 0 12px">A COBRINHA SE PERDEU NO CARREGAMENTO</p>' +
      '<p style="font-size:14px;opacity:0.85;line-height:1.55;margin:0">' +
      message +
      "</p>" +
      '<button type="button" id="__reload_btn" style="margin-top:22px;padding:12px 24px;border-radius:10px;' +
      "border:none;border-bottom:4px solid #B45309;background:#FBBF24;color:#3A2A05;font-weight:bold;" +
      'cursor:pointer;letter-spacing:0.06em">RECARREGAR</button>' +
      "</div>";
    root.appendChild(box);
    document.getElementById("__reload_btn")?.addEventListener("click", () => location.reload());
  } catch {
    /* nada a fazer */
  }
}

/* Erros antes do boot viram tela visível (erros de recurso — fontes etc. — são ignorados). */
window.addEventListener("error", (e) => {
  if (e.target && e.target !== window) return;
  if (window.__APP_BOOTED__) return;
  showFatalScreen(e.message || "Erro inesperado ao carregar o jogo.");
});
window.addEventListener("unhandledrejection", () => {
  if (window.__APP_BOOTED__) return;
  showFatalScreen("O carregamento do jogo falhou. Recarregue para tentar de novo.");
});

/* ------------------------------------------------------------------ */
/* ErrorBoundary do React                                              */
/* ------------------------------------------------------------------ */
class BootGuard extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#07231a",
            color: "#d9f0e4",
            fontFamily: "'Space Grotesk', 'Trebuchet MS', sans-serif",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: 13,
                color: "#FBBF24",
                marginBottom: 14,
              }}
            >
              OPS! A COBRINHA SE PERDEU
            </p>
            <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
              Algo deu errado ao carregar o jogo:{" "}
              {String(this.state.error?.message ?? this.state.error)}
            </p>
            <button
              type="button"
              onClick={() => location.reload()}
              style={{
                marginTop: 20,
                padding: "12px 22px",
                borderRadius: 10,
                border: "none",
                borderBottom: "4px solid #B45309",
                background: "#FBBF24",
                color: "#3A2A05",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: 10,
              }}
            >
              RECARREGAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Fontes carregadas DEPOIS do boot — nunca bloqueiam a pré-visualização */
/* ------------------------------------------------------------------ */
function loadFontsWhenIdle() {
  const href =
    "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;600;700&display=swap";
  const inject = () => {
    try {
      if (document.querySelector("link[data-app-fonts]")) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-app-fonts", "1");
      document.head.appendChild(link);
    } catch {
      /* sem rede — as fontes de fallback continuam em uso */
    }
  };
  try {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(inject, { timeout: 2500 });
    } else {
      window.setTimeout(inject, 500);
    }
  } catch {
    inject();
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
const rootEl = document.getElementById("root");

if (rootEl) {
  window.__APP_BOOTED__ = true;
  ReactDOM.createRoot(rootEl).render(
    <BootGuard>
      <App />
    </BootGuard>,
  );
  loadFontsWhenIdle();
}
