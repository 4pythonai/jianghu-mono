FROM ubuntu:20.04
MAINTAINER Alexander Schenkel <alex@alexi.ch>

WORKDIR /var/www/html



RUN apt-get update  &&  apt-get install -y  software-properties-common



RUN add-apt-repository ppa:ondrej/apache2   &&  apt-add-repository ppa:apt-fast/stable
RUN  apt update
RUN apt install -y  apache2




RUN apt-get update && export LANG=C.UTF-8 && add-apt-repository ppa:ondrej/php 

RUN  apt-get purge php7.0-common

RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y \
      php7.3 \
      php7.3-cli \
      libapache2-mod-php7.3 \
      php-apcu \
      php7.3-curl \
      php-xdebug \
      php7.3-gd \
      php7.3-json \
      php7.3-ldap \
      php7.3-mbstring \
      php7.3-mysql \
      php7.3-pgsql \
      php7.3-sqlite3 \
      php7.3-xml \
      php7.3-xsl \
      php7.3-zip \
      php7.3-soap \
      php7.3-opcache \  
      php7.3-imap \
      vim \
      composer \
      inotify-tools

ADD 000-default.conf /etc/apache2/sites-enabled/000-default.conf
COPY run /usr/local/bin/run
RUN chmod +x /usr/local/bin/run
RUN a2enmod rewrite  ssl proxy proxy_wstunnel


RUN cd /etc/apache2/sites-available &&  a2ensite *
RUN touch /tmp/php_error.log && chmod 777 /tmp/php_error.log
RUN echo "Asia/Shanghai" > /etc/timezone
RUN rm -f /etc/localtime
RUN dpkg-reconfigure -f noninteractive tzdata
COPY init.sh  /usr/local/bin/
COPY  ./php.ini /etc/php/7.0/apache2/php.ini

EXPOSE 80 443
