// --- Type Definitions ---
interface Vector2D {
    x: number;
    y: number;
}

interface GameObject extends Vector2D {
    width: number;
    height: number;
}

interface Player extends GameObject {
    velocityX: number;
    velocityY: number;
    isJumping: boolean;
    direction: 1 | -1;
    jumps: number;
}

interface Platform extends GameObject {
    type: 'static' | 'moving';
    startX?: number;
    endX?: number;
    speed?: number;
    direction?: 1 | -1;
}

interface Scroll extends GameObject {
    collected: boolean;
}

interface Goal extends GameObject {
    active: boolean;
}

interface Keys {
    right: boolean;
    left: boolean;
}

interface StageData {
    playerStart: Vector2D;
    goal: GameObject;
    platforms: Platform[];
    scrolls: Omit<Scroll, 'collected'>[];
}

// --- DOM Elements ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;
const scrollCountEl = document.getElementById('scroll-count') as HTMLSpanElement;
const stageNumberEl = document.getElementById('stage-number') as HTMLSpanElement;
const gameOverContainerEl = document.getElementById('game-over-container') as HTMLDivElement;
const messageEl = document.getElementById('message') as HTMLDivElement;
const restartButton = document.getElementById('restart-button') as HTMLButtonElement;

// --- Game Settings ---
const gravity = 0.5;
const friction = 0.8;

// --- Game State Variables ---
let player: Player, platforms: Platform[], scrolls: Scroll[], goal: Goal, keys: Keys, isGameActive: boolean, currentStageIndex: number;
let checkpoint = 0;

// --- Player Properties ---
const playerProps = {
    width: 30,
    height: 40,
    speed: 5,
    jumpForce: 12,
    maxJumps: 2, // Allow double jump
};

// --- Stage Data ---
const stages: StageData[] = [
    { // Stage 1
        playerStart: { x: 100, y: 500 },
        goal: { x: 750, y: 130, width: 40, height: 50 },
        platforms: [
            { x: 0, y: 560, width: 250, height: 40, type: 'static' },
            { x: 550, y: 560, width: 250, height: 40, type: 'static' },
            { x: 150, y: 480, width: 80, height: 20, type: 'static' },
            { x: 300, y: 400, width: 180, height: 20, type: 'moving', startX: 280, endX: 450, speed: 1, direction: 1 },
            { x: 600, y: 320, width: 100, height: 20, type: 'static' },
            { x: 450, y: 220, width: 80, height: 20, type: 'static' },
            { x: 200, y: 150, width: 100, height: 20, type: 'static' },
            { x: 680, y: 180, width: 80, height: 20, type: 'static' },
        ],
        scrolls: [
            { x: 180, y: 450, width: 20, height: 30 },
            { x: 630, y: 290, width: 20, height: 30 },
            { x: 240, y: 120, width: 20, height: 30 },
        ]
    },
    { // Stage 2 (Corrected Layout)
        playerStart: { x: 50, y: 500 },
        goal: { x: 750, y: 510, width: 40, height: 50 },
        platforms: [
            { x: 0, y: 560, width: 150, height: 40, type: 'static' },
            { x: 700, y: 560, width: 100, height: 40, type: 'static' },
            { x: 200, y: 500, width: 100, height: 20, type: 'moving', startX: 200, endX: 400, speed: 1.5, direction: 1 },
            { x: 300, y: 420, width: 80, height: 20, type: 'static' },
            { x: 150, y: 350, width: 80, height: 20, type: 'static' },
            { x: 300, y: 280, width: 100, height: 20, type: 'moving', startX: 250, endX: 400, speed: 1, direction: -1 },
            { x: 500, y: 220, width: 60, height: 20, type: 'static' },
            { x: 650, y: 150, width: 60, height: 20, type: 'static' },
        ],
        scrolls: [
            { x: 320, y: 390, width: 20, height: 30 },
            { x: 170, y: 320, width: 20, height: 30 },
            { x: 520, y: 190, width: 20, height: 30 },
            { x: 670, y: 120, width: 20, height: 30 },
        ]
    },
    { // Stage 3
        playerStart: { x: 385, y: 50 },
        goal: { x: 50, y: 510, width: 40, height: 50 },
        platforms: [
            { x: 350, y: 100, width: 100, height: 20, type: 'static' },
            { x: 0, y: 560, width: 100, height: 40, type: 'static' },
            { x: 600, y: 450, width: 100, height: 20, type: 'moving', startX: 550, endX: 700, speed: 2.5, direction: 1 },
            { x: 400, y: 350, width: 60, height: 20, type: 'static' },
            { x: 200, y: 250, width: 60, height: 20, type: 'static' },
            { x: 0, y: 150, width: 100, height: 20, type: 'moving', startX: 0, endX: 150, speed: 2, direction: 1 },
            { x: 750, y: 100, width: 50, height: 20, type: 'static' },
        ],
        scrolls: [
            { x: 38, y: 120, width: 20, height: 30 },
            { x: 765, y: 70, width: 20, height: 30 },
            { x: 220, y: 220, width: 20, height: 30 },
            { x: 420, y: 320, width: 20, height: 30 },
            { x: 640, y: 420, width: 20, height: 30 },
        ]
    },
    { // Stage 4 - The Ascent
        playerStart: { x: 50, y: 500 },
        goal: { x: 380, y: 50, width: 40, height: 50 },
        platforms: [
            { x: 0, y: 560, width: 100, height: 40, type: 'static' },
            { x: 200, y: 500, width: 80, height: 20, type: 'static' },
            { x: 350, y: 450, width: 100, height: 20, type: 'moving', startX: 300, endX: 500, speed: 1.5, direction: 1 },
            { x: 150, y: 380, width: 60, height: 20, type: 'static' },
            { x: 50, y: 300, width: 60, height: 20, type: 'static' },
            { x: 200, y: 220, width: 100, height: 20, type: 'moving', startX: 200, endX: 400, speed: 2, direction: -1 },
            { x: 550, y: 180, width: 50, height: 20, type: 'static' },
            { x: 700, y: 120, width: 50, height: 20, type: 'static' },
            { x: 350, y: 100, width: 100, height: 20, type: 'static' }
        ],
        scrolls: [
            { x: 230, y: 470, width: 20, height: 30 },
            { x: 170, y: 350, width: 20, height: 30 },
            { x: 70, y: 270, width: 20, height: 30 },
            { x: 565, y: 150, width: 20, height: 30 },
            { x: 715, y: 90, width: 20, height: 30 }
        ]
    },
    { // Stage 5 - Final Trial
        playerStart: { x: 20, y: 100 },
        goal: { x: 740, y: 510, width: 40, height: 50 },
        platforms: [
            { x: 0, y: 150, width: 80, height: 20, type: 'static' },
            { x: 200, y: 200, width: 80, height: 20, type: 'moving', startX: 150, endX: 300, speed: 3, direction: 1 },
            { x: 400, y: 250, width: 50, height: 20, type: 'static' },
            { x: 150, y: 350, width: 50, height: 20, type: 'static' },
            { x: 0, y: 450, width: 80, height: 20, type: 'moving', startX: 0, endX: 120, speed: 2, direction: -1 },
            { x: 250, y: 500, width: 200, height: 20, type: 'static' },
            { x: 600, y: 450, width: 80, height: 20, type: 'moving', startX: 550, endX: 720, speed: 2.5, direction: 1 },
            { x: 720, y: 560, width: 80, height: 40, type: 'static' }
        ],
        scrolls: [
            { x: 230, y: 170, width: 20, height: 30 },
            { x: 415, y: 220, width: 20, height: 30 },
            { x: 165, y: 320, width: 20, height: 30 },
            { x: 40, y: 420, width: 20, height: 30 },
            { x: 300, y: 470, width: 20, height: 30 },
            { x: 640, y: 420, width: 20, height: 30 }
        ]
    }
];

// --- Load Stage ---
function loadStage(stageIndex: number) {
    if (stageIndex >= stages.length) {
        endGame(true, true);
        return;
    }
    if (stageIndex > checkpoint) {
        checkpoint = stageIndex;
    }

    currentStageIndex = stageIndex;
    const stageData = stages[currentStageIndex];

    player = {
        x: stageData.playerStart.x,
        y: stageData.playerStart.y,
        width: playerProps.width,
        height: playerProps.height,
        velocityX: 0,
        velocityY: 0,
        isJumping: true,
        direction: 1,
        jumps: 0, // Add jump counter
    };

    platforms = JSON.parse(JSON.stringify(stageData.platforms));
    scrolls = JSON.parse(JSON.stringify(stageData.scrolls.map(s => ({ ...s, collected: false }))));
    goal = { ...stageData.goal, active: false };

    isGameActive = true;
    gameOverContainerEl.style.display = 'none';
    updateScrollCount();
    updateStageDisplay();
}

// --- Initialize Game ---
function init() {
    keys = { right: false, left: false };
    loadStage(checkpoint);
    gameLoop();
}

// --- Key Input Events ---
document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if ((e.key === 'ArrowUp' || e.key === ' ') && !e.repeat) { // e.repeat prevents continuous jumping by holding down
        if (player.jumps < playerProps.maxJumps) {
            if (player.jumps === 1) { // Second jump is half height
                player.velocityY = -playerProps.jumpForce * 0.5;
            } else { // First jump
                player.velocityY = -playerProps.jumpForce;
            }
            player.jumps++;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// --- Update Logic ---
function update() {
    if (!isGameActive) return;

    // Update moving platforms
    platforms.forEach(platform => {
        if (platform.type === 'moving' && platform.speed && platform.direction && platform.startX && platform.endX) {
            platform.x += platform.speed * platform.direction;
            if (platform.x <= platform.startX || platform.x + platform.width >= platform.endX + platform.width) {
                platform.direction *= -1;
            }
        }
    });

    // Player movement and direction
    if (player.isJumping) {
        // --- Air Control ---
        const airControl = 0.4;
        const airFriction = 0.95;

        if (keys.left) {
            player.velocityX -= airControl;
            player.direction = -1;
        } else if (keys.right) {
            player.velocityX += airControl;
            player.direction = 1;
        } else {
            player.velocityX *= airFriction;
        }

        if (player.velocityX > playerProps.speed) player.velocityX = playerProps.speed;
        if (player.velocityX < -playerProps.speed) player.velocityX = -playerProps.speed;

    } else {
        // --- Ground Control ---
        if (keys.left) {
            player.velocityX = -playerProps.speed;
            player.direction = -1;
        } else if (keys.right) {
            player.velocityX = playerProps.speed;
            player.direction = 1;
        }
    }

    // Physics
    if (!player.isJumping && !keys.left && !keys.right) {
        player.velocityX *= friction;
    }

    player.velocityY += gravity;
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Prevent player from going off-screen horizontally
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Platform collision
    let onGround = false;
    platforms.forEach(platform => {
        const pDir = getCollisionDirection(player, platform);
        if (pDir === 'bottom' && player.velocityY >= 0) {
            onGround = true;
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.jumps = 0; // Reset jumps on landing
            if (platform.type === 'moving' && platform.speed && platform.direction) {
                player.x += platform.speed * platform.direction;
            }
        }
    });
    player.isJumping = !onGround;

    // Scroll collision
    scrolls.forEach(scroll => {
        if (!scroll.collected && isColliding(player, scroll)) {
            scroll.collected = true;
            updateScrollCount();
        }
    });

    // Goal activation and collision
    if (scrolls.every(s => s.collected)) {
        goal.active = true;
    }
    if (goal.active && isColliding(player, goal)) {
        loadStage(currentStageIndex + 1);
        return;
    }

    // Game Over condition
    if (player.y > canvas.height) {
        endGame(false);
    }
}

// --- Drawing Logic ---
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Platforms
    platforms.forEach(platform => {
        context.fillStyle = '#39b5a4';
        context.fillRect(platform.x, platform.y, platform.width, platform.height);
        context.fillStyle = '#64e6d5';
        context.fillRect(platform.x, platform.y, platform.width, platform.height / 4);
    });

    // Scrolls
    scrolls.forEach(scroll => {
        if (!scroll.collected) {
            context.fillStyle = '#f0e68c';
            context.fillRect(scroll.x, scroll.y, scroll.width, scroll.height);
            context.fillStyle = '#c8b446';
            context.fillRect(scroll.x - 2, scroll.y - 2, scroll.width + 4, 2);
            context.fillRect(scroll.x - 2, scroll.y + scroll.height, scroll.width + 4, 2);
        }
    });

    // Goal (Torii gate)
    if (goal) {
        const goalColor = goal.active ? '#e74c3c' : '#7f8c8d';
        context.fillStyle = goalColor;
        const pWidth = goal.width / 5;
        const pHeight = goal.height;
        const topBeamHeight = goal.height / 6;
        context.fillRect(goal.x, goal.y, pWidth, pHeight);
        context.fillRect(goal.x + goal.width - pWidth, goal.y, pWidth, pHeight);
        context.fillRect(goal.x - pWidth, goal.y, goal.width + pWidth * 2, topBeamHeight);
    }

    // Player
    context.save();
    context.translate(player.x + player.width / 2, player.y + player.height / 2);
    context.scale(player.direction, 1);
    context.fillStyle = '#e74c3c';
    context.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    context.fillStyle = 'white';
    context.fillRect(player.width * 0.1, -player.height * 0.3, 5, 5);
    context.restore();
}

// --- Game Loop ---
function gameLoop() {
    if (isGameActive) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// --- Helper Functions ---
function isColliding(rect1: GameObject, rect2: GameObject) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

function getCollisionDirection(rectA: GameObject, rectB: GameObject) {
    const halfWidthA = rectA.width / 2;
    const halfHeightA = rectA.height / 2;
    const halfWidthB = rectB.width / 2;
    const halfHeightB = rectB.height / 2;
    const centerA = { x: rectA.x + halfWidthA, y: rectA.y + halfHeightA };
    const centerB = { x: rectB.x + halfWidthB, y: rectB.y + halfHeightB };
    const diffX = centerA.x - centerB.x;
    const diffY = centerA.y - centerB.y;
    const minXDist = halfWidthA + halfWidthB;
    const minYDist = halfHeightA + halfHeightB;
    if (Math.abs(diffX) >= minXDist || Math.abs(diffY) >= minYDist) return null;
    const overlapX = minXDist - Math.abs(diffX);
    const overlapY = minYDist - Math.abs(diffY);
    if (overlapY < overlapX) return diffY > 0 ? 'top' : 'bottom';
    else return diffX > 0 ? 'left' : 'right';
}

function updateScrollCount() {
    const remaining = scrolls.filter(s => !s.collected).length;
    scrollCountEl.textContent = String(remaining);
}

function updateStageDisplay() {
    stageNumberEl.textContent = String(currentStageIndex + 1);
}

function endGame(isClear: boolean, isFinalWin = false) {
    isGameActive = false;
    if (isClear && isFinalWin) {
        messageEl.textContent = '完全クリア！おめでとう！';
        messageEl.style.color = '#39b5a4';
        checkpoint = 0; // Reset checkpoint on full clear
    } else {
        messageEl.textContent = 'ゲームオーバー';
        messageEl.style.color = '#e74c3c';
    }
    gameOverContainerEl.style.display = 'flex';
    gameOverContainerEl.style.flexDirection = 'column';
    gameOverContainerEl.style.justifyContent = 'center';
    gameOverContainerEl.style.alignItems = 'center';
}

// --- Event Listener for Restart ---
restartButton.addEventListener('click', init);

// --- Start Game ---
init();
