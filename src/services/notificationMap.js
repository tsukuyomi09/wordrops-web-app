class NotificationMap {
    constructor() {
        this.map = new Map();
    }

    add(gameId, user_id, points, comment) {
        if (!this.map.has(user_id)) {
            this.map.set(user_id, new Map());
        }
        this.map.get(user_id).set(gameId, { points, comment });
    }

    remove(gameId, user_id) {
        const userNotifications = this.map.get(user_id);
        console.log(userNotifications);

        if (!userNotifications.has(gameId)) return;

        userNotifications.delete(gameId);

        if (userNotifications.size === 0) {
            this.map.delete(user_id);
        }
    }

    has(user_id) {
        return this.map.has(user_id);
    }

    get(user_id) {
        if (!this.map.has(user_id)) return [];
        return [...this.map.get(user_id)].map(([gameId, data]) => ({
            gameId,
            ...data,
        }));
    }
}

const notificationMap = new NotificationMap();

module.exports = {
    notificationMap,
};
