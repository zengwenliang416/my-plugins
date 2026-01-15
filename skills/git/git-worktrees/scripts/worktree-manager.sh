#!/bin/bash
# Git Worktree Manager
# Usage: ./worktree-manager.sh [command] [options]

set -e

COMMAND="${1:-help}"
shift 2>/dev/null || true

case "$COMMAND" in
    create)
        BRANCH="$1"
        BASE="${2:-main}"
        if [[ -z "$BRANCH" ]]; then
            echo "Usage: worktree-manager.sh create <branch> [base-branch]"
            exit 1
        fi

        REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
        WORKTREE_PATH="../${REPO_NAME}-${BRANCH//\//-}"

        echo "Creating worktree at: $WORKTREE_PATH"
        git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE"
        echo ""
        echo "cd $WORKTREE_PATH"
        ;;

    review)
        PR_NUM="$1"
        if [[ -z "$PR_NUM" ]]; then
            echo "Usage: worktree-manager.sh review <pr-number>"
            exit 1
        fi

        REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
        WORKTREE_PATH="../${REPO_NAME}-review-pr${PR_NUM}"

        echo "Fetching PR #$PR_NUM..."
        git fetch origin "pull/${PR_NUM}/head:pr-${PR_NUM}"
        git worktree add "$WORKTREE_PATH" "pr-${PR_NUM}"
        echo ""
        echo "cd $WORKTREE_PATH"
        ;;

    list)
        echo "=== Git Worktrees ==="
        git worktree list
        ;;

    cleanup)
        echo "=== Cleaning up worktrees ==="
        git worktree prune
        echo "Orphaned worktrees cleaned."
        echo ""
        git worktree list
        ;;

    remove)
        PATH_TO_REMOVE="$1"
        if [[ -z "$PATH_TO_REMOVE" ]]; then
            echo "Usage: worktree-manager.sh remove <path>"
            echo ""
            echo "Current worktrees:"
            git worktree list
            exit 1
        fi

        echo "Removing worktree: $PATH_TO_REMOVE"
        git worktree remove "$PATH_TO_REMOVE"
        ;;

    help|*)
        echo "Git Worktree Manager"
        echo ""
        echo "Usage: worktree-manager.sh <command> [options]"
        echo ""
        echo "Commands:"
        echo "  create <branch> [base]  Create worktree with new branch"
        echo "  review <pr-number>      Create worktree for PR review"
        echo "  list                    List all worktrees"
        echo "  remove <path>           Remove a worktree"
        echo "  cleanup                 Prune orphaned worktrees"
        echo ""
        echo "Examples:"
        echo "  ./worktree-manager.sh create feature/login main"
        echo "  ./worktree-manager.sh review 123"
        echo "  ./worktree-manager.sh remove ../my-app-feature-login"
        ;;
esac
