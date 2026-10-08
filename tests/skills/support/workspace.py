"""Check task write scope against its preserved index and user-note checks."""
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
