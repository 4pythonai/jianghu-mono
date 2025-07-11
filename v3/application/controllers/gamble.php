<?php


//游戏结构控制器.
/*
2_fixed
3_random,
3_fixed
3_skin
4_follow
4_skin
4_3vs1
4_fixed,
4_random,
4_ab
*/



// include_once 'base.php';
include_once 'gamefuncs.php';


error_reporting(0);
// error_reporting(E_ALL);

function terminate_missing_variables($errno, $errstr, $errfile, $errline) {
    if (strstr($errfile, "CodeIgniter.php")) {
        return false;
    }

    if (strstr($errfile, "funcs.php")) {
        return false;
    }


    if (strstr($errfile, "XGame.php")) {
        return false;
    }

    $trace = '';

    $callers = debug_backtrace();
    foreach ($callers as $call) {
        $trace = $trace . "<br>" . $call['class'] . '->' . $call['function'];
    }

    logtext($trace);
    logtext("terminate_missing_variables" . "$errstr in $errfile line $errline");
    return false; // Let the PHP error handler handle all the rest  
}

$old_error_handler = set_error_handler("terminate_missing_variables");



class Gamble extends CI_Controller {

    private $kpi_types; //所有的项目类型.
    private $group_type; //所有分组类型.


    public function __construct() {
        error_reporting(0);
        // error_reporting(E_ALL);

        parent::__construct();
        $this->kpi_types = array(
            'kpi_best', //最好成绩
            'kpi_best_ak', //kpi_best变种,比A比K, 如果双方最好成绩打平,则比较第二名.
            'kpi_worst', //最差成绩
            'kpi_total_add', //加法总和
            'kpi_total_plus', //乘法总和
            'kpi_case_8421', //8421
            'kpi_gross' //2人比杆
        );

        //division_type   
        $this->division_type = array(
            '2_fixed', //2人,自然分边
            '3_random', //3人乱拉 1vs2 ,第1名为单独一组
            '3_fixed', //3人固拉 1vs2 ,第2名为单独一组
            '3_skin', //3人skin,各自为战
            '4_random', //4人乱拉 2vs2,(1,4)vs(2,3)
            '4_fixed', //4人固拉 2vs2.固定分组.
            '4_skin', //4人skin,各自为战
            '4_3vs1', //4人,固定3打1
            '4_ab'
        ); //4人ab分组. 2vs2(a组两人永远不在同一边)
    }



    public function server_type() {

        $server_type = $_SERVER['SERVER_ADDR'] == '123.57.223.35' ? 'run' : 'test';
        return $server_type;
    }



    function game_9_or_18($groupid) {
        $sql  = "select * from  t_game_court where  gameid in ( select gameid from   t_game_group  where groupid=$groupid)";
        $rows = $this->db->query($sql)->result_array();
        if (count($rows) == 1) {
            return 9;
        } else {
            return 18;
        }
    }






    public function getgamecourt($gameid) {

        $sql = " select id from t_game_court   where  gameid=$gameid";
        $rows = $this->db->query($sql)->result_array();
        if (count($rows) == 2) {
            return 18;
        } else {
            return 9;
        }
    }



    public function pre_addgamble($para) {

        $data   = array();

        //是否有让杆
        if (
            (array_key_exists('weaker', $para)) &&
            (intval($para['weaker']) > 0)
        ) {
            $data['weaker']        = $para['weaker'];
            $data['weak_par3_num'] = doubleval($para['weak_par3_num']);
            $data['weak_par4_num'] = doubleval($para['weak_par4_num']);
            $data['weak_par5_num'] = doubleval($para['weak_par5_num']);
            $data['total_weak_num'] = doubleval($para['total_weak_num']);
        }


        if (array_key_exists('batchid', $para)) {
            $data['batchid'] = $para['batchid'];
        }

        //是否设置了固定的地主 ZZZ?
        if (array_key_exists('fixed_dizhu', $para)) {
            $data['fixed_dizhu'] = $para['fixed_dizhu'];
        }


        //是否设置了地主婆 
        if (array_key_exists('follower', $para)) {
            if (intval($para['follower']) > 0) {
                $data['follower'] = $para['follower'];
            } else {
                $data['follower'] = null;
            }
        }


        //是否设置了捐锅 
        if (array_key_exists('juanguo_type', $para)) {
            $data['juanguo_point'] = $para['juanguo_point'];
            $data['juanguo_type']  = $para['juanguo_type'];
        }

        //是否设置了起始洞
        //getgamecourt

        if (array_key_exists('firstHoleindex', $para)) {
            if (intval($para['firstHoleindex']) > 0) {
                $data['firstHoleindex'] = $para['firstHoleindex'];
            }
        } else {
            $data['firstHoleindex'] = 1;
        }


        //是否设置了终止洞

        if (array_key_exists('lastholeindex', $para)) {
            if (intval($para['lastholeindex']) > 0) {
                $data['lastholeindex'] = $para['lastholeindex'];
            }
        } else {
            $x_9_or_18 = $this->getgamecourt($para['gameid']);
            $data['lastholeindex'] = $x_9_or_18;
        }



        //是否设置了分组方式

        if (array_key_exists('div_option', $para)) {
            if (strlen($para['div_option']) > 3) {
                $data['div_option'] = $para['div_option'];
            }
        }

        //是否设置了基本单位

        if (array_key_exists('unit', $para)) {
            if (intval($para['unit']) > 0) {
                $data['unit'] = $para['unit'];
            } else {
                $data['unit'] = 1;
            }
        }

        //是否设置了showif
        if (array_key_exists('showif', $para)) {
            $data['showif'] = intval($para['showif']);
        }

        //是否设置了权重


        if (array_key_exists('weight_cfg', $para)) {
            if (intval($para['weight_cfg']) > 0) {
                $data['weight_cfg'] = $para['weight_cfg'];
            }
        } else {
            $data['weight_cfg'] = null;
        }

        if (array_key_exists('value_8421', $para)) {
            if (strlen($para['value_8421']) > 0) {
                $data['value_8421'] = $para['value_8421'];
            }
        } else {
            $data['value_8421'] = null;
        }


        if (array_key_exists('gamblecfg', $para)) {
            $data['gamblecfg'] = $para['gamblecfg'];
        }


        $rulesource = $para['rulesource'];
        $ruleid     = $para['ruleid'];
        $data['gamblecreator'] = $para['agent_userid'];
        $data['ruleid']        = $ruleid;
        $data['rulesource']    = $rulesource;

        if (array_key_exists('agroup', $para)) {
            $data['agroup']        = $para['agroup'];
        } else {
            $data['agroup']        = '';
        }

        if (array_key_exists('bgroup', $para)) {
            $data['bgroup']        = $para['bgroup'];
        } else {
            $data['bgroup']        = '';
        }



        $data['gameid']        = $para['gameid'];
        $data['groupid']       = $para['groupid'];
        $data['addtime']       = date('Y-m-d H:i:s');
        $data['playernum']     = $para['playernum'];
        $data['players']       = $para['players'];
        $data['ename']       =   $para['ename'];

        if (array_key_exists('initorder', $para)) {
            $data['initorder']        = $para['initorder'];
            //rtrim
            $data['initorder']        = rtrim($para['initorder'], ',');
        } else {
            $data['initorder']        = '';
        }

        return $data;
    }


    //V14 添加游戏
    public function addgamble() {

        $this->load->library('XUsers');
        $mgr_user  = $this->xusers;
        $must_have = array(
            'ruleid',
            'rulesource',
            'gameid',
            'groupid'
        );

        $para   = check_args($must_have);
        $userid = intval($para['agent_userid']);
        if ($userid > 0) {
            logtext("beforeer_jurisdiction ");
            $user_jurisdictions = $mgr_user->get_user_jurisdiction($userid);
            logtext("after_jurisdiction ");
            if ($user_jurisdictions['basic_package_jurisdiction'] == 0 && $user_jurisdictions['golf_bill'] == 0) {
                $ret['error_code']  = -1;
                $ret['error_descr'] = '您没有开通此功能，是否去开通';
                $this->output->json_output($ret);
            }
        }

        // $keys=array_keys($para);
        // debug($keys);die;

        $gbcfg = (array)json_decode($para['gamblecfg']);
        $para['ename'] = $gbcfg['ename'];
        $data = $this->pre_addgamble($para);

        $this->db->insert('t_gamble_game_alpha', $data);
        $gamble_id = $this->db->insert_id();
        $ruleid = $data['ruleid'];

        if ($data['rulesource'] == 'user') {
            $sql = "select * from  t_gamble_rule_user_alpha where userruleid=$ruleid";
        } else {
            $sql = "select * from  t_gamble_rule_alpha where sysruleid=$ruleid";
        }

        $gamblecfg                      = $this->db->query($sql)->row_array();
        $gameid = intval($para['gameid']);
        $this->db->where('gameid', $gameid);
        $this->db->update('t_game', array('is_have_gamble' => 1));
        $ret = [];
        $ret['error_code']              = 1;
        $ret['error_descr']             = 'success';
        $data['gambleid']               = $gamble_id;
        $ret['gambleinfo']              = $data;
        $ret['gambleinfo']['gamblecfg'] = $gamblecfg;
        $this->output->json_output($ret);
    }


    /**批量添加两人比杆比洞游戏*/
    public function batchadd() {


        $post_from_app = $_POST;
        $server   = check_args();
        $datetime = new DateTime();
        $batchid = $datetime->getTimestamp();
        $baseunit = $post_from_app['baseunit'];


        //如果有batchid,语义为修改.先删除对应的批量游戏.
        if (isset($post_from_app['batchid'])) {

            $batchid = trim($post_from_app['batchid']);
            if (strlen($batchid) > 3) {
                $this->db->where('batchid', $batchid);
                $this->db->delete('t_gamble_game_alpha');
            }
        }

        $agent_userid = $server['agent_userid'];
        $tmp_gambles = $post_from_app['gambles'];
        $tmp_arr =  (array) json_decode($tmp_gambles);




        $new_gambles = array();

        foreach ($tmp_arr as  $one_gamble) {
            $one_gamble = (array)$one_gamble;
            $gamblecfg_str = $one_gamble['gamblecfg'];
            $tmp_cfg = (json_encode($gamblecfg_str));
            $gamblecfg = (array)$one_gamble['gamblecfg'];
            $tmp = array();
            $tmp['agent_userid'] = $agent_userid;
            $tmp['gameid'] = $one_gamble['gameid'];
            $tmp['groupid'] = $one_gamble['groupid'];
            $tmp['players'] = $one_gamble['players'];
            $gameid = intval($one_gamble['gameid']);


            if (array_key_exists('userruleid', $gamblecfg)) {

                if (intval($gamblecfg['userruleid']) > 0) {
                    $tmp['rulesource'] = 'user';
                    $tmp['ruleid'] = $gamblecfg['userruleid'];
                } else {
                    $tmp['rulesource'] = 'sys';
                    $tmp['ruleid'] = $one_gamble['ruleid'];
                }
            } else {
                $tmp['rulesource'] = 'sys';
                $tmp['ruleid'] = $one_gamble['ruleid'];
            }


            if (array_key_exists('firstHoleindex', $one_gamble)) {
                $tmp['firstHoleindex'] = $one_gamble['firstHoleindex'];
            } else {
                $tmp['firstHoleindex'] = 1;
            }

            if (array_key_exists('lastholeindex', $one_gamble)) {
                $tmp['lastholeindex'] = $one_gamble['lastholeindex'];
            } else {
                $tmp['lastholeindex'] = $this->game_9_or_18($one_gamble['groupid']);
            }



            $tmp['div_option'] = $gamblecfg['current_div_option'];
            $tmp['gamblecfg'] = $tmp_cfg;
            $tmp['unit'] = $one_gamble['unit'];
            $tmp['batchid'] = $batchid;
            $tmp['showif'] = $one_gamble['showif'];

            if (array_key_exists('weaker', $one_gamble)) {
                $tmp['weaker'] = $one_gamble['weaker'];
                $tmp['weak_par3_num'] = $one_gamble['weak_par3_num'];
                $tmp['weak_par4_num'] = $one_gamble['weak_par4_num'];
                $tmp['weak_par5_num'] = $one_gamble['weak_par5_num'];
                $tmp['total_weak_num'] = $one_gamble['total_weak_num'];
            }


            $para = array_merge($tmp, $gamblecfg);
            $data = $this->pre_addgamble($para);
            $data['batchbaseunit'] = $baseunit;


            // debug($data);

            $this->db->insert('t_gamble_game_alpha', $data);
            $gamble_id = $this->db->insert_id();
            $new_gambles[] = $gamble_id;
            // die;

        }



        $sql = " select * from  t_gamble_game_alpha  where batchid= '{$batchid}'  ";




        $gambles = $this->gamble_proxy($sql, 'batch');
        $this->db->where('gameid', $gameid);
        $this->db->update('t_game', array('is_have_gamble' => 1));
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $ret['gambles']     = $gambles;
        $ret['batchid']     = $batchid;
        $this->output->json_output($ret);
    }



    //V14 列出某个groupid下面的所有游戏.
    public function getgamble() {

        $must_have = array('gameid', 'groupid');
        $para      = check_args($must_have);
        $userid    = $para['uid'];

        $gameid  = $para['gameid'];
        $groupid = $para['groupid'];

        $sql     = "select * from  t_gamble_game_alpha  where gameid=$gameid and  groupid=$groupid and  batchid is null  order by gambleid desc ";
        logtext($sql);

        $gambles = $this->gamble_proxy($sql, 'single');

        $batchids = $this->getBatchIds($groupid);
        $groupgames = array();
        foreach ($batchids as $key => $one_row) {
            $one_batchid = $one_row['batchid'];
            $groupgames[] = $this->getBatchGame($one_batchid);
        }


        $data['error_code']  = 1;
        $data['error_descr'] = 'success';
        $data['gambles']     = $gambles;

        if (count($groupgames) == 0) {
            $data['groupgames'] = null;
        } else {
            $data['groupgames'] =  $data['groupgames'] = $groupgames;
        }

        $data['holeorder'] = $this->getholeorder($groupid);
        $data['juanguo'] = $this->getjuanguo($gameid, $groupid);
        //getPublicFirstHoleIndex
        //$data['firstHoleindex'] = $this->getPublicFirstHoleIndex($groupid);
        $data['firstHoleindex'] = 1;
        // $this->getPublicFirstHoleIndex($groupid);


        $this->output->json_output($data);
    }


    public function getPublicFirstHoleIndex($groupid) {

        $sql = "select distinct firstHoleindex from t_game_group where groupid=$groupid limit 1";
        $row = $this->db->query($sql)->row_array();

        if ($row) {
            return $row['firstHoleindex'];
        } else {
            return 1;
        }
    }



    public function getBatchIds($groupid) {

        $sql = "select distinct batchid  from  t_gamble_game_alpha  where   groupid=$groupid and  batchid is not  null  order by  batchid  ";
        $batchids = $this->db->query($sql)->result_array();
        return $batchids;
    }



    public function getBatchGame($one_batchid) {

        $sql = "select * from  t_gamble_game_alpha  where batchid= '{$one_batchid}' ";
        $batchgames = $this->gamble_proxy($sql, 'batch');
        if (count($batchgames) > 0) {

            $tmp = array();
            $tmp['gambles'] = $batchgames;
            $one_get = $batchgames[0];
            $public_ruleid = $one_get['ruleid'];
            $public_rulesource = $one_get['rulesource'];
            $batchid = $one_get['batchid'];
            if ($public_rulesource == 'user') {
                $sql = "select * from  t_gamble_rule_user_alpha where userruleid=$public_ruleid";
            } else {
                $sql = "select * from  t_gamble_rule_alpha where sysruleid=$public_ruleid";
            }
            $tmp['baserule'] = $this->db->query($sql)->row_array();
            $tmp['baseunit'] = 1;
            $tmp['batchid'] = $batchid;
        }

        return array(
            'gambles' => $batchgames,
            'batchid' => $one_batchid,
            'baseunit' => 1,
            'baserule' => $tmp['baserule']
        );
    }


    public function gamble_proxy($sql, $type) {
        $gambles = $this->db->query($sql)->result_array();
        foreach ($gambles as $key => $one_gamble) {
            $rulesource = $one_gamble['rulesource'];
            $ruleid     = $one_gamble['ruleid'];
            if ($type == 'single') {
                if ($rulesource == 'user') {
                    $sql = "select * from  t_gamble_rule_user_alpha where userruleid=$ruleid";
                } else {
                    $sql = "select * from  t_gamble_rule_alpha where sysruleid=$ruleid";
                }

                $gamblecfg                  = $this->db->query($sql)->row_array();
                $gambles[$key]['gamblecfg'] = $gamblecfg;
                $gambles[$key]['rule_memo'] = $gamblecfg['rule_memo'];
            } else {
                $tmp_cfg = $one_gamble['gamblecfg'];
                $tmp_arr = (array)json_decode($tmp_cfg);
                $gambles[$key]['gamblecfg'] = $tmp_arr;

                if (array_key_exists('rule_memo', $tmp_arr)) {
                    $gambles[$key]['rule_memo'] = $tmp_arr['rule_memo'];
                }
            }
        }
        return $gambles;
    }

    //V14,洞序



    //V14,捐锅
    public function savejuanguo() {

        $must_have = array(
            'gambleid',
            'juanguo_point',
            'juanguo_type'
        );

        $para      = check_args($must_have);
        $gambleid  = $para['gambleid'];

        /*清除group下面所有的捐锅信息,因为一个group只能有一个游戏捐锅*/


        $sql = "select groupid from t_gamble_game_alpha where gambleid=$gambleid";
        $row = $this->db->query($sql)->row_array();
        $groupid = $row['groupid'];

        $this->db->where('groupid', $groupid);
        $this->db->update('t_gamble_game_alpha', array('juanguo_point' => null, 'juanguo_type' => null));
        /*设置捐锅信息*/
        $juanguo_point  =  $para['juanguo_point'];
        $juanguo_type = $para['juanguo_type'];
        if (intval($para['juanguo_point']) == 0) {
            $this->db->where('gambleid', $gambleid);
            $this->db->update('t_gamble_game_alpha', array('juanguo_point' => null, 'juanguo_type' => null));
        } else {
            $this->db->where('gambleid', $gambleid);
            $this->db->update('t_gamble_game_alpha', array('juanguo_point' => $juanguo_point, 'juanguo_type' => $juanguo_type));
        }
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $this->output->json_output($ret);
    }



    //V14,捐锅
    public function getjuanguo($gameid, $groupid) {

        $sql = "select gambleid,juanguo_point, juanguo_type from t_gamble_game_alpha where  gameid=$gameid and groupid=$groupid and CHAR_LENGTH(juanguo_type)>3";
        $row = $this->db->query($sql)->row_array();

        if (count($row) == 0) {
            return null;
        } else {
            return $row;
        }
    }


    public function getholeorder($groupid) {
        $row = $this->db->get_where('t_gamble_game_holeorder', array('groupid' => $groupid))->row_array();
        if ($row) {
            return $row['holeorder'];
        } else {
            return null;
        }
    }



    //V14,提供给App,显示赌球结果.

    public function getgambleresult() {

        $this->load->library('XGame');

        $must_have = array(
            'gameid',
            'groupid'
        );


        $para      = check_args($must_have);
        $gameid  = $para['gameid'];
        $groupid = $para['groupid'];
        $userid  = $para['agent_userid'];

        $mgr_game   = $this->xgame;
        $gamedetail = $mgr_game->game_detail($gameid, $userid, 'all');
        $gameinfo   = $gamedetail['game_info'];
        $getgroupusers = $this->getgroupusers($gameid, $groupid, $userid);

        $ret                = array();
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $ret['gameid']      = $gameid;
        $ret['gamename']    = $gameinfo['name'];
        $ret['gameinfo']    = $gameinfo;


        $check_arr = $this->gamblecheckstatus($gameid, $groupid);

        if (($check_arr['new_counter'] == 0) && ($check_arr['old_counter'] == 0)) {

            $ret['gamblecheckstatus'] =  'nogamble';
            $url_page                 = "http://api.golf-brother.com/web/galpha/alpha_summary/";
            $ret['resulturl'] = $url_page . '?groupid=' . $groupid . '&userid=' . $userid;
        } else {
            $ret['gamblecheckstatus'] =  'pass';

            //新版本游戏
            if ($check_arr['new_counter'] == 1) {
                $url_page                 = "http://api.golf-brother.com/web/galpha/alpha_summary/";
                $ret['resulturl'] = $url_page . '?groupid=' . $groupid . '&userid=' . $userid;
            } else
            //旧版本游戏
            {
                $url_page = "http://api.golf-brother.com/web/gamble/summary/";
                $ret['resulturl']         = $url_page . '?groupid=' . $groupid . '&userid=' . $userid;
            }
        }
        $ret['players'] = $getgroupusers;
        $this->output->json_output($ret);
    }



    //V14,系统规则.
    public function listsysrule() {

        $must_have          = array();
        $para               = check_args($must_have);
        $sql                = "select  * from t_gamble_rule_alpha  ";
        $rules              = $this->db->query($sql)->result_array();
        $ret                = array();
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';


        foreach ($rules as $key => $one_rule) {
            # code...
            $rules[$key]['single_bonus_value'] = null;
            $rules[$key]['double_bonus_value'] = null;
        }

        $ret['userroles']   = $rules;

        //系统规则,去除 single_bonus_value /double_bonus_value ,由客户端自己控制
        //single_bonus_value
        //double_bonus_value
        // $ret['single_bonus_value']=null;
        // $ret['double_bonus_value']=null;



        $this->output->json_output($ret);
    }

    //V14,个人规则.

    public function listmyrule() {

        $must_have          = array();
        $para               = check_args($must_have);
        $userid             = $para['uid'];
        $sql                = "select  * from t_gamble_rule_user_alpha  where userid=$userid  and ruleshow='Y'  order by userruleid desc ";
        $rules              = $this->db->query($sql)->result_array();
        $ret                = array();
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $ret['userroles']   = $rules;
        $this->output->json_output($ret);
    }




    public function gamblecheckstatus($gameid, $groupid) {

        $check_arr = array();
        $sql    = "select * from t_gamble_game_alpha where gameid=$gameid and groupid=$groupid";
        $rows   = $this->db->query($sql)->result_array();
        if (count($rows) == 0) {
            $check_arr['new_counter'] = 0;
        } else {
            $check_arr['new_counter'] = 1;
        }


        $sql    = "select * from t_gamble_game where gameid=$gameid and groupid=$groupid";
        $rows   = $this->db->query($sql)->result_array();
        if (count($rows) == 0) {
            $check_arr['old_counter'] = 0;
        } else {
            $check_arr['old_counter'] = 1;
        }
        return $check_arr;
    }




    public function getgroupusers($gameid, $groupid, $userid) {

        $this->load->library('XGame');
        $mgr_game = $this->xgame;

        $gamedetail = $mgr_game->game_detail($gameid, $userid, 'all');
        $group_info = $gamedetail['group_info'];

        $foundkey = -1;
        foreach ($group_info as $key => $one_group) {
            if ($one_group['groupid'] == $groupid) {
                $foundkey = $key;
            }
        }

        $found_group_users = $group_info[$foundkey]['group_user'];
        foreach ($found_group_users as $key => $one_user) {
            $found_group_users[$key]['cover'] = $one_user['user_picurl'];
            unset($found_group_users[$key]['user_picurl']);
            unset($found_group_users[$key]['confirmed']);
            unset($found_group_users[$key]['confirmed_time']);
            unset($found_group_users[$key]['admin']);
        }
        return $found_group_users;
    }



    public function editgamble() {



        $must_have = array(
            'gambleid'
        );
        $para      = check_args($must_have);

        $gambleid = $para['gambleid'];
        $data = [];

        if (array_key_exists('ruleid', $para)) {
            $data['ruleid'] = $para['ruleid'];
        }

        if (array_key_exists('rulesource', $para)) {
            $data['rulesource'] = $para['rulesource'];
        }


        if (array_key_exists('fixed_dizhu', $para)) {
            $data['fixed_dizhu'] = $para['fixed_dizhu'];
        }


        if (array_key_exists('div_option', $para)) {
            $data['div_option'] = $para['div_option'];
        }



        if (array_key_exists('players', $para)) {
            $data['players'] = $para['players'];
        }

        if (array_key_exists('playernum', $para)) {
            $data['playernum'] = $para['playernum'];
        }


        if (array_key_exists('initorder', $para)) {
            $data['initorder'] = $para['initorder'];
        }


        if (array_key_exists('agroup', $para)) {
            $data['agroup'] = $para['agroup'];
        }

        if (array_key_exists('bgroup', $para)) {
            $data['bgroup'] = $para['bgroup'];
        }

        if (array_key_exists('unit', $para)) {
            $data['unit'] = $para['unit'];
        }

        if (array_key_exists('weaker', $para)) {
            $data['weaker'] = $para['weaker'];
            if (array_key_exists('weak_par3_num', $para)) {
                $data['weak_par3_num'] = $para['weak_par3_num'];
            }

            if (array_key_exists('weak_par4_num', $para)) {
                $data['weak_par4_num'] = $para['weak_par4_num'];
            }
            if (array_key_exists('weak_par5_num', $para)) {
                $data['weak_par5_num'] = $para['weak_par5_num'];
            }
        } else {
            $data['weaker'] = null;
            $data['weak_par3_num'] = null;
            $data['weak_par4_num'] = null;
            $data['weak_par5_num'] = null;
        }



        if (array_key_exists('firstHoleindex', $para)) {
            $data['firstHoleindex'] = $para['firstHoleindex'];
        }


        if (array_key_exists('lastholeindex', $para)) {
            $data['lastholeindex'] = $para['lastholeindex'];
        }


        if (array_key_exists('weight_cfg', $para)) {
            $data['weight_cfg'] = $para['weight_cfg'];
        }


        if (array_key_exists('value_8421', $para)) {
            $data['value_8421'] = $para['value_8421'];
        }







        $this->db->where('gambleid', $gambleid);
        $this->db->update('t_gamble_game_alpha', $data);
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';

        $gambleinfo = $this->db->query("select * from t_gamble_game_alpha where gambleid=$gambleid ")->row_array();

        $rulesource = $gambleinfo['rulesource'];
        $ruleid     = $gambleinfo['ruleid'];

        if ($rulesource == 'user') {
            $sql = "select * from  t_gamble_rule_user_alpha where userruleid=$ruleid";
        } else {
            $sql = "select * from  t_gamble_rule_alpha where sysruleid=$ruleid";
        }

        $gamblecfg                      = $this->db->query($sql)->row_array();
        $ret['gambleinfo']              = $gambleinfo;
        $ret['gambleinfo']['gamblecfg'] = $gamblecfg;
        $this->output->json_output($ret);
    }




    public function deletegamble() {
        $must_have = array();

        $para      = check_args($must_have);
        if (!isset($para['gambleid']) && !isset($para['batchid'])) {
            $ret['error_code']  = -1;
            $ret['error_descr'] = '参数错误';
            $this->output->json_output($ret);
            return;
        }

        if (isset($para['gambleid'])) {
            $gambleid  = $para['gambleid'];
            $sql = "select gameid from t_gamble_game_alpha where gambleid=$gambleid ";
            $gameid = $this->db->query($sql)->row_array();
            $sql = "delete from  t_gamble_game_alpha   where gambleid=$gambleid   ";
            $this->db->query($sql);
        }


        if (isset($para['batchid'])) {
            $batchid  = $para['batchid'];
            $sql = "select gameid from t_gamble_game_alpha where batchid='{$batchid}' ";
            $gameid = $this->db->query($sql)->row_array();
            $sql = "delete from  t_gamble_game_alpha   where batchid='{$batchid}'   ";
            $this->db->query($sql);
        }

        $gameid  = intval($gameid['gameid']);
        $sql = "select count(gambleid) as num from t_gamble_game_alpha where gameid=$gameid ";
        $gamble_num = $this->db->query($sql)->row_array();
        if (intval($gamble_num['num']) == 0) {
            $this->db->where('gameid', $gameid);
            $this->db->update('t_game', array('is_have_gamble' => 2));
        } else {
            $this->db->where('gameid', $gameid);
            $this->db->update('t_game', array('is_have_gamble' => 1));
        }
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $this->output->json_output($ret);
    }

    public function deleteuserrule() {
        $must_have  = array(
            'userruleid'
        );
        $para       = check_args($must_have);
        $userruleid = $para['userruleid'];
        $sql        = "update   t_gamble_rule_user_alpha  set ruleshow='N'  where userruleid=$userruleid   ";
        $this->db->query($sql);
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $this->output->json_output($ret);
    }


    public function extend_holeorder($groupid, $firstHoleindex) {



        $holecounter = $this->game_9_or_18($groupid);
        $segment1 = array();
        $segment2 = array();

        for ($i = $firstHoleindex; $i <= $holecounter; $i++) {
            $segment1[] = $i;
        }


        for ($i = 1; $i < $firstHoleindex; $i++) {
            $segment2[] = $i;
        }

        return   array_to_string(array_merge($segment1, $segment2));
    }


    public function setfirsthole() {

        $must_have      = array();
        $para           = check_args($must_have);
        $groupid        = $para['groupid'];
        $gameid        =  $para['gameid'];

        $firstHoleindex = $para['firstHoleindex'];


        $sql = "update  t_game_group   set firstHoleindex=$firstHoleindex  where   groupid=$groupid";
        logtext($sql);
        $this->db->query($sql);

        //重置 holeorder
        $holeorder = $this->extend_holeorder($groupid, $firstHoleindex);
        $this->insertOrupdateHoleOrder($gameid, $groupid, $holeorder);

        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $this->output->json_output($ret);
    }

    public function saveholeorder() {

        $must_have = array(
            'gameid',
            'groupid',
            'holeorder'
        );

        $para      = check_args($must_have);
        $gameid  = $para['gameid'];
        $groupid  =  $para['groupid'];
        $holeorder = $para['holeorder'];
        $this->insertOrupdateHoleOrder($gameid, $groupid, $holeorder);
        $ret = [];
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $this->output->json_output($ret);
    }


    public function insertOrupdateHoleOrder($gameid, $groupid, $holeorder) {

        $query = $this->db->get_where('t_gamble_game_holeorder', array('gameid' => $gameid, 'groupid' => $groupid));
        if ($query->num_rows() > 0) {
            $this->db->where(array('gameid' => $gameid, 'groupid' => $groupid));
            $this->db->update('t_gamble_game_holeorder', array('holeorder' => $holeorder));
        } else {
            $this->db->insert('t_gamble_game_holeorder', array('gameid' => $gameid, 'groupid' => $groupid, 'holeorder' => $holeorder));
        }
    }



    public function getfirsthole($groupid) {
        $sql = "select firstHoleindex from   t_game_group  where   groupid=$groupid  ";


        $rows = $this->db->query($sql)->result_array();
        if (count($rows) == 1) {
            $firstHoleindex = $rows[0]['firstHoleindex'];
        } else {
            $firstHoleindex = 1;
        }
        return $firstHoleindex;
    }



    public function ruledata_process($para) {

        $data    = array();
        $columns = array(
            'sysruleid',
            'userruleid',
            'userid',
            'rulename',
            'ename',
            'playernum',
            'kpi_cfg',
            'div_options',
            'current_div_option',
            'duty_numbers',
            'current_duty_number',
            'duty_hole_only',
            'duty_items',
            'max_options',
            'current_max_option',
            'bonus_operators',
            'bonus_switch',
            'bonus_single_or_double',
            'current_bonus_operator',
            'single_bonus_value',
            'double_bonus_value',
            'draw_option',
            'meat_hole_num_option',
            'meat_eat_condition',
            'meat_value_option',
            'weight_cfg',
            'rule_memo',
            'draw_8421',
            'duty_8421'
        );

        foreach ($columns as $key) {
            $data[$key] = null;
            if (array_key_exists($key, $para)) {
                $data[$key] = $para[$key];
            }
        }
        return $data;
    }

    public function adduserrule() {


        $must_have      = array(
            'agent_userid'

        );


        $post_from_app = $_POST;
        $tmp_para           = check_args($must_have);

        $r_array = (array) json_decode($post_from_app['rule']);
        $r_array['userid'] = $tmp_para['agent_userid'];

        $data      = $this->ruledata_process($r_array);

        $sysruleid = $r_array['sysruleid'];
        $sql       = "select * from t_gamble_rule_alpha where  sysruleid=$sysruleid ";
        $row       = $this->db->query($sql)->row_array();

        foreach ($data as $col => $col_val) {
            if (is_null($data[$col])) {

                if ($col == 'userruleid') {
                } else {
                    $data[$col] = $row[$col];
                }
            }
        }


        if (array_key_exists('userruleid', $data)) {
            unset($data['userruleid']);
        }

        $data['ruleshow'] = 'Y';

        $this->db->insert('t_gamble_rule_user_alpha', $data);

        $errmsg = $this->db->_error_message();

        $new_user_ruleid    = $this->db->insert_id();
        $ret                = array();
        $ret['error_code']  = 1;
        $ret['error_descr'] = 'success';
        $ret['errmsg'] = $errmsg;
        $data['userruleid'] = $new_user_ruleid;
        $ret['ruleinfo']    = $data;
        $this->output->json_output($ret);
    }





    public function edituserrule() {

        $must_have      = array(
            'agent_userid'
        );


        $post_from_app = $_POST;
        $tmp_para           = check_args($must_have);

        $r_array = (array) json_decode($post_from_app['rule']);
        $r_array['userid'] = $tmp_para['agent_userid'];
        $data      = $this->ruledata_process($r_array);
        $userruleid = $r_array['userruleid'];

        foreach ($data as $col => $one_v) {
            if (is_null($one_v)) {
                unset($data[$col]);
            }
        }


        $rulename = $data['rulename'];
        $userid = $data['userid'];
        $sql    = "select count(*) as rowcount from t_gamble_rule_user_alpha where userid=$userid and ";
        $sql .= " rulename='{$rulename}' and userruleid<>$userruleid ";


        $result = $this->db->query($sql)->row_array();
        $num_x  = $result['rowcount'];

        $num_x = 0; // ZZZ 直接覆盖

        if ($num_x > 0) {

            $ret                = array();
            $ret['error_code']  = -1062;
            $ret['error_descr'] = '规则名已经存在,请重新选择名称';
            $this->output->json_output($ret);
        } else {
            $this->db->where('userruleid', $userruleid);
            $this->db->update('t_gamble_rule_user_alpha', $data);

            $ret                = array();
            $ret['error_code']  = 1;
            $ret['error_descr'] = 'success';
            $data['userruleid'] = $userruleid;
            $ret['ruleinfo']    = $data;
            $this->output->json_output($ret);
        }
    }


    public function changegamblerule() {
        $must_have      = array(
            'gambleid'
        );
        $para           = check_args($must_have);
        $para['userid'] = $para['uid'];

        $gambleid  = $para['gambleid'];
        $data      = $this->ruledata_process($para);
        $sysruleid = $para['sysruleid'];
        $sql       = "select * from t_gamble_rule_alpha where  sysruleid=$sysruleid ";
        $row       = $this->db->query($sql)->row_array();
        foreach ($data as $col => $col_val) {
            if (is_null($data[$col])) {

                $data[$col] = $row[$col];
            }
        }

        $userid   = $para['userid'];
        $rulename = $data['rulename'];
        $sql      = "select count(*) as rowcount from  t_gamble_rule_user_alpha where ruleshow='Y' and   userid=$userid and rulename='{$rulename}' ";
        $result   = $this->db->query($sql)->row_array();
        $num_x    = $result['rowcount'];
        if ($num_x > 0) {
            $ret                = array();
            $ret['error_code']  = -1062;
            $ret['error_descr'] = '规则名已经存在,请重新选择名称';
            $this->output->json_output($ret);
        } else {

            $this->db->insert('t_gamble_rule_user_alpha', $data);
            $new_user_ruleid    = $this->db->insert_id();
            $sql                = "update t_gamble_game_alpha  set ruleid=$new_user_ruleid  ,rulesource='user' where gambleid=$gambleid ";
            $data['userruleid'] = $new_user_ruleid;
            $this->db->query($sql);
            $ret['error_code']  = 1;
            $ret['ruleinfo']    = $data;
            $ret['error_descr'] = 'success';
            $this->output->json_output($ret);
        }
    }




    //测试接口
    public function test() {

        header('Access-Control-Allow-Origin: *');

        $server_type = $this->server_type();

        header("Content-type: text/html; charset=utf-8");
        $tester = $this->uri->segment(3);
        if (strlen($tester) == 0) {
            if ($server_type == 'run') {
                header("Location: http://api.golf-brother.com/v6/gamble/test/tang");
            } else {
                header("Location: http://test.golf-brother.com/v6/gamble/test/tang");
            }

            die();
        }

        $test_user = array(
            'tang' => 't_game_score_g27',
            'wang' => 't_game_score_g28',
            'zhang' => 't_game_score_g29',
            'di' => 't_game_score_g30',
            'zhou' => 't_game_score_g31'

        );
        $test_table = $test_user[$tester];
        $algorithm_sql = "select cfg_item,cfg_value,cfg_opt from t_gamble_algorithm";
        $algorithm     = $this->db->query($algorithm_sql)->result_array();

        if ($server_type == 'run') {
            $this->load->view("client/gamble27_run.php", null);
        } else {
            $this->load->view("client/gamble27_test.php", null);
        }



        $sql = "select userid,nickname,holename,holeid,par,gross from $test_table order by disp,holeid, userid ";

        $alg = "<table id='algorithm' class='table-bordered' style='margin:10px;font-size:14px;'>";
        // $alg.="<tr><td  style='width:290px;'>算法配置项</td><td  style='width:190px;'>值</td><td  style='width:290px;'>可选</td></tr>";
        foreach ($algorithm as $key => $one_value) {

            $alg .= "<tr><td style='width:290px;'>{$one_value['cfg_item']}</td><td>
          <input type=text  autocomplete='off' id={$one_value['cfg_item']} class='form-control input-md' value={$one_value['cfg_value']} />
        </td><td style='width:290px;'>{$one_value['cfg_opt']}</td></tr>";
        }


        $alg .= "</table><button id='algorithm_save' onclick='save_algorithm()' type='button' style='margin:10px;' class='btn btn-default'>Save</button>";

        $rows = $this->db->query($sql)->result_array();

        $parlist = matrix($rows, 'holeid', array(
            'nickname',
            'par',
            'holename',
            'gross',
            'userid'
        ), 'nickname', 'player', false);
        $row_x   = $parlist[0];
        unset($row_x['player']);
        $tds_top = "<tr><td style='width:170px;'>选手</td>";
        foreach ($row_x as $key => $one_hole) {
            $tds_top .= "<td style='width:70px;'> {$one_hole['holename']}<br/>PAR{$one_hole['par']} </td>";
        }
        $tds_top .= "</tr>";
        $tds = '<tr>';

        $index = 1;

        foreach ($parlist as $key => $one_player) {

            $css = 'cell_score_' . $index;

            $tds .= "<td>{$one_player['player']}</td>";
            unset($one_player['player']);
            foreach ($one_player as $hole_index => $one_hole) {
                $hole_htmlid = $hole_index . '_' . $one_hole['userid'];
                $tds .= "<td>  <input type=text  style='color:blue;' autocomplete='off' id=$hole_htmlid class='form-control input-md {$css}" . "'" . " value={$one_hole['gross']} /> </td>";
            }
            $index++;
            $tds .= "</tr>";
        }
        $btn1 = '<button id="savebt" onclick="randscore();" style="margin-left:900px;margin-top:80px;" class="btn btn-primary">随机成绩</button>';
        $btn2 = '<button id="savebt" onclick="savescore();" style="margin-left:900px;margin-top:20px;" class="btn btn-primary">保存成绩</button>';

        echo "<div id=main class=$tester style='z-index:10;position:fixed;height:220px;width:1500px;padding:5px;background:grey;'><table id=score style='position:fixed;color:yellow; margin:20px;' class=table-bordered>" . $tds_top . $tds . "</table> $btn1 <br/> $btn2</div>";

        echo "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>";
        echo $alg;
    }




    //web编辑成绩,测试用.
    public function webedit() {

        header('Access-Control-Allow-Origin: *');

        $server_type = $this->server_type();

        header("Content-type: text/html; charset=utf-8");
        $tester = $this->uri->segment(3);
        if (strlen($tester) == 0) {
            if ($server_type == 'run') {
                header("Location: http://api.golf-brother.com/v6/gamble/test/tang");
            } else {
                header("Location: http://test.golf-brother.com/v6/gamble/test/tang");
            }

            die();
        }

        $test_user = array(
            'tang' => 't_game_score_g27',
            'wang' => 't_game_score_g28',
            'zhang' => 't_game_score_g29',
            'di' => 't_game_score_g30',
            'zhou' => 't_game_score_g31'

        );
        $test_table = $test_user[$tester];


        $this->load->view("client/gamble_webedit.php", null);

        $sql = "select userid,userid as nickname,holename,s.holeid,s.par,gross from  t_game_score s,
               t_court_hole h where   s.holeid=h.holeid and groupid=246093 order by s.id ";

        $rows = $this->db->query($sql)->result_array();

        $parlist = matrix($rows, 'holeid', array(
            'nickname',
            'par',
            'holename',
            'gross',
            'userid'
        ), 'nickname', 'player', false);
        $row_x   = $parlist[0];
        unset($row_x['player']);
        $tds_top = "<tr><td style='width:170px;'>选手</td>";
        foreach ($row_x as $key => $one_hole) {
            $tds_top .= "<td style='width:70px;'> {$one_hole['holename']}<br/>PAR{$one_hole['par']} </td>";
        }
        $tds_top .= "</tr>";
        $tds = '<tr>';

        $index = 1;

        foreach ($parlist as $key => $one_player) {

            $css = 'cell_score_' . $index;

            $tds .= "<td>{$one_player['player']}</td>";
            unset($one_player['player']);
            foreach ($one_player as $hole_index => $one_hole) {
                $hole_htmlid = $hole_index . '_' . $one_hole['userid'];
                $tds .= "<td>  <input type=text  style='color:blue;' autocomplete='off' id=$hole_htmlid class='form-control input-md {$css}" . "'" . " value={$one_hole['gross']} /> </td>";
            }
            $index++;
            $tds .= "</tr>";
        }
        $btn1 = '<button id="savebt" onclick="randscore();" style="margin-left:900px;margin-top:80px;" class="btn btn-primary">随机成绩</button>';
        $btn2 = '<button id="savebt" onclick="savescore();" style="margin-left:900px;margin-top:20px;" class="btn btn-primary">保存成绩</button>';

        echo "<br/><div id=main class=$tester style='z-index:10;position:fixed;height:220px;width:1500px;padding:5px;background:grey;'><table id=score style='position:fixed;color:yellow; margin:20px;' class=table-bordered>" . $tds_top . $tds . "</table></div> ";
        echo "<div style='clear:both;margin-top:150px;'><br/><br/>$btn1 <br/> $btn2</div>";
    }
}
