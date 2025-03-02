
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

  public async loadTrack(audioFile: File): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const arrayBuffer = await audioFile.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  public async playTrack(buffer: AudioBuffer, startAtTime = 0): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      throw new Error('Audio context not initialized');
    }

    // If we already have a track playing, prepare to crossfade
    if (this.currentSource && this.playing && this.crossfadeDuration > 0) {
      // Create a new buffer source for the next track
      this.nextBuffer = buffer;
      this.nextSource = this.audioContext.createBufferSource();
      this.nextSource.buffer = buffer;
      
      // Create a new gain node for the next track (starts at 0)
      const nextGain = this.audioContext.createGain();
      nextGain.gain.value = 0;
      
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
      nextGain.gain.linearRampToValueAtTime(this.volume, now + this.crossfadeDuration);
      
      // Start the next track (will start silent due to gain = 0)
      this.nextSource.start(0, startAtTime);
      
      // After crossfade duration, clean up old track
      setTimeout(() => {
        // Disconnect and clean up old source
        if (this.currentSource) {
          this.currentSource.disconnect();
          this.currentSource.stop();
          this.currentSource = null;
        }
        oldGain.disconnect();
        
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
      
      // Reset gain node to current volume
      this.gainNode.gain.value = this.volume;
      
      // Connect and start
      this.currentSource.connect(this.gainNode);
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
      this.currentSource.stop();
      this.currentSource = null;
    }
    if (this.nextSource) {
      this.nextSource.stop();
      this.nextSource = null;
    }
    this.playing = false;
    this.currentPlaybackTime = 0;
    clearTimeout(this.trackEndTimeout);
  }

  public seekTo(time: number): void {
    if (!this.currentBuffer || !this.audioContext) return;
    
    const wasPlaying = this.playing;
    
    // Stop current playback
    this.stop();
    
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
      this.gainNode.gain.value = this.volume;
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
}

export default AudioManager.getInstance();
