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
        
        // Achievement tracking
        this.achievements = {
            humansRescued: 0,
            robotsDestroyed: 0,
            wavesCompleted: 0,
            perfectWaves: 0, // waves with all humans saved
            consecutiveRescues: 0,
            maxConsecutiveRescues: 0
        };
        
        this.congratsTimeout = null;
        
        this.soundManager = new SoundManager();
        this.highScoreManager = new HighScoreManager();
        
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
                    this.achievements.robotsDestroyed++;
                    this.soundManager.play('robotDestroyed');
                    
                    // Check for robot destruction milestones
                    if (this.achievements.robotsDestroyed === 50) {
                        this.showCongratulations("Robot Slayer!", "50 robots destroyed!", 
                            "Your aim is getting deadly!\nKeep up the great work!");
                    } else if (this.achievements.robotsDestroyed === 100) {
                        this.showCongratulations("Terminator!", "100 robots eliminated!", 
                            "You're a robot-destroying machine!\nBonus: +3000 points");
                        this.score += 3000;
                    }
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
                    this.consecutiveRescues = 0; // Reset rescue streak
                }
            });
        });
        
        // Player vs Humans (rescue)
        this.humans.forEach((human, humanIndex) => {
            if (this.distance(this.player, human) < this.player.size + human.size + 5) {
                this.humans.splice(humanIndex, 1);
                this.score += 1000;
                this.achievements.humansRescued++;
                this.achievements.consecutiveRescues++;
                
                if (this.achievements.consecutiveRescues > this.achievements.maxConsecutiveRescues) {
                    this.achievements.maxConsecutiveRescues = this.achievements.consecutiveRescues;
                }
                
                this.soundManager.play('humanRescued');
                
                // Check for rescue achievements
                if (this.achievements.humansRescued === 10) {
                    this.showCongratulations("Life Saver!", "10 humans rescued!", 
                        "You're a true hero!\nRescue Bonus: +2000 points");
                    this.score += 2000;
                } else if (this.achievements.humansRescued === 50) {
                    this.showCongratulations("Humanity's Champion!", "50 humans saved!", 
                        "Your dedication is inspiring!\nSpecial Bonus: +5000 points");
                    this.score += 5000;
                } else if (this.achievements.consecutiveRescues === 5) {
                    this.showCongratulations("Rescue Streak!", "5 consecutive rescues!", 
                        "Amazing rescue chain!\nStreak Bonus: +1500 points");
                    this.score += 1500;
                }
            }
        });
    }
    
    playerHit() {
        this.lives--;
        this.achievements.consecutiveRescues = 0; // Reset rescue streak when hit
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
            const humansAtStart = 8;
            const humansSaved = this.humans.length;
            const perfectWave = humansSaved === humansAtStart;
            
            this.wave++;
            this.achievements.wavesCompleted++;
            this.score += humansSaved * 500; // Bonus for surviving humans
            
            if (perfectWave) {
                this.achievements.perfectWaves++;
            }
            
            this.soundManager.play('waveComplete');
            this.checkAchievements(perfectWave, humansSaved);
            this.spawnWave();
        }
    }
    
    checkAchievements(perfectWave, humansSaved) {
        // Wave completion achievements
        if (this.achievements.wavesCompleted === 1) {
            this.showCongratulations("First Victory!", "You completed your first wave!", 
                `Humans Saved: ${humansSaved}/8\nBonus Points: ${humansSaved * 500}`);
        } else if (this.achievements.wavesCompleted === 5) {
            this.showCongratulations("Wave Warrior!", "5 waves completed!", 
                `You're becoming a true defender!\nTotal Score: ${this.score}`);
        } else if (this.achievements.wavesCompleted === 10) {
            this.showCongratulations("Robotron Veteran!", "10 waves completed!", 
                `Outstanding performance!\nRobots Destroyed: ${this.achievements.robotsDestroyed}`);
        } else if (this.achievements.wavesCompleted % 5 === 0) {
            this.showCongratulations("Wave Master!", `${this.achievements.wavesCompleted} waves completed!`, 
                `Keep up the excellent work!\nCurrent Score: ${this.score}`);
        }
        
        // Perfect wave achievements
        if (perfectWave) {
            if (this.achievements.perfectWaves === 1) {
                this.showCongratulations("Perfect Protector!", "All humans saved in a wave!", 
                    "No human left behind!\nPerfect Wave Bonus: +2000 points");
                this.score += 2000;
            } else if (this.achievements.perfectWaves === 3) {
                this.showCongratulations("Guardian Angel!", "3 perfect waves completed!", 
                    "Your protection skills are legendary!\nSpecial Bonus: +5000 points");
                this.score += 5000;
            }
        }
        
        // Score milestones
        if (this.score >= 50000 && this.score - (humansSaved * 500) < 50000) {
            this.showCongratulations("High Scorer!", "50,000 points reached!", 
                `Excellent gameplay!\nWaves Completed: ${this.achievements.wavesCompleted}`);
        } else if (this.score >= 100000 && this.score - (humansSaved * 500) < 100000) {
            this.showCongratulations("Score Legend!", "100,000 points achieved!", 
                `Incredible performance!\nYou're in the hall of fame!`);
        }
    }
    
    showCongratulations(title, message, details) {
        const congratsDiv = document.getElementById('congratulations');
        const titleElement = document.getElementById('congratsTitle');
        const messageElement = document.getElementById('congratsMessage');
        const detailsElement = document.getElementById('congratsDetails');
        
        titleElement.textContent = `🎉 ${title} 🎉`;
        messageElement.textContent = message;
        detailsElement.textContent = details;
        
        congratsDiv.style.display = 'block';
        
        // Clear any existing timeout
        if (this.congratsTimeout) {
            clearTimeout(this.congratsTimeout);
        }
        
        // Auto-hide after 2.5 seconds
        this.congratsTimeout = setTimeout(() => {
            congratsDiv.style.display = 'none';
        }, 2500);
        
        // Allow manual dismissal by clicking
        congratsDiv.onclick = () => {
            congratsDiv.style.display = 'none';
            if (this.congratsTimeout) {
                clearTimeout(this.congratsTimeout);
            }
        };
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
        document.getElementById('highScore').textContent = this.highScoreManager.getHighScore();
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Save the score and get ranking
        const rank = this.highScoreManager.addScore(this.score, this.wave, this.achievements);
        const isNewHighScore = this.highScoreManager.isNewHighScore(this.score);
        const isTopTen = this.highScoreManager.isTopTenScore(this.score);
        
        // Update game over display
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('finalHumansRescued').textContent = this.achievements.humansRescued;
        document.getElementById('finalRobotsDestroyed').textContent = this.achievements.robotsDestroyed;
        
        // Show ranking information
        const rankingElement = document.getElementById('scoreRanking');
        if (isNewHighScore) {
            rankingElement.innerHTML = '🏆 NEW HIGH SCORE! 🏆';
            rankingElement.className = 'score-ranking new-high-score';
        } else if (rank && rank <= 10) {
            rankingElement.innerHTML = `🎯 Rank #${rank} in Top 10!`;
            rankingElement.className = 'score-ranking top-ten';
        } else if (isTopTen) {
            rankingElement.innerHTML = '📈 Made it to Top 10!';
            rankingElement.className = 'score-ranking top-ten';
        } else {
            rankingElement.innerHTML = 'Keep trying for the Top 10!';
            rankingElement.className = 'score-ranking';
        }
        
        document.getElementById('gameOver').style.display = 'block';
        this.updateHighScoreDisplay();
    }
    
    updateHighScoreDisplay() {
        const scores = this.highScoreManager.getScores();
        const scoresContainer = document.getElementById('highScoresList');
        const statsContainer = document.getElementById('highScoreStats');
        
        // Update scores list
        if (scores.length === 0) {
            scoresContainer.innerHTML = '<div class="no-scores">No scores yet. Start playing to set your first record!</div>';
        } else {
            scoresContainer.innerHTML = scores.map((score, index) => `
                <div class="score-entry ${index === 0 ? 'best-score' : ''}">
                    <div class="score-rank">#${index + 1}</div>
                    <div class="score-details">
                        <div class="score-points">${score.score.toLocaleString()}</div>
                        <div class="score-info">
                            Wave ${score.wave} • ${score.achievements.humansRescued} humans saved
                        </div>
                        <div class="score-date">${this.highScoreManager.formatDate(score.date)}</div>
                    </div>
                    <div class="score-achievements">
                        <span title="Robots Destroyed">🤖 ${score.achievements.robotsDestroyed}</span>
                        <span title="Perfect Waves">⭐ ${score.achievements.perfectWaves}</span>
                    </div>
                </div>
            `).join('');
        }
        
        // Update statistics
        const stats = this.highScoreManager.getScoreStats();
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalGames}</div>
                <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.averageScore.toLocaleString()}</div>
                <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalHumansRescued}</div>
                <div class="stat-label">Humans Rescued</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalRobotsDestroyed}</div>
                <div class="stat-label">Robots Destroyed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalWavesCompleted}</div>
                <div class="stat-label">Waves Completed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalPerfectWaves}</div>
                <div class="stat-label">Perfect Waves</div>
            </div>
        `;
    }
    
    restart() {
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gameRunning = true;
        this.player.x = 400;
        this.player.y = 300;
        
        // Reset achievements for new game
        this.achievements = {
            humansRescued: 0,
            robotsDestroyed: 0,
            wavesCompleted: 0,
            perfectWaves: 0,
            consecutiveRescues: 0,
            maxConsecutiveRescues: 0
        };
        
        // Hide any congratulations popup
        document.getElementById('congratulations').style.display = 'none';
        if (this.congratsTimeout) {
            clearTimeout(this.congratsTimeout);
        }
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('highScorePanel').style.display = 'none';
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

function toggleHighScores() {
    const panel = document.getElementById('highScorePanel');
    const isVisible = panel.style.display === 'block';
    
    if (isVisible) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        if (game) {
            game.updateHighScoreDisplay();
        }
    }
}

function clearHighScores() {
    if (confirm('Are you sure you want to clear all high scores? This action cannot be undone.')) {
        if (game && game.highScoreManager) {
            game.highScoreManager.clearScores();
            game.updateHighScoreDisplay();
            alert('High scores cleared!');
        }
    }
}

// Initialize game
game = new Robotron2084();