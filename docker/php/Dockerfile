FROM php:8.2-apache
# Active PDO MySQL pour que le backend PHP puisse parler a la base.
RUN docker-php-ext-install pdo pdo_mysql && a2enmod rewrite
# Copie la configuration PHP propre au projet.
COPY php.ini /usr/local/etc/php/conf.d/mercato.ini
# Remplace la configuration Apache par le vhost du projet.
COPY vhost.conf /etc/apache2/sites-enabled/000-default.conf
# Aligne l'utilisateur Apache avec l'utilisateur local pour limiter les problemes de droits.
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data
