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


    public function index($payload) {


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


    public function debug_scoreboard() {
        $game_id = 1339485;
        $group_id = 1206;

        // Get score index
        $rows = $this->db->select('group_id, user_id, hindex, score')
            ->from('t_game_score')
            ->where('gameid', $game_id)
            ->where('score >', 0)
            ->where('hindex IS NOT NULL')
            ->where('hindex >', 0)
            ->get()
            ->result_array();

        echo "Total rows: " . count($rows) . "\n\n";

        $index = [];
        foreach ($rows as $row) {
            $gid = (int) ($row['group_id'] ?? 0);
            $uid = (int) ($row['user_id'] ?? 0);
            $hindex = (int) ($row['hindex'] ?? 0);
            $score = (int) ($row['score'] ?? 0);

            if (!$gid || !$uid || !$hindex || $score <= 0) {
                continue;
            }

            if (!isset($index[$gid])) {
                $index[$gid] = [];
            }
            if (!isset($index[$gid][$uid])) {
                $index[$gid][$uid] = [];
            }
            $index[$gid][$uid][$hindex] = $score;
        }

        echo "Score index for group $group_id:\n";
        if (isset($index[$group_id])) {
            foreach ($index[$group_id] as $uid => $holes) {
                echo "  User $uid: " . count($holes) . " holes\n";
                echo "    Holes: " . implode(', ', array_keys($holes)) . "\n";
            }
        } else {
            echo "  No data found!\n";
        }

        // Test getSideHoleScore logic
        $left_user_ids = [6];
        $right_user_ids = [17];

        echo "\nTesting hole scores:\n";
        for ($h = 1; $h <= 18; $h++) {
            $left_score = null;
            $right_score = null;

            // Left side
            foreach ($left_user_ids as $uid) {
                $score = $index[$group_id][$uid][$h] ?? null;
                if ($score !== null) {
                    if ($left_score === null || $score < $left_score) {
                        $left_score = $score;
                    }
                }
            }

            // Right side
            foreach ($right_user_ids as $uid) {
                $score = $index[$group_id][$uid][$h] ?? null;
                if ($score !== null) {
                    if ($right_score === null || $score < $right_score) {
                        $right_score = $score;
                    }
                }
            }

            $status = ($left_score === null || $right_score === null) ? "SKIPPED" : "OK";
            echo "  Hole $h: left=$left_score, right=$right_score [$status]\n";
        }
    }
}
