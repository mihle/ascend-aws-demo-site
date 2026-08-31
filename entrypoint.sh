#!/bin/sh
set -eu

: "${SITE_NAME:?SITE_NAME is required}"

site_name="$(printf '%s' "$SITE_NAME" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g')"
mkdir -p /www
printf '<!doctype html><html><head><title>%s</title></head><body><h1>%s</h1></body></html>\n' "$site_name" "$site_name" > /www/index.html

exec httpd -f -p 80 -h /www
