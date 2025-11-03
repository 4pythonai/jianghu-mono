<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Worker;

use Channel\Client as ChannelClient;
use Jianghu\Workerman\Channel\ChannelEvents;
use Jianghu\Workerman\Channel\ChannelManager;
use Jianghu\Workerman\Subscription\SubscriptionRegistry;
use Workerman\Connection\TcpConnection;
use Workerman\Protocols\Http\Response;
use Workerman\Worker;

final class HttpPushWorkerFactory
{
    public function create(ChannelManager $channelManager, SubscriptionRegistry $registry): Worker
    {
        $listenAddress = 'http://0.0.0.0:2347';

        $worker = new Worker($listenAddress);
        $worker->name = 'JoinNotificationHTTP';
        $worker->count = (int) getenv('WORKERMAN_WORKER_COUNT') ?: 1;

        $worker->onWorkerStart = static function () use ($channelManager, $registry): void {
            $channelManager->ensureClientConnected();

            ChannelClient::on(ChannelEvents::SUBSCRIPTION_METRICS, static function ($payload) use ($registry): void {
                if (!is_array($payload) || empty($payload['gameId']) || !isset($payload['count'])) {
                    return;
                }

                $registry->updateMetricsFromChannel((string) $payload['gameId'], (int) $payload['count']);
            });
        };

        $worker->onMessage = function (TcpConnection $connection, $request) use ($channelManager, $registry): void {
            $rawBody = method_exists($request, 'rawBody') ? $request->rawBody() : (string) $request;
            $decoded = json_decode($rawBody, true);
            $displayPayload = $decoded
                ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : $rawBody;

            echo sprintf('[%s] Received message: %s%s', date('Y-m-d H:i:s'), $displayPayload, PHP_EOL);

            if (!$decoded || empty($decoded['gameId'])) {
                $response = new Response(400, ['Content-Type' => 'application/json'], json_encode([
                    'status' => 'error',
                    'message' => 'Missing gameId',
                ], JSON_UNESCAPED_UNICODE));
                $connection->send($response);
                return;
            }

            $eventName = $decoded['event'] ?? 'player_joined';
            $message = [
                'event' => $eventName,
                'payload' => $decoded,
            ];

            $channelManager->publishJoinNotification((string) $decoded['gameId'], $message);

            $response = new Response(200, ['Content-Type' => 'application/json'], json_encode([
                'status' => 'ok',
                'receivedAt' => date(DATE_ATOM),
                'event' => $eventName,
                'dispatchedTo' => $registry->getSubscriberCount((string) $decoded['gameId']),
            ], JSON_UNESCAPED_UNICODE));
            $connection->send($response);
        };

        return $worker;
    }
}
