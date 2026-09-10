# Final review record

## Release candidate

- Master: `out/final_pitch_master.mp4`
- Delivery: `out/final_pitch_1080p.mp4`
- Dialogue + SFX: `out/final_pitch_nobgm.mp4`
- Runtime: 104.3 s, 1920×1080, 30 fps, AAC 48 kHz stereo

## Verification completed

- Remotion composition enumerates successfully (`PyQuestPitch`, 3129 frames).
- Full master was re-rendered from the patched source, then the delivery and no-BGM variants were regenerated from that same master.
- The three deliverables have identical video stream hashes, so audio finishing did not alter picture content.
- Final-frame still is a clean centered PyQuest lockup with no logo/title collision.
- Hook still at 00:03.33 has a single readable textbook card; the earlier crossfade ghosting is removed.
- Delivery audio is AAC 192 kbps with a -1 dBFS true-peak ceiling and web-safe integrated loudness.
- Russian subtitles were regenerated against the final edited timeline and are included as `transcript/final_pitch.srt`.

## Resolved review findings

The first independent pass identified a stale render, a hook double-content crossfade, and a crowded outro. The hook and outro timing were patched in `src/scenes.tsx`; the master was then rendered again and the changed frames were re-inspected.

## Product-truth guardrails

The film uses real stable product captures and source-verified deterministic overlays. Hardcoded traction counters, duel ratings, tournament participant counts, and other potentially misleading prototype values are excluded. The remaining prototype caveats are documented in `README_VIDEO.md`.
