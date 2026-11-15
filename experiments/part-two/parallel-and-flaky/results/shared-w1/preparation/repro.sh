#!/bin/sh
set -eu
: "${API_BASE_URL:?Set the isolated API URL}"
: "${TEST_PASSWORD:?Set the seeded test password}"
API_TOKEN=$(curl -fsS "$API_BASE_URL/api/social/token/" --data-urlencode 'username=lab-par-shared-restauranta' --data-urlencode "password=$TEST_PASSWORD" | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -fsS -X POST "$API_BASE_URL/api/restaurant/meals/" -H "Authorization: Bearer $API_TOKEN" -H 'Content-Type: application/json' --data '{"name":"PAR shared meal","short_description":"Both cases edit this same meal","image":"","price":100}'
