
<?php

class MDetailGame  extends CI_Model {

    public function __construct() {
        parent::__construct();
    }


    public function get_detail_game($game_id) {
        // 获取游戏基本信息
        $game_info = $this->getGameInfo($game_id);
        if (!$game_info) {
            return null;
        }


        // 获取球场信息（根据 courseid）
        $course_info = $this->getCourseInfo($game_info['courseid']);

        // 获取游戏统计信息
        $game_stats = $this->getGameStats($game_id);


        // 获取玩家信息
        $players = $this->getPlayers($game_id);

        // 获取球洞列表
        $holeList = $this->getHoleListByGameId($game_id);


        // 获取游戏分组信息
        $groups = $this->getGroupsInfo($game_id);

        // 成绩 
        $scores = $this->getScoreInfo($game_id);

        // 创建者信息
        $creator = $this->MUser->getUserProfile($game_info['creatorid']);

        // 组装返回数据
        $result = [
            'game_id' => (string)$game_info['game_id'],
            'uuid' => $game_info['uuid'],
            'private' => $game_info['private'],
            'scoring_type' => $game_info['scoring_type'],
            'privacy_password' => $game_info['privacy_password'],
            'creatorid' => $game_info['creatorid'],
            'creator' => $creator,
            'game_name' => $game_info['game_name'] ?: '',
            'course' => $course_info['coursename'] ?: '',
            'status' => $game_info['status'],
            'players' => $players,
            'watchers_number' => 0, // 暂时设为0
            'game_start' => $game_info['game_start'] ?: $game_info['create_time'],
            'completed_holes' => $game_stats['completed_holes'],
            'holes' => $game_stats['total_holes'],
            'courseinfo' => [
                'courseid' => $course_info['courseid'],
                'coursename' => $course_info['coursename'],
                'lat' => $course_info['lat'],
                'lgt' => $course_info['lgt']
            ],
            'holeList' => $holeList,
            'scores' => $scores,
            'groups' => $groups,
        ];

        return $result;
    }


    public function getScoreInfo($game_id) {
        $score_query = "
            SELECT * FROM t_game_score WHERE gameid = ?
        ";
        $score_result = $this->db->query($score_query, [$game_id]);
        $scores = $score_result->result_array();
        $fixedd = [];
        foreach ($scores as $score) {
            $fixedd[] = [
                'userid' => $score['user_id'],
                'holeid' => $score['hole_id'],
                'score' => intval($score['score']),
                'putts' => intval($score['putts']),
                'penalty_strokes' => intval($score['penalty_strokes']),
                'sand_save' => intval($score['sand_save'])
            ];
        }
        return $fixedd;
    }

    /**
     * 获取游戏基本信息
     * @param int $game_id 游戏ID
     * @return array|null 游戏信息，不存在返回null
     */
    public function getGameInfo($game_id) {
        $game_query = "
            SELECT 
                id as game_id,
                uuid,
                courseid,
                status,
                private,
                scoring_type,
                scoring_type,
                privacy_password,
                creatorid,
                name as game_name,
                open_time as game_start,
                create_time
            FROM t_game
            WHERE id = ?
        ";

        $game_result = $this->db->query($game_query, [$game_id]);

        if ($game_result->num_rows() == 0) {
            return null;
        }

        return $game_result->row_array();
    }

    /**
     * 获取球场信息
     * @param int $courseid 球场ID
     * @return array 球场信息
     */
    public function getCourseInfo($courseid) {
        $course_query = "
            SELECT 
                courseid,
                name as coursename,
                lat,
                lng as lgt,
                avatar,
                courtnum,
                totalPar,
                totalYard
            FROM t_course 
            WHERE courseid = $courseid  ";


        $course_result = $this->db->query($course_query);
        $course = $course_result->row_array();
        return $course;
    }

    /**
     * 获取游戏统计信息
     * @param int $game_id 游戏ID
     * @return array 游戏统计信息
     */
    public function getGameStats($game_id) {
        // 计算已完成洞数 - 只有当某个洞所有玩家都记分时才算完成
        $completed_holes_query = "
            SELECT MAX(hole_id) as max_completed_hole
            FROM (
                SELECT hole_id
                FROM t_game_score gs
                WHERE gs.gameid = ? AND gs.score IS NOT NULL
                GROUP BY hole_id
                HAVING COUNT(*) = (
                    SELECT COUNT(*) 
                    FROM t_game_group_user ggu 
                    WHERE ggu.gameid = ? AND ggu.confirmed = 1
                )
            ) completed_holes_subquery
        ";

        $completed_result = $this->db->query($completed_holes_query, [$game_id, $game_id]);
        $completed_holes = 0;

        if ($completed_result->num_rows() > 0) {
            $completed_row = $completed_result->row_array();
            $completed_holes = (int)$completed_row['max_completed_hole'] ?: 0;
        }

        // 计算总洞数：根据游戏使用的半场数量
        $courts_query = "
            SELECT COUNT(*) as court_count
            FROM t_game_court 
            WHERE gameid = ?
        ";

        $courts_result = $this->db->query($courts_query, [$game_id]);
        $court_count = 0;

        if ($courts_result->num_rows() > 0) {
            $courts_row = $courts_result->row_array();
            $court_count = (int)$courts_row['court_count'];
        }

        // 1个半场=9洞，2个半场=18洞
        $total_holes = $court_count == 1 ? 9 : 18;

        return [
            'completed_holes' => $completed_holes,
            'total_holes' => $total_holes,
            'court_count' => $court_count
        ];
    }



    /**
     * 获取玩家列表
     * @param int $game_id 游戏ID
     * @return array 玩家列表
     */
    public function getPlayers($game_id) {
        $web_url = config_item('web_url');
        $players_query = "
            SELECT 
                ggu.groupid,
                ggu.tee,
                u.id as user_id,
                u.wx_nickname as wx_nickname,
                concat('$web_url', u.avatar) as avatar
            FROM t_game_group_user ggu
            LEFT JOIN t_user u ON ggu.userid = u.id
            WHERE ggu.gameid = ? 
            ORDER BY ggu.addtime ASC ";

        $players_result = $this->db->query($players_query, [$game_id])->result_array();
        return $players_result;
    }

    /**
     * 根据游戏ID获取球洞列表
     * @param int $gameid 游戏ID
     * @return array 球洞列表
     */
    public function getHoleListByGameId($gameid) {
        $holeList = [];

        // 获取游戏使用的半场，按 court_key 排序
        $courts_query = "
            SELECT courtid, court_key
            FROM t_game_court 
            WHERE gameid = ?
            ORDER BY court_key ASC
        ";

        $courts_result = $this->db->query($courts_query, [$gameid]);
        $hindex = 1;

        foreach ($courts_result->result_array() as $court) {
            $courtid = $court['courtid'];
            $court_key = $court['court_key'];

            // 获取该半场的所有球洞信息
            $holes_query = "
                    SELECT 
                        holeid,
                        holeno ,
                        holename,
                        par,
                        black,
                        gold,
                        blue,
                        white,
                        red,
                        Tnum,
                        diffindex
                    FROM t_court_hole
                    WHERE courtid = ?
                    ORDER BY holeid 
                ";

            $holes_result = $this->db->query($holes_query, [$courtid]);

            foreach ($holes_result->result_array() as $hole) {
                $holeList[] = [
                    'unique_key' => $court_key . '_' . $hole['holeid'],
                    'court_key' => $court_key,
                    'holeid' => (int)$hole['holeid'],
                    'holeno' => (int)$hole['holeno'],
                    'hindex' => $hindex,
                    'holename' => $hole['holename'] ?: '',
                    'par' => (int)$hole['par'],
                    'black' => (int)$hole['black'],
                    'gold' => (int)$hole['gold'],
                    'blue' => (int)$hole['blue'],
                    'white' => (int)$hole['white'],
                    'red' => (int)$hole['red'],
                    'Tnum' => (int)$hole['Tnum'],
                    'diffindex' => (int)$hole['diffindex']
                ];
                $hindex++;
            }
        }

        return $holeList;
    }

    /**
     * 获取游戏分组信息
     * @param int $gameid 游戏ID
     * @return array 分组信息列表
     */
    public function getGroupsInfo($gameid) {
        $groups = [];

        // 获取游戏的所有分组
        $groups_query = "
            SELECT 
                gg.groupid ,
                gg.group_name,
                gg.group_create_time
            FROM t_game_group gg
            WHERE gg.gameid = ?
            ORDER BY gg.groupid ASC
        ";

        $groups_result = $this->db->query($groups_query, [$gameid]);

        foreach ($groups_result->result_array() as $group) {
            // 获取该分组下的所有用户
            $users_query = "
                SELECT 
                    ggu.userid,
                    ggu.confirmed,
                    ggu.addtime,
                    u.wx_nickname,
                    u.avatar as avatar
                FROM t_game_group_user ggu
                LEFT JOIN t_user u ON ggu.userid = u.id
                WHERE ggu.gameid = ? AND ggu.groupid = ?
                ORDER BY ggu.addtime ASC
            ";

            $users_result = $this->db->query($users_query, [$gameid, $group['groupid']]);
            $users = [];

            foreach ($users_result->result_array() as $user) {
                $users[] = [
                    'userid' => (int)$user['userid'],
                    'nickname' => $user['wx_nickname'] ?: '',
                    'avatar' => config_item('web_url') . $user['avatar'] ?: '',
                    'confirmed' => (int)$user['confirmed'],
                    'addtime' => $user['addtime']
                ];
            }

            $groups[] = [
                'groupid' => (int)$group['groupid'],
                'group_name' => $group['group_name'] ?: '',
                'group_create_time' => $group['group_create_time'],
                'users' => $users,
                'user_count' => count($users)
            ];
        }

        return $groups;
    }
}
