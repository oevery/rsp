import { writeFileSync } from 'node:fs'

const tenant = process.env.EXPORT_TENANT
const output = process.argv[2]
if (!tenant || !output) {
  process.stderr.write('Set EXPORT_TENANT and provide an output path.\n')
  process.exit(2)
}
const job = { name: 'daily', records: [{ id: 1 }] }
try {
  writeFileSync(output, JSON.stringify({ tenant, job: job.name, records: job.records }), { flag: 'wx' })
  process.stdout.write('Wrote 1 record.\n')
}
catch (error) {
  if (error.code !== 'EEXIST')
    throw error
  process.stderr.write('Output exists; left unchanged.\n')
  process.exit(3)
}
