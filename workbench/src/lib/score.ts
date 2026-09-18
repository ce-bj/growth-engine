import type { ScoreLevel } from '../types'

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'pass'
  return 'poor'
}

export function scoreLevelLabel(level: ScoreLevel): string {
  switch (level) {
    case 'excellent':
      return '优秀'
    case 'good':
      return '良好'
    case 'pass':
      return '及格'
    case 'poor':
      return '较差'
  }
}

export function scoreLevelBadgeClass(level: ScoreLevel): string {
  switch (level) {
    case 'excellent':
      return 'badge badge--success'
    case 'good':
      return 'badge badge--info'
    case 'pass':
      return 'badge badge--warning'
    case 'poor':
      return 'badge badge--danger'
  }
}

export function scoreColor(score: number): string {
  const level = scoreLevel(score)
  switch (level) {
    case 'excellent':
      return 'var(--color-success)'
    case 'good':
      return 'var(--color-info)'
    case 'pass':
      return 'var(--color-warning)'
    case 'poor':
      return 'var(--color-danger)'
  }
}

export function bounceRateColor(rate: number): string {
  if (rate <= 50) return 'var(--color-success)'
  if (rate <= 65) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function inquiryRateColor(rate: number): string {
  if (rate > 5) return 'var(--color-success)'
  if (rate >= 2) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function formatDelta(current: number, previous: number): { text: string; up: boolean } {
  const diff = current - previous
  if (diff === 0) return { text: '持平', up: true }
  if (diff > 0) return { text: `↑+${diff}`, up: true }
  return { text: `↓${diff}`, up: false }
}
