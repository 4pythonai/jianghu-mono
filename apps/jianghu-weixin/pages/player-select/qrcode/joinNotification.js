function createJoinNotification({ page, displayDuration = 3600, exitDuration = 260 } = {}) {
    if (!page || typeof page.setData !== 'function') {
        throw new Error('createJoinNotification: invalid page instance');
    }

    const timers = Object.create(null);

    function getNotifications() {
        const list = page.data && Array.isArray(page.data.notifications)
            ? page.data.notifications
            : [];
        return list;
    }

    function setNotifications(nextList, callback) {
        page.setData({ notifications: nextList }, callback);
    }

    function clearTimersById(id) {
        const bucket = timers[id];
        if (!bucket) {
            return;
        }
        if (bucket.leaveTimer) {
            clearTimeout(bucket.leaveTimer);
        }
        if (bucket.cleanupTimer) {
            clearTimeout(bucket.cleanupTimer);
        }
        delete timers[id];
    }

    function scheduleLeave(id) {
        clearTimersById(id);
        const bucket = {};
        bucket.leaveTimer = setTimeout(() => {
            setState(id, 'leave');
            bucket.cleanupTimer = setTimeout(() => {
                remove(id);
            }, exitDuration);
        }, displayDuration);
        timers[id] = bucket;
    }

    function setState(id, state) {
        const list = getNotifications();
        let hasChanged = false;
        const nextList = list.map(item => {
            if (item.id !== id) {
                return item;
            }
            if (item.state === state) {
                return item;
            }
            hasChanged = true;
            return { ...item, state };
        });

        if (!hasChanged) {
            return;
        }

        setNotifications(nextList);
    }

    function remove(id) {
        const list = getNotifications();
        const nextList = list.filter(item => item.id !== id);
        if (nextList.length === list.length) {
            clearTimersById(id);
            return;
        }

        setNotifications(nextList, () => {
            clearTimersById(id);
        });
    }

    function push({ avatar, nickname }) {
        const id = `notification_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const list = getNotifications();
        const nextList = list.concat([
            {
                id,
                avatar,
                nickname,
                state: 'enter'
            }
        ]);

        setNotifications(nextList, () => {
            scheduleLeave(id);
        });

        return id;
    }

    function clearAll() {
        Object.keys(timers).forEach(clearTimersById);
        const list = getNotifications();
        if (!list.length) {
            return;
        }
        setNotifications([]);
    }

    function destroy() {
        clearAll();
        Object.keys(timers).forEach(clearTimersById);
    }

    return {
        push,
        remove,
        clearAll,
        destroy
    };
}

module.exports = {
    createJoinNotification
};
