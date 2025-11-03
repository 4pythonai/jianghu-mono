<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Subscription;

use Jianghu\Workerman\Channel\ChannelManager;
use Workerman\Connection\TcpConnection;

final class SubscriptionRegistry
{
    /**
     * @var array<string, array<string, TcpConnection>>
     */
    private $byGame = [];

    /**
     * @var array<string, string>
     */
    private $byConnection = [];

    /**
     * @var array<string, int>
     */
    private $metrics = [];

    /** @var ChannelManager */
    private $channelManager;

    public function __construct(ChannelManager $channelManager)
    {
        $this->channelManager = $channelManager;
    }

    public function register(TcpConnection $connection, string $gameId): void
    {
        $connectionId = spl_object_hash($connection);

        if (isset($this->byConnection[$connectionId])) {
            $previousGame = $this->byConnection[$connectionId];
            unset($this->byGame[$previousGame][$connectionId]);
            if (empty($this->byGame[$previousGame])) {
                unset($this->byGame[$previousGame]);
            }
        }

        $this->byConnection[$connectionId] = $gameId;
        if (!isset($this->byGame[$gameId])) {
            $this->byGame[$gameId] = [];
        }
        $this->byGame[$gameId][$connectionId] = $connection;
        $connection->appGameId = $gameId;

        $currentCount = count($this->byGame[$gameId]);
        $this->metrics[$gameId] = $currentCount;
        $this->channelManager->publishSubscriptionMetrics($gameId, $currentCount);
    }

    public function unregister(TcpConnection $connection): void
    {
        $connectionId = spl_object_hash($connection);
        if (!isset($this->byConnection[$connectionId])) {
            return;
        }

        $gameId = $this->byConnection[$connectionId];
        unset($this->byConnection[$connectionId]);
        unset($this->byGame[$gameId][$connectionId]);

        if (empty($this->byGame[$gameId])) {
            unset($this->byGame[$gameId]);
            $currentCount = 0;
        } else {
            $currentCount = count($this->byGame[$gameId]);
        }

        $connection->appGameId = null;
        $this->metrics[$gameId] = $currentCount;
        $this->channelManager->publishSubscriptionMetrics($gameId, $currentCount);
    }

    public function broadcast(string $gameId, array $payload): void
    {
        if (empty($this->byGame[$gameId])) {
            return;
        }

        $message = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if ($message === false) {
            return;
        }

        $hasChanges = false;
        foreach ($this->byGame[$gameId] as $connectionId => $connection) {
            if (!$connection || $connection->getStatus() === TcpConnection::STATUS_CLOSED) {
                unset($this->byGame[$gameId][$connectionId]);
                unset($this->byConnection[$connectionId]);
                $hasChanges = true;
                continue;
            }
            $connection->send($message);
        }

        if (empty($this->byGame[$gameId])) {
            unset($this->byGame[$gameId]);
            $hasChanges = true;
        }

        if ($hasChanges) {
            $currentCount = isset($this->byGame[$gameId]) ? count($this->byGame[$gameId]) : 0;
            $this->metrics[$gameId] = $currentCount;
            $this->channelManager->publishSubscriptionMetrics($gameId, $currentCount);
        }
    }

    public function getSubscriberCount(string $gameId): int
    {
        if (isset($this->byGame[$gameId])) {
            return count($this->byGame[$gameId]);
        }

        return $this->metrics[$gameId] ?? 0;
    }

    public function updateMetricsFromChannel(string $gameId, int $count): void
    {
        if ($count <= 0) {
            unset($this->metrics[$gameId]);
            return;
        }

        $this->metrics[$gameId] = $count;
    }
}
