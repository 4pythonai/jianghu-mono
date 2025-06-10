<?php

class MUser  extends CI_Model {









  public function getUserbyMobile($mobile) {
    $this->db->where('mobile', $mobile);
    $user =  $this->db->get('t_user')->row_array();
    return $user;
  }
}
