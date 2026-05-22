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

  // Plays a beautiful, physical bell/triangle chimed Piano key note with attack-decay envelope
  playPiano(freq: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // Warm octave overtone

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('piano sound synthesization error', e);
    }
  }

  // Plays an acoustic guitar pluck with fast lowpass sweep filter decay
  playGuitar(freq: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('guitar sound synthesization error', e);
    }
  }

  // Synthesizes realistic toddler-friendly acoustic percussion drums
  playDrum(type: 'bass' | 'snare' | 'cymbal' | 'hihat') {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      if (type === 'bass') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'snare') {
        // Snare body pitch sweep
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        oscGain.gain.setValueAtTime(0.18, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);

        // High snap crisp metal resonance
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        const snapFilter = ctx.createBiquadFilter();

        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(1200, now);
        snapOsc.frequency.linearRampToValueAtTime(5500, now + 0.08);

        snapFilter.type = 'bandpass';
        snapFilter.frequency.setValueAtTime(1200, now);

        snapGain.gain.setValueAtTime(0.2, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        snapOsc.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(ctx.destination);

        snapOsc.start(now);
        snapOsc.stop(now + 0.15);
      } else if (type === 'hihat' || type === 'cymbal') {
        const duration = type === 'cymbal' ? 0.65 : 0.08;
        const maxGain = type === 'cymbal' ? 0.15 : 0.08;
        const baseFreq = type === 'cymbal' ? 7000 : 9500;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5500, now);

        gain.gain.setValueAtTime(maxGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      }
    } catch (e) {
      console.warn('drum play error', e);
    }
  }

  // Synthesizes bowed violin strings with expressive vibrato and attack ramps
  playViolin(freq: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vibratoOsc = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Create warm sliding bow vibrato rate
      vibratoOsc.frequency.setValueAtTime(5.8, now); // 5.8Hz vibrato sweep
      vibratoGain.gain.setValueAtTime(freq * 0.015, now); // scale depth based on pitch

      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      // Smooth soft attack & long resonant bow-out
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1); // soft starting rise
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15); // gentle decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      vibratoOsc.start(now);
      osc.start(now);

      vibratoOsc.stop(now + 1.2);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('violin play error', e);
    }
  }
}

export const synth = new SoundSynth();

// Speech Synthesis system with queue-cancelling and options targeting toddlers (pleasant, cheery, soft-spoken female voice)
class ToddlerSpeech {
  private enabled: boolean = true;
  private speed: number = 0.82; // Warm, sweet, cozy and calming pace for young kids
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  setSpeed(speed: number) {
    // Keep it in a very comfortable soft-spoken range (e.g. 0.70 to 0.95 is extremely pleasant)
    this.speed = Math.max(0.65, Math.min(speed, 1.0));
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
      // Cancel previous to maintain focus and avoid bubble chatter overlaps from multiple taps
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = this.speed;
      utter.pitch = 1.20; // 1.2 is cheery, optimistic, and warm (soft-spoken, not mechanical or screechy!)

      // Try to find a warm, friendly female or default cute voice in the system
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Filter voices matching English (neutral foundation)
        const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        
        // Define high-priority search terms for the most pleasant, cheery, soft-spoken female voices in the system
        const premiumFemaleVoicePatterns = [
          'aria',                // Microsoft Aria (Stunning natural, sweet, friendly female)
          'samantha',            // Apple Samantha (Very cozy, soothing storybook female voice)
          'google us english',   // Google US English (Standard warm, crystal-clear female voice)
          'natural',             // Neural natural warm speech voices
          'zira',                // Microsoft Zira (Classic friendly female)
          'susan',               // Microsoft Susan
          'karen',               // Apple Karen (Sweet Australian female)
          'hazel',               // Microsoft Hazel (Friendly UK female)
          'victoria',            // Apple Victoria (Clear classic female)
          'zoe',                 // Apple Zoe
          'female',              // Specifically designated female speaker
          'en-us'                // standard US English fallback
        ];

        let selectedVoice: SpeechSynthesisVoice | null = null;

        // Loop through priorities to find the best matching voice
        for (const pattern of premiumFemaleVoicePatterns) {
          const matched = enVoices.find(v => v.name.toLowerCase().includes(pattern));
          if (matched) {
            selectedVoice = matched;
            break;
          }
        }

        // Second pass: if no English match found, look in other en-US or any English voices
        if (!selectedVoice) {
          const usVoice = enVoices.find(v => v.lang.includes('US') || v.lang === 'en-US');
          selectedVoice = usVoice || enVoices[0];
        }

        if (selectedVoice) {
          utter.voice = selectedVoice;
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
