export class SoundManager {
    constructor() {
        this.sounds = {
            waka: new Audio('sounds/waka.mp3'),
            siren: new Audio('sounds/siren.mp3'),
            scared: new Audio('sounds/scared.mp3'),
            eatGhost: new Audio('sounds/eat_ghost.mp3'),
            die: new Audio('sounds/die.mp3'),
            start: new Audio('sounds/start.mp3')
        };

        // Configure Loops
        this.sounds.siren.loop = true;
        this.sounds.scared.loop = true;

        // Volume Mixing - RESTORED TO AUTHENTIC LEVELS
        this.sounds.siren.volume = 0.3;    // Restored (was 0.15)
        this.sounds.scared.volume = 0.6;   // Restored loud panic (was 0.1)

        this.sounds.waka.volume = 0.4;
        this.sounds.eatGhost.volume = 0.6;
        this.sounds.die.volume = 0.6;
    }

    play(name) {
        const sound = this.sounds[name];
        if (!sound) return;

        // "Waka" Logic: 
        if (name === 'waka' && !sound.paused) {
            return;
        }

        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }

    stop(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    startSiren() {
        if (!this.sounds.siren.paused) return;

        this.stop('scared');
        this.sounds.siren.play().catch(e => { });
    }

    startScared() {
        if (!this.sounds.scared.paused) return;

        this.stop('siren');
        this.sounds.scared.play().catch(e => { });
    }

    stopBackground() {
        this.stop('siren');
        this.stop('scared');
    }

    stopAll() {
        Object.keys(this.sounds).forEach(key => {
            this.stop(key);
        });
    }
}