#!/bin/sh
set -e

node prisma/init-sqlite.js
node prisma/seed.js
exec node server/index.js
