"use strict";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const rotateHint = document.getElementById('rotateHint');
const pauseBtn = document.getElementById('pauseBtn');
const playBtn = document.getElementById('playBtn');

const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 16;
const PLAYER_X = 25;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const PADDLE_SPEED = 6;
const DEFAULT_BALL_SPEED = 6;
const BALL_SPEED_OPTIONS = [4, 6, 8, 10];
const PADDLE_IMPACT_TRANSFER = 0.75;
const MAX_BALL_SPEED = 16;

const paddleImgLeft = new Image();
paddleImgLeft.src = 'real_paddle_left.png';
const paddleImgRight = new Image();
paddleImgRight.src = 'real_paddle_right.png';

const speedLabel = document.getElementById('speedLabel');
const speedDownBtn = document.getElementById('speedDownBtn');
const speedUpBtn = document.getElementById('speedUpBtn');

const state = {
    playerY: (canvas.height - PADDLE_HEIGHT) / 2,
    aiY: (canvas.height - PADDLE_HEIGHT) / 2,
    ballX: (canvas.width - BALL_SIZE) / 2,
    ballY: (canvas.height - BALL_SIZE) / 2,
    ballVelX: DEFAULT_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    ballVelY: DEFAULT_BALL_SPEED * (Math.random() * 2 - 1),
    playerPaddleVelY: 0,
    aiPaddleVelY: 0,
    playerScore: 0,
    aiScore: 0,
    rightPaddleUp: false,
    rightPaddleDown: false,
    confettiParticles: [],
    isPaused: false,
    animationFrameId: null,
    ballSpeedIndex: 1,
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches;
}

function updateOrientationPrompt() {
    if (!rotateHint) return;
    const shouldShow = isMobileDevice() && window.innerHeight > window.innerWidth;
    rotateHint.classList.toggle('is-visible', shouldShow);
    rotateHint.setAttribute('aria-hidden', String(!shouldShow));
}

function getBallSpeed() {
    return BALL_SPEED_OPTIONS[state.ballSpeedIndex];
}

function updateSpeedButtons() {
    speedDownBtn.disabled = state.ballSpeedIndex === 0;
    speedUpBtn.disabled = state.ballSpeedIndex === BALL_SPEED_OPTIONS.length - 1;
    speedLabel.textContent = 'Base speed: ' + getBallSpeed();
}

function setBallSpeed(nextIndex) {
    const clampedIndex = clamp(nextIndex, 0, BALL_SPEED_OPTIONS.length - 1);
    state.ballSpeedIndex = clampedIndex;

    const currentMagnitude = Math.hypot(state.ballVelX, state.ballVelY) || getBallSpeed();
    const directionX = currentMagnitude === 0 ? (Math.random() > 0.5 ? 1 : -1) : state.ballVelX / currentMagnitude;
    const directionY = currentMagnitude === 0 ? (Math.random() * 2 - 1) : state.ballVelY / currentMagnitude;

    const newSpeed = getBallSpeed();
    state.ballVelX = directionX * newSpeed;
    state.ballVelY = directionY * newSpeed;

    updateSpeedButtons();
}

function resetBall() {
    state.ballX = (canvas.width - BALL_SIZE) / 2;
    state.ballY = (canvas.height - BALL_SIZE) / 2;
    const currentSpeed = getBallSpeed();
    state.ballVelX = currentSpeed * (Math.random() > 0.5 ? 1 : -1);
    state.ballVelY = currentSpeed * (Math.random() * 2 - 1);
}

function drawRectPaddle(x, y, width, height, side) {
    ctx.save();
    ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

function drawRealisticBall(x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2;

    const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#f0f0f0');
    gradient.addColorStop(0.7, '#e0e0e0');
    gradient.addColorStop(1, '#d0d0d0');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 1;
    ctx.stroke();

    const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.4,
        centerY - radius * 0.4,
        radius * 0.1,
        centerX - radius * 0.4,
        centerY - radius * 0.4,
        radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = highlightGradient;
    ctx.fill();

    const shadowGradient = ctx.createRadialGradient(
        centerX,
        centerY + radius * 0.8,
        radius * 0.1,
        centerX,
        centerY + radius * 0.8,
        radius * 0.8
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY + radius * 0.8, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = shadowGradient;
    ctx.fill();
}

function drawRealisticTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const woodGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    woodGradient.addColorStop(0, '#8B4513');
    woodGradient.addColorStop(0.3, '#A0522D');
    woodGradient.addColorStop(0.7, '#CD853F');
    woodGradient.addColorStop(1, '#8B4513');

    ctx.fillStyle = woodGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    const surfaceGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
    );
    surfaceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    surfaceGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    surfaceGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 2, canvas.height - 20);
    ctx.stroke();
}

function drawRealisticNet() {
    const netX = canvas.width / 2;
    const netHeight = 20;
    const netTop = canvas.height / 2 - netHeight / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(netX - 2, netTop - 10, 4, netHeight + 20);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;

    for (let i = 0; i < netHeight; i += 3) {
        ctx.beginPath();
        ctx.moveTo(netX - 15, netTop + i);
        ctx.lineTo(netX + 15, netTop + i);
        ctx.stroke();
    }

    for (let i = -15; i <= 15; i += 3) {
        ctx.beginPath();
        ctx.moveTo(netX + i, netTop);
        ctx.lineTo(netX + i, netTop + netHeight);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(netX - 15, netTop + netHeight, 30, 5);
}

function drawMiniPaddle(px, py, width, height, side, armAngle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, width * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px, py);
    const hx = px + (side === 'left' ? -1 : 1) * Math.cos(armAngle) * width * 0.15;
    const hy = py + Math.abs(Math.sin(armAngle)) * height * 0.18;
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawAlivePaddle(x, y, width, height, side, t) {
    const baseColor = side === 'left' ? [211, 47, 47] : [34, 34, 34];
    const pulse = Math.floor(40 * Math.sin(t + (side === 'left' ? 0 : Math.PI)));
    const color = `rgb(${baseColor[0] + pulse}, ${baseColor[1] + pulse}, ${baseColor[2] + pulse})`;

    ctx.save();
    ctx.fillStyle = color;
    const wiggle = Math.sin(t * 2 + (side === 'left' ? 0 : Math.PI)) * 6;
    ctx.fillRect(x + wiggle, y, width, height);
    ctx.restore();
}

function drawWigglingImagePaddle(x, y, width, height, side, t) {
    const wiggle = Math.sin(t * 2 + (side === 'left' ? 0 : Math.PI)) * 6;
    const img = side === 'left' ? paddleImgLeft : paddleImgRight;

    ctx.save();
    if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x + wiggle, y, width, height);
    } else {
        ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
        ctx.fillRect(x + wiggle, y, width, height);
    }
    ctx.restore();
}

function leftAiMove() {
    const center = state.playerY + PADDLE_HEIGHT / 2;

    if (center < state.ballY + BALL_SIZE / 2 - 15) {
        state.playerY += PADDLE_SPEED;
    } else if (center > state.ballY + BALL_SIZE / 2 + 15) {
        state.playerY -= PADDLE_SPEED;
    }

    state.playerY = clamp(state.playerY, 0, canvas.height - PADDLE_HEIGHT);
}

function aiMove() {
    const center = state.aiY + PADDLE_HEIGHT / 2;

    if (center < state.ballY + BALL_SIZE / 2 - 15) {
        state.aiY += PADDLE_SPEED;
    } else if (center > state.ballY + BALL_SIZE / 2 + 15) {
        state.aiY -= PADDLE_SPEED;
    }

    state.aiY = clamp(state.aiY, 0, canvas.height - PADDLE_HEIGHT);
}

function spawnConfetti(x, y) {
    for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 3.5;
        const shapeType = ['circle', 'rect', 'triangle'][Math.floor(Math.random() * 3)];

        state.confettiParticles.push({
            x: x + BALL_SIZE / 2,
            y: y + BALL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            color: `hsl(${Math.floor(Math.random() * 360)}, 98%, 60%)`,
            size: 3 + Math.random() * 3.5,
            life: 28 + Math.random() * 15,
            shape: shapeType,
            rotation: Math.random() * 2 * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
        });
    }
}

function updateConfetti() {
    for (let i = state.confettiParticles.length - 1; i >= 0; i--) {
        const p = state.confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.rotation += p.rotationSpeed;

        if (p.y + p.size > canvas.height) {
            p.y = canvas.height - p.size;
            p.vy *= -0.45;
            p.vx *= 0.7;
        }

        p.life--;
        if (p.life <= 0) {
            state.confettiParticles.splice(i, 1);
        }
    }
}

function drawConfetti() {
    for (const p of state.confettiParticles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 40);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        switch (p.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case 'rect':
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -p.size / 1.2);
                ctx.lineTo(p.size / 1.2, p.size / 1.2);
                ctx.lineTo(-p.size / 1.2, p.size / 1.2);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    }
}

function applyPaddleBounce(paddleY, paddleVelocityY, horizontalDirection) {
    const ballCenterY = state.ballY + BALL_SIZE / 2;
    const paddleCenterY = paddleY + PADDLE_HEIGHT / 2;
    const impactOffset = clamp((ballCenterY - paddleCenterY) / (PADDLE_HEIGHT / 2), -1, 1);

    state.ballVelX = Math.abs(state.ballVelX) * horizontalDirection;
    state.ballVelY = state.ballVelY * 0.55 + impactOffset * 6 + paddleVelocityY * PADDLE_IMPACT_TRANSFER;

    const speed = Math.hypot(state.ballVelX, state.ballVelY);
    if (speed > MAX_BALL_SPEED) {
        const scale = MAX_BALL_SPEED / speed;
        state.ballVelX *= scale;
        state.ballVelY *= scale;
    }
}

function move() {
    state.ballX += state.ballVelX;
    state.ballY += state.ballVelY;

    if (state.ballY <= 0 || state.ballY + BALL_SIZE >= canvas.height) {
        state.ballVelY *= -1;
        state.ballY = clamp(state.ballY, 0, canvas.height - BALL_SIZE);
    }

    let hitPaddle = false;

    if (
        state.ballX <= PLAYER_X + PADDLE_WIDTH &&
        state.ballY + BALL_SIZE > state.playerY &&
        state.ballY < state.playerY + PADDLE_HEIGHT &&
        state.ballX > PLAYER_X - BALL_SIZE
    ) {
        applyPaddleBounce(state.playerY, state.playerPaddleVelY, 1);
        state.ballX = PLAYER_X + PADDLE_WIDTH;
        hitPaddle = true;
    }

    if (
        state.ballX + BALL_SIZE >= AI_X &&
        state.ballY + BALL_SIZE > state.aiY &&
        state.ballY < state.aiY + PADDLE_HEIGHT &&
        state.ballX < AI_X + PADDLE_WIDTH + BALL_SIZE
    ) {
        applyPaddleBounce(state.aiY, state.aiPaddleVelY, -1);
        state.ballX = AI_X - BALL_SIZE;
        hitPaddle = true;
    }

    if (state.ballX < 0) {
        state.aiScore++;
        resetBall();
    } else if (state.ballX + BALL_SIZE > canvas.width) {
        state.playerScore++;
        resetBall();
    }

    if (hitPaddle) {
        spawnConfetti(state.ballX, state.ballY);
    }
}

function draw() {
    drawRealisticTable();
    drawRealisticNet();

    const t = performance.now() / 400;
    drawWigglingImagePaddle(PLAYER_X, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT, 'left', t);
    drawWigglingImagePaddle(AI_X, state.aiY, PADDLE_WIDTH, PADDLE_HEIGHT, 'right', t);

    drawConfetti();
    drawRealisticBall(state.ballX, state.ballY, BALL_SIZE);

    ctx.font = '40px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('AI: ' + state.playerScore, canvas.width / 4, 50);
    ctx.fillText('Player: ' + state.aiScore, (3 * canvas.width) / 4, 50);
}

function userMoveRightPaddle() {
    if (state.rightPaddleUp) state.aiY -= PADDLE_SPEED;
    if (state.rightPaddleDown) state.aiY += PADDLE_SPEED;
    state.aiY = clamp(state.aiY, 0, canvas.height - PADDLE_HEIGHT);
}

function handleKeyDown(event) {
    if (event.code === 'ArrowUp') state.rightPaddleUp = true;
    if (event.code === 'ArrowDown') state.rightPaddleDown = true;
}

function handleKeyUp(event) {
    if (event.code === 'ArrowUp') state.rightPaddleUp = false;
    if (event.code === 'ArrowDown') state.rightPaddleDown = false;
}

function handleTouch(event) {
    if (!event.touches || event.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const touchY = event.touches[0].clientY - rect.top;
    const touchX = event.touches[0].clientX - rect.left;

    if (touchX < canvas.width / 2) return;

    if (touchY < state.aiY + PADDLE_HEIGHT / 2) {
        state.aiY -= PADDLE_SPEED;
    } else if (touchY > state.aiY + PADDLE_HEIGHT / 2) {
        state.aiY += PADDLE_SPEED;
    }

    state.aiY = clamp(state.aiY, 0, canvas.height - PADDLE_HEIGHT);
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (mouseX >= canvas.width / 2) {
        state.aiY = mouseY - PADDLE_HEIGHT / 2;
        state.aiY = clamp(state.aiY, 0, canvas.height - PADDLE_HEIGHT);
    }
}

function pauseGame() {
    state.isPaused = true;

    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }

    pauseBtn.disabled = true;
    playBtn.disabled = false;
}

function playGame() {
    if (!state.isPaused) return;
    state.isPaused = false;
    pauseBtn.disabled = false;
    playBtn.disabled = true;
    gameLoop();
}

function gameLoop() {
    if (state.isPaused) return;

    move();
    const previousPlayerY = state.playerY;
    const previousAiY = state.aiY;
    leftAiMove();
    userMoveRightPaddle();
    state.playerPaddleVelY = clamp(state.playerY - previousPlayerY, -PADDLE_SPEED, PADDLE_SPEED);
    state.aiPaddleVelY = clamp(state.aiY - previousAiY, -PADDLE_SPEED, PADDLE_SPEED);
    updateConfetti();
    draw();

    state.animationFrameId = requestAnimationFrame(gameLoop);
}

function changeBallSpeed(direction) {
    setBallSpeed(state.ballSpeedIndex + direction);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('mousemove', handleMouseMove);
window.addEventListener('resize', updateOrientationPrompt);
window.addEventListener('orientationchange', updateOrientationPrompt);

pauseBtn.addEventListener('click', pauseGame);
playBtn.addEventListener('click', playGame);
speedDownBtn.addEventListener('click', function() {
    changeBallSpeed(-1);
});
speedUpBtn.addEventListener('click', function() {
    changeBallSpeed(1);
});

updateSpeedButtons();
updateOrientationPrompt();

if (document.readyState === 'complete') {
    pauseBtn.disabled = false;
    playBtn.disabled = true;
    gameLoop();
} else {
    window.addEventListener('load', () => {
        pauseBtn.disabled = false;
        playBtn.disabled = true;
        gameLoop();
    });
}