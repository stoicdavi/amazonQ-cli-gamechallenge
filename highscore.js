class HighScoreManager {
    constructor() {
        this.storageKey = 'robotron2084_highscores';
        this.maxScores = 10; // Keep top 10 scores
        this.scores = this.loadScores();
    }

    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load high scores:', error);
            return [];
        }
    }

    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (error) {
            console.warn('Failed to save high scores:', error);
        }
    }

    addScore(score, wave, achievements) {
        const newScore = {
            score: score,
            wave: wave,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            achievements: {
                humansRescued: achievements.humansRescued,
                robotsDestroyed: achievements.robotsDestroyed,
                wavesCompleted: achievements.wavesCompleted,
                perfectWaves: achievements.perfectWaves,
                maxConsecutiveRescues: achievements.maxConsecutiveRescues
            }
        };

        this.scores.push(newScore);
        
        // Sort by score (highest first)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        if (this.scores.length > this.maxScores) {
            this.scores = this.scores.slice(0, this.maxScores);
        }

        this.saveScores();
        
        // Return the rank (1-based) of the new score, or null if not in top 10
        const rank = this.scores.findIndex(s => s.timestamp === newScore.timestamp) + 1;
        return rank <= this.maxScores ? rank : null;
    }

    getScores() {
        return [...this.scores]; // Return a copy
    }

    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }

    isNewHighScore(score) {
        return score > this.getHighScore();
    }

    isTopTenScore(score) {
        if (this.scores.length < this.maxScores) return true;
        return score > this.scores[this.maxScores - 1].score;
    }

    clearScores() {
        this.scores = [];
        this.saveScores();
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    getScoreStats() {
        if (this.scores.length === 0) {
            return {
                totalGames: 0,
                averageScore: 0,
                totalHumansRescued: 0,
                totalRobotsDestroyed: 0,
                totalWavesCompleted: 0,
                totalPerfectWaves: 0
            };
        }

        const stats = this.scores.reduce((acc, score) => {
            acc.totalScore += score.score;
            acc.totalHumansRescued += score.achievements.humansRescued;
            acc.totalRobotsDestroyed += score.achievements.robotsDestroyed;
            acc.totalWavesCompleted += score.achievements.wavesCompleted;
            acc.totalPerfectWaves += score.achievements.perfectWaves;
            return acc;
        }, {
            totalScore: 0,
            totalHumansRescued: 0,
            totalRobotsDestroyed: 0,
            totalWavesCompleted: 0,
            totalPerfectWaves: 0
        });

        return {
            totalGames: this.scores.length,
            averageScore: Math.round(stats.totalScore / this.scores.length),
            totalHumansRescued: stats.totalHumansRescued,
            totalRobotsDestroyed: stats.totalRobotsDestroyed,
            totalWavesCompleted: stats.totalWavesCompleted,
            totalPerfectWaves: stats.totalPerfectWaves
        };
    }
}
