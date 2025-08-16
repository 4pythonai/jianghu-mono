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

function debug($title, $var = null) {
  echo "<pre>";

  if (func_num_args() == 1) {
    // 单个参数模式: debug($arr)
    print_r($title);
  } else {
    // 两个参数模式: debug($title, $var)
    echo  $title . "\n";
    print_r($var);
  }

  echo "</pre>";
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
  // 如果是数组或对象，格式化错误信息
  if (is_array($msg) || is_object($msg)) {
    $formattedMsg = [];

    if (isset($msg['code'])) {
      $formattedMsg['error_code'] = $msg['code'];
    }

    if (isset($msg['message'])) {
      $formattedMsg['error_message'] = $msg['message'];
    }

    if (isset($msg['trace'])) {
      $formattedMsg['error_location'] = [];
      $callChain = [];

      // 跳过前几个系统调用，从实际业务代码开始
      $startIndex = 0;
      foreach ($msg['trace'] as $index => $trace) {
        // 跳过系统函数和错误处理函数
        if (
          isset($trace['function']) &&
          (strpos($trace['function'], 'my_errorHandler') !== false ||
            strpos($trace['function'], 'response500') !== false ||
            strpos($trace['function'], 'debug_backtrace') !== false)
        ) {
          $startIndex = $index + 1;
          continue;
        }

        if ($index >= $startIndex && count($callChain) < 5) { // 显示最多5层调用栈
          $callInfo = '';

          if (isset($trace['class'])) {
            $callInfo .= $trace['class'];
          }

          if (isset($trace['function'])) {
            $callInfo .= '->' . $trace['function'] . '()';
          }

          if (isset($trace['line'])) {
            $callInfo .= ':' . $trace['line'];
          }

          if (isset($trace['file'])) {
            $callInfo .= ' [' . basename($trace['file']) . ']';
          }

          $callChain[] = $callInfo;
        }
      }

      // 构建链式调用字符串，需要反转顺序以显示正确的调用链
      $formattedMsg['error_location'] = implode(' ---> ', array_reverse($callChain));
    }

    $ret = [
      'code' => 500,
      'message' => '服务器内部错误',
      'details' => $formattedMsg
    ];
  } else {
    // 如果是字符串，直接使用
    $ret = [
      'code' => 500,
      'message' => $msg
    ];
  }

  // 在浏览器中一行一行打印，方便调试
  if (isset($_SERVER['HTTP_USER_AGENT']) && strpos($_SERVER['HTTP_USER_AGENT'], 'Mozilla') !== false) {
    // 浏览器环境，使用HTML格式
    echo '<pre style="background:#f5f5f5; padding:10px; border:1px solid #ccc; font-family:monospace; white-space:pre-wrap;">';
    echo '<strong>错误信息：</strong><br>';
    echo '<strong>错误代码：</strong>' . $ret['code'] . '<br>';
    echo '<strong>错误消息：</strong>' . $ret['message'] . '<br>';

    if (isset($ret['details'])) {
      echo '<strong>详细信息：</strong><br>';
      echo '<strong>错误代码：</strong>' . $ret['details']['error_code'] . '<br>';
      echo '<strong>错误消息：</strong>' . $ret['details']['error_message'] . '<br>';
      echo '<strong>调用位置：</strong><br>';
      $locations = explode(' ---> ', $ret['details']['error_location']);
      foreach ($locations as $index => $location) {
        echo ($index + 1) . '. ' . $location . '<br>';
      }
      // 添加第6行：错误发生的具体位置
      echo '6. 错误发生在: ' . $ret['details']['error_message'] . '<br>';
    }

    echo '<br><strong>完整JSON：</strong><br>';
    echo htmlspecialchars(json_encode($ret, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    echo '</pre>';
  } else {
    // 非浏览器环境，使用JSON格式
    echo json_encode($ret, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  }
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


function downloadJHAvatar($url) {
  $avatar_path = dirname(dirname(APPPATH));

  // 获取当前日期
  $year = date('Y');
  $month = date('m');
  $day = date('d');

  // 构建目标目录路径
  $target_dir = $avatar_path . '/avatar/' . $year . '/' . $month . '/' . $day;

  // 创建目录（如果不存在）
  if (!is_dir($target_dir)) {
    if (!mkdir($target_dir, 0755, true)) {
      return ['success' => false, 'message' => '无法创建目录'];
    }
  }

  // 获取原始文件名
  $path_info = pathinfo($url);
  $filename = isset($path_info['basename']) ? $path_info['basename'] : 'image.jpg';
  $filepath = $target_dir . '/' . $filename;

  // 使用curl下载图片
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 30);
  curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  $image_data = curl_exec($ch);
  $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);

  // 检查下载是否成功
  if ($image_data === false || $http_code !== 200) {
    return ['success' => false, 'message' => '下载图片失败: ' . $error];
  }

  // 保存图片到文件
  if (file_put_contents($filepath, $image_data) === false) {
    return ['success' => false, 'message' => '保存图片失败'];
  }

  // 返回成功结果
  return [
    'success' => true,
    'message' => '图片下载成功',
    'filepath' => $filepath,
    'relative_path' => '/avatar/' . $year . '/' . $month . '/' . $day . '/' . $filename,
    'filename' => $filename
  ];
}

/**
 * 生成二维码图片
 * @param string $text 要编码的文本
 * @param string|null $filename 输出文件名（可选）
 * @return string 二维码图片URL
 */
function generate_qrcode($text, $filename = null) {
  // 加载二维码库
  require_once APPPATH . 'libraries/phpqrcode/qrlib.php';

  // 设置二维码参数
  $errorCorrectionLevel = 'L'; // 容错级别 L/M/Q/H
  $matrixPointSize = 6;        // 二维码大小
  $margin = 2;                 // 边距

  // 生成文件名
  if (!$filename) {
    $filename = 'qr_' . date('YmdHis') . '_' . uniqid() . '.png';
  }

  // 确保文件名以.png结尾
  if (!preg_match('/\.png$/i', $filename)) {
    $filename .= '.png';
  }

  // 设置保存路径 FCPATH 上一级目录
  $upload_path = FCPATH . '../upload/qrcodes/';

  if (!is_dir($upload_path)) {
    mkdir($upload_path, 0755, true);
  }

  $file_path = $upload_path . $filename;

  // 生成二维码
  QRcode::png($text, $file_path, $errorCorrectionLevel, $matrixPointSize, $margin);

  // 返回访问URL
  $web_url = config_item('web_url');
  $qrcode_url = $web_url . '/upload/qrcodes/' . $filename;
  return $qrcode_url;
}
