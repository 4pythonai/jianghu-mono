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

        // check 命令特殊处理
        if ($command === 'check') {
            return $this->environmentChecker->run();
        }

        // 确保 PID 文件路径基于 start.php 而不是 Runner.php
        // Workerman 的 init() 使用 debug_backtrace() 获取启动文件，会返回 Runner.php
        // 我们需要手动设置 PID 文件路径，使其基于 start.php
        $startFile = $argv[0] ?? '';
        if ($startFile) {
            // 如果 $argv[0] 是相对路径，尝试获取绝对路径
            if (!is_file($startFile)) {
                // 尝试从当前工作目录查找
                $cwd = getcwd();
                if ($cwd && is_file($cwd . '/' . $startFile)) {
                    $startFile = $cwd . '/' . $startFile;
                }
            }
            if (is_file($startFile)) {
                $startFile = realpath($startFile);
                $uniquePrefix = str_replace('/', '_', $startFile);
                Worker::$pidFile = dirname($startFile) . '/' . $uniquePrefix . '.pid';
            }
        }

        // stop、reload、status、connections 命令不需要创建 Worker，
        // 直接调用 Worker::runAll()，它会通过 parseCommand() 处理并退出
        $controlCommands = ['stop', 'reload', 'status', 'connections'];
        if (in_array($command, $controlCommands, true)) {
            try {
                Worker::runAll();
            } catch (Throwable $throwable) {
                fwrite(STDERR, sprintf(
                    "Workerman command failed: %s in %s:%d%s",
                    $throwable->getMessage(),
                    $throwable->getFile(),
                    $throwable->getLine(),
                    PHP_EOL
                ));
                return 1;
            }
            return 0;
        }

        // start 和 restart 命令需要创建 Worker
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
