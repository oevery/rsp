"""Run task assertions in isolation; infrastructure errors are never scores."""
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import traceback


def node_contract(path, *flags, cwd=None):
    # Verifier-owned resources must be present and parse before scoring the task.
    path.read_bytes()
    subprocess.run(["node", *flags, "--check", str(path)], cwd=cwd, check=True)
    result = subprocess.run(["node", *flags, str(path)], cwd=cwd, text=True, capture_output=True)
    assert result.returncode == 0, result.stdout + result.stderr
    print(result.stdout, end="")


def source_evidence(root, output, *areas):
    """Retain the actual editable corpus, including moved tests and helpers."""
    sources = {}
    for area in areas:
        for path in sorted((root / area).rglob("*")):
            if path.is_file():
                if not path.resolve().is_relative_to(root):
                    sources[path.relative_to(root).as_posix()] = "[outside workspace]"
                    continue
                try:
                    sources[path.relative_to(root).as_posix()] = path.read_text()
                except (UnicodeError, OSError) as error:
                    sources[path.relative_to(root).as_posix()] = "[unreadable: " + type(error).__name__ + "]"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(sources, indent=2))


def check_task(tests, workspace):
    log = Path(os.environ.get("RSP_LOG_DIR", "/logs/verifier")) / "check.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, "RSP_WORKSPACE": str(workspace),
           "RSP_BASELINE": os.environ.get("RSP_BASELINE", str(tests / "baseline.json"))}
    with log.open("w") as output:
        result = subprocess.run([sys.executable, "-B", __file__, str(tests / ".support/check.py")],
                                env=env, stdout=output, stderr=subprocess.STDOUT, timeout=120)
    if result.returncode not in (0, 1):
        raise RuntimeError(f"Task verifier failed (exit {result.returncode}); see {log}")
    return result.returncode == 0


def run_check(path):
    workspace = Path(os.environ.get("RSP_WORKSPACE", "/app")).resolve()
    # This is verifier-owned input, not an agent-produced artifact.
    json.loads(Path(os.environ.get("RSP_BASELINE", str(path.parent.parent / "baseline.json"))).read_text())
    sys.path.insert(0, str(path.parent))
    try:
        runpy.run_path(str(path), run_name="__main__")
    except AssertionError:
        traceback.print_exc()
        return 1
    except FileNotFoundError as error:
        # Missing task output is a failed task; missing tools/support are errors.
        missing = Path(error.filename) if error.filename else None
        if missing and missing.is_absolute() and missing.is_relative_to(workspace):
            traceback.print_exc()
            return 1
        raise
    return 0


if __name__ == "__main__":
    try:
        status = run_check(Path(sys.argv[1]).resolve())
    except Exception:
        traceback.print_exc()
        status = 2
    raise SystemExit(status)
