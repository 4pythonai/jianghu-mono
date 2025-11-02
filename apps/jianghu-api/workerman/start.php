#!/usr/bin/env php
<?php

declare(strict_types=1);

use Workerman\Worker;

const REQUIRED_EXTENSIONS = [
    'pcntl' => 'Process control (pcntl)',
    'posix' => 'POSIX (posix)',
    'sockets' => 'Sockets (sockets)'
];

const OPTIONAL_EXTENSIONS = [
    'event' => 'Event loop (event)',
    'libevent' => 'Event loop (libevent)',
    'uv' => 'Event loop (uv/libuv)'
];

const REQUIRED_FUNCTIONS = [
    'pcntl_fork',
    'pcntl_signal',
    'posix_getpid'
];

/**
 * Entry point.
 */
function main(array $argv): int {
    if (PHP_SAPI !== 'cli') {
        fwrite(STDERR, "This script must be executed via PHP CLI.\n");
        return 1;
    }

    $command = $argv[1] ?? 'start';
    if ($command === 'check') {
        return runEnvironmentCheck();
    }

    $autoloadPath = resolveAutoloadPath();
    if (!$autoloadPath) {
        fwrite(STDERR, "Composer autoload file not found. Run `composer install` in jianghu-api/workerman/` directory.\n");
        return 1;
    }
    require_once $autoloadPath;

    $worker = createPushWorker();

    try {
        Worker::runAll();
    } catch (Throwable $throwable) {
        fwrite(STDERR, sprintf(
            "Workerman failed to start: %s in %s:%d\n",
            $throwable->getMessage(),
            $throwable->getFile(),
            $throwable->getLine()
        ));
        return 1;
    }

    return 0;
}

/**
 * Execute environment readiness checks.
 */
function runEnvironmentCheck(): int {
    echo "PHP version: " . PHP_VERSION . PHP_EOL;
    echo "Extensions check:" . PHP_EOL;

    $errors = [];

    foreach (REQUIRED_EXTENSIONS as $extension => $label) {
        if (extension_loaded($extension)) {
            echo formatStatus('OK', "{$label}");
        } else {
            $errors[] = "{$label} extension is missing.";
            echo formatStatus('FAIL', "{$label} (missing)");
        }
    }

    echo PHP_EOL . "Disabled functions check:" . PHP_EOL;
    $disabledFunctions = array_filter(array_map('trim', explode(',', (string) ini_get('disable_functions'))));
    $disabledLookup = array_flip($disabledFunctions);

    foreach (REQUIRED_FUNCTIONS as $function) {
        if (!function_exists($function)) {
            $errors[] = "Function {$function} is unavailable (extension missing or disabled).";
            echo formatStatus('FAIL', "{$function} (unavailable)");
            continue;
        }
        if (isset($disabledLookup[$function])) {
            $errors[] = "Function {$function} is listed in disable_functions.";
            echo formatStatus('FAIL', "{$function} (disabled via php.ini)");
            continue;
        }
        echo formatStatus('OK', "{$function}");
    }

    echo PHP_EOL . "Optional extensions:" . PHP_EOL;
    foreach (OPTIONAL_EXTENSIONS as $extension => $label) {
        if (extension_loaded($extension)) {
            echo formatStatus('OK', "{$label}");
        } else {
            echo formatStatus('WARN', "{$label} (not installed)");
        }
    }

    if ($errors) {
        echo PHP_EOL . "Summary: Environment is NOT ready for Workerman." . PHP_EOL;
        foreach ($errors as $error) {
            echo " - {$error}" . PHP_EOL;
        }
        return 1;
    }

    echo PHP_EOL . "Summary: Environment is ready for Workerman." . PHP_EOL;
    return 0;
}

/**
 * Resolve composer autoload file location.
 */
function resolveAutoloadPath(): ?string {
    $autoloadPath = __DIR__ . '/vendor/autoload.php';

    if (file_exists($autoloadPath)) {
        return $autoloadPath;
    }

    return null;
}

/**
 * Create the Workerman HTTP worker that receives push messages.
 */
function createPushWorker(): Worker {
    $listenAddress = getenv('WORKERMAN_LISTEN_ADDRESS') ?: 'http://0.0.0.0:2347';

    $worker = new Worker($listenAddress);
    $worker->name = 'JoinNotificationPush';
    $worker->count = (int) getenv('WORKERMAN_WORKER_COUNT') ?: 1;

    $worker->onMessage = function ($connection, $request): void {
        $rawBody = method_exists($request, 'rawBody') ? $request->rawBody() : (string) $request;
        $decoded = json_decode($rawBody, true);
        $displayPayload = $decoded
            ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : $rawBody;

        $logLine = sprintf("[%s] Received message: %s\n", date('Y-m-d H:i:s'), $displayPayload);
        echo $logLine;

        $response = [
            'status' => 'ok',
            'receivedAt' => date(DATE_ATOM),
            'echo' => $decoded ?? $rawBody
        ];
        $connection->send(json_encode($response, JSON_UNESCAPED_UNICODE));
    };

    return $worker;
}

/**
 * Format status output lines.
 */
function formatStatus(string $status, string $message): string {
    return sprintf("  [%s] %s%s", str_pad($status, 4, ' ', STR_PAD_LEFT), $message, PHP_EOL);
}

exit(main($argv));
