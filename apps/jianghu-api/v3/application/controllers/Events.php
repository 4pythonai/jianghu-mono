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
        $this->load->model('MDetailGame');
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
        $userid = $this->getUser();

        // 查询公开报名中的赛事ID列表
        // 条件：is_public_registration='y' 且用户未报名
        // registration_deadline 为 NULL 或 >= 今天的都显示
        $this->db->select('g.id, g.team_id, g.game_type')
            ->from('t_game g')
            ->where('g.is_public_registration', 'y')
            ->where_in('g.game_status', ['init', 'registering'])
            ->where_in('g.game_type', ['single_team', 'cross_teams'])
            ->group_start()
            ->where('g.registration_deadline IS NULL', null, false)
            ->or_where('g.registration_deadline >=', date('Y-m-d'))
            ->group_end()
            ->order_by('g.registration_deadline', 'ASC');

        // 排除用户已报名的比赛
        if ($userid) {
            $this->db->where("g.id NOT IN (SELECT game_id FROM t_game_tag_member WHERE user_id = {$userid})", null, false);
        }

        $gameRows = $this->db->get()->result_array();

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
        $userid = $this->getUser();

        if (!$userid) {
            $this->success(['events' => []]);
            return;
        }

        // 查询用户已报名的赛事ID列表（通过 t_game_tag_member）
        $gameRows = $this->db->select('DISTINCT(g.id) as id, g.team_id, g.game_type, g.game_status, g.open_time')
            ->from('t_game_tag_member gtm')
            ->join('t_game g', 'gtm.game_id = g.id', 'inner')
            ->where('gtm.user_id', $userid)
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

    /**
     * 记录围观（用户浏览比赛详情时调用）
     * POST /Events/addSpectator
     * @param int game_id 比赛ID
     */
    public function addSpectator() {
        $userid = $this->getUser();
        if (!$userid) {
            $this->error('请先登录');
            return;
        }

        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameId = isset($json_paras['game_id']) ? (int)$json_paras['game_id'] : 0;

        if (!$gameId) {
            $this->error('缺少比赛ID');
            return;
        }

        // 检查比赛是否存在
        $game = $this->db->select('id')
            ->from('t_game')
            ->where('id', $gameId)
            ->get()
            ->row_array();

        if (!$game) {
            $this->error('比赛不存在');
            return;
        }

        // 使用 INSERT IGNORE 避免重复记录
        $this->db->query(
            "INSERT IGNORE INTO t_game_spectator (game_id, user_id, created_at) VALUES (?, ?, NOW())",
            [$gameId, $userid]
        );

        $this->success([], '记录成功');
    }

    /**
     * 获取围观者列表（分页）
     * POST /Events/getSpectatorList
     * @param int game_id 比赛ID
     * @param int page 页码，默认1
     * @param int page_size 每页数量，默认20
     */
    public function getSpectatorList() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $gameId = isset($json_paras['game_id']) ? (int)$json_paras['game_id'] : 0;
        $page = isset($json_paras['page']) ? max(1, (int)$json_paras['page']) : 1;
        $pageSize = isset($json_paras['page_size']) ? min(50, max(1, (int)$json_paras['page_size'])) : 20;

        if (!$gameId) {
            $this->error('缺少比赛ID');
            return;
        }

        $webUrl = rtrim(config_item('web_url'), '/');
        $defaultAvatar = $webUrl . '/avatar/default-avatar.png';
        $offset = ($page - 1) * $pageSize;

        // 获取围观总人数
        $countResult = $this->db->select('COUNT(*) as total')
            ->from('t_game_spectator')
            ->where('game_id', $gameId)
            ->get()
            ->row_array();
        $total = (int)($countResult['total'] ?? 0);

        // 获取围观者列表
        $spectators = $this->db->select('gs.user_id, gs.created_at, u.nickname, u.avatar')
            ->from('t_game_spectator gs')
            ->join('t_user u', 'gs.user_id = u.id', 'left')
            ->where('gs.game_id', $gameId)
            ->order_by('gs.created_at', 'DESC')
            ->order_by('gs.user_id', 'DESC')  // 添加第二排序条件，确保排序稳定
            ->limit($pageSize, $offset)
            ->get()
            ->result_array();

        $list = [];
        foreach ($spectators as $spec) {
            $avatar = $spec['avatar'] ?? '';
            if (empty($avatar)) {
                $avatar = $defaultAvatar;
            } else if (strpos($avatar, 'http') !== 0) {
                $avatar = $webUrl . $avatar;
            }
            $list[] = [
                'user_id' => (int)$spec['user_id'],
                'nickname' => $spec['nickname'] ?? '用户',
                'avatar' => $avatar,
                'created_at' => $spec['created_at']
            ];
        }

        $this->success([
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
            'list' => $list
        ]);
    }
}
