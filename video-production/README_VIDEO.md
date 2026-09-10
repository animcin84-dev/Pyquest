# PyQuest pitch-film package

This folder contains the complete reproducible edit and motion-design package for the 104.3-second PyQuest competition pitch.

## Deliverables

- `out/final_pitch_1080p.mp4` — normalized delivery encode with music and SFX.
- `out/final_pitch_master.mp4` — direct high-quality Remotion render before delivery loudness normalization.
- `out/final_pitch_nobgm.mp4` — dialogue + SFX version without the music bed.
- `transcript/final_pitch.srt` — Russian subtitles matched to the edited timeline.
- `scene-plan.json` — machine-readable eight-scene plan.
- `analysis/edit-map.json` — source-to-edit keep/remove map.
- `analysis/PHASE_A_AUDIT.md` — product/source audit and truth policy.
- `analysis/final-review.md` — release-candidate QA record and resolved review findings.
- `DESIGN_SPEC.md` — visual and motion system.
- `styleframes/` — HTML/CSS styleframes and captured JPG approvals.
- `src/` — complete Remotion source.
- `out/thumbnail.jpg` — 1920×1080 cover frame.

The original recording at `/home/anim/2026-08-31 21-11-36.mp4` is never modified.

## Project requirements

- Node.js 20+
- FFmpeg/FFprobe
- Chromium available at `/usr/bin/chromium` (or change `--browser-executable`)

Dependencies are pinned in `package.json` / `package-lock.json`.

## Preview

```bash
cd /home/anim/Downloads/PyQuest-main/video-production
npx remotion studio src/index.ts --browser-executable=/usr/bin/chromium
```

Available compositions:

- `PitchBenchmark` — first 20 seconds, used as the approval gate.
- `PyQuestPitch` — full 1920×1080, 30 fps film.

## Render

```bash
npx remotion render src/index.ts PyQuestPitch out/final_pitch_master.mp4 \
  --browser-executable=/usr/bin/chromium \
  --codec=h264 --crf=17 --audio-bitrate=192k --pixel-format=yuv420p --concurrency=8

npx remotion render src/index.ts PyQuestPitch out/final_pitch_nobgm.mp4 \
  --browser-executable=/usr/bin/chromium \
  --props=props-nobgm.json \
  --codec=h264 --crf=17 --audio-bitrate=192k --pixel-format=yuv420p --concurrency=8
```

The delivery file is derived from the master with video stream-copy and a final audio-only loudness pass, so image quality is unchanged:

```bash
ffmpeg -i out/final_pitch_master.mp4 \
  -map 0:v:0 -map 0:a:0 -c:v copy \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 192k \
  -movflags +faststart out/final_pitch_1080p.mp4
```

## Edit structure

1. Hook — Python as a level, not a textbook.
2. Problem — theory → copy → run → error → stuck.
3. Reveal — real Pathways and lesson UI.
4. Core loop — run, test, trace, understand.
5. AI Mentor — direction and hints, not the finished answer.
6. Gamification — XP, coins, achievements, Arcade, bosses.
7. Architecture — working prototype and verified stack.
8. Close — “too hard” becomes “next level.”

## Truth policy

The film deliberately excludes hardcoded home-page counters, duel ratings, tournament participant numbers, and any other prototype value that could be mistaken for traction. Product claims are limited to behavior verified in source or to the founder’s stated goal.

## Audio

Dialogue is a sentence-boundary edit of the original performance, cleaned and normalized. Music/SFX are local assets supplied by the installed video-shotcraft library. See its attribution file at `/home/anim/.codex/skills/video-shotcraft/assets/audio/ATTRIBUTION.md` before commercial release; the bundled tech-house track is marked for license re-verification in that library.

## Known source-product caveats

- The local Vite-only capture session could not load CDN-hosted Pyodide/Monaco runtime assets, so the film uses real stable product captures plus deterministic code/test/trace overlays whose behavior was verified directly in source.
- Boss and duel mechanics are prototype-grade; the film does not describe them as a production Python judge.
- Dependency audit findings belong to the product repository and were not automatically mutated by this video task.
