<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Events extends MY_Controller {
    public function __construct() {
        parent::__construct();
        header('Access-Control-Allow-Origin: * ');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
        header('Access-Control-Allow-Credentials', true);
        if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
            exit();
        }
    }

    /**
     * 返回成功响应
     */
    private function success($data = [], $message = '操作成功') {
        echo json_encode(array_merge([
            'code' => 200,
            'message' => $message
        ], $data), JSON_UNESCAPED_UNICODE);
    }

    /**
     * 返回错误响应
     */
    private function error($message, $code = 400) {
        echo json_encode([
            'code' => $code,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * 检查是否是球局创建者
     */
    private function isGameCreator($gameid, $userid) {
        $game = $this->db->select('creatorid')->from('t_game')->where('id', $gameid)->get()->row_array();
        return $game && (int)$game['creatorid'] === (int)$userid;
    }

    /**
     * 获取赛事封面信息
     * 队内赛: 返回单个球队logo
     * 队际赛: 返回多个球队logo数组
     * 普通赛: 返回默认封面
     *
     * @param int $gameId 赛事ID
     * @param string $gameType 赛事类型
     * @param string|null $teamId 球队ID（队内赛单个，队际赛逗号分隔）
     * @return array ['type' => 'single|multiple|default', 'covers' => [...]]
     */
    private function getEventItemCover($gameId, $gameType, $teamId = null) {
        $webUrl = rtrim(config_item('web_url'), '/');
        $defaultCover = $webUrl . '/events/event-cover-default.png';

        // 普通比赛使用默认封面
        if ($gameType === 'common' || empty($teamId)) {
            return [
                'type' => 'default',
                'covers' => [$defaultCover]
            ];
        }

        // 队内赛 - 单个球队logo
        if ($gameType === 'single_team') {
            $team = $this->db->select('team_avatar')
                ->from('t_team')
                ->where('id', $teamId)
                ->get()
                ->row_array();

            if ($team && !empty($team['team_avatar'])) {
                $avatar = $team['team_avatar'];
                // 处理相对路径
                if (strpos($avatar, 'http') !== 0) {
                    $avatar = $webUrl . $avatar;
                }
                return [
                    'type' => 'single',
                    'covers' => [$avatar]
                ];
            }
            return [
                'type' => 'default',
                'covers' => [$defaultCover]
            ];
        }

        // 队际赛 - 多个球队logo
        if ($gameType === 'cross_teams') {
            $teamIds = array_filter(array_map('trim', explode(',', $teamId)));

            if (empty($teamIds)) {
                return [
                    'type' => 'default',
                    'covers' => [$defaultCover]
                ];
            }

            $teams = $this->db->select('id, team_avatar')
                ->from('t_team')
                ->where_in('id', $teamIds)
                ->get()
                ->result_array();

            $covers = [];
            foreach ($teams as $team) {
                if (!empty($team['team_avatar'])) {
                    $avatar = $team['team_avatar'];
                    if (strpos($avatar, 'http') !== 0) {
                        $avatar = $webUrl . $avatar;
                    }
                    $covers[] = $avatar;
                }
            }

            if (!empty($covers)) {
                return [
                    'type' => 'multiple',
                    'covers' => $covers
                ];
            }
            return [
                'type' => 'default',
                'covers' => [$defaultCover]
            ];
        }

        return [
            'type' => 'default',
            'covers' => [$defaultCover]
        ];
    }


    /**
     * 获取赛事轮播图
     * POST /Events/getEventBanners
     */
    public function getEventBanners() {
        $webUrl = rtrim(config_item('web_url'), '/');

        $banners = [
            [
                'id' => 1,
                'image' => $webUrl . '/events/event-1.png',
                'title' => '赛事banner1'
            ],
            [
                'id' => 2,
                'image' => $webUrl . '/events/event-2.png',
                'title' => '赛事banner2'
            ],
            [
                'id' => 3,
                'image' => $webUrl . '/events/event-3.png',
                'title' => '赛事banner3'
            ]
        ];

        $this->success(['banners' => $banners]);
    }

    /**
     * 获取可报名赛事列表
     * POST /Events/getAvailableEvents
     * 返回结构与 Feed/myFeeds 对齐
     */
    public function getAvailableEvents() {
        // 查询公开报名中的赛事ID列表
        $gameRows = $this->db->select('g.id, g.team_id, g.game_type')
            ->from('t_game g')
            ->where('g.is_public_registration', 'y')
            ->where_in('g.game_status', ['init', 'registering'])
            ->where('g.open_time >=', date('Y-m-d'))
            ->order_by('g.open_time', 'ASC')
            ->get()
            ->result_array();

        $events = [];
        foreach ($gameRows as $row) {
            $gameid = $row['id'];

            // 使用 MDetailGame 获取完整游戏详情（与 Feed/myFeeds 一致）
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            // 添加 extra_team_game_info（与 Feed/myFeeds 一致）
            if ($row['game_type'] == 'single_team' || $row['game_type'] == 'cross_teams') {
                $game_detail['extra_team_game_info'] = $this->getExtraTeamGameInfo($gameid, $row['game_type'], $row['team_id']);
            }

            // 添加封面信息
            $coverInfo = $this->getEventItemCover($gameid, $row['game_type'], $row['team_id']);
            $game_detail['coverType'] = $coverInfo['type'];
            $game_detail['covers'] = $coverInfo['covers'];

            // 添加报名状态
            $game_detail['registration_status'] = 'open';
            $game_detail['registration_status_text'] = '报名中';

            $events[] = $game_detail;
        }

        $this->success(['events' => $events]);
    }

    /**
     * 获取已报名赛事列表
     * POST /Events/getMyEvents
     * 返回结构与 Feed/myFeeds 对齐
     */
    public function getMyEvents() {
        $userid = $this->userid;

        if (!$userid) {
            $this->success(['events' => []]);
            return;
        }

        // 查询用户已加入的赛事ID列表
        $gameRows = $this->db->select('DISTINCT(g.id) as id, g.team_id, g.game_type, g.game_status')
            ->from('t_game_group_user ggu')
            ->join('t_game g', 'ggu.gameid = g.id', 'inner')
            ->where('ggu.userid', $userid)
            ->order_by('g.open_time', 'DESC')
            ->get()
            ->result_array();

        $events = [];
        foreach ($gameRows as $row) {
            $gameid = $row['id'];

            // 使用 MDetailGame 获取完整游戏详情（与 Feed/myFeeds 一致）
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            // 添加 extra_team_game_info（与 Feed/myFeeds 一致）
            if ($row['game_type'] == 'single_team' || $row['game_type'] == 'cross_teams') {
                $game_detail['extra_team_game_info'] = $this->getExtraTeamGameInfo($gameid, $row['game_type'], $row['team_id']);
            }

            // 添加封面信息
            $coverInfo = $this->getEventItemCover($gameid, $row['game_type'], $row['team_id']);
            $game_detail['coverType'] = $coverInfo['type'];
            $game_detail['covers'] = $coverInfo['covers'];

            // 添加报名状态
            $game_detail['registration_status'] = $this->getRegistrationStatus($row['game_status']);
            $game_detail['registration_status_text'] = $this->getRegistrationStatusText($row['game_status']);

            $events[] = $game_detail;
        }

        $this->success(['events' => $events]);
    }

    /**
     * 获取球队比赛额外信息（与 Feed/myFeeds 一致）
     */
    private function getExtraTeamGameInfo($gameid, $gameType, $teamId) {
        $webUrl = rtrim(config_item('web_url'), '/');

        if ($gameType == 'single_team') {
            // 队内赛：获取单个球队信息
            $sql = "SELECT t_game.name as team_game_title, t_team.team_avatar
                    FROM t_game, t_team
                    WHERE t_game.team_id = t_team.id AND t_game.id = ?";
            $row = $this->db->query($sql, [$gameid])->row_array();

            $avatar = $row['team_avatar'] ?? '';
            if ($avatar && strpos($avatar, 'http') !== 0) {
                $avatar = $webUrl . $avatar;
            }

            return [
                'game_type' => 'single_team',
                'team_game_title' => $row['team_game_title'] ?? '',
                'team_avatar' => $avatar
            ];
        } else if ($gameType == 'cross_teams') {
            // 队际赛：获取多个球队信息
            $game = $this->db->select('name')->from('t_game')->where('id', $gameid)->get()->row_array();
            $teamIds = array_filter(array_map('trim', explode(',', $teamId)));

            $teams = [];
            if (!empty($teamIds)) {
                $teamRows = $this->db->select('team_name, team_avatar')
                    ->from('t_team')
                    ->where_in('id', $teamIds)
                    ->get()
                    ->result_array();

                foreach ($teamRows as $team) {
                    $avatar = $team['team_avatar'] ?? '';
                    if ($avatar && strpos($avatar, 'http') !== 0) {
                        $avatar = $webUrl . $avatar;
                    }
                    $teams[] = [
                        'team_name' => $team['team_name'],
                        'team_avatar' => $avatar
                    ];
                }
            }

            return [
                'game_type' => 'cross_teams',
                'team_game_title' => $game['name'] ?? '',
                'teams' => $teams
            ];
        }

        return null;
    }

    /**
     * 获取报名状态
     */
    private function getRegistrationStatus($gameStatus) {
        switch ($gameStatus) {
            case 'init':
            case 'registering':
                return 'registered';
            case 'playing':
                return 'playing';
            case 'finished':
                return 'finished';
            default:
                return 'registered';
        }
    }

    /**
     * 获取报名状态文本
     */
    private function getRegistrationStatusText($gameStatus) {
        switch ($gameStatus) {
            case 'init':
            case 'registering':
                return '已报名';
            case 'playing':
                return '进行中';
            case 'finished':
                return '已结束';
            default:
                return '已报名';
        }
    }
}
