# 😺 CatTetris - Battle Puzzle Royale

Un juego de puzzle battle competitivo inspirado en Tetris con temática de gatos, mecánicas de combate estratégicas y una estética arcade moderna.

## 🎮 Características Principales

### Modos de Juego
- **VS CPU**: Enfréntate a la inteligencia artificial
- **1 VS 1 Local**: Batalla contra un amigo en el mismo dispositivo
- **Ranked**: Modo competitivo con sistema de ranking
- **Modo Caos**: Eventos aleatorios y mecánicas impredecibles
- **Puzzle Challenge**: Resuelve desafíos específicos
- **Co-op Boss**: Dos jugadores contra un jefe gigante

### Mecánicas de Juego

#### Sistema de Ataque
- Limpia líneas para enviar ataques al rival
- 2 líneas = 1 ataque
- 3 líneas = 2 ataques
- 4 líneas (Tetris) = 4 ataques
- Combos añaden ataques extra

#### Hold System
- Guarda una pieza para usarla después
- Solo una pieza en reserva
- Indicador visual en la interfaz

#### Piezas Especiales
- **Cat Bomb** 💣: Elimina bloques cercanos
- **Scratch Piece** ✂️: Rasga fila o columna
- **Sleep Cat** 😴: Bloque pasivo que molesta
- **Lucky Cat** 🍀: Otorga bonus si se coloca bien

#### Poderes Especiales
- **Línea Gratis** 💥: Elimina una línea completa
- **Escudo** 🛡️: Bloquea ataques por 5 segundos
- **Aceleración** ⚡: Acelera la caída del rival
- **Congelar** ❄️: Congela una pieza rival
- **Transformar** ✨: Cambia tu pieza actual

#### Sistema de Remontada
- Barra de poder se llena más rápido cuando vas perdiendo
- "Last Stand Mode" para ataques más fuertes
- Comeback bonus al sobrevivir cadenas de ataques

## 🎯 Controles

### Jugador 1
- **⬅️ ➡️**: Mover pieza izquierda/derecha
- **⬇️**: Acelerar caída
- **ESPACIO / ⬆️**: Rotar pieza
- **SHIFT**: Hard Drop (caída instantánea)
- **C**: Hold (guardar pieza)
- **ESC**: Pausar juego

### Jugador 2 (Modo 1v1 Local)
- **A D**: Mover pieza izquierda/derecha
- **S**: Acelerar caída
- **W**: Rotar pieza
- **Q**: Hard Drop
- **E**: Hold

## 🎨 Personajes

Cada gato tiene su propia personalidad y estilo:

- **Whiskers** 😺: Rápido y ágil, perfecto para combos
- **Shadow** 😼: Especialista en ataques estratégicos
- **Fluffy** 😸: Defensa mejorada, resistente
- **Tiger** 😾: Ataque agresivo, alto riesgo
- **Luna** 😻: Equilibrada, buena para principiantes
- **Midnight** 😿: Maestro de las remontadas

## 🛠️ Tecnologías

- **React 18**: Framework principal
- **TypeScript**: Tipado estático
- **React Router 7**: Navegación y rutas
- **Motion (Framer Motion)**: Animaciones fluidas
- **Tailwind CSS v4**: Estilos y diseño
- **Lucide React**: Iconos
- **Canvas Confetti**: Celebraciones visuales

## 🚀 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── game/          # Componentes del juego
│   │   │   ├── GameBoard.tsx
│   │   │   ├── HoldSlot.tsx
│   │   │   ├── NextPieces.tsx
│   │   │   ├── AttackIndicator.tsx
│   │   │   └── ComboDisplay.tsx
│   │   ├── ui/            # Componentes UI reutilizables
│   │   └── TutorialModal.tsx
│   ├── screens/           # Pantallas principales
│   │   ├── MainMenu.tsx
│   │   ├── ModeSelection.tsx
│   │   ├── CharacterSelection.tsx
│   │   ├── GameScreen.tsx
│   │   └── ResultScreen.tsx
│   ├── data/              # Datos del juego
│   │   ├── characters.ts
│   │   └── powers.ts
│   ├── types/             # Definiciones de tipos
│   │   └── game.ts
│   ├── utils/             # Utilidades y lógica
│   │   ├── gameLogic.ts
│   │   └── pieces.ts
│   ├── App.tsx
│   └── routes.tsx
└── styles/                # Estilos globales
```

## 🎮 Diseño y UX

### Identidad Visual
- Estilo arcade moderno
- "Cute but competitive"
- Gatos expresivos sin perder claridad
- Colores vivos y contrastados
- UX limpia y comprensible

### Feedback Visual
- Animaciones de combos
- Efectos de partículas
- Shake en tableros al recibir ataques
- Confetti en victorias
- Indicadores claros de estado

### Responsividad
- Diseño optimizado para desktop
- Interfaz adaptable
- Controles táctiles considerados

## 🏗️ Características Técnicas

### Game Loop
- Ciclo de juego basado en `requestAnimationFrame`
- Drop speed variable según nivel
- Sistema de efectos temporales
- Detección de colisiones precisa

### IA del CPU
- Movimientos aleatorios básicos
- Rotación y posicionamiento
- Escalable para mayor complejidad

### Sistema de Puntuación
- Base score por líneas limpiadas
- Bonus por combos
- Multiplicador por nivel
- Sistema de ataques calculado

## 🎯 Filosofía de Diseño

**Competitivo pero Divertido**
- Mecánicas profundas pero accesibles
- Sistema de remontada para partidas emocionantes
- Visual feedback claro y expresivo
- Balance entre estrategia y caos

**Fácil de Entender, Difícil de Dominar**
- Tutorial completo incluido
- Curva de aprendizaje gradual
- Profundidad estratégica
- Múltiples niveles de skill

## 📝 Notas de Desarrollo

- Todas las piezas especiales tienen efectos visuales únicos
- El sistema de poderes está balanceado para uso estratégico
- Los efectos temporales se manejan con timestamps
- Ghost piece muestra dónde caerá la pieza actual
- Sistema de wall kicks para rotaciones más fluidas

## 🎊 Créditos

Desarrollado como ejemplo de un battle puzzle game moderno con React y TypeScript.

---

**¡Disfruta jugando CatTetris! 😺🎮**
