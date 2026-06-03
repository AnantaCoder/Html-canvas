// State
export let audioCtx = null;
export let rainGainNode = null;
export let windGainNode = null;
export let isAudioInitialized = false;
export let musicType = "none";

let lofiInterval = null;
let pianoTimeout = null;
let chimesTimeout = null;
let fireplaceTimeout = null;
let synthwaveInterval = null;
let fluteTimeout = null;
let technoInterval = null;
let droneOscs = [];
let droneGainNode = null;

let ambientThunderInterval = null;
let technoStep = 0;

// Lofi chord notes frequencies
const lofiChordsList = [
    [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
    [174.61, 220.00, 261.63, 329.63, 392.00]  // Fmaj9 (F3, A3, C4, E4, G4)
];
let lofiChordIndex = 0;

// Pentatonic scale notes for Mellow Piano
const pianoScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // C major pentatonic

// Chime frequencies (bell tones)
const chimeFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];

// Synthwave bass notes pattern
const synthwavePattern = [130.81, 196.00, 261.63, 196.00, 155.56, 233.08, 311.13, 233.08]; // C & Eb bass runs
let synthwaveStep = 0;

export function initAudio(rainVol, windVol, intervalSec, triggerLightningCallback) {
    if (audioCtx) return;
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 1. Synthesize Rain Audio (White Noise + Bandpass Filter)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000;
    filter.Q.value = 0.45;

    // Gain node for rain volume control
    rainGainNode = audioCtx.createGain();
    rainGainNode.gain.setValueAtTime(rainVol * 0.45, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGainNode);
    rainGainNode.connect(audioCtx.destination);
    whiteNoise.start();

    // 2. Synthesize Ambient lowpass wind sound
    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 85;

    windGainNode = audioCtx.createGain();
    windGainNode.gain.setValueAtTime(rainVol * 0.15, audioCtx.currentTime);

    const windNoise = audioCtx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    windNoise.connect(windFilter);
    windFilter.connect(windGainNode);
    windGainNode.connect(audioCtx.destination);
    windNoise.start();
    
    isAudioInitialized = true;
    resetAmbientThunderTimer(intervalSec, triggerLightningCallback);
}

export function setRainVolume(val) {
    if (rainGainNode) {
        rainGainNode.gain.setTargetAtTime(val * 0.45, audioCtx.currentTime, 0.1);
    }
    if (windGainNode) {
        windGainNode.gain.setTargetAtTime(val * 0.15, audioCtx.currentTime, 0.1);
    }
}

export function playThunderSound(intensity = 1.0, thunderVol = 0.7) {
    if (!audioCtx) return;

    const targetIntensity = intensity * thunderVol;
    if (targetIntensity <= 0.01) return;

    const sampleRate = audioCtx.sampleRate;
    const duration = 4.0; 
    const bufferSize = sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const thunderSource = audioCtx.createBufferSource();
    thunderSource.buffer = noiseBuffer;

    // 1. Deep low-frequency rumble
    const lpFilter = audioCtx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 65; 

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    const peakVolume = 1.25 * targetIntensity; // Boosted volume
    gainNode.gain.exponentialRampToValueAtTime(peakVolume, audioCtx.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.2);

    thunderSource.connect(lpFilter);
    lpFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 2. High-frequency crackle overlay
    if (targetIntensity > 0.4) {
        const crackleFilter = audioCtx.createBiquadFilter();
        crackleFilter.type = "bandpass";
        crackleFilter.frequency.value = 380;
        crackleFilter.Q.value = 2.0;

        const crackleGain = audioCtx.createGain();
        crackleGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        crackleGain.gain.linearRampToValueAtTime(0.24 * targetIntensity, audioCtx.currentTime + 0.05); // Boosted crackle
        crackleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);

        thunderSource.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(audioCtx.destination);
    }

    // 3. Dynamic "THUD" (low oscillator pitch sliding wave)
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(65, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 0.8);

    oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    oscGain.gain.linearRampToValueAtTime(1.4 * targetIntensity, audioCtx.currentTime + 0.04); // Boosted low thud
    oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
    thunderSource.start();
}

export function changeMusicType(type, musicVol) {
    stopLofiChords();
    stopPianoNotes();
    stopChimes();
    stopSynthwave();
    stopFireplace();
    stopFlute();
    stopTechno();
    stopDrone();
    
    musicType = type;
    
    if (musicType === "lofi") {
        playNextLofiChord(musicVol);
        lofiInterval = setInterval(() => playNextLofiChord(musicVol), 6000);
    } else if (musicType === "piano") {
        playNextPianoNote(musicVol);
    } else if (musicType === "meditation") {
        startMeditationDrone(musicVol);
    } else if (musicType === "chimes") {
        playNextChime(musicVol);
    } else if (musicType === "synthwave") {
        playSynthwaveStep(musicVol);
        synthwaveInterval = setInterval(() => playSynthwaveStep(musicVol), 350); 
    } else if (musicType === "fireplace") {
        playFireplaceCrackle(musicVol);
    } else if (musicType === "flute") {
        playNextFluteNote(musicVol);
    } else if (musicType === "techno") {
        technoStep = 0;
        playTechnoStep(musicVol);
        technoInterval = setInterval(() => playTechnoStep(musicVol), 120); // 120ms per 16th note step at 125 BPM
    }
}

export function setMusicVolume(val) {
    if (droneGainNode && musicType === "meditation") {
        droneGainNode.gain.setTargetAtTime(0.9 * val, audioCtx.currentTime, 0.15);
    }
}

function playNextLofiChord(musicVol) {
    if (!audioCtx || musicType !== "lofi") return;
    
    const chord = lofiChordsList[lofiChordIndex];
    lofiChordIndex = (lofiChordIndex + 1) % lofiChordsList.length;
    
    const now = audioCtx.currentTime;
    
    chord.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.36 * musicVol, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 6.0);
    });
}

function stopLofiChords() {
    if (lofiInterval) {
        clearInterval(lofiInterval);
        lofiInterval = null;
    }
}

function playNextPianoNote(musicVol) {
    if (!audioCtx || musicType !== "piano") return;
    
    const now = audioCtx.currentTime;
    const note = pianoScale[Math.floor(Math.random() * pianoScale.length)];
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(note, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.52 * musicVol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    
    const delay = audioCtx.createDelay();
    delay.delayTime.setValueAtTime(0.4, now);
    const feedback = audioCtx.createGain();
    feedback.gain.setValueAtTime(0.4, now);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 3.0);
    
    const nextNoteDelay = 1200 + Math.random() * 2000;
    pianoTimeout = setTimeout(() => playNextPianoNote(musicVol), nextNoteDelay);
}

function stopPianoNotes() {
    if (pianoTimeout) {
        clearTimeout(pianoTimeout);
        pianoTimeout = null;
    }
}

function playNextChime(musicVol) {
    if (!audioCtx || musicType !== "chimes") return;
    
    const now = audioCtx.currentTime;
    const note = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(note, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.36 * musicVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(note * 2, now); 
    filter.Q.setValueAtTime(1.5, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 5.0);
    
    const nextDelay = 1500 + Math.random() * 3500;
    chimesTimeout = setTimeout(() => playNextChime(musicVol), nextDelay);
}

function stopChimes() {
    if (chimesTimeout) {
        clearTimeout(chimesTimeout);
        chimesTimeout = null;
    }
}

function playSynthwaveStep(musicVol) {
    if (!audioCtx || musicType !== "synthwave") return;
    
    const now = audioCtx.currentTime;
    const freq = synthwavePattern[synthwaveStep];
    synthwaveStep = (synthwaveStep + 1) % synthwavePattern.length;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq / 2, now); 
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.44 * musicVol, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.45);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.55);
}

function stopSynthwave() {
    if (synthwaveInterval) {
        clearInterval(synthwaveInterval);
        synthwaveInterval = null;
    }
}

function playFireplaceCrackle(musicVol) {
    if (!audioCtx || musicType !== "fireplace") return;
    
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(900 + Math.random() * 1600, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.036 * musicVol, now + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.02);
    
    if (Math.random() < 0.08) {
        const rumbleOsc = audioCtx.createOscillator();
        const rumbleGain = audioCtx.createGain();
        rumbleOsc.type = "triangle";
        rumbleOsc.frequency.setValueAtTime(45 + Math.random() * 40, now);
        
        rumbleGain.gain.setValueAtTime(0, now);
        rumbleGain.gain.linearRampToValueAtTime(0.16 * musicVol, now + 0.08);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(audioCtx.destination);
        rumbleOsc.start(now);
        rumbleOsc.stop(now + 0.5);
    }
    
    const delay = 20 + Math.random() * 200;
    fireplaceTimeout = setTimeout(() => playFireplaceCrackle(musicVol), delay);
}

function stopFireplace() {
    if (fireplaceTimeout) {
        clearTimeout(fireplaceTimeout);
        fireplaceTimeout = null;
    }
}

function startMeditationDrone(musicVol) {
    if (!audioCtx || musicType !== "meditation") return;
    
    const now = audioCtx.currentTime;
    
    droneGainNode = audioCtx.createGain();
    droneGainNode.gain.setValueAtTime(0, now);
    droneGainNode.gain.linearRampToValueAtTime(0.9 * musicVol, now + 3.0); 
    
    const osc1 = audioCtx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(65.41, now); 
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(65.65, now); 
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(95, now); 
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGainNode);
    droneGainNode.connect(audioCtx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    droneOscs = [osc1, osc2, filter];
}

function stopDrone() {
    if (droneGainNode) {
        const now = audioCtx.currentTime;
        droneGainNode.gain.setValueAtTime(droneGainNode.gain.value, now);
        droneGainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        const currentOscs = [...droneOscs];
        setTimeout(() => {
            currentOscs.forEach(o => { try { o.stop(); } catch(e) {} });
        }, 1300);
        
        droneGainNode = null;
        droneOscs = [];
    }
}

export function resetAmbientThunderTimer(intervalSec, triggerLightningCallback) {
    if (ambientThunderInterval) clearInterval(ambientThunderInterval);
    if (intervalSec === Infinity) return; // Allows disabling auto thunder
    ambientThunderInterval = setInterval(() => {
        if (isAudioInitialized) {
            triggerLightningCallback();
        }
    }, intervalSec * 1000);
}

// ----------------------------------------------------
// Flute & Techno Beat Synthesis Track Engines
// ----------------------------------------------------

const fluteScale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // A Minor Pentatonic

function playNextFluteNote(musicVol) {
    if (!audioCtx || musicType !== "flute") return;
    
    const now = audioCtx.currentTime;
    const note = fluteScale[Math.floor(Math.random() * fluteScale.length)];
    
    // Primary voice (sine wave)
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(note, now);
    
    // Add 5.5Hz vibrato (LFO)
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(note * 0.012, now); // Vibrato depth
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    // Breathing noise (air sound)
    const bufferSize = audioCtx.sampleRate * 0.15; 
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const breathSource = audioCtx.createBufferSource();
    breathSource.buffer = noiseBuffer;
    breathSource.loop = true;
    
    const hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(2500, now);
    
    const breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0, now);
    
    // Main Gain
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    
    // Slow breathing attack and long release
    const attack = 0.6;
    const duration = 2.0 + Math.random() * 1.5;
    const release = 1.0;
    
    gainNode.gain.linearRampToValueAtTime(0.48 * musicVol, now + attack);
    gainNode.gain.setValueAtTime(0.48 * musicVol, now + duration);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration + release);
    
    breathGain.gain.linearRampToValueAtTime(0.02 * musicVol, now + attack);
    breathGain.gain.setValueAtTime(0.02 * musicVol, now + duration);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);
    
    // Delay / Echo space for ethereal feel
    const delay = audioCtx.createDelay();
    delay.delayTime.setValueAtTime(0.5, now);
    const feedback = audioCtx.createGain();
    feedback.gain.setValueAtTime(0.5, now);
    
    osc.connect(gainNode);
    breathSource.connect(hpFilter);
    hpFilter.connect(breathGain);
    breathGain.connect(gainNode);
    
    gainNode.connect(audioCtx.destination);
    
    gainNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);
    
    lfo.start(now);
    osc.start(now);
    breathSource.start(now);
    
    lfo.stop(now + duration + release + 0.5);
    osc.stop(now + duration + release + 0.5);
    breathSource.stop(now + duration + release + 0.5);
    
    const nextNoteDelay = (duration * 1000) - 200 + Math.random() * 800;
    fluteTimeout = setTimeout(() => playNextFluteNote(musicVol), nextNoteDelay);
}

function stopFlute() {
    if (fluteTimeout) {
        clearTimeout(fluteTimeout);
        fluteTimeout = null;
    }
}

function playTechnoStep(musicVol) {
    if (!audioCtx || musicType !== "techno") return;
    
    const now = audioCtx.currentTime;
    
    // 1. Kick Drum on beats 0, 4, 8, 12 (Quarter notes)
    if (technoStep % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.8 * musicVol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    // 2. Closed Hi-hat on steps 2, 6, 10, 14 (Off-beats)
    if (technoStep % 4 === 2) {
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const hatSource = audioCtx.createBufferSource();
        hatSource.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7000, now);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.16 * musicVol, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        hatSource.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        hatSource.start(now);
    }
    
    // 3. Syncopated synthesizer bass arpeggios
    const activeBassSteps = [0, 3, 6, 8, 11, 14];
    if (activeBassSteps.includes(technoStep)) {
        const bassFreqs = [55.00, 55.00, 65.41, 73.42, 65.41, 55.00]; 
        const freq = bassFreqs[activeBassSteps.indexOf(technoStep)];
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.24 * musicVol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        const lp = audioCtx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(180, now);
        
        osc.connect(lp);
        lp.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
    
    technoStep = (technoStep + 1) % 16;
}

function stopTechno() {
    if (technoInterval) {
        clearInterval(technoInterval);
        technoInterval = null;
    }
}
