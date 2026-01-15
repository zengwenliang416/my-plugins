#!/bin/bash
# Quick Performance Profiler
# Usage: ./quick-profile.sh [node|python|system] [target]

set -e

PROFILE_TYPE="${1:-system}"
TARGET="${2:-}"

echo "=== Quick Performance Profile ==="
echo "Type: $PROFILE_TYPE"
echo "Time: $(date -Iseconds)"
echo ""

case $PROFILE_TYPE in
    system)
        echo "=== System Overview ==="
        echo ""
        echo "--- CPU Usage (top 10 processes) ---"
        ps aux --sort=-%cpu | head -11
        echo ""
        echo "--- Memory Usage (top 10 processes) ---"
        ps aux --sort=-%mem | head -11
        echo ""
        echo "--- Disk I/O ---"
        if command -v iostat &> /dev/null; then
            iostat -x 1 3 2>/dev/null || echo "iostat not available"
        else
            echo "iostat not available"
        fi
        echo ""
        echo "--- Open Files (top 10 by count) ---"
        lsof 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -10 || echo "lsof not available"
        ;;

    node)
        if [[ -z "$TARGET" ]]; then
            echo "Usage: ./quick-profile.sh node <script.js>"
            exit 1
        fi
        echo "=== Node.js Profiling ==="
        echo "Running: node --prof $TARGET"
        echo ""
        node --prof "$TARGET"
        echo ""
        echo "Processing profile..."
        ISOLATE_FILE=$(ls -t isolate-*.log 2>/dev/null | head -1)
        if [[ -n "$ISOLATE_FILE" ]]; then
            node --prof-process "$ISOLATE_FILE" > profile-output.txt
            echo "Profile saved to: profile-output.txt"
            echo ""
            echo "=== Top 20 Functions (by ticks) ==="
            head -50 profile-output.txt
        else
            echo "No profile file generated"
        fi
        ;;

    python)
        if [[ -z "$TARGET" ]]; then
            echo "Usage: ./quick-profile.sh python <script.py>"
            exit 1
        fi
        echo "=== Python Profiling ==="
        echo "Running: python -m cProfile $TARGET"
        echo ""
        python -m cProfile -s cumtime "$TARGET" 2>&1 | head -50
        ;;

    http)
        if [[ -z "$TARGET" ]]; then
            echo "Usage: ./quick-profile.sh http <url>"
            exit 1
        fi
        echo "=== HTTP Benchmark ==="
        echo "Target: $TARGET"
        echo ""
        if command -v ab &> /dev/null; then
            echo "Running: ab -n 100 -c 10 $TARGET"
            ab -n 100 -c 10 "$TARGET"
        elif command -v wrk &> /dev/null; then
            echo "Running: wrk -t4 -c100 -d10s $TARGET"
            wrk -t4 -c100 -d10s "$TARGET"
        else
            echo "Neither 'ab' nor 'wrk' found. Install one:"
            echo "  macOS: brew install httpd wrk"
            echo "  Linux: apt install apache2-utils"
        fi
        ;;

    *)
        echo "Unknown profile type: $PROFILE_TYPE"
        echo ""
        echo "Usage: ./quick-profile.sh [type] [target]"
        echo ""
        echo "Types:"
        echo "  system          - System resource overview (default)"
        echo "  node <script>   - Node.js CPU profiling"
        echo "  python <script> - Python cProfile"
        echo "  http <url>      - HTTP benchmark"
        exit 1
        ;;
esac

echo ""
echo "=== Profile Complete ==="
