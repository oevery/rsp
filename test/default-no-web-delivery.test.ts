import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { registerBrokerProject } from '../src/broker/client.js'
import { resolveBrokerPaths } from '../src/broker/host.js'
import { startBrokerServer } from '../src/broker/server.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

describe('default delivery without Web Observatory', () => {
  it('retains authored Web source without obsolete command, opener, or generated assets', () => {
    expect(existsSync(join(repositoryRoot, 'src', 'web', 'projection.ts'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'web', 'src', 'app.tsx'))).toBe(true)
    expect(existsSync(join(repositoryRoot, 'web', 'src', 'main.tsx'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'src', 'commands', 'web.ts'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'src', 'web', 'open.ts'))).toBe(false)
    expect(existsSync(join(repositoryRoot, 'web', 'static'))).toBe(false)
    const brokerServerSource = readFileSync(join(repositoryRoot, 'src', 'broker', 'server.ts'), 'utf8')
    const brokerSessionsSource = readFileSync(join(repositoryRoot, 'src', 'broker', 'sessions.ts'), 'utf8')
    expect(brokerServerSource).not.toMatch(/from ['"]\.\.\/web\//u)
    expect(brokerServerSource).not.toContain('publishManagedRuntime')
    expect(brokerSessionsSource).not.toMatch(/from ['"]\.\.\/web\//u)
    expect(brokerSessionsSource).not.toContain('publishManagedRuntime')
    const packageManifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'))
    expect(packageManifest.dependencies['mdast-util-from-markdown']).toBeUndefined()
    expect(packageManifest.dependencies['react-dom']).toBeUndefined()
    expect(packageManifest.devDependencies['mdast-util-from-markdown']).toMatch(/^\^2\./u)
    expect(packageManifest.devDependencies['react-dom']).toMatch(/^~19\./u)
  })

  it('keeps Broker project and runtime APIs while every Web route is absent', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-no-web-delivery-'))
    const projectRoot = join(fixture, 'project')
    await mkdir(projectRoot)
    await writeFile(join(projectRoot, 'README.md'), '# fixture\n')
    execFileSync('git', ['init', '-q'], { cwd: projectRoot })
    execFileSync('git', ['config', 'user.name', 'RSP Test'], { cwd: projectRoot })
    execFileSync('git', ['config', 'user.email', 'rsp-test@example.invalid'], { cwd: projectRoot })
    execFileSync('git', ['add', 'README.md'], { cwd: projectRoot })
    execFileSync('git', ['commit', '-qm', 'test: initialize fixture'], { cwd: projectRoot })

    const handle = await startBrokerServer({
      paths: resolveBrokerPaths({ root: join(fixture, 'cache') }),
      packageVersion: '0.0.0-no-web-fixture',
    })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })

    const health = await fetch(`${handle.record.endpoint}/v1/health`, {
      headers: { Authorization: `Bearer ${handle.record.controlToken}` },
    })
    expect(health.status).toBe(200)

    const registration = await registerBrokerProject(handle.record, projectRoot)
    const projectHeaders = { Authorization: `Bearer ${registration.accessToken}` }
    const project = await fetch(
      `${handle.record.endpoint}/v1/projects/${registration.project.projectId}`,
      { headers: projectHeaders },
    )
    expect(project.status).toBe(200)

    const capability = await fetch(
      `${handle.record.endpoint}/v1/projects/${registration.project.projectId}/runtime/manage/capability`,
      { headers: projectHeaders },
    )
    expect(capability.status).toBe(200)
    expect(await capability.json()).toMatchObject({
      ok: true,
      capability: {
        name: 'rsp.manage-runtime',
        version: { major: 1, minor: 0 },
      },
    })

    const runtimeWrite = await fetch(
      `${handle.record.endpoint}/v1/projects/${registration.project.projectId}/runtime/manage`,
      {
        method: 'POST',
        headers: {
          ...projectHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'observe-run',
          input: {
            runId: 'run-no-web-delivery',
            runKey: 'run-key-no-web-delivery',
            workRef: 'rsp-4-runtime/live-runtime-web-projection',
            managerId: 'manager-no-web-delivery',
            eventId: 'event-no-web-delivery',
            idempotencyKey: 'idem-no-web-delivery',
            phase: 'verification',
            authorityRefs: [
              '.rsp/changes/rsp-4-runtime/live-runtime-web-projection.md',
            ],
            evidenceRefs: ['test/default-no-web-delivery.test.ts'],
            observedAt: '2026-08-11T00:00:00.000Z',
          },
        }),
      },
    )
    expect(runtimeWrite.status).toBe(200)
    expect(await runtimeWrite.json()).toMatchObject({
      ok: true,
      capability: {
        name: 'rsp.manage-runtime',
        version: { major: 1, minor: 0 },
      },
      result: {
        event: {
          effect: {
            eventId: 'event-no-web-delivery',
            kind: 'manage-run-started',
          },
          duplicate: false,
        },
        run: {
          runId: 'run-no-web-delivery',
          workRef: 'rsp-4-runtime/live-runtime-web-projection',
        },
      },
    })

    const wrongMethod = await fetch(
      `${handle.record.endpoint}/v1/projects/${registration.project.projectId}/runtime/manage/capability`,
      { method: 'POST', headers: projectHeaders },
    )
    expect(wrongMethod.status).toBe(405)
    expect(await wrongMethod.json()).toMatchObject({
      error: {
        code: 'broker_method_not_allowed',
        message: 'Broker route requires GET',
      },
    })

    const wrongQuery = await fetch(
      `${handle.record.endpoint}/v1/projects/${registration.project.projectId}/runtime/manage/capability?web=absent`,
      { headers: projectHeaders },
    )
    expect(wrongQuery.status).toBe(400)
    expect(await wrongQuery.json()).toMatchObject({
      error: {
        code: 'broker_query_invalid',
        message: 'Broker query parameters do not match the route contract',
      },
    })

    const legacyWebRoutes = [
      { method: 'GET', path: `/web/${registration.project.projectId}/` },
      { method: 'GET', path: '/web/assets/app.css' },
      { method: 'GET', path: '/web/assets/app.js' },
      { method: 'POST', path: '/v1/web/bootstrap' },
      { method: 'POST', path: `/v1/projects/${registration.project.projectId}/web/bootstrap` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/snapshot` },
      { method: 'POST', path: `/v1/web/projects/${registration.project.projectId}/refresh` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/session` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/specs/detail?path=.rsp%2Fspecs%2Fdesign.md` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/specs/search?q=runtime` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/history/detail?historyId=legacy-history` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/runs/detail?runId=legacy-run` },
      { method: 'GET', path: `/v1/web/projects/${registration.project.projectId}/events` },
    ]
    for (const route of legacyWebRoutes) {
      const projectScoped = route.path.startsWith('/v1/projects/')
        || route.path.startsWith('/v1/web/projects/')
      const bootstrapExchange = route.path === '/v1/web/bootstrap'
      const response = await fetch(`${handle.record.endpoint}${route.path}`, {
        method: route.method,
        headers: bootstrapExchange
          ? {
              'Content-Type': 'application/json',
              'Origin': handle.record.endpoint,
            }
          : projectScoped
            ? projectHeaders
            : {},
        ...(bootstrapExchange
          ? {
              body: JSON.stringify({
                projectId: registration.project.projectId,
                bootstrapToken: 'x'.repeat(32),
              }),
            }
          : {}),
      })
      expect(response.status, `${route.method} ${route.path}`).toBe(404)
      expect(await response.json(), `${route.method} ${route.path}`).toMatchObject({
        error: { code: 'broker_route_not_found' },
      })
    }
  })
})
