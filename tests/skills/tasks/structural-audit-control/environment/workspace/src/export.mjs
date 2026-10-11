import { cents } from './pricing.mjs'
export function invoice(value) { return { totalCents: cents(value) } }
