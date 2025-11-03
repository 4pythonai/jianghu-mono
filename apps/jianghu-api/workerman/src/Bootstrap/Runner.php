<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Bootstrap;

use Jianghu\Workerman\Channel\ChannelManager;
use Jianghu\Workerman\Env\EnvironmentChecker;
use Jianghu\Workerman\Subscription\SubscriptionRegistry;
use Jianghu\Workerman\Worker\HttpPushWorkerFactory;
use Jianghu\Workerman\Worker\WebsocketWorkerFactory;
use Throwable;
use Workerman\Worker;

/**
 * 配置并启动 Workerman 运行时。
 *
 * 此类将 CLI 处理和 worker 连接集中管理，以便未来的扩展
 * 只需在单一位置进行插件化。
 */
final class Runner {
    /** @var EnvironmentChecker */
    private $environmentChecker;

    /** @var ChannelManager */
    private $channelManager;

    /** @var SubscriptionRegistry */
    private $subscriptionRegistry;

    /** @var HttpPushWorkerFactory */
    private $httpWorkerFactory;

    /** @var WebsocketWorkerFactory */
    private $websocketWorkerFactory;

    /**
     * 允许为测试或额外功能替换依赖项。
     *
     * @param EnvironmentChecker|null     $environmentChecker
     * @param ChannelManager|null         $channelManager
     * @param SubscriptionRegistry|null   $subscriptionRegistry
     * @param HttpPushWorkerFactory|null  $httpWorkerFactory
     * @param WebsocketWorkerFactory|null $websocketWorkerFactory
     */
    public function __construct(
        ?EnvironmentChecker $environmentChecker = null,
        ?ChannelManager $channelManager = null,
        ?SubscriptionRegistry $subscriptionRegistry = null,
        ?HttpPushWorkerFactory $httpWorkerFactory = null,
        ?WebsocketWorkerFactory $websocketWorkerFactory = null
    ) {
        $this->environmentChecker = $environmentChecker ?? new EnvironmentChecker();
        $this->channelManager = $channelManager ?? new ChannelManager();
        $this->subscriptionRegistry = $subscriptionRegistry ?? new SubscriptionRegistry($this->channelManager);
        $this->httpWorkerFactory = $httpWorkerFactory ?? new HttpPushWorkerFactory();
        $this->websocketWorkerFactory = $websocketWorkerFactory ?? new WebsocketWorkerFactory();
    }

    /**
     * 执行 CLI 命令（`check`、`start` 等）。
     *
     * @param array<int, mixed> $argv
     */
    public function run(array $argv): int {
        $command = $argv[1] ?? 'start';
        if ($command === 'check') {
            return $this->environmentChecker->run();
        }

        $this->channelManager->startServer();
        $this->httpWorkerFactory->create($this->channelManager, $this->subscriptionRegistry);
        $this->websocketWorkerFactory->create($this->channelManager, $this->subscriptionRegistry);

        try {
            Worker::runAll();
        } catch (Throwable $throwable) {
            fwrite(STDERR, sprintf(
                "Workerman failed to start: %s in %s:%d%s",
                $throwable->getMessage(),
                $throwable->getFile(),
                $throwable->getLine(),
                PHP_EOL
            ));
            return 1;
        }

        return 0;
    }
}
