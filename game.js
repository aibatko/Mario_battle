const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let audioCtx;
function playJumpSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    draw(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class Player extends Rect {
    constructor(x, y) {
        super(x, y, 32, 48);
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
    }
    update(platforms) {
        // horizontal movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx = -3;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx = 3;
        } else {
            this.vx = 0;
        }
        // jump
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.grounded) {
            this.vy = -12;
            this.grounded = false;
            playJumpSound();
        }

        // apply gravity
        this.vy += 0.5;

        // move and collide
        this.x += this.vx;
        this.y += this.vy;

        // simple world bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
        if (this.y > canvas.height) this.respawn();

        // collision with platforms
        this.grounded = false;
        for (const p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.w > p.x &&
                this.y < p.y + p.h &&
                this.y + this.h > p.y) {
                // collision detected
                const overlapX = Math.min(this.x + this.w - p.x, p.x + p.w - this.x);
                const overlapY = Math.min(this.y + this.h - p.y, p.y + p.h - this.y);
                if (overlapX < overlapY) {
                    // resolve X
                    if (this.x < p.x) {
                        this.x -= overlapX;
                    } else {
                        this.x += overlapX;
                    }
                    this.vx = 0;
                } else {
                    // resolve Y
                    if (this.y < p.y) {
                        this.y -= overlapY;
                        this.vy = 0;
                        this.grounded = true;
                    } else {
                        this.y += overlapY;
                        this.vy = 0;
                    }
                }
            }
        }
    }
    respawn() {
        this.x = 50;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
    }
}

class Enemy extends Rect {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.vx = -1;
    }
    update(platforms) {
        this.x += this.vx;
        // turn around at bounds
        if (this.x <= 0 || this.x + this.w >= canvas.width) {
            this.vx *= -1;
        }

        // simple gravity and platforms
        this.vy = (this.vy || 0) + 0.5;
        this.y += this.vy;

        for (const p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.w > p.x &&
                this.y < p.y + p.h &&
                this.y + this.h > p.y) {
                if (this.y < p.y) {
                    this.y = p.y - this.h;
                    this.vy = 0;
                }
            }
        }
    }
}

class Platform extends Rect {}

const platforms = [
    new Platform(0, canvas.height - 30, canvas.width, 30),
    new Platform(150, canvas.height - 120, 120, 20),
    new Platform(400, canvas.height - 200, 120, 20),
    new Platform(600, canvas.height - 280, 120, 20)
];

const player = new Player(50, 0);
const enemies = [new Enemy(500, canvas.height - 62)];

function drawBackground() {
    ctx.fillStyle = '#8ed0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    player.update(platforms);
    for (const e of enemies) {
        e.update(platforms);
        // check collision with player
        if (player.x < e.x + e.w &&
            player.x + player.w > e.x &&
            player.y < e.y + e.h &&
            player.y + player.h > e.y) {
            // simple lose condition -> respawn
            player.respawn();
        }
    }
}

function draw() {
    drawBackground();
    for (const p of platforms) p.draw('#964B00');
    for (const e of enemies) e.draw('#ff0000');
    player.draw('#00ff00');
}

gameLoop();
