<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Worker;

use Channel\Client as ChannelClient;
use Jianghu\Workerman\Channel\ChannelEvents;
use Jianghu\Workerman\Channel\ChannelManager;
use Jianghu\Workerman\Subscription\SubscriptionRegistry;
use Workerman\Connection\TcpConnection;
use Workerman\Worker;

/**
 * 提供分发加入通知的 Workerman websocket worker。
 */
final class WebsocketWorkerFactory {
    /**
     * 准备一个用于实时游戏订阅的 websocket worker。
     */
    public function create(ChannelManager $channelManager, SubscriptionRegistry $registry): Worker {
        $listenAddress = 'websocket://0.0.0.0:2348';

        $worker = new Worker($listenAddress);
        $worker->name = 'JoinNotificationWS';
        $worker->count = (int) getenv('WORKERMAN_WS_WORKER_COUNT') ?: 1;

        $worker->onWorkerStart = static function () use ($channelManager, $registry): void {
            $channelManager->ensureClientConnected();

            ChannelClient::on(ChannelEvents::BROADCAST, static function ($payload) use ($registry): void {
                if (!is_array($payload)) {
                    return;
                }
                $gameId = $payload['gameId'] ?? null;
                $message = $payload['message'] ?? null;
                if (!$gameId || !is_array($message)) {
                    return;
                }

                $registry->broadcast((string) $gameId, $message);
            });

            ChannelClient::on(ChannelEvents::SUBSCRIPTION_METRICS, static function ($payload) use ($registry): void {
                if (!is_array($payload) || empty($payload['gameId']) || !isset($payload['count'])) {
                    return;
                }

                $registry->updateMetricsFromChannel((string) $payload['gameId'], (int) $payload['count']);
            });
        };

        $worker->onConnect = static function (TcpConnection $connection): void {
            $connection->appGameId = null;
        };

        $worker->onMessage = static function (TcpConnection $connection, $data) use ($registry): void {
            $payload = json_decode((string) $data, true);
            if (!$payload) {
                $connection->send(json_encode([
                    'event' => 'error',
                    'message' => 'Invalid JSON payload',
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
                            'message' => 'Missing gameId for subscribe',
                        ], JSON_UNESCAPED_UNICODE));
                        return;
                    }
                    echo sprintf(
                        '[%s] WS subscribe connection=%s gameId=%s uuid=%s%s',
                        date('Y-m-d H:i:s'),
                        spl_object_hash($connection),
                        $gameId,
                        $payload['uuid'] ?? '',
                        PHP_EOL
                    );
                    $registry->register($connection, (string) $gameId);
                    $connection->send(json_encode([
                        'event' => 'subscribed',
                        'gameId' => $gameId,
                    ], JSON_UNESCAPED_UNICODE));
                    break;
                case 'unsubscribe':
                    echo sprintf(
                        '[%s] WS unsubscribe connection=%s%s',
                        date('Y-m-d H:i:s'),
                        spl_object_hash($connection),
                        PHP_EOL
                    );
                    $registry->unregister($connection);
                    $connection->send(json_encode([
                        'event' => 'unsubscribed',
                    ], JSON_UNESCAPED_UNICODE));
                    break;
                case 'ping':
                    $connection->send(json_encode([
                        'event' => 'pong',
                        'timestamp' => time(),
                    ], JSON_UNESCAPED_UNICODE));
                    break;
                default:
                    echo sprintf(
                        '[%s] WS unknown action connection=%s action=%s%s',
                        date('Y-m-d H:i:s'),
                        spl_object_hash($connection),
                        $action,
                        PHP_EOL
                    );
                    $connection->send(json_encode([
                        'event' => 'error',
                        'message' => "Unsupported action: {$action}",
                    ], JSON_UNESCAPED_UNICODE));
            }
        };

        $worker->onClose = static function (TcpConnection $connection) use ($registry): void {
            echo sprintf(
                '[%s] WS closed connection=%s%s',
                date('Y-m-d H:i:s'),
                spl_object_hash($connection),
                PHP_EOL
            );
            $registry->unregister($connection);
        };

        return $worker;
    }
}
