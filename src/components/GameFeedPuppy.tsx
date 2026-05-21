import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { Volume2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

interface GameFeedPuppyProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

type PuppyState = 'hungry' | 'thirsty' | 'dirty' | 'happy_clean';

const FOOD_ITEMS = [
  { emoji: '🍖', name: 'Yummy Bone' },
  { emoji: '🥩', name: 'Juicy Steak' },
  { emoji: '🍪', name: 'Dog Cookie' },
  { emoji: '🧀', name: 'Tasty Cheese' }
];

const LEVEL_SPECS: Record<number, {
  name: string;
  icon: string;
  feedCountNeeded: number;
  mudSpotsCount: number;
  movementType: 'stationary' | 'slow' | 'wave' | 'bounce';
  speechIntro: string;
}> = {
  1: { name: 'Comfy Bed 🐕', icon: '🐕', feedCountNeeded: 1, mudSpotsCount: 2, movementType: 'stationary', speechIntro: 'Level 1 Easy dog play. Biscuit is sitting still. Feed him 1 delicious snack, water him and sweep 2 mud spots!' },
  2: { name: 'Cozy Yard 🏡', icon: '🏡', feedCountNeeded: 2, mudSpotsCount: 3, movementType: 'slow', speechIntro: 'Level 2 Medium cozy yard! Biscuit is sliding slowly. Feed him 2 snacks, water him, and sweep 3 mud spots!' },
  3: { name: 'Happy Park 🌳', icon: '🌳', feedCountNeeded: 3, mudSpotsCount: 4, movementType: 'wave', speechIntro: 'Level 3 Happy park! Biscuit is sliding in waves! Feed him 3 snacks, water him, and sweep 4 mud spots!' },
  4: { name: 'Energetic Gym ⚡', icon: '⚡', feedCountNeeded: 4, mudSpotsCount: 5, movementType: 'bounce', speechIntro: 'Level 4 Energetic gym! Biscuit is bouncing and hopping! Feed him 4 snacks, water him, and sweep 5 spots!' }
};

const MUD_SPOTS = [
  { id: 1, top: '48%', left: '26%', emoji: '💩' },
  { id: 2, top: '35%', left: '60%', emoji: '💩' },
  { id: 3, top: '65%', left: '42%', emoji: '💩' },
  { id: 4, top: '55%', left: '52%', emoji: '💩' },
  { id: 5, top: '42%', left: '76%', emoji: '💩' }
];

export default function GameFeedPuppy({ onGameComplete, onBack }: GameFeedPuppyProps) {
  const [level, setLevel] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Feed, 1: Water, 2: Scrub, 3: Success
  const [mudCleaned, setMudCleaned] = useState<Record<number, boolean>>({});
  const [dragKey, setDragKey] = useState(0);
  const [isAnimateState, setIsAnimateState] = useState<string>('idle'); // idle, eating, drinking, scrubbing, dancing
  const [score, setScore] = useState<number>(0);
  const [feedCount, setFeedCount] = useState<number>(0);

  const currentSpec = LEVEL_SPECS[level];

  useEffect(() => {
    startStep(0, level);
  }, [level]);

  const startStep = (step: number, activeLevel: number) => {
    setCurrentStep(step);
    setDragKey((k) => k + 1);
    const spec = LEVEL_SPECS[activeLevel];
    
    if (step === 0) {
      setFeedCount(0);
      setScore(0);
      speech.speak(`Let's care for Biscuit on Level ${activeLevel}! Feed him ${spec.feedCountNeeded} treats by sliding them into his mouth!`);
    } else if (step === 1) {
      setScore(10);
      speech.speak("Yum! Biscuit completed eating! He is thirsty now. Drag the blue water bowl to his face!");
    } else if (step === 2) {
      setScore(20);
      
      // Load specific mud elements
      const initialCleaned: Record<number, boolean> = {};
      const targetSpots = MUD_SPOTS.slice(0, spec.mudSpotsCount);
      targetSpots.forEach((spot) => {
        initialCleaned[spot.id] = false;
      });
      setMudCleaned(initialCleaned);
      
      speech.speak(`Oh look! He is muddy! Clean up the ${spec.mudSpotsCount} muddy spots with your special soap sponge! Sweep back and forth!`);
    } else if (step === 3) {
      setScore(30);
      speech.speak("All clean and gorgeous! Biscuit is ready for a dance! Give him a sweet tap on his face with your little finger!");
    }
    synth.playCuteSqueak();
  };

  const repeatInstructions = () => {
    const spec = LEVEL_SPECS[level];
    if (currentStep === 0) {
      const foodName = FOOD_ITEMS[feedCount]?.name || "yummy food";
      speech.speak(`Level ${level}: biscuit is hungry. Feed him ${spec.feedCountNeeded - feedCount} more treats! Drag the ${foodName} into his mouth!`);
    } else if (currentStep === 1) {
      speech.speak("Biscuit is thirsty. Drag the blue water bowl to his face!");
    } else if (currentStep === 2) {
      const remaining = Object.values(mudCleaned).filter(v => !v).length;
      speech.speak(`Sweepy sweepy! Use the wet sponge to clean ${remaining} remaining mud spots!`);
    } else if (currentStep === 3) {
      speech.speak("Biscuit wants to dance! Tap him to get your grand score of 40 points!");
    }
    synth.playTap();
  };

  const checkCollisionStep = (itemType: 'bone' | 'water' | 'sponge', info: any) => {
    const parent = document.getElementById('puppy-board');
    const puppy = document.getElementById('puppy-biscuit');
    if (!parent || !puppy) return;

    const puppyRect = puppy.getBoundingClientRect();
    
    // Find the dragged element to get accurate client center coordinates
    const elId = itemType === 'bone' ? 'drag-food-item' : 'drag-water-bowl';
    const draggedEl = document.getElementById(elId);
    const dragRect = draggedEl ? draggedEl.getBoundingClientRect() : null;

    const dragX = dragRect ? (dragRect.left + dragRect.width / 2) : info.point.x;
    const dragY = dragRect ? (dragRect.top + dragRect.height / 2) : info.point.y;

    const puppyCenterX = puppyRect.left + puppyRect.width / 2;
    const puppyCenterY = puppyRect.top + puppyRect.height * 0.65; // Mouth region is slightly lower

    const distance = Math.sqrt(Math.pow(dragX - puppyCenterX, 2) + Math.pow(dragY - puppyCenterY, 2));

    // Forgiving collision boundary: 95px
    if (distance < 95) {
      if (itemType === 'bone' && currentStep === 0) {
        setIsAnimateState('eating');
        synth.playCuteSqueak();
        
        const currentFood = FOOD_ITEMS[feedCount];
        const nextFeedCount = feedCount + 1;
        setFeedCount(nextFeedCount);
        
        // Progress feeding step based on Level feedCountNeeded
        const spec = LEVEL_SPECS[level];
        
        speech.speak(`Nom nom nom! Biscuit ate the ${currentFood.name}!`);
        
        setTimeout(() => {
          setIsAnimateState('idle');
          if (nextFeedCount < spec.feedCountNeeded && nextFeedCount < FOOD_ITEMS.length) {
            setDragKey((k) => k + 1); // Reset drag positions and load next item
            speech.speak(`Feed him again! Drag the ${FOOD_ITEMS[nextFeedCount].name}!`);
          } else {
            startStep(1, level);
          }
        }, 1800);
      } else if (itemType === 'water' && currentStep === 1) {
        setIsAnimateState('drinking');
        synth.playPop();
        speech.speak("Slurpy slurpy slurp! Thirst quenched!");
        
        setTimeout(() => {
          setIsAnimateState('idle');
          startStep(2, level);
        }, 1800);
      }
    } else {
      setDragKey((k) => k + 1); // Reset drag position
      synth.playTap();
    }
  };

  // Dragging the sponge over Biscuit's mud patches
  const handleSpongeDrag = (e: any, info: any) => {
    if (currentStep !== 2) return;
    setIsAnimateState('scrubbing');

    // Sweep across coordinates of mud patch elements
    const spec = LEVEL_SPECS[level];
    const targetSpots = MUD_SPOTS.slice(0, spec.mudSpotsCount);

    targetSpots.forEach((spot) => {
      if (mudCleaned[spot.id]) return;
      
      const patch = document.getElementById(`mud-patch-${spot.id}`);
      if (!patch) return;

      const patchRect = patch.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(info.point.x - (patchRect.left + patchRect.width / 2), 2) +
        Math.pow(info.point.y - (patchRect.top + patchRect.height / 2), 2)
      );

      if (distance < 55) {
        setMudCleaned((prev) => {
          const updated = { ...prev, [spot.id]: true };
          synth.playPop(); // bubble popping bubble foam sound
          
          const itemsCleaned = Object.keys(updated).filter((k) => updated[Number(k)]).length;
          if (itemsCleaned === spec.mudSpotsCount) {
            synth.playSuccessChime();
            speech.speak("Look at that shiny soft fur! Biscuit is so clean!");
            setTimeout(() => {
              setIsAnimateState('dancing');
              startStep(3, level);
            }, 1000);
          }
          return updated;
        });
      }
    });
  };

  const handleSpongeDragEnd = () => {
    if (currentStep === 2) {
      setIsAnimateState('idle');
    }
  };

  const handlePuppyTap = () => {
    if (currentStep === 3) {
      setIsAnimateState('dancing');
      synth.playWinFanfare();
      setScore(40);
      speech.speak(`Whoof whoof! Biscuit is dancing with joy on Level ${level}! You scored 40 points! Clear another level for more fun!`);
      
      setTimeout(() => {
        setIsAnimateState('idle');
        onGameComplete(40);
      }, 2500);
    } else {
      synth.playCuteSqueak();
    }
  };

  const handleLevelChange = (lvl: number) => {
    synth.playCuteSqueak();
    setLevel(lvl);
  };

  const resetGame = () => {
    setLevel(1);
    setCurrentStep(0);
    setFeedCount(0);
    setScore(0);
    setMudCleaned({});
    setIsAnimateState('idle');
    setDragKey((k) => k + 1);
    startStep(0, 1);
  };

  // Select drifting animations based on Level Specs
  const containerMotion = currentSpec.movementType === 'slow'
    ? { x: [0, 40, -40, 0] }
    : currentSpec.movementType === 'wave'
      ? { x: [0, 75, -75, 0], y: [0, -15, 15, 0] }
      : currentSpec.movementType === 'bounce'
        ? { x: [0, 100, -100, 0], y: [0, -50, 0, -50, 0], rotate: [0, 12, -12, 0] }
        : { x: 0, y: 0 };

  const containerTransition = currentSpec.movementType === 'slow'
    ? { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
    : currentSpec.movementType === 'wave'
      ? { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
      : currentSpec.movementType === 'bounce'
        ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
        : { duration: 0.1 };

  return (
    <div className="w-full flex flex-col items-center select-none" id="puppy-game">
      {/* Header Info & Scoreboard row */}
      <div className="w-full max-w-3xl mb-4 flex flex-col md:flex-row gap-4 items-stretch justify-between">
        {/* Friendly Guide Indicator */}
        <div className="flex-1 bg-rose-100 border-4 border-rose-400 p-3 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Lumi Companion */}
            <motion.button
              id="lumi-companion-puppy"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9, rotate: 10 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              onClick={repeatInstructions}
              className="w-14 h-14 bg-rose-300 rounded-2xl flex items-center justify-center p-2 border-2 border-rose-200 shadow-md cursor-pointer relative"
            >
              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-70" />
              <span className="text-4xl">🐕</span>
            </motion.button>
            
            <div className="text-left">
              <h4 className="text-rose-800 font-sans font-bold text-sm tracking-tight">Puppy Play: Biscuit</h4>
              <p className="text-rose-700/80 text-[11px] font-mono leading-tight">
                Step {currentStep + 1} of 4: {currentStep === 0 ? `Meal Time (${feedCount}/${currentSpec.feedCountNeeded})` : currentStep === 1 ? 'Water Time' : currentStep === 2 ? 'Bubble Spa' : 'Happy Play!'}
              </p>
            </div>
          </div>

          <button 
            id="btn-repeat-instruction-puppy"
            onClick={repeatInstructions}
            className="p-3 bg-white hover:bg-rose-100/50 rounded-xl border border-rose-200 shadow-sm transition-all text-rose-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-rose-500" />
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
      <div className="w-full max-w-3xl mb-4 bg-white border-2 border-dashed border-rose-300 rounded-2xl p-2 flex flex-wrap gap-2 items-center justify-center">
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
                  ? 'bg-rose-500 text-none text-white border-2 border-rose-600 shadow-sm scale-110' 
                  : 'bg-slate-100 hover:bg-rose-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{spec.icon}</span>
              <span>Lvl {lvl}: {spec.name}</span>
            </button>
          );
        })}
      </div>

      <div 
        id="puppy-board"
        className="w-full max-w-3xl min-h-[460px] bg-gradient-to-br from-rose-100 via-pink-100 to-amber-100 border-4 border-pink-300 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden shadow-md"
      >
        {/* Landscape decals */}
        <div className="absolute top-4 left-6 text-3xl select-none opacity-20 pointer-events-none">🌳</div>
        <div className="absolute top-10 right-10 text-4xl select-none opacity-20 pointer-events-none">🌳</div>
        <div className="absolute bottom-4 left-10 text-3xl select-none opacity-20 pointer-events-none">🌸</div>

        {/* Central interactive screen with Biscuit */}
        <div className="w-full flex flex-col items-center justify-center py-4 relative z-10">
          
          {/* Heart bubbles when eating/drinking or happy */}
          <AnimatePresence>
            {(isAnimateState === 'eating' || isAnimateState === 'drinking' || isAnimateState === 'dancing') && (
              <div className="absolute -top-6 flex gap-2">
                {[1, 2, 3].map((heart) => (
                  <motion.span
                    key={heart}
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: -60, opacity: [0, 1, 0], scale: 1.2 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: heart * 0.4 }}
                    className="text-2xl"
                  >
                    ❤️
                  </motion.span>
                ))}
              </div>
            )}
            
            {/* Real scrub bubble lather overlay */}
            {isAnimateState === 'scrubbing' && (
              <div className="absolute top-4 flex gap-4">
                {[1, 2, 3, 4].map((bub) => (
                  <motion.span
                    key={bub}
                    initial={{ y: 0, scale: 0.8 }}
                    animate={{ y: -30, scale: [1, 1.4, 0.8] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: bub * 0.2 }}
                    className="text-2xl text-white/95 text-shadow-md"
                  >
                    🫧
                  </motion.span>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Wrapper Drift/Bounce Div based on Level difficulty specifications */}
          <motion.div
            animate={containerMotion}
            transition={containerTransition}
            className="flex items-center justify-center relative select-none pointer-events-auto"
          >
            {/* Biscuit the Dog SVG (Highly customized/adorable nested states) */}
            <motion.div
              id="puppy-biscuit"
              onClick={handlePuppyTap}
              animate={
                isAnimateState === 'eating' ? { y: [0, -10, 0, -10, 0], rotate: [0, 2, -2, 2, 0] } :
                isAnimateState === 'drinking' ? { y: [0, 5, 0, 5, 0], scaleY: [1, 0.95, 1, 0.95, 1] } :
                isAnimateState === 'scrubbing' ? { rotate: [1, -1, 1, -1, 1], scale: [1.02, 0.98, 1.02] } :
                isAnimateState === 'dancing' ? { y: [0, -30, 0, -30, 0], rotate: [0, 360, 360, 0, 0] } :
                { y: [0, 3, 0] } // gentle idling breathing cycle
              }
              transition={
                isAnimateState === 'dancing' ? { duration: 2.2, repeat: Infinity } :
                isAnimateState === 'idle' ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } :
                { duration: 0.6, repeat: Infinity }
              }
              className="w-56 h-56 relative cursor-pointer md:w-64 md:h-64 flex items-center justify-center select-none"
            >
              {/* Custom vector-drawn happy sweet golden retriever puppy Biscuit! */}
              <svg viewBox="0 0 200 200" className="w-full h-full select-none">
                {/* Ears */}
                <path d="M 40 50 C 15 40 40 120 48 100" fill="#E2A154" stroke="#BD7A2B" strokeWidth="4" strokeLinecap="round" />
                <path d="M 160 50 C 185 40 160 120 152 100" fill="#E2A154" stroke="#BD7A2B" strokeWidth="4" strokeLinecap="round" />

                {/* Cheeks / Head base */}
                <ellipse cx="100" cy="100" rx="63" ry="58" fill="#F4C27F" stroke="#BD7A2B" strokeWidth="4" />

                {/* Eyes */}
                {isAnimateState === 'eating' || isAnimateState === 'scrubbing' ? (
                  // Happy closed crescent squeak eyes
                  <>
                    <path d="M 65 95 Q 75 85 85 95" fill="none" stroke="#5C3A15" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 115 95 Q 125 85 135 95" fill="none" stroke="#5C3A15" strokeWidth="5" strokeLinecap="round" />
                  </>
                ) : (
                  // Big beautiful toddler puppy eyes
                  <>
                    <circle cx="75" cy="95" r="9" fill="#2E1C0C" />
                    <circle cx="72" cy="92" r="3" fill="#FFFFFF" />
                    <circle cx="125" cy="95" r="9" fill="#2E1C0C" />
                    <circle cx="122" cy="92" r="3" fill="#FFFFFF" />
                  </>
                )}

                {/* Muzzle / Nose area */}
                <path d="M 85 110 Q 100 135 115 110" fill="#FCE9D0" stroke="#BD7A2B" strokeWidth="2" />
                <ellipse cx="100" cy="111" rx="10" ry="7" fill="#4B331A" />

                {/* Mouth & Tongue */}
                {isAnimateState === 'eating' ? (
                  // Chewing mouth
                  <ellipse cx="100" cy="125" rx="8" ry="4" fill="#6B0912" />
                ) : isAnimateState === 'drinking' ? (
                  // Slurping circle
                  <circle cx="100" cy="125" r="6" fill="#1E40AF" />
                ) : (
                  // Panting happy classic tongue out
                  <>
                    <path d="M 94 121 Q 100 128 106 121" fill="none" stroke="#2E1C0C" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 96 123 Q 100 142 104 123" fill="#F05252" />
                    <line x1="100" y1="123" x2="100" y2="133" stroke="#9B1C1C" strokeWidth="1.5" />
                  </>
                )}

                {/* Cute puppy spot */}
                <circle cx="60" cy="72" r="14" fill="#E2A154" opacity="0.4" />

                {/* Dog collar medal */}
                <rect x="91" y="152" width="18" height="15" fill="#EF4444" rx="3" stroke="#9B1C1C" strokeWidth="1.5" />
                <circle cx="100" cy="168" r="9" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                <polygon points="100,163 102,167 106,168 103,171 104,175 100,173 96,175 97,171 94,168 98,167" fill="#FFFFFF" />
              </svg>

              {/* Mud overlay spots (to be cleaned in Step 2) */}
              {currentStep === 2 && (
                <div className="absolute inset-0 pointer-events-none select-none">
                  {MUD_SPOTS.slice(0, currentSpec.mudSpotsCount).map((spot) => {
                    if (mudCleaned[spot.id]) return null;
                    return (
                      <div 
                        key={spot.id}
                        id={`mud-patch-${spot.id}`}
                        style={{ top: spot.top, left: spot.left }}
                        className="absolute w-10.5 h-10.5 bg-amber-800/80 rounded-full flex items-center justify-center border-2 border-amber-950/20 font-mono text-[10px] text-white select-none shadow-xs animate-bounce"
                      >
                        💩
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* BOTTOM SHELF: Interactive dragging item tools tray */}
        <div id="puppy-interactive-tray" className="w-full min-h-[140px] bg-white/70 border-t-2 border-rose-100 rounded-2xl flex justify-center items-center p-4 relative z-10 backdrop-blur-xs">
          <AnimatePresence mode="wait">
            {currentStep === 0 && feedCount < FOOD_ITEMS.length && (
              <motion.div
                key={`food-toy-${feedCount}-${dragKey}`}
                id="drag-food-item"
                initial={{ scale: 0, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                drag
                dragSnapToOrigin={true}
                dragElastic={0.5}
                onDragStart={() => synth.playTap()}
                onDragEnd={(e, info) => checkCollisionStep('bone', info)}
                className="w-24 h-24 bg-amber-50 border-2 border-amber-200 shadow-md hover:shadow-lg rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-center"
                style={{ touchAction: 'none' }}
              >
                <span className="text-4xl">{FOOD_ITEMS[feedCount].emoji}</span>
                <span className="text-[10px] font-sans font-extrabold text-amber-800 uppercase tracking-wide px-1 truncate max-w-full">
                  {FOOD_ITEMS[feedCount].name}
                </span>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key={`water-bowl-${dragKey}`}
                id="drag-water-bowl"
                initial={{ scale: 0, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                drag
                dragSnapToOrigin={true}
                dragElastic={0.5}
                onDragStart={() => synth.playTap()}
                onDragEnd={(e, info) => checkCollisionStep('water', info)}
                className="w-24 h-24 bg-sky-50 border-2 border-sky-200 shadow-md hover:shadow-lg rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-center"
                style={{ touchAction: 'none' }}
              >
                <span className="text-4xl">🥣</span>
                <span className="text-[10px] font-sans font-extrabold text-sky-800 uppercase tracking-wide">Cold Water</span>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key={`washing-sponge-${dragKey}`}
                id="drag-soap-sponge"
                initial={{ scale: 0, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                drag
                dragSnapToOrigin={true}
                dragElastic={0.2}
                onDragStart={() => synth.playTap()}
                onDrag={(e, info) => handleSpongeDrag(e, info)}
                onDragEnd={handleSpongeDragEnd}
                className="w-24 h-24 bg-emerald-50 border-2 border-emerald-200 shadow-md hover:shadow-lg rounded-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-center"
                style={{ touchAction: 'none' }}
              >
                <motion.span 
                  animate={{ scale: isAnimateState === 'scrubbing' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-4xl"
                >
                  🧼
                </motion.span>
                <span className="text-[10px] font-sans font-extrabold text-emerald-800 uppercase tracking-wide">Soap Scrub</span>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="flex items-center gap-2 text-rose-600 font-sans font-bold text-lg md:text-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-500 animate-pulse" />
                  <span>Excellent Job! Biscuit is Happy!</span>
                </div>
                <p className="text-slate-500 text-xs mt-1">Tap Biscuit to play with him!</p>
                <button
                  id="btn-play-again-puppy"
                  onClick={resetGame}
                  className="mt-3 px-5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start Again</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
