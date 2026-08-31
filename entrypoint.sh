#!/bin/sh
set -eu

: "${SITE_NAME:?SITE_NAME is required}"

site_name="$(printf '%s' "$SITE_NAME" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g')"
site_name_replacement="$(printf '%s' "$site_name" | sed 's/[\\&|]/\\&/g')"
mkdir -p /www
sed "s|__SITE_NAME__|$site_name_replacement|g" /site/index.html > /www/index.html
cp /site/styles.css /site/app.js /www/

exec httpd -f -p 80 -h /www
