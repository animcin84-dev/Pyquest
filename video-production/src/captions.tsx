import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeOut, theme} from './theme';

type Cue = {from: number; to: number; lines: string[]};

const cues: Cue[] = [
  {from:0,to:131,lines:['Представьте, что Python можно учить','не как учебник,']},
  {from:131,to:244,lines:['а как настоящую игру,','где каждый новый навык — новый уровень.']},
  {from:244,to:353,lines:['Сегодня у новичка есть тысячи видео,','курсов и роликов по программированию.']},
  {from:353,to:392,lines:['Ты смотришь теорию,']},
  {from:392,to:512,lines:['копируешь код, запускаешь его —','и получаешь ошибку.']},
  {from:512,to:587,lines:['И просто не понимаешь,','что делать дальше.']},
  {from:587,to:710,lines:['PyQuest создан для школьников','и начинающих программистов.']},
  {from:710,to:810,lines:['В PyQuest обучение','превращается в квест.']},
  {from:810,to:1033,lines:['Ты проходишь визуальные уроки','и пишешь настоящий Python прямо в браузере.']},
  {from:1033,to:1176,lines:['Запускаешь код,','проходишь тесты']},
  {from:1176,to:1298,lines:['и по шагам видишь, как выполняется программа','и меняются переменные.']},
  {from:1298,to:1368,lines:['А если ты застрял,','подключается AI-ментор.']},
  {from:1368,to:1532,lines:['Он не просто выдаёт готовый ответ —','он даёт подсказку и направление,']},
  {from:1532,to:1668,lines:['помогая самому прийти','к правильному решению.']},
  {from:1668,to:1790,lines:['За прогресс ты каждый раз','получаешь XP и монеты.']},
  {from:1790,to:1923,lines:['Открываешь достижения,','выполняешь ежедневные квесты,']},
  {from:1923,to:2090,lines:['проходишь мини-игры, сражаешься с боссами','и соревнуешься с другими игроками.']},
  {from:2090,to:2319,lines:['И самое главное: это уже не идея на слайде,','а прототип, который мы создали.']},
  {from:2319,to:2464,lines:['Python выполняется прямо в браузере','через Pyodide.']},
  {from:2464,to:2647,lines:['Firebase. Gemini API.','Realtime-механики через Socket.IO.']},
  {from:2647,to:2833,lines:['Моя цель — чтобы первый опыт человека','с программированием вызывал не:']},
  {from:2833,to:2910,lines:['«Это слишком сложно»,']},
  {from:2934,to:3066,lines:['а: «Я хочу пройти','следующий уровень».']},
  {from:3080,to:3129,lines:['PyQuest.','Освой Python, играя.']},
];

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = cues.find((item) => frame >= item.from && frame < item.to);
  if (!cue) return null;
  const p = interpolate(frame, [cue.from, cue.from + 8], [0, 1], {...clamp, easing: easeOut});
  const out = interpolate(frame, [cue.to - 5, cue.to], [1, 0], clamp);
  return (
    <div style={{position:'absolute',left:120,right:120,bottom:42,display:'flex',justifyContent:'center',zIndex:100,pointerEvents:'none',opacity:p*out,transform:`translateY(${12*(1-p)}px)`}}>
      <div style={{maxWidth:1500,padding:'14px 28px 16px',borderRadius:15,background:'rgba(3,3,6,.84)',border:'1px solid rgba(255,255,255,.09)',boxShadow:'0 15px 50px rgba(0,0,0,.36)',fontFamily:theme.body,fontWeight:700,fontSize:56,lineHeight:1.1,letterSpacing:'-.025em',textAlign:'center',color:'#fff'}}>
        {cue.lines.map((line) => <div key={line}>{line}</div>)}
      </div>
    </div>
  );
};
