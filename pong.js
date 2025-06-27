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

// Mouse movement controls player paddle
canvas.addEventListener('mousemove', function(evt) {
    const rect = canvas.getBoundingClientRect();
    let root = document.documentElement;
    let mouseY = evt.clientY - rect.top - root.scrollTop;
    playerY = mouseY - PADDLE_HEIGHT/2;
    // Clamp paddle within canvas
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT) playerY = canvas.height - PADDLE_HEIGHT;
});

// Draw everything
function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Net
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);

    // Scores
    ctx.font = "40px Arial";
    ctx.fillText(playerScore, canvas.width/4, 50);
    ctx.fillText(aiScore, 3*canvas.width/4, 50);
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
    }

    // Score
    if (ballX < 0) {
        aiScore++;
        resetBall();
    } else if (ballX + BALL_SIZE > canvas.width) {
        playerScore++;
        resetBall();
    }
}

function resetBall() {
    ballX = (canvas.width - BALL_SIZE) / 2;
    ballY = (canvas.height - BALL_SIZE) / 2;
    // Randomize direction
    ballVelX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballVelY = BALL_SPEED * (Math.random() * 2 - 1);
}

// Main game loop
function gameLoop() {
    move();
    aiMove();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();