"""Harbor verifier entry: Reward Kit owns scoring; errors never become failures."""
import argparse
import json
import os
import shutil
import tempfile
import sys
from pathlib import Path

from rewardkit.runner import run


def errors(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "error" and item:
                yield str(item)
            else:
                yield from errors(item)
    elif isinstance(value, list):
        for item in value:
            yield from errors(item)


def root_causes(error):
    """Locate leaf exceptions without replacing their summary or traceback."""
    roots = []

    def visit(current, path, ancestors):
        if id(current) in ancestors:
            return
        ancestors = ancestors | {id(current)}
        children = []
        if isinstance(current, BaseExceptionGroup):
            children.extend((child, f"{path}.exceptions[{index}]")
                            for index, child in enumerate(current.exceptions))
        if current.__cause__ is not None:
            children.append((current.__cause__, path + ".__cause__"))
        elif not current.__suppress_context__ and current.__context__ is not None:
            children.append((current.__context__, path + ".__context__"))
        reachable = [(child, child_path) for child, child_path in children if id(child) not in ancestors]
        if reachable:
            for child, child_path in reachable:
                visit(child, child_path, ancestors)
            return
        record = {"exception_path": path,
                  "type": f"{type(current).__module__}.{type(current).__qualname__}",
                  "message": str(current)}
        trace = current.__traceback__
        if trace is not None:
            while trace.tb_next is not None:
                trace = trace.tb_next
            record["location"] = {"file": trace.tb_frame.f_code.co_filename,
                                  "line": trace.tb_lineno,
                                  "function": trace.tb_frame.f_code.co_name}
        roots.append(record)

    visit(error, "exception", set())
    return roots


def grade(tests, workspace, output):
    if host := os.environ.get("RSP_JUDGE_HOST"):
        import litellm
        litellm.headers = {"Host": host}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.unlink(missing_ok=True)
    status_path = output.with_name("evaluation-status.json")
    status_path.unlink(missing_ok=True)
    offline = os.environ.get("RSP_EVAL_OFFLINE") == "1"
    with tempfile.TemporaryDirectory(prefix="rsp-verifier-") as directory:
        selected = Path(directory) / "tests"
        shutil.copytree(tests, selected)
        shutil.copy2(Path(__file__).with_name("checks.py"), selected / "checks.py")
        if offline:
            # Calibration runs exercise deterministic criteria only. Keep support
            # files and remove judge declarations, never invent a semantic pass.
            import tomllib
            for file in selected.rglob("*.toml"):
                if "judge" in tomllib.loads(file.read_text()):
                    file.unlink()
        details_path = output.with_name("reward-details.json")
        details_path.unlink(missing_ok=True)
        sys.path.insert(0, str(Path(__file__).parent))
        try:
            scores = run(selected, workspace=workspace, output=output)
        except Exception as error:
            # Programmatic exceptions can abort Reward Kit before it writes
            # details. Preserve the failure and leave no reward to mis-score.
            output.unlink(missing_ok=True)
            causes = root_causes(error)
            details_path.write_text(json.dumps({"error": str(error), "root_causes": causes}, indent=2))
            status_path.write_text(json.dumps({"semantic": "not-run" if offline else "task-defined",
                                               "errors": [str(error)], "root_causes": causes}, indent=2))
            raise RuntimeError("Verifier execution failed; see reward-details.json") from error
        finally:
            sys.path.pop(0)
        detail = json.loads(output.with_name("reward-details.json").read_text())
        failures = list(errors(detail))
        status = {"semantic": "not-run" if offline else "task-defined", "errors": failures}
        status_path.write_text(json.dumps(status, indent=2))
        if failures or not scores:
            output.rename(output.with_name("unscored-reward.json"))
            raise RuntimeError("Verifier evidence unavailable; see reward-details.json")
    return scores


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("tests", type=Path)
    parser.add_argument("--workspace", type=Path, default=Path("/app"))
    parser.add_argument("--output", type=Path, default=Path("/logs/verifier/reward.json"))
    args = parser.parse_args()
    grade(args.tests, args.workspace, args.output)
