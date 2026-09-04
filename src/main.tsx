import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

declare global {
  interface Window {
    __APP_BOOTED__?: boolean;
  }
}

/* Garantia: nenhuma falha de renderização deixa a tela em branco. */
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
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 13,
                color: "#FBBF24",
                marginBottom: 14,
              }}
            >
              OPS! A COBRINHA SE PERDEU
            </p>
            <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
              Algo deu errado ao carregar o jogo: {String(this.state.error?.message ?? this.state.error)}
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
                fontFamily: "'Press Start 2P', monospace",
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

const rootEl = document.getElementById("root");

if (rootEl) {
  window.__APP_BOOTED__ = true;
  ReactDOM.createRoot(rootEl).render(
    <BootGuard>
      <App />
    </BootGuard>,
  );
}
