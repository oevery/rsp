const tokenFromUrl = new URLSearchParams(location.hash.slice(1)).get('token')
if (tokenFromUrl) {
  sessionStorage.setItem('rsp-reading-token', tokenFromUrl)
  history.replaceState(null, '', location.pathname + location.search)
}
const token = sessionStorage.getItem('rsp-reading-token') ?? ''
export async function api(path: string, signal?: AbortSignal) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store' })
  if (!response.ok)
    throw new Error(await response.text())
  return response
}
