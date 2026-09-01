#!/bin/sh
set -eu

: "${COMPANY_NAME:=${SITE_NAME:-}}"
: "${COMPANY_NAME:?COMPANY_NAME or SITE_NAME is required}"
: "${APPLICATION_REVISION:?APPLICATION_REVISION is required}"

company_name="$(printf '%s' "$COMPANY_NAME" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g')"
company_name_replacement="$(printf '%s' "$company_name" | sed 's/[\\&|]/\\&/g')"
application_revision_replacement="$(printf '%s' "$APPLICATION_REVISION" | sed 's/[\\&|]/\\&/g')"
mkdir -p /www
sed \
  -e "s|__COMPANY_NAME__|$company_name_replacement|g" \
  -e "s|__APPLICATION_REVISION__|$application_revision_replacement|g" \
  /site/index.html > /www/index.html
cp /site/styles.css /site/app.js /www/

exec node /app/server.js
