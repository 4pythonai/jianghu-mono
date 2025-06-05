<?php

defined('BASEPATH') or exit('No direct script access allowed');
$active_group = 'default';
$query_builder = true;



$db['default'] = [
  'dsn' => '',
  'hostname' => '172.31.23.241',
  'username' => 'root',
  'password' => 'cnix@123456',
  'database' => 'gtest',
  'port' => 3306,
  'memo' => 'test',
  'dbdriver' => 'mysqli',
  'dbprefix' => '',
  'pconnect' => false,
  'db_debug' => false,
  'cache_on' => false,
  'cachedir' => '',
  'char_set' => 'utf8',
  'dbcollat' => 'utf8_general_ci',
  'swap_pre' => '',
  'encrypt' => false,
  'compress' => false,
  'stricton' => false,
  'failover' => [],
  'save_queries' => true,
];
