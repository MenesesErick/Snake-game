# 🐍 Cobrinha Arcade

Jogo da cobrinha moderno em **React + TypeScript + Vite + Tailwind CSS**, com tabuleiro claro renderizado em Canvas, controles de teclado e toque, pausa, dificuldades, recorde persistente e um **modo automático** em que a IA joga sozinha até completar o tabuleiro e vencer.

![Status](https://img.shields.io/badge/status-completo-4ADE80?style=flat-square)
![React](https://img.shields.io/badge/React-18-38BDF8?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-FBBF24?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square)

## ✨ Funcionalidades

- **Controles de teclado** — setas ou `WASD` para mover, `Espaço` pausa/começa, `R` reinicia, `M` liga/desliga o som
- **Controles de toque** — deslize no tabuleiro ou use o D-pad na tela (mobile)
- **Pausa e reinício** a qualquer momento, com auto-pausa quando a aba perde o foco
- **3 dificuldades** — Fácil, Normal e Difícil (velocidade e multiplicador de pontos ×1/×2/×3)
- **Pontuação e recorde** persistidos em `localStorage` (com fallback seguro para sandboxes)
- **Modo Automático** 🤖 — a IA segue um *ciclo hamiltoniano* com atalhos gananciosos comprovadamente seguros: ela **nunca bate** e joga até preencher as 324 células do tabuleiro, disparando a tela de **VITÓRIA** com contagem de passos e velocidade ajustável (1×/2×/4×)
- **Juice de arcade** — partículas ao comer, anel de crescimento, flashes de derrota/vitória, sons WebAudio, confete, vaga-lumes e identidade retrô (Press Start 2P + Space Grotesk)
- **Responsivo** — desktop e mobile, com `devicePixelRatio` para canvas nítido

## 🚀 Rodando localmente

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento (http://localhost:3000)
npm run dev

# 3. Build de produção (gera a pasta dist/)
npm run build
```

## 📤 Publicando no GitHub

```bash
git init
git add .
git commit -m "feat: jogo da cobrinha com modo automático (IA hamiltoniana)"

# Crie um repositório vazio no github.com e conecte:
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

> O `.gitignore` já exclui `node_modules/` e `dist/` do versionamento.

### Deploy em 1 clique

| Serviço | Como |
|---|---|
| **Vercel** | Importe o repositório — build `npm run build`, saída `dist` |
| **Netlify** | Mesma configuração acima (detecta Vite automaticamente) |
| **GitHub Pages** | `npm run build` e sirva a pasta `dist` |

## 🧠 Como a IA do modo automático funciona

1. Um **ciclo hamiltoniano** (serpentina fechada) cobre as 18×18 células — percorrê-lo inteiro garante visita a todas sem colisão.
2. A cada passo, a IA avalia os 4 movimentos vizinhos e aceita apenas os que mantêm a **invariante de segurança**: o índice da célula-alvo no ciclo deve permanecer no arco livre entre a cabeça e a cauda — ou seja, ela nunca "ultrapassa" o próprio corpo.
3. Entre os movimentos seguros, escolhe o que **minimiza a distância cíclica até a maçã** (atalhos gananciosos que aceleram muito o jogo).
4. Quando a cobra passa de 50% do tabuleiro, abandona os atalhos e segue o ciclo puro até a vitória garantida.

## 🗂️ Estrutura

```
src/
├── game/
│   ├── types.ts     # tipos, constantes e tabela de dificuldades
│   ├── ai.ts        # ciclo hamiltoniano + decisão segura da IA
│   ├── engine.ts    # estado do jogo, passo, partículas e vitória
│   ├── render.ts    # desenho do tabuleiro, cobra, maçã e efeitos
│   └── audio.ts     # bipes WebAudio (comer, vencer, perder, cliques)
├── App.tsx          # loop de jogo, HUD, overlays, controles
├── main.tsx         # boot com ErrorBoundary (nunca deixa tela em branco)
└── index.css        # tema, keyframes e utilitários de UI
```

## 📝 Licença

Livre para uso pessoal e estudo. Divirta-se! 🎮
