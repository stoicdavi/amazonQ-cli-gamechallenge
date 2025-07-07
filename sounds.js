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
        // Laser shoot - sci-fi pew
        this.sounds.shoot = { type: 'laser' };
        
        // Robot explosion - dramatic boom
        this.sounds.robotDestroyed = { type: 'explosion' };
        
        // Human rescued - magical chime
        this.sounds.humanRescued = { type: 'rescue' };
        
        // Player hit - electric zap
        this.sounds.playerHit = { type: 'damage' };
        
        // Wave complete - triumphant fanfare
        this.sounds.waveComplete = { type: 'victory' };
    }
    
    playLaser() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain).connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    playExplosion() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter).connect(gain).connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        osc.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    playRescue() {
        const frequencies = [523, 659, 784]; // C, E, G chord
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain).connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
            
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
    }
    
    playDamage() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain).connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(80, this.audioContext.currentTime + 0.4);
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
    
    playVictory() {
        const melody = [523, 659, 784, 1047]; // C, E, G, C octave
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain).connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.15);
            osc.type = 'triangle';
            
            gain.gain.setValueAtTime(0.25, this.audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.4);
            
            osc.start(this.audioContext.currentTime + i * 0.15);
            osc.stop(this.audioContext.currentTime + i * 0.15 + 0.4);
        });
    }
    
    play(soundName) {
        if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        switch(sound.type) {
            case 'laser':
                this.playLaser();
                break;
            case 'explosion':
                this.playExplosion();
                break;
            case 'rescue':
                this.playRescue();
                break;
            case 'damage':
                this.playDamage();
                break;
            case 'victory':
                this.playVictory();
                break;
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}