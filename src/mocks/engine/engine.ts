import { mutate, readDb } from '@/mocks/db'
import { runAsLeader } from './leader'
import { runTick } from './tick'

function loop(): () => void {
  let timer: ReturnType<typeof setTimeout>
  let stopped = false

  const schedule = () => {
    const { tickMs, speed } = readDb().simulation
    timer = setTimeout(async () => {
      try {
        if (readDb().simulation.running) await mutate((db) => runTick(db, Math.random, new Date()))
      } catch (error) {
        console.error('Simulation tick failed', error)
      }
      if (!stopped) schedule()
    }, tickMs / speed)
  }
  schedule()

  return () => {
    stopped = true
    clearTimeout(timer)
  }
}

export function startEngine(): () => void {
  return runAsLeader(loop, navigator.locks, document)
}
