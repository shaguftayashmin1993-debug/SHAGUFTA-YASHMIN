import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { PlaySession } from '../types';
import { Star, Square, Circle, Triangle, RefreshCw, Sparkles, Volume2 } from 'lucide-react';

interface GameShapeMatchProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

interface MatchingShape {
  id: string;
  name: string;
  colorClass: string;
  glowColor: string;
  icon: React.ComponentType<any>;
  xTarget: number; // Target slots position in layout %
  xSource: number;
}

const SHAPES: MatchingShape[] = [
  { id: 'star', name: 'yellow star', colorClass: 'text-amber-400 fill-amber-300 drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]', glowColor: 'border-amber-300 shadow-amber-200', icon: Star, xTarget: 15, xSource: 20 },
  { id: 'circle', name: 'blue circle', colorClass: 'text-sky-500 fill-sky-300 drop-shadow-[0_4px_10px_rgba(14,165,233,0.4)]', glowColor: 'border-sky-300 shadow-sky-200', icon: Circle, xTarget: 38, xSource: 75 },
  { id: 'square', name: 'green square', colorClass: 'text-emerald-500 fill-emerald-300 drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)]', glowColor: 'border-emerald-300 shadow-emerald-200', icon: Square, xTarget: 62, xSource: 35 },
  { id: 'triangle', name: 'pink triangle', colorClass: 'text-rose-500 fill-rose-300 drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)]', glowColor: 'border-rose-300 shadow-rose-200', icon: Triangle, xTarget: 85, xSource: 60 },
];

const LEVEL_SPECS: Record<number, { name: string; icon: string; snapDist: number; coloredOutlines: boolean; animationType: 'none' | 'float' | 'spin'; speechIntro: string }> = {
  1: { name: 'Easy Cues 🎨', icon: '🎨', snapDist: 100, coloredOutlines: true, animationType: 'none', speechIntro: 'Level 1: Easy matching with bright colored outlines! Match each color to its home!' },
  2: { name: 'Shadow Match 🌑', icon: '🌑', snapDist: 85, coloredOutlines: false, animationType: 'none', speechIntro: 'Level 2: Shadow matching! All outlines are now gray shadows. Match them carefully!' },
  3: { name: 'Wave Drift 🌊', icon: '🌊', snapDist: 72, coloredOutlines: false, animationType: 'float', speechIntro: 'Level 3: Wave match! The shadows are floating up and down. Drag carefully!' },
  4: { name: 'Spin Storm 🌀', icon: '🌀', snapDist: 62, coloredOutlines: false, animationType: 'spin', speechIntro: 'Level 4: Spin Storm! The targets and shapes are spinning around! Good luck!' }
};

export default function GameShapeMatch({ onGameComplete, onBack }: GameShapeMatchProps) {
  const [level, setLevel] = useState<number>(1);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [dragKeys, setDragKeys] = useState<Record<string, number>>({ star: 0, circle: 0, square: 0, triangle: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const [shuffledShapes, setShuffledShapes] = useState<MatchingShape[]>([]);
  const [score, setScore] = useState(0);
  const [wrongMessage, setWrongMessage] = useState<string | null>(null);

  const currentSpec = LEVEL_SPECS[level];

  useEffect(() => {
    setShuffledShapes([...SHAPES].sort(() => Math.random() - 0.5));
    speech.speak("Welcome to the Shape Match game! Tap any level on the top: Level 1, 2, 3, or 4! Match all shapes to get 40 points!");
  }, []);

  // Whenever level changes, reset the game state with specified conditions
  useEffect(() => {
    setMatched({});
    setIsSuccess(false);
    setScore(0);
    setWrongMessage(null);
    setShuffledShapes([...SHAPES].sort(() => Math.random() - 0.5));
    speech.speak(LEVEL_SPECS[level].speechIntro);
    synth.playCuteSqueak();
  }, [level]);

  const repeatInstructions = () => {
    speech.speak(`You are in Level ${level} ${currentSpec.name}. Drag the shapes to their matching shadow spots at the top!`);
    synth.playTap();
  };

  const checkCollision = (shapeId: string, info: any) => {
    const parentElement = document.getElementById('match-board');
    if (!parentElement) return;

    // Get the dragged element physical center on the screen
    const draggedElement = document.getElementById(`drag-${shapeId}`);
    const dragRect = draggedElement ? draggedElement.getBoundingClientRect() : null;

    const dragX = dragRect ? (dragRect.left + dragRect.width / 2) : info.point.x;
    const dragY = dragRect ? (dragRect.top + dragRect.height / 2) : info.point.y;

    let closestShape: MatchingShape | null = null;
    let minDistance = Infinity;

    // Calculate distance to ALL shape target locations
    for (const shape of SHAPES) {
      const targetElement = document.getElementById(`target-${shape.id}`);
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
         const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        const distance = Math.sqrt(Math.pow(dragX - targetCenterX, 2) + Math.pow(dragY - targetCenterY, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestShape = shape;
        }
      }
    }

    // Level-specific toddler-friendly collision distance trigger bounds
    const requiredDistance = LEVEL_SPECS[level].snapDist;

    if (closestShape && minDistance < requiredDistance) {
      if (closestShape.id === shapeId) {
        // CORRECT MATCH!
        setMatched((prev) => {
          const next = { ...prev, [shapeId]: true };
          
          // Count how many matched
          const matchCount = Object.keys(next).filter((k) => next[k]).length;
          const newScore = matchCount * 10;
          setScore(newScore);
          setWrongMessage(null); // Clear wrong message since correctness was achieved

          if (matchCount === SHAPES.length) {
            setIsSuccess(true);
            synth.playWinFanfare();
            setTimeout(() => {
              speech.speak(`Awesome superstar! You completed Level ${level} with 40 points! Clear all levels to be a geometry god!`);
              onGameComplete(40);
            }, 600);
          } else {
            // Speak matched shape name
            const matchedShape = SHAPES.find((s) => s.id === shapeId);
            if (matchedShape) {
              speech.speak(`Hooray! That is the happy ${matchedShape.name}!`);
            }
            synth.playSuccessChime();
          }
          return next;
        });
      } else {
        // INCORRECT MATCH (They dropped it close to a different shape target!)
        synth.playTap(); // Play a harmless bloop sound

        const draggedFriendly = SHAPES.find(s => s.id === shapeId)?.name.split(' ')[1] || 'shape';
        const targetFriendly = closestShape.name.split(' ')[1];
        
        const friendlyMessage = `Oops! That's the outline for the sweet ${targetFriendly}, but you dragged the ${draggedFriendly}! Let's slide the ${draggedFriendly} into its matching spot!`;
        setWrongMessage(friendlyMessage);
        speech.speak(friendlyMessage);
      }
    } else {
      // Slid elsewhere on the screen, just snap back and play neutral sound
      synth.playTap();
    }
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  const resetGame = () => {
    setMatched({});
    setIsSuccess(false);
    setScore(0);
    setWrongMessage(null);
    setDragKeys((keys) => ({
      star: keys.star + 1,
      circle: keys.circle + 1,
      square: keys.square + 1,
      triangle: keys.triangle + 1,
    }));
    setShuffledShapes([...SHAPES].sort(() => Math.random() - 0.5));
    speech.speak(`Restarted Level ${level}! Let's do this!`);
    synth.playCuteSqueak();
  };

  return (
    <div className="w-full flex flex-col items-center select-none" id="match-game">
      {/* Friendly Double Header containing Guide Indicator and Toddler Scoreboard */}
      <div className="w-full max-w-3xl mb-4 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Lumi Star companion card */}
        <div className="flex-1 bg-amber-100 border-4 border-amber-400 p-3 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Lumi Star Buddy */}
            <motion.button
              id="lumi-companion"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9, rotate: 15 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              onClick={repeatInstructions}
              className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center p-2 border-2 border-amber-300 shadow-md cursor-pointer relative"
            >
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-70" />
              <span className="text-4xl text-amber-800">⭐</span>
            </motion.button>
            
            <div className="text-left">
              <h4 className="text-amber-800 font-sans font-bold text-sm tracking-tight">Lumi the Star</h4>
              <p className="text-amber-700/80 text-[11px] font-mono leading-tight">Lvl {level}: {currentSpec.name}</p>
            </div>
          </div>

          <button 
            id="btn-repeat-instruction"
            onClick={repeatInstructions}
            className="p-3 bg-white hover:bg-amber-100/50 rounded-xl border border-amber-200 shadow-sm transition-all text-amber-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-amber-500" />
            <span>Speak</span>
          </button>
        </div>

        {/* Dynamic Toddler Progress Scoreboard */}
        <div className="bg-pink-100 border-4 border-pink-400 p-3 rounded-2xl shadow-md flex items-center justify-between min-w-[200px] md:w-72">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-rose-400 rounded-2xl flex items-center justify-center p-2 border-2 border-rose-300 shadow-md text-3xl">
              🏆
            </div>
            <div className="text-left">
              <h4 className="text-rose-800 font-sans font-bold text-sm tracking-tight">Your Score</h4>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-rose-600 font-sans">{score}</span>
                <span className="text-xs font-extrabold text-rose-500/80">/ 40</span>
              </div>
            </div>
          </div>
          {/* Star sticker achievements */}
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <span 
                key={i} 
                className={`text-xl transition-all duration-300 ${
                  score >= (i + 1) * 10 ? 'opacity-100 scale-110 filter drop-shadow animate-bounce' : 'opacity-25'
                }`}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Child-friendly Level Selector Row */}
      <div className="w-full max-w-3xl mb-4 bg-white border-2 border-dashed border-amber-300 rounded-2xl p-2 flex flex-wrap gap-2 items-center justify-center">
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
                  ? 'bg-amber-400 text-none text-amber-950 border-2 border-amber-500 shadow-sm scale-110' 
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{spec.icon}</span>
              <span>Lvl {lvl}: {spec.name}</span>
            </button>
          );
        })}
      </div>

      <div 
        id="match-board" 
        className="w-full max-w-3xl min-h-[460px] bg-gradient-to-br from-indigo-100 via-sky-100 to-pink-100 border-4 border-dashed border-sky-300 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden shadow-md"
      >
        {/* Sky backdrop graphics */}
        <div className="absolute top-4 left-6 text-sky-200/50 text-4xl select-none">☁️</div>
        <div className="absolute top-12 right-12 text-sky-200/50 text-5xl select-none">☁️</div>
        <div className="absolute bottom-6 left-1/3 text-sky-200/50 text-3xl select-none">☁️</div>

        {/* Target Outline Slots (FORGIVING DROP BOXES) */}
        <div className="w-full flex justify-around items-center pt-8 pb-12 relative z-10">
          {SHAPES.map((shape) => {
            const ShapeIcon = shape.icon;
            const isFinished = matched[shape.id];
            
            // Choose colors based on Level 1 colorful cue setting
            const baseClass = isFinished 
              ? `bg-white border-solid ${shape.glowColor} scale-105 shadow-md` 
              : currentSpec.coloredOutlines
                ? `bg-white/70 ${shape.glowColor} text-${shape.colorClass.split(' ')[0].replace('text-', '')} border-solid border-4 shadow-sm`
                : 'bg-white/40 border-slate-300 text-slate-300 shadow-sm';

            // Select motion style based on Level 3-4 animations
            const moveAnim = isFinished 
              ? {} 
              : currentSpec.animationType === 'float'
                ? { y: [0, -10, 0] }
                : currentSpec.animationType === 'spin'
                  ? { y: [0, -12, 0], rotate: [0, 12, -12, 0] }
                  : {};

            const moveTransit = isFinished 
              ? {} 
              : { repeat: Infinity, duration: 2.2 + Math.random() * 0.4, ease: "easeInOut" };

            return (
              <motion.div
                key={shape.id}
                id={`target-${shape.id}`}
                animate={moveAnim}
                transition={moveTransit}
                className={`w-28 h-28 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center relative transition-all duration-300 ${baseClass}`}
              >
                {isFinished ? (
                  <motion.div
                    initial={{ scale: 0.1, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="flex flex-col items-center relative"
                  >
                    <ShapeIcon className={`w-14 h-14 ${shape.colorClass}`} />
                    
                    {/* Cute cartoon eyes for toddlers to love the shapes! */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3.5 select-none pointer-events-none">
                      <div className="w-2.5 h-2.5 bg-slate-900 rounded-full flex items-center justify-center relative">
                        <div className="w-0.75 h-0.75 bg-white rounded-full absolute top-[1px] left-[1px]" />
                      </div>
                      <div className="w-2.5 h-2.5 bg-slate-900 rounded-full flex items-center justify-center relative">
                        <div className="w-0.75 h-0.75 bg-white rounded-full absolute top-[1px] left-[1px]" />
                      </div>
                    </div>
                    {/* Cute rosy cheeks & BIG happy smiling mouth because it is placed! */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-1 flex flex-col items-center pointer-events-none pb-0.5">
                      <div className="w-3.5 h-2 border-b-2 border-slate-900 rounded-b-full bg-transparent" />
                      <div className="flex justify-between w-full -mt-0.5 px-0.5">
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Little "YAY" label under the shape */}
                    <span className="text-[10px] font-sans font-black text-emerald-600 mt-1 uppercase tracking-tight">Matched!</span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center opacity-70">
                    <ShapeIcon className={`w-16 h-16 stroke-[2.5] ${currentSpec.coloredOutlines ? shape.colorClass : 'text-slate-400'}`} />
                    <span className="text-[10px] font-mono mt-1 uppercase tracking-wider text-slate-500 font-extrabold">Match</span>
                  </div>
                )}

                {/* Sparkling particles on target placement */}
                {isFinished && (
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Toddler Wrong-Match Warning Notification */}
        <AnimatePresence>
          {wrongMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-full max-w-xl mx-auto mb-4 bg-amber-50 border-4 border-rose-400 p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3 relative z-30"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🤔</span>
                <div className="text-left">
                  <h5 className="text-rose-600 font-sans font-extrabold text-sm tracking-tight">Let's try again!</h5>
                  <p className="text-rose-800 font-medium text-xs leading-relaxed mt-0.5">{wrongMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setWrongMessage(null)}
                className="p-1 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-extrabold rounded-lg text-xs transition-colors cursor-pointer border border-rose-300"
              >
                Got it
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag Items Tray */}
        <div id="drag-items-tray" className="w-full min-h-[160px] bg-white border-4 border-pink-400 rounded-2xl flex justify-around items-center p-4 relative z-10 shadow-lg">
          {!isSuccess && shuffledShapes.map((shape) => {
            const ShapeIcon = shape.icon;
            const isFinished = matched[shape.id];

            if (isFinished) return null;

            return (
              <motion.div
                id={`drag-${shape.id}`}
                key={`${shape.id}-${dragKeys[shape.id]}`}
                layoutId={`shape-visual-${shape.id}`}
                drag
                dragSnapToOrigin={true}
                dragElastic={0.4}
                onDragStart={() => synth.playTap()}
                onDragEnd={(e, info) => checkCollision(shape.id, info)}
                whileHover={{ scale: 1.15, cursor: 'grab' }}
                whileDrag={{ scale: 1.25, cursor: 'grabbing', zIndex: 100 }}
                className="w-24 h-24 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-md cursor-grab active:shadow-xl select-none"
                style={{ touchAction: 'none' }}
              >
                <div className="flex flex-col items-center relative">
                  <ShapeIcon className={`w-14 h-14 ${shape.colorClass}`} />
                  
                  {/* Cute cartoon eyes for toddlers to love the shapes! */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3.5 select-none touch-none font-sans">
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full flex items-center justify-center relative">
                      <div className="w-0.75 h-0.75 bg-white rounded-full absolute top-[1px] left-[1px]" />
                    </div>
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full flex items-center justify-center relative">
                      <div className="w-0.75 h-0.75 bg-white rounded-full absolute top-[1px] left-[1px]" />
                    </div>
                  </div>
                  {/* Cute rosy cheeks & mouth */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-1 flex flex-col items-center">
                    <div className="w-3 h-2 border-b-2 border-slate-900 rounded-b-full bg-transparent" />
                    <div className="flex justify-between w-full -mt-1 px-1">
                      <div className="w-1.5 h-1 bg-rose-400 rounded-full" />
                      <div className="w-1.5 h-1 bg-rose-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isSuccess && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex flex-col items-center justify-center text-center py-4"
            >
              <h3 className="text-emerald-700 font-sans font-bold text-2xl flex items-center gap-2">
                🌟 Superstar Matcher! 🌟
              </h3>
              <p className="text-emerald-600/80 text-sm font-sans mt-1">Excellent focusing! Every shape is matched!</p>
              
              <button
                id="btn-play-again-shape"
                onClick={resetGame}
                className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-base font-bold rounded-2xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Play Again!</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
