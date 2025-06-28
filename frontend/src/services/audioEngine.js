// Audio Engine for handling music playback
export class AudioEngine {
    private audio: HTMLAudioElement | null = null;
    private context: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaElementAudioSourceNode | null = null;

    private listeners: { [key: string]: Function[] } = {};

    constructor() {
        this.initializeAudio();
    }

    private initializeAudio() {
        try {
            this.audio = new Audio();
            this.audio.preload = 'metadata';
            this.audio.crossOrigin = 'anonymous';

            // Initialize Web Audio API
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gainNode = this.context.createGain();
            this.analyser = this.context.createAnalyser();

            // Connect nodes
            this.source = this.context.createMediaElementSource(this.audio);
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.context.destination);

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
        }
    }

    private setupEventListeners() {
        if (!this.audio) return;

        this.audio.addEventListener('loadstart', () => this.emit('loadstart'));
        this.audio.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
        this.audio.addEventListener('canplay', () => this.emit('canplay'));
        this.audio.addEventListener('play', () => this.emit('play'));
        this.audio.addEventListener('pause', () => this.emit('pause'));
        this.audio.addEventListener('ended', () => this.emit('ended'));
        this.audio.addEventListener('timeupdate', () => this.emit('timeupdate'));
        this.audio.addEventListener('error', (e) => this.emit('error', e));
        this.audio.addEventListener('waiting', () => this.emit('waiting'));
        this.audio.addEventListener('canplaythrough', () => this.emit('canplaythrough'));
    }

    // Event system
    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    private emit(event: string, data?: any) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }

    // Playback controls
    async load(url: string): Promise<void> {
        if (!this.audio) throw new Error('Audio not initialized');

        return new Promise((resolve, reject) => {
            const onLoad = () => {
                this.audio!.removeEventListener('canplay', onLoad);
                this.audio!.removeEventListener('error', onError);
                resolve();
            };

            const onError = (e: any) => {
                this.audio!.removeEventListener('canplay', onLoad);
                this.audio!.removeEventListener('error', onError);
                reject(e);
            };

            this.audio.addEventListener('canplay', onLoad);
            this.audio.addEventListener('error', onError);
            this.audio.src = url;
        });
    }

    async play(): Promise<void> {
        if (!this.audio) throw new Error('Audio not initialized');

        // Resume AudioContext if suspended
        if (this.context?.state === 'suspended') {
            await this.context.resume();
        }

        return this.audio.play();
    }

    pause() {
        if (!this.audio) return;
        this.audio.pause();
    }

    stop() {
        if (!this.audio) return;
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    // Properties
    get currentTime(): number {
        return this.audio?.currentTime || 0;
    }

    set currentTime(time: number) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    }

    get duration(): number {
        return this.audio?.duration || 0;
    }

    get volume(): number {
        return this.gainNode?.gain.value || 1;
    }

    set volume(value: number) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(value, this.context!.currentTime);
        }
    }

    get paused(): boolean {
        return this.audio?.paused ?? true;
    }

    get ended(): boolean {
        return this.audio?.ended ?? false;
    }

    get buffered(): TimeRanges | undefined {
        return this.audio?.buffered;
    }

    get readyState(): number {
        return this.audio?.readyState || 0;
    }

    // Audio analysis
    getFrequencyData(): Uint8Array {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getWaveformData(): Uint8Array {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    // Audio effects
    setPlaybackRate(rate: number) {
        if (this.audio) {
            this.audio.playbackRate = rate;
        }
    }

    setEqualizer(frequencies: number[]) {
        // Implementation for equalizer bands
        // This would require creating multiple BiquadFilterNode instances
        console.log('Equalizer not yet implemented:', frequencies);
    }

    // Crossfade between tracks
    async crossfade(newUrl: string, duration: number = 3000): Promise<void> {
        if (!this.gainNode || !this.context) return;

        const startTime = this.context.currentTime;
        const endTime = startTime + (duration / 1000);

        // Fade out current track
        this.gainNode.gain.setValueAtTime(this.volume, startTime);
        this.gainNode.gain.linearRampToValueAtTime(0, endTime);

        // Load and start new track after fade completes
        setTimeout(async () => {
            await this.load(newUrl);
            await this.play();

            // Fade in new track
            if (this.gainNode && this.context) {
                const newStartTime = this.context.currentTime;
                const newEndTime = newStartTime + (duration / 1000);

                this.gainNode.gain.setValueAtTime(0, newStartTime);
                this.gainNode.gain.linearRampToValueAtTime(1, newEndTime);
            }
        }, duration);
    }

    // Get audio info
    getAudioInfo() {
        if (!this.audio) return null;

        return {
            src: this.audio.src,
            currentTime: this.audio.currentTime,
            duration: this.audio.duration,
            volume: this.volume,
            paused: this.audio.paused,
            ended: this.audio.ended,
            readyState: this.audio.readyState,
            buffered: this.audio.buffered,
            playbackRate: this.audio.playbackRate,
        };
    }

    // Cleanup
    destroy() {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        if (this.context) {
            this.context.close();
            this.context = null;
        }

        this.listeners = {};
    }
}

// Singleton instance
export const audioEngine = new AudioEngine();
