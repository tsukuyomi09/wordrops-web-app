const playerStatsMap = new Map();

class PlayerStatistics {
    constructor(user_id) {
        this.user_id = user_id;
        this.classic_played = 0;
        this.ranked_played = 0;
        this.stories_abandoned = 0;
        this.ranked_score = 200;
        this.perfect_performances = 0;
        this.worst_performances = 0;
    }

    updateStats(gameType, storyAbandoned = false, score = null) {
        if (gameType === "ranked") {
            this.ranked_played++;
            if (score !== null) {
                this.ranked_score += score;
                if (score === 10) {
                    this.perfect_performances++;
                }
                if (score === -10) {
                    this.worst_performances++;
                }
            }
        } else if (gameType === "classic") {
            this.classic_played++;
        }

        if (storyAbandoned) {
            this.stories_abandoned++;
        }
    }
}

module.exports = { PlayerStatistics, playerStatsMap };
