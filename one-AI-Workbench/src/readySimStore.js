const KEY = 'ai-ready-sim-sessions'

export const SIM_SESSIONS_EVENT = 'ai-ready-sim-sessions'

export function loadSimSessions() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSimSessions(sessions) {
  sessionStorage.setItem(KEY, JSON.stringify(sessions))
  window.dispatchEvent(new CustomEvent(SIM_SESSIONS_EVENT))
}

export function addSimSession(session) {
  const current = loadSimSessions().filter((item) => item.id !== session.id)
  writeSimSessions([session, ...current])
}

export function removeSimSession(id) {
  writeSimSessions(loadSimSessions().filter((item) => item.id !== id))
}
