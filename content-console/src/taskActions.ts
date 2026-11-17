import type { PublishTask, TaskStatus } from './types'

// 各状态「更多」下拉菜单项（任务列表页与首页任务卡共用，保持一致）
export interface MoreItem {
  key: string
  label: string
  danger?: boolean
}

export function moreItems(st: TaskStatus): MoreItem[] {
  switch (st) {
    case 'active':
      return [
        { key: 'pause', label: '暂停' },
        { key: 'cancel', label: '取消', danger: true },
        { key: 'copy', label: '复制' },
        { key: 'log', label: '日志' },
      ]
    case 'paused':
      return [
        { key: 'resume', label: '恢复' },
        { key: 'cancel', label: '取消', danger: true },
        { key: 'copy', label: '复制' },
        { key: 'log', label: '日志' },
      ]
    case 'done':
      return [
        { key: 'copy', label: '复制' },
        { key: 'log', label: '日志' },
      ]
    case 'draft':
      return [
        { key: 'edit', label: '编辑' },
        { key: 'copy', label: '复制' },
        { key: 'delete', label: '删除', danger: true },
      ]
    case 'pending':
      return [
        { key: 'edit', label: '编辑' },
        { key: 'copy', label: '复制' },
        { key: 'delete', label: '删除', danger: true },
      ]
    default:
      return [{ key: 'copy', label: '复制' }, { key: 'log', label: '日志' }]
  }
}

export type { PublishTask }
