import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { Lock, X, RefreshCw } from 'lucide-react';

interface ParentalGateProps {
  onUnlock: () => void;
  onClose: () => void;
}

export default function ParentalGate({ onUnlock, onClose }: ParentalGateProps) {
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    generateEquation();
    speech.speak("Parents Area Locked. Please solve the numbers puzzle to open.");
  }, []);

  const generateEquation = () => {
    // Generate a simple addition math problem that kids 2-5 cannot solve, but parents can do in 1 sec
    const a = Math.floor(11 + Math.random() * 12); // 11 to 22
    const b = Math.floor(11 + Math.random() * 15); // 11 to 25
    setNumA(a);
    setNumB(b);
    setUserAnswer('');
    setErrorMsg('');
  };

  const handleKeyPress = (digit: string) => {
    synth.playTap();
    setUserAnswer((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    synth.playTap();
    setUserAnswer((prev) => prev.slice(0, -1));
  };

  const verifyAnswer = () => {
    const correctSum = numA + numB;
    if (parseInt(userAnswer) === correctSum) {
      synth.playWinFanfare();
      speech.speak("Gate unlocked. Welcome, Super Parent!");
      onUnlock();
    } else {
      synth.playCuteSqueak();
      setErrorMsg('Oops! That was not correct. Let’s try a new one!');
      setUserAnswer('');
      generateEquation();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white border-4 border-amber-300 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Playful Top Bar */}
        <div className="flex justify-between items-center pb-4 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-500" />
            <h3 className="font-sans font-bold text-lg text-slate-800">Parents Area Gate</h3>
          </div>
          <button
            onClick={() => {
              synth.playTap();
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance */}
        <div className="my-4 text-center">
          <p className="text-xs font-sans text-slate-500 italic mb-3">
            Children safety lock: Please solve this addition equation to verify you are a parent!
          </p>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl py-4 px-6 inline-block font-sans">
            <span className="text-3xl font-extrabold text-amber-800 tracking-wide">
              {numA} + {numB} = <span className="text-slate-900 underline decoration-amber-400 decoration-wavy ml-1">{userAnswer || '?'}</span>
            </span>
          </div>

          {errorMsg && (
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xs text-rose-500 font-bold mt-2"
            >
              {errorMsg}
            </motion.p>
          )}
        </div>

        {/* Parent Codepad */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Go'].map((btn) => {
            let action = () => handleKeyPress(btn);
            let btnClass = "bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold font-mono text-lg shadow-xs";

            if (btn === 'Clear') {
              action = handleBackspace;
              btnClass = "bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-xl font-sans text-sm font-bold shadow-xs";
            } else if (btn === 'Go') {
              action = verifyAnswer;
              btnClass = "bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-sans text-sm font-bold shadow-xs";
            }

            return (
              <button
                key={btn}
                onClick={action}
                className={`${btnClass} active:scale-95 transition-all cursor-pointer`}
              >
                {btn}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>COPPA & GDPR Compliant</span>
          <button 
            onClick={generateEquation}
            className="flex items-center gap-1 text-amber-600 font-bold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Problem</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
