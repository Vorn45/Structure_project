# MCP Server

Exposes PMS tasks and chat to external AI agents (Claude Code, Claude Desktop, …)
over the [Model Context Protocol](https://modelcontextprotocol.io). An agent
connects with a long-lived API key and acts as the user who minted it — it sees
exactly what that user sees, and nothing more.

## Endpoints

| Method | Path              | Auth        | Purpose                          |
| ------ | ----------------- | ----------- | -------------------------------- |
| `POST` | `/api/mcp`        | MCP API key | The MCP endpoint agents connect to |
| `GET`  | `/api/mcp/keys`   | JWT         | List your keys                   |
| `POST` | `/api/mcp/keys`   | JWT         | Mint a key                       |
| `DELETE` | `/api/mcp/keys/:id` | JWT     | Revoke a key                     |

`/api/mcp` is excluded from `JwtMiddleware` (see `AppModule.configure`) because
agents authenticate with a key rather than a session token. `/api/mcp/keys` is
not excluded — a key can only ever be minted from a real logged-in session.

## Setup

### 1. Create the table

Migrations are disabled in this project, so apply the SQL by hand:

```bash
psql "$DATABASE_URL" -f src/database/add-mcp-api-keys.sql
```

(Or set `DB_SYNCHRONIZE=true` in a local `.env` and let TypeORM create it.)

### 2. Mint a key

```bash
curl -X POST http://localhost:3200/api/mcp/keys \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Claude Code"}'
```

The response contains `data.key`, e.g. `pms_mcp_hZ3…`. **It is shown once** —
only its SHA-256 digest is stored, so it cannot be recovered later. Mint a new
one if you lose it.

The key snapshots the role and organization you were acting as. If that role is
later removed from your account, the key stops working rather than silently
falling back to another one.

### 3. Point an agent at it

```bash
claude mcp add --transport http pms http://localhost:3200/api/mcp \
  --header "Authorization: Bearer pms_mcp_…"
```

Revoke from the key list at any time; revocation takes effect on the next call.

## Tools

Task tools read **and write**. Chat tools are mostly **read-only**, with one
write tool — `post_task_chat_message` — gated behind the `chat:write` scope.

| Tool                      | Kind  | Purpose                                             |
| ------------------------- | ----- | --------------------------------------------------- |
| `get_setup_options`       | read  | Status / priority / type / project / member lookups |
| `list_my_tasks`           | read  | Tasks assigned to you                               |
| `list_unconfirmed_tasks`  | read  | Tasks awaiting your confirmation                    |
| `search_tasks`            | read  | Keyword + filter search                             |
| `get_task`                | read  | Full task detail                                    |
| `create_task`             | write | Create a task                                       |
| `update_task`             | write | Update task fields                                  |
| `update_task_status`      | write | Move a task between statuses                        |
| `list_chat_rooms`         | read  | Your task chat rooms                                |
| `read_task_chat`          | read  | One task chat's history                             |
| `list_chat_notifications` | read  | Your organization chat rooms                        |
| `read_organization_chat`  | read  | One organization chat's history                     |
| `post_task_chat_message`  | write | Post a message into a task's chat, e.g. a report    |

Status, priority and type ids vary per organization, so an agent should call
`get_setup_options` before writing.

### Bot attribution for `post_task_chat_message`

A message posted by an agent is **not** attributed to the human who owns the
API key — it renders as coming from a bot identity named `"<Client> · <Owner's
name>"` (e.g. `"Claude Code · KREN SELA"`), one per (MCP client, key owner)
pair, so it shows up as a distinct incoming message rather than looking like
the key owner typed it themselves, while still making clear whose agent it
was.

The `<Client>` half of the name comes from, in order:
1. An `X-MCP-Client-Name` request header — set this once in the client's own
   connection config (e.g. the `headers` object for the `pms` server in
   `~/.claude.json`, alongside `Authorization`) for a name that's always
   correct. This is the recommended way to set it.
2. The MCP `initialize` handshake's `clientInfo.name` (`getClientVersion()`),
   used only if no header was sent. Unreliable under this stateless
   transport — see the design note below — so don't rely on it.
3. `MCP Agent`, if neither is available.

Every bot account can share one avatar per client via `McpBotUserService.setClientAvatar(clientName, fileId)` — a one-off call (not wired to any endpoint yet) that uploads a `file` row and applies it to every existing and future bot for that client.

- `McpBotUserService` lazily creates one real `user` row per distinct client
  name (table `user.mcp_bot_identities` maps client name → that row) and
  reuses it after. That user is never added to any project, organization, or
  chat room — it is only ever referenced as a message's `sender_id` — so it
  can't leak into member directories, assignee pickers, or another
  organization's data.
- **Access is still checked against the real key owner.** `ChatRoomService.sendTaskChatMessage`
  resolves and authorizes the room exactly as `sendMessage` always has (the
  human must have project access); only the persisted message's sender —
  and therefore how it renders — is swapped to the bot identity via `sendMessage`'s
  `senderOverride` parameter.
- Apply `add-mcp-bot-identities.sql` before deploying this (same "migrations
  are disabled, apply by hand" rule as `add-mcp-api-keys.sql`).
- An existing key needs `chat:write` re-minted onto it (alongside `chat:read`)
  to use this tool — it is not in `DEFAULT_MCP_SCOPES`.

## Design notes

- **Tools call the same shared services as the web app** (`TaskService`,
  `TaskDetailService`, `ChatRoomService`, `OrganizationMessageService`), so
  project-access checks are enforced identically. There is no separate query
  path that could drift from the app's permission rules.
- **Reads never mark chat as read.** Both chat `detail()` methods take a
  `markRead` flag that the MCP tools pass as `false`. Without it, an agent
  skimming history would clear the owner's unread badge and broadcast a "seen"
  receipt to their teammates for a message they never opened.
- **The transport is stateless** — a fresh `McpServer` per request — so two
  agents holding two different keys can never share a user context. This also
  means `getClientVersion()` (the MCP `initialize` handshake's client name) is
  only populated when a client's `initialize` call and its tool call land in
  the same request; in practice they usually don't, which is why bot naming
  prefers the `X-MCP-Client-Name` header instead — a header is present on
  every request, handshake or not.
- **`McpController` uses non-passthrough `@Res()`** so the transport writes the
  response itself. This is deliberate: `SnakeCaseResponseInterceptor` would
  otherwise rewrite MCP's camelCase protocol fields (`protocolVersion`,
  `serverInfo`, `isError`, …) and break every client.
