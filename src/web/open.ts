import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseLoopbackEndpoint } from '../broker/host.js'
import { BrokerError } from '../broker/protocol.js'

const execFileAsync = promisify(execFile)

export async function openWebBrowser(url: string, platform: NodeJS.Platform = process.platform): Promise<void> {
  const parsed = new URL(url)
  parseLoopbackEndpoint(parsed.origin)
  if (!/^\/web\/[a-f0-9]{64}\/$/u.test(parsed.pathname)
    || parsed.search
    || !/^#bootstrap=[\w-]{32,128}$/u.test(parsed.hash)) {
    throw new BrokerError('web_url_invalid', 'Web Observatory URL is invalid')
  }

  const command = platform === 'darwin'
    ? 'open'
    : platform === 'win32'
      ? 'rundll32.exe'
      : 'xdg-open'
  const args = platform === 'win32'
    ? ['url.dll,FileProtocolHandler', url]
    : [url]
  try {
    await execFileAsync(command, args, {
      timeout: 5_000,
      windowsHide: true,
    })
  }
  catch {
    throw new BrokerError('web_browser_open_failed', 'Unable to open the default browser')
  }
}
