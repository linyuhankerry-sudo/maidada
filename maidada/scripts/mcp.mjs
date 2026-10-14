import { readFile } from 'node:fs/promises';

const allowed = new Set(['now-time-info','query-nearby-stores','delivery-query-addresses','delivery-query-stores','query-meals','query-meal-detail','query-store-coupons','calculate-price','list-nutrition-foods','available-coupons']);
const [command, name, file] = process.argv.slice(2);
let client;
try {
  if (command !== 'list' && command !== 'call') throw new Error('用法：node scripts/mcp.mjs list 或 call <工具名> <参数.local.json>');
  if (command === 'call' && (!allowed.has(name) || !file)) throw new Error('仅允许查询/计价工具，且必须提供参数文件。');
  let token = process.env.MCD_MCP_TOKEN;
  if (!token && process.env.MCD_MCP_CONFIG) {
    const config = JSON.parse(await readFile(process.env.MCD_MCP_CONFIG,'utf8'));
    const entry = Object.values(config.mcpServers || {}).find(s => s.url === 'https://mcp.mcd.cn');
    const authorization = entry?.headers?.Authorization;
    if (typeof authorization === 'string' && /^Bearer\s+\S+/i.test(authorization) && !authorization.includes('${')) token = authorization.replace(/^Bearer\s+/i,'');
  }
  if (!token) throw new Error('缺少 MCD_MCP_TOKEN 环境变量。请在本地设置，不要写入代码。');
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  client = new Client({name:'maidada',version:'0.1.0'});
  await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.mcd.cn'), {requestInit:{headers:{Authorization:`Bearer ${token}`}}}));
  const tools = [];
  let cursor;
  do {
    const page = await client.listTools(cursor ? {cursor} : {});
    tools.push(...page.tools);
    cursor = page.nextCursor;
  } while (cursor);
  if (command === 'list') console.log(JSON.stringify(tools.filter(t=>allowed.has(t.name)), null, 2));
  else {
    if (!tools.some(t=>t.name===name)) throw new Error('服务端当前未提供该工具。');
    const args = JSON.parse(await readFile(file,'utf8'));
    const result = await client.callTool({name, arguments:args});
    console.log(JSON.stringify(result,null,2));
    if (result.isError || result.structuredContent?.success === false) process.exitCode = 1;
  }
} catch (error) {
  // SDK/network errors may include response content; avoid dumping credentials or account data.
  const safe = ['缺少','用法','仅允许','服务端当前'];
  console.error(safe.some(p=>error.message.startsWith(p)) ? error.message : 'MCP 调用失败。请检查网络、Token 有效期、工具 schema 和参数；账户数据未记录到日志。');
  process.exitCode = 1;
} finally { if (client) await client.close(); }
