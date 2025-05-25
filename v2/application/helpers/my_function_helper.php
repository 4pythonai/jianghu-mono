<?php

function sysdatetime() {
  $cur = date('Y-m-d H:i:s', time());
  return $cur;
}

function sysdate() {
  $cur = date('Y-m-d', time());
  return $cur;
}

function sysdate_format($format) {
  $cur = date($format, time());
  return $cur;
}



function randstr($length = 10) {
  $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $charactersLength = strlen($characters);
  $randomString = '';
  for ($i = 0; $i < $length; ++$i) {
    $randomString .= $characters[rand(0, $charactersLength - 1)];
  }

  return $randomString;
}

function verifycode($length = 6) {
  $characters = '0123456789';
  $charactersLength = strlen($characters);
  $randomString = '';
  for ($i = 0; $i < $length; ++$i) {
    $randomString .= $characters[rand(0, $charactersLength - 1)];
  }

  return $randomString;
}

function array_to_string($arr, $wrapper = null) {

  if (count($arr) == 0) {
    if ($wrapper) {

      return "-1";
    } else {
      return  -1;
    }
  }
  $str = '';
  foreach ($arr as $item) {

    if ($wrapper) {
      $str .= "'" . $item . "'" . ",";
    } else {
      $str .= $item . ",";
    }
  }
  $str = rtrim($str, ',');
  return $str;
}


function logtext($para) {
  $log = fopen(helper_getlogname(), 'a+');
  if (is_string($para)) {
    $logtext = $para;
  } else {
    $logtext = var_export($para, true);
  }
  fwrite($log, $logtext);
  fwrite($log, "\n");
  fclose($log);
}






// color log
function clog($para, $color = 'black', $fontWeight = 'normal', $level = 1) {
  $log = fopen(helper_getlogname(), 'a+');

  if (is_array($para)) {
    $logtext = renderArr($para);
  } else {
    $logtext = $para;
  }

  $timestamp = date('Y-m-d H:i:s');
  fwrite($log, $timestamp . ">" . $logtext);
  fwrite($log, "\n");
  fclose($log);


  $redis = new Redis();
  $redis->connect('localhost', 6379); // 请根据您的Redis配置修改

  // 准备日志内容
  // $newLog = $timestamp . ' ' . $logtext;

  // 将新日志添加到Redis列表
  $json = json_encode(['timestamp' => $timestamp, 'text' => $logtext, 'color' =>  $color,   'level' => $level, 'fontWeight' => $fontWeight]);
  $redis->lPush('application_logs', $json);

  // 如果日志数量超过1000，则删除最旧的日志
  $redis->lTrim('application_logs', 0, 999);

  // 关闭Redis连接
  $redis->close();
}


function helper_getlogname() {
  $logdir = config_item('log_path');
  $fname = 'portal-' . date('Y-m-d', time()) . '.log';
  return $logdir . '/' . $fname;
}

function debug($para) {
  echo '<pre>';
  print_r($para);
  echo '</pre>';
}

function debugtime($str) {
  debug(date('Y-m-d H:i:s.') . gettimeofday()['usec'] . '<---' . $str);
}



function array_retrieve($arr, $keys_config) {
  $result = array();
  if (is_array($keys_config)) {
    foreach ($arr as $onearr) {
      $tmp = array();
      foreach ($keys_config as $segment_index) {
        if (is_array($segment_index)) {
          $segment = $segment_index['segment'];
          $index = $segment_index['index'];
          $tmp[$index] = $onearr[$segment][$index];
        } else {
          $tmp[$segment_index] = $onearr[$segment_index];
        }
      }
      $result[] = $tmp;
    }
  } else {
    foreach ($arr as $onearr) {
      $result[] = $onearr[$keys_config];
    }
  }

  return $result;
}

function arrayfilter($arr, $key, $values) {
  if (!is_array($values)) {
    $values = array($values);
  }
  $result = array();
  foreach ($arr as $onearr) {
    foreach ($values as $value) {
      if ($onearr[$key] == $value) {
        $result[] = $onearr;
      }
    }
  }

  return $result;
}

function httprequest($url, $paraArray, $method) {

  if ('post' == strtolower($method)) {
    return httppost($url, $paraArray);
  }

  if ('put' == strtolower($method)) {
    return httpput($url, $paraArray);
  }


  if ('get' == strtolower($method)) {
    return httpget($url, $paraArray);
  }
}



function httpput($url, $paraArray) {
  $ch_instance = curl_init();
  curl_setopt($ch_instance, CURLOPT_URL, $url);
  curl_setopt($ch_instance, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch_instance, CURLOPT_CUSTOMREQUEST, "PUT");
  curl_setopt($ch_instance, CURLOPT_POSTFIELDS, json_encode($paraArray));

  $headers = array();
  $headers[] = 'Accept: */*';
  $headers[] = 'Content-Type: application/json';
  curl_setopt($ch_instance, CURLOPT_HTTPHEADER, $headers);
  $result = curl_exec($ch_instance);
  if (curl_errno($ch_instance)) {
    $err = ['state' => 'error'];

    return $err;
  }
  curl_close($ch_instance);
  $res = (array) json_decode($result);

  return $res;
}



function httppost($url, $paraArray) {
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paraArray));

  $headers = array();
  $headers[] = 'Accept: */*';
  $headers[] = 'Content-Type: application/json';
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $result = curl_exec($ch);
  if (curl_errno($ch)) {
    $err = ['state' => 'error'];

    return $err;
  }
  curl_close($ch);
  $res = (array) json_decode($result);

  return $res;
}

function httpget($url, $paraArray) {
  $ch = curl_init();
  $para_values = array_values($paraArray);

  $tail = '';
  foreach ($para_values as $para) {
    $tail = $tail . $para . '&';
  }

  $tail = substr($tail, 0, -1);
  $url = $url . $tail;

  logtext($url);
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POST, 0);
  $headers = array();
  $headers[] = 'Accept: */*';
  $headers[] = 'Content-Type: application/json';
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $result = curl_exec($ch);
  if (curl_errno($ch)) {
    $err = ['state' => 'error'];

    return $err;
  }
  curl_close($ch);
  $res = (array) json_decode($result);

  return $res;
}


function uuid() {
  return sprintf(
    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    // 32 bits for "time_low"
    mt_rand(0, 0xffff),
    mt_rand(0, 0xffff),

    // 16 bits for "time_mid"
    mt_rand(0, 0xffff),

    // 16 bits for "time_hi_and_version",
    // four most significant bits holds version number 4
    mt_rand(0, 0x0fff) | 0x4000,

    // 16 bits, 8 bits for "clk_seq_hi_res",
    // 8 bits for "clk_seq_low",
    // two most significant bits holds zero and one for variant DCE1.1
    mt_rand(0, 0x3fff) | 0x8000,

    // 48 bits for "node"
    mt_rand(0, 0xffff),
    mt_rand(0, 0xffff),
    mt_rand(0, 0xffff)
  );
}


function postJson($url, $data) {

  $ch = curl_init($url);
  # Setup request to send json via POST.
  $payload = json_encode($data);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
  # Return response instead of printing.
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  # Send request.
  $result = curl_exec($ch);
  curl_close($ch);
  # Print response.
  return $result;
}


function response500($msg) {
  $ret = ['code' => 500,  'message' => $msg];
  echo json_encode($ret, JSON_UNESCAPED_UNICODE);
  die;
}

function bcsum(array $numbers) {
  $total = "0";
  foreach ($numbers as $onenumber) {
    $total = bcadd($total, $onenumber, 2);
  }
  return $total;
}


function paginateRows($rows, $pageSize, $currentPage) {
  // Ensure currentPage is within bounds
  $currentPage = max(1, min($currentPage, ceil(count($rows) / $pageSize)));

  // Calculate the offset
  $offset = ($currentPage - 1) * $pageSize;

  // Return the subset of rows for the current page
  return array_slice($rows, $offset, $pageSize);
}


function guidv4() {
  if (function_exists('com_create_guid') === true)
    return trim(com_create_guid(), '{}');

  $data = openssl_random_pseudo_bytes(16);
  $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
  $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
