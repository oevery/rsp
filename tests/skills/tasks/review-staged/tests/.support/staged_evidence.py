"""Capture the actual reviewed Git versions before semantic judging."""
import os
from pathlib import Path
import subprocess


def collect(workspace, output):
    output.unlink(missing_ok=True)
    source = "src/discount.mjs"

    def git(*args):
        return subprocess.check_output(["git", *args], cwd=workspace, text=True)

    head = git("rev-parse", "HEAD").strip()
    before = git("show", f"HEAD:{source}")
    staged = git("show", f":{source}")
    diff = git("diff", "--cached", "--no-ext-diff", "--no-textconv", "--no-color", "HEAD", "--", source)
    numbered = "\n".join(f"{number}: {line}" for number, line in enumerate(staged.splitlines(), 1))
    evidence = (f"# Staged review evidence: {source}\n\n"
                f"## HEAD {head}\n{before}\n"
                f"## Index (1-based source lines)\n{numbered}\n\n"
                f"## HEAD to index diff\n{diff}")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(evidence)


if __name__ == "__main__":
    collect(Path(os.environ.get("RSP_WORKSPACE", "/app")),
            Path(os.environ.get("RSP_LOG_DIR", "/logs/verifier")) / "staged-review.md")
