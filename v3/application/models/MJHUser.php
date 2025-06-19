<?php


// 原来 APP 数据库相关的用户逻辑

class MJHUser  extends CI_Model {

  private $jhdb;
  public function __construct() {
    parent::__construct();

    // 加载其他数据库连接
    $this->jhdb = $this->load->database('jh_db', TRUE);
  }


  public function getJianghuUserByMobile($mobile) {
    $this->jhdb->where('mobile', $mobile);
    $user = $this->jhdb->get('t_user')->row_array();
    return $user;
  }
}
