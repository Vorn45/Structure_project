#!/usr/bin/env bash
# Reformats the codebase to 4-space indentation using the project's Prettier config
# (.prettierrc has tabWidth: 4). Run from the repository root.
set -euo pipefail

cd "$(dirname "$0")/.."

npx prettier --write "src/**/*.ts" "test/**/*.ts"
