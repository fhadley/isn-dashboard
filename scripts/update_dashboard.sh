#!/bin/zsh
set -e

REPO="$HOME/isn-dashboard"
LOGFILE="$HOME/Library/Logs/isn-dashboard-update.log"

{
  echo "=== $(date) ==="
  cd "$REPO"

  # Run exporter
  /opt/homebrew/bin/python3 "$REPO/scripts/export_people.py"

  # Only commit if something actually changed
  if [[ -n $(git status --porcelain public/data/people.json) ]]; then
    git add public/data/people.json
    git commit -m "Auto-update dashboard data from Obsidian"
    git push
    echo "Updated and pushed."
  else
    echo "No changes."
  fi

} >> "$LOGFILE" 2>&1