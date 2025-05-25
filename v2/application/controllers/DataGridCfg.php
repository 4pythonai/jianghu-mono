<?php


if (!defined('BASEPATH')) {
  exit('No direct script access allowed');
}

class DataGridCfg extends MY_Controller {

  public function __construct() {
    parent::__construct();
    header('Access-Control-Allow-Origin: * ');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With,Content-Type, Accept,authorization');
    header('Access-Control-Allow-Credentials', true);
    if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
      exit();
    }
  }



  public function fetchDataGridCfg() {


    $para = (array) json_decode(file_get_contents("php://input"));
    $res = [];
    $res['code'] = 200;

    $this->db->where('datagrid_code', $para['DataGridCode']);
    $tmp = $this->db->get('nanx_activity')->row_array();
    if ($tmp['datagrid_type'] == 'table') {
      $res['data'] = $this->MTableGridCfgAssemble->PipeRunner($para);
      echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }

    if ($tmp['datagrid_type'] == 'service') {
      $res['data'] = $this->MServiceGridCfgAssemble->PipeRunner($para);
      echo json_encode($res, JSON_UNESCAPED_UNICODE);
    }
  }


  public function GridToMenu() {

    $para = (array) json_decode(file_get_contents("php://input"));
    $datagrid_code = $para['datagrid_code'];
    $datagrid_title = $para['datagrid_title'];
    $menu = $para['menu'];
    $router = $para['router'];
    $parent_id = $para['parent_id'];

    $maxListorderRow = $this->db->where('parent_id', $parent_id)->select_max('listorder')->get('nanx_portal_menu_list')->row_array();

    if ($maxListorderRow) {
      $listorder = intval($maxListorderRow['listorder']) + 1;
    } else {
      $listorder = 1;
    }


    $this->db->insert(
      'nanx_portal_menu_list',
      [
        'menu' => $menu . randstr(10),
        'text' => $datagrid_title,
        'datagrid_code' => $datagrid_code,
        'icon' => 'Bs:BsCpu',
        'router' => $router,
        'parent_id' => $parent_id,
        'is_leaf' => 'true',
        'listorder' => $listorder,
        'menu_level' => 2
      ]
    );

    $menuId = $this->db->insert_id();
    $this->db->insert('nanx_portal_role_menu_permissions', ['role' => 'admin', 'menu_id' => $menuId]);
    $res = [];
    $res['code'] = 200;
    $res['message'] = '菜单生成并分配成功';
  }


  public function AddCurdButtons() {

    $para = (array) json_decode(file_get_contents("php://input"));
    $datagrid_code = $para['datagrid_code'];

    $arr = [
      ['datagrid_code' => $datagrid_code, 'button_code' => 'refreshTable', 'btnorder' => 1],
      ['datagrid_code' => $datagrid_code, 'button_code' => 'editData', 'btnorder' => 2],
      ['datagrid_code' => $datagrid_code, 'button_code' => 'addData', 'btnorder' => 3],
      ['datagrid_code' => $datagrid_code, 'button_code' => 'deleteData', 'btnorder' => 4],
      ['datagrid_code' => $datagrid_code, 'button_code' => 'Exportexcel', 'btnorder' => 5]
    ];
    $this->db->insert_batch('nanx_portal_button_actcode', $arr);

    $res = [];
    $res['code'] = 200;
    $res['message'] = '批量添加5个按钮成功';
  }
}
