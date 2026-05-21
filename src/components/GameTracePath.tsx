import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { Volume2, RefreshCw, Star } from 'lucide-react';

interface GameTracePathProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

interface Checkpoint {
  id: number;
  x: number; // percentage width
  y: number; // percentage height
  claimed: boolean;
  name: string;
}

const LEVEL_SPECS: Record<number, {
  name: string;
  icon: string;
  riverD: string;          // SVG path d for the river
  riverDotted: string;    // SVG path d for the dotted trail
  points: { id: number; x: number; y: number; name: string }[];
  collisionRadius: number;
  mommyTop: string;
  windForce: number;       // wind drag pushing the duck back
  speechIntro: string;
  hasWaterLilies: boolean;
}> = {
  1: {
    name: 'Gentle Stream 🌊',
    icon: '🌊',
    riverD: 'M 80,240 Q 400,240 720,240',
    riverDotted: 'M 80,240 Q 400,240 720,240',
    points: [
      { id: 1, x: 25, y: 52, name: 'First Flower' },
      { id: 2, x: 42, y: 52, name: 'Second Flower' },
      { id: 3, x: 58, y: 52, name: 'Third Flower' },
      { id: 4, x: 74, y: 52, name: 'Fourth Flower' },
    ],
    collisionRadius: 100,
    mommyTop: '52%',
    windForce: 0,
    speechIntro: 'Level 1 Gentle Stream! The river is straight. Drag the baby chick straight across the flowers with your finger!',
    hasWaterLilies: false
  },
  2: {
    name: 'Wavy River 〰️',
    icon: '〰️',
    riverD: 'M 80,180 Q 200,280 340,180 T 580,280 Q 640,180 720,180',
    riverDotted: 'M 80,180 Q 200,280 340,180 T 580,280 Q 640,180 720,180',
    points: [
      { id: 1, x: 25, y: 54, name: 'First Flower' },
      { id: 2, x: 44, y: 39, name: 'Second Flower' },
      { id: 3, x: 64, y: 63, name: 'Third Flower' },
      { id: 4, x: 78, y: 44, name: 'Fourth Flower' },
    ],
    collisionRadius: 85,
    mommyTop: '39%',
    windForce: 0,
    speechIntro: 'Level 2 Wavy River! Slide the baby chick along the curving wavy blue river path!',
    hasWaterLilies: false
  },
  3: {
    name: 'Curvy Rapids 🌪️',
    icon: '🌪️',
    riverD: 'M 80,140 Q 180,380 320,140 T 560,380 Q 640,165 720,165',
    riverDotted: 'M 80,140 Q 180,380 320,140 T 560,380 Q 640,165 720,165',
    points: [
      { id: 1, x: 23, y: 61, name: 'First Flower' },
      { id: 2, x: 42, y: 32, name: 'Second Flower' },
      { id: 3, x: 62, y: 72, name: 'Third Flower' },
      { id: 4, x: 78, y: 40, name: 'Fourth Flower' },
    ],
    collisionRadius: 75,
    mommyTop: '38%',
    windForce: 0,
    speechIntro: 'Level 3 Curvy Rapids! Watch out for floating water lilies! Wiggle your finger through the curvy path!',
    hasWaterLilies: true
  },
  4: {
    name: 'Stormy Whirlpool ⛈️',
    icon: '⛈️',
    riverD: 'M 80,240 C 220,50 360,420 500,120 T 720,240',
    riverDotted: 'M 80,240 C 220,50 360,420 500,120 T 720,240',
    points: [
      { id: 1, x: 20, y: 44, name: 'First Flower' },
      { id: 2, x: 40, y: 32, name: 'Second Flower' },
      { id: 3, x: 60, y: 68, name: 'Third Flower' },
      { id: 4, x: 76, y: 56, name: 'Fourth Flower' },
    ],
    collisionRadius: 65,
    mommyTop: '55%',
    windForce: 1,
    speechIntro: 'Level 4 Stormy Whirlpool! The river is very wild and wind force is pushing Biscuit back! Be slow and precise!',
    hasWaterLilies: true
  }
};

export default function GameTracePath({ onGameComplete, onBack }: GameTracePathProps) {
  const [level, setLevel] = useState<number>(1);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [dragKey, setDragKey] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const boardRef = React.useRef<HTMLDivElement>(null);
  
  const currentSpec = LEVEL_SPECS[level];
  const score = checkpoints.filter((c) => c.claimed).length * 10;

  useEffect(() => {
    // Reset path checkpoints and state when level switches
    setCheckpoints(
      currentSpec.points.map((p) => ({
        ...p,
        claimed: false
      }))
    );
    setIsSuccess(false);
    setDragKey((k) => k + 1);
    speech.speak(currentSpec.speechIntro);
    synth.playCuteSqueak();
  }, [level]);

  const repeatInstructions = () => {
    speech.speak(`Level ${level}: Drag the baby chick along the blue river path through all 4 flowers to meet Mommy duck!`);
    synth.playTap();
  };

  const handleDuckDrag = (e: any, info: any) => {
    if (isSuccess) return;

    // Board container coordinates
    const board = boardRef.current || document.getElementById('trace-board');
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    
    // Get the dragged baby duck physical center on the screen
    const draggedElement = document.getElementById('baby-duck-draggable');
    const dragRect = draggedElement ? draggedElement.getBoundingClientRect() : null;

    const dragX = dragRect ? (dragRect.left + dragRect.width / 2) : info.point.x;
    const dragY = dragRect ? (dragRect.top + dragRect.height / 2) : info.point.y;

    // Monitor collision against each yellow star flower path checkpoint
    let updated = false;
    const nextCheckpoints = checkpoints.map((chk) => {
      if (chk.claimed) return chk;

      // Map relative coordinates or target element bounding box to physical screen center
      const chkElement = document.getElementById(`flower-checkpoint-${chk.id}`);
      let chkAbsX = boardRect.left + (chk.x / 100) * boardRect.width;
      let chkAbsY = boardRect.top + (chk.y / 100) * boardRect.height;
      if (chkElement) {
        const r = chkElement.getBoundingClientRect();
        chkAbsX = r.left + r.width / 2;
        chkAbsY = r.top + r.height / 2;
      }

      const distance = Math.sqrt(Math.pow(dragX - chkAbsX, 2) + Math.pow(dragY - chkAbsY, 2));

      // Highly forgiving toddler-friendly collision distance defined by active level
      if (distance < currentSpec.collisionRadius) {
        updated = true;
        // Play cute water quack chime
        synth.playTraceSparkle(1 + chk.id * 0.15);
        return { ...chk, claimed: true };
      }
      return chk;
    });

    if (updated) {
      setCheckpoints(nextCheckpoints);

      // Check if they completed all checkpoints
      const allDone = nextCheckpoints.every((c) => c.claimed);
      if (allDone) {
        setIsSuccess(true);
        synth.playWinFanfare();
        speech.speak(`Quack! Quack! Excellent! Baby duck found mommy at Level ${level}! Warm hugs! You scored 40 points!`);
        
        setTimeout(() => {
          onGameComplete(40);
        }, 2500);
      }
    }
  };

  const handleDuckDragEnd = () => {
    synth.playTap();
  };

  const handleLevelChange = (lvl: number) => {
    synth.playCuteSqueak();
    setLevel(lvl);
  };

  const resetGame = () => {
    setLevel(1);
    setIsSuccess(false);
    setDragKey((k) => k + 1);
  };

  return (
    <div className="w-full flex flex-col items-center select-none" id="trace-game">
      {/* Header Info & Scoreboard row */}
      <div className="w-full max-w-3xl mb-4 flex flex-col md:flex-row gap-4 items-stretch justify-between">
        {/* Friendly Guide Indicator */}
        <div className="flex-1 bg-sky-100 border-4 border-sky-400 p-3 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Lumi Companion */}
            <motion.button
              id="lumi-companion-trace"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9, rotate: -15 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              onClick={repeatInstructions}
              className="w-14 h-14 bg-sky-400 rounded-2xl flex items-center justify-center p-2 border-2 border-sky-300 shadow-md cursor-pointer relative"
            >
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-70" />
              <span className="text-4xl">🦆</span>
            </motion.button>
            
            <div className="text-left">
              <h4 className="text-sky-800 font-sans font-bold text-sm tracking-tight">Duck Tracing Path</h4>
              <p className="text-sky-700/80 text-[11px] font-mono leading-none mt-1">
                Flowers: {checkpoints.filter(c => c.claimed).length} of 4 (Level {level})
              </p>
            </div>
          </div>

          <button 
            id="btn-repeat-instruction-trace"
            onClick={repeatInstructions}
            className="p-3 bg-white hover:bg-sky-100/50 rounded-xl border border-sky-200 shadow-sm transition-all text-sky-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-sky-500" />
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
                <span className="text-xs font-extrabold text-pink-500/80">/ 40</span>
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
        ref={boardRef}
        id="trace-board"
        className="w-full max-w-3xl h-[460px] bg-gradient-to-br from-emerald-100 via-sky-100 to-amber-100 border-4 border-sky-300 rounded-3xl p-6 relative overflow-hidden shadow-md select-none"
      >
        {/* River visual ribbon (gorgeous curly path matching Level spec) */}
        <svg className="absolute inset-0 w-full h-full stroke-blue-200/50 fill-none pointer-events-none stroke-[28] stroke-linecap-round stroke-linejoin-round">
          <path d={currentSpec.riverD} />
        </svg>
        <svg className="absolute inset-0 w-full h-full stroke-amber-200/20 fill-none pointer-events-none stroke-[8] stroke-dasharray-[10_10] stroke-linecap-round">
          <path d={currentSpec.riverDotted} />
        </svg>

        {/* Dynamic Water Lilies Decor */}
        {currentSpec.hasWaterLilies && (
          <div className="absolute inset-0 pointer-events-none z-5">
            <motion.div 
              animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute left-[35%] top-[55%] text-4xl select-none opacity-60"
            >
              🪷
            </motion.div>
            <motion.div 
              animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-[65%] top-[25%] text-3xl select-none opacity-60"
            >
              🪷
            </motion.div>
          </div>
        )}

        {/* Checkpoint Flowers (Toddlers tap or drag over them) */}
        {checkpoints.map((chk) => (
          <motion.div
            key={chk.id}
            id={`flower-checkpoint-${chk.id}`}
            style={{ left: `${chk.x}%`, top: `${chk.y}%` }}
            animate={chk.claimed ? { scale: [1, 1.4, 1], rotate: [0, 90, 90] } : { scale: [1, 1.1, 1] }}
            transition={{ repeat: chk.claimed ? 0 : Infinity, duration: 2 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              chk.claimed 
                ? 'bg-amber-400 text-white shadow-md shadow-amber-200 font-bold z-15 border-2 border-white' 
                : 'bg-white border-4 border-dashed border-amber-300 text-amber-500 z-10'
            }`}
          >
            {chk.claimed ? (
              <span className="text-3xl">🌸</span>
            ) : (
              <Star className="w-6 h-6 fill-amber-200 text-amber-400 animate-pulse" />
            )}
          </motion.div>
        ))}

        {/* Mommy Duck (Nest destination on the right, gorgeous size aligned to dynamic endpoint) */}
        <div 
          id="mommy-duck-target"
          style={{ top: currentSpec.mommyTop }}
          className="absolute right-8 translate-y-[-50%] flex flex-col items-center pointer-events-none text-center animate-pulse z-15"
        >
          <div className="relative">
            {isSuccess && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.5, 1], y: [-10, -30, -10] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-10 left-6 text-3xl"
              >
                ❤️
              </motion.span>
            )}
            
            <motion.div
              animate={isSuccess ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-7xl drop-shadow-md select-none touch-none filter saturate-110"
            >
              🦆
            </motion.div>
          </div>
          <span className="bg-emerald-400 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full mt-2 border border-white uppercase shadow-sm">Mommy Duck</span>
        </div>

        {/* Baby Duck (Dragging entity starts on the left) */}
        <AnimatePresence>
          {!isSuccess ? (
            <motion.div
              key={`baby-duck-${dragKey}`}
              id="baby-duck-draggable"
              drag
              dragElastic={0.15}
              dragConstraints={boardRef}
              className="absolute left-[8%] top-[34%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white border border-yellow-200 rounded-3xl flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 active:scale-120 z-20 touch-none select-none"
              style={{ touchAction: 'none' }}
              onDrag={handleDuckDrag}
              onDragEnd={handleDuckDragEnd}
            >
              <div className="relative flex flex-col items-center justify-center select-none">
                {/* Visual indicator highlighting baby scale */}
                <span className="text-5xl select-none filter contrast-125 saturate-125">🐥</span>
                <span className="absolute -top-3 right-0 bg-yellow-400 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full border border-white font-extrabold shadow-xs">Baby</span>
              </div>
            </motion.div>
          ) : (
            // Nestled final animation when baby has successfully made it to mommy
            <motion.div 
              initial={{ x: 30, opacity: 0, scale: 0.5 }}
              animate={{ x: 500, y: 140, opacity: 1, scale: 1.1 }}
              transition={{ duration: 1 }}
              className="absolute left-8 top-[34%] z-20 flex flex-col items-center pointer-events-none font-sans"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-orange-500 font-extrabold text-base tracking-tight">Together! ❤️</span>
                <div className="flex items-center justify-center p-3 bg-white/90 border-2 border-emerald-100 rounded-2xl shadow-md">
                  <span className="text-4xl">🌻</span>
                  <button
                    id="btn-restart-trace"
                    onClick={resetGame}
                    className="ml-3 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer hover:bg-emerald-600 pointer-events-auto shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Play Again</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
