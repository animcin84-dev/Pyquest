import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, StepForward, RotateCcw, Terminal, Variable, Layers, Eye, Code2, Sparkles, X, ChevronRight, ChevronDown } from 'lucide-react';
import { playSound } from '../utils/sounds';
import { toast } from 'sonner';

interface ExecutionStep {
  line: number;
  variables: Record<string, any>;
  output: string;
  event: 'line' | 'call' | 'return' | 'exception';
}

interface CodeVisualizerProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CodeVisualizer: React.FC<CodeVisualizerProps> = ({ code, isOpen, onClose }) => {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  const runVisualization = async () => {
    setIsExecuting(true);
    setIsPlaying(false);
    setError(null);
    setSteps([]);
    setCurrentStepIdx(0);

    try {
      // @ts-ignore
      const pyodide = window.pyodide;
      if (!pyodide) {
        throw new Error('Pyodide not loaded');
      }

      
      const traceScript = `
import sys
import json

class TraceVisualizer:
    def __init__(self):
        self.steps = []
        self.output = []

    def trace_calls(self, frame, event, arg):
        if event == 'line':
            # Capture local variables
            locals_copy = {}
            for k, v in frame.f_locals.items():
                if not k.startswith('__'):
                    try:
                        # Basic serialization
                        if isinstance(v, (int, float, str, bool, list, dict)):
                            locals_copy[k] = v
                        else:
                            locals_copy[k] = str(v)
                    except:
                        locals_copy[k] = "<unserializable>"
            
            self.steps.append({
                "line": frame.f_lineno,
                "variables": locals_copy,
                "event": event
            })
        return self.trace_calls

visualizer = TraceVisualizer()

def run_code():
    code_obj = compile("""${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}\""", '<string>', 'exec')
    sys.settrace(visualizer.trace_calls)
    try:
        exec(code_obj, {})
    finally:
        sys.settrace(None)

run_code()
json.dumps(visualizer.steps)
      `;

      const result = await pyodide.runPythonAsync(traceScript);
      const parsedSteps = JSON.parse(result);
      setSteps(parsedSteps);
      playSound('success');
    } catch (err: any) {
      console.error('Visualization error:', err);
      setError(err.message);
      toast.error('Ошибка визуализации кода');
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    if (isOpen && code && steps.length === 0) {
      runVisualization();
    }
  }, [isOpen, code, steps.length]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && steps.length > 0) {
      if (currentStepIdx >= steps.length - 1) {
        setIsPlaying(false);
      } else {
        interval = setInterval(() => {
          setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1));
        }, playbackSpeed);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIdx, steps.length, playbackSpeed]);

  const currentStep = steps[currentStepIdx];
  const codeLines = code.split('\n');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-6xl glass rounded-[40px] p-0 border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {}
            <div className="p-8 bg-gradient-to-r from-blue-500/20 to-brand-primary/20 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Визуализатор <span className="text-blue-400 italic serif">Trace</span></h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Пошаговое выполнение кода</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Шаг</span>
                  <span className="text-sm font-black text-blue-400">{currentStepIdx + 1} / {steps.length || 1}</span>
                </div>
                <button 
                  onClick={runVisualization}
                  disabled={isExecuting}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-2xl transition-all border border-blue-500/30 group"
                  title="Обновить визуализацию"
                >
                  <RotateCcw className={`w-6 h-6 text-blue-400 ${isExecuting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>
            </div>

            {}
            <div className="flex-grow grid lg:grid-cols-2 gap-0 overflow-hidden">
              {}
              <div className="p-8 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/20">
                <div className="space-y-1 font-mono text-sm">
                  {codeLines.map((line, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-6 p-1 rounded-lg transition-all ${
                        currentStep?.line === i + 1 ? 'bg-blue-500/20 border-l-4 border-blue-500' : 'opacity-60'
                      }`}
                    >
                      <span className="w-6 text-right text-white/20 select-none">{i + 1}</span>
                      <pre className="whitespace-pre-wrap">{line || ' '}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-white/40">
                    <Variable className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Переменные</span>
                  </div>
                  
                  <div className="grid gap-4">
                    {currentStep && Object.keys(currentStep.variables).length > 0 ? (
                      Object.entries(currentStep.variables).map(([name, value]) => (
                        <motion.div 
                          key={name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400">
                              {name[0].toUpperCase()}
                            </div>
                            <span className="font-mono text-sm font-bold text-white/80">{name}</span>
                          </div>
                          <div className="font-mono text-sm text-blue-400 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-white/10 italic text-sm">Нет активных переменных</div>
                    )}
                  </div>
                </div>

                {}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-white/40">
                    <Layers className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Стек вызовов</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs text-white/40">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <ChevronRight className="w-3 h-3" />
                      <span className="font-bold">main()</span>
                    </div>
                    <div className="pl-4 opacity-50">line {currentStep?.line || 1}</div>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="p-8 border-t border-white/10 bg-black/40 flex flex-col gap-4">
              <div className="flex items-center gap-4 w-full">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest min-w-[3rem]">
                  Шаг 0
                </span>
                <input 
                  type="range" 
                  min={0} 
                  max={Math.max(0, steps.length - 1)} 
                  value={currentStepIdx} 
                  onChange={(e) => {
                    setCurrentStepIdx(parseInt(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest min-w-[3rem] text-right">
                  Шаг {Math.max(0, steps.length - 1)}
                </span>
              </div>

              <div className="flex justify-between items-center w-full">
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                    title="В начало"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={steps.length === 0 || currentStepIdx >= steps.length - 1}
                    className={`p-4 rounded-2xl transition-all border shadow-xl flex items-center justify-center gap-2 w-32 ${
                      isPlaying 
                        ? 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isPlaying ? 'Пауза' : 'Авто'}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setCurrentStepIdx(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
                      disabled={currentStepIdx === 0}
                      className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all border border-white/5"
                    >
                      Назад
                    </button>
                    <button 
                      onClick={() => { setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }}
                      disabled={currentStepIdx >= steps.length - 1}
                      className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
                    >
                      Вперёд <StepForward className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <select 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/60 focus:outline-none uppercase tracking-widest"
                  >
                    <option value={2000}>0.5x Скор</option>
                    <option value={1000}>1x Скор</option>
                    <option value={500}>2x Скор</option>
                    <option value={250}>Fast</option>
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  {isExecuting && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Анализ...</span>
                    </div>
                  )}
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                    Trace Engine v1.0
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
