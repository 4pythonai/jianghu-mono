<?php


ini_set('memory_limit', '-1');
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}


class Feed extends MY_Controller {
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
     * 统一的 Feed 接口
     * POST /Feed/myFeeds
     * @param string feed_type: my | public | registering | registered
     */
    public function myFeeds() {
        $json_paras = json_decode(file_get_contents('php://input'), true);
        $feed_type = $json_paras['feed_type'] ?? 'my';
        $userid = $this->getUser();

        $games = [];
        $extra = [];

        switch ($feed_type) {
            case 'my':
                $result = $this->getFeedsForMy($userid);
                $games = $result['games'];
                $extra['star_friends'] = $result['star_friends'];
                break;
            case 'public':
                $games = $this->getFeedsForPublic($userid);
                break;
            case 'registering':
                $games = $this->getFeedsForRegistering($userid);
                break;
            case 'registered':
                $games = $this->getFeedsForRegistered($userid);
                break;
            default:
                $result = $this->getFeedsForMy($userid);
                $games = $result['games'];
                $extra['star_friends'] = $result['star_friends'];
        }

        $ret = [
            'code' => 200,
            'games' => $games
        ];
        $ret = array_merge($ret, $extra);

        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
    }

    /**
     * 获取用户星标的比赛ID列表
     */
    private function getUserStarGameIds($userid) {
        if (!$userid) {
            return [];
        }
        $rows = $this->db->select('gameid')
            ->from('t_my_stared_games')
            ->where('userid', $userid)
            ->get()
            ->result_array();
        return array_map('intval', array_column($rows, 'gameid'));
    }

    /**
     * 我的赛事
     * 状态筛选: playing, finished
     */
    private function getFeedsForMy($userid) {
        $get_data_config = ['userid' => $userid];
        $result = $this->MGamePipeRunner->GameFeedHandler($get_data_config);
        $whitelist_gameids = $this->MPrivateWhiteList->getUserWhiteListGameIds($userid);
        $star_gameids = $this->getUserStarGameIds($userid);
        $allgames = $result['allgames'];

        $games = [];
        foreach ($allgames as $game) {
            $gameid = $game['id'];
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            // 处理隐私情况
            if (in_array((int)$gameid, $whitelist_gameids, true)) {
                $game_detail['private'] = 'n';
            }

            // 处理球队比赛情况 (队内赛或队际赛)
            if ($game_detail['game_type'] == 'single_team' || $game_detail['game_type'] == 'cross_teams') {
                $game_detail['extra_team_game_info'] = $this->getExtraTeamGameInfo($gameid, $game_detail['game_type'], $game['team_id'] ?? null);
            }

            // 添加星标状态
            $game_detail['if_star_game'] = in_array((int)$gameid, $star_gameids, true) ? 'y' : 'n';

            $games[] = $game_detail;
        }

        return [
            'games' => $games,
            'star_friends' => $result['star_friends']
        ];
    }

    /**
     * 广场赛事
     * 状态筛选: playing, finished
     * 包含: 关注的人的赛事 + 我的球队的赛事 + 系统推荐
     */
    private function getFeedsForPublic($userid) {
        // 未登录用户，返回所有比赛
        if (!$userid) {
            $this->db->select('DISTINCT(g.id) as id, g.team_id, g.game_type, g.create_time')
                ->from('t_game g')
                ->where_in('g.game_status', ['playing', 'finished'])
                ->order_by('g.create_time', 'DESC')
                ->limit(100);

            $gameRows = $this->db->get()->result_array();
            return $this->buildGameList($gameRows, $userid);
        }

        // 1. 查询我关注的人的ID列表
        $followingRows = $this->db->select('fuserid')
            ->from('t_follow')
            ->where('userid', $userid)
            ->get()
            ->result_array();
        $followingIds = array_column($followingRows, 'fuserid');

        // 2. 查询我加入的球队ID列表
        $teamRows = $this->db->select('team_id')
            ->from('t_team_member')
            ->where('user_id', $userid)
            ->where('status', 'active')
            ->get()
            ->result_array();
        $myTeamIds = array_column($teamRows, 'team_id');

        // 构建查询：关注的人的赛事 + 我的球队的赛事 + 系统推荐
        $this->db->select('DISTINCT(g.id) as id, g.team_id, g.game_type, g.create_time')
            ->from('t_game g')
            ->join('t_game_group_user ggu', 'g.id = ggu.gameid', 'left')
            ->where_in('g.game_status', ['playing', 'finished']);

        // 三个条件用 OR 连接
        $hasCondition = false;
        $this->db->group_start();

        // 条件1: 关注的人参与的赛事
        if (!empty($followingIds)) {
            $this->db->where_in('ggu.userid', $followingIds);
            $hasCondition = true;
        }

        // 条件2: 我的球队的赛事
        if (!empty($myTeamIds)) {
            if ($hasCondition) {
                $this->db->or_where_in('g.team_id', $myTeamIds);
            } else {
                $this->db->where_in('g.team_id', $myTeamIds);
                $hasCondition = true;
            }
        }

        // 条件3: 系统推荐
        if ($hasCondition) {
            $this->db->or_where('g.is_recommended', 'y');
        } else {
            $this->db->where('g.is_recommended', 'y');
        }

        $this->db->group_end();

        $this->db->order_by('g.create_time', 'DESC')
            ->limit(100);

        $gameRows = $this->db->get()->result_array();

        return $this->buildGameList($gameRows, $userid);
    }

    /**
     * 赛事招募 (报名中)
     * 
     * 包含：
     * - 所有的普通比赛（包含私密）
     * - 所有的队内赛（包含非公开报名）
     * - 所有的队际赛（包含非公开报名）
     * - 所有的系列赛
     * 
     * 状态筛选：registering（报名中）
     */
    private function getFeedsForRegistering($userid) {
        $star_gameids = $this->getUserStarGameIds($userid);

        $this->db->select('g.id, g.team_id, g.game_type, g.create_time')
            ->from('t_game g')
            ->where_in('g.game_status', ['registering'])
            ->order_by('g.create_time', 'DESC');

        $gameRows = $this->db->get()->result_array();

        $games = [];
        foreach ($gameRows as $row) {
            $gameid = $row['id'];
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            // 添加 extra_team_game_info
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

            // 添加星标状态
            $game_detail['if_star_game'] = in_array((int)$gameid, $star_gameids, true) ? 'y' : 'n';

            $games[] = $game_detail;
        }

        return $games;
    }

    /**
     * 已报名赛事
     * 状态筛选: 所有状态
     */
    private function getFeedsForRegistered($userid) {
        if (!$userid) {
            return [];
        }

        $star_gameids = $this->getUserStarGameIds($userid);

        // 查询用户已报名的赛事ID列表
        $gameRows = $this->db->select('DISTINCT(g.id) as id, g.team_id, g.game_type, g.game_status, g.open_time')
            ->from('t_game_tag_member gtm')
            ->join('t_game g', 'gtm.game_id = g.id', 'inner')
            ->where('gtm.user_id', $userid)
            ->order_by('g.open_time', 'DESC')
            ->get()
            ->result_array();

        $games = [];
        foreach ($gameRows as $row) {
            $gameid = $row['id'];
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            // 添加 extra_team_game_info
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

            // 添加星标状态
            $game_detail['if_star_game'] = in_array((int)$gameid, $star_gameids, true) ? 'y' : 'n';

            $games[] = $game_detail;
        }

        return $games;
    }

    /**
     * 构建游戏列表
     */
    private function buildGameList($gameRows, $userid = null) {
        $star_gameids = $this->getUserStarGameIds($userid);

        $games = [];
        foreach ($gameRows as $row) {
            $gameid = $row['id'];
            $game_detail = $this->MDetailGame->getGameDetail($gameid);
            if (!$game_detail) {
                continue;
            }

            if ($game_detail['game_type'] == 'single_team' || $game_detail['game_type'] == 'cross_teams') {
                $game_detail['extra_team_game_info'] = $this->getExtraTeamGameInfo($gameid, $game_detail['game_type'], $row['team_id'] ?? null);
            }

            // 添加星标状态
            $game_detail['if_star_game'] = in_array((int)$gameid, $star_gameids, true) ? 'y' : 'n';

            $games[] = $game_detail;
        }
        return $games;
    }

    /**
     * 获取球队比赛额外信息
     */
    private function getExtraTeamGameInfo($gameid, $gameType, $teamId) {

        if ($gameType == 'single_team') {
            $sql = "SELECT t_game.name as team_game_title, t_team.team_avatar
                    FROM t_game, t_team
                    WHERE t_game.team_id = t_team.id AND t_game.id = ?";
            $row = $this->db->query($sql, [$gameid])->row_array();

            $avatar = $row['team_avatar'] ?? '';

            return [
                'game_type' => 'single_team',
                'team_game_title' => $row['team_game_title'] ?? '',
                'team_avatar' => $avatar
            ];
        } else if ($gameType == 'cross_teams') {
            $game = $this->db->select('name')->from('t_game')->where('id', $gameid)->get()->row_array();
            $teamIds = $teamId ? array_filter(array_map('trim', explode(',', $teamId))) : [];

            $teams = [];
            if (!empty($teamIds)) {
                $teamRows = $this->db->select('team_name, team_avatar')
                    ->from('t_team')
                    ->where_in('id', $teamIds)
                    ->get()
                    ->result_array();

                foreach ($teamRows as $team) {
                    $avatar = $team['team_avatar'] ?? '';
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
     * 获取赛事封面信息
     */
    private function getEventItemCover($gameId, $gameType, $teamId = null) {
        $defaultCover =  '/events/event-cover-default.png';

        if ($gameType === 'common' || empty($teamId)) {
            return [
                'type' => 'default',
                'covers' => [$defaultCover]
            ];
        }

        if ($gameType === 'single_team') {
            $team = $this->db->select('team_avatar')
                ->from('t_team')
                ->where('id', $teamId)
                ->get()
                ->row_array();

            if ($team && !empty($team['team_avatar'])) {
                $avatar = $team['team_avatar'];
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
     * 获取报名状态
     */
    private function getRegistrationStatus($gameStatus) {
        switch ($gameStatus) {
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
