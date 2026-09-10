import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Atmosphere, Eyebrow, Glass, ProductFrame, Speaker, Tag, progress} from './primitives';
import {clamp, easeInOut, easeOut, enter, exit, theme} from './theme';

const Title: React.FC<React.PropsWithChildren<{size?:number;style?:React.CSSProperties}>> = ({children,size=84,style}) => <div style={{fontFamily:theme.display,fontSize:size,fontWeight:850,lineHeight:.98,letterSpacing:'-.055em',color:theme.text,...style}}>{children}</div>;

export const HookScene: React.FC = () => {
  const frame=useCurrentFrame();
  const title=enter(frame,10,24);
  const objectIn=enter(frame,35,22);
  const morph=interpolate(frame,[92,118],[0,1],{...clamp,easing:easeInOut});
  const bookOut=interpolate(frame,[92,104],[1,0],{...clamp,easing:Easing.in(Easing.cubic)});
  const levelIn=interpolate(frame,[106,118],[0,1],{...clamp,easing:easeOut});
  const settle=interpolate(frame,[118,136],[0,1],{...clamp,easing:easeOut});
  const breathe=frame>150?1+Math.sin((frame-150)*.045)*.008:1;
  const out=exit(frame,232,12);
  return <AbsoluteFill style={{opacity:out}}>
    <Atmosphere/><Speaker trimBefore={0} mode="full"/>
    <div style={{position:'absolute',left:118,top:110,width:890,opacity:title,transform:`translateY(${24*(1-title)}px)`}}>
      <Eyebrow>PYQUEST / LEVEL 01</Eyebrow>
      <Title style={{marginTop:28}}>НЕ УЧЕБНИК.<br/><span style={{color:theme.purpleLight}}>НОВЫЙ УРОВЕНЬ.</span></Title>
    </div>
    <Glass style={{position:'absolute',right:130,top:164,width:590,height:690,padding:38,opacity:objectIn,transform:`perspective(1200px) translateY(${28*(1-objectIn)}px) rotateY(${-12+7*morph}deg) rotateX(${3-2*morph}deg) scale(${(.96+.04*objectIn)*breathe})`,borderRadius:28+8*(1-morph)}}>
      <div style={{position:'absolute',inset:0,opacity:bookOut,background:'linear-gradient(135deg,#efe9dc,#d9cfbd)',color:'#19151a',padding:'54px 46px'}}>
        <div style={{fontFamily:theme.mono,fontSize:16,letterSpacing:'.14em'}}>CHAPTER 01</div><div style={{fontFamily:'Georgia,serif',fontWeight:700,fontSize:72,lineHeight:1.02,marginTop:62}}>Основы<br/>Python</div>
        {[420,460,390,440,350].map((w,i)=><div key={w+i} style={{height:10,width:w,background:'#8f8475',opacity:.28,borderRadius:8,marginTop:i===0?82:18}}/>) }
      </div>
      <div style={{position:'absolute',inset:0,opacity:levelIn,padding:38,transform:`scale(${.97+.03*settle})`}}>
        <Tag>НАВЫК ОТКРЫТ</Tag><div style={{fontFamily:theme.display,fontWeight:900,fontSize:184,lineHeight:.8,marginTop:98}}>01</div><div style={{fontFamily:theme.display,fontWeight:800,fontSize:44,marginTop:40}}>VARIABLES</div>
        <div style={{height:9,borderRadius:9,background:'#1b1826',marginTop:78}}><div style={{width:`${72*levelIn}%`,height:'100%',borderRadius:9,background:`linear-gradient(90deg,${theme.purple},${theme.blue})`,boxShadow:'0 0 26px rgba(139,92,246,.5)'}}/></div><div style={{fontFamily:theme.mono,fontWeight:650,color:theme.muted,fontSize:17,marginTop:17}}>720 / 1000 XP</div>
      </div>
    </Glass>
  </AbsoluteFill>;
};

const FlowNode:React.FC<{label:string;sub:string;x:number;cue:number;error?:boolean}> = ({label,sub,x,cue,error})=>{
  const frame=useCurrentFrame(); const p=enter(frame,cue,15);
  return <div style={{position:'absolute',left:x,top:420,width:270,height:150,borderRadius:20,border:`1px solid ${error?'rgba(251,113,133,.45)':'rgba(255,255,255,.12)'}`,background:error?'rgba(90,24,39,.34)':'rgba(18,17,25,.92)',boxShadow:error?'0 24px 70px rgba(251,113,133,.1)':'0 24px 70px rgba(0,0,0,.35)',padding:'26px 24px',opacity:p,transform:`translateY(${24*(1-p)}px) scale(${.97+.03*p})`}}><div style={{fontFamily:theme.display,fontSize:28,fontWeight:800,color:error?theme.red:theme.text}}>{label}</div><div style={{fontFamily:theme.mono,fontSize:14,color:theme.muted,marginTop:12,lineHeight:1.35}}>{sub}</div></div>;
};

export const ProblemScene: React.FC = () => {
  const frame=useCurrentFrame(); const heading=enter(frame,6,18); const line=progress(frame,34,126); const breakP=enter(frame,176,10); const out=exit(frame,331,12);
  return <AbsoluteFill style={{opacity:out}}><Atmosphere accent="blue"/><Speaker trimBefore={244} mode="window" side="right" start={4}/>
    <div style={{position:'absolute',left:105,top:108,width:980,opacity:heading,transform:`translateY(${18*(1-heading)}px)`}}><Eyebrow color="#7fb0ff">THE ERROR WALL</Eyebrow><Title size={70} style={{marginTop:22}}>ИНФОРМАЦИИ МНОГО.<br/><span style={{color:'#b7b4c2'}}>ПОНЯТНОСТИ — НЕТ.</span></Title></div>
    <svg width="1140" height="500" style={{position:'absolute',left:55,top:230}}><path d="M165 265 C300 265 300 265 430 265 S700 265 835 265" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5"/><path d="M165 265 C300 265 300 265 430 265 S700 265 835 265" fill="none" stroke={breakP?theme.red:theme.blue} strokeWidth="6" strokeLinecap="round" strokeDasharray="700" strokeDashoffset={700*(1-line)}/>{breakP?<path d="M690 238 l-20 28 24 8-22 32" fill="none" stroke={theme.red} strokeWidth="7" strokeLinecap="round"/>:null}</svg>
    <FlowNode label="СМОТРИШЬ" sub="теория • видео • курс" x={90} cue={28}/><FlowNode label="КОПИРУЕШЬ" sub="чужой код" x={390} cue={70}/><FlowNode label="ЗАПУСКАЕШЬ" sub="python main.py" x={690} cue={112}/><FlowNode label="ОШИБКА" sub="NameError: why?" x={990} cue={164} error/>
    <div style={{position:'absolute',left:92,top:640,width:1000,opacity:enter(frame,208,20)}}><div style={{fontFamily:theme.display,fontWeight:850,fontSize:58,letterSpacing:'-.04em'}}>ЧТО ДЕЛАТЬ ДАЛЬШЕ?</div><div style={{width:interpolate(frame,[226,284],[0,860],{...clamp,easing:easeOut}),height:4,marginTop:18,background:`linear-gradient(90deg,${theme.red},${theme.purple})`,borderRadius:5}}/></div>
  </AbsoluteFill>;
};

export const RevealScene: React.FC = () => {
  const frame=useCurrentFrame(); const brand=enter(frame,0,22); const cam=progress(frame,48,372); const p1=enter(frame,38,24); const p2=enter(frame,116,24); const out=exit(frame,434,12);
  return <AbsoluteFill style={{opacity:out}}><Atmosphere/>
    <div style={{position:'absolute',left:112,top:76,opacity:brand,transform:`translateY(${16*(1-brand)}px)`}}><Eyebrow>REAL PRODUCT / LEARNING PATH</Eyebrow><Title size={68} style={{marginTop:18}}>PYQUEST ПРЕВРАЩАЕТ<br/>ОБУЧЕНИЕ В КВЕСТ</Title></div>
    <div style={{position:'absolute',inset:0,transform:`perspective(1500px) translate3d(${80-150*cam}px,${140-84*cam}px,0) scale(${.82+.13*cam}) rotateX(${7-4*cam}deg) rotateY(${-7+11*cam}deg)`,transformStyle:'preserve-3d'}}>
      <ProductFrame src="captures/pathways.jpg" label="PATHWAYS" style={{left:80,top:268,width:1180,height:664,opacity:p1,transform:`translateZ(${120-80*cam}px) translateY(${34*(1-p1)}px)`}}/>
      <ProductFrame src="captures/lesson-variables.jpg" label="VISUAL LESSON" objectPosition="center 35%" style={{left:1040,top:208,width:760,height:690,opacity:p2,transform:`translateZ(${260-70*cam}px) translateY(${44*(1-p2)}px)`}}/>
    </div>
    <div style={{position:'absolute',right:112,top:88,opacity:enter(frame,232,18)}}><Tag>PYTHON / IN BROWSER</Tag></div>
  </AbsoluteFill>;
};

export const CoreScene: React.FC = () => {
  const frame=useCurrentFrame(); const ui=enter(frame,0,22); const code=enter(frame,34,18); const test=enter(frame,108,16); const trace=enter(frame,168,18); const out=exit(frame,253,12);
  return <AbsoluteFill style={{opacity:out}}><Atmosphere accent="blue"/>
    <div style={{position:'absolute',left:105,top:70,opacity:ui}}><Eyebrow color="#7fb0ff">CORE LOOP / PROOF</Eyebrow><Title size={62} style={{marginTop:17}}>НАПИСАЛ → ЗАПУСТИЛ → ПОНЯЛ</Title></div>
    <ProductFrame src="captures/memory-visualizer.jpg" label="REAL PYQUEST LESSON" style={{left:92,top:218,width:1230,height:692,opacity:ui,transform:`perspective(1300px) rotateY(${5*(1-ui)}deg) scale(${.98+.02*ui})`}}/>
    <Glass style={{position:'absolute',right:92,top:278,width:520,height:520,padding:32,opacity:code,transform:`translateX(${35*(1-code)}px)`}}>
      <Tag color={theme.blue}>LIVE PYTHON</Tag><pre style={{fontFamily:theme.mono,fontWeight:650,fontSize:25,lineHeight:1.7,color:'#e5e1ee',margin:'32px 0 0'}}><span style={{color:'#82aaff'}}>x</span> = <span style={{color:'#f78c6c'}}>10</span>{'\n'}<span style={{color:'#82aaff'}}>y</span> = x + <span style={{color:'#f78c6c'}}>5</span>{'\n'}<span style={{color:'#c792ea'}}>print</span>(y)</pre>
      <div style={{marginTop:24,borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:22,opacity:test,transform:`translateY(${14*(1-test)}px)`}}><Tag color={theme.green}>TESTS PASSED</Tag><div style={{fontFamily:theme.mono,fontSize:21,color:theme.green,marginTop:20}}>✓ output: 15</div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:24,opacity:trace,transform:`translateY(${16*(1-trace)}px)`}}><div style={{padding:16,borderRadius:12,background:'#11101a',fontFamily:theme.mono}}>line <b style={{color:theme.purpleLight}}>02</b></div><div style={{padding:16,borderRadius:12,background:'#11101a',fontFamily:theme.mono}}>x <b style={{color:'#72a7ff'}}>10</b></div></div>
    </Glass>
  </AbsoluteFill>;
};

const HintRow:React.FC<{cue:number;title:string;meta:string;index:number}> = ({cue,title,meta,index})=>{const frame=useCurrentFrame();const p=enter(frame,cue,13);const done=enter(frame,cue+4,8);return <div style={{height:70,borderRadius:14,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.025)',display:'flex',alignItems:'center',padding:'0 20px',gap:15,marginTop:index?10:0,opacity:p,transform:`translateY(${18*(1-p)}px)`,filter:`blur(${5*(1-p)}px)`}}><div style={{width:28,height:28,borderRadius:99,border:`2px solid ${done>.7?theme.green:'rgba(255,255,255,.28)'}`,background:done>.7?theme.green:'transparent',display:'grid',placeItems:'center',color:'#07120d',fontWeight:900}}>✓</div><div style={{fontFamily:theme.body,fontSize:22,fontWeight:650,flex:1}}>{title}</div><div style={{fontFamily:theme.mono,fontSize:15,color:done>.75?'#95ddb9':theme.muted}}>{meta}</div></div>};

export const MentorScene: React.FC = () => {
  const frame=useCurrentFrame();const panel=enter(frame,6,20);const summary=enter(frame,34,16);const pulse=interpolate(frame,[278,284,292],[.2,.7,.2],clamp);const out=exit(frame,358,12);
  const rows=[['Проверь имя переменной','направление'],['Сравни x и total_x','подсказка'],['Запусти тест ещё раз','следующий шаг'],['Объясни результат своими словами','понимание']];
  return <AbsoluteFill style={{opacity:out}}><Atmosphere/><Speaker trimBefore={1298} mode="window" side="left" start={0}/>
    <div style={{position:'absolute',right:100,top:75,width:1040}}><Eyebrow>AI MENTOR / GUIDANCE</Eyebrow><Title size={66} style={{marginTop:18}}>НЕ ГОТОВЫЙ ОТВЕТ.<br/><span style={{color:theme.purpleLight}}>ПРАВИЛЬНОЕ НАПРАВЛЕНИЕ.</span></Title></div>
    <Glass style={{position:'absolute',right:95,top:290,width:1060,height:650,padding:30,opacity:panel,transform:`translateY(${22*(1-panel)}px) scale(${.985+.015*panel})`,border:`1px solid rgba(139,92,246,${pulse})`}}>
      <div style={{height:62,display:'flex',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,.08)',paddingBottom:22}}><div style={{width:42,height:42,borderRadius:13,background:`linear-gradient(145deg,${theme.purple},${theme.blue})`,display:'grid',placeItems:'center',fontFamily:theme.display,fontWeight:900}}>AI</div><div style={{marginLeft:14,fontFamily:theme.display,fontWeight:800,fontSize:25}}>PYQUEST MENTOR</div><div style={{marginLeft:'auto'}}><Tag color={theme.green}>GUIDING MODE</Tag></div></div>
      <div style={{height:120,padding:'24px 4px',opacity:summary,clipPath:`inset(0 ${100*(1-summary)}% 0 0)`}}><div style={{fontFamily:theme.mono,color:theme.muted,fontSize:14,letterSpacing:'.14em'}}>СЛЕДУЮЩИЙ ШАГ</div><div style={{fontFamily:theme.body,fontWeight:720,fontSize:27,lineHeight:1.3,marginTop:11}}>Ошибка рядом с именем переменной. Сравни, что ты объявил и что вызываешь.</div></div>
      <div>{rows.map((r,i)=><HintRow key={r[0]} cue={78+[0,27,50,70][i]} title={r[0]} meta={r[1]} index={i}/>)}</div>
    </Glass>
  </AbsoluteFill>;
};

const gameCards=[
  {src:'captures/arcade.jpg',title:'АРКАДА',tag:'+ XP'},
  {src:'captures/boss-arena.jpg',title:'БОССЫ',tag:'BOSS FIGHT'},
  {src:'captures/pathways.jpg',title:'ПУТИ',tag:'LEVELS'},
  {src:'captures/lesson-variables.jpg',title:'УРОКИ',tag:'SKILLS'},
  {src:'captures/memory-visualizer.jpg',title:'ВИЗУАЛИЗАТОР',tag:'TRACE'},
  {src:'captures/arcade.jpg',title:'МИНИ-ИГРЫ',tag:'DAILY'},
  {src:'captures/boss-arena.jpg',title:'ИСПЫТАНИЯ',tag:'REWARD'},
  {src:'captures/pathways.jpg',title:'ПРОГРЕСС',tag:'XP + COINS'},
  {src:'captures/lesson-variables.jpg',title:'ДОСТИЖЕНИЯ',tag:'UNLOCKED'},
];

export const GameScene: React.FC = () => {
  const frame=useCurrentFrame();const heading=enter(frame,4,18);const orbit=progress(frame,18,90);const dealStart=96;const out=exit(frame,410,12);
  return <AbsoluteFill style={{opacity:out}}><Atmosphere/>
    <div style={{position:'absolute',left:108,top:70,opacity:heading}}><Eyebrow>PROGRESSION / GAME LOOP</Eyebrow><Title size={67} style={{marginTop:17}}>ПРОГРЕСС ДОЛЖЕН<br/><span style={{color:theme.purpleLight}}>ХОТЕТЬСЯ ПРОДОЛЖАТЬ.</span></Title></div>
    <div style={{position:'absolute',right:120,top:88,display:'flex',gap:12,opacity:enter(frame,180,18)}}><Tag>+ XP</Tag><Tag color="#f5b942">+ COINS</Tag><Tag color={theme.green}>ACHIEVEMENT</Tag></div>
    <div style={{position:'absolute',inset:0,perspective:1400,transformStyle:'preserve-3d'}}>
      {gameCards.map((card,i)=>{const row=Math.floor(i/3),col=i%3;const targetX=150+col*550,targetY=300+row*230;const cue=dealStart+Math.round(7*i-.26*i*(i-1));const p=interpolate(frame,[cue,cue+14],[0,1],{...clamp,easing:Easing.bezier(.3,0,.2,1)});const settle=interpolate(frame,[cue+12,cue+20],[0,1],{...clamp,easing:Easing.bezier(.3,0,.25,1.12)});const pileX=1450,pileY=280;const dx=(pileX-targetX)*(1-p),dy=(pileY-targetY)*(1-p);const arc=Math.sin(p*Math.PI)*110;const rot=(((i*7)%9)-4)*2*(1-p);const s=1+Math.sin(p*Math.PI)*.06-.02*(1-settle);return <Glass key={i} style={{position:'absolute',left:targetX,top:targetY,width:500,height:195,opacity:frame<cue?Math.max(.12,orbit):1,transform:`translate3d(${dx}px,${dy}px,${arc+(gameCards.length-i)*3*(1-p)}px) rotateZ(${rot}deg) scale(${s})`,borderRadius:22}}><Img src={staticFile(card.src)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.43) saturate(.78)'}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(5,5,8,.92),rgba(5,5,8,.2))'}}/><div style={{position:'absolute',left:24,top:24,fontFamily:theme.mono,fontSize:14,color:theme.purpleLight,letterSpacing:'.1em'}}>{card.tag}</div><div style={{position:'absolute',left:24,bottom:25,fontFamily:theme.display,fontWeight:850,fontSize:30}}>{card.title}</div></Glass>})}
    </div>
  </AbsoluteFill>;
};

const Node:React.FC<{x:number;y:number;title:string;sub:string;color:string;cue:number}> = ({x,y,title,sub,color,cue})=>{const frame=useCurrentFrame();const p=enter(frame,cue,15);return <Glass style={{position:'absolute',left:x,top:y,width:310,height:130,padding:'24px 25px',opacity:p,transform:`translateY(${22*(1-p)}px) scale(${.96+.04*p})`,border:`1px solid ${color}66`}}><div style={{fontFamily:theme.display,fontWeight:850,fontSize:29,color}}>{title}</div><div style={{fontFamily:theme.mono,fontSize:13,lineHeight:1.4,color:theme.muted,marginTop:10}}>{sub}</div></Glass>};

export const StackScene: React.FC = () => {
  const frame=useCurrentFrame();const proof=enter(frame,0,20);const flip=interpolate(frame,[205,240],[0,180],{...clamp,easing:Easing.out(Easing.cubic)});const flash=interpolate(frame,[211,216,222],[0,1,0],clamp);const nodes=enter(frame,246,14);const pipes=progress(frame,266,285);const out=exit(frame,545,12);
  const paths=[{d:'M960 560 C760 560 710 775 470 775',len:590},{d:'M960 560 C850 590 830 850 730 850',len:400},{d:'M960 560 C1070 590 1090 850 1190 850',len:400},{d:'M960 560 C1160 560 1210 775 1450 775',len:590}];
  return <AbsoluteFill style={{opacity:out}}><Atmosphere/>
    <div style={{position:'absolute',left:108,top:74,opacity:proof}}><Eyebrow>WORKING PROTOTYPE / VERIFIED STACK</Eyebrow><Title size={63} style={{marginTop:17}}>НЕ ИДЕЯ НА СЛАЙДЕ.<br/><span style={{color:theme.purpleLight}}>РАБОЧИЙ ПРОТОТИП.</span></Title></div>
    <div style={{position:'absolute',left:700,top:318,width:520,height:330,perspective:1500,opacity:proof}}><div style={{position:'relative',width:'100%',height:'100%',transformStyle:'preserve-3d',transform:`rotateY(${flip}deg)`}}>
      <Glass style={{position:'absolute',inset:0,backfaceVisibility:'hidden'}}><Img src={staticFile('captures/lesson-variables.jpg')} style={{width:'100%',height:'100%',objectFit:'cover'}}/></Glass>
      <Glass style={{position:'absolute',inset:0,backfaceVisibility:'hidden',transform:'rotateY(180deg)',display:'grid',placeItems:'center',textAlign:'center',border:'1px solid rgba(139,92,246,.5)'}}><div><div style={{fontFamily:theme.display,fontWeight:900,fontSize:90,color:theme.purpleLight}}>PQ</div><div style={{fontFamily:theme.display,fontWeight:850,fontSize:31}}>PYQUEST RUNTIME</div><div style={{fontFamily:theme.mono,fontSize:13,color:theme.muted,marginTop:12}}>LEARN • RUN • TRACE • PROGRESS</div></div></Glass>
    </div></div>
    <svg width="1920" height="1080" style={{position:'absolute',inset:0,opacity:nodes}}><defs><linearGradient id="pipe" x1="0" x2="1"><stop stopColor={theme.purple}/><stop offset="1" stopColor={theme.blue}/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>{paths.map((p,i)=><g key={p.d} filter="url(#glow)"><path d={p.d} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10"/><path d={p.d} fill="none" stroke="url(#pipe)" strokeWidth="6" strokeLinecap="round" strokeDasharray={p.len} strokeDashoffset={p.len*(1-pipes)}/><path d={p.d} fill="none" stroke="white" strokeWidth="3" strokeDasharray="16 48" strokeDashoffset={-Math.max(0,frame-285)*4.6-i*29} opacity={pipes}/></g>)}</svg>
    <div style={{opacity:nodes}}><Node x={300} y={710} title="PYODIDE" sub="PYTHON В БРАУЗЕРЕ" color="#7fb0ff" cue={246}/><Node x={575} y={825} title="FIREBASE" sub="AUTH • DATA • PROGRESS" color="#f5b942" cue={246}/><Node x={1035} y={825} title="GEMINI API" sub="GUIDING HINTS" color="#b79cff" cue={246}/><Node x={1310} y={710} title="SOCKET.IO" sub="REALTIME MECHANICS" color="#63d7dc" cue={246}/></div>
    <AbsoluteFill style={{background:'white',opacity:flash*.78,mixBlendMode:'screen',pointerEvents:'none'}}/>
  </AbsoluteFill>;
};

export const CloseScene: React.FC = () => {
  const frame=useCurrentFrame();const first=enter(frame,4,20)*exit(frame,330,20);const hard=enter(frame,168,14)*exit(frame,250,10);const want=enter(frame,255,18)*exit(frame,330,20);const logo=enter(frame,365,24);const speakerOut=interpolate(frame,[330,382],[1,.12],{...clamp,easing:easeInOut});
  return <AbsoluteFill><Atmosphere/><div style={{opacity:speakerOut}}><Speaker trimBefore={2647} mode="full"/></div>
    <div style={{position:'absolute',left:110,top:105,width:1100,opacity:first,transform:`translateY(${18*(1-first)}px)`}}><Eyebrow>THE FIRST EXPERIENCE MATTERS</Eyebrow><Title size={72} style={{marginTop:22}}>ПЕРВЫЙ ОПЫТ<br/>С ПРОГРАММИРОВАНИЕМ</Title></div>
    <div style={{position:'absolute',left:108,top:525,opacity:hard,filter:`blur(${4*(1-hard)}px)`}}><div style={{fontFamily:theme.display,fontWeight:850,fontSize:76,color:'#b1adb9',textDecoration:'line-through',textDecorationColor:theme.red,textDecorationThickness:5}}>«ЭТО СЛИШКОМ СЛОЖНО»</div></div>
    <div style={{position:'absolute',left:108,top:510,opacity:want,transform:`translateY(${26*(1-want)}px)`}}><div style={{fontFamily:theme.display,fontWeight:900,fontSize:86,lineHeight:1.02,letterSpacing:'-.05em'}}>«Я ХОЧУ ПРОЙТИ<br/><span style={{color:theme.purpleLight}}>СЛЕДУЮЩИЙ УРОВЕНЬ»</span></div></div>
    <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',opacity:logo,transform:`scale(${.9+.1*logo})`,filter:`blur(${12*(1-logo)}px)`}}><div style={{textAlign:'center'}}><div style={{width:160,height:160,borderRadius:44,margin:'0 auto',background:`linear-gradient(145deg,${theme.purple},${theme.blue})`,display:'grid',placeItems:'center',boxShadow:'0 0 100px rgba(139,92,246,.42)',fontFamily:theme.display,fontWeight:950,fontSize:72}}>PQ</div><div style={{fontFamily:theme.display,fontWeight:900,fontSize:88,letterSpacing:'-.055em',marginTop:30}}>PYQUEST</div><div style={{fontFamily:theme.mono,fontWeight:700,fontSize:20,letterSpacing:'.18em',color:theme.purpleLight,marginTop:14}}>ОСВОЙ PYTHON, ИГРАЯ</div></div></div>
  </AbsoluteFill>;
};
