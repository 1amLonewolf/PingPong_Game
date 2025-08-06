const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 16;
const PLAYER_X = 25;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const PADDLE_SPEED = 6;
const BALL_SPEED = 6;

// Game state
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = (canvas.width - BALL_SIZE) / 2;
let ballY = (canvas.height - BALL_SIZE) / 2;
let ballVelX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballVelY = BALL_SPEED * (Math.random() * 2 - 1);

let playerScore = 0;
let aiScore = 0;

// Load real paddle images
const paddleImgLeft = new Image();
paddleImgLeft.src = 'real_paddle_left.png'; // Place this PNG in your project folder
const paddleImgRight = new Image();
paddleImgRight.src = 'real_paddle_right.png'; // Place this PNG in your project folder

// Draw a simple rectangle paddle at (x, y)
function drawRectPaddle(x, y, width, height, side) {
    ctx.save();
    ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

// Draw realistic ping pong ball
function drawRealisticBall(x, y, size) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2;
    
    // Create gradient for the ball
    const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1,
        centerX, centerY, radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#f0f0f0');
    gradient.addColorStop(0.7, '#e0e0e0');
    gradient.addColorStop(1, '#d0d0d0');
    
    // Draw main ball circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add shadow/edge
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add highlight (reflection)
    const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.1,
        centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = highlightGradient;
    ctx.fill();
    
    // Add subtle shadow beneath the ball
    const shadowGradient = ctx.createRadialGradient(
        centerX, centerY + radius * 0.8, radius * 0.1,
        centerX, centerY + radius * 0.8, radius * 0.8
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY + radius * 0.8, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = shadowGradient;
    ctx.fill();
}

// Draw realistic ping pong table surface
function drawRealisticTable() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create wood grain background
    const woodGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    woodGradient.addColorStop(0, '#8B4513');  // Dark brown
    woodGradient.addColorStop(0.3, '#A0522D'); // Medium brown
    woodGradient.addColorStop(0.7, '#CD853F'); // Light brown
    woodGradient.addColorStop(1, '#8B4513');   // Dark brown
    
    // Fill background with wood color
    ctx.fillStyle = woodGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add wood grain texture
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    // Add table surface highlight (center area)
    const surfaceGradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width/2
    );
    surfaceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    surfaceGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    surfaceGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add table edges/borders
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Add inner border lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Add center line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 20);
    ctx.lineTo(canvas.width/2, canvas.height - 20);
    ctx.stroke();
}

// Draw realistic net
function drawRealisticNet() {
    const netX = canvas.width/2;
    const netHeight = 20;
    const netTop = canvas.height/2 - netHeight/2;
    
    // Net posts
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(netX - 2, netTop - 10, 4, netHeight + 20);
    
    // Net mesh
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i < netHeight; i += 3) {
        ctx.beginPath();
        ctx.moveTo(netX - 15, netTop + i);
        ctx.lineTo(netX + 15, netTop + i);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = -15; i <= 15; i += 3) {
        ctx.beginPath();
        ctx.moveTo(netX + i, netTop);
        ctx.lineTo(netX + i, netTop + netHeight);
        ctx.stroke();
    }
    
    // Net shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(netX - 15, netTop + netHeight, 30, 5);
}

// Draw a small paddle in the player's hand, with arm animation
function drawMiniPaddle(px, py, width, height, side, armAngle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, width*0.35, 0, 2 * Math.PI);
    ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Handle
    ctx.beginPath();
    ctx.moveTo(px, py);
    // Animate handle direction
    let hx = px + (side === 'left' ? -1 : 1) * Math.cos(armAngle) * width*0.15;
    let hy = py + Math.abs(Math.sin(armAngle)) * height*0.18;
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Draw a wiggling, color-animated paddle at (x, y)
function drawAlivePaddle(x, y, width, height, side, t) {
    // Color pulse animation
    const baseColor = side === 'left' ? [211, 47, 47] : [34, 34, 34];
    const pulse = Math.floor(40 * Math.sin(t + (side === 'left' ? 0 : Math.PI)));
    const color = `rgb(${baseColor[0] + pulse}, ${baseColor[1] + pulse}, ${baseColor[2] + pulse})`;
    ctx.save();
    ctx.fillStyle = color;
    // Wiggle animation
    const wiggle = Math.sin(t * 2 + (side === 'left' ? 0 : Math.PI)) * 6;
    ctx.fillRect(x + wiggle, y, width, height);
    ctx.restore();
}

// Draw a wiggling paddle using an image, fallback to rectangle if not loaded
function drawWigglingImagePaddle(x, y, width, height, side, t) {
    const wiggle = Math.sin(t * 2 + (side === 'left' ? 0 : Math.PI)) * 6;
    ctx.save();
    let img = side === 'left' ? paddleImgLeft : paddleImgRight;
    if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, x + wiggle, y, width, height);
    } else {
        // fallback to rectangle
        ctx.fillStyle = side === 'left' ? '#d32f2f' : '#222';
        ctx.fillRect(x + wiggle, y, width, height);
    }
    ctx.restore();
}

// AI controls for left paddle (previously player)
function leftAiMove() {
    let center = playerY + PADDLE_HEIGHT/2;
    if (center < ballY + BALL_SIZE/2 - 15) {
        playerY += PADDLE_SPEED;
    } else if (center > ballY + BALL_SIZE/2 + 15) {
        playerY -= PADDLE_SPEED;
    }
    // Clamp within canvas
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT) playerY = canvas.height - PADDLE_HEIGHT;
}

// Draw everything
function draw() {
    // Draw realistic table surface
    drawRealisticTable();
    
    // Net
    drawRealisticNet();
    
    // Paddles (now use real paddle images with wiggle)
    let t = performance.now() / 400;
    drawWigglingImagePaddle(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, 'left', t);
    drawWigglingImagePaddle(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, 'right', t);

    // Confetti (drawn before the ball)
    drawConfetti();
    // Ball (drawn on top for clarity)
    drawRealisticBall(ballX, ballY, BALL_SIZE);

    // Scores
    ctx.font = "40px Arial";
    ctx.fillText("AI 1: " + playerScore, canvas.width/4, 50);
    ctx.fillText("AI 2: " + aiScore, 3*canvas.width/4, 50);
}

// Simple AI for right paddle
function aiMove() {
    let center = aiY + PADDLE_HEIGHT/2;
    if (center < ballY + BALL_SIZE/2 - 15) {
        aiY += PADDLE_SPEED;
    } else if (center > ballY + BALL_SIZE/2 + 15) {
        aiY -= PADDLE_SPEED;
    }
    // Clamp within canvas
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}

// Ball movement and collision logic
function move() {
    ballX += ballVelX;
    ballY += ballVelY;

    // Top and bottom wall collision
    if (ballY <= 0 || ballY + BALL_SIZE >= canvas.height) {
        ballVelY *= -1;
        ballY = Math.max(0, Math.min(canvas.height - BALL_SIZE, ballY));
    }

    let hitPaddle = false;
    // Left paddle collision
    if (ballX <= PLAYER_X + PADDLE_WIDTH &&
        ballY + BALL_SIZE > playerY &&
        ballY < playerY + PADDLE_HEIGHT &&
        ballX > PLAYER_X - BALL_SIZE) {
        ballVelX *= -1;
        // Add some vertical velocity based on where it hit the paddle
        let deltaY = (ballY + BALL_SIZE/2) - (playerY + PADDLE_HEIGHT/2);
        ballVelY = deltaY * 0.2;
        ballX = PLAYER_X + PADDLE_WIDTH; // Prevent sticking
        hitPaddle = true;
    }

    // Right paddle collision
    if (ballX + BALL_SIZE >= AI_X &&
        ballY + BALL_SIZE > aiY &&
        ballY < aiY + PADDLE_HEIGHT &&
        ballX < AI_X + PADDLE_WIDTH + BALL_SIZE) {
        ballVelX *= -1;
        let deltaY = (ballY + BALL_SIZE/2) - (aiY + PADDLE_HEIGHT/2);
        ballVelY = deltaY * 0.2;
        ballX = AI_X - BALL_SIZE; // Prevent sticking
        hitPaddle = true;
    }

    // Score
    if (ballX < 0) {
        aiScore++;
        resetBall();
    } else if (ballX + BALL_SIZE > canvas.width) {
        playerScore++;
        resetBall();
    }

    if (hitPaddle) {
        spawnConfetti(ballX, ballY);
    }
}

function resetBall() {
    ballX = (canvas.width - BALL_SIZE) / 2;
    ballY = (canvas.height - BALL_SIZE) / 2;
    // Randomize direction
    ballVelX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballVelY = BALL_SPEED * (Math.random() * 2 - 1);
}

// Confetti particle system (less intense, ball always on top)
const confettiParticles = [];
function spawnConfetti(x, y) {
    for (let i = 0; i < 14; i++) { // fewer particles
        const angle = Math.random() * 2 * Math.PI;
        const speed = 3 + Math.random() * 3.5;
        const shapeType = ['circle', 'rect', 'triangle'][Math.floor(Math.random()*3)];
        confettiParticles.push({
            x: x + BALL_SIZE/2,
            y: y + BALL_SIZE/2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            color: `hsl(${Math.floor(Math.random()*360)}, 98%, 60%)`,
            size: 3 + Math.random() * 3.5, // smaller size
            life: 28 + Math.random() * 15,
            shape: shapeType,
            rotation: Math.random() * 2 * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.3
        });
    }
}
function updateConfetti() {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        let p = confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.rotation += p.rotationSpeed;
        // Bounce on bottom
        if (p.y + p.size > canvas.height) {
            p.y = canvas.height - p.size;
            p.vy *= -0.45;
            p.vx *= 0.7;
        }
        p.life--;
        if (p.life <= 0) confettiParticles.splice(i, 1);
    }
}
function drawConfetti() {
    for (const p of confettiParticles) {
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
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -p.size/1.2);
                ctx.lineTo(p.size/1.2, p.size/1.2);
                ctx.lineTo(-p.size/1.2, p.size/1.2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }
}

// User control for right paddle
let rightPaddleUp = false;
let rightPaddleDown = false;
window.addEventListener('keydown', function(e) {
    if (e.code === 'ArrowUp') rightPaddleUp = true;
    if (e.code === 'ArrowDown') rightPaddleDown = true;
});
window.addEventListener('keyup', function(e) {
    if (e.code === 'ArrowUp') rightPaddleUp = false;
    if (e.code === 'ArrowDown') rightPaddleDown = false;
});
function userMoveRightPaddle() {
    if (rightPaddleUp) aiY -= PADDLE_SPEED;
    if (rightPaddleDown) aiY += PADDLE_SPEED;
    // Clamp within canvas
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}

// Touch controls for right paddle (mobile support)
function handleTouch(e) {
    if (!e.touches || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    // Only control if touch is on the right half of the canvas
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX < canvas.width / 2) return;
    // Move paddle toward touch position
    if (touchY < aiY + PADDLE_HEIGHT / 2) {
        aiY -= PADDLE_SPEED;
    } else if (touchY > aiY + PADDLE_HEIGHT / 2) {
        aiY += PADDLE_SPEED;
    }
    // Clamp within canvas
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);

// Mouse controls for right paddle (desktop support)
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Only control if mouse is on the right half of the canvas
    if (mouseX >= canvas.width / 2) {
        aiY = mouseY - PADDLE_HEIGHT / 2;
        // Clamp within canvas
        if (aiY < 0) aiY = 0;
        if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
    }
});

let isPaused = false;
let animationFrameId = null;

function pauseGame() {
    isPaused = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('playBtn').disabled = false;
}
function playGame() {
    if (!isPaused) return;
    isPaused = false;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('playBtn').disabled = true;
    gameLoop();
}
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('playBtn').addEventListener('click', playGame);

// Main game loop
function gameLoop() {
    if (isPaused) return;
    move();
    leftAiMove();
    userMoveRightPaddle(); // user controls right paddle
    updateConfetti();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start game with play button state
window.onload = function() {
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('playBtn').disabled = true;
    gameLoop();
};