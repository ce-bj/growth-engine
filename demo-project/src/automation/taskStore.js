const PLAN_KEY = "ai-ops-automation-plans-v1";
const RUN_KEY = "ai-ops-automation-runs-v2";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function createPlanId() {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadPlans() {
  const plans = readJson(PLAN_KEY, []);
  return Array.isArray(plans)
    ? plans.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    : [];
}

export function savePlan(plan) {
  const plans = loadPlans();
  const now = Date.now();
  const next = {
    ...plan,
    updatedAt: now,
    createdAt: plan.createdAt || now,
  };
  const idx = plans.findIndex((p) => p.id === next.id);
  if (idx >= 0) plans[idx] = next;
  else plans.unshift(next);
  writeJson(PLAN_KEY, plans);
  return next;
}

export function togglePlan(planId, enabled) {
  const plans = loadPlans();
  const idx = plans.findIndex((p) => p.id === planId);
  if (idx < 0) return null;
  plans[idx] = { ...plans[idx], enabled: Boolean(enabled), updatedAt: Date.now() };
  writeJson(PLAN_KEY, plans);
  return plans[idx];
}

export function deletePlan(planId) {
  const plans = loadPlans().filter((p) => p.id !== planId);
  writeJson(PLAN_KEY, plans);
  return plans;
}

export function loadRuns() {
  const runs = readJson(RUN_KEY, []);
  return Array.isArray(runs)
    ? runs.sort((a, b) => (b.at || 0) - (a.at || 0))
    : [];
}

export function addRun(run) {
  const runs = loadRuns();
  const next = {
    id: run.id || `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: run.at || Date.now(),
    ...run,
  };
  runs.unshift(next);
  writeJson(RUN_KEY, runs.slice(0, 80));
  return next;
}

export function patchRun(runId, patch) {
  const runs = loadRuns();
  const idx = runs.findIndex((r) => r.id === runId);
  if (idx < 0) return null;
  runs[idx] = { ...runs[idx], ...patch };
  writeJson(RUN_KEY, runs);
  return runs[idx];
}

export function deleteRun(runId) {
  if (!runId) return loadRuns();
  const runs = loadRuns().filter((r) => r.id !== runId);
  writeJson(RUN_KEY, runs);
  return runs;
}

export function markRunsSessionDeleted(session) {
  if (!session) return loadRuns();
  const runs = loadRuns().map((r) => {
    const match = (session.runId && r.id === session.runId)
      || (session.id && r.sessionId === session.id);
    if (!match || r.sessionDeleted) return r;
    return { ...r, sessionDeleted: true };
  });
  writeJson(RUN_KEY, runs);
  return runs;
}
