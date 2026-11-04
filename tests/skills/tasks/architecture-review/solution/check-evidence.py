"""Retain the real Oracle command result on the captured stderr stream."""
import json
import os
import subprocess
import sys

command = sys.argv[1:]
result = subprocess.run(command)
record = json.dumps({"command": command, "exit_code": result.returncode})
# Only the maintained subprocess recorder writes this calibration artifact;
# arbitrary stdout and report receipts do not become execution observations.
if path := os.environ.get("RSP_ORACLE_CHECKS"):
    with open(path, "a") as stream:
        stream.write(record + "\n")
print(record, file=sys.stderr, flush=True)
raise SystemExit(result.returncode)
