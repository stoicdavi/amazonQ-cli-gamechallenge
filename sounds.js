class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }
    
    createSounds() {
        // Shoot sound - short beep
        this.sounds.shoot = this.createTone(800, 0.1, 'square');
        
        // Robot destroyed - explosion
        this.sounds.robotDestroyed = this.createTone(200, 0.3, 'sawtooth');
        
        // Human rescued - positive chime
        this.sounds.humanRescued = this.createTone(600, 0.2, 'sine');
        
        // Player hit - negative buzz
        this.sounds.playerHit = this.createTone(150, 0.5, 'sawtooth');
        
        // Wave complete - victory sound
        this.sounds.waveComplete = this.createTone(400, 0.4, 'triangle');
    }
    
    createTone(frequency, duration, type = 'sine') {
        return {
            frequency: frequency,
            duration: duration,
            type: type
        };
    }
    
    play(soundName) {
        if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
        oscillator.type = sound.type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}