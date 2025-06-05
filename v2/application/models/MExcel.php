<?php

require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Calculation\TextData\Replace;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MExcel extends CI_Model {

  function __construct() {
    parent::__construct();
    $dir =  dirname(__DIR__, 2);
    include $dir .  '/excel/Classes/PHPExcel.php'; //引入文件
    include $dir .  '/excel/Classes/PHPExcel/Writer/Excel2007.php';
  }

  function  exportExcel($fname, $cols, $records) {
    $header = [];
    $total = [];

    foreach ($cols as $col) {
      $colname = $col['key'];
      $header[$colname] = $col['title'];
    }

    $total[] = $header;
    foreach ($records as $index => $record) {
      $tmp = [];
      foreach ($cols as $col) {
        $colname = $col['key'];
        $tmp[$colname] = $record[$colname];
      }
      $total[] = $tmp;
    }




    $objPHPExcel = new PHPExcel();
    $objPHPExcel->setActiveSheetIndex(0);

    //横向单元格标识
    $cellNames = array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ');

    // 使用header 作为 cols,
    $cols = array_keys($header);
    set_time_limit(0);
    ini_set('memory_limit', '-1');

    foreach ($total as $index => $record) {
      $index++;
      foreach ($cols as $cellindex => $col) {
        $cellname = $cellNames[$cellindex];
        if (array_key_exists($col, $record)) {
          $cellvalue = $record[$col];
        } else {
          $cellvalue = '';
        }
        if (is_numeric($cellvalue)) {
          $objPHPExcel->getActiveSheet()->setCellValueExplicit($cellname . $index, $cellvalue, PHPExcel_Cell_DataType::TYPE_NUMERIC);
        } else {
          $objPHPExcel->getActiveSheet()->setCellValueExplicit($cellname . $index, $cellvalue, PHPExcel_Cell_DataType::TYPE_STRING);
        }
      }
    }

    $filename = $fname . date("Y-m-d", time()) . ".xls";
    $objWriter = \PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
    $objWriter->save("/var/www/html/download/$filename"); //保存文件
    $excel_url = 'http://' . $_SERVER['HTTP_HOST'] . '/download/';
    $ret = array("code" => 200, "data" => array("url" => $excel_url . $filename, "name" => $filename));
    echo json_encode($ret);
  }

  function get_sheet_count($filename) {

    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $file_type = IOFactory::identify($filename);
    $reader = IOFactory::createReader($file_type);
    $spreadsheet = $reader->load($filename);
    $sheetcount = $spreadsheet->getSheetCount();
    return $sheetcount;
  }



  function  read_all_sheet_data($filename, $sheet_index) {
    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $file_type = IOFactory::identify($filename);
    $reader = IOFactory::createReader($file_type);
    $spreadsheet = $reader->load($filename);


    if (is_int($sheet_index)) {
      $spreadsheet->setActiveSheetIndex($sheet_index);
    } else {
      $spreadsheet->setActiveSheetIndexByName($sheet_index);
    }
    $all_sheetData = $spreadsheet->getActiveSheet()->toArray(null, true,  false, false);
    return $all_sheetData;
  }


  public function  getColsLength($cols) {
    $colIndexLength = 0;
    foreach ($cols as  $col) {
      $col = str_replace(' ', '_', $col);
      $colname = $col;
      if (!$colname == '') {
        $colIndexLength++;
      }
    }
    return $colIndexLength;
  }


  public function  recreateExcelTmpTable($tablename, $rows) {

    $col_part = '';
    $cols = $rows[0];

    $real_cols = "";


    $cols_arr = [];


    foreach ($cols as  $col) {
      $col = str_replace(' ', '_', $col);
      $col = str_replace(',', '_', $col);
      $col = str_replace('/', '_', $col);
      $col = str_replace('?', '_', $col);

      $colname = $col;
      $cols_arr[] = $colname;
      $col_part .=  "`" . $colname . "`" . ' varchar(255)  default null ,';
      $real_cols .= "`" . $colname . "`" . ',';
    }


    $sql = "drop table if exists tmp_excel  ";
    $this->db->query($sql);


    // remove last , from  $col_part
    $col_part = substr($col_part, 0, -1);
    $real_cols = substr($real_cols, 0, -1);
    $sql = "create table  $tablename  ( `id` int NOT NULL AUTO_INCREMENT,  $col_part , PRIMARY KEY (`id`) )";
    clog("创建表格:" . $sql, 'red');

    $this->db->query($sql);
    $db_error = $this->db->error();
    if (!(0 == $db_error['code'])) {
      return '生成表格错误';
    } else {
      clog("创建表格成功", 'red');
    }

    $real_data_rows = array_slice($rows, 1);

    $batchData = [];
    foreach ($real_data_rows as $one_excel_row) {
      $one = $this->combineColsAndData($cols_arr, $one_excel_row);
      $batchData[] = $one;
    }


    if (count($batchData) >= 1) {
      $this->db->insert_batch($tablename, $batchData);
      if ($db_error['code']  == 0) {
        return '保存成功';
      } else {
        return '写数据失败';
      }
    } else {
      return '保存成功';
    }
  }



  private    function combineColsAndData($cols, $data_row) {
    // 确保两个数组的长度相同
    if (count($cols) !== count($data_row)) {
      throw new Exception("列名数组和数据行数组的长度不匹配");
    }

    // 清理列名（去除可能的数字键）
    $clean_cols = array_map(function ($col) {
      return is_array($col) ? reset($col) : $col;
    }, $cols);

    // 使用 array_combine 合并数组
    $result = array_combine($clean_cols, $data_row);

    // 清理数据（例如，去除首尾空白字符）
    $result = array_map('trim', $result);

    return $result;
  }



  public function  getTableFieldsDefination($rows) {


    $col_part = '';
    $cols = $rows[0]; // 第一行有表头,处理作为表格的列
    $pure_data_rows = array_slice($rows, 1);
    $common_field = ' text  ';
    foreach ($cols as  $excel_col_index  => $col) {
      $colname = str_replace(' ', '_', $col);
      // $maxLen = $this->getMaxLen($pure_data_rows, $excel_col_index);

      $col_part .=  "`" . $colname . "`" . " $common_field  default null ,";
    }
    $col_part = substr($col_part, 0, -1);
    return $col_part;
  }


  public function getMaxLen($rows, $index) {
    $maxLen = 0;
    foreach ($rows as $row) {
      if (isset($row[$index])) {
        $currentString = $row[$index];
        $currentLen = strlen($currentString);
        if ($currentLen > $maxLen) {
          $maxLen = $currentLen;
        }
      }
    }

    return $maxLen;
  }



  public function  saveDataToExcelTempTable($tablename, $rows) {

    $cols = $rows[0]; // 第一行有表头,处理作为表格的列
    $real_cols = "";

    foreach ($cols as  $col) {
      $col = str_replace(' ', '_', $col);
      $colname = $col;
      $real_cols .= "`" . $colname . "`" . ',';
    }


    // remove last , from  $col_part
    $real_cols = substr($real_cols, 0, -1);
    $real_data_rows = array_slice($rows, 1);

    foreach ($real_data_rows as $one_excel_row) {
      $insertVals = '';
      foreach ($one_excel_row as $one_excel_col) {
        $insertVals .= "'$one_excel_col',";
      }
      $insertVals = substr($insertVals, 0, -1);
      $sql = "insert into  $tablename (  $real_cols )  values(  $insertVals  ) ";
      $this->db->query($sql);
      $db_error = $this->db->error();
      if (!(0 == $db_error['code'])) {
        return '写数据失败' .  json_encode($one_excel_row, JSON_UNESCAPED_UNICODE);
      }
    }
    return '保存成功';
  }
}
