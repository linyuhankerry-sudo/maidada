# 麦搭搭 · 今天这餐，搭得刚刚好

面向选择困难的学生、上班族和小伙伴聚餐，用“人数 + 整单预算 + 口味”生成可解释的麦当劳套餐推荐。核心是由大模型宿主执行的 Skill：查询门店真实菜单、核对套餐构成，再调用官方计价工具比较候选。独立参赛项目，非官方产品。

## 当前完成情况

- 已实现：Skill 指令、MCP 查询/计价命令行客户端、带约束的离线推荐引擎、交互演示、自动测试和参赛文档。
- 已完成真实接入：清华大学澜园餐厅的门店、菜单、套餐详情与三份官方计价，见 [联调记录](LIVE_CHECK.md)。
- 待完成：优惠券/配送和宿主内 Skill 自动执行验证；创建公开 GitHub 仓库并报名。
- 演示页面不连接 MCP，不是大模型聊天界面；其中的餐品、价格、配送费均为虚构测试数据，不代表真实商品报价。
- 不自动领券、兑换积分或下单。不承诺全店最便宜，也不虚构优惠叠加。

## 体验演示


浏览器访问 (https://maidada-meal-match.chalky-degu-3340.chatgpt.site/) 。修改预算、人数、不吃辣、不喝可乐等选项，页面会重新计算。多人演示采用同一主食和饮品重复份数、薯条共享；异质化多人搭配由正式 Skill 根据菜单完成。

## 安装 Skill 和连接器

1. 在 https://open.mcd.cn/mcp 申请个人 Token，只在本地连接器/环境变量中保存。
2. 在支持 Skill 和 Streamable HTTP MCP 的宿主内导入 `skills/maidada` 文件夹。按宿主文档选择技能目录；例如 Codex 使用用户技能目录中的 `maidada/SKILL.md`。这份交付包不会自动修改本机配置。
3. 使用 `mcp-config.example.json` 配置连接器。`${MCD_MCP_TOKEN}` 是环境变量占位符，须由宿主支持的环境变量注入机制解析；如果宿主不支持该语法，在其私密设置界面输入凭证，不把真实配置提交到 GitHub。
4. 确认连接器启用且能列出 `query-meals`、`calculate-price` 等工具，再调用麦搭搭。

### 对话示例

“用麦搭搭帮我配一顿午饭，1 人总预算 35 元，到店取餐，不吃辣，不喝可乐。”

助手将补问门店/位置，读取菜单及当前可用券，核价后提供可比较的方案。

“两个人一共 60 元，想吃鸡肉，主食每人一份，饮品各一杯，薯条可以共享。”

“保持不吃辣和原预算，把第一份方案的饮品换掉，再算一下。”

## 开发与联调

Node.js 20+。演示和测试不依赖 npm 包；只有命令行 MCP 客户端需要安装依赖：

```sh
npm install
npm test
```

交付包也包含 `pnpm-lock.yaml`，复现本次依赖版本可使用 `pnpm install --frozen-lockfile`，已验证 SDK 1.32.1 的客户端模块可加载。

在本地安全地设置环境变量 `MCD_MCP_TOKEN` 后运行：

```sh
npm run mcp:tools
node scripts/mcp.mjs call query-meals private/menu-args.local.json
```

先发现实时工具 schema，再按返回的 inputSchema 创建本地参数 JSON。参数中的门店、餐品等编码必须来自前序真实查询，不提供猜测字段的示例。CLI 输出可能含个人信息，仅本地查看，发布前脱敏。CLI 的只读白名单阻止下单和领券工具；Skill 在宿主中使用连接器，无须经过 CLI。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| skills/maidada/SKILL.md | 可导入的推荐 Skill |
| demo/ | 零依赖离线演示和推荐引擎 |
| scripts/mcp.mjs | 官方 MCP 的查询及计价客户端 |
| tests/ | 预算、数量、忌口、费用及异常输入测试 |
| MCP_INTEGRATION.md | 接入流程及验证状态 |
| CONTEST_DECLARATION.md | 原样复制的官方参赛声明 |
| SUBMISSION.md | 报名草稿和剩余步骤 |

## 设计亮点

把“便宜”变成能核验的预算约束，把“推荐理由”落到真实的份数、口味和费用。以同一购物篮的有券/无券官方报价计算节省金额。无解时解释约束冲突；信息不足时明确未确认，不把估算包装成实时结果。

## 资料与使用范围

依据 2026-10-14 查阅的 [比赛仓库](https://github.com/M-China/mcd-developer-innovation-challenge)、[完整规则](https://github.com/M-China/mcd-developer-innovation-challenge/blob/main/activityGuidelines.md) 和 [MCP 指南](https://github.com/M-China/mcd-mcp-server)。规则可能更新，提交前复核。项目原创代码使用 MIT，官方声明、商标和第三方依赖不纳入该授权。使用 MCP 仍应遵守官方服务规则。

## 复用已配置的 WorkBuddy 连接

CLI 支持环境变量 `MCD_MCP_CONFIG` 指向你主动指定的本地 MCP JSON 配置。仅选择 URL 严格等于 `https://mcp.mcd.cn` 的服务，凭证只在进程内读取。它不会修改 WorkBuddy 配置。PowerShell 示例（不含 Token）：

```powershell
$env:MCD_MCP_CONFIG = Join-Path $env:USERPROFILE ".workbuddy/mcp.json"
node scripts/mcp.mjs list
```

若同时设置 `MCD_MCP_TOKEN`，优先使用该环境变量。配置加密、使用凭证引用或其他结构时，改用宿主连接器，不尝试解密。
