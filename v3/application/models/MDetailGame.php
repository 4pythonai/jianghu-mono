
<?php

class MDetailGame  extends CI_Model {

    public function __construct() {
        parent::__construct();
    }


    public function get_detail_game($game_id) {
        // 获取游戏基本信息
        $game_query = "
            SELECT 
                g.id as game_id,
                g.name as game_name,
                g.open_time as game_start,
                g.create_time,
                c.name as course_name
            FROM t_game g
            LEFT JOIN t_course c ON g.courseid = c.courseid
            WHERE g.id = ?
        ";

        $game_result = $this->db->query($game_query, [$game_id]);

        if ($game_result->num_rows() == 0) {
            return null;
        }

        $game_info = $game_result->row_array();

        // 获取游戏玩家信息
        $players_query = "
            SELECT 
                u.id as user_id,
                u.coverpath as avatar
            FROM t_game_group_user ggu
            LEFT JOIN t_user u ON ggu.userid = u.id
            WHERE ggu.gameid = ? 
            ORDER BY ggu.addtime ASC
        ";

        $players_result = $this->db->query($players_query, [$game_id]);
        $players = [];

        foreach ($players_result->result_array() as $player) {
            $players[] = [
                'user' => (int)$player['user_id'],
                'avatar' => config_item('web_url') . $player['avatar'] ?: ''
            ];
        }

        // 计算已完成洞数 - 只有当某个洞所有玩家都记分时才算完成
        $completed_holes_query = "
            SELECT MAX(hole_id) as max_completed_hole
            FROM (
                SELECT hole_id
                FROM t_game_score gs
                WHERE gs.game_id = ? AND gs.score IS NOT NULL
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

        // 组装返回数据
        $result = [
            'game_id' => (string)$game_info['game_id'],
            'game_name' => $game_info['game_name'] ?: '',
            'course' => $game_info['course_name'] ?: '',
            'players' => $players,
            'watchers_number' => 0, // 暂时设为0
            'game_start' => $game_info['game_start'] ?: $game_info['create_time'],
            'completed_holes' => $completed_holes,
            'holes' => $total_holes
        ];

        return $result;
    }
}
