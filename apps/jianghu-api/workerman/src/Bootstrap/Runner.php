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

final class Runner
{
    private EnvironmentChecker $environmentChecker;
    private ChannelManager $channelManager;
    private SubscriptionRegistry $subscriptionRegistry;
    private HttpPushWorkerFactory $httpWorkerFactory;
    private WebsocketWorkerFactory $websocketWorkerFactory;

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

    public function run(array $argv): int
    {
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
