class Queue {
    constructor() {
        this.items = [];
        this.head = 0;
        this.tail = 0;
    }
    enqueue(item) {
        this.items[this.tail] = item;
        this.tail++;
    }

    removePlayer(user_id) {
        const index = this.items.findIndex(
            (player) => player.user_id === user_id
        );
        if (index === -1) return false;

        this.items.splice(index, 1);
        this.tail--;
        return true;
    }
    dequeueMultiples(n) {
        const players = [];
        for (let i = 0; i < n && this.head < this.tail; i++) {
            players.push(this.items[this.head]);
            this.head++;
        }
        return players;
    }
    checkAndCreateGame() {
        const numPlayers = this.tail - this.head;
        if (numPlayers >= 5) {
            const players = this.dequeueMultiples(5);
            return players;
        }
        return null;
    }
    toArray() {
        return this.items.slice(this.head, this.tail);
    }
}

const gameQueues = {
    ranked: { slow: new Queue(), fast: new Queue() },
    normal: { slow: new Queue(), fast: new Queue() },
};

const playerQueuePosition = {};
let preGameQueue = {};

module.exports = { Queue, gameQueues, playerQueuePosition, preGameQueue };
