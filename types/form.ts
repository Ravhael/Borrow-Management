import { PickupMethod } from '../utils/pickupMethods'

export type FormDataShape = {
  borrowerName?: string
  entitasId?: string
  borrowerPhone?: string
  borrowerEmail?: string
  needType?: string
  company?: string[]
  outDate?: string
  useDate?: string
  returnDate?: string
  productDetailsText?: string
  // allow empty string while user is filling the form
  pickupMethod?: PickupMethod | ''
  note?: string
  approvalAgreementFlag?: boolean
  lainnya?: string
  // demo & backup optional nested fields
  // unified dynamic fields per need type
  needDetails?: Record<string, any>
  // legacy compatibility: older code may still write to demo/backup/lainnya keys
  demo?: Record<string, any>
  backup?: Record<string, any>
  [key: string]: any
}
