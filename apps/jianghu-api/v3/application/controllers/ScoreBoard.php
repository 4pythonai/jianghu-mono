<?php

/**
 * ScoreBoard Controller
 *
 * Handles scoreboard display for 8 different golf match formats (G1-G8).
 * Routes to either horizontal (match play) or vertical (stroke play) layout.
 *
 * ============================================
 * MATCH FORMATS AND BRANCHING LOGIC
 * ============================================
 *
 * STROKE PLAY (Vertical Layout):
 * -------------------------------
 * G1 - individual_stroke (个人比杆赛):
 *   Branch 1: tag_count = 1  → Individual player rankings only
 *   Branch 2: tag_count >= 2 → Team rankings + Individual player rankings (combined structure)
 *
 * G2 - fourball_bestball_stroke (四人四球最好成绩比杆赛):
 *   Branch 1: tag_count = 1  → Combo rankings (combo mode)
 *   Branch 2: tag_count >= 2 → Team rankings (tag mode)
 *
 * G3 - fourball_scramble_stroke (四人四球最佳球位比杆赛/旺波):
 *   Branch 1: tag_count = 1  → Combo rankings (combo mode)
 *   Branch 2: tag_count >= 2 → Team rankings (tag mode)
 *
 * G4 - foursome_stroke (四人两球比杆赛):
 *   Branch 1: tag_count = 1  → Combo rankings (combo mode)
 *   Branch 2: tag_count >= 2 → Team rankings (tag mode)
 *
 * MATCH PLAY (Horizontal Layout):
 * --------------------------------
 * G5 - individual_match (个人比洞赛):
 *   Single Branch: tag_count = 2 → Individual match results (1v1)
 *
 * G6 - fourball_bestball_match (四人四球最好成绩比洞赛):
 *   Single Branch: tag_count = 2 → Team match results
 *
 * G7 - fourball_scramble_match (四人四球最佳球位比洞赛/旺波):
 *   Single Branch: tag_count = 2 → Team match results
 *
 * G8 - foursome_match (四人两球比洞赛):
 *   Single Branch: tag_count = 2 → Team match results
 */

ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class ScoreBoard extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
        $this->load->model('MTeamGame');
        $this->load->model('MScoreboard');
    }

    /**
     * Main scoreboard endpoint - routes to horizontal (match play) or vertical (stroke play) layout
     */
    public function getScoreBoard() {
        $params = $this->readJsonBody();
        $game_id = $params['game_id'] ?? null;
        $group_id = $params['group_id'] ?? null;

        if (!$game_id) {
            $this->respondError(400, '缺少 game_id');
            return;
        }

        $game = $this->MScoreboard->getGameRow($game_id);
        if (!$game) {
            $this->respondError(404, '赛事不存在');
            return;
        }

        $match_format = $game['match_format'] ?? null;
        $game_type = $game['game_type'] ?? 'common';
        $layout = $this->isMatchFormat($match_format) ? 'horizontal' : 'vertical';
        $total_holes = $this->MScoreboard->getTotalHoles($game_id, $game['holeList'] ?? null);
        if (!$total_holes) {
            // Match play defaults to 18 holes when holeList is missing.
            $total_holes = 18;
        }

        // Explicit routing to two layout branches
        if ($layout === 'horizontal') {
            $this->handleHorizontalLayout($game_id, $group_id, $match_format, $game_type, $total_holes);
        }

        if ($layout === 'vertical') {
            $this->handleVerticalLayout($game_id, $game, $match_format, $game_type, $total_holes);
        }
    }

    /**
     * Handle horizontal layout (match play format)
     *
     * Handles G5/G6/G7/G8 match play formats (比洞赛):
     * - G5 (individual_match): Individual 1v1 match results
     * - G6 (fourball_bestball_match): Team match results (四人四球最好成绩)
     * - G7 (fourball_scramble_match): Team match results (四人四球最佳球位/旺波)
     * - G8 (foursome_match): Team match results (四人两球)
     *
     * All match play formats require exactly 2 tags (teams).
     * Displays head-to-head match results with left vs right sides.
     *
     * Summary mode: When multiple groups exist and no group_id is provided,
     * returns aggregated team points + list of all matches.
     */
    private function handleHorizontalLayout($game_id, $group_id, $match_format, $game_type, $total_holes) {
        $layout = 'horizontal';

        // Match play summary mode: when multiple groups exist and no group_id is provided,
        // return aggregated points + matches list instead of erroring.
        if (!$group_id) {
            $summary = $this->MScoreboard->tryBuildMatchPlaySummaryData($game_id, $match_format, $game_type, $total_holes);
            if (isset($summary['error'])) {
                $this->respondError($summary['code'], $summary['error']);
                return;
            }
            if ($summary) {
                $data = array_merge([
                    'layout' => $layout,
                    'match_format' => $match_format,
                    'game_type' => $game_type
                ], $summary);
                $this->respondOk($data);
                return;
            }
        }

        $result = $this->MScoreboard->buildMatchPlayData($game_id, $group_id, $match_format, $game_type, $total_holes);
        if (isset($result['error'])) {
            $this->respondError($result['code'], $result['error']);
            return;
        }
        $data = array_merge([
            'layout' => $layout,
            'match_format' => $match_format,
            'game_type' => $game_type
        ], $result);
        $this->respondOk($data);
    }

    /**
     * Handle vertical layout (stroke play format)
     *
     * Handles G1/G2/G3/G4 stroke play formats (比杆赛):
     *
     * G1 (individual_stroke - 个人比杆赛):
     *   - tag_count = 1:  Returns individual player rankings only
     *   - tag_count >= 2: Returns team rankings + individual player rankings (combined structure)
     *
     * G2/G3/G4 (fourball/foursome stroke play):
     *   - G2 (fourball_bestball_stroke - 四人四球最好成绩比杆赛)
     *   - G3 (fourball_scramble_stroke - 四人四球最佳球位比杆赛/旺波)
     *   - G4 (foursome_stroke - 四人两球比杆赛)
     *
     *   Branching logic:
     *   - tag_count = 1:  Returns combo rankings (combo mode) - shows each group's combined score
     *   - tag_count >= 2: Returns team rankings (tag mode) - shows each team's aggregated score
     *
     * Displays ranked leaderboard with scores relative to par.
     */
    private function handleVerticalLayout($game_id, $game, $match_format, $game_type, $total_holes) {
        $layout = 'vertical';

        // G1 Branch Logic (个人比杆赛):
        // - If tag_count >= 2: tryBuildG1TeamPlayerData returns team + player combined structure
        // - If tag_count = 1:  tryBuildG1TeamPlayerData returns null, falls through to buildStrokePlayData
        if ($match_format === 'individual_stroke') {
            $combined = $this->MScoreboard->tryBuildG1TeamPlayerData($game_id, $game, $total_holes);
            if (isset($combined['error'])) {
                $this->respondError($combined['code'], $combined['error']);
                return;
            }
            if ($combined) {
                $data = array_merge([
                    'layout' => $layout,
                    'match_format' => $match_format,
                    'game_type' => $game_type
                ], $combined);
                $this->respondOk($data);
                return;
            }
        }

        // G1 (tag_count=1) / G2/G3/G4 (all tag counts):
        // buildStrokePlayData handles:
        // - G1 with tag_count=1: Returns individual player rankings
        // - G2/G3/G4 with tag_count=1: Returns combo rankings (combo mode)
        // - G2/G3/G4 with tag_count>=2: Returns team rankings (tag mode)
        $data = $this->MScoreboard->buildStrokePlayData($game_id, $match_format, $game_type, $total_holes);
        $data = array_merge([
            'layout' => $layout,
            'match_format' => $match_format,
            'game_type' => $game_type
        ], $data);
        $this->respondOk($data);
    }

    private function isMatchFormat($match_format) {
        if (!$match_format) {
            return false;
        }
        return strpos($match_format, '_match') !== false;
    }



    private function readJsonBody() {
        $payload = json_decode(file_get_contents('php://input'), true);
        return is_array($payload) ? $payload : [];
    }

    private function respondOk($data) {
        echo json_encode([
            'code' => 200,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
    }

    private function respondError($code, $message) {
        echo json_encode([
            'code' => $code,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }
}
