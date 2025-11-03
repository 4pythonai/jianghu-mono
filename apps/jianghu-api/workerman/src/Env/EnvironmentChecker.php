<?php

declare(strict_types=1);

namespace Jianghu\Workerman\Env;

/**
 * 为 Workerman 部署执行环境诊断。
 *
 * 检查器在启动 worker 之前通过 `php start.php check` 调用。
 */
final class EnvironmentChecker {
    private const REQUIRED_EXTENSIONS = [
        'pcntl' => 'Process control (pcntl)',
        'posix' => 'POSIX (posix)',
        'sockets' => 'Sockets (sockets)',
    ];

    private const OPTIONAL_EXTENSIONS = [
        'event' => 'Event loop (event)',
        'libevent' => 'Event loop (libevent)',
        'uv' => 'Event loop (uv/libuv)',
    ];

    private const REQUIRED_FUNCTIONS = [
        'pcntl_fork',
        'pcntl_signal',
        'posix_getpid',
    ];

    /**
     * 执行环境就绪检查。
     */
    public function run(): int {
        echo 'PHP version: ' . PHP_VERSION . PHP_EOL;
        echo 'Extensions check:' . PHP_EOL;

        $errors = [];

        foreach (self::REQUIRED_EXTENSIONS as $extension => $label) {
            if (extension_loaded($extension)) {
                echo $this->formatStatus('OK', $label);
            } else {
                $errors[] = "{$label} extension is missing.";
                echo $this->formatStatus('FAIL', "{$label} (missing)");
            }
        }

        echo PHP_EOL . 'Disabled functions check:' . PHP_EOL;
        $disabledFunctions = array_filter(array_map('trim', explode(',', (string) ini_get('disable_functions'))));
        $disabledLookup = array_flip($disabledFunctions);

        foreach (self::REQUIRED_FUNCTIONS as $function) {
            if (!function_exists($function)) {
                $errors[] = "Function {$function} is unavailable (extension missing or disabled).";
                echo $this->formatStatus('FAIL', "{$function} (unavailable)");
                continue;
            }
            if (isset($disabledLookup[$function])) {
                $errors[] = "Function {$function} is listed in disable_functions.";
                echo $this->formatStatus('FAIL', "{$function} (disabled via php.ini)");
                continue;
            }
            echo $this->formatStatus('OK', $function);
        }

        echo PHP_EOL . 'Optional extensions:' . PHP_EOL;
        foreach (self::OPTIONAL_EXTENSIONS as $extension => $label) {
            if (extension_loaded($extension)) {
                echo $this->formatStatus('OK', $label);
            } else {
                echo $this->formatStatus('WARN', "{$label} (not installed)");
            }
        }

        if ($errors) {
            echo PHP_EOL . 'Summary: Environment is NOT ready for Workerman.' . PHP_EOL;
            foreach ($errors as $error) {
                echo ' - ' . $error . PHP_EOL;
            }
            return 1;
        }

        echo PHP_EOL . 'Summary: Environment is ready for Workerman.' . PHP_EOL;
        return 0;
    }

    /**
     * 为终端输出构建一致的状态消息。
     */
    private function formatStatus(string $status, string $message): string {
        return sprintf('  [%s] %s%s', str_pad($status, 4, ' ', STR_PAD_LEFT), $message, PHP_EOL);
    }
}
