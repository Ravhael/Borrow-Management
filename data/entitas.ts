// entitas.ts now imports the canonical snapshot in data/entitas.json
// and exports two things:
// - entitasOptions: runtime-friendly list derived from the JSON snapshot
// - defaultEntitas: a single default object/shape matching the JSON structure
import entitasJson from './entitas.json'
import type { EntitasJsonEntry, EntitasOption, EntitasEmails } from '../types/entitas'

// ensure JSON import is treated as the expected JSON shape, then produce a
// runtime-friendly typed list for UI consumers
const raw = entitasJson as unknown as EntitasJsonEntry[]

function normalizeEmails(e?: Partial<EntitasEmails> | null): EntitasEmails {
  return {
    Head: (e && (e.Head ?? '')) || '',
    Finance: (e && (e.Finance ?? '')) || '',
    Admin: (e && (e.Admin ?? '')) || '',
    Others: (e && (e.Others ?? '')) || ''
  }
}

export const entitasOptions: EntitasOption[] = raw.map((e) => ({
  id: e.id,
  value: String(e.code),
  label: e.name,
  description: String(e.description ?? ''),
  isActive: e.isActive ?? true,
  directorateId: e.directorateId ?? null,
  emails: normalizeEmails(e.emails)
}))

export const defaultEntitas: EntitasOption = {
  id: 0,
  value: '',
  label: '',
  description: '',
  emails: normalizeEmails(),
  isActive: true,
  directorateId: null
}
// original static array removed to keep entitas.ts focused on JSON-derived data and the default template.