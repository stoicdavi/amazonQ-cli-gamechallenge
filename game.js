class Robotron2084 {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.keys = {};
        this.player = { x: 400, y: 300, size: 8, speed: 3 };
        this.bullets = [];
        this.robots = [];
        this.humans = [];
        this.particles = [];
        
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gameRunning = true;
        
        this.soundManager = new SoundManager();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnWave();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' && !this.gameRunning) {
                this.restart();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    spawnWave() {
        this.robots = [];
        this.humans = [];
        this.bullets = [];
        
        // Spawn humans
        for (let i = 0; i < 8; i++) {
            this.humans.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                size: 6,
                speed: 0.5,
                dx: (Math.random() - 0.5) * 2,
                dy: (Math.random() - 0.5) * 2
            });
        }
        
        // Spawn robots
        const robotCount = 5 + this.wave * 2;
        for (let i = 0; i < robotCount; i++) {
            this.robots.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 8,
                speed: 1 + this.wave * 0.2,
                health: 1,
                type: Math.random() < 0.7 ? 'grunt' : 'hulk'
            });
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateRobots();
        this.updateHumans();
        this.updateParticles();
        this.checkCollisions();
        this.checkWaveComplete();
    }
    
    updatePlayer() {
        // Movement
        if (this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['d']) this.player.x += this.player.speed;
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.size, Math.min(this.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.height - this.player.size, this.player.y));
        
        // Shooting
        if (this.keys['arrowup']) this.shoot(0, -1);
        if (this.keys['arrowdown']) this.shoot(0, 1);
        if (this.keys['arrowleft']) this.shoot(-1, 0);
        if (this.keys['arrowright']) this.shoot(1, 0);
    }
    
    shoot(dx, dy) {
        if (this.bullets.length < 20) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                dx: dx * 8,
                dy: dy * 8,
                size: 3
            });
            this.soundManager.play('shoot');
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            return bullet.x > 0 && bullet.x < this.width && bullet.y > 0 && bullet.y < this.height;
        });
    }
    
    updateRobots() {
        this.robots.forEach(robot => {
            // Move towards player or nearest human
            let target = this.player;
            let minDist = this.distance(robot, this.player);
            
            this.humans.forEach(human => {
                const dist = this.distance(robot, human);
                if (dist < minDist && Math.random() < 0.3) {
                    target = human;
                    minDist = dist;
                }
            });
            
            const dx = target.x - robot.x;
            const dy = target.y - robot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                robot.x += (dx / dist) * robot.speed;
                robot.y += (dy / dist) * robot.speed;
            }
        });
    }
    
    updateHumans() {
        this.humans.forEach(human => {
            human.x += human.dx * human.speed;
            human.y += human.dy * human.speed;
            
            // Bounce off walls
            if (human.x <= human.size || human.x >= this.width - human.size) human.dx *= -1;
            if (human.y <= human.size || human.y >= this.height - human.size) human.dy *= -1;
            
            // Keep in bounds
            human.x = Math.max(human.size, Math.min(this.width - human.size, human.x));
            human.y = Math.max(human.size, Math.min(this.height - human.size, human.y));
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        // Bullets vs Robots
        this.bullets.forEach((bullet, bulletIndex) => {
            this.robots.forEach((robot, robotIndex) => {
                if (this.distance(bullet, robot) < bullet.size + robot.size) {
                    this.createExplosion(robot.x, robot.y);
                    this.robots.splice(robotIndex, 1);
                    this.bullets.splice(bulletIndex, 1);
                    this.score += robot.type === 'hulk' ? 150 : 100;
                    this.soundManager.play('robotDestroyed');
                }
            });
        });
        
        // Player vs Robots
        this.robots.forEach(robot => {
            if (this.distance(this.player, robot) < this.player.size + robot.size) {
                this.playerHit();
            }
        });
        
        // Robots vs Humans
        this.robots.forEach(robot => {
            this.humans.forEach((human, humanIndex) => {
                if (this.distance(robot, human) < robot.size + human.size) {
                    this.humans.splice(humanIndex, 1);
                }
            });
        });
        
        // Player vs Humans (rescue)
        this.humans.forEach((human, humanIndex) => {
            if (this.distance(this.player, human) < this.player.size + human.size + 5) {
                this.humans.splice(humanIndex, 1);
                this.score += 1000;
                this.soundManager.play('humanRescued');
            }
        });
    }
    
    playerHit() {
        this.lives--;
        this.createExplosion(this.player.x, this.player.y);
        this.soundManager.play('playerHit');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = 400;
            this.player.y = 300;
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                life: 20,
                color: '#ff0'
            });
        }
    }
    
    checkWaveComplete() {
        if (this.robots.length === 0) {
            this.wave++;
            this.score += this.humans.length * 500; // Bonus for surviving humans
            this.soundManager.play('waveComplete');
            this.spawnWave();
        }
    }
    
    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    
    render() {
        this.ctx.fillStyle = '#001100';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw player
        this.ctx.fillStyle = '#0ff';
        this.ctx.fillRect(this.player.x - this.player.size/2, this.player.y - this.player.size/2, this.player.size, this.player.size);
        
        // Draw bullets
        this.ctx.fillStyle = '#ff0';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x - bullet.size/2, bullet.y - bullet.size/2, bullet.size, bullet.size);
        });
        
        // Draw robots
        this.robots.forEach(robot => {
            this.ctx.fillStyle = robot.type === 'hulk' ? '#f0f' : '#f00';
            this.ctx.fillRect(robot.x - robot.size/2, robot.y - robot.size/2, robot.size, robot.size);
        });
        
        // Draw humans
        this.ctx.fillStyle = '#0f0';
        this.humans.forEach(human => {
            this.ctx.fillRect(human.x - human.size/2, human.y - human.size/2, human.size, human.size);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        });
        
        this.updateHUD();
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('humans').textContent = this.humans.length;
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restart() {
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gameRunning = true;
        this.player.x = 400;
        this.player.y = 300;
        document.getElementById('gameOver').style.display = 'none';
        this.spawnWave();
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

let game;

function toggleSound() {
    if (game && game.soundManager) {
        const enabled = game.soundManager.toggle();
        const button = document.getElementById('soundToggle');
        button.textContent = enabled ? '🔊' : '🔇';
        button.classList.toggle('muted', !enabled);
    }
}

// Initialize game
game = new Robotron2084();