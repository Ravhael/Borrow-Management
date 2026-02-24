export enum PickupMethod {
  SELF_PICKUP = 'SELF_PICKUP',
  WAREHOUSE_DELIVERY = 'WAREHOUSE_DELIVERY',
  THIRD_PARTY = 'THIRD_PARTY',
}

export const PickupMethodLabels: Record<PickupMethod, string> = {
  [PickupMethod.SELF_PICKUP]: 'Self Pickup / Ambil sendiri',
  [PickupMethod.WAREHOUSE_DELIVERY]: 'Dikirim oleh pihak gudang',
  [PickupMethod.THIRD_PARTY]: 'Menggunakan pihak ketiga',
}

export const getPickupMethodLabel = (method?: string | null) => {
  if (!method) return ''
  const key = method as PickupMethod
  return PickupMethodLabels[key] || method
}
