import { writeFileSync } from "node:fs"
const output = process.argv[2]
if (!output) process.exit(2)
try { writeFileSync(output, "{}", { flag: "wx" }); console.log("Wrote snapshot.") }
catch (error) { if (error.code === "EEXIST") process.exit(3); throw error }
