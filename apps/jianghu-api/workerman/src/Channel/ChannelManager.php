<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Channel;

use Channel\Client as ChannelClient;
use Channel\Server as ChannelServer;
use Throwable;

final class ChannelManager
{
    private const DEFAULT_CHANNEL_HOST = '127.0.0.1';
    private const DEFAULT_CHANNEL_PORT = 2206;

    private string $host;
    private int $port;
    private bool $clientConnected = false;

    public function __construct(?string $host = null, ?int $port = null)
    {
        $this->host = $host ?? (getenv('WORKERMAN_CHANNEL_HOST') ?: self::DEFAULT_CHANNEL_HOST);
        $this->port = $port ?? (int) (getenv('WORKERMAN_CHANNEL_PORT') ?: self::DEFAULT_CHANNEL_PORT);
    }

    public function startServer(): void
    {
        new ChannelServer($this->host, $this->port);
    }

    public function ensureClientConnected(): void
    {
        if ($this->clientConnected) {
            return;
        }

        try {
            ChannelClient::connect($this->host, $this->port);
            $this->clientConnected = true;
        } catch (Throwable $throwable) {
            $this->log(sprintf('Channel connect failed: %s', $throwable->getMessage()));
        }
    }

    public function publishJoinNotification(string $gameId, array $message): void
    {
        $this->ensureClientConnected();
        try {
            ChannelClient::publish(ChannelEvents::BROADCAST, [
                'gameId' => $gameId,
                'message' => $message,
                'timestamp' => time(),
            ]);
        } catch (Throwable $throwable) {
            $this->log(sprintf('Channel publish failed for gameId=%s: %s', $gameId, $throwable->getMessage()));
        }
    }

    public function publishSubscriptionMetrics(string $gameId, int $count): void
    {
        $this->ensureClientConnected();
        try {
            ChannelClient::publish(ChannelEvents::SUBSCRIPTION_METRICS, [
                'gameId' => $gameId,
                'count' => $count,
                'timestamp' => time(),
            ]);
        } catch (Throwable $throwable) {
            $this->log(sprintf('Channel metrics publish failed for gameId=%s: %s', $gameId, $throwable->getMessage()));
        }
    }

    private function log(string $message): void
    {
        echo sprintf('[%s] %s%s', date('Y-m-d H:i:s'), $message, PHP_EOL);
    }
}
