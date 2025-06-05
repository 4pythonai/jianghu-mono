#!/bin/bash
rm -fr /var/run/apache2/apache2.pid
rm -fr /tmp/php_errors.log
touch  /tmp/php_errors.log
chmod 777  /tmp/php_errors.log
service apache2 restart &&   bash
