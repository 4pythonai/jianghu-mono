<?php

require 'vendor/autoload.php';


class MFile extends CI_Model {

  public  function uploadAction($FILES, $action) {

    $uploadPath = '/var/www/html/upload';
    $date_folder = $this->create_date_folder($uploadPath);
    $files_from_client  = [];

    foreach ($FILES as $file) {
      $this->check_one($file, $action);
      $filename_with_date = $this->get_new_name($file, $action);
      $destFileName = $uploadPath . $date_folder . '/' . $filename_with_date;
      if (!move_uploaded_file($file['tmp_name'], $destFileName)) {
        $ret = ['code' => 500, 'message' => $file['name'] . '文件上传失败'];
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        die;
      } else {
        $files_from_client[] = [
          'orginal_name' => $file['name'],
          'name' => $filename_with_date,
          'file' =>   $destFileName,
          'url' =>   'upload' . $date_folder . '/' . $filename_with_date
        ];
      }
    }

    return $files_from_client;
  }


  private function create_date_folder($uploadPath) {
    $dateFolder =   '/' . date('Y') . '/' . date('m') . '/' . date('d');
    if (!is_dir($uploadPath . $dateFolder)) {
      if (!mkdir($uploadPath . $dateFolder, 0700, true)) {
        $ret = ['code' => 500, 'message' => '创建目录失败:' . $uploadPath . $dateFolder];
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        die;
      }
    }
    return $dateFolder;
  }

  private function get_new_name($file, $action) {
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename_without_extension = str_replace('.' . $extension, '', $file['name']);
    // avatar 不修改文件名,防止 本地/服务器不停的换 avataar url
    if ($action == 'avatar') {
      $filename_with_date = $filename_without_extension . "." . $extension;
    } else {
      $filename_with_date = $filename_without_extension . '-' . date('Ymd') . '-' . time() . '-' . randstr(20) . '.' . $extension;
    }
    return $filename_with_date;
  }

  private function check_one($file, $upload_action) {
    if ($file['error'] === 1) {
      $ret = ['code' => 500, 'status' => 'error', 'message' => '上传发生错误'];
      echo json_encode($ret, JSON_UNESCAPED_UNICODE);
      exit;
    }
    $this->check_filename($file);
    $this->check_extension($file, $upload_action);
    $this->check_max_size($file);
  }

  private function check_max_size($file) {

    $ini_max_allowed = ini_get('upload_max_filesize');
    $max_bytes = $this->get_max_bytes($ini_max_allowed);
    if ($file['size'] > $max_bytes) {
      $ret = ['code' => 500, 'message' => '文件大小超过' . $ini_max_allowed,];
      echo json_encode($ret, JSON_UNESCAPED_UNICODE);
      exit;
    }
  }

  public function check_filename($file) {
    $forbiddens = ['*', '|', '>', '<', '|', '=', '\\', '/', ',', '，', '#'];
    foreach ($forbiddens as $forbidden) {
      if (strpos($file['name'], $forbidden) !== false) {
        $ret = ['code' => 500, 'message' => '对不起,文件名不能包含非法字符:"' . $forbidden . '",请修改文件名再重新上传！'];
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        die;
      }
    }
  }

  public function check_extension($file, $upload_action) {

    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (empty($extension)) {
      $extension = 'no_extension';
      $ret = ['code' => 500, 'message' => '文件名必须有后缀.'];
      echo json_encode($ret, JSON_UNESCAPED_UNICODE);
      die;
    }

    // 后缀检查,不使用mime_content_type, mime_content_type 可能有错误返回.
    $image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'icon'];  //图片
    $office_extensions = ['pdf', 'txt', 'doc', 'docx', 'xls', 'csv', 'xlsx', 'ppt']; // 办公文档
    $all_extensions = array_merge($image_extensions, $office_extensions);
    if ($upload_action === 'avatar') {
      if (!in_array($extension, $image_extensions)) {
        $ret = ['code' => 500, 'message' => '只能上传图片格式的文件.'];
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        die;
      }
    } else {
      if (!in_array($extension, $all_extensions)) {
        $ret = ['code' => 500, 'message' => '不支持' . $extension . '格式的文件'];
        echo json_encode($ret, JSON_UNESCAPED_UNICODE);
        die;
      }
    }
  }




  public function get_max_bytes($val) {
    $val = trim($val);
    $last = strtolower($val[strlen($val) - 1]);
    $val = (int) $val;
    switch ($last) {
      case 'g':
        $val *= (1024 * 1024 * 1024); //1073741824

        break;
      case 'm':
        $val *= (1024 * 1024); //1048576

        break;
      case 'k':
        $val *= 1024;

        break;
    }

    return $val;
  }
}
