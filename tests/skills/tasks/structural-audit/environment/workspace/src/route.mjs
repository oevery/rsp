import { cents } from "./pricing.mjs"
export function preview(value) { return { totalCents: cents(value) } }
