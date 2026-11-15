#!/bin/sh
set -e
echo "Frontend running on http://localhost:8082/management/"
exec nginx -g 'daemon off;'
