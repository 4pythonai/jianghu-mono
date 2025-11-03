#!/usr/bin/env php
<?php

declare(strict_types=1);

use Channel\Client as ChannelClient;
use Channel\Server as ChannelServer;
use Workerman\Connection\TcpConnection;
use Workerman\Protocols\Http\Response;
use Workerman\Worker;

const REQUIRED_EXTENSIONS = [
    'pcntl' => 'Process control (pcntl)',
    'posix' => 'POSIX (posix)',
    'sockets' => 'Sockets (sockets)'
];

const OPTIONAL_EXTENSIONS = [
    'event' => 'Event loop (event)',
    'libevent' => 'Event loop (libevent)',
    'uv' => 'Event loop (uv/libuv)'
];

const DEFAULT_CHANNEL_HOST = '127.0.0.1';
const DEFAULT_CHANNEL_PORT = 2206;
const CHANNEL_EVENT_BROADCAST = 'joinNotification.broadcast';
const CHANNEL_EVENT_SUBSCRIPTION_METRICS = 'joinNotification.subscriptionMetrics';

const REQUIRED_FUNCTIONS = [
    'pcntl_fork',
    'pcntl_signal',
    'posix_getpid'
];

/**
 * Entry point.
 */
function main(array $argv): int {
    if (PHP_SAPI !== 'cli') {
        fwrite(STDERR, "This script must be executed via PHP CLI.\n");
        return 1;
    }

    $command = $argv[1] ?? 'start';
    if ($command === 'check') {
        return runEnvironmentCheck();
    }

    $autoloadPath = resolveAutoloadPath();
    if (!$autoloadPath) {
        fwrite(STDERR, "Composer autoload file not found. Run `composer install` in `jianghu-api/workerman/` directory.\n");
        return 1;
    }
    require_once $autoloadPath;

    createWorkers();

    try {
        Worker::runAll();
    } catch (Throwable $throwable) {
        fwrite(STDERR, sprintf(
            "Workerman failed to start: %s in %s:%d\n",
            $throwable->getMessage(),
            $throwable->getFile(),
            $throwable->getLine()
        ));
        return 1;
    }

    return 0;
}

/**
 * Execute environment readiness checks.
 */
function runEnvironmentCheck(): int {
    echo "PHP version: " . PHP_VERSION . PHP_EOL;
    echo "Extensions check:" . PHP_EOL;

    $errors = [];

    foreach (REQUIRED_EXTENSIONS as $extension => $label) {
        if (extension_loaded($extension)) {
            echo formatStatus('OK', "{$label}");
        } else {
            $errors[] = "{$label} extension is missing.";
            echo formatStatus('FAIL', "{$label} (missing)");
        }
    }

    echo PHP_EOL . "Disabled functions check:" . PHP_EOL;
    $disabledFunctions = array_filter(array_map('trim', explode(',', (string) ini_get('disable_functions'))));
    $disabledLookup = array_flip($disabledFunctions);

    foreach (REQUIRED_FUNCTIONS as $function) {
        if (!function_exists($function)) {
            $errors[] = "Function {$function} is unavailable (extension missing or disabled).";
            echo formatStatus('FAIL', "{$function} (unavailable)");
            continue;
        }
        if (isset($disabledLookup[$function])) {
            $errors[] = "Function {$function} is listed in disable_functions.";
            echo formatStatus('FAIL', "{$function} (disabled via php.ini)");
            continue;
        }
        echo formatStatus('OK', "{$function}");
    }

    echo PHP_EOL . "Optional extensions:" . PHP_EOL;
    foreach (OPTIONAL_EXTENSIONS as $extension => $label) {
        if (extension_loaded($extension)) {
            echo formatStatus('OK', "{$label}");
        } else {
            echo formatStatus('WARN', "{$label} (not installed)");
        }
    }

    if ($errors) {
        echo PHP_EOL . "Summary: Environment is NOT ready for Workerman." . PHP_EOL;
        foreach ($errors as $error) {
            echo " - {$error}" . PHP_EOL;
        }
        return 1;
    }

    echo PHP_EOL . "Summary: Environment is ready for Workerman." . PHP_EOL;
    return 0;
}

/**
 * Resolve composer autoload file location.
 */
function resolveAutoloadPath(): ?string {
    $autoloadPath = __DIR__ . '/vendor/autoload.php';

    if (file_exists($autoloadPath)) {
        return $autoloadPath;
    }

    return null;
}

/**
 * Start Channel server for inter-worker messaging.
 */
function createChannelServer(): void {
    $config = getChannelConfig();
    new ChannelServer($config['host'], (int) $config['port']);
}

/**
 * Retrieve channel configuration.
 *
 * @return array{host: string, port: int}
 */
function getChannelConfig(): array {
    $host = getenv('WORKERMAN_CHANNEL_HOST') ?: DEFAULT_CHANNEL_HOST;
    $port = getenv('WORKERMAN_CHANNEL_PORT') ?: DEFAULT_CHANNEL_PORT;

    return [
        'host' => $host,
        'port' => (int) $port
    ];
}

/**
 * Ensure Channel client connection is ready for the current worker.
 */
function ensureChannelClientConnected(): void {
    static $connected = false;
    if ($connected) {
        return;
    }

    $config = getChannelConfig();
    try {
        ChannelClient::connect($config['host'], (int) $config['port']);
        $connected = true;
    } catch (Throwable $throwable) {
        echo sprintf(
            "[%s] Channel connect failed: %s\n",
            date('Y-m-d H:i:s'),
            $throwable->getMessage()
        );
    }
}

/**
 * Publish join notification payload to Channel for WebSocket workers.
 */
function publishJoinNotification(string $gameId, array $message): void {
    ensureChannelClientConnected();
    try {
        ChannelClient::publish(CHANNEL_EVENT_BROADCAST, [
            'gameId' => $gameId,
            'message' => $message,
            'timestamp' => time()
        ]);
    } catch (Throwable $throwable) {
        echo sprintf(
            "[%s] Channel publish failed for gameId=%s: %s\n",
            date('Y-m-d H:i:s'),
            $gameId,
            $throwable->getMessage()
        );
    }
}

/**
 * Broadcast subscription count updates through Channel.
 */
function publishSubscriptionMetrics(string $gameId, int $count): void {
    ensureChannelClientConnected();
    try {
        ChannelClient::publish(CHANNEL_EVENT_SUBSCRIPTION_METRICS, [
            'gameId' => $gameId,
            'count' => $count,
            'timestamp' => time()
        ]);
    } catch (Throwable $throwable) {
        echo sprintf(
            "[%s] Channel metrics publish failed for gameId=%s: %s\n",
            date('Y-m-d H:i:s'),
            $gameId,
            $throwable->getMessage()
        );
    }
}

/**
 * Store subscription metrics shared across workers.
 *
 * @return array<string, int>
 */
function &getSubscriptionMetricsStore(): array {
    static $metrics = [];
    return $metrics;
}

/**
 * Update local subscription metrics cache.
 */
function updateSubscriptionMetrics(string $gameId, int $count): void {
    $metrics = &getSubscriptionMetricsStore();
    if ($count <= 0) {
        unset($metrics[$gameId]);
        return;
    }
    $metrics[$gameId] = $count;
}

/**
 * Create the Workerman HTTP worker that receives push messages.
 */
function createPushWorker(): Worker {
    $listenAddress =  'http://0.0.0.0:2347';

    $worker = new Worker($listenAddress);
    $worker->name = 'JoinNotificationHTTP';
    $worker->count = (int) getenv('WORKERMAN_WORKER_COUNT') ?: 1;

    $worker->onWorkerStart = static function (): void {
        ensureChannelClientConnected();
        ChannelClient::on(CHANNEL_EVENT_SUBSCRIPTION_METRICS, static function ($payload): void {
            if (!is_array($payload) || empty($payload['gameId']) || !isset($payload['count'])) {
                return;
            }
            updateSubscriptionMetrics((string) $payload['gameId'], (int) $payload['count']);
        });
    };

    $worker->onMessage = function ($connection, $request): void {
        $rawBody = method_exists($request, 'rawBody') ? $request->rawBody() : (string) $request;
        $decoded = json_decode($rawBody, true);
        $displayPayload = $decoded
            ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : $rawBody;

        $logLine = sprintf("[%s] Received message: %s\n", date('Y-m-d H:i:s'), $displayPayload);
        echo $logLine;

        if (!$decoded || empty($decoded['gameId'])) {
            $response = new Response(400, ['Content-Type' => 'application/json'], json_encode([
                'status' => 'error',
                'message' => 'Missing gameId'
            ], JSON_UNESCAPED_UNICODE));
            $connection->send($response);
            return;
        }

        $eventName = $decoded['event'] ?? 'player_joined';
        $message = [
            'event' => $eventName,
            'payload' => $decoded
        ];
        publishJoinNotification($decoded['gameId'], $message);

        $response = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'status' => 'ok',
            'receivedAt' => date(DATE_ATOM),
            'event' => $eventName,
            'dispatchedTo' => countSubscribers($decoded['gameId'])
        ], JSON_UNESCAPED_UNICODE));
        $connection->send($response);
    };

    return $worker;
}

/**
 * Instantiate HTTP and WebSocket workers.
 */
function createWorkers(): void {
    createChannelServer();
    createPushWorker();
    createWebsocketWorker();
}

/**
 * WebSocket worker that manages subscriptions per game.
 */
function createWebsocketWorker(): void {
    $listenAddress =  'websocket://0.0.0.0:2348';

    $worker = new Worker($listenAddress);
    $worker->name = 'JoinNotificationWS';
    $worker->count = (int) getenv('WORKERMAN_WS_WORKER_COUNT') ?: 1;

    $worker->onWorkerStart = static function (): void {
        ensureChannelClientConnected();
        ChannelClient::on(CHANNEL_EVENT_BROADCAST, static function ($payload): void {
            if (!is_array($payload)) {
                return;
            }
            $gameId = $payload['gameId'] ?? null;
            $message = $payload['message'] ?? null;
            if (!$gameId || !is_array($message)) {
                return;
            }
            broadcastToSubscribers((string) $gameId, $message);
        });

        ChannelClient::on(CHANNEL_EVENT_SUBSCRIPTION_METRICS, static function ($payload): void {
            if (!is_array($payload) || empty($payload['gameId']) || !isset($payload['count'])) {
                return;
            }
            updateSubscriptionMetrics((string) $payload['gameId'], (int) $payload['count']);
        });
    };

    $worker->onConnect = static function (TcpConnection $connection): void {
        $connection->appGameId = null;
    };

    $worker->onMessage = static function (TcpConnection $connection, $data): void {
        $payload = json_decode((string) $data, true);
        if (!$payload) {
            $connection->send(json_encode([
                'event' => 'error',
                'message' => 'Invalid JSON payload'
            ], JSON_UNESCAPED_UNICODE));
            return;
        }

        $action = $payload['action'] ?? '';
        $gameId = $payload['gameId'] ?? null;

        switch ($action) {
            case 'subscribe':
                if (!$gameId) {
                    $connection->send(json_encode([
                        'event' => 'error',
                        'message' => 'Missing gameId for subscribe'
                    ], JSON_UNESCAPED_UNICODE));
                    return;
                }
                echo sprintf(
                    "[%s] WS subscribe connection=%s gameId=%s uuid=%s\n",
                    date('Y-m-d H:i:s'),
                    spl_object_hash($connection),
                    $gameId,
                    $payload['uuid'] ?? ''
                );
                registerSubscription($connection, $gameId);
                $connection->send(json_encode([
                    'event' => 'subscribed',
                    'gameId' => $gameId
                ], JSON_UNESCAPED_UNICODE));
                break;
            case 'unsubscribe':
                echo sprintf(
                    "[%s] WS unsubscribe connection=%s\n",
                    date('Y-m-d H:i:s'),
                    spl_object_hash($connection)
                );
                unregisterSubscription($connection);
                $connection->send(json_encode([
                    'event' => 'unsubscribed'
                ], JSON_UNESCAPED_UNICODE));
                break;
            case 'ping':
                $connection->send(json_encode([
                    'event' => 'pong',
                    'timestamp' => time()
                ], JSON_UNESCAPED_UNICODE));
                break;
            default:
                echo sprintf(
                    "[%s] WS unknown action connection=%s action=%s\n",
                    date('Y-m-d H:i:s'),
                    spl_object_hash($connection),
                    $action
                );
                $connection->send(json_encode([
                    'event' => 'error',
                    'message' => "Unsupported action: {$action}"
                ], JSON_UNESCAPED_UNICODE));
        }
    };

    $worker->onClose = static function (TcpConnection $connection): void {
        echo sprintf(
            "[%s] WS closed connection=%s\n",
            date('Y-m-d H:i:s'),
            spl_object_hash($connection)
        );
        unregisterSubscription($connection);
    };
}

/**
 * Get subscription storage.
 *
 * @return array{byGame: array<string, array<string, TcpConnection>>, byConnection: array<string, string>}
 */
function &getSubscriptionStore(): array {
    static $store = [
        'byGame' => [],
        'byConnection' => []
    ];

    return $store;
}

/**
 * Register connection for a game.
 */
function registerSubscription(TcpConnection $connection, string $gameId): void {
    $store = &getSubscriptionStore();
    $connectionId = spl_object_hash($connection);

    if (isset($store['byConnection'][$connectionId])) {
        $previousGame = $store['byConnection'][$connectionId];
        unset($store['byGame'][$previousGame][$connectionId]);
        if (!$store['byGame'][$previousGame]) {
            unset($store['byGame'][$previousGame]);
        }
    }

    $store['byConnection'][$connectionId] = $gameId;
    if (!isset($store['byGame'][$gameId])) {
        $store['byGame'][$gameId] = [];
    }
    $store['byGame'][$gameId][$connectionId] = $connection;
    $connection->appGameId = $gameId;

    $currentCount = count($store['byGame'][$gameId]);
    updateSubscriptionMetrics($gameId, $currentCount);
    publishSubscriptionMetrics($gameId, $currentCount);
}

/**
 * Unregister connection.
 */
function unregisterSubscription(TcpConnection $connection): void {
    $store = &getSubscriptionStore();
    $connectionId = spl_object_hash($connection);

    if (!isset($store['byConnection'][$connectionId])) {
        return;
    }

    $gameId = $store['byConnection'][$connectionId];
    unset($store['byConnection'][$connectionId]);
    unset($store['byGame'][$gameId][$connectionId]);
    if (empty($store['byGame'][$gameId])) {
        unset($store['byGame'][$gameId]);
        $currentCount = 0;
    } else {
        $currentCount = count($store['byGame'][$gameId]);
    }
    $connection->appGameId = null;

    updateSubscriptionMetrics($gameId, $currentCount);
    publishSubscriptionMetrics($gameId, $currentCount);
}

/**
 * Broadcast payload to all subscribers of a game.
 */
function broadcastToSubscribers(string $gameId, array $payload): void {
    $store = &getSubscriptionStore();
    if (empty($store['byGame'][$gameId])) {
        return;
    }

    $message = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $hasChanges = false;
    foreach ($store['byGame'][$gameId] as $connectionId => $connection) {
        if (!$connection || $connection->getStatus() === TcpConnection::STATUS_CLOSED) {
            unset($store['byGame'][$gameId][$connectionId]);
            $hasChanges = true;
            continue;
        }
        $connection->send($message);
    }

    if (empty($store['byGame'][$gameId])) {
        unset($store['byGame'][$gameId]);
        $hasChanges = true;
    }

    if ($hasChanges) {
        $currentCount = isset($store['byGame'][$gameId])
            ? count($store['byGame'][$gameId])
            : 0;
        updateSubscriptionMetrics($gameId, $currentCount);
        publishSubscriptionMetrics($gameId, $currentCount);
    }
}

/**
 * Count subscribers for a given game.
 */
function countSubscribers(string $gameId): int {
    $store = &getSubscriptionStore();
    if (!empty($store['byGame'][$gameId])) {
        return count($store['byGame'][$gameId]);
    }

    $metrics = &getSubscriptionMetricsStore();
    if (isset($metrics[$gameId])) {
        return (int) $metrics[$gameId];
    }

    return 0;
}

/**
 * Format status output lines.
 */
function formatStatus(string $status, string $message): string {
    return sprintf("  [%s] %s%s", str_pad($status, 4, ' ', STR_PAD_LEFT), $message, PHP_EOL);
}

exit(main($argv));
