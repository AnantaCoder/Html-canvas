// Twinkling Star
export class TwinkleStar {
    constructor(winX1, winW, winY1, winH) {
        this.x = winX1 + Math.random() * winW;
        this.y = winY1 + Math.random() * (winH * 0.5); 
        this.size = Math.random() * 1.5 + 0.3;
        this.alpha = Math.random();
        this.twinkleSpeed = 0.005 + Math.random() * 0.015;
    }

    update() {
        this.alpha += this.twinkleSpeed;
    }

    draw(ctx, winX1, winY1, winW, winH) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX1, winY1, winW, winH);
        ctx.clip();

        const displayAlpha = 0.15 + (Math.sin(this.alpha) + 1) * 0.35;
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = displayAlpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Falling Rain Streak
export class RainStreak {
    constructor(winX1, winW, winY1, winH) {
        this.reset(winX1, winW, winY1);
        this.y = winY1 + Math.random() * winH;
    }

    reset(winX1, winW, winY1) {
        this.x = winX1 + Math.random() * winW;
        this.y = winY1 - 20;
        this.length = 15 + Math.random() * 20;
        this.speed = 18 + Math.random() * 10;
        this.opacity = 0.12 + Math.random() * 0.25;
    }

    update(winX1, winW, winY1, sillY, rainDirectionAngle) {
        this.y += this.speed;
        this.x += Math.sin(rainDirectionAngle) * this.speed;

        if (this.y > sillY) {
            this.reset(winX1, winW, winY1);
        }
    }

    draw(ctx, rainDirectionAngle, winX1, winY1, winW, winH) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX1, winY1, winW, winH);
        ctx.clip();

        ctx.strokeStyle = `rgba(150, 175, 195, ${this.opacity})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.sin(rainDirectionAngle) * this.length, 
            this.y + this.length
        );
        ctx.stroke();
        ctx.restore();
    }
}

// Sliding Window Glass Droplet
export class WindowDrop {
    constructor(winX1, winW, winY1, winH) {
        this.reset(winX1, winW, winY1);
        this.y = winY1 + Math.random() * (winH - 10);
    }

    reset(winX1, winW, winY1) {
        this.x = winX1 + 10 + Math.random() * (winW - 20);
        this.y = winY1;
        this.size = 1.2 + Math.random() * 2.3;
        this.speed = 0.1 + Math.random() * 0.4;
        this.slideTime = Math.random() * 100;
        this.trail = [];
    }

    update(winX1, winW, winY1, sillY, rainDirectionAngle) {
        this.slideTime++;

        if (Math.sin(this.slideTime * 0.05) > 0.3) {
            this.y += this.speed * 4;
            this.x += (Math.random() - 0.5) * 0.2 + Math.sin(rainDirectionAngle) * 0.1;

            if (this.trail.length === 0 || Math.random() < 0.35) {
                this.trail.push({x: this.x, y: this.y});
            }
            if (this.trail.length > 8) {
                this.trail.shift();
            }
        }

        if (this.y > sillY - 5) {
            this.reset(winX1, winW, winY1);
        }
    }

    draw(ctx, winX1, winY1, winW, winH) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX1, winY1, winW, winH);
        ctx.clip();

        if (this.trail.length > 1) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
            ctx.lineWidth = this.size * 0.8;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(225, 240, 255, 0.28)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.35, this.y - this.size * 0.35, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Cup Steam Particle
export class SteamParticle {
    constructor(x, y) {
        this.bx = x;
        this.by = y;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x + (Math.random() - 0.5) * 12;
        this.y = y - 20;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -(0.4 + Math.random() * 0.6);
        this.size = 1.5 + Math.random() * 2.5;
        this.alpha = 0.5 + Math.random() * 0.5;
        this.life = 0;
        this.maxLife = 80 + Math.random() * 60;
    }

    update(cupX, cupY, sillY, rainDirectionAngle) {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;
        
        this.bx = cupX;
        this.by = cupY - 20;

        this.size += 0.05;
        this.alpha = 1 - (this.life / this.maxLife);
        this.vx += Math.sin(rainDirectionAngle) * 0.01;

        if (this.life >= this.maxLife || this.y < sillY) {
            this.reset(cupX, cupY);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(220, 220, 230, ${this.alpha * 0.14})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Swaying Tree
export class SwayingTree {
    constructor(x, height, depth, sillY) {
        this.x = x;
        this.y = sillY;
        this.height = height;
        this.depth = depth;
        this.swayAngle = 0;
        this.swaySpeed = 0.02 + Math.random() * 0.015;
    }

    update(sillY, rainDirectionAngle) {
        this.y = sillY;
        const targetSway = rainDirectionAngle * 0.15;
        this.swayAngle += (targetSway - this.swayAngle) * 0.05;
        this.swayAngle += Math.sin(Date.now() * this.swaySpeed * 0.1) * 0.003;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.swayAngle);

        const fillAlpha = this.depth === "far" ? 0.3 : 0.6;
        ctx.fillStyle = `rgba(12, 16, 26, ${fillAlpha})`;

        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-4, -this.height * 0.4);
        ctx.lineTo(-20, -this.height * 0.55);
        ctx.lineTo(-2, -this.height * 0.7);
        ctx.lineTo(-12, -this.height * 0.75);
        ctx.lineTo(0, -this.height);
        ctx.lineTo(12, -this.height * 0.75);
        ctx.lineTo(2, -this.height * 0.7);
        ctx.lineTo(20, -this.height * 0.55);
        ctx.lineTo(4, -this.height * 0.4);
        ctx.lineTo(15, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// Jagged Window Lightning Bolt
export class WindowLightning {
    constructor(winX1, winW, winY1, sillY) {
        const startX = winX1 + Math.random() * winW;
        const startY = winY1;
        const endX = winX1 + Math.random() * winW;
        const endY = sillY - 50 - Math.random() * 100;
        
        this.points = [];
        this.generatePath(startX, startY, endX, endY);
        this.life = 1.0;
        this.color = Math.random() > 0.45 ? "#e3f2fd" : "#f3e5f5";
    }

    generatePath(sx, sy, ex, ey) {
        const steps = 15;
        let cx = sx;
        let cy = sy;
        this.points.push({x: cx, y: cy});

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const targetX = sx + (ex - sx) * t;
            const targetY = sy + (ey - sy) * t;

            const dx = ex - sx;
            const dy = ey - sy;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / (len || 1);
            
            const displacement = (Math.random() - 0.5) * (len / 6) * (1 - t * 0.4);

            cx = targetX + nx * displacement;
            cy = sy + (ey - sy) * t;

            this.points.push({x: cx, y: cy});
        }
    }

    update() {
        this.life -= 0.12; 
    }

    draw(ctx, winX1, winY1, winW, winH) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX1, winY1, winW, winH);
        ctx.clip(); 

        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.lineWidth = 3.5 * this.life;
        ctx.globalAlpha = this.life;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1 * this.life;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
    }
}

// Draw outside storm scene
export function drawOutsideStorm(ctx, time, winX1, winY1, winW, winH, winX2, winY2, sillY, rainDirectionAngle, lightningIntensity, stars, activeLightning, trees, rainStreaks, windowDrops) {
    let skyHue = 215;
    let skySat = 25;
    let skyLight = 11;

    if (lightningIntensity > 0) {
        skySat = 65;
        skyLight = 11 + lightningIntensity * 70;
    }

    ctx.fillStyle = `hsl(${skyHue}, ${skySat}%, ${skyLight}%)`;
    ctx.fillRect(winX1, winY1, winW, winH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(winX1, winY1, winW, winH);
    ctx.clip();

    stars.forEach(star => {
        star.update();
        star.draw(ctx, winX1, winY1, winW, winH);
    });

    for (let i = 0; i < 5; i++) {
        const cloudX = winX1 + ((time * 0.012 + i * (winW / 4.5)) % (winW + 160)) - 80;
        const cloudY = winY1 + 10 + Math.sin(time * 0.0015 + i) * 12;
        const cloudSize = winW * 0.22 + i * 20;

        const cloudGrad = ctx.createRadialGradient(cloudX, cloudY, 10, cloudX, cloudY, cloudSize);
        const colVal = 16 + (lightningIntensity * 48);
        cloudGrad.addColorStop(0, `hsla(${skyHue}, 25%, ${colVal}%, 0.45)`);
        cloudGrad.addColorStop(0.6, `hsla(${skyHue}, 25%, ${colVal - 4}%, 0.2)`);
        cloudGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = activeLightning.length - 1; i >= 0; i--) {
        const bolt = activeLightning[i];
        bolt.update();
        if (bolt.life > 0) {
            bolt.draw(ctx, winX1, winY1, winW, winH);
        } else {
            activeLightning.splice(i, 1);
        }
    }

    trees.forEach(tree => {
        tree.update(sillY, rainDirectionAngle);
        tree.draw(ctx);
    });

    rainStreaks.forEach(streak => {
        streak.update(winX1, winW, winY1, sillY, rainDirectionAngle);
        streak.draw(ctx, rainDirectionAngle, winX1, winY1, winW, winH);
    });

    windowDrops.forEach(drop => {
        drop.update(winX1, winW, winY1, sillY, rainDirectionAngle);
        drop.draw(ctx, winX1, winY1, winW, winH);
    });

    ctx.restore();
}

// Draw room walls, mahogany desktop, glowing table lamp, hot mug & drapes
export function drawInsideRoom(ctx, time, canvasWidth, canvasHeight, winX1, winX2, winY1, winY2, sillY, winW, winH, cupX, cupY, lampX, lampY, rainDirectionAngle, lightningIntensity, steamParticles) {
    ctx.fillStyle = "#100d12"; 
    
    ctx.fillRect(0, 0, winX1, canvasHeight); 
    ctx.fillRect(winX2, 0, canvasWidth - winX2, canvasHeight); 
    ctx.fillRect(winX1, 0, winW, winY1); 
    ctx.fillRect(winX1, sillY, winW, canvasHeight - sillY); 

    ctx.fillStyle = "#1b110e"; 
    ctx.fillRect(winX1, sillY, winW, 16); 
    
    ctx.fillStyle = "#130a08"; 
    ctx.fillRect(0, sillY + 16, canvasWidth, canvasHeight - sillY - 16);

    ctx.lineWidth = 14;
    ctx.strokeStyle = "#17181c"; 
    ctx.strokeRect(winX1, winY1, winW, winH);
    
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(winX1 + winW/2, winY1);
    ctx.lineTo(winX1 + winW/2, sillY);
    ctx.moveTo(winX1, winY1 + winH/2);
    ctx.lineTo(winX2, winY1 + winH/2);
    ctx.stroke();

    ctx.fillStyle = "#151119";
    
    ctx.beginPath();
    ctx.moveTo(winX1, winY1);
    ctx.quadraticCurveTo(winX1 + 50, winY1 + winH * 0.35, winX1 + 20, winY1 + winH * 0.65);
    ctx.quadraticCurveTo(winX1 + 60, winY2 - 30, winX1 + 10, sillY);
    ctx.lineTo(winX1, sillY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(winX2, winY1);
    ctx.quadraticCurveTo(winX2 - 50, winY1 + winH * 0.35, winX2 - 20, winY1 + winH * 0.65);
    ctx.quadraticCurveTo(winX2 - 60, winY2 - 30, winX2 - 10, sillY);
    ctx.lineTo(winX2, sillY);
    ctx.fill();

    // Coffee cup
    const cupBaseY = cupY;
    ctx.fillStyle = "#8a3a34"; 
    ctx.beginPath();
    ctx.arc(cupX, cupBaseY, 12, 0, Math.PI, false); 
    ctx.lineTo(cupX - 12, cupBaseY - 16);
    ctx.lineTo(cupX + 12, cupBaseY - 16);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#8a3a34";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cupX + 13, cupBaseY - 8, 5, -Math.PI/2, Math.PI/2);
    ctx.stroke();

    ctx.fillStyle = "#4a241b";
    ctx.beginPath();
    ctx.ellipse(cupX, cupBaseY - 16, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    steamParticles.forEach(particle => {
        particle.update(cupX, cupY, sillY, rainDirectionAngle);
        particle.draw(ctx);
    });

    // Table Lamp
    const lampBaseY = lampY + (canvasHeight - sillY) * 0.55;
    const lampStemTopY = lampY + 5;
    const shadeTopY = lampY - 12;
    const shadeBottomY = lampY + 16;

    ctx.fillStyle = "#cca054"; 
    ctx.beginPath();
    ctx.ellipse(lampX, lampBaseY, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#cca054";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lampX, lampBaseY);
    ctx.quadraticCurveTo(lampX - 10, (lampBaseY + lampStemTopY) / 2, lampX, lampStemTopY);
    ctx.stroke();

    ctx.fillStyle = "#df4d38"; 
    ctx.beginPath();
    ctx.moveTo(lampX - 18, shadeTopY);
    ctx.lineTo(lampX + 18, shadeTopY);
    ctx.lineTo(lampX + 32, shadeBottomY);
    ctx.lineTo(lampX - 32, shadeBottomY);
    ctx.closePath();
    ctx.fill();

    // Ambient Light
    const lampPulse = 1 + Math.sin(time * 0.005) * 0.015;
    const glowRadius = Math.min(240, winW * 0.4);
    const lampGlow = ctx.createRadialGradient(
        lampX, lampY + 5, 5, 
        lampX, lampY + 5, glowRadius * lampPulse
    );
    lampGlow.addColorStop(0, "rgba(255, 205, 120, 0.42)");
    lampGlow.addColorStop(0.35, "rgba(255, 185, 90, 0.18)");
    lampGlow.addColorStop(0.7, "rgba(255, 185, 90, 0.04)");
    lampGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 5, glowRadius * lampPulse, 0, Math.PI * 2);
    ctx.fill();

    // Lightning Flash
    if (lightningIntensity > 0) {
        const roomFlash = ctx.createRadialGradient(
            canvasWidth / 2, canvasHeight / 2, 100, 
            canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight)
        );
        roomFlash.addColorStop(0, `rgba(215, 240, 255, ${lightningIntensity * 0.35})`);
        roomFlash.addColorStop(0.7, `rgba(185, 220, 255, ${lightningIntensity * 0.12})`);
        roomFlash.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = roomFlash;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}
