FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    icu-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libzip-dev \
    openssl-dev \
    bash

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache

# Install Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Configure PHP
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Override PHP-FPM pool to listen on 0.0.0.0:9000 (accessible from Nginx container)
COPY www.conf /usr/local/etc/php-fpm.d/www.conf

# Set permissions
RUN adduser -D -H -u 1000 -s /bin/bash www && \
    chown -R www:www /var/www/html

USER www

EXPOSE 9000

