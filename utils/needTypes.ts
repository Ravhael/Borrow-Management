export enum NeedType {
  DEMO_PRODUCT = 'DEMO_PRODUCT',
  BARANG_BACKUP = 'BARANG_BACKUP',
  ANALISA_TESTING = 'ANALISA_TESTING',
  DEMO_SHOWROOM = 'DEMO_SHOWROOM',
  PAMERAN_EVENT = 'PAMERAN_EVENT',
  PERPANJANGAN = 'PERPANJANGAN',
  LAINNYA = 'LAINNYA',
}

export const NeedTypeLabels: Record<NeedType, string> = {
  [NeedType.DEMO_PRODUCT]: 'Demo Product',
  [NeedType.BARANG_BACKUP]: 'Barang Backup',
  [NeedType.ANALISA_TESTING]: 'Analisa & Testing Product',
  [NeedType.DEMO_SHOWROOM]: 'Demo di Showroom',
  [NeedType.PAMERAN_EVENT]: 'Pameran / Event',
  [NeedType.PERPANJANGAN]: 'Perpanjangan',
  [NeedType.LAINNYA]: 'Kebutuhan Lainnya',
}

export const getNeedTypeLabel = (needType?: string | null) => {
  if (!needType) return ''
  const key = needType as NeedType
  return NeedTypeLabels[key] || needType
}
