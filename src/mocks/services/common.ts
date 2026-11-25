import { AUDIT_LIMIT, type Db } from '@/mocks/db'
import type { AuditEvent, Drain } from '@/domain/types'

export class ServiceError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const notFound = (what: string) =>
  new ServiceError(404, 'not_found', `${what} não encontrado`)

export const conflict = (code: string, message: string) => new ServiceError(409, code, message)

export function findDrain(db: Db, drainId: string): Drain {
  const drain = db.drains.find((item) => item.id === drainId)
  if (!drain) throw notFound('Bueiro')
  return drain
}

export function nextCode(db: Db, counter: keyof Db['counters'], prefix: string): string {
  db.counters[counter] += 1
  return `${prefix}-${String(db.counters[counter]).padStart(4, '0')}`
}

export function record(db: Db, event: Omit<AuditEvent, 'id' | 'createdAt'>, now: Date) {
  db.counters.audit += 1
  db.audit.push({ ...event, id: db.counters.audit, createdAt: now.toISOString() })
  if (db.audit.length > AUDIT_LIMIT) db.audit.splice(0, db.audit.length - AUDIT_LIMIT)
}
