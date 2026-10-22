"""Prepare isolated fixtures and check their preserved workspace boundaries."""
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess


def allowed_changes(root, allowed=(), untracked=("untracked-note.txt",)):
    # Callers separately preserve history, index and these pre-existing notes.
    exclusions = (*allowed, "staged-note.txt", "unstaged-note.txt", "user-notes.txt")
    result = subprocess.run(["git", "diff", "--quiet", "--", ".",
                             *(":(exclude)" + path for path in exclusions)], cwd=root)
    if result.returncode not in (0, 1):
        raise RuntimeError("Unable to inspect task workspace diff")
    assert result.returncode == 0, "Task changed undeclared tracked files"
    check_added(root, allowed, untracked)


def readonly_changes(root, baseline_diff, outputs=("report.json",), untracked=("untracked-note.txt",)):
    diff = subprocess.check_output(["git", "diff", "--binary", "HEAD"], cwd=root, text=True).strip()
    assert diff == baseline_diff, "Read-only tracked product changed"
    check_added(root, outputs, untracked)


def check_added(root, allowed, untracked):
    files = subprocess.check_output(["git", "ls-files", "--others", "-z"], cwd=root, text=True)
    added = set(files.split(chr(0))) - {""}
    unexpected = {p for p in added if p not in {*allowed, *untracked}
                  and not p.startswith(("tmp/", ".cache/"))}
    assert not unexpected, "Task added undeclared files: " + ", ".join(sorted(unexpected))


def initialize_fixture(root, initial_files=None):
    """Initialize the four outcome fixtures with reproducible local history."""
    root = Path(root).resolve()
    assert not (root / ".git").exists(), "Fixture already initialized"
    os.environ.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
                      GIT_AUTHOR_DATE="2026-10-16T00:00:00+00:00",
                      GIT_COMMITTER_DATE="2026-10-16T00:00:00+00:00")
    for name, content in (initial_files or {}).items():
        (root / name).write_text(content)
    for path in root.rglob("*"):
        if path.is_file():
            path.chmod(0o644)
    for args in (("init", "-q", "--initial-branch=main", "--object-format=sha1"),
                 ("config", "user.name", "Fixture"),
                 ("config", "user.email", "fixture@example.invalid"),
                 ("add", "--all"),
                 ("-c", "commit.gpgsign=false", "commit", "-qm", "Synthetic boundary regression baseline")):
        subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)


def prepare_upgrade_evidence(root, expected_exit):
    """Execute the checkpoint fixture's real setup checks, never model evidence."""
    root = Path(root).resolve()
    (root / "src/value.mjs").write_text("export const value = 2\n")
    result = subprocess.run(["node", "tools/check.mjs"], cwd=root, text=True, capture_output=True)
    assert result.returncode == expected_exit, result.stdout + result.stderr
    inputs = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()
              for name in ("src/value.mjs", "tools/check.mjs", "CONTEXT.md")}
    (root / "evidence.json").write_text(json.dumps({
        "origin": "fixture setup execution, not model execution", "command": "node tools/check.mjs",
        "exitCode": result.returncode, "stdout": result.stdout, "stderr": result.stderr, "inputs": inputs,
    }, indent=2) + "\n")
    cli = shlex.split(os.environ.get("RSP_FIXTURE_CLI", "rsp"))
    cli_env = {**os.environ, "NO_COLOR": "1"}
    cli_env.pop("FORCE_COLOR", None)
    result = subprocess.run([*cli, "ready", "value-change", "--json"], cwd=root,
                            text=True, capture_output=True, env=cli_env)
    diagnostic = result.stdout + result.stderr
    assert result.returncode != 0 and ".rsp/specs/design.md is missing" in diagnostic, diagnostic
    assert "run rsp init" in diagnostic and "Run: rsp update" not in diagnostic, diagnostic
    (root / "inspection.json").write_text(json.dumps({
        "origin": "fixture setup execution", "command": "rsp ready value-change --json",
        "exitCode": result.returncode, "stdout": result.stdout, "stderr": result.stderr,
    }, indent=2) + "\n")


def snapshot_fixture(root, baseline):
    """Add the existing dirty notes and record immutable regular-file inputs."""
    root = Path(root).resolve()
    (root / "user-notes.txt").write_text("User working note: preserve.\n")
    (root / "draft.txt").write_text("User draft: preserve.\n")
    files = {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
             for p in root.rglob("*") if p.is_file() and ".git" not in p.parts}
    def git(*args):
        return subprocess.check_output(["git", *args], cwd=root, text=True).strip()
    Path(baseline).write_text(json.dumps({"head": git("rev-parse", "HEAD"),
                                        "index": git("ls-files", "--stage"), "files": files},
                                       indent=2, sort_keys=True) + "\n")


def preserve_snapshot(root, baseline, allowed=(), git_unchanged=True):
    """Check a snapshot_fixture baseline; temporary output remains allowed."""
    root = Path(root).resolve()
    for name, digest in baseline["files"].items():
        if name in allowed or name.startswith(("tmp/", ".cache/")):
            continue
        path = root / name
        assert path.is_file() and not path.is_symlink(), "Preserved input missing or replaced: " + name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == digest, "Input changed: " + name
    check_added(root, allowed, baseline["files"])
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root, text=True)
    assert not set(tracked.split(chr(0))) - {""} - set(baseline["files"]) - set(allowed), "Undeclared tracked files"
    untracked = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard", "-z"],
                                        cwd=root, text=True).split(chr(0))
    assert "draft.txt" in untracked, "User draft was staged or removed"
    if git_unchanged:
        for args, expected in ((("rev-parse", "HEAD"), baseline["head"]),
                               (("ls-files", "--stage"), baseline["index"])):
            actual = subprocess.check_output(["git", *args], cwd=root, text=True).strip()
            assert actual == expected, "Git state changed: " + " ".join(args)
