import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeOut, enter, theme} from './theme';

export const Atmosphere: React.FC<{accent?: 'purple'|'blue'; intensity?: number}> = ({accent='purple',intensity=1}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.008) * 22;
  const color = accent === 'purple' ? '139,92,246' : '59,130,246';
  return <AbsoluteFill style={{background:theme.bg,overflow:'hidden'}}>
    <AbsoluteFill style={{backgroundImage:`radial-gradient(circle at ${70+drift*.02}% 30%, rgba(${color},${.22*intensity}), transparent 31%), radial-gradient(circle at 15% 82%, rgba(59,130,246,${.11*intensity}), transparent 28%), linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)`,backgroundSize:'auto,auto,48px 48px,48px 48px'}}/>
    <AbsoluteFill style={{background:'radial-gradient(circle at 50% 46%,transparent 30%,rgba(0,0,0,.72) 100%)'}}/>
    <AbsoluteFill style={{opacity:.045,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.8\'/%3E%3C/svg%3E")'}}/>
  </AbsoluteFill>;
};

export const Eyebrow: React.FC<React.PropsWithChildren<{color?:string}>> = ({children,color=theme.purpleLight}) => <div style={{fontFamily:theme.mono,fontWeight:800,fontSize:18,letterSpacing:'.2em',textTransform:'uppercase',color}}>{children}</div>;

export const Glass: React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>> = ({children,style}) => <div style={{border:'1px solid rgba(255,255,255,.12)',background:'linear-gradient(145deg,rgba(20,19,28,.94),rgba(8,8,12,.92))',boxShadow:'0 34px 100px rgba(0,0,0,.55), 0 0 70px rgba(139,92,246,.08)',borderRadius:28,overflow:'hidden',...style}}>{children}</div>;

export const Speaker: React.FC<{trimBefore:number;mode:'full'|'window';side?:'left'|'right';start?:number}> = ({trimBefore,mode,side='right',start=0}) => {
  const frame=useCurrentFrame();
  const p=enter(frame,start,18);
  if(mode==='full') return <AbsoluteFill style={{opacity:p}}>
    <OffthreadVideo src={staticFile('speaker_clean.mp4')} trimBefore={trimBefore} volume={0} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 45%',transform:'scale(1.07)',filter:'brightness(.79) contrast(1.07) saturate(.84)'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(3,3,5,.91) 0%,rgba(3,3,5,.62) 43%,rgba(3,3,5,.13) 70%),linear-gradient(0deg,rgba(3,3,5,.82),transparent 48%)'}}/>
  </AbsoluteFill>;
  return <Glass style={{position:'absolute',top:178,[side]:106,width:650,height:650,opacity:p,transform:`translateY(${24*(1-p)}px) scale(${.985+.015*p})`}}>
    <OffthreadVideo src={staticFile('speaker_clean.mp4')} trimBefore={trimBefore} volume={0} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 44%',transform:'scale(1.15)',filter:'brightness(.78) contrast(1.07) saturate(.82)'}}/>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(5,5,7,.48),transparent 45%)'}}/>
    <div style={{position:'absolute',left:22,bottom:20,fontFamily:theme.mono,fontSize:14,letterSpacing:'.14em',color:'#c8c3d5'}}>FOUNDER / PYQUEST</div>
  </Glass>;
};

export const ProductFrame: React.FC<{src:string;style?:React.CSSProperties;label?:string;objectPosition?:string}> = ({src,style,label,objectPosition='center'}) => <Glass style={{position:'absolute',...style}}>
  <Img src={staticFile(src)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition}}/>
  {label ? <div style={{position:'absolute',left:20,top:18,padding:'9px 13px',borderRadius:999,background:'rgba(5,5,8,.8)',border:'1px solid rgba(255,255,255,.1)',fontFamily:theme.mono,fontWeight:700,fontSize:14,letterSpacing:'.12em',color:'#d8d3e6'}}>{label}</div>:null}
</Glass>;

export const Tag: React.FC<{children:React.ReactNode;color?:string}> = ({children,color=theme.purple}) => <div style={{display:'inline-flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:999,border:`1px solid ${color}66`,background:`${color}16`,fontFamily:theme.mono,fontWeight:750,fontSize:17,color:'#e9e4f4'}}><span style={{width:8,height:8,borderRadius:99,background:color,boxShadow:`0 0 18px ${color}`}}/>{children}</div>;

export const progress = (frame:number,from:number,to:number) => interpolate(frame,[from,to],[0,1],{...clamp,easing:easeOut});
