# PyQuest — Phase A product and footage audit

Date: 2026-08-31

## Executive finding

PyQuest is a working React/Vite prototype with a credible technical core: browser-side Python execution through Pyodide, Monaco-based editing, a line-by-line variable visualizer, Firebase-backed identity and progression, a Gemini-backed mentor endpoint, and Socket.IO realtime infrastructure. The strongest honest pitch is therefore not “a finished learning platform with traction,” but “a playable product prototype whose key learning loop already exists.”

## Verified product surfaces

- Pathways and lesson pages: real route structure and authored lesson content.
- Browser code environment: Monaco editor, stdout/stderr capture, test execution, and run history in `CodeEditor.tsx`.
- Program trace: `CodeVisualizer.tsx` collects per-line local variables with `sys.settrace` and exposes scrub/play controls.
- AI Mentor: frontend calls `/api/mentor/hint`; the server prompt explicitly asks Gemini for guiding hints rather than a finished answer.
- Progression: XP, coins, lessons, inventory, achievements, daily progress, profile state, and related mutations are implemented in Firebase-backed context code.
- Arcade and Boss Arena: real interactive UI exists. Arcade contains several implemented local games. Boss logic is prototype-grade and should not be described as a general Python judge.
- Realtime: Socket.IO server events exist for rooms, code updates, sandbox updates, and duel actions.

## Claims safe to use

- “Write and run real Python in the browser.”
- “See execution step by step and watch variables change.”
- “The AI Mentor guides with hints instead of simply handing over the answer.”
- “Progress can unlock XP, coins, achievements, quests, mini-games, and boss encounters.”
- “The prototype uses Pyodide, Firebase, Gemini API, and Socket.IO.”

## Claims excluded or visually masked

- Home-page counters such as active users, completed quests, or server load: hardcoded display values, not traction.
- Duel wins/rating and tournament participant counts: hardcoded prototype content.
- Any implication that boss or duel code is evaluated by a production-grade Python judging backend.
- Any implication that AI-generated daily quests are always live; the app includes fallbacks.
- Skill Tree footage: the guest route currently errors and is not suitable for the film.

## Repository health

- `npm run lint`: pass.
- `npm run build`: pass.
- Build emits large-chunk warnings and a few mixed lazy/static import warnings; these do not block the film.
- Dependency audit reported 22 known issues. This film does not change production security posture and does not run an automated audit fix.

## Raw footage

- Source: 147.33 s, 1280×720, H.264, 30 fps, AAC 48 kHz stereo.
- Speaker: single low-angle webcam shot with a bright practical/ceiling source behind camera-right.
- Input loudness: approximately -34.9 LUFS integrated, true peak approximately -13 dBTP.
- Editorial treatment: selective full-screen speaker for the opening and close; otherwise use a shaped speaker window beside product-first visuals. Normalize dialogue and apply restrained cleanup.

## Capture policy

Use only real product captures or deterministic editorial reconstructions of states proven by source. No fabricated usage metrics, users, awards, or validation. Loading/error states are excluded from the film.
