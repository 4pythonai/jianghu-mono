#!/usr/bin/env php
<?php

declare(strict_types=1);

use Jianghu\Workerman\Bootstrap\Runner;

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be executed via PHP CLI." . PHP_EOL);
    exit(1);
}

$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    fwrite(STDERR, "Composer autoload file not found. Run `composer install` in `jianghu-api/workerman/` directory." . PHP_EOL);
    exit(1);
}

require_once $autoloadPath;

$runner = new Runner();
exit($runner->run($argv));
