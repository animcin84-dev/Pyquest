# PyQuest pitch film — design specification

## Creative thesis

**Cinematic learning runtime.** The film should feel like a premium developer tool colliding with a progression game: precise, technical, and motivating—never childish. The speaker supplies intent; the real interface supplies proof.

## Look

- Canvas: 1920×1080, 30 fps, near-black `#050505`.
- Primary: PyQuest purple `#8B5CF6`; secondary connector blue `#3B82F6`.
- Success green appears only for passed tests/completed states.
- Typography: Outfit for display, Inter for narrative/UI, JetBrains Mono for code/technical labels. Local/system fallbacks only; no render-time web font dependency.
- Surfaces: dark glass, 1 px cool-white borders, restrained purple bloom, precise shadows.
- Atmosphere stack: subtle grid/mesh, product or speaker, semantic graphics, grade, deterministic grain/vignette.

## Motion grammar

- Main entrances: 18–24 frames, cubic/expo ease-out, simultaneous opacity + position + scale/blur.
- Exits: 8–12 frames, visibly faster than entrances.
- Staggers: 3–6 frames for related elements; no global simultaneous reveal except the architecture connection beat.
- Scale overshoot: normally ≤1.04; XP/coin payoff may reach 1.08 once.
- Holds: at least 15 frames after a dense state; brand sign-off at least 30 frames.
- No linear interpolation for primary motion. Every interpolation clamps both sides.
- Reduced-motion is not relevant to rendered video, but camera motion stays legible and avoids repeated decorative oscillation.

## Speaker treatment

- Hook and final emotional line: full-frame speaker, reframed and graded, with a dark gradient protecting captions and type.
- Problem and AI scenes: speaker in a rounded 16:9 glass window, no fake webcam chrome.
- Core demo, gamification, and architecture: product-first; speaker becomes audio only.

## Shot grammar selected from the validated library

- Hook: `morph-from-primitive` — a textbook/flat lesson primitive becomes an XP level card.
- Problem→product bridge: `line-carry-transition` — the broken copy/run/error path carries forward into the learning loop.
- Core product: `graze-face-tour` — real PyQuest captures as a restrained 2.5D terrain.
- AI Mentor: `ai-stream-response` — answer summary first, guiding evidence/hints afterward.
- Gamification: `deck-deal-flyin` — a smaller, truthful deck of real feature captures/cards accelerates into a progression board.
- Architecture: `integration-hub-map` — one synchronous two-beat connection from PyQuest to Pyodide, Firebase, Gemini, and Socket.IO.
- Outro: `ui-to-brand-morph / icon-flip-bloom` — UI card flips into the PyQuest monogram; per-letter wordmark landing replaces the demo’s known blurred-wordmark weakness.

## Truth and accessibility

- No fake traction, ratings, participant counts, awards, or user claims.
- Captions are Russian, maximum two lines, centered in title-safe lower third, with a dark backing plate.
- Product text is secondary to voiceover; only one readable message is asked of the viewer at a time.
- All claims shown on-screen are tied to verified source or explicitly presented as prototype architecture.
