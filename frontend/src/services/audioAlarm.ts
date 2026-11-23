// Web Audio API Dual-Tone Emergency Siren Synthesizer
// Falls back to <audio> element playback when Web Audio API is unavailable or blocked.

class AudioAlarmService {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlaying: boolean = false;
  // Fallback for browsers that block Web Audio until a user gesture after navigation
  private audioEl: HTMLAudioElement | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Pre-unlock audio on user tap to comply with iOS Safari & Chrome Autoplay policies
  public unlockAudio() {
    this.initContext();
    if (this.audioCtx) {
      // Create a momentary silent buffer to unlock the audio hardware
      const buffer = this.audioCtx.createBuffer(1, 1, 22050);
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start(0);
    }
  }

  public startSiren(durationSeconds?: number) {
    if (this.isPlaying) return;
    this.initContext();
    this.isPlaying = true;

    // Try Web Audio API (synthesized dual-tone siren)
    if (this.audioCtx && this.audioCtx.state === 'running') {
      // Create dynamics compressor to maximize loudness without digital clipping
      const compressor = this.audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
      compressor.knee.setValueAtTime(40, this.audioCtx.currentTime);
      compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
      compressor.attack.setValueAtTime(0, this.audioCtx.currentTime);
      compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);
      compressor.connect(this.audioCtx.destination);

      // Gain node at maximum digital volume
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.gainNode.connect(compressor);

      // Dual-frequency European emergency siren (alternating 880Hz and 660Hz)
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();

      let toggle = false;
      this.intervalId = window.setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        const targetFreq = toggle ? 880 : 660;
        this.oscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.05);
        toggle = !toggle;
      }, 400);
    } else {
      // Fallback: play alarm.wav via <audio> element (works even when AudioContext is blocked)
      try {
        this.audioEl = new Audio('/alarm.wav');
        this.audioEl.loop = true;
        this.audioEl.volume = 1.0;
        this.audioEl.play().catch((e) => console.warn('[AudioAlarm] Fallback audio play blocked:', e));
      } catch (e) {
        console.warn('[AudioAlarm] Fallback audio element failed:', e);
      }
    }

    if (durationSeconds) {
      window.setTimeout(() => {
        this.stopSiren();
      }, durationSeconds * 1000);
    }
  }

  public stopSiren() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.oscillator = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Also stop fallback audio element
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.audioEl = null;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const audioAlarm = new AudioAlarmService();
