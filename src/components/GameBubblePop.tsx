import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { Volume2, Sparkles, RefreshCw } from 'lucide-react';

interface GameBubblePopProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

interface Bubble {
  id: number;
  x: number; // horizontal position percentage (5 - 90)
  size: number; // size in px
  colorClass: string;
  shadowClass: string;
  emoji: string;
  delay: number; // animation delay
  speed: number; // animation duration
  noteMultiplier: number; // pitch variations for melodic feedback
}

const BUBBLE_COLORS = [
  { color: 'bg-rose-400 border-rose-300 text-rose-100', shadow: 'shadow-rose-300', emoji: '🎈' },
  { color: 'bg-sky-400 border-sky-300 text-sky-100', shadow: 'shadow-sky-300', emoji: '🫧' },
  { color: 'bg-amber-400 border-amber-300 text-amber-100', shadow: 'shadow-amber-300', emoji: '⭐' },
  { color: 'bg-emerald-400 border-emerald-300 text-emerald-100', shadow: 'shadow-emerald-300', emoji: '🍀' },
  { color: 'bg-purple-400 border-purple-300 text-purple-100', shadow: 'shadow-purple-300', emoji: '🌸' },
  { color: 'bg-orange-400 border-orange-300 text-orange-100', shadow: 'shadow-orange-300', emoji: '🦊' },
];

const LEVEL_SPECS: Record<number, { count: number; sizeMin: number; sizeMax: number; speedMin: number; speedMax: number; name: string; icon: string; speechIntro: string }> = {
  1: { count: 5, sizeMin: 95, sizeMax: 125, speedMin: 9, speedMax: 13, name: 'Easy 👶', icon: '🍃', speechIntro: 'Level 1 Easy bubble pop garden. Very slow and humongous bubbles to tap easily!' },
  2: { count: 7, sizeMin: 75, sizeMax: 95, speedMin: 6, speedMax: 9, name: 'Medium 🌟', icon: '🎈', speechIntro: 'Level 2 Medium bubble pop garden. Shifting bubbles rising gently!' },
  3: { count: 9, sizeMin: 60, sizeMax: 78, speedMin: 4.5, speedMax: 6.5, name: 'Hard 🔥', icon: '⚡', speechIntro: 'Level 3 Hard bubble pop garden. Smaller bubbles floating faster!' },
  4: { count: 12, sizeMin: 45, sizeMax: 60, speedMin: 2.8, speedMax: 4.8, name: 'Super Star 🚀', icon: '✨', speechIntro: 'Level 4 Super Star bubble pop garden! Tiny fast bubbles for lightning hands!' }
};

export default function GameBubblePop({ onGameComplete, onBack }: GameBubblePopProps) {
  const [level, setLevel] = useState<number>(1);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [flowerPetals, setFlowerPetals] = useState<number[]>([]); // 1 to 5 flower growth petals
  const bubbleIdCounter = useRef(0);

  const currentSpec = LEVEL_SPECS[level];
  const score = Math.min(poppedCount * 10, 40);

  // Initialize bubbles whenever level changes
  useEffect(() => {
    const spec = LEVEL_SPECS[level];
    speech.speak(spec.speechIntro);
    synth.playCuteSqueak();
    
    // Create level-specific bubbles
    const initialBubbles = Array.from({ length: spec.count }).map(() => createNewBubble(level));
    setBubbles(initialBubbles);
    setPoppedCount(0);
    setFlowerPetals([]);
  }, [level]);

  useEffect(() => {
    speech.speak("Welcome to the Bubble Pop Garden! Choose your level at the top: Level 1, 2, 3, or 4! Use your finger to tap the floating bubbles and get 40 points to complete each level!");
  }, []);

  const repeatInstructions = () => {
    speech.speak(`You are playing Level ${level} ${currentSpec.name}. How to play: tap or click on any bubble with your sweet finger to hear it pop and watch your flower grow! Score 40 points to win!`);
    synth.playTap();
  };

  const createNewBubble = (currentLevel: number): Bubble => {
    const id = bubbleIdCounter.current++;
    const randomColor = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const spec = LEVEL_SPECS[currentLevel];
    
    return {
      id,
      x: 10 + Math.random() * 80, // Bound within 10-90% to prevent offscreen clipping
      size: spec.sizeMin + Math.random() * (spec.sizeMax - spec.sizeMin), 
      colorClass: randomColor.color,
      shadowClass: randomColor.shadow,
      emoji: randomColor.emoji,
      delay: Math.random() * 1.5,
      speed: spec.speedMin + Math.random() * (spec.speedMax - spec.speedMin), 
      noteMultiplier: 0.8 + Math.random() * 1.2, // Custom pitch slide parameters
    };
  };

  // When bubbles reach the top undetected, recycle them slowly
  const onBubbleMiss = (id: number) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? createNewBubble(level) : b)));
  };

  const handlePop = (id: number, noteMultiplier: number) => {
    synth.playPop();
    synth.playTraceSparkle(noteMultiplier);

    setPoppedCount((prev) => {
      const nextCount = prev + 1;
      
      // Grow our interactive game completion flower
      if (flowerPetals.length < 6) {
        setFlowerPetals((p) => [...p, nextCount]);
      }

      // 4 pops = 40 points (Level complete!)
      if (nextCount === 4) {
        synth.playWinFanfare();
        speech.speak(`Fantastic! You reached 40 points and completed Level ${level}! Try the next level!`);
        
        // Triggers the partial score update to high score saver
        setTimeout(() => {
          onGameComplete(40);
        }, 1200);
      } else if (nextCount < 4) {
        synth.playSuccessChime();
        speech.speak(`Quack! Plus 10 points! ${40 - (nextCount * 10)} more points to complete the level!`);
      } else {
        // Endless pops after completing level
        synth.playPop();
      }
      return nextCount;
    });

    // Replace the popped bubble with a new one at the bottom
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setTimeout(() => {
      setBubbles((prev) => [...prev, createNewBubble(level)]);
    }, 400);
  };

  const handleLevelChange = (newLevel: number) => {
    synth.playSuccessChime();
    setLevel(newLevel);
  };

  const handleGardenReset = () => {
    setPoppedCount(0);
    setFlowerPetals([]);
    const initialBubbles = Array.from({ length: currentSpec.count }).map(() => createNewBubble(level));
    setBubbles(initialBubbles);
    speech.speak(`Restarted Level ${level}! Pop the bubbles to grow a fresh flower!`);
    synth.playSuccessChime();
  };

  return (
    <div className="w-full flex flex-col items-center select-none" id="bubble-game">
      {/* Header Info & Scoreboard row */}
      <div className="w-full max-w-3xl mb-4 flex flex-col md:flex-row gap-4 items-stretch justify-between">
        {/* Friendly Guide Indicator */}
        <div className="flex-1 bg-emerald-100 border-4 border-emerald-400 p-3 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Lumi Companion */}
            <motion.button
              id="lumi-companion-bubble"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9, rotate: -15 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              onClick={repeatInstructions}
              className="w-14 h-14 bg-emerald-400 rounded-2xl flex items-center justify-center p-2 border-2 border-emerald-300 shadow-md cursor-pointer relative"
            >
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-70" />
              <span className="text-4xl">🌻</span>
            </motion.button>
            
            <div>
              <h4 className="text-emerald-800 font-sans font-bold text-sm tracking-tight text-left">Bubble Pop Garden</h4>
              <p className="text-emerald-700/80 text-[11px] font-mono text-left">
                Popped: {poppedCount} {poppedCount === 1 ? 'bubble' : 'bubbles'} ({score}/40 pts)
              </p>
            </div>
          </div>

          <button 
            id="btn-repeat-instruction-bubble"
            onClick={repeatInstructions}
            className="p-3 bg-white hover:bg-emerald-100/50 rounded-xl border border-emerald-200 shadow-sm transition-all text-emerald-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-emerald-500" />
            <span>Speak</span>
          </button>
        </div>

        {/* Dynamic Toddler Scorecard */}
        <div className="bg-pink-100 border-4 border-pink-400 p-3 rounded-2xl shadow-md flex items-center justify-between min-w-[200px] md:w-72">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <h4 className="text-pink-800 font-sans font-bold text-sm tracking-tight text-left">Your Score</h4>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-pink-600 font-sans">{score}</span>
                <span className="text-xs font-extrabold text-pink-500/80">Points</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span 
                key={i} 
                className={`text-xl transition-all duration-300 ${
                  score >= i * 10 ? 'opacity-100 scale-110 filter drop-shadow animate-bounce' : 'opacity-25'
                }`}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Child-friendly Level Selector Row */}
      <div className="w-full max-w-3xl mb-4 bg-white border-2 border-dashed border-sky-300 rounded-2xl p-2 flex flex-wrap gap-2 items-center justify-center">
        <span className="text-xs font-bold text-slate-500 mr-1">Choose Level:</span>
        {[1, 2, 3, 4].map((lvl) => {
          const spec = LEVEL_SPECS[lvl];
          const isActive = level === lvl;
          return (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isActive 
                  ? 'bg-sky-500 text-none text-white border-2 border-sky-600 shadow-sm scale-110' 
                  : 'bg-slate-100 hover:bg-sky-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{spec.icon}</span>
              <span>Lvl {lvl}: {spec.name}</span>
            </button>
          );
        })}
      </div>

      <div 
        id="bubble-stage"
        className="w-full max-w-3xl h-[460px] bg-gradient-to-b from-teal-100 via-sky-100 to-amber-100 border-4 border-emerald-300 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col justify-between"
      >
        {/* Floating clouds / backgrounds */}
        <div className="absolute top-8 left-12 text-6xl opacity-20 pointer-events-none">☁️</div>
        <div className="absolute top-16 right-16 text-5xl opacity-20 pointer-events-none">☁️</div>
        
        {/* Growing reward Flower Visual (Executive mapping of actions -> growth) */}
        <div id="flower-reward-garden" className="absolute bottom-4 right-6 flex flex-col items-center z-10 pointer-events-none bg-white/60 p-3 rounded-2xl border border-amber-100">
          <span className="text-[10px] font-mono text-amber-700 font-bold mb-1 uppercase tracking-wider">My Garden</span>
          <div className="relative w-16 h-20 flex justify-center items-end">
            {/* Green Stem */}
            <div className="w-2.5 h-14 bg-emerald-500 rounded-t-full relative">
              {/* Leaves */}
              {flowerPetals.length >= 2 && (
                <div className="absolute top-5 -left-3 w-4 h-2.5 bg-emerald-400 rounded-full rotate-45" />
              )}
              {flowerPetals.length >= 4 && (
                <div className="absolute top-2 -right-3 w-4 h-2.5 bg-emerald-400 rounded-full -rotate-45" />
              )}
            </div>

            {/* Glowing Flower Crown */}
            {flowerPetals.length > 0 ? (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 0.8 + (flowerPetals.length * 0.1) }}
                className="absolute top-0 w-12 h-12 flex items-center justify-center"
              >
                {/* Petals */}
                <div className="absolute w-10 h-10 bg-rose-400 rounded-full opacity-60 mix-blend-multiply" />
                <div className="absolute w-10 h-10 bg-amber-400 rounded-full opacity-60 mix-blend-multiply rotate-45" />
                <div className="absolute w-10 h-10 bg-sky-400 rounded-full opacity-60 mix-blend-multiply -rotate-45" />
                {/* Flower center seed core */}
                <div className="w-5 h-5 bg-amber-200 border-2 border-amber-400 rounded-full z-10 flex items-center justify-center">
                  <span className="text-[8px]">😊</span>
                </div>
              </motion.div>
            ) : (
              // Empty dirt pot to indicate growth potential
              <div className="absolute bottom-0 w-8 h-4 bg-amber-700/60 rounded-t-lg border-2 border-amber-800/20" />
            )}
          </div>
          <span className="text-[10px] font-sans font-bold text-slate-600 mt-1">
            {flowerPetals.length >= 6 ? 'Fully Grown! 🌸' : 'Pop bubbles to grow!'}
          </span>
        </div>

        {/* Clear/Reset Garden button */}
        {flowerPetals.length >= 6 && (
          <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            id="btn-reset-garden"
            onClick={handleGardenReset}
            className="absolute bottom-4 left-6 z-20 px-4 py-2 bg-amber-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-amber-500"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Grow new flower!</span>
          </motion.button>
        )}

        {/* Bubbles Floating Stream */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence>
            {bubbles.map((bubble) => (
              <motion.button
                key={bubble.id}
                id={`bubble-btn-${bubble.id}`}
                initial={{ y: 480, x: "-50%", opacity: 0, scale: 0.8 }}
                animate={{ 
                  y: -120, 
                  opacity: [0, 1, 1, 0],
                  scale: [0.9, 1, 1.05, 0.9],
                  x: ["-50%", "-25%", "-75%", "-35%", "-50%"]
                }}
                exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.1 } }}
                transition={{ 
                  y: { duration: bubble.speed, delay: bubble.delay, ease: "linear" },
                  opacity: { duration: bubble.speed, delay: bubble.delay, ease: "linear", times: [0, 0.1, 0.85, 1] },
                  scale: { duration: bubble.speed, delay: bubble.delay, ease: "linear" },
                  x: { repeat: Infinity, duration: 3 + Math.random() * 3, ease: "easeInOut" }
                }}
                onAnimationComplete={() => onBubbleMiss(bubble.id)}
                onClick={() => handlePop(bubble.id, bubble.noteMultiplier)}
                className={`absolute rounded-full flex items-center justify-center p-1 border-3 select-none cursor-pointer hover:brightness-105 active:scale-95 shadow-lg ${bubble.colorClass} ${bubble.shadowClass}`}
                style={{ 
                  left: `${bubble.x}%`,
                  width: bubble.size, 
                  height: bubble.size,
                  touchAction: 'none'
                }}
              >
                {/* Shine spark overlay */}
                <span className="absolute top-2 left-2 w-1/3 h-1/3 bg-white/40 rounded-full pointer-events-none filter blur-[1px]" />
                
                {/* Big happy smiley face and emoji floating inside */}
                <div className="flex flex-col items-center">
                  <span className="text-2xl mt-0.5 select-none">{bubble.emoji}</span>
                  {/* Gentle cute eyes */}
                  <div className="flex gap-2.5 mt-1 pointer-events-none">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  </div>
                  {/* Tiny mouth */}
                  <div className="w-2 h-1 border-b border-black rounded-b-full bg-transparent mt-0.5 pointer-events-none" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
