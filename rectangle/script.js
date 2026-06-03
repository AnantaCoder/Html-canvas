// Import Modular Components
import { 
    initAudio, 
    setRainVolume, 
    playThunderSound, 
    changeMusicType, 
    setMusicVolume, 
    resetAmbientThunderTimer, 
    isAudioInitialized,
    musicType
} from "./audio.js";

import { 
    TwinkleStar, 
    RainStreak, 
    WindowDrop, 
    SteamParticle, 
    SwayingTree, 
    WindowLightning, 
    drawOutsideStorm, 
    drawInsideRoom 
} from "./visuals.js";

// DOM Elements
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const panelToggleBtn = document.getElementById("panelToggleBtn");
const controlPanel = document.getElementById("controlPanel");
const musicSelect = document.getElementById("musicSelect");
const musicVolSlider = document.getElementById("musicVol");
const musicVolVal = document.getElementById("musicVolVal");
const rainVolSlider = document.getElementById("rainVol");
const rainVolVal = document.getElementById("rainVolVal");
const thunderVolSlider = document.getElementById("thunderVol");
const thunderVolVal = document.getElementById("thunderVolVal");
const thunderFreqSlider = document.getElementById("thunderFreq");
const thunderFreqVal = document.getElementById("thunderFreqVal");
const triggerLightningBtn = document.getElementById("triggerLightningBtn");
const panelClock = document.getElementById("panelClock");
const enableThunderCheckbox = document.getElementById("enableThunder");

// States
let lightningIntensity = 0;
let thunderTimeout = null;
let rainDirectionAngle = 0.08; // Wind direction

// Responsive coordinate parameters (recalculated on resize)
let winX1, winX2, winY1, winY2, sillY, winW, winH;
let cupX, cupY, lampX, lampY;

const config = {
    rainStreakCount: 150,
    windowDropCount: 40,
    steamParticleCount: 15,
    starCount: 100
};

// Component arrays
const rainStreaks = [];
const windowDrops = [];
const steamParticles = [];
const trees = [];
const stars = [];
const activeLightning = [];

// ----------------------------------------------------
// UI Events & Sliders Setup
// ----------------------------------------------------

panelToggleBtn.addEventListener("click", () => {
    controlPanel.classList.toggle("hidden");
    if (!isAudioInitialized) {
        initAudioEngine();
    }
});

function initAudioEngine() {
    const initialFreq = enableThunderCheckbox.checked ? parseInt(thunderFreqSlider.value) : Infinity;
    initAudio(
        parseFloat(rainVolSlider.value), 
        parseFloat(rainVolSlider.value), 
        initialFreq, 
        triggerAmbientLightning
    );
}

// Enable/Disable auto thunder
enableThunderCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
        if (isAudioInitialized) {
            resetAmbientThunderTimer(parseInt(thunderFreqSlider.value), triggerAmbientLightning);
        }
    } else {
        if (isAudioInitialized) {
            resetAmbientThunderTimer(Infinity, triggerAmbientLightning);
        }
    }
});

// Update clock time
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    panelClock.textContent = `${timeStr} • ${dateStr}`;
}
setInterval(updateClock, 1000);
updateClock();

musicVolSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    musicVolVal.textContent = Math.round(val * 100) + "%";
    if (isAudioInitialized) {
        setMusicVolume(val);
        // Refresh active music volume
        changeMusicType(musicSelect.value, val);
    }
});

rainVolSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    rainVolVal.textContent = Math.round(val * 100) + "%";
    if (isAudioInitialized) {
        setRainVolume(val);
    }
});

thunderVolSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    thunderVolVal.textContent = Math.round(val * 100) + "%";
});

function formatTime(seconds) {
    if (seconds < 60) return seconds + "s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + "m" + (secs > 0 ? " " + secs + "s" : "");
}

thunderFreqSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    thunderFreqVal.textContent = formatTime(val);
    if (isAudioInitialized && enableThunderCheckbox.checked) {
        resetAmbientThunderTimer(val, triggerAmbientLightning);
    }
});

musicSelect.addEventListener("change", (e) => {
    if (e.target.value === "github") {
        window.open("https://github.com/anantacoder", "_blank");
        // Revert select back to previous music track
        musicSelect.value = musicType || "none";
        return;
    }
    if (!isAudioInitialized) initAudioEngine();
    changeMusicType(e.target.value, parseFloat(musicVolSlider.value));
});

triggerLightningBtn.addEventListener("click", () => {
    if (!isAudioInitialized) initAudioEngine();
    triggerLightning(false);
});

// ----------------------------------------------------
// Lightning Logic & Timing
// ----------------------------------------------------

function triggerLightning(isQuiet = false) {
    if (thunderTimeout) clearTimeout(thunderTimeout);
    
    lightningIntensity = 1.0;
    
    activeLightning.push(new WindowLightning(winX1, winW, winY1, sillY));
    if (Math.random() > 0.4) {
        activeLightning.push(new WindowLightning(winX1, winW, winY1, sillY));
    }

    const delay = isQuiet ? 1800 : (100 + Math.random() * 1200); 
    const intensity = isQuiet ? 0.35 : (0.55 + Math.random() * 0.45);

    thunderTimeout = setTimeout(() => {
        playThunderSound(intensity, parseFloat(thunderVolSlider.value));
    }, delay);
}

function triggerAmbientLightning() {
    triggerLightning(false);
}

// ----------------------------------------------------
// Mouse / Touch Interactivity
// ----------------------------------------------------

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX > winX1 && clickX < winX2 && clickY > winY1 && clickY < winY2) {
        if (!isAudioInitialized) initAudioEngine();
        triggerLightning(false);
    }
});

canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.touches[0].clientX - rect.left;
        const clickY = e.touches[0].clientY - rect.top;

        if (clickX > winX1 && clickX < winX2 && clickY > winY1 && clickY < winY2) {
            if (!isAudioInitialized) initAudioEngine();
            triggerLightning(false);
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    rainDirectionAngle = ((x / canvas.width) - 0.5) * 0.7;
});

canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        rainDirectionAngle = ((x / canvas.width) - 0.5) * 0.7;
    }
});

// ----------------------------------------------------
// Resizing & Scaling
// ----------------------------------------------------

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    winX1 = canvas.width * 0.12;
    winX2 = canvas.width * 0.88;
    winY1 = canvas.height * 0.1;
    winY2 = canvas.height * 0.68;
    sillY = canvas.height * 0.68;
    winW = winX2 - winX1;
    winH = winY2 - winY1;

    cupX = winX1 + winW * 0.75;
    cupY = sillY + (canvas.height - sillY) * 0.45;

    lampX = winX2 - winW * 0.1;
    lampY = sillY;

    const screenArea = canvas.width * canvas.height;
    config.rainStreakCount = Math.min(250, Math.floor(screenArea / 3200));
    config.starCount = Math.min(150, Math.floor(screenArea / 6000));
    config.windowDropCount = Math.min(60, Math.floor(winW / 16));

    stars.length = 0;
    for (let i = 0; i < config.starCount; i++) {
        stars.push(new TwinkleStar(winX1, winW, winY1, winH));
    }

    rainStreaks.length = 0;
    for (let i = 0; i < config.rainStreakCount; i++) {
        rainStreaks.push(new RainStreak(winX1, winW, winY1, winH));
    }

    windowDrops.length = 0;
    for (let i = 0; i < config.windowDropCount; i++) {
        windowDrops.push(new WindowDrop(winX1, winW, winY1, winH));
    }

    trees.length = 0;
    trees.push(new SwayingTree(winX1 + winW * 0.16, canvas.height * 0.25, "far", sillY));
    trees.push(new SwayingTree(winX1 + winW * 0.05, canvas.height * 0.32, "near", sillY));
    trees.push(new SwayingTree(winX2 - winW * 0.18, canvas.height * 0.22, "far", sillY));
    trees.push(new SwayingTree(winX2 - winW * 0.06, canvas.height * 0.28, "near", sillY));

    steamParticles.length = 0;
    for (let i = 0; i < config.steamParticleCount; i++) {
        steamParticles.push(new SteamParticle(cupX, cupY - 20));
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ----------------------------------------------------
// Animation Loop
// ----------------------------------------------------

function animate(time = 0) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Render outside stormy view
    drawOutsideStorm(
        ctx, time, winX1, winY1, winW, winH, winX2, winY2, sillY, 
        rainDirectionAngle, lightningIntensity, stars, activeLightning, trees, rainStreaks, windowDrops
    );

    // 2. Render indoor room overlay
    drawInsideRoom(
        ctx, time, canvas.width, canvas.height, winX1, winX2, winY1, winY2, sillY, 
        winW, winH, cupX, cupY, lampX, lampY, rainDirectionAngle, lightningIntensity, steamParticles
    );

    // Lightning flash visual decay
    if (lightningIntensity > 0) {
        if (Math.random() < 0.22) {
            lightningIntensity -= 0.02; // Flicker
        } else {
            lightningIntensity -= 0.05; // Fade
        }
        if (lightningIntensity < 0) lightningIntensity = 0;
    }

    requestAnimationFrame(animate);
}

animate();