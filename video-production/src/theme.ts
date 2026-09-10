import {Easing, interpolate} from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 3129;

export const theme = {
  bg: '#050505',
  surface: '#0d0c13',
  surface2: '#14121c',
  text: '#f5f3fa',
  muted: '#9b98a8',
  purple: '#8B5CF6',
  purpleLight: '#b7a1ff',
  blue: '#3B82F6',
  green: '#34d399',
  red: '#fb7185',
  display: 'Outfit, Inter, Arial, sans-serif',
  body: 'Inter, Arial, sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
} as const;

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const easeOut = Easing.bezier(0.2, 0.78, 0.2, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const enter = (frame: number, from = 0, duration = 20) =>
  interpolate(frame, [from, from + duration], [0, 1], {...clamp, easing: easeOut});

export const exit = (frame: number, at: number, duration = 10) =>
  interpolate(frame, [at, at + duration], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});

export const sceneFrames = {
  hook: [0, 244],
  problem: [244, 587],
  reveal: [587, 1033],
  core: [1033, 1298],
  mentor: [1298, 1668],
  game: [1668, 2090],
  stack: [2090, 2647],
  close: [2647, 3129],
} as const;
