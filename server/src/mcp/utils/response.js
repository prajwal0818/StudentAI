/**
 * Format a successful MCP tool response.
 * @param {any} data - The data to return
 * @returns {{ content: Array<{ type: string, text: string }> }}
 */
function success(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error MCP tool response.
 * @param {string} message - Error message
 * @returns {{ content: Array<{ type: string, text: string }>, isError: true }}
 */
function error(message) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

module.exports = { success, error };
