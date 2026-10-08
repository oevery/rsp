"""Build the actual RSP CLI and the pinned evaluation image."""
from pathlib import Path
import shutil
import subprocess
import json
import re

ROOT = Path(__file__).resolve().parents[2]
HOME = ROOT / "tests/skills"
BUILD = HOME / ".build"


def command(*args):
    subprocess.run(args, cwd=ROOT, check=True)


def resolved_versions():
    versions = {}
    for tool, args in {"node": ["--version"], "pnpm": ["--version"],
                       "python": ["-c", "import platform; print(platform.python_version())"]}.items():
        version = subprocess.check_output(["mise", "exec", "--", tool, *args], cwd=ROOT, text=True).strip().removeprefix("v")
        if not re.fullmatch(r"\d+\.\d+\.\d+", version):
            raise ValueError(f"Expected an installed release version for {tool}, got {version!r}")
        versions[tool] = version
    return versions


if __name__ == "__main__":
    BUILD.mkdir(exist_ok=True)
    subprocess.run(["uv", "export", "--project", str(HOME), "--frozen", "--no-dev", "--no-hashes", "--no-annotate", "--no-header", "--output-file", str(BUILD / "requirements.txt")], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    command("mise", "exec", "--", "pnpm", "run", "build")
    package = BUILD / "package"
    if package.exists():
        shutil.rmtree(package)
    package.mkdir()
    for name in ("bin", "dist", "rules", "skills"):
        shutil.copytree(ROOT / name, package / name)
    shutil.copy2(ROOT / "package.json", package / "package.json")
    shutil.copy2(ROOT / "pnpm-lock.yaml", package / "pnpm-lock.yaml")
    versions = resolved_versions()
    print("Evaluation image toolchain: " + json.dumps(versions, sort_keys=True), flush=True)
    build_args = [argument for tool in ("node", "python", "pnpm")
                  for argument in ("--build-arg", f"{tool.upper()}_VERSION={versions[tool]}")]
    command("docker", "build", *build_args, "-t", "rsp-eval-agent:2026-10-08", "-f", str(HOME / "images/agent/Dockerfile"), str(HOME))
