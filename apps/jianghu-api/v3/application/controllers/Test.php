<?php

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Test extends CI_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }


    public function index() {
        $payload = [
            'gameId' => '1338429',
            'playerId' => 'test-player',
            'nickname' => 'Demo1',
            'avatar' => 'https://qiaoyincapital.com/avatar/2025/10/31/avatar_837616_1761890982.jpeg',
            'message' => 'Test notification ping from CodeIgniter'
        ];

        $endpoint = getenv('WORKERMAN_PUSH_ENDPOINT');
        if (!$endpoint) {
            $endpoint = 'http://127.0.0.1:2347/push';
        }

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3
        ]);

        $responseBody = curl_exec($ch);
        $curlError = curl_error($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $result = [
            'endpoint' => $endpoint,
            'payload' => $payload,
            'statusCode' => $statusCode,
            'response' => $responseBody
        ];

        if ($curlError) {
            $result['error'] = $curlError;
        }

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($result, JSON_UNESCAPED_UNICODE));
    }
}
