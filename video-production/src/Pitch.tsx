import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Captions} from './captions';
import {CloseScene, CoreScene, GameScene, HookScene, MentorScene, ProblemScene, RevealScene, StackScene} from './scenes';
import {clamp, sceneFrames, theme, TOTAL_FRAMES} from './theme';

export type PitchProps={bgm:boolean};

const sfx=[
  {from:8,src:'transition-soft.mp3',volume:.28,duration:60},
  {from:88,src:'sparkle.mp3',volume:.20,duration:96},
  {from:235,src:'impact-deep-whoosh.mp3',volume:.28,duration:90},
  {from:576,src:'whoosh-big.mp3',volume:.24,duration:90},
  {from:1019,src:'transition-snap.mp3',volume:.34,duration:35},
  {from:1286,src:'transition-soft.mp3',volume:.25,duration:60},
  {from:1652,src:'whoosh-big.mp3',volume:.25,duration:90},
  {from:1762,src:'whoosh-fast.mp3',volume:.20,duration:70},
  {from:2078,src:'paper-page-turn.mp3',volume:.30,duration:40},
  {from:2110,src:'impact-deep-whoosh.mp3',volume:.26,duration:90},
  {from:2370,src:'click-camera.mp3',volume:.34,duration:24},
  {from:2630,src:'riser-cine.mp3',volume:.18,duration:145},
  {from:2930,src:'whoosh-big.mp3',volume:.22,duration:90},
  {from:2990,src:'sparkle.mp3',volume:.24,duration:130},
  {from:3068,src:'impact-deep-whoosh.mp3',volume:.30,duration:61},
] as const;

const AudioTimeline:React.FC<PitchProps>=({bgm})=>{
  const frame=useCurrentFrame();
  const musicVolume=interpolate(frame,[0,28,TOTAL_FRAMES-70,TOTAL_FRAMES-1],[0,.095,.095,0],clamp);
  return <>
    <Audio src={staticFile('speaker_clean.mp4')} volume={1}/>
    {bgm?<Audio src={staticFile('audio/bgm-tech-house.mp3')} volume={musicVolume}/>:null}
    {sfx.map((item,i)=><Sequence key={`${item.src}-${item.from}`} from={item.from} durationInFrames={item.duration} name={`SFX ${i+1} ${item.src}`}><Audio src={staticFile(`audio/${item.src}`)} volume={item.volume}/></Sequence>)}
  </>;
};

export const Pitch:React.FC<PitchProps>=({bgm})=><AbsoluteFill style={{background:theme.bg,color:theme.text}}>
  <Sequence from={sceneFrames.hook[0]} durationInFrames={sceneFrames.hook[1]-sceneFrames.hook[0]} name="01 Hook"><HookScene/></Sequence>
  <Sequence from={sceneFrames.problem[0]} durationInFrames={sceneFrames.problem[1]-sceneFrames.problem[0]} name="02 Problem"><ProblemScene/></Sequence>
  <Sequence from={sceneFrames.reveal[0]} durationInFrames={sceneFrames.reveal[1]-sceneFrames.reveal[0]} name="03 Reveal"><RevealScene/></Sequence>
  <Sequence from={sceneFrames.core[0]} durationInFrames={sceneFrames.core[1]-sceneFrames.core[0]} name="04 Core"><CoreScene/></Sequence>
  <Sequence from={sceneFrames.mentor[0]} durationInFrames={sceneFrames.mentor[1]-sceneFrames.mentor[0]} name="05 AI Mentor"><MentorScene/></Sequence>
  <Sequence from={sceneFrames.game[0]} durationInFrames={sceneFrames.game[1]-sceneFrames.game[0]} name="06 Gamification"><GameScene/></Sequence>
  <Sequence from={sceneFrames.stack[0]} durationInFrames={sceneFrames.stack[1]-sceneFrames.stack[0]} name="07 Architecture"><StackScene/></Sequence>
  <Sequence from={sceneFrames.close[0]} durationInFrames={sceneFrames.close[1]-sceneFrames.close[0]} name="08 Close"><CloseScene/></Sequence>
  <AudioTimeline bgm={bgm}/>
  <Captions/>
</AbsoluteFill>;
