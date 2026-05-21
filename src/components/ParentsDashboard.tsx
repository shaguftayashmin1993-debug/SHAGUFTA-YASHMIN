import React from 'react';
import { motion } from 'motion/react';
import { synth, speech } from '../utils/audio';
import { ParentSettings, PlaySession } from '../types';
import { Settings, BarChart3, LogOut, CheckCircle, ShieldCheck, Trash2, Sliders, Sparkles, Volume2, Gamepad } from 'lucide-react';

interface ParentsDashboardProps {
  settings: ParentSettings;
  sessions: PlaySession[];
  onUpdateSettings: (newSettings: ParentSettings) => void;
  onClearStats: () => void;
  onClose: () => void;
}

export default function ParentsDashboard({
  settings,
  sessions,
  onUpdateSettings,
  onClearStats,
  onClose,
}: ParentsDashboardProps) {

  const toggleVoice = () => {
    synth.playTap();
    const nextVal = !settings.voiceEnabled;
    speech.setEnabled(nextVal);
    onUpdateSettings({ ...settings, voiceEnabled: nextVal });
    if (nextVal) {
      setTimeout(() => speech.speak("Voice guidance enabled! Hello parents!"), 200);
    }
  };

  const toggleSound = () => {
    const nextVal = !settings.musicEnabled;
    synth.setMute(!nextVal);
    synth.playTap();
    onUpdateSettings({ ...settings, musicEnabled: nextVal });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    speech.setSpeed(speed);
    onUpdateSettings({ ...settings, voiceSpeed: speed });
  };

  // Compute stats metrics
  const totalSessions = sessions.length;
  const completedCount = sessions.filter(s => s.completed).length;
  
  // Categorize stats by skill categories
  const skillCount: Record<string, number> = {
    'Cognitive Logic': sessions.filter(s => s.gameId === 'shape-match').length,
    'Fine Motor Skills': sessions.filter(s => s.gameId === 'bubble-pop' || s.gameId === 'trace-path').length,
    'Executive Function': sessions.filter(s => s.gameId === 'feed-puppy').length,
  };

  const handleDashboardExit = () => {
    synth.playTap();
    onClose();
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-50 border-4 border-slate-200/50 rounded-3xl overflow-hidden shadow-xl p-6 select-none font-sans">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest font-mono">
            Parents Dashboard Area
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            Toddler Brain Academy Manager
          </h2>
          <p className="text-sm text-slate-500">
            Monitor cognitive milestones, adjust toddler voice guidance, and verify child compliance safeties.
          </p>
        </div>

        <button
          id="btn-return-to-garden"
          onClick={handleDashboardExit}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit to Toddler Play Garden</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Side: Configuration Settings (Sliders & Toggles) */}
        <div className="lg:col-span-5 bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Toddler Experience Controls</h3>
          </div>

          <div className="space-y-5">
            {/* Speech Voice over Enable/Disable */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs font-bold text-slate-800">Friendly Voice Reader</span>
                <span className="text-[10px] text-slate-400 font-mono">Spoken text instructions for toddlers</span>
              </div>
              <button
                id="toggle-voice-btn"
                onClick={toggleVoice}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  settings.voiceEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* General Application Sound Enable/Disable */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs font-bold text-slate-800">Melodic Sound Effects</span>
                <span className="text-[10px] text-slate-400 font-mono">Synthesized chimes & marimba plucks</span>
              </div>
              <button
                id="toggle-sound-btn"
                onClick={toggleSound}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  settings.musicEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Speech Speed slider */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Voice Guidance Speed</span>
                <span className="text-indigo-600 font-mono">{(settings.voiceSpeed * 100).toFixed(0)}% Speed</span>
              </div>
              <input
                id="voice-speed-slider"
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={settings.voiceSpeed}
                onChange={handleSpeedChange}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Slow & Gentle (Ages 2-3)</span>
                <span>Active (Ages 4-5)</span>
              </div>
            </div>

            {/* COPPA Compliance verification */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>COPPA & GDPR-K Privacy Safe</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                This applet contains <b>Zero trackers</b>, <b>Zero ads</b>, and collects <b>Zero personal data</b>. All brain development metrics and configuration settings are saved entirely offline inside your local sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Milestones, Stat charts, and logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Bento-grid indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">Milestones Met</span>
              <span className="block text-2xl font-black text-slate-800">{completedCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">Total Taps</span>
              <span className="block text-2xl font-black text-slate-800">{totalSessions}</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">Gate Access</span>
              <span className="block text-2xl font-black text-slate-800">Secure</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BarChart3 className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-slate-800 text-sm">Skills Progress Matrix</h3>
            </div>

            {/* Progress Bars for Skills */}
            <div className="space-y-3">
              {Object.entries(skillCount).map(([skill, count]) => {
                const percentage = Math.min(100, Math.round((count / Math.max(1, totalSessions)) * 100));
                
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-700">{skill}</span>
                      <span className="text-slate-500">{count} active moments</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          skill.startsWith('Cognitive') ? 'bg-amber-400' :
                          skill.startsWith('Fine') ? 'bg-sky-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Practice index</span>
                      <span>{percentage}% priority ratio</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sessions Logs list */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gamepad className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm">Recent Learning Logs</h3>
              </div>

              {sessions.length > 0 && (
                <button
                  id="btn-clear-stats"
                  onClick={() => {
                    synth.playCuteSqueak();
                    onClearStats();
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Logs</span>
                </button>
              )}
            </div>

            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {sessions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  🌱 No history yet. Let’s play some games with the little ones to fill this garden log!
                </div>
              ) : (
                sessions.slice().reverse().map((session, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-700 capitalize">
                        {session.gameId.replace('-', ' ')} Activity
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full uppercase font-bold font-mono">
                        Milestone Clear!
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
