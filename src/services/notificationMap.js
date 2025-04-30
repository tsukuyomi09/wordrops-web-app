class NotificationMap {
    constructor() {
        this.map = new Map();
    }

    add(gameId, user_id, points, comment) {
        if (!this.map.has(user_id)) {
            this.map.set(user_id, new Map());
        }
        this.map.get(user_id).set(gameId, { points, comment });
        console.log(
            "NotificationMap Dopo aggiunta:",
            JSON.stringify(
                [...this.map].map(([key, value]) => {
                    return [key, [...value]];
                }),
                null,
                2
            )
        );
    }

    remove(gameId, user_id) {
        const userNotifications = this.map.get(user_id);
        if (!userNotifications.has(gameId)) return;

        userNotifications.delete(gameId);

        if (userNotifications.size === 0) {
            this.map.delete(user_id);
        }
        console.log(
            "NotificationMap Dopo rimozione:",
            JSON.stringify(
                [...this.map].map(([key, value]) => {
                    return [key, [...value]];
                }),
                null,
                2
            )
        );
    }

    has(user_id) {
        return this.map.has(user_id);
    }

    get(user_id) {
        return this.map.has(user_id) ? this.map.get(user_id) : null;
    }
}

const notificationMap = new NotificationMap();

module.exports = {
    notificationMap,
};
