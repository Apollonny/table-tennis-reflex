





class SoundEngine {
    constructor() {
        this.ctx = null;
        try {
            this.muted = localStorage.getItem('tt_sound_muted') === 'true';
        } catch (e) {
            this.muted = false;
        }
        this.buffers = {};
        this.soundFiles = {
            hit: 'sounds/hit.mp3',
            smash: 'sounds/smash.wav',
            block: 'sounds/block.wav',
            score: 'sounds/score.wav'
        };
        this.initialized = false;


        const unlock = () => {
            this.init();
            this.resume();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { passive: true, once: true });
        window.addEventListener('touchstart', unlock, { passive: true, once: true });
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : 0.85;
            this.masterGain.connect(this.ctx.destination);
            this.loadAllBuffers();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadAllBuffers() {
        for (const [key, url] of Object.entries(this.soundFiles)) {
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.arrayBuffer();
                })
                .then(buf => this.ctx.decodeAudioData(buf))
                .then(decoded => {
                    this.buffers[key] = decoded;
                })
                .catch(err => {
                    console.log(`Audio file for ${key} not found:`, err.message);
                });
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('tt_sound_muted', this.muted ? 'true' : 'false');
        } catch (e) {}
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
        }
        return this.muted;
    }

    play(name, panX = 0, volumeScale = 1.0) {
        if (this.muted) return;
        if (!this.ctx) this.init();
        this.resume();


        if (this.buffers[name]) {
            this.playSample(this.buffers[name], panX, volumeScale);
        } else if (['bounce', 'hit', 'smash', 'block', 'score', 'whistle_start', 'whistle_end'].includes(name)) {

            this.playSynthesized(name, panX, volumeScale);
        }
    }

    playSample(buffer, panX = 0, volumeScale = 1.0) {
        if (!this.ctx) return;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = Math.min(1.5, Math.max(0.1, volumeScale));

        if (this.ctx.createStereoPanner) {
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, panX));
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
        } else {
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
        }

        source.start(0);
    }


    playSynthesized(type, panX = 0, volume = 1.0) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        let panner = null;
        if (this.ctx.createStereoPanner) {
            panner = this.ctx.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, panX));
            gain.connect(panner);
            panner.connect(this.masterGain);
        } else {
            gain.connect(this.masterGain);
        }

        if (type === 'bounce') {

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);
            gain.gain.setValueAtTime(0.7 * volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.09);
        } else if (type === 'hit') {

            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
            gain.gain.setValueAtTime(0.9 * volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.1);
        } else if (type === 'smash') {

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(620, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
            gain.gain.setValueAtTime(1.1 * volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.17);
        } else if (type === 'block') {

            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
            gain.gain.setValueAtTime(0.7 * volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.08);
        } else if (type === 'whistle_start' || type === 'whistle_end') {

            osc.type = 'sine';
            osc.frequency.setValueAtTime(2400, t);
            osc.frequency.linearRampToValueAtTime(2600, t + 0.15);
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(0.4 * volume, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.36);
        } else if (type === 'score') {

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, t);
            osc.frequency.setValueAtTime(659.25, t + 0.08);
            gain.gain.setValueAtTime(0.4 * volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.31);
        }
    }
}

window.SoundEngine = SoundEngine;
window.soundEngine = new SoundEngine();
