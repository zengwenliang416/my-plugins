# How to Create a Plugin

A step-by-step guide to creating a new Claude Code workflow plugin.

1. **Create the plugin directory structure:**

   ```
   plugins/<plugin-name>/
   ├── .claude-plugin/
   │   └── plugin.json        # Required: Plugin metadata
   ├── commands/              # Optional: Slash command definitions
   │   └── <command>.md
   ├── agents/                # Optional: Sub-task workers
   │   └── <agent>.md
   ├── skills/                # Optional: Atomic skill definitions
   │   └── <skill-name>/
   │       └── SKILL.md
   └── hooks/                 # Optional: Lifecycle hooks
       └── hooks.json
   ```

2. **Create plugin.json metadata:** `plugins/<name>/.claude-plugin/plugin.json`

   ```json
   {
     "name": "<plugin-name>",
     "description": "Brief description of the plugin",
     "version": "1.0.0"
   }
   ```

3. **Create command files:** `plugins/<name>/commands/<command>.md`
   - Frontmatter: `description`, `argument-hint`, `allowed-tools`
   - Define workflow phases with hard stops at user decision points
   - Reference: `plugins/commit/commands/commit.md:1-5`

4. **Create SKILL.md files:** `plugins/<name>/skills/<skill>/SKILL.md`
   - Required frontmatter: `name`, `description`, `arguments`
   - Description format (4-part): `【触发条件】`, `【核心产出】`, `【不触发】`, `【先问什么】`
   - Max 500 lines per SKILL.md
   - Optional subdirs: `references/`, `assets/`, `scripts/`
   - Reference: `plugins/commit/skills/change-collector/SKILL.md:1-13`

5. **Create hooks.json (if needed):** `plugins/<name>/hooks/hooks.json`
   - 5 lifecycle points: `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Notification`
   - Use regex matchers (e.g., `Write|Edit|MultiEdit`, `mcp__.*`)
   - Configure timeouts (3-30s) and `async: true` for non-blocking hooks
   - Reference: `plugins/hooks/hooks/hooks.json:1-122`

6. **Register in marketplace:** `.claude-plugin/marketplace.json`

   ```json
   {
     "name": "<plugin-name>",
     "description": "...",
     "source": "./plugins/<plugin-name>",
     "version": "1.0.0"
   }
   ```

7. **Validate and install:**
   ```bash
   ./scripts/validate-skills.sh      # Check SKILL.md frontmatter & structure
   ./scripts/sync-plugins.sh -i      # Sync to cache and install
   ```

**Verification:** Run `./scripts/sync-plugins.sh -l` to confirm plugin appears with correct counts.
