// Web Audio API Synthesizer for high-performance organic toddler-friendly sounds
// This relies entirely on browser capabilities - zero asset loading, works offline.

class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  // Play a soft wooden/forest block sound (on start dragging or tapping)
  playTap() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn('Audio playTap error', e);
    }
  }

  // Play a bubble popping sound
  playPop() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio playPop error', e);
    }
  }

  // Play a wooden click bar chime for correct matching
  playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      // Sweet pentatonic chord (C5, E5, G5, C6) with short staggered offsets
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Safe beautiful bell tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.5);
      });
    } catch (e) {
      console.warn('Audio playSuccessChime error', e);
    }
  }

  // Play a soft magic swipe sound
  playWinFanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      // Staggered arpeggio
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq * 1.005, now + idx * 0.08); // Slight chorus

        gain.gain.setValueAtTime(0.0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        subOsc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
        subOsc.stop(now + idx * 0.08 + 0.7);
      });
    } catch (e) {
      console.warn('Audio playWinFanfare error', e);
    }
  }

  // Sparkly sound for tracing path movement feedback
  playTraceSparkle(freqMultiplier = 1) {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 * freqMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(1400 * freqMultiplier, now + 0.1);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.12);
    } catch (e) {
      // Ignore audio overlay limits
    }
  }

  // Play a soft animal cry / squeak block (e.g. for feeding, scrubbing, matching duck)
  playCuteSqueak() {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const synth = new SoundSynth();

// Speech Synthesis system with queue-cancelling and options targeting toddlers (higher pitch/friendly)
class ToddlerSpeech {
  private enabled: boolean = true;
  private speed: number = 0.78; // Sweet, slow, and extra gentle for toddlers
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  setSpeed(speed: number) {
    // scale incoming speed gracefully if needed, keeping it sweet & slow
    this.speed = speed;
  }

  cancel() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  speak(text: string) {
    if (!this.enabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      // Cancel previous to maintain focus and avoid chatter overlap
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = this.speed;
      utter.pitch = 1.45; // Sweet higher pitch, gentle and loving like a storybook narrator!

      // Try to find a warm, friendly female or default cute voice in the system
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Filter voices matching English first (neutral foundation)
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        
        // Match specific names of slow, friendly, sweet English female voices
        const sweetFemaleVoice = enVoices.find(v => {
          const name = v.name.toLowerCase();
          return (
            name.includes('samantha') || 
            name.includes('zira') || 
            name.includes('zoe') || 
            name.includes('susan') || 
            name.includes('victoria') || 
            name.includes('hazel') || 
            name.includes('karen') ||
            name.includes('female') || 
            name.includes('natural')
          );
        });

        // Fallback to any general US English voice (highly neutral native baseline)
        const usVoice = enVoices.find(v => v.lang.includes('US') || v.lang === 'en-US');
        
        // Fallback to any English voice
        const anyEnVoice = enVoices[0];

        if (sweetFemaleVoice) {
          utter.voice = sweetFemaleVoice;
        } else if (usVoice) {
          utter.voice = usVoice;
        } else if (anyEnVoice) {
          utter.voice = anyEnVoice;
        }
      }

      this.currentUtterance = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('SpeechSynthesis error', e);
    }
  }
}

export const speech = new ToddlerSpeech();
