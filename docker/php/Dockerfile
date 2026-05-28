FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql && a2enmod rewrite
COPY php.ini /usr/local/etc/php/conf.d/mercato.ini
COPY vhost.conf /etc/apache2/sites-enabled/000-default.conf
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data
