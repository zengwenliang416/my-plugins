#!/bin/bash
# Pre-commit hook template
# Copy to .git/hooks/pre-commit and make executable

set -e

echo "Running pre-commit checks..."

# Check for staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to check"
  exit 0
fi

# Check for debug statements
if echo "$STAGED_FILES" | xargs grep -l "console.log\|debugger\|TODO\|FIXME" 2>/dev/null; then
  echo "Warning: Found debug statements or TODOs in staged files"
  # Uncomment to block commit: exit 1
fi

# Check for large files (> 1MB)
for file in $STAGED_FILES; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    if [ "$size" -gt 1048576 ]; then
      echo "Error: $file is larger than 1MB"
      exit 1
    fi
  fi
done

# Run linter if available
if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
  echo "Running linter..."
  npm run lint --silent || exit 1
fi

echo "Pre-commit checks passed!"
exit 0
