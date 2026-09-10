import React from 'react';
import {Composition} from 'remotion';
import {Pitch} from './Pitch';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './theme';

export const RemotionRoot:React.FC=()=> <>
  <Composition id="PyQuestPitch" component={Pitch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{bgm:true}}/>
  <Composition id="PitchBenchmark" component={Pitch} durationInFrames={600} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{bgm:true}}/>
</>;
