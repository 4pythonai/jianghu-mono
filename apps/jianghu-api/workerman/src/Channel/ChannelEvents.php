<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Channel;

final class ChannelEvents
{
    public const BROADCAST = 'joinNotification.broadcast';
    public const SUBSCRIPTION_METRICS = 'joinNotification.subscriptionMetrics';

    private function __construct()
    {
    }
}
