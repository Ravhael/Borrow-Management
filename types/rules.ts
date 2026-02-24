export type Comparator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte'

export type Condition = {
  field: string
  operator: Comparator
  value: string
}

export type NotificationRule = {
  id: string
  name: string
  enabled: boolean
  conditions: Condition[]
  template: string
  createdAt: string
  updatedAt?: string
}

export type RulesStore = NotificationRule[]
