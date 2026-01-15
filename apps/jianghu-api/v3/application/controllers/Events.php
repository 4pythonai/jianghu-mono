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
     * 获取赛事轮播图
     * POST /Events/getEventBanners
     */
    public function getEventBanners() {

        $banners = [
            [
                'id' => 1,
                'image' => '/events/event-1.webp',
                'title' => '赛事banner1'
            ],
            [
                'id' => 2,
                'image' =>  '/events/2.jpeg',
                'title' => '赛事banner2'
            ],
            [
                'id' => 3,
                'image' =>   '/events/3.webp',
                'title' => '赛事banner3'
            ]
        ];

        $this->success(['banners' => $banners]);
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

        $defaultAvatar = '/avatar/default-avatar.png';
        $offset = ($page - 1) * $pageSize;

        // 获取围观总人数
        $countResult = $this->db->select('COUNT(*) as total')
            ->from('t_game_spectator')
            ->where('game_id', $gameId)
            ->get()
            ->row_array();
        $total = (int)($countResult['total'] ?? 0);

        // 获取围观者列表
        $spectators = $this->db->select('gs.user_id, gs.created_at, u.display_name, u.wx_name, u.avatar')
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
                'display_name' => !empty($spec['display_name']) ? $spec['display_name'] : ($spec['wx_name'] ?? '用户'),
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
