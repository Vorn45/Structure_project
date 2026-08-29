// ======================================= >> Code Starts Here << ========================== //
/** Known MCP client identifiers → the display name shown for that agent. */
export const MCP_KNOWN_CLIENT_NAMES: Record<string, string> = {
    'claude-code': 'Claude Code',
    'claude-ai': 'Claude',
    'claude-desktop': 'Claude Desktop',
};

export const MCP_FALLBACK_CLIENT_NAME = 'MCP Agent';

/**
 * Resolves an MCP client's self-reported name (or its lower-cased identity key)
 * to the display name shown for that agent — shared by bot-identity creation
 * (McpBotUserService) and by anything that later reads a bot-attributed record
 * back out (e.g. ChatRoomService's task activity log) so both sides agree on
 * the same name for the same client.
 */
export function mcpClientDisplayName(clientName: string | undefined | null): string {
    const key = clientName?.trim().toLowerCase() || 'unknown';
    return MCP_KNOWN_CLIENT_NAMES[key] ?? (clientName?.trim() || MCP_FALLBACK_CLIENT_NAME);
}
