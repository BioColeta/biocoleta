/** Only paths inside the panel are accepted, so a crafted link cannot send the user elsewhere. */
export function internalTarget(redirect: string | undefined) {
  const url = new URL(redirect ?? '', 'http://internal')
  const inside = url.origin === 'http://internal' && url.pathname.startsWith('/app/')
  return {
    to: inside ? url.pathname : '/app/dashboard',
    search: inside ? Object.fromEntries(url.searchParams) : {},
  }
}
