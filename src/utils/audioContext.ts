
class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private nextBuffer: AudioBuffer | null = null;
  private crossfadeDuration = 2; // in seconds
  private currentStartTime = 0;
  private currentPlaybackTime = 0;
  private currentDuration = 0;
  private volume = 1;
  private playing = false;
  private trackEndCallback: (() => void) | null = null;
  private normalizationEnabled = true;
  private targetLoudness = -14; // Target LUFS (Loudness Units relative to Full Scale)
  private loudnessCache: WeakMap<AudioBuffer, number> = new WeakMap();
  
  private constructor() {
    try {
      window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.error('Web Audio API is not supported in this browser', e);
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async ensureContextRunning(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('AudioContext resume failed', e);
      }
    }
  }
  public async loadTrack(audioFile: File): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const arrayBuffer = await audioFile.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  // Calculate the perceived loudness of an audio buffer
  private analyzeTrackLoudness(buffer: AudioBuffer): number {
    if (!buffer || !buffer.getChannelData) return 0;

    // Use cache to avoid re-analyzing the same buffer repeatedly
    const cached = this.loudnessCache.get(buffer);
    if (cached !== undefined) return cached;
    
    // Simple RMS (root mean square) loudness measurement
    // This is a simplified approach compared to full LUFS calculation
    let sumOfSquares = 0;
    let sampleCount = 0;
    
    // Use the first channel (usually left)
    const channelData = buffer.getChannelData(0);
    
    // Sample at intervals to improve performance on larger files
    const samplingRate = Math.max(1, Math.floor(channelData.length / 10000));
    
    for (let i = 0; i < channelData.length; i += samplingRate) {
      sumOfSquares += channelData[i] * channelData[i];
      sampleCount++;
    }
    
    const rms = Math.sqrt(sumOfSquares / Math.max(1, sampleCount));
    
    // Convert RMS to dB (approximation of LUFS)
    // 20 * log10(rms) gives us dB relative to full scale
    // For digital audio, full scale is 1.0
    const db = 20 * Math.log10(Math.max(rms, 1e-8)); // avoid -Infinity
    
    console.log(`Track loudness analysis: ${db.toFixed(2)} dB`);
    this.loudnessCache.set(buffer, db);
    return db;
  }

  // Calculate gain adjustment based on loudness analysis
  private calculateNormalizationGain(loudness: number): number {
    if (!this.normalizationEnabled) return 1.0;
    
    // Calculate difference between target and actual loudness
    const loudnessDifference = this.targetLoudness - loudness;
    
    // Convert dB difference to gain multiplier
    // 10^(dB/20) converts dB to amplitude ratio
    let gainAdjustment = Math.pow(10, loudnessDifference / 20);
    
    // Limit maximum gain to prevent excessive amplification of quiet tracks
    // which could introduce noise or distortion
    const maxGain = 3.0;
    gainAdjustment = Math.min(gainAdjustment, maxGain);
    
    console.log(`Applying normalization gain: ${gainAdjustment.toFixed(2)}x (${loudnessDifference.toFixed(2)} dB adjustment)`);
    return gainAdjustment;
  }

  public async playTrack(buffer: AudioBuffer, startAtTime = 0): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      throw new Error('Audio context not initialized');
    }

    await this.ensureContextRunning();

    // Analyze track loudness and calculate normalization gain
    const trackLoudness = this.analyzeTrackLoudness(buffer);
    const normalizationGain = this.calculateNormalizationGain(trackLoudness);

    // If we already have a track playing, prepare to crossfade
    if (this.currentSource && this.playing && this.crossfadeDuration > 0) {
      // Create a new buffer source for the next track
      this.nextBuffer = buffer;
      this.nextSource = this.audioContext.createBufferSource();
      this.nextSource.buffer = buffer;
      const nextRef = this.nextSource;
      this.nextSource.onended = () => {
        if (this.currentSource === nextRef && this.playing && this.trackEndCallback) {
          this.trackEndCallback();
        }
      };
      
      // Create a new gain node for the next track (starts at 0)
      const nextGain = this.audioContext.createGain();
      nextGain.gain.value = 0;
      
      // Apply normalization gain if enabled
      const normalizedVolume = this.volume * normalizationGain;
      
      // Connect the next source to its gain node and then to the destination
      this.nextSource.connect(nextGain);
      nextGain.connect(this.audioContext.destination);
      
      // Get current time from audio context
      const now = this.audioContext.currentTime;
      
      // Store the existing gain node for cleanup
      const oldGain = this.gainNode;
      
      // Fade out current track - fix: ensure we actually fade out the current track
      oldGain.gain.setValueAtTime(this.volume, now);
      oldGain.gain.linearRampToValueAtTime(0, now + this.crossfadeDuration);
      
      // Fade in next track - start from 0 and ramp up to the current volume
      nextGain.gain.setValueAtTime(0, now);
      nextGain.gain.linearRampToValueAtTime(normalizedVolume, now + this.crossfadeDuration);
      
      // Start the next track (will start silent due to gain = 0)
      this.nextSource.start(0, startAtTime);
      
      // After crossfade duration, clean up old track
      setTimeout(() => {
        // Stop and disconnect old source immediately
        if (this.currentSource) {
          try {
            this.currentSource.stop();
          } catch (e) {
            // Source may already be stopped, ignore error
          }
          this.currentSource.disconnect();
          this.currentSource = null;
        }
        
        // Disconnect old gain node
        try {
          oldGain.disconnect();
        } catch (e) {
          // May already be disconnected, ignore error
        }
        
        // The next source becomes the current source
        this.currentSource = this.nextSource;
        this.gainNode = nextGain;
        this.currentBuffer = this.nextBuffer;
        this.nextSource = null;
        this.nextBuffer = null;
        
        // Reset timing information
        this.currentStartTime = this.audioContext!.currentTime - startAtTime;
        this.currentDuration = buffer.duration;
        
        // Set up track end detection
        this.setTrackEndTimer();
      }, this.crossfadeDuration * 1000);
    } else {
      // First track, starting after being stopped, or crossfade disabled
      if (this.currentSource) {
        this.currentSource.disconnect();
        this.currentSource.stop();
      }
      
      this.currentSource = this.audioContext.createBufferSource();
      this.currentBuffer = buffer;
      this.currentSource.buffer = buffer;
      
      // Apply normalization if enabled
      const normalizedVolume = this.volume * normalizationGain;
      
      // Reset gain node to current volume with normalization
      this.gainNode.gain.value = normalizedVolume;
      
      // Connect and start
      this.currentSource.connect(this.gainNode);
      const currRef = this.currentSource;
      this.currentSource.onended = () => {
        if (this.currentSource === currRef && this.playing && this.trackEndCallback) {
          this.trackEndCallback();
        }
      };
      this.currentSource.start(0, startAtTime);
      
      // Set timing information
      this.currentStartTime = this.audioContext.currentTime - startAtTime;
      this.currentDuration = buffer.duration;
      this.playing = true;
      
      // Set up track end detection
      this.setTrackEndTimer();
    }
  }

  private setTrackEndTimer() {
    if (!this.currentBuffer || !this.audioContext) return;
    
    const timeRemaining = this.currentDuration - this.getCurrentTime();
    
    // Clear any existing timers
    clearTimeout(this.trackEndTimeout);
    
    // Set a new timer for track end
    if (timeRemaining > 0) {
      this.trackEndTimeout = setTimeout(() => {
        if (this.trackEndCallback) {
          this.trackEndCallback();
        }
      }, timeRemaining * 1000);
    }
  }

  private trackEndTimeout: any = null;

  public pause(): void {
    if (!this.audioContext) return;
    
    if (this.playing) {
      this.audioContext.suspend();
      this.currentPlaybackTime = this.getCurrentTime();
      this.playing = false;
      clearTimeout(this.trackEndTimeout);
    }
  }

  public resume(): void {
    if (!this.audioContext) return;
    
    if (!this.playing && this.currentSource) {
      this.audioContext.resume();
      this.playing = true;
      this.setTrackEndTimer();
    }
  }

  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Source may already be stopped, ignore error
      }
      this.currentSource = null;
    }
    if (this.nextSource) {
      try {
        this.nextSource.stop();
        this.nextSource.disconnect();
      } catch (e) {
        // Source may already be stopped, ignore error
      }
      this.nextSource = null;
    }
    this.playing = false;
    this.currentPlaybackTime = 0;
    this.currentBuffer = null;
    this.nextBuffer = null;
    clearTimeout(this.trackEndTimeout);
  }

  public seekTo(time: number): void {
    if (!this.currentBuffer || !this.audioContext) return;
    
    const wasPlaying = this.playing;
    const bufferToRestore = this.currentBuffer; // Preserve buffer before stop()
    
    // Stop current playback
    this.stop();
    
    // Restore the buffer that was cleared by stop()
    this.currentBuffer = bufferToRestore;
    
    // Start a new source at the seek position
    if (wasPlaying && this.currentBuffer) {
      this.playTrack(this.currentBuffer, time);
    } else {
      this.currentPlaybackTime = time;
    }
  }

  public getCurrentTime(): number {
    if (!this.playing || !this.audioContext) {
      return this.currentPlaybackTime;
    }
    return this.audioContext.currentTime - this.currentStartTime;
  }

  public getDuration(): number {
    return this.currentDuration;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      // When updating volume, we need to maintain the normalization
      if (this.currentBuffer && this.normalizationEnabled) {
        const trackLoudness = this.analyzeTrackLoudness(this.currentBuffer);
        const normalizationGain = this.calculateNormalizationGain(trackLoudness);
        this.gainNode.gain.value = this.volume * normalizationGain;
      } else {
        this.gainNode.gain.value = this.volume;
      }
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public onTrackEnd(callback: () => void): void {
    this.trackEndCallback = callback;
  }

  public setCrossfadeDuration(seconds: number): void {
    this.crossfadeDuration = Math.max(0, Math.min(10, seconds));
    console.log(`Crossfade duration set to ${this.crossfadeDuration} seconds`);
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }
  
  public setNormalizationEnabled(enabled: boolean): void {
    this.normalizationEnabled = enabled;
    console.log(`Volume normalization ${enabled ? 'enabled' : 'disabled'}`);
    
    // Apply normalization to current track if playing
    if (this.playing && this.currentBuffer && this.gainNode) {
      if (enabled) {
        const trackLoudness = this.analyzeTrackLoudness(this.currentBuffer);
        const normalizationGain = this.calculateNormalizationGain(trackLoudness);
        this.gainNode.gain.value = this.volume * normalizationGain;
      } else {
        this.gainNode.gain.value = this.volume;
      }
    }
  }
  
  public isNormalizationEnabled(): boolean {
    return this.normalizationEnabled;
  }
}

export default AudioManager.getInstance();
