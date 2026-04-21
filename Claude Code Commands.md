# Claude Code — Slash Commands

> [!tip] How to use
> Type `/` in the chat to see available commands. Arguments in `<brackets>` are required, `[brackets]` are optional.

---

## 🗂 Session

| Command | What it does |
|---|---|
| `/clear` | Wipe conversation history and start fresh |
| `/compact [instructions]` | Compress history to free up context space |
| `/branch [name]` | Fork the conversation at this point |
| `/resume [session]` | Pick up a previous session by name or ID |
| `/rename [name]` | Name the current session |
| `/rewind` | Roll back to a previous point in the conversation |

---

## 🤖 Model & Performance

| Command | What it does |
|---|---|
| `/model [model]` | Switch to a different Claude model |
| `/fast [on\|off]` | Toggle fast mode (same model, faster output) |
| `/effort [level]` | Set effort level — `low` `medium` `high` `max` |

---

## 🛠 Code & Workflow

| Command | What it does |
|---|---|
| `/plan [description]` | Enter planning mode before making changes |
| `/simplify [focus]` | Review code for quality, reuse, and efficiency |
| `/security-review` | Scan pending changes for vulnerabilities |
| `/diff` | Open interactive diff viewer for uncommitted changes |
| `/init` | Create a `CLAUDE.md` guide for the current project |
| `/loop [interval] [prompt]` | Run a prompt repeatedly on a schedule |

---

## 📁 Files & Context

| Command | What it does |
|---|---|
| `/add-dir <path>` | Add another folder for Claude to work in |
| `/context` | See how much context window is being used |
| `/copy [N]` | Copy last response to clipboard |
| `/export [filename]` | Save the conversation as a text file |

---

## ⚙️ Config & Settings

| Command | What it does |
|---|---|
| `/config` | Open settings (alias: `/settings`) |
| `/memory` | Edit memory files (`CLAUDE.md` and auto-memory) |
| `/permissions` | Manage what tools Claude is allowed to use |
| `/hooks` | View configured event hooks |
| `/keybindings` | Edit keyboard shortcuts |
| `/theme` | Change the colour theme |

---

## 📊 Info & Usage

| Command | What it does |
|---|---|
| `/status` | Show version, model, and account info |
| `/cost` | Show token usage for this session |
| `/usage` | Show plan limits and rate limit status |
| `/stats` | Visualise daily usage and streaks |
| `/help` | Full list of available commands |

---

## 🔌 Integrations

| Command | What it does |
|---|---|
| `/mcp` | Manage MCP server connections |
| `/ide` | Manage IDE integration status |
| `/install-github-app` | Set up Claude in GitHub Actions |
| `/login` / `/logout` | Anthropic account auth |

---

> [!note] Most used day-to-day
> `/clear` `/compact` `/plan` `/init` `/cost`
