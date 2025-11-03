<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Channel;

use Channel\Client as ChannelClient;
use Channel\Server as ChannelServer;
use Throwable;

/**
 * 封装 Channel 服务器引导和发布辅助功能。
 *
 * Worker 共享此实例，以便连接管理集中在一处。
 */
final class ChannelManager {
    private const DEFAULT_CHANNEL_HOST = '127.0.0.1';
    private const DEFAULT_CHANNEL_PORT = 2206;

    /** @var string */
    private $host;

    /** @var int */
    private $port;

    /** @var bool */
    private $clientConnected = false;

    /**
     * @param string|null $host 覆盖 Channel 主机（默认为环境变量/常量）。
     * @param int|null    $port 覆盖 Channel 端口（默认为环境变量/常量）。
     */
    public function __construct(?string $host = null, ?int $port = null) {
        $this->host = $host ?? (getenv('WORKERMAN_CHANNEL_HOST') ?: self::DEFAULT_CHANNEL_HOST);
        $this->port = $port ?? (int) (getenv('WORKERMAN_CHANNEL_PORT') ?: self::DEFAULT_CHANNEL_PORT);
    }

    /**
     * 启动 Channel TCP 服务器以启用 worker 间消息传递。
     */
    public function startServer(): void {
        new ChannelServer($this->host, $this->port);
    }

    /**
     * 在发布/消费之前确保 ChannelClient 具有活动连接。
     */
    public function ensureClientConnected(): void {
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

    /**
     * 通过 Channel 总线广播加入通知负载。
     *
     * @param string               $gameId
     * @param array<string, mixed> $message
     */
    public function publishJoinNotification(string $gameId, array $message): void {
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

    /**
     * 通过 Channel 在 worker 之间共享订阅计数。
     */
    public function publishSubscriptionMetrics(string $gameId, int $count): void {
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

    /**
     * 统一的日志记录辅助函数，以便 Channel 警告带有时间戳。
     */
    private function log(string $message): void {
        echo sprintf('[%s] %s%s', date('Y-m-d H:i:s'), $message, PHP_EOL);
    }
}
