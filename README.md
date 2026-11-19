# 🐍 SNAKE! — Cobrinha Arcade

Jogo da cobrinha moderno em **React 18 + TypeScript + Vite 6 + Tailwind CSS 4**, com tabuleiro 18×18 renderizado em **Canvas 2D**, efeitos sonoros sintetizados via **WebAudio API**, controles para teclado e toque, dificuldades configuráveis, recorde persistente e um **Modo Automático (IA)** capaz de completar todo o tabuleiro e vencer.

![Status](https://img.shields.io/badge/status-completo-4ADE80?style=flat-square)
![React](https://img.shields.io/badge/React-18-38BDF8?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-FBBF24?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square)

## ✨ Funcionalidades

- **Tabuleiro 18×18 (324 células) em Canvas 2D** — renderização nítida com `devicePixelRatio` (até 2×), corpo contínuo com degradê, olhos que acompanham a direção, língua animada, trilha sutil do ciclo no modo IA, partículas em Canvas, anel de expansão ao comer e flashes visuais de derrota/vitória.
- **Modo Manual & Modo Automático (IA)** — alterne entre jogar manualmente ou assistir à IA seguindo um *ciclo hamiltoniano* com atalhos gananciosos comprovadamente seguros, exibindo barra de progresso em tempo real (`tamanho/324`) e seletor de velocidade da IA (`1×`, `2×`, `4×`).
- **3 níveis de dificuldade** — cada maçã soma `10 × multiplicador`:
  - **Fácil**: intervalo de `150 ms` · pontos `×1`
  - **Normal**: intervalo de `100 ms` · pontos `×2`
  - **Difícil**: intervalo de `62 ms` · pontos `×3`
- **Controles completos (Desktop e Mobile)** — suporte a setas/WASD no teclado, gestos de deslize (*swipe*) e toque direto no tabuleiro, além de D-Pad virtual automático em dispositivos de ponteiro grosso (`pointer: coarse`).
- **Áudio arcade em WebAudio API** — efeitos sintetizados para comer, iniciar, clicar nos botões, fim de jogo e fanfarra de vitória, sem depender de arquivos de áudio externos.
- **Resiliência e persistência**:
  - Auto-pausa automática quando a aba do navegador perde o foco (`visibilitychange`).
  - Persistência de recorde (`cobra.best`), dificuldade (`cobra.diff`), velocidade da IA (`cobra.speed`) e estado de som (`cobra.muted`) via `localStorage` com fallback seguro para ambientes restritos.
  - `BootGuard` (`ErrorBoundary`) em `src/main.tsx` + *watchdog* de inicialização em `index.html` com tela de recuperação amigável em caso de falha de carregamento.

## 🎮 Controles e Atalhos

| Ação | Teclado | Mobile / Toque |
|---|---|---|
| Mover cobrinha | `↑` `↓` `←` `→` ou `W` `A` `S` `D` | Deslizar (*swipe*) no tabuleiro ou usar o D-Pad na tela |
| Começar / Pausar / Continuar | `Espaço` ou `Enter` | Toque curto no tabuleiro (início/fim) ou botão central do D-Pad |
| Reiniciar partida | `R` | Botão **REINICIAR** no painel |
| Ligar / Desligar som | `M` | Botão de som no cabeçalho |

> **Nota:** O recorde é contabilizado exclusivamente no **Modo Manual** — no Modo Automático a IA joga apenas pela glória de completar o tabuleiro.

## 🚀 Rodando localmente

Pré-requisitos: **Node.js** (18+) e **npm**.

```bash
# 1. Clone o repositório
git clone https://github.com/MenesesErick/snake-game.git
cd snake-game

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento (http://localhost:3000)
npm run dev

# 4. Verifique a tipagem TypeScript
npm run typecheck

# 5. Gere o build de produção (pasta dist/)
npm run build
```

## 🧠 Como a IA do Modo Automático funciona

1. **Ciclo Hamiltoniano (`buildCycle`)**: uma rota fechada em formato de serpentina percorre todas as 18×18 células (`324` posições) sem repetições — segui-la integralmente garante visitar o tabuleiro inteiro sem colisões.
2. **Invariante de segurança (`aiNextDir`)**: a cada passo, a IA avalia os 4 vizinhos ortogonais e aceita apenas movimentos cuja posição no ciclo esteja estritamente no arco livre entre a cabeça e a cauda (ou na própria cauda quando não há maçã naquela célula), impedindo que a cobrinha ultrapasse ou aprisione o próprio corpo.
3. **Atalhos gananciosos**: entre os movimentos seguros, a IA escolhe o que minimiza a distância cíclica até a maçã, acelerando drasticamente o início e o meio da partida.
4. **Reta final garantida**: quando a cobrinha ocupa mais de 50% do tabuleiro (`snake.length > N * 0.5`), ela abandona os atalhos e segue o ciclo hamiltoniano puro até preencher todas as `324` células e acionar a tela de **VITÓRIA!**.

## 🗂️ Estrutura do Projeto

```text
snake-game/
├── index.html             # Metadados, estilos iniciais e watchdog de carregamento
├── package.json           # Scripts (dev, build, typecheck) e dependências
├── tsconfig.json          # Configuração estrita do TypeScript
├── vite.config.js         # Vite + React + Tailwind CSS (porta 3000)
└── src/
    ├── game/
    │   ├── types.ts       # Tipos, constantes do grid (18×18) e tabela de dificuldades
    │   ├── ai.ts          # Geração do ciclo hamiltoniano e decisão segura da IA
    │   ├── engine.ts      # Estado do jogo, fila de direção, passos, partículas e vitória
    │   ├── render.ts      # Renderização 2D em Canvas (tabuleiro, cobra, maçã, efeitos)
    │   └── audio.ts       # Sintetizador de efeitos sonoros via WebAudio API
    ├── App.tsx            # Loop principal (requestAnimationFrame), HUD, overlays e controles
    ├── main.tsx           # Inicialização React, ErrorBoundary (BootGuard) e fontes sob demanda
    └── index.css          # Tema Tailwind CSS v4, animações e utilitários visuais
```

## 🌐 Deploy

O projeto gera uma aplicação estática em `dist/` com `npm run build` e pode ser publicado diretamente a partir da branch `main`:

| Serviço | Configuração |
|---|---|
| **Vercel** | Importe `MenesesErick/snake-game` — comando `npm run build`, saída `dist` |
| **Netlify** | Importe `MenesesErick/snake-game` — comando `npm run build`, diretório `dist` |
| **GitHub Pages** | Execute `npm run build` e publique o conteúdo da pasta `dist/` |

## 📝 Licença

Livre para uso pessoal e estudo. Divirta-se! 🎮
