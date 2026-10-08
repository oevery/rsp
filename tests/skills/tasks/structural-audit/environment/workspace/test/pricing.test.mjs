import assert from "node:assert/strict"
import { cents } from "../src/pricing.mjs"
assert.equal(cents(1.239),124)
