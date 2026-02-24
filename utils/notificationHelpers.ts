import { NotificationRule } from '../types/rules'

const LS_KEY = 'notification_rules_v1'

export function loadRules(): NotificationRule[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) { return [] }
}

export function saveRules(rules: NotificationRule[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rules))
}