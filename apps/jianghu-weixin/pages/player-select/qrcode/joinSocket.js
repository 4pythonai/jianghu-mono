const RECONNECT_DELAY = 4000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 25000;

export function createJoinSocket({
    url,
    gameId,
    uuid,
    onEvent,
    onStatusChange
} = {}) {
    if (!url) {
        throw new Error('createJoinSocket: url is required');
    }

    let currentUrl = url;
    let currentGameId = gameId;
    let currentUuid = uuid;
    let socketTask = null;
    let reconnectAttempts = 0;
    let reconnectTimer = null;
    let heartbeatTimer = null;
    let manualClose = false;
    let lastStatus = 'idle';

    function setStatus(status, extra = {}) {
        lastStatus = status;
        if (typeof onStatusChange === 'function') {
            onStatusChange({
                status,
                ...extra
            });
        }
    }

    function clearReconnectTimer() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }

    function clearHeartbeatTimer() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    function send(message) {
        if (!socketTask) {
            return false;
        }
        if (typeof socketTask.readyState === 'number' && socketTask.readyState !== 1) {
            return false;
        }
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        try {
            socketTask.send({ data });
            return true;
        } catch (error) {
            console.warn('[JoinSocket] send failed', error);
            return false;
        }
    }

    function subscribe() {
        if (!currentGameId) {
            return;
        }
        send({
            action: 'subscribe',
            gameId: currentGameId,
            uuid: currentUuid
        });
    }

    function startHeartbeat() {
        clearHeartbeatTimer();
        heartbeatTimer = setInterval(() => {
            send({
                action: 'ping',
                timestamp: Date.now()
            });
        }, HEARTBEAT_INTERVAL);
    }

    function scheduleReconnect() {
        if (manualClose) {
            return;
        }
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            setStatus('failed', {
                error: '多次尝试后仍无法连接实时通知通道'
            });
            return;
        }
        reconnectAttempts += 1;
        setStatus('reconnecting', { attempt: reconnectAttempts });
        clearReconnectTimer();
        reconnectTimer = setTimeout(() => {
            connect(true);
        }, RECONNECT_DELAY);
    }

    function connect(force = false) {
        if (!currentUrl) {
            setStatus('error', { error: '缺少实时通知通道地址' });
            return;
        }

        if (socketTask && !force) {
            return;
        }

        if (socketTask) {
            try {
                socketTask.close({
                    code: 1012,
                    reason: 'reconnect'
                });
            } catch (error) {
                console.warn('[JoinSocket] close before reconnect failed', error);
            }
            socketTask = null;
        }

        manualClose = false;
        clearReconnectTimer();
        clearHeartbeatTimer();
        setStatus('connecting');

        try {
            socketTask = wx.connectSocket({
                url: currentUrl,
                timeout: 5000
            });
        } catch (error) {
            setStatus('error', { error });
            scheduleReconnect();
            return;
        }

        socketTask.onOpen(() => {
            reconnectAttempts = 0;
            setStatus('connected');
            subscribe();
            startHeartbeat();
        });

        socketTask.onMessage(event => {
            const { data } = event;
            let message = data;
            if (typeof message === 'string') {
                try {
                    message = JSON.parse(message);
                } catch (error) {
                    console.warn('[JoinSocket] JSON parse error', error);
                    return;
                }
            }

            if (message?.event === 'pong') {
                return;
            }

            if (message?.event === 'subscribed') {
                setStatus('connected', { gameId: message.gameId });
                return;
            }

            if (message?.event === 'unsubscribed') {
                setStatus('closed');
                return;
            }

            if (typeof onEvent === 'function') {
                onEvent(message);
            }
        });

        socketTask.onError(error => {
            setStatus('error', { error });
        });

        socketTask.onClose(() => {
            clearHeartbeatTimer();
            socketTask = null;
            if (manualClose) {
                setStatus('idle');
            } else {
                setStatus('closed');
                scheduleReconnect();
            }
        });
    }

    function close(reason = 'page-hide') {
        manualClose = true;
        clearReconnectTimer();
        clearHeartbeatTimer();

        if (socketTask) {
            try {
                send({ action: 'unsubscribe' });
            } catch (error) {
                console.warn('[JoinSocket] unsubscribe failed', error);
            }
            try {
                socketTask.close({
                    code: 1000,
                    reason
                });
            } catch (error) {
                console.warn('[JoinSocket] close failed', error);
            }
            socketTask = null;
        }

        setStatus('idle');
    }

    function destroy(reason = 'destroy') {
        manualClose = true;
        clearReconnectTimer();
        clearHeartbeatTimer();
        if (socketTask) {
            try {
                socketTask.close({
                    code: 1000,
                    reason
                });
            } catch (error) {
                console.warn('[JoinSocket] destroy close failed', error);
            }
            socketTask = null;
        }
        setStatus('idle');
    }

    function updateSubscription({ gameId: nextGameId, uuid: nextUuid, url: nextUrl } = {}) {
        if (nextUrl && nextUrl !== currentUrl) {
            currentUrl = nextUrl;
        }
        if (nextGameId) {
            currentGameId = nextGameId;
        }
        if (nextUuid) {
            currentUuid = nextUuid;
        }

        if (socketTask && lastStatus === 'connected') {
            subscribe();
        }
    }

    function isActive() {
        return !!socketTask;
    }

    function getStatus() {
        return lastStatus;
    }

    return {
        connect,
        close,
        destroy,
        updateSubscription,
        isActive,
        getStatus
    };
}
