import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, Loader2, Bug, Eye, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { TestCase } from '../constants/lessons';
import { CodeVisualizer } from './CodeVisualizer';
import { playSound } from '../utils/sounds';

function debounce(fn: Function, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

interface CodeEditorProps {
  initialCode: string;
  testCases?: (TestCase & { inputValues?: string[] })[];
  onSuccess?: () => void;
  onFailure?: () => void;
  onChange?: (code: string) => void;
  hideControls?: boolean;
  readOnly?: boolean;
  lessonId?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = React.memo(({ 
  initialCode, 
  testCases = [], 
  onSuccess, 
  onFailure,
  onChange,
  hideControls = false,
  readOnly = false,
  lessonId: propLessonId
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[] | null>(null);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'tests' | 'history'>('console');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const [terminalLines, setTerminalLines] = useState<{ type: 'output' | 'input'; text: string }[]>([]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [inputDraft, setInputDraft] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputDraftRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = React.useCallback((editor: any) => {
    editorRef.current = editor;
    
    setTimeout(() => editor.focus(), 100);
  }, []);

  
  useEffect(() => {
    if (initialCode !== code && initialCode !== undefined) {
      setCode(initialCode);
      setTestResults(null);
      setOutput('');
    }
  }, [initialCode]);

  const lastOnChangeRef = useRef(onChange);
  useEffect(() => { lastOnChangeRef.current = onChange; }, [onChange]);

  const debouncedOnChange = useRef(
    debounce((val: string) => {
      if (lastOnChangeRef.current) lastOnChangeRef.current(val);
    }, 500)
  ).current;

  const handleCodeChange = React.useCallback((val: string | undefined) => {
    const newCode = val || '';
    setCode(newCode);
    debouncedOnChange(newCode);
  }, [debouncedOnChange]);

  
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLines, pendingPrompt]);
  
  useEffect(() => { if (pendingPrompt !== null) inputDraftRef.current?.focus(); }, [pendingPrompt]);

  
  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);
  const inputHistoryRef = useRef(inputHistory);
  useEffect(() => { inputHistoryRef.current = inputHistory; }, [inputHistory]);
  const pendingPromptRef = useRef(pendingPrompt);
  useEffect(() => { pendingPromptRef.current = pendingPrompt; }, [pendingPrompt]);

  
  const runSandboxCodeRef = useRef<((inputs: string[]) => Promise<void>) | undefined>(undefined);

  const runSandboxCode = async (inputs: string[]) => {
    if (!pyodide) return;
    const inputJson = JSON.stringify(inputs);
    
    const userCode = codeRef.current;
    const encodedCode = btoa(unescape(encodeURIComponent(userCode)));
    try {
      await pyodide.runPythonAsync(`
import sys, io, builtins, base64

_pending_prompt = None
_pending_output = None

class _NeedsInput(Exception):
    pass

class _MockInput:
    def __init__(self, inputs):
        self.inputs = list(inputs)
        self.idx = 0
    def __call__(self, prompt=""):
        global _pending_prompt, _pending_output
        if self.idx < len(self.inputs):
            val = self.inputs[self.idx]
            self.idx += 1
            sys.stdout.write(str(prompt) + str(val) + "\\n")
            return val
        _pending_prompt = str(prompt)
        _pending_output = sys.stdout.getvalue()
        raise _NeedsInput()

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
builtins.input = _MockInput(${inputJson})

_user_code = base64.b64decode("${encodedCode}").decode("utf-8")
exec(_user_code, {"__name__": "__main__", "__builtins__": builtins})
`);
      const finalOut: string = await pyodide.runPythonAsync('sys.stdout.getvalue()');
      const lines = finalOut.trimEnd().split('\n');
      setTerminalLines(lines.map(t => ({ type: 'output' as const, text: t })));
      setPendingPrompt(null);
      setIsRunning(false);
      if (onSuccess) onSuccess();
    } catch {
      
      let pr: string | null = null;
      let out = '';
      try {
        const hasInput = await pyodide.runPythonAsync('_pending_prompt is not None') as boolean;
        if (hasInput) {
          pr = await pyodide.runPythonAsync('str(_pending_prompt)') as string;
          out = await pyodide.runPythonAsync('str(_pending_output)') as string;
        }
      } catch {  }

      if (pr !== null) {
        const lines = out.trimEnd().split('\n');
        setTerminalLines(lines.map(t => ({ type: 'output' as const, text: t })));
        setPendingPrompt(pr);
        setIsRunning(false);
      } else {
        
        let errLine = 'Ошибка выполнения';
        try { errLine = await pyodide.runPythonAsync('import traceback; traceback.format_exc().strip().split("\\n")[-1]') as string; } catch {  }
        setTerminalLines(prev => [...prev, { type: 'output', text: '' }, { type: 'output', text: '❌ ' + errLine }]);
        setPendingPrompt(null);
        setIsRunning(false);
      }
    }
  };
  runSandboxCodeRef.current = runSandboxCode;

  const submitTerminalInput = React.useCallback(async (answer: string) => {
    if (pendingPromptRef.current === null) return;
    const newLines = [{ type: 'input' as const, text: (pendingPromptRef.current || '') + answer }];
    const newHist = [...inputHistoryRef.current, answer];
    setInputDraft('');
    setInputHistory(newHist);
    setTerminalLines(prev => [...prev, ...newLines]);
    setPendingPrompt(null);
    setIsRunning(true);
    await runSandboxCodeRef.current!(newHist);
  }, []);

  const { setLastCodeResult, saveSubmission, getSubmissions } = useAuth();

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, propLessonId, (testCases[0] as any)?.id]);

  const loadHistory = React.useCallback(async () => {
    const lessonId = propLessonId || (testCases[0] as any)?.id || 'sandbox';
    setIsHistoryLoading(true);
    const history = await getSubmissions(lessonId);
    setSubmissions(history);
    setIsHistoryLoading(false);
  }, [propLessonId, testCases, getSubmissions]);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        if (!(window as any).loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.onload = async () => {
            const py = await (window as any).loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
            });
            (window as any).pyodide = py;
            setPyodide(py);
          };
          document.body.appendChild(script);
        } else {
          const py = await (window as any).loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
          });
          (window as any).pyodide = py;
          setPyodide(py);
        }
      } catch (err) {
        console.error('Failed to load Pyodide', err);
      }
    };
    loadPyodide();
  }, []);

  const runTests = React.useCallback(async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setTestResults(null);
    setOutput('');

    const results: { passed: boolean; message: string }[] = [];
    let allPassed = true;

    
    if (testCases.length === 0) {
      setTerminalLines([]);
      setInputHistory([]);
      setPendingPrompt(null);
      setInputDraft('');
      setActiveTab('console');
      await runSandboxCode([]);
      setIsRunning(false);
      return;
    }

    
    try {
      for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        try {
          
          const inputValuesList = test.inputValues ? JSON.stringify(test.inputValues) : '[]';
          await pyodide.runPythonAsync(`
import sys
import io
import builtins

sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

class MockInput:
    def __init__(self, inputs):
        self.inputs = inputs
        self.index = 0
    def __call__(self, prompt=""):
        if self.index < len(self.inputs):
            val = self.inputs[self.index]
            self.index += 1
            # Do NOT print prompt to sys.stdout to prevent failing expectedOutput matches
            return val
        return ""

builtins.input = MockInput(${inputValuesList})
          `);

          
          await pyodide.runPythonAsync(code);
          
          
          if ((test as any).input) {
             await pyodide.runPythonAsync((test as any).input);
          }

          if (test.assertCode) {
             await pyodide.runPythonAsync(test.assertCode);
          }
          
          
          const actualOutput = await pyodide.runPythonAsync("sys.stdout.getvalue().strip()");
          
          let passed = true;
          let msg = `Тест ${i + 1} пройден: ${test.description || 'Успешно'}`;
          
          if (test.expectedOutput !== undefined && test.expectedOutput !== null) {
              passed = actualOutput === test.expectedOutput.trim();
              if (!passed) {
                  msg = `Тест ${i + 1} провален: ${test.description || ''}. Ожидалось '${test.expectedOutput}', получено '${actualOutput}'`;
              }
          }

          results.push({ passed, message: msg });
          if (!passed) allPassed = false;
        } catch (err: any) {
          allPassed = false;
          results.push({ passed: false, message: `Ошибка в тесте ${i + 1}: ${err.message}` });
        }
      }
      
      setOutput(await pyodide.runPythonAsync("sys.stdout.getvalue()"));
      setTestResults(results);
      
      const lessonId = propLessonId || (testCases[0] as any)?.id || 'sandbox';
      await saveSubmission(lessonId, code, results);

      setLastCodeResult({
        success: allPassed,
        message: allPassed ? 'Отличная работа! Все тесты пройдены.' : 'Есть ошибки в коде. Попробуй еще раз!',
        timestamp: Date.now()
      });

      if (allPassed) {
        if (onSuccess) onSuccess();
      } else {
        if (onFailure) onFailure();
      }
      
    } catch (err: any) {
      allPassed = false;
      
      
      let lineInfo = '';
      try {
        const tb = await pyodide.runPythonAsync('import traceback; traceback.format_exc()') as string;
        const lines = tb.split('\n');
        for (const line of lines) {
          if (line.includes('File "<exec>", line ')) {
             const match = line.match(/line (\d+)/);
             if (match) lineInfo = ` (Строка ${match[1]})`;
          }
        }
      } catch {  }

      const errMsg = `Ошибка: ${err.message}${lineInfo}`;
      results.push({ passed: false, message: errMsg });
      setTestResults(results);
      
      const lessonId = propLessonId || (testCases[0] as any)?.id || 'sandbox';
      await saveSubmission(lessonId, code, results);

      setLastCodeResult({
        success: false,
        message: 'Ошибка при выполнении кода!',
        timestamp: Date.now()
      });
      if (onFailure) onFailure();
    } finally {
      setIsRunning(false);
    }
  }, [pyodide, testCases, code, propLessonId, saveSubmission, setLastCodeResult, onSuccess, onFailure]);

  if (hideControls) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        <Editor
          height="300px"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            readOnly: readOnly
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <CodeVisualizer 
        code={code} 
        isOpen={isVisualizerOpen} 
        onClose={() => setIsVisualizerOpen(false)} 
      />
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col bg-[#1e1e1e]">
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700 z-30">
          <span className="text-sm text-gray-400 font-mono">main.py</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsVisualizerOpen(true)}
              disabled={isRunning || !pyodide}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-1.5 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all border border-blue-500/30"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Trace</span>
            </button>
            <button
              onClick={runTests}
              disabled={isRunning || !pyodide}
              className="flex items-center gap-2 bg-brand-primary text-black px-4 py-1.5 rounded-lg text-[10px] md:text-sm font-black uppercase tracking-widest transition-all hover:scale-105"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? '...' : (testCases.length > 0 ? 'Проверить' : 'Запустить')}</span>
            </button>
          </div>
        </div>
        <div className="h-[400px] md:h-[500px] relative z-0 bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            loading={
              <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#1e1e1e]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <div className="text-white/20 font-mono text-xs animate-pulse">Инициализация редактора...</div>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              padding: { top: 24, bottom: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fixedOverflowWidgets: true,
              renderControlCharacters: true,
              renderLineHighlight: 'all',
              readOnly: readOnly,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              }
            }}
          />
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl z-10 mt-6">
        <div className="flex border-b border-white/10 bg-white/5 justify-between items-center pr-4">
          <div className="flex bg-white/5">
            <button
              onClick={() => {
                setActiveTab('console');
                playSound('click');
              }}
              className={`px-8 py-5 font-mono text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'console' 
                  ? 'text-brand-primary border-b-2 border-brand-primary bg-white/10' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              TERMINAL
            </button>
            {testCases.length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('tests');
                  playSound('click');
                }}
                className={`px-8 py-5 font-mono text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === 'tests' 
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-white/10' 
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                TEST RESULTS
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('history');
                playSound('click');
              }}
              className={`px-8 py-5 font-mono text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'history' 
                  ? 'text-brand-primary border-b-2 border-brand-primary bg-white/10' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              HISTORY
            </button>
          </div>
          {pendingPrompt !== null && (
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
              ⬤ WAITING FOR INPUT
            </span>
          )}
          {isRunning && pendingPrompt === null && (
            <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest animate-pulse">
              ⬤ RUNNING
            </span>
          )}
        </div>

        <div className="h-[280px] relative overflow-hidden bg-[#030303]">
          <AnimatePresence mode="wait">
            {activeTab === 'console' && (
              <motion.div 
                key="console"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 h-full font-mono text-sm overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
              >
                {terminalLines.length === 0 && pendingPrompt === null && !isRunning && (
                  <span className="text-white/20 italic text-xs">Run code to see output...</span>
                )}
                {terminalLines.map((line, i) => (
                  <div key={i} className={`leading-snug whitespace-pre-wrap ${line.type === 'input' ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {line.type === 'input' ? <span className="text-emerald-600 mr-1">▶</span> : null}{line.text}
                  </div>
                ))}
                {pendingPrompt !== null && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-400 whitespace-pre">{pendingPrompt}</span>
                    <input
                      ref={inputDraftRef}
                      type="text"
                      value={inputDraft}
                      onChange={e => setInputDraft(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          await submitTerminalInput(inputDraft);
                        }
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-emerald-300 caret-emerald-400"
                      autoFocus
                    />
                    <span className="text-white/20 text-xs">Press Enter ↵</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </motion.div>
            )}

            {activeTab === 'tests' && (
              <motion.div 
                key="tests"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 h-full overflow-y-auto custom-scrollbar space-y-3"
              >
                {testResults ? testResults.map((res, idx) => (
                  <div key={idx} className={`flex flex-col gap-2 p-4 rounded-2xl border ${res.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <div className="flex items-start gap-4">
                      {res.passed ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                      <span className="leading-snug text-sm font-bold">{res.message}</span>
                    </div>
                    {!res.passed && res.message.includes('Ожидалось') && (
                      <div className="ml-9 p-3 bg-black/40 rounded-xl border border-white/5 space-y-2 font-mono text-xs">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-white/30 uppercase tracking-widest">Expected:</span>
                          <span className="text-emerald-400 whitespace-pre-wrap">{res.message.split('Ожидалось \'')[1]?.split('\', получено')[0]}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-white/30 uppercase tracking-widest">Actual:</span>
                          <span className="text-red-400 whitespace-pre-wrap">{res.message.split('получено \'')[1]?.replace(/'$/, '')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <span className="text-white/30 italic text-sm">Run the code to see test results.</span>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 h-full overflow-y-auto custom-scrollbar space-y-3"
              >
                {isHistoryLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  </div>
                ) : submissions.length > 0 ? (
                  submissions.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCode(sub.code)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-white/60">
                          {new Date(sub.timestamp?.toMillis() || Date.now()).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-white/20 font-mono line-clamp-1">
                          {sub.code.substring(0, 100)}...
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        sub.results.every((r: any) => r.passed) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {sub.results.every((r: any) => r.passed) ? 'SUCCESS' : 'FAILED'}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                    <Clock className="w-8 h-8" />
                    <span className="text-sm italic">История пуста.</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CodeVisualizer
        code={code}
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
      />
    </div>
  );
});
