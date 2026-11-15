#!/bin/sh
set -e
echo "food-grandma-web running on http://localhost:8082"
exec nginx -g 'daemon off;'
