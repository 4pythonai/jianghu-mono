<?php
// mini-api  verson  MY core should be xxx33 hhh 3333
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(-1);
defined('BASEPATH') or exit('No direct script access allowed');

// register_shutdown_function('my_shutdownHandler');
set_error_handler('my_errorHandler');
set_exception_handler('my_exceptionHandler');





function my_errorHandler($errno, $errstr, $errfile, $errline) {
  if (strlen($errstr) > 0) {
    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
    response500([
      "code" => $errno,
      "message" => "ErrorCode:" . $errno . ",Errmessage:" . $errfile . ' ' . $errline . ' ' . $errstr,
      "trace" => $trace
    ]);
  }
  return true;
}

function  my_exceptionHandler(Throwable $exception) {

  // debug($exception->getMessage());
  print_r($exception->getTraceAsString());

  my_errorHandler('Exception', $exception->getMessage(),  $exception->getFile(), $exception->getLine());
};


function  my_shutdownHandler() {
  $last_error = error_get_last();
  debug($last_error);
  my_errorHandler($last_error['type'], $last_error['message'], $last_error['file'], $last_error['line']);
};

class MY_Controller extends CI_Controller {
  private $user;
  private $roles;
  private $args = null;
  private $user_mobile;


  public function __construct() {
    header('Access-Control-Allow-Origin:  *');
    header('Access-Control-Allow-Methods: * ');
    header('Access-Control-Max-Age: 1728000');
    header("Access-Control-Allow-Headers: Origin,Cache-Control,Access-Control-Allow-Origin,X-Requested-With,Content-Type, Accept,Authorization,authorization");
    header('Access-Control-Allow-Credentials', true);
    error_reporting(E_ALL);
    parent::__construct();
    include_once 'application/controllers/Global_vars.php';
    $this->load->helper('my_jwt_helper');

    if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
      exit();
    }

    $allheaders = getallheaders();

    //  
    if (array_key_exists('authorization', $allheaders)) {
      $allheaders['Authorization'] = $allheaders['authorization'];
    }

    $controller = $this->router->fetch_class();
    $method = $this->router->fetch_method();

    // upload_max_filesize = 1000M;
    // post_max_size = 1000M;

    ini_set('memory_limit', '-1');
    $post = file_get_contents('php://input');
    $http_type = $_SERVER['REQUEST_METHOD'];
    $this->write_access_log($controller, $method, $allheaders, $_REQUEST, $post);


    $this->setArgs($http_type, $_REQUEST, $post);
    $checkSession = $this->checkAuthToken($allheaders, $controller, $method);

    if (!$checkSession) {
      $this->logout();
    }
  }


  private function setArgs($http_type, $req, $post) {
    if ('POST' == $http_type) {
      $this->args = array_merge($req, (array) json_decode($post));
    } else {
      $this->args = $_GET;
    }
  }

  private function toarray($object) {
    $array = json_decode(json_encode($object), true);
    return $array;
  }

  protected function getArgs() {
    return $this->toarray($this->args);
  }

  private function write_access_log($controller, $method, $allheaders, $_request, $post) {

    if ($controller == 'log' || $controller == 'Log') {
      return;
    }

    $time = date('Y-m-d H:i:s');
    logtext('<hr/>');
    logtext('<div><span class =functionname>' . $time . '  ' . $controller . '/' . $method . '</span></div>');

    if (!empty($_request)) {
      logtext('参数:$_REQUEST');
      logtext(json_encode($_request, JSON_UNESCAPED_UNICODE));
    }

    if (!empty($allheaders)) {
      logtext('参数:allheaders');
      logtext(json_encode($allheaders, JSON_UNESCAPED_UNICODE));
    }


    if (!empty($post)) {
      $para = (array) json_decode($post);
      logtext('参数:php//input');
      logtext(json_encode($para, JSON_UNESCAPED_UNICODE));
    }
  }

  private function setUser($user) {
    $this->user = $user;
  }

  public function getUser() {
    return $this->user;
  }



  public function getRoles() {
    return $this->roles;
  }

  public function checkAuthToken($allheaders, $controller, $method) {
    $skip = array(
      'log/*',
      'qrcoder/img',
      'Auth/loginMobile',
      'Auth/loginTier2',
      'Auth/JWT_login',
      'tree/systemSummary',
      'tree/index',
      'App/*',
      'Test/*',
      'dbdocu/gethelp',
    );

    if (in_array($controller . '/' . $method, $skip)) {
      return true;
    }

    if (in_array($controller . '/*', $skip)) {
      return true;
    }

    if (!array_key_exists('Authorization', $allheaders)) {
      logtext(" $controller/$method : No Authorization key ");
      return false;
    }

    // 如果 client_token 为空

    // 如何 allheaders 中没有 Authorization ，则返回false
    if (!array_key_exists('Authorization', $allheaders)) {
      logtext('client_token not exists');
      return false;
    }



    $token = $allheaders['Authorization'];

    // Bearer 
    $token = str_replace('Bearer ', '', $token);
    if (empty($token)) {
      logtext('client_token empty');
      return false;
    }


    $decoded = $this->MJwtUtil->verifyToken($token);

    if (!$decoded) {
      logtext('MJwtUtil  client_token verify failed');
      return false;
    } else {
      logtext('MJwtUtil  client_token verify Passed');
    }


    $this->setUser($decoded['uid']);
    $this->setMobile($decoded['mobile']);
    return true;
  }

  public function logout() {
    ini_set('display_errors', true);
    ob_start();
    $this->session->sess_destroy();
    $loginurl = $this->config->item('login_url');
    logtext("logout...with redirect... $loginurl ");
    header('HTTP/1.1 401 Unauthorized');
    ob_end_flush();
    exit;
  }

  public function getMobile() {
    return $this->user_mobile;
  }


  public function setMobile($mobile) {
    $this->user_mobile = $mobile;
  }
}
