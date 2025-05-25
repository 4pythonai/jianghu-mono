<?php
defined('BASEPATH') or exit('No direct script access allowed');

class AWSChinaBillLoader extends CI_Model {

    public function AWS_china_bill_process($accountId, $filePathName, $month) {
        // 加载数据库
        $this->load->database();

        // 读取文件
        $file = fopen($filePathName, 'r');
        if (!$file) {
            throw new Exception('Cannot open the file: ' . $filePathName);
        }

        // 初始化变量
        $columnNameArray = [];
        $con = 0; // 行数计数
        $batchList = [];

        $batch = 'B' . uuid();


        // 读取文件内容
        while (($line = fgets($file)) !== false) {
            // 处理每行数据
            // $tmpValueArray = explode('","', trim($line, "\"\r\n"));

            $tmpValueArray = preg_split('/","/', $line);


            $counter = count($tmpValueArray);
            for ($i = 0; $i  < $counter; $i++) {
                $tmpValueArray[$i] = str_replace("\"", "", $tmpValueArray[$i]);
            }

            if (++$con == 1) {
                // 首行赋值列名
                $columnNameArray = $tmpValueArray;
                continue;
            }


            // 生成插入账单的SQL语句
            $sqlInsertBill = $this->sqlInsertBill($filePathName, $batch, $accountId, $month, $columnNameArray, $tmpValueArray);
            $batchList[] = $sqlInsertBill;

            // 特殊记录处理
            $recordType = $tmpValueArray[3];

            // debug($recordType);

            if ($recordType === 'AccountTotal') {

                // debug($tmpValueArray);

                $sqlInsertMonth = $this->sqlInsertMonth($filePathName, $batch, $month, $tmpValueArray);
                $batchList[] = $sqlInsertMonth;
            }
        }

        fclose($file);
    }

    function generateValueString($columnNameArray, $dataArray) {
        $values = [];
        $col_counter = count($columnNameArray);

        for ($i = 0; $i < $col_counter; $i++) {
            if ($i < count($dataArray)) {
                $values[] = "'" . addslashes($dataArray[$i]) . "'";
            } else {
                $values[] = "''";
            }
        }
        return implode(", ", $values);
    }



    private function sqlInsertBill($filename, $batch, $accountId, $month, $columnNameArray, $tmpValueArray) {

        // 构建插入账单的SQL语句
        $columns = " ";

        // debug($columnNameArray);

        foreach ($columnNameArray as  $colname) {
            $columns .= $colname . ",";
        }

        // remove last "," from $columns
        $columns = rtrim($columns, ",");

        $values = $this->generateValueString($columnNameArray, $tmpValueArray);
        // $combinedArray = array_combine($columnNameArray, $tmpValueArray);
        $create_time  = date('Y-m-d H:i:s', time());
        $uuid = uuid();
        $create_user = 'task';
        $sql = "INSERT INTO aws_bill_monitor (filename,batch,aws_bill_monitor_id, billAccountId,billmonth, $columns, create_time,create_user ) VALUES ( '$filename','$batch', '$uuid',  '$accountId', '$month', $values,'$create_time','$create_user')";
        // debug($sql);
        $this->db->query($sql);
        // die;
        return $sql;
    }

    private function sqlInsertMonth($filename, $batch, $month, $dataArray) {

        $arr_len = count($dataArray);
        // $now  = date('Y-m-d H:i:s', time());
        // $filename, $batch

        $sql = "";
        $sql .= " INSERT INTO aws_bill_monitor_month ( filename,batch, aws_bill_monitor_month_id , pay_account_id , account_id, bill_month, bill_money, create_date, create_user  ) VALUES (";
        $sql .= "'" . $filename . "',";
        $sql .= "'" . $batch . "', ";
        $sql .= "'" . guidv4() . "',";
        $sql .= "'" . $dataArray[1] . "', ";
        $sql .= "'" . $dataArray[2] . "', ";
        $sql .= "'" . $month . "', ";
        $sql .= " " . $dataArray[$arr_len - 1] . " , "; // bill_money
        $sql .= " now(),'task') ";
        debug("AAAAAAAAAAAAAAAAA");
        debug($sql);
        $this->db->query($sql);
        return $sql;
    }
}
