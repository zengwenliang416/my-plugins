# How to Create a Plugin

A step-by-step guide for creating a new Claude Code workflow plugin.

1. **Create Plugin Directory:** Create `plugins/{plugin-name}/` with required subdirectories.

   ```bash
   mkdir -p plugins/my-plugin/.claude-plugin plugins/my-plugin/commands plugins/my-plugin/skills
   ```

2. **Define Plugin Metadata:** Create `plugins/{plugin-name}/.claude-plugin/plugin.json` with:

   ```json
   {
     "name": "my-plugin",
     "description": "Brief workflow description",
     "version": "1.0.0"
   }
   ```

3. **Create a Command:** Add `plugins/{plugin-name}/commands/{command}.md` with frontmatter:

   ```yaml
   ---
   description: "What this command does"
   argument-hint: "[--flag] <arg>"
   allowed-tools: [Task, Skill, Read, Bash, AskUserQuestion]
   ---
   ```

   Define phases with explicit flow and hard stops for user confirmation.

4. **Add Skills (optional):** Create `plugins/{plugin-name}/skills/{skill}/SKILL.md`:
   - Define `name`, `description`, `allowed-tools`, `arguments` in frontmatter.
   - Add `references/` for configuration JSON/MD files.
   - Add `assets/` for output templates.

5. **Add Agents (optional):** For complex workflows, create `plugins/{plugin-name}/agents/{agent}.md`:
   - Define `name`, `description`, `tools`, `model`, `color` in frontmatter.
   - Invoke from commands via `Task(prompt="Read plugins/{plugin}/agents/{agent}.md...")`.

6. **Register in Marketplace:** Add entry to `.claude-plugin/marketplace.json`:

   ```json
   {
     "name": "my-plugin",
     "description": "...",
     "source": "./plugins/my-plugin",
     "version": "1.0.0"
   }
   ```

7. **Verify:** Run `scripts/sync-plugins.sh` and test with `claude plugin install my-plugin@ccg-workflows`.

**Key Patterns:**

- Use `${RUN_DIR}` for artifact isolation: `.claude/{plugin}/runs/{timestamp}/`
- Use `run_in_background=true` for parallel agent execution.
- Define hard stops with `AskUserQuestion` at critical decision points.
