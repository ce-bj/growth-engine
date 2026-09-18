import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputsRoot = path.resolve(projectRoot, "..");
const bundledAgents = path.join(projectRoot, "agents-workspace");
const agentsWorkspace = existsSync(path.join(bundledAgents, "ai_ops_assistant"))
  ? bundledAgents
  : path.resolve(outputsRoot, "agents-workspace");
const isWin = process.platform === "win32";
const pythonPath = isWin
  ? `${projectRoot};${agentsWorkspace};${outputsRoot}`
  : `${projectRoot}:${agentsWorkspace}:${outputsRoot}`;

function loadEnvFile(envPath) {
  const env = {};
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

const serverEnv = loadEnvFile(path.join(projectRoot, ".env.server"));

const bundledVenvPython = isWin
  ? path.join(projectRoot, ".venv", "Scripts", "python.exe")
  : path.join(projectRoot, ".venv", "bin", "python");
const agentscopeVenvPython = isWin
  ? path.join(outputsRoot, "agentscope", ".venv", "Scripts", "python.exe")
  : path.join(outputsRoot, "agentscope", ".venv", "bin", "python");
const pythonBin = existsSync(bundledVenvPython)
  ? bundledVenvPython
  : existsSync(agentscopeVenvPython)
    ? agentscopeVenvPython
    : "python";

function run(name, command, args, extraEnv = {}, cwd = projectRoot) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWin,
    cwd,
    env: {
      ...process.env,
      ...serverEnv,
      PYTHONPATH: pythonPath,
      ...extraEnv,
    },
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      if (code === 1 && (name === "chat-server" || name === "agent-bridge")) {
        console.error(
          `[${name}] 端口可能被旧进程占用。请先执行: netstat -ano | findstr "8787" 和 findstr "8790"，再用 taskkill /PID <pid> /F 结束旧进程后重试。`,
        );
      }
    }
  });

  child.on("error", (err) => {
    console.error(`[${name}] failed to start:`, err.message);
  });

  return child;
}

const usePythonAgent = Boolean(serverEnv.AGENT_PYTHON_URL);

const growthEngineRoot = path.resolve(outputsRoot, "growth-engine");
const marketingFrontendRoot = path.resolve(outputsRoot, "marketing-frontend");
const startMarketingFrontend = existsSync(path.join(marketingFrontendRoot, "package.json"));

const children = [
  ...(usePythonAgent
    ? [run("agent-bridge", pythonBin, ["server/agent-bridge/bridge.py"])]
    : []),
  run("chat-server", "node", ["server/chat-server.js"]),
  run("vite", "npm", ["run", "dev"]),
  run("growth-engine", "npm", ["run", "dev"], {}, growthEngineRoot),
  ...(startMarketingFrontend
    ? [
        run(
          "marketing-frontend",
          "npm",
          ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5186", "--strictPort"],
          {},
          marketingFrontendRoot,
        ),
      ]
    : []),
];

function shutdown() {
  for (const child of children) child.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  usePythonAgent
    ? `Starting Python Agent bridge (${serverEnv.AGENT_PYTHON_URL}) + chat server + Vite`
    : "Starting chat server + Vite (mock or AgentScope mode)",
);
console.log(
  `API Key: ${serverEnv.OPENAI_API_KEY || serverEnv.VVEAI_API_KEY ? "已加载" : "未配置，请编辑 .env.server"}`,
);
console.log(
  `Agent module: ${serverEnv.PYTHON_AGENT_MODULE || "ai_ops_assistant"}`,
);
console.log("增长工作台原型: http://127.0.0.1:5176/");
console.log(
  startMarketingFrontend
    ? "智能营销页智能体: http://127.0.0.1:5186/"
    : "未找到 marketing-frontend，智能营销页模块将无法嵌入",
);
