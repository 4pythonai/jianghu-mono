<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Subscription;

use Jianghu\Workerman\Channel\ChannelManager;
use Workerman\Connection\TcpConnection;

/**
 * 跟踪 websocket 订阅并保持 Channel 指标同步。
 */
final class SubscriptionRegistry {
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

    /**
     * @param ChannelManager $channelManager 用于发布跨 worker 指标。
     */
    public function __construct(ChannelManager $channelManager) {
        $this->channelManager = $channelManager;
    }

    /**
     * 将连接绑定到给定的 $gameId 并广播指标更新。
     */
    public function register(TcpConnection $connection, string $gameId): void {
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

    /**
     * 移除现有订阅并发送更新的计数。
     */
    public function unregister(TcpConnection $connection): void {
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

    /**
     * 向 $gameId 的所有订阅者发送负载，清理已关闭的套接字。
     *
     * @param array<string, mixed> $payload
     */
    public function broadcast(string $gameId, array $payload): void {
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

    /**
     * 解析给定游戏的最新订阅者计数。
     */
    public function getSubscriberCount(string $gameId): int {
        if (isset($this->byGame[$gameId])) {
            return count($this->byGame[$gameId]);
        }

        return $this->metrics[$gameId] ?? 0;
    }

    /**
     * 从 Channel 广播接收计数并刷新本地缓存。
     */
    public function updateMetricsFromChannel(string $gameId, int $count): void {
        if ($count <= 0) {
            unset($this->metrics[$gameId]);
            return;
        }

        $this->metrics[$gameId] = $count;
    }
}
