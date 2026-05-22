import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { Sparkles, RotateCcw, Volume2, Award, Music, Compass, Star, ChevronLeft, ChevronRight, Activity, Smile } from 'lucide-react';

interface GameMusicInstrumentsProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

type InstrumentType = 'piano' | 'guitar' | 'violin';

// Frequencies for Piano
const PIANO_NOTES = [
  { note: 'C', freq: 261.63, color: 'bg-rose-400 border-rose-300 text-rose-100 uppercase', label: 'Cow 🐮', emoji: '🐮' },
  { note: 'D', freq: 293.66, color: 'bg-orange-400 border-orange-300 text-orange-100 uppercase', label: 'Duck 🦆', emoji: '🦆' },
  { note: 'E', freq: 329.63, color: 'bg-amber-400 border-amber-300 text-amber-100 uppercase', label: 'Cat 🐱', emoji: '🐱' },
  { note: 'F', freq: 349.23, color: 'bg-emerald-400 border-emerald-300 text-emerald-100 uppercase', label: 'Frog 🐸', emoji: '🐸' },
  { note: 'G', freq: 392.00, color: 'bg-teal-400 border-teal-300 text-teal-100 uppercase', label: 'Bird 🐦', emoji: '🐦' },
  { note: 'A', freq: 440.00, color: 'bg-sky-400 border-sky-300 text-sky-100 uppercase', label: 'Dog 🐶', emoji: '🐶' },
  { note: 'B', freq: 493.88, color: 'bg-indigo-400 border-indigo-300 text-indigo-100 uppercase', label: 'Sheep 🐑', emoji: '🐑' },
  { note: 'C2', freq: 523.25, color: 'bg-purple-400 border-purple-300 text-purple-100 uppercase', label: 'Lion 🦁', emoji: '🦁' },
];

// Twinkle Twinkle Mary Melody Key indexes
const NURSERY_MELODY = [
  { index: 0, note: 'C' }, { index: 0, note: 'C' }, { index: 4, note: 'G' }, { index: 4, note: 'G' },
  { index: 5, note: 'A' }, { index: 5, note: 'A' }, { index: 4, note: 'G' }
];

// Frequencies for Guitar strings
const GUITAR_STRINGS = [
  { id: 0, note: 'E2', freq: 164.81, color: 'bg-rose-500 shadow-rose-300', label: 'Red String' },
  { id: 1, note: 'A2', freq: 220.00, color: 'bg-orange-500 shadow-orange-300', label: 'Orange String' },
  { id: 2, note: 'D3', freq: 293.66, color: 'bg-amber-500 shadow-amber-300', label: 'Yellow String' },
  { id: 3, note: 'G3', freq: 392.00, color: 'bg-emerald-500 shadow-emerald-300', label: 'Green String' },
  { id: 4, note: 'B3', freq: 440.00, color: 'bg-sky-500 shadow-sky-300', label: 'Blue String' },
  { id: 5, note: 'E4', freq: 523.25, color: 'bg-purple-500 shadow-purple-300', label: 'Purple String' },
];

const CHORD_PRESETS = [
  { name: 'C Major 🍎', label: 'C', multipliers: [1.0, 1.25, 1.5, 2.0, 2.5, 3.0], color: 'bg-rose-500 text-white' },
  { name: 'G Major ☀️', label: 'G', multipliers: [1.5, 1.875, 2.25, 3.0, 3.75, 4.5], color: 'bg-amber-500 text-white' },
  { name: 'A Minor 🌧️', label: 'Am', multipliers: [1.33, 1.66, 2.0, 2.66, 3.33, 4.0], color: 'bg-indigo-500 text-white' },
  { name: 'F Major 🌳', label: 'F', multipliers: [1.2, 1.5, 1.8, 2.4, 3.0, 3.6], color: 'bg-emerald-500 text-white' },
];

export default function GameMusicInstruments({ onGameComplete, onBack }: GameMusicInstrumentsProps) {
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  
  // Levels for each of the 3 instruments
  const [levels, setLevels] = useState<Record<InstrumentType, number>>({
    piano: 1,
    guitar: 1,
    violin: 1,
  });

  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [wrongMessage, setWrongMessage] = useState<string | null>(null);
  const [muteSpeech, setMuteSpeech] = useState(false);

  const toggleMuteSpeech = () => {
    const nextVal = !muteSpeech;
    setMuteSpeech(nextVal);
    speech.setEnabled(!nextVal);
    if (nextVal) {
      speech.cancel();
    } else {
      speech.speak("Voice instructions turned on!");
    }
  };

  // Piano state variables
  const [pianoStep, setPianoStep] = useState(0); // For Level 2 nursery helper
  const [pianoSequence, setPianoSequence] = useState<number[]>([]); // For Level 3 Simon Memory
  const [playerInputSeq, setPlayerInputSeq] = useState<number[]>([]);
  const [isFlashedSeq, setIsFlashedSeq] = useState<number | null>(null);
  const [fallingStars, setFallingStars] = useState<{ id: number; keyIdx: number; yPercent: number; speed: number }[]>([]);

  // Guitar state variables
  const [activeChord, setActiveChord] = useState(0); // For Level 3 guitar chords
  const [vibratingString, setVibratingString] = useState<number | null>(null);
  const [butterflyPosition, setButterflyPosition] = useState({ stringIdx: 1, xPercent: 50 }); // For Level 2 guitar
  const guitarContainerRef = useRef<HTMLDivElement | null>(null);
  const lastStrummedStringRef = useRef<number | null>(null);
  
  // Violin state variables
  const [violinPitchMultiplier, setViolinPitchMultiplier] = useState(1.0);
  const [violinBowingSpeed, setViolinBowingSpeed] = useState(1.0); // Level 2 speed bow
  const [fireflyY, setFireflyY] = useState(40); // Level 3 violin
  const [isBowing, setIsBowing] = useState(false);
  const bowRef = useRef<HTMLDivElement | null>(null);

  const activeLevel = levels[instrument];

  // Spawn visual sparkles at dynamic coordinate points
  const triggerSparkle = (clientX: number, clientY: number, emoji: string = '⭐️') => {
    const id = Date.now() + Math.random();
    // Get local coordinate within sandbox frame
    const playPanel = document.getElementById('music-play-panel');
    let x = 100 + Math.random() * 200;
    let y = 100 + Math.random() * 100;
    if (playPanel) {
      const rect = playPanel.getBoundingClientRect();
      x = clientX - rect.left;
      y = clientY - rect.top;
    }
    setSparkles((prev) => [...prev, { id, x, y, emoji }]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 1100);
  };

  // Welcome voice readout when entering/switching instrument or level
  useEffect(() => {
    let text = '';
    if (instrument === 'piano') {
      if (activeLevel === 1) text = "Welcome to Piano! Level 1: Free play sandbox. Tap any colorful pet key with your cute finger to sound notes!";
      else if (activeLevel === 2) text = "Level 2: Magic nursery tune! Tap the glowing keys sequentially to play the happy twinkling star song!";
      else if (activeLevel === 3) text = "Level 3: Simon memory train! Follow and repeat the pet key sound sequences!";
      else text = "Level 4: Speed piano! Tap the colorful keys precisely when falling star notes land on them!";
    } else if (instrument === 'guitar') {
      if (activeLevel === 1) text = "Symphony Guitar! Level 1: Rainbow Strings. Slide or sweep your small finger over strings to play acoustic plucks!";
      else if (activeLevel === 2) text = "Level 2: Butterfly hunt! Follow and tap the fluttering butterfly on the guitar strings!";
      else if (activeLevel === 3) text = "Level 3: Acoustic Chords! Select major chord buttons then swipe the strings!";
      else text = "Level 4: Flying rockstar! Pluck the vibrating rainbow strings in flow!";
    } else if (instrument === 'violin') {
      if (activeLevel === 1) text = "Bowed Violin! Level 1: Symphony Fiddle. Drag the musical wooden bow back and forth over strings!";
      else if (activeLevel === 2) text = "Level 2: Bow Speed! Slide fast for exciting high violin notes, and slide slowly for rich cozy low sweeps!";
      else if (activeLevel === 3) text = "Level 3: Catch the cozy fireflies! Move your bow up and down to catch fireflies at different heights!";
      else text = "Level 4: Backyard Orchestra! Tap and play violin chords to make the garden animals dance!";
    }
    if (!muteSpeech) {
      speech.speak(text);
    } else {
      speech.cancel();
    }
  }, [instrument, activeLevel, muteSpeech]);

  // Handle Score Completion (toddler target is 40 points)
  const addScore = (amount: number) => {
    if (score >= 40) return;
    const next = score + amount;
    if (next >= 40) {
      setScore(40);
      setComplete(true);
      synth.playWinFanfare();
      onGameComplete(40);
      
      let winText = `Wonderful superstar toddler! You finished Level ${activeLevel} of ${instrument}! You scored 40 grand points!`;
      if (activeLevel < 4) {
        winText += " Try the next level for more musical adventures!";
      } else {
        winText += " Play another beautiful instrument!";
      }
      speech.speak(winText);
    } else {
      setScore(next);
      synth.playCuteSqueak();
    }
  };

  // Piano level loaders and sequence engines
  useEffect(() => {
    if (instrument === 'piano' && activeLevel === 3) {
      // Setup memory sequence of length 3 for toddlers
      setPianoSequence([Math.floor(Math.random() * 4), Math.floor(Math.random() * 4 + 2), Math.floor(Math.random() * 4 + 4)]);
      setPlayerInputSeq([]);
    } else if (instrument === 'piano' && activeLevel === 4) {
      // Setup falling starts
      setFallingStars([
        { id: 1, keyIdx: 1, yPercent: 0, speed: 4 },
        { id: 2, keyIdx: 4, yPercent: -30, speed: 3.5 },
        { id: 3, keyIdx: 6, yPercent: -60, speed: 5 },
      ]);
    }
  }, [instrument, activeLevel]);

  // Guitar level loaders
  useEffect(() => {
    if (instrument === 'guitar' && activeLevel === 2) {
      // Reposition butterfly
      setButterflyPosition({ stringIdx: Math.floor(Math.random() * 6), xPercent: 20 + Math.random() * 60 });
    }
  }, [instrument, activeLevel]);



  // Trigger piano playing
  const handlePianoPlay = (idx: number, clientX: number, clientY: number) => {
    speech.cancel(); // Mute instructions immediately while actively playing the instrument!
    const noteObj = PIANO_NOTES[idx];
    synth.playPiano(noteObj.freq);
    triggerSparkle(clientX, clientY, noteObj.emoji);

    // Level 1: Free play sandboxes
    if (activeLevel === 1) {
      addScore(8);
    }
    // Level 2: Twinkle Melody target helper
    else if (activeLevel === 2) {
      const melodyTarget = NURSERY_MELODY[pianoStep];
      if (noteObj.note === melodyTarget.note) {
        const nextStep = pianoStep + 1;
        if (nextStep >= NURSERY_MELODY.length) {
          addScore(15);
          setPianoStep(0);
          speech.speak("Sensational! You played the Twinkle melody completely!");
        } else {
          setPianoStep(nextStep);
          // Play next helper note guidance
          addScore(5);
        }
        setWrongMessage(null);
      } else {
        setWrongMessage(`Slide your finger to the glowing ${melodyTarget.note} key!`);
        speech.speak(`Nearly! Let's touch the glowing key for ${melodyTarget.note}`);
      }
    }
    // Level 3: Simon Play
    else if (activeLevel === 3) {
      const nextInput = [...playerInputSeq, idx];
      setPlayerInputSeq(nextInput);
      const stepCheckIdx = nextInput.length - 1;
      
      if (idx === pianoSequence[stepCheckIdx]) {
        if (nextInput.length === pianoSequence.length) {
          addScore(15);
          setWrongMessage(null);
          // play successful fanfare
          setTimeout(() => synth.playSuccessChime(), 150);
          speech.speak("Whoof! You matched biscuit's memory sequence perfectly!");
          setPlayerInputSeq([]);
          setPianoSequence([Math.floor(Math.random() * 4), Math.floor(Math.random() * 4 + 2), Math.floor(Math.random() * 4 + 4)]);
        } else {
          addScore(4);
        }
      } else {
        setWrongMessage("Oops! Repeat the sequence exactly. Let's try once more!");
        speech.speak("That was a cute sound! Tap the flashing keys in order!");
        setPlayerInputSeq([]);
        playPianoMemoryDemo();
      }
    }
    // Level 4: Falling stars tap match check
    else if (activeLevel === 4) {
      // Find matching star landing inside critical zone (yPercent coordinates between 70% and 95%)
      const caughtStar = fallingStars.find(s => s.keyIdx === idx && s.yPercent > 65 && s.yPercent < 98);
      if (caughtStar) {
        addScore(10);
        // Replace star
        setFallingStars(prev => prev.map(s => s.id === caughtStar.id ? { ...s, yPercent: -20 - Math.random() * 40, keyIdx: Math.floor(Math.random() * 8) } : s));
      } else {
        addScore(3); // modest reward for efforts anyhow
      }
    }
  };

  const handlePianoKeyClick = (idx: number, e: React.MouseEvent) => {
    handlePianoPlay(idx, e.clientX, e.clientY);
  };

  const handlePianoKeyTouch = (idx: number, e: React.TouchEvent) => {
    e.preventDefault(); // crucial to prevent double-click or zoom gestures on mobile web/Android!
    if (e.touches && e.touches[0]) {
      handlePianoPlay(idx, e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Play piano demo flash for toddler
  const playPianoMemoryDemo = () => {
    let index = 0;
    const playNext = () => {
      if (index >= pianoSequence.length) {
        setIsFlashedSeq(null);
        return;
      }
      const keyIdx = pianoSequence[index];
      setIsFlashedSeq(keyIdx);
      synth.playPiano(PIANO_NOTES[keyIdx].freq);
      
      setTimeout(() => {
        setIsFlashedSeq(null);
        index++;
        setTimeout(playNext, 350);
      }, 450);
    };
    playNext();
  };

  // Falling stars movement loops
  useEffect(() => {
    if (instrument !== 'piano' || activeLevel !== 4) return;
    const interval = setInterval(() => {
      setFallingStars((prev) =>
        prev.map((star) => {
          let nextY = star.yPercent + star.speed;
          let nextKey = star.keyIdx;
          if (nextY > 105) {
            nextY = -15; // wrap string note around
            nextKey = Math.floor(Math.random() * 8);
          }
          return { ...star, yPercent: nextY, keyIdx: nextKey };
        })
      );
    }, 70);
    return () => clearInterval(interval);
  }, [instrument, activeLevel]);

  // Guitar plucked actions
  const pluckString = (idx: number, e: React.MouseEvent | React.TouchEvent | any) => {
    speech.cancel(); // Mute instructions immediately while actively playing the instrument!
    setVibratingString(idx);
    setTimeout(() => {
      setVibratingString((curr) => (curr === idx ? null : curr));
    }, 450);

    const baseStr = GUITAR_STRINGS[idx];
    
    // Calculate final frequency based on selected Chord multiplier
    let freqMultiplier = 1.0;
    if (activeLevel === 3) {
      freqMultiplier = CHORD_PRESETS[activeChord].multipliers[idx];
    }
    
    synth.playGuitar(baseStr.freq * freqMultiplier);

    // Get event coordinates safely
    let clientX = 150;
    let clientY = 200;
    if (e.clientX) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    triggerSparkle(clientX, clientY, '🎸');

    // Level 1 check
    if (activeLevel === 1) {
      addScore(5);
    }
    // Level 2: Butterfly target check
    else if (activeLevel === 2) {
      if (idx === butterflyPosition.stringIdx) {
        addScore(15);
        triggerSparkle(clientX, clientY, '🦋');
        // move butterfly
        setButterflyPosition({
          stringIdx: Math.floor(Math.random() * 6),
          xPercent: 15 + Math.random() * 70,
        });
        setWrongMessage(null);
      } else {
        setWrongMessage("Great try! Stroke the string holding the beautiful resting butterfly!");
      }
    }
    // Level 3: Chord Sandbox check
    else if (activeLevel === 3) {
      addScore(8);
    }
    // Level 4: Speed challenge strum
    else if (activeLevel === 4) {
      addScore(6);
    }
  };

  const handleGuitarTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0] && guitarContainerRef.current) {
      e.preventDefault(); // Lock browser scrolling so swiping plays sound instead of dragging viewport!
      const rect = guitarContainerRef.current.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      const touchX = e.touches[0].clientX - rect.left;
      const containerHeight = rect.height;
      const containerWidth = rect.width;

      if (touchX >= 0 && touchX <= containerWidth && touchY >= 0 && touchY <= containerHeight) {
        const idx = Math.floor((touchY / containerHeight) * 6);
        if (idx >= 0 && idx < 6) {
          if (lastStrummedStringRef.current !== idx) {
            lastStrummedStringRef.current = idx;
            pluckString(idx, e);
          }
        }
      }
    }
  };

  const handleGuitarTouchEnd = () => {
    lastStrummedStringRef.current = null;
  };



  // Violin dragging actions
  const handleViolinBowMove = (e: React.MouseEvent) => {
    if (!isBowing) return;
    const rect = bowRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Relative offset of slide determines pitch
    const bowX = e.clientX - rect.left;
    const bowPercent = Math.max(0.1, Math.min(bowX / rect.width, 1.0));
    setViolinPitchMultiplier(0.6 + bowPercent * 1.5); // sliding fader

    // Score on actions
    if (Math.random() < 0.12) {
      speech.cancel(); // Mute instructions immediately while actively playing the instrument!
      const activePitch = 293.66 * (0.6 + bowPercent * 1.5);
      synth.playViolin(activePitch);
      triggerSparkle(e.clientX, e.clientY, '🎵');
      
      // score
      if (activeLevel === 1) addScore(4);
      else if (activeLevel === 2) {
        addScore(5);
        if (bowPercent > 0.8) {
          setWrongMessage("Fantastic fast bowling! High bright notes sound amazing!");
        } else if (bowPercent < 0.3) {
          setWrongMessage("Splendid slow bowing! Cozy deep frequencies sound so warm!");
        }
      } else if (activeLevel === 3) {
        addScore(6);
      } else {
        addScore(8);
      }
    }
  };

  const handleViolinBowTouch = (e: React.TouchEvent) => {
    if (!isBowing) return;
    if (e.touches && e.touches[0]) {
      const rect = bowRef.current?.getBoundingClientRect();
      if (!rect) return;

      const bowX = e.touches[0].clientX - rect.left;
      const bowPercent = Math.max(0.1, Math.min(bowX / rect.width, 1.0));
      setViolinPitchMultiplier(0.6 + bowPercent * 1.5);

      if (Math.random() < 0.12) {
        speech.cancel(); // Mute instructions immediately while actively playing the instrument!
        const activePitch = 293.66 * (0.6 + bowPercent * 1.5);
        synth.playViolin(activePitch);
        triggerSparkle(e.touches[0].clientX, e.touches[0].clientY, '🎵');

        if (activeLevel === 1) addScore(4);
        else if (activeLevel === 2) {
          addScore(5);
          if (bowPercent > 0.8) {
            setWrongMessage("Fantastic fast bowling! High bright notes sound amazing!");
          } else if (bowPercent < 0.3) {
            setWrongMessage("Splendid slow bowing! Cozy deep frequencies sound so warm!");
          }
        } else if (activeLevel === 3) {
          addScore(6);
        } else {
          addScore(8);
        }
      }
    }
  };

  const handleResetLevel = () => {
    setScore(0);
    setComplete(false);
    setPianoStep(0);
    setPlayerInputSeq([]);
    synth.playTap();
    speech.speak(`Level ${activeLevel} restarted! Let's play the ${instrument} together!`);
  };

  const handleLevelChange = (direction: 'next' | 'prev') => {
    synth.playTap();
    setScore(0);
    setComplete(false);
    setPianoStep(0);
    setPlayerInputSeq([]);
    setWrongMessage(null);

    setLevels((prev) => {
      const current = prev[instrument];
      let next = current;
      if (direction === 'next') {
        next = Math.min(4, current + 1);
      } else {
        next = Math.max(1, current - 1);
      }
      return { ...prev, [instrument]: next };
    });
  };

  const selectDirectLevel = (lvlNum: number) => {
    synth.playTap();
    setScore(0);
    setComplete(false);
    setPianoStep(0);
    setPlayerInputSeq([]);
    setWrongMessage(null);
    setLevels((prev) => ({
      ...prev,
      [instrument]: lvlNum,
    }));
  };

  return (
    <div className="w-full max-w-4xl p-2 md:p-4 space-y-4 font-sans select-none relative" id="music-play-panel">
      
      {/* Header Info & Scoreboard row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch z-30 relative select-none">
        
        {/* Dynamic Toddler Instruction guide */}
        <div className="flex-1 bg-amber-100 border-4 border-amber-400 p-3 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center p-2 border-2 border-amber-300 shadow-md cursor-pointer relative">
              <span className="text-4xl">🎵</span>
            </div>
            <div className="text-left">
              <h4 className="text-amber-800 font-black text-sm tracking-wide leading-none uppercase">Instrument Studio</h4>
              <p className="text-amber-700/80 text-[11px] font-mono leading-tight mt-1 capitalize">
                Lvl {activeLevel}: {instrument}
              </p>
              <p className="text-slate-700 text-xs font-semibold leading-tight mt-1 max-w-[280px] md:max-w-[400px]">
                {instrument === 'piano' && (
                  activeLevel === 1 ? 'Free play sandbox! Touch animal keys to hear wonderful synthesized piano.' :
                  activeLevel === 2 ? 'Play Twinkle Twinkle! Tap keys glowing in yellow/stars.' :
                  activeLevel === 3 ? "Biscuit's Train! Listen and play back the flashing notes exactly." :
                  'Tap the colored keys when musical falling stars land inside the key frames!'
                )}
                {instrument === 'guitar' && (
                  activeLevel === 1 ? 'Rainbow strings strum sandbox! Drag your finger over to strum chords.' :
                  activeLevel === 2 ? 'Fluttering butterfly! Stroke the exact string the butterfly is resting on.' :
                  activeLevel === 3 ? 'Acoustic Guitar Chords! Change chord presets then strum strings.' :
                  'Rockstar rhythm mode! Tap or pluck rainbow strings with energetic flow.'
                )}

                {instrument === 'violin' && (
                  activeLevel === 1 ? 'Bowed Violin! Slide bow back and forth smoothly across instrument faders.' :
                  activeLevel === 2 ? 'Drag fast for rich high-pitched keys, slow for deep cozy vibrations.' :
                  activeLevel === 3 ? 'Guide faders up/down to match flying firefly positions!' :
                  'Enjoy garden backup animal singers as strings resonate.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMuteSpeech}
              title={muteSpeech ? "Unmute Instructions" : "Mute Instructions"}
              className={`p-3 rounded-xl border shadow-sm transition-all flex items-center gap-1.5 text-xs font-extrabold cursor-pointer ${
                muteSpeech 
                  ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200 ring-2 ring-rose-400' 
                  : 'bg-white hover:bg-slate-100 text-amber-700 border-amber-200'
              }`}
            >
              {muteSpeech ? (
                <>
                  <span className="text-sm">🔇</span>
                  <span className="hidden sm:inline">Instructions Muted</span>
                </>
              ) : (
                <>
                  <span className="text-sm animate-pulse">🔊</span>
                  <span className="hidden sm:inline">Mute Guidance</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetLevel}
              aria-label="restart level button"
              className="p-3 bg-white hover:bg-amber-100/50 rounded-xl border border-amber-200 shadow-sm transition-all text-amber-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 animate-spin-slow" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Play Garden Toddler Scoreboard */}
        <div className="bg-pink-100 border-4 border-pink-400 p-3 rounded-2xl shadow-md flex items-center justify-between min-w-[200px] md:w-72">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 bg-pink-400 rounded-2xl flex items-center justify-center p-2 border-2 border-pink-300 shadow-md text-3xl">
              ⭐️
            </div>
            <div className="text-left font-sans">
              <span className="block text-[10px] font-bold text-pink-700 leading-none uppercase">Score Goal</span>
              <span className="text-3xl font-black text-pink-800 leading-none">{score} <span className="text-xs text-pink-600 leading-none">/ 40</span></span>
            </div>
          </div>

          {/* Level indicators / quick direct selector */}
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[10px] uppercase font-mono font-bold text-center text-pink-700 leading-none mb-1">
              Choose Level
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((lvlNum) => {
                const isActive = activeLevel === lvlNum;
                return (
                  <button
                    key={lvlNum}
                    onClick={() => selectDirectLevel(lvlNum)}
                    className={`w-7 h-7 rounded-full text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md border-2 border-white scale-110 ring-2 ring-pink-400'
                        : 'bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 shadow-sm'
                    }`}
                  >
                    {lvlNum}
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] text-pink-700 font-extrabold text-center leading-none mt-1 max-w-[110px] truncate">
              {activeLevel === 1 && "🎵 Sandbox"}
              {activeLevel === 2 && "✨ Guided Play"}
              {activeLevel === 3 && "🧠 Memory Run"}
              {activeLevel === 4 && "⭐ Target Catch"}
            </span>
          </div>
        </div>

      </div>

      {/* Main instrument selector top tabs row */}
      <div className="w-full flex justify-around bg-white/70 border border-slate-200/60 p-2 rounded-2xl shadow-sm gap-2">
        {(['piano', 'guitar', 'violin'] as InstrumentType[]).map((inst) => {
          const isSelected = instrument === inst;
          const instLabels = {
            piano: { emoji: '🎹', label: 'Toy Piano' },
            guitar: { emoji: '🎸', label: 'Guitar Pluck' },
            violin: { emoji: '🎻', label: 'Soft Violin' },
          };
          const data = instLabels[inst];

          return (
            <button
              key={inst}
              onClick={() => {
                synth.playSuccessChime();
                setInstrument(inst);
                setScore(0);
                setComplete(false);
                setPianoStep(0);
                setWrongMessage(null);
              }}
              className={`flex-1 max-w-[170px] py-2 md:py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-amber-400 border-amber-500 scale-[1.05] shadow-md text-amber-970 font-black' 
                  : 'bg-white/80 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold'
              }`}
            >
              <span className="text-3xl md:text-4xl block filter saturate-115 mb-1">{data.emoji}</span>
              <span className="text-[10px] md:text-xs font-bold leading-none">{data.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive instrument stage border bounds */}
      <div className="w-full min-h-[440px] bg-gradient-to-b from-indigo-50 via-[#FFF9EE] to-amber-50 border-4 border-amber-300 rounded-3xl p-4 md:p-6 relative overflow-hidden shadow-md flex flex-col justify-between">
        
        {/* Sparkles / Note Emoji spawners layer */}
        <AnimatePresence>
          {sparkles.map((spark) => (
            <motion.p
              key={spark.id}
              initial={{ scale: 0.1, y: spark.y, x: spark.x, opacity: 1 }}
              animate={{ scale: [1, 1.6, 0.4], y: spark.y - 120, x: spark.x + (Math.random() * 80 - 40), opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute text-5xl font-bold select-none pointer-events-none filter drop-shadow z-50 filter saturate-110"
            >
              {spark.emoji}
            </motion.p>
          ))}
        </AnimatePresence>

        {/* Level instructions helper status bar */}
        {wrongMessage && (
          <div className="w-full bg-yellow-50 border-2 border-dashed border-amber-400 p-2 text-center rounded-xl font-bold text-[11px] text-amber-900 leading-none mb-3 animate-pulse">
            🐥 {wrongMessage}
          </div>
        )}

        {/* ACTIVE STAGE LAYOUT ROUTERS */}
        <div className="flex-1 flex flex-col justify-center items-stretch relative">
          
          {/* 1. PIANO PLAYGROUND */}
          {instrument === 'piano' && (
            <div className="w-full flex-1 flex flex-col justify-between items-stretch">
              {/* Top guidance lane (stars descend here for lvl 4) */}
              <div className="h-44 relative w-full mb-2 bg-slate-100/40 rounded-2xl border border-dashed border-slate-300/60 overflow-hidden">
                
                {/* Level 2 indicators: play note nursery rhymes helper banner */}
                {activeLevel === 2 && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none p-4">
                    <p className="text-amber-800 text-xs font-bold font-sans">Mary Had a Little Lamb Melody Guide! Play along 🌈</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {NURSERY_MELODY.map((item, idx) => {
                        const isCurrent = idx === pianoStep;
                        return (
                          <span
                            key={idx}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                              idx < pianoStep ? 'bg-emerald-400 text-white border-emerald-300' :
                              isCurrent ? 'bg-amber-400 text-white border-amber-300 scale-110 animate-bounce' :
                              'bg-white/80 text-slate-400 border-slate-200'
                            }`}
                          >
                            {item.note}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Level 3: Simon Play Memory triggers */}
                {activeLevel === 3 && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
                    <p className="text-indigo-800 text-xs font-extrabold uppercase tracking-wide leading-none">Biscuit's Simon Memory Train</p>
                    <button
                      onClick={playPianoMemoryDemo}
                      className="mt-3 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span>🐾 Flash Biscuit's Notes</span>
                    </button>
                    {playerInputSeq.length > 0 && (
                      <p className="text-slate-500 text-[10px] font-mono mt-2 font-bold uppercase">
                        Matched: {playerInputSeq.length} / {pianoSequence.length}
                      </p>
                    )}
                  </div>
                )}

                {/* Level 4: Falling Note visual stars */}
                {activeLevel === 4 && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {fallingStars.map((star) => {
                      // Calculate horizontal spacing matching keys
                      const leftPercent = (star.keyIdx * 12.5) + 6.25;
                      return (
                        <div
                          key={star.id}
                          style={{ top: `${star.yPercent}%`, left: `${leftPercent}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 border border-white flex items-center justify-center text-sm shadow-sm ${
                            star.yPercent > 65 && star.yPercent < 98 ? 'ring-4 ring-yellow-300 scale-115' : ''
                          }`}
                        >
                          ⭐️
                        </div>
                      );
                    })}
                    <div className="absolute bottom-1 w-full border-t-2 border-dashed border-yellow-400/80 p-0.5 text-[8px] text-center font-bold text-amber-800/60 font-sans tracking-widest bg-yellow-100/40 uppercase">
                      Target Tap Zone
                    </div>
                  </div>
                )}

                {/* Level 1: Standard beautiful garden sky */}
                {activeLevel === 1 && (
                  <div className="absolute inset-0 flex justify-center items-center pointer-events-none p-4">
                    <p className="text-emerald-700/80 text-xs font-sans text-center font-medium">
                      🌺 Beautiful Music Garden 🌺 <br />
                      <span className="text-[10px] text-slate-500 mt-1 font-mono">Tap any colored animal key below to play beautiful chords!</span>
                    </p>
                  </div>
                )}

              </div>

              {/* Piano keys shelf structure */}
              <div className="h-44 w-full flex bg-slate-900 border-4 border-slate-700 rounded-2xl overflow-hidden p-1 gap-1">
                {PIANO_NOTES.map((noteObj, idx) => {
                  const isGuideNote = activeLevel === 2 && NURSERY_MELODY[pianoStep]?.note === noteObj.note;
                  const isFlashed = isFlashedSeq === idx;
                  return (
                    <button
                      key={noteObj.note + idx}
                      onClick={(e) => handlePianoKeyClick(idx, e)}
                      onTouchStart={(e) => handlePianoKeyTouch(idx, e)}
                      className={`flex-1 rounded-lg border-2 flex flex-col justify-between items-center py-4 px-1 select-none touch-none transition-all cursor-pointer relative ${
                        isGuideNote ? 'bg-yellow-300 border-yellow-500 scale-y-102 ring-4 ring-yellow-400 z-10' :
                        isFlashed ? 'bg-white border-white scale-y-98' :
                        noteObj.color
                      }`}
                    >
                      <span className="text-[10px] font-mono leading-none font-bold opacity-80">{noteObj.note}</span>
                      <span className="text-2xl filter saturate-110">{noteObj.emoji}</span>
                      <span className="text-[9px] font-bold select-none opacity-90 truncate leading-none uppercase max-w-[45px]">{noteObj.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. ACOUSTIC RAINBOW GUITAR */}
          {instrument === 'guitar' && (
            <div className="w-full flex-1 flex flex-col justify-around items-center">
              
              {/* Chord selection keys (only active for Level 3) */}
              {activeLevel === 3 ? (
                <div className="flex justify-center items-center gap-2 mb-4">
                  {CHORD_PRESETS.map((ch, idx) => (
                    <button
                      key={ch.name}
                      onClick={() => {
                        setActiveChord(idx);
                        synth.playCuteSqueak();
                      }}
                      className={`px-4 py-2 border font-bold text-xs rounded-xl cursor-pointer transition-all ${
                        activeChord === idx ? `${ch.color} scale-105 ring-4 ring-yellow-300` : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-[10px] text-center font-mono font-bold uppercase tracking-wider mb-2">
                  {activeLevel === 1 ? 'Free Play Rainbow Strings' :
                   activeLevel === 2 ? 'Seek and Tap the Fluttering Butterfly 🦋' :
                   'Tap or hover your baby fingers across strings!'}
                </p>
              )}

              {/* Guitar neck box housing physical string layout */}
              <div
                ref={guitarContainerRef}
                onTouchMove={handleGuitarTouchMove}
                onTouchEnd={handleGuitarTouchEnd}
                className="w-full max-w-xl h-56 bg-amber-900/90 border-4 border-amber-950 p-2.5 rounded-2xl flex flex-col justify-between relative shadow-inner overflow-hidden select-none touch-none"
              >
                
                {/* Visual copper frets */}
                <div className="absolute inset-y-0 left-1/4 border-r-2 border-amber-970/40 pointer-events-none" />
                <div className="absolute inset-y-0 left-2/4 border-r-2 border-amber-970/40 pointer-events-none" />
                <div className="absolute inset-y-0 left-3/4 border-r-2 border-amber-970/40 pointer-events-none" />

                {/* String rails */}
                {GUITAR_STRINGS.map((str, idx) => {
                  const isVibrating = vibratingString === idx;
                  const isButterflyString = activeLevel === 2 && butterflyPosition.stringIdx === idx;

                  return (
                    <div
                      key={str.id}
                      className="w-full h-7 flex items-center relative group cursor-pointer z-10"
                      onMouseEnter={(e) => pluckString(idx, e)}
                      onTouchStart={(e) => { e.preventDefault(); pluckString(idx, e); }}
                    >
                      {/* Interactive click box trigger for extra click support */}
                      <button 
                        onClick={(e) => pluckString(idx, e)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      />

                      {/* Guitar fret wire line */}
                      <div
                        className={`w-full transition-all duration-75 relative z-10 ${str.color} ${
                          isVibrating ? 'h-1.5 shadow-md scale-y-115 animate-pulse' : 'h-[3px] opacity-90'
                        }`}
                      />

                      {/* Level 2 Butterfly widget indicator */}
                      {isButterflyString && (
                        <div
                          style={{ left: `${butterflyPosition.xPercent}%` }}
                          className="absolute -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none text-3xl animate-bounce filter drop-shadow-md"
                        >
                          🦋
                        </div>
                      )}

                      {/* String note trigger feedback tooltip */}
                      <span className="absolute -left-2 bg-slate-900 border border-slate-700 text-slate-100 text-[8px] font-sans font-bold px-1 rounded transform -translate-x-2 select-none">
                        {str.note}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>
          )}



          {/* 4. BOWED VIOLIN */}
          {instrument === 'violin' && (
            <div className="w-full flex-1 flex flex-col justify-around items-stretch select-none">
              
              {/* Level 3: Fireflies height matching instructions */}
              {activeLevel === 3 && (
                <div className="text-center text-[10px] text-amber-900 border border-amber-300 bg-amber-50 rounded-lg p-2 max-w-sm mx-auto mb-2 font-bold select-none leading-none">
                  🌻 Match bowing height to catch bright glowing forest fireflies!
                </div>
              )}

              {/* Level 4: Backing Track indicators */}
              {activeLevel === 4 && (
                <div className="flex justify-center items-center gap-3">
                  <div className="p-1 px-3 bg-teal-100 ring-2 ring-teal-400 font-bold text-[9px] rounded-full text-teal-800 animate-pulse leading-none">🌱 Bear 🐻 plays Flute</div>
                  <div className="p-1 px-3 bg-rose-100 ring-2 ring-rose-400 font-bold text-[9px] rounded-full text-rose-800 animate-pulse leading-none">🌳 Kitty 🐱 sings sweet backup</div>
                </div>
              )}

              {/* Bow sliding track panel */}
              <div 
                ref={bowRef}
                onMouseMove={handleViolinBowMove}
                onMouseDown={() => setIsBowing(true)}
                onMouseUp={() => setIsBowing(false)}
                onMouseLeave={() => setIsBowing(false)}
                onTouchStart={(e) => { e.preventDefault(); setIsBowing(true); }}
                onTouchMove={(e) => { e.preventDefault(); handleViolinBowTouch(e); }}
                onTouchEnd={(e) => { e.preventDefault(); setIsBowing(false); }}
                onTouchCancel={(e) => { e.preventDefault(); setIsBowing(false); }}
                className="w-full h-48 bg-amber-950/20 border-4 border-dashed border-amber-400/80 rounded-2xl relative overflow-hidden select-none touch-none cursor-ew-resize flex flex-col justify-between p-3"
              >
                
                {/* Level 3: Firefly coordinates */}
                {activeLevel === 3 && (
                  <div
                    style={{ left: '50%', top: `${fireflyY}%` }}
                    className="absolute -translate-y-1/2 -translate-x-1/2 text-2xl animate-pulse pointer-events-none filter drop-shadow-md"
                  >
                    ✨🐝
                  </div>
                )}

                {/* Violin steel strings fanned across bow track */}
                <div className="absolute inset-x-0 top-1/4 border-t border-slate-400 opacity-60" />
                <div className="absolute inset-x-0 top-2/4 border-t border-slate-400 opacity-60" />
                <div className="absolute inset-x-0 top-3/4 border-t border-slate-400 opacity-60" />

                <div className="text-center font-mono opacity-60 pointer-events-none text-[9px] font-bold text-amber-950 uppercase mt-4">
                  Bow Slide Track Lane
                </div>

                {/* Visual bow piece that follows mouse / fingers */}
                <div
                  style={{ left: `${(violinPitchMultiplier - 0.6) / 1.5 * 100}%` }}
                  className={`absolute top-0 bottom-0 w-6 bg-yellow-400/80 border-2 border-white rounded-md shadow-md flex items-center justify-center transform -translate-x-1/2 pointer-events-none select-none`}
                >
                  <span className="text-[10px] transform rotate-90 font-mono text-amber-950 font-black">BOW</span>
                </div>

                <div className="text-center font-bold text-amber-950/80 text-[10px] pointer-events-none select-none z-10">
                  {isBowing ? "🎶 Bowing violin chords nicely" : "🎯 Touch and slide Bow left/right over strings!"}
                </div>

              </div>

              {/* Quick speed controller indicator (lvl 2) */}
              {activeLevel === 2 && (
                <div className="text-center mt-2 font-mono font-bold uppercase text-[9px] text-slate-500">
                  Slide slow or fast on bow fader panel!
                </div>
              )}

            </div>
          )}

        </div>

        {/* Level Complete celebratory banner overlay */}
        {complete && (
          <div className="absolute inset-0 bg-emerald-500/95 flex flex-col justify-center items-center p-6 text-center select-none z-40 transform transition-all">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.1 }}
              className="text-7xl select-none"
            >
              🎉👑🎹
            </motion.div>
            <h3 className="text-white text-3xl font-black font-sans leading-none mt-4 tracking-wide uppercase">Sensational Play!</h3>
            <p className="text-emerald-100 text-xs font-semibold leading-relaxed mt-2 max-w-sm">
              You reached the maximum score of 40 points on your {instrument}! You are an amazing toddler instrumentalist!
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setComplete(false);
                  setScore(0);
                  synth.playTap();
                }}
                className="px-6 py-2.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer select-none"
              >
                Play Sandbox Again
              </button>
              {activeLevel < 4 ? (
                <button
                  onClick={() => handleLevelChange('next')}
                  className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-amber-970 text-xs font-black rounded-xl shadow-sm flex items-center gap-1 transition-all cursor-pointer select-none"
                >
                  <span>Play Level {activeLevel + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer select-none"
                >
                  Back to Play Garden
                </button>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
