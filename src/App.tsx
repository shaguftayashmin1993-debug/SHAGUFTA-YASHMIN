import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from './utils/audio';
import { GameType, ParentSettings, PlaySession } from './types';
import GameShapeMatch from './components/GameShapeMatch';
import GameBubblePop from './components/GameBubblePop';
import GameFeedPuppy from './components/GameFeedPuppy';
import GameTracePath from './components/GameTracePath';
import ParentalGate from './components/ParentalGate';
import ParentsDashboard from './components/ParentsDashboard';
import { Settings, Volume2, ShieldCheck, Gamepad, Sparkles, Home, ArrowLeft } from 'lucide-react';

const GAMES = [
  {
    id: 'shape-match' as GameType,
    title: 'Shape Match',
    subtitle: 'Match and Snap!',
    icon: '⭐',
    bgColor: 'from-amber-100 to-amber-200/60 hover:from-amber-200 hover:to-amber-300',
    borderColor: 'border-amber-300 text-amber-700',
    description: 'Cognitive Logic: Match colors & happy visual shapes!',
    skills: ['Matching', 'Color recognition', 'Spatial logic']
  },
  {
    id: 'bubble-pop' as GameType,
    title: 'Bubble Pop',
    subtitle: 'Tap the bubs!',
    icon: '🫧',
    bgColor: 'from-emerald-100 to-emerald-200/60 hover:from-emerald-200 hover:to-emerald-300',
    borderColor: 'border-emerald-300 text-emerald-700',
    description: 'Fine Motor skills: Pop cute colorful bubbles!',
    skills: ['Eye-hand coordination', 'Audio play', 'Tapping speed']
  },
  {
    id: 'feed-puppy' as GameType,
    title: 'Feed Biscuit',
    subtitle: 'Cute Puppy Step!',
    icon: '🐕',
    bgColor: 'from-rose-100 to-rose-200/60 hover:from-rose-200 hover:to-rose-300',
    borderColor: 'border-rose-300 text-rose-700',
    description: 'Executive Function: Feed Biscuit, water, & scrub him!',
    skills: ['Sequence comprehension', 'Empathy play', 'Drag & drop']
  },
  {
    id: 'trace-path' as GameType,
    title: 'Duck Trace',
    subtitle: 'Path Finder!',
    icon: '🦆',
    bgColor: 'from-sky-100 to-sky-200/60 hover:from-sky-200 hover:to-sky-300',
    borderColor: 'border-sky-300 text-sky-700',
    description: 'Fine Motor Skills: Help baby duck paddle to mama!',
    skills: ['Path follow', 'Trace discipline', 'Coordination']
  }
];

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  
  // Dashboard & stats local states
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [settings, setSettings] = useState<ParentSettings>({
    voiceEnabled: true,
    musicEnabled: true,
    voiceSpeed: 0.95,
    completedGatesCount: 0
  });

  // Load stats & settings
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('toddler_sessions_v1');
      const storedSettings = localStorage.getItem('toddler_settings_v1');
      
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
        
        // Align Audio engine constraints on boot
        speech.setEnabled(parsedSettings.voiceEnabled);
        speech.setSpeed(parsedSettings.voiceSpeed);
        synth.setMute(!parsedSettings.musicEnabled);
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    }

    // Welcome speech with descriptive how-to play setup
    setTimeout(() => {
      speech.speak("Hello, little superstar! Welcome to the Toddler Learning Garden. Here is how we play: touch any of the big beautiful colorful game boxes with your finger, and we will play a sweet learning game together! Tap one now!");
    }, 600);
  }, []);

  const handleGameSelect = (id: GameType) => {
    synth.playSuccessChime();
    setActiveGame(id);
    
    // Register play session attempt
    const newSession: PlaySession = {
      gameId: id,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      completed: false
    };
    const nextSessions = [...sessions, newSession];
    setSessions(nextSessions);
    localStorage.setItem('toddler_sessions_v1', JSON.stringify(nextSessions));
  };

  const handleGameComplete = (score: number) => {
    // Update last session as complete
    setSessions((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.gameId === activeGame) {
        last.completed = true;
        last.score = score;
      }
      localStorage.setItem('toddler_sessions_v1', JSON.stringify(next));
      return next;
    });
  };

  const updateSettings = (newSettings: ParentSettings) => {
    setSettings(newSettings);
    localStorage.setItem('toddler_settings_v1', JSON.stringify(newSettings));
  };

  const clearStats = () => {
    setSessions([]);
    localStorage.removeItem('toddler_sessions_v1');
  };

  const handleBackToGarden = () => {
    synth.playTap();
    setActiveGame(null);
    speech.speak("Welcome back to the play garden! Let's choose another fun adventure!");
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-800 p-4 md:p-6 flex flex-col justify-between relative overflow-x-hidden selection:bg-amber-100 select-none">
      
      {/* Decorative Garden Ambient Backdrop Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-10 text-8xl animate-pulse">🌸</div>
        <div className="absolute top-12 right-20 text-7xl animate-bounce duration-[4s]">🦋</div>
        <div className="absolute bottom-1/4 right-12 text-8xl animate-pulse">🌼</div>
        <div className="absolute bottom-12 left-16 text-7xl animate-bounce duration-[5s]">🌈</div>
      </div>

      {/* HEADER BAR */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 px-4 bg-white/80 rounded-2xl border border-amber-100 shadow-xs backdrop-blur-md z-30 mb-6">
        <div className="flex items-center gap-3">
          {/* Animated Smiling Sunflower Brand */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="text-4xl select-none"
          >
            🌻
          </motion.div>
          <div>
            <h1 className="font-sans font-black text-xl tracking-tight text-amber-600 flex items-center gap-1.5 leading-none">
              <span>Toddler Garden</span>
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
            </h1>
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-widest leading-none">Ages 2-5 • Brain Academy</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle quick indicator for quick parents control */}
          <button
            onClick={() => {
              const currentMute = !settings.musicEnabled;
              synth.playTap();
              synth.setMute(!currentMute);
              updateSettings({ ...settings, musicEnabled: currentMute });
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              settings.musicEnabled 
                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Secure Parental Gate Trigger (Math block) */}
          <button
            id="parent-gate-launcher"
            onClick={() => {
              synth.playTap();
              setIsGateOpen(true);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>👩‍👦 Parents Area</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center items-center py-4 relative z-20">
        <AnimatePresence mode="wait">
          
          {/* PARENTS DASHBOARD IS ACTIVE */}
          {isDashboardOpen ? (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex justify-center"
            >
              <ParentsDashboard
                settings={settings}
                sessions={sessions}
                onUpdateSettings={updateSettings}
                onClearStats={clearStats}
                onClose={() => setIsDashboardOpen(false)}
              />
            </motion.div>
          ) : activeGame ? (
            
            // ACTIVE PLAY AREA (Children are playing a game)
            <motion.div
              key="active-play-area"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              {/* Massive Left Hand Toddler-Friendly Back Button */}
              <button
                id="btn-back-to-garden"
                onClick={handleBackToGarden}
                className="self-start mb-4 px-6 py-3.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-white text-base font-extrabold rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer stroke-[3]"
              >
                <ArrowLeft className="w-6 h-6 stroke-[3]" />
                <span>Back to Play Garden</span>
              </button>

              {/* Game View Routers */}
              {activeGame === 'shape-match' && (
                <GameShapeMatch onGameComplete={handleGameComplete} onBack={handleBackToGarden} />
              )}
              {activeGame === 'bubble-pop' && (
                <GameBubblePop onGameComplete={handleGameComplete} onBack={handleBackToGarden} />
              )}
              {activeGame === 'feed-puppy' && (
                <GameFeedPuppy onGameComplete={handleGameComplete} onBack={handleBackToGarden} />
              )}
              {activeGame === 'trace-path' && (
                <GameTracePath onGameComplete={handleGameComplete} onBack={handleBackToGarden} />
              )}
            </motion.div>

          ) : (
            
            // HOME SCREEN: GAME SELECTION SCREEN FOR KIDS
            <motion.div
              key="home-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              {/* Cute Smiling Sun Welcom Banner */}
              <div className="text-center mb-8 max-w-md">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="text-7xl mb-2 select-none pointer-events-none"
                >
                  ☀️
                </motion.div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                  Let's Play and Learn!
                </h2>
                <p className="text-sm font-sans text-slate-500 mt-1.5 font-medium leading-relaxed">
                  Tap any colored card below to start a magical game.
                </p>
              </div>

              {/* Big, beautiful Toddler-Touch GRID Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-2">
                {GAMES.map((game, index) => (
                  <motion.div
                    key={game.id}
                    id={`game-card-${game.id}`}
                    role="button"
                    onClick={() => handleGameSelect(game.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 120 }}
                    className={`p-6 rounded-3xl border-4 text-left shadow-md cursor-pointer transition-all flex items-start gap-4 ${game.bgColor} ${game.borderColor} relative overflow-hidden`}
                  >
                    {/* Big Icon indicator */}
                    <span className="text-6xl p-2 bg-white/70 rounded-2xl shadow-inner border border-white filter saturate-110">
                      {game.icon}
                    </span>

                    <div className="space-y-1 relative z-10 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <h3 className="font-sans font-black text-xl text-slate-900 leading-tight">
                          {game.title}
                        </h3>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 opacity-90 hidden sm:inline">
                          {game.subtitle}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-700/95 font-sans leading-relaxed font-semibold">
                        {game.description}
                      </p>

                      {/* Display developmental skills targeted for parent validation */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {game.skills.map((sk) => (
                          <span key={sk} className="text-[10px] uppercase font-mono bg-white/50 border border-white/20 text-slate-700/80 px-2 py-0.5 rounded-full font-bold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cute smiley clouds decoration */}
                    <div className="absolute right-2 -bottom-2 text-3xl opacity-15 select-none pointer-events-none">☁️</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER BAR */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between py-4 border-t border-amber-100 text-slate-400 text-xs mt-8 font-sans">
        <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-bold text-slate-500">Child Privacy Safe</span>
        </div>
        <div className="text-center sm:text-right font-mono text-[10px] text-slate-400">
          <span>Toddler Garden Brain Development • Designed for Ages 2-5</span>
        </div>
      </footer>

      {/* PARENT SECURITY LOCKED GATE OVERLAY (Controlled mathematically) */}
      <AnimatePresence>
        {isGateOpen && (
          <ParentalGate
            onUnlock={() => {
              setIsGateOpen(false);
              setIsDashboardOpen(true);
            }}
            onClose={() => setIsGateOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
