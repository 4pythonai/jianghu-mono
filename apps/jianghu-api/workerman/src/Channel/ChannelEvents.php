<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Channel;

/**
 * 跨 worker 使用的 Channel 事件名称的集中定义。
 */
final class ChannelEvents {
    public const BROADCAST = 'joinNotification.broadcast';
    public const SUBSCRIPTION_METRICS = 'joinNotification.subscriptionMetrics';

    private function __construct() {
    }
}
