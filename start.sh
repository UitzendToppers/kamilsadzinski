#!/bin/sh
set -e

(
  node prisma/init-sqlite.js && node prisma/seed.js || true
) &
exec node server/index.js
