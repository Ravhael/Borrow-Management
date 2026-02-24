export interface EntitasEmails {
  Head: string
  Finance: string
  Admin: string
  Others: string
}

export interface EntitasJsonEntry {
  id: number | string
  name: string
  code: string
  description?: string | null
  isActive?: boolean
  directorateId?: number | null
  emails?: Partial<EntitasEmails> | EntitasEmails | null
}

export interface EntitasOption {
  id: number | string
  value: string // code
  label: string // name
  description: string
  isActive: boolean
  directorateId: number | null
  emails: EntitasEmails
}
