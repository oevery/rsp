"""Prepare immutable inputs and present native Harbor results; no trial scheduler."""
import argparse
from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import html
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tomllib

import yaml

from harbor.models.job.config import JobConfig
from harbor.models.task.task import Task
from rewardkit.models import JudgeTomlConfig, RewardTomlConfig, normalize_aggregation

ROOT = Path(__file__).resolve().parents[2]
HOME = ROOT / "tests/skills"
sys.path.insert(0, str(ROOT))
from tests.skills.support.usage import session_usage


def stamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S.%fZ")


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n")


def harbor(*args):
    env = {**os.environ, "PYTHONPATH": str(ROOT)}
    return subprocess.call([str(Path(sys.executable).with_name("harbor")), *map(str, args)], cwd=ROOT, env=env)


def tasks(names):
    available = {p.name: p for p in sorted((HOME / "tasks").iterdir()) if (p / "task.toml").is_file()}
    unknown = set(names) - available.keys()
    if unknown:
        raise ValueError(f"Unknown tasks: {sorted(unknown)}")
    return [available[n] for n in names] if names else list(available.values())


def check(selected):
    if not selected:
        raise ValueError("No tasks found")
    for path in selected:
        Task(path)
        for file in (path / "tests").rglob("*.toml"):
            data = tomllib.loads(file.read_text())
            if "judge" in data or "criterion" in data:
                scoring = [JudgeTomlConfig.model_validate(data).scoring]
            elif file.name == "reward.toml":
                reward = RewardTomlConfig.model_validate(data)
                scoring = [*reward.scoring.values(), *reward.reward]
            else:
                continue
            if any(normalize_aggregation(item.aggregation) in ("all-pass", "required-pass") for item in scoring):
                raise ValueError(f"Uncalibrated positive-score aggregation: {file}")
        subprocess.run(["bash", "-n", path / "tests/test.sh"], check=True)
    calibration_samples(selected)
    JobConfig.model_validate(yaml.safe_load((HOME / "jobs/default.yaml").read_text()))
    print(f"{len(selected)} native Harbor tasks valid; behavioral acceptance not run")


def native_results(job, read_errors=None):
    for file in sorted(job.glob("*/result.json")):
        try:
            data = json.loads(file.read_text())
        except (OSError, json.JSONDecodeError) as error:
            if read_errors is None:
                raise
            read_errors.append((file, f"{type(error).__name__}: {error}"))
            continue
        if "task_name" in data:
            yield file.parent, data


def reward_details(directory, read_errors=None):
    path = directory / "verifier/reward-details.json"
    try:
        return json.loads(path.read_text()) if path.is_file() else {}
    except (OSError, json.JSONDecodeError) as error:
        if read_errors is not None:
            read_errors.append(f"{type(error).__name__}: {error}")
        # Native results remain authoritative for execution. Calibration needs
        # component scores, so its existing missing-score rule yields unscored.
        return {}


def diagnostic_text(value):
    """Render one-line diagnostic prose; original messages stay in JSON."""
    text = html.escape(" ".join(str(value).split()))
    for character in ("\\", chr(96), "*", "_", "[", "]", "|"):
        text = text.replace(character, "\\" + character)
    return text


def agent_comparison_settings(result):
    config = deepcopy(result.get("config", {}).get("agent"))
    if not config:
        return None
    config.pop("skills", None)
    native = config.get("kwargs", {}).get("config", {})
    if catalog := native.get("model_catalog_json"):
        try:
            native["model_catalog_json"] = {"sha256": hashlib.sha256(Path(catalog).read_bytes()).hexdigest()}
        except OSError:
            return None
    return {"config": config, "info": result.get("agent_info")}


def saved_comparison_sources(job):
    """Inspect sibling snapshots, without claiming they identify original execution."""
    inputs = job.with_name(job.name + ".inputs")

    def files(paths):
        try:
            values = {str(p.relative_to(inputs)): hashlib.sha256(p.read_bytes()).hexdigest()
                      for p in sorted(paths) if p.is_file() and "__pycache__" not in p.parts}
            return values or None
        except OSError:
            return None

    try:
        source = json.loads((inputs / "source.json").read_text())
        image = source.get("image")
        names = source.get("tasks")
        valid_tasks = (isinstance(names, list) and bool(names)
                       and all(isinstance(name, str) and name and Path(name).name == name
                               and name not in (".", "..") for name in names))
    except (OSError, ValueError, AttributeError):
        image, names, valid_tasks = None, [], False
    verifier = None
    try:
        verifier_dirs = [inputs / "tasks" / name / "tests" for name in names] if valid_tasks else []
        # Calibration also snapshots transformed sample tasks; include their verifiers.
        verifier_dirs += sorted((inputs / "samples").glob("*/tests"))
        if valid_tasks and all(directory.is_dir() and any(directory.rglob("*")) for directory in verifier_dirs):
            verifier = files(p for directory in verifier_dirs for p in directory.rglob("*"))
    except OSError:
        # Discovery/prechecks can fail before files() handles content-read errors.
        verifier = None
    return {
        "support": files((inputs / "support").rglob("*.py")),
        "dependency": files([inputs / "uv.lock"]),
        "image": image if isinstance(image, str) and image.strip() else None,
        "verifier": verifier,
        "skills": files((inputs / "skills").rglob("*")),
    }


def saved_source_status(before, after):
    if before is None or after is None:
        return "unavailable"
    # Without an execution-time inventory, different file sets cannot distinguish
    # intentional additions/removals from lost snapshot evidence.
    if isinstance(before, dict) and isinstance(after, dict) and before.keys() != after.keys():
        return "unavailable"
    return "matched" if before == after else "mismatched"


def reward_nodes(detail, name="reward"):
    """Walk Reward Kit's native groups without inventing another score model."""
    if not isinstance(detail, dict):
        return
    if "kind" not in detail:
        for key, value in detail.items():
            yield from reward_nodes(value, key)
        return
    yield name, detail
    for component in detail.get("components", []):
        yield from reward_nodes(component.get("detail", {}), component["name"])


def calibration_case(directory, result, read_errors=None):
    inputs = directory.parent.with_name(directory.parent.name + ".inputs")
    path = inputs / "calibration.json"
    try:
        cases = json.loads(path.read_text())
        name = result["task_name"]
        if name not in cases:
            if read_errors is not None:
                read_errors.append(f"calibration.json: missing sample entry for {name}")
            return None
        case = cases[name]
        if "expected" not in case:
            if read_errors is not None:
                read_errors.append(f"calibration.json: missing expected for {name}")
            return None
        missing = {"checks", "judge"} - case["expected"].keys()
        if missing:
            if read_errors is not None:
                read_errors.append(f"calibration.json: missing expected components {', '.join(sorted(missing))} for {name}")
            return None
        return case
    except FileNotFoundError as error:
        # Oracle/nop controls need no manifest. Require explicit saved job
        # provenance before treating absence as lost calibration expectations.
        try:
            source = json.loads((inputs / "source.json").read_text())
        except (OSError, ValueError):
            source = {}
        identity = None
        if isinstance(source, dict) and source.get("agent") == "judge-calibration":
            identity = "saved source.json agent=judge-calibration"
        elif isinstance(source, dict) and source.get("agent") == "regrade":
            origin = result.get("config", {}).get("source_trial") or {}
            if origin.get("action") == "regrade" and origin.get("type") == "local" and isinstance(origin.get("path"), str) and origin["path"]:
                source_trial = Path(origin["path"])
                source_inputs = source_trial.parent.with_name(source_trial.parent.name + ".inputs")
                try:
                    original = json.loads((source_trial / "result.json").read_text())
                    provenance = json.loads((source_inputs / "source.json").read_text())
                except (OSError, ValueError):
                    pass
                else:
                    if (isinstance(original, dict) and original.get("task_name") == result["task_name"]
                            and isinstance(provenance, dict) and provenance.get("agent") == "judge-calibration"):
                        identity = f"local regrade source {source_trial}; matching task name and saved source.json agent=judge-calibration"
        if identity and read_errors is not None:
            read_errors.append(f"calibration.json: {type(error).__name__}: {error}; {identity}")
    except (OSError, json.JSONDecodeError) as error:
        if read_errors is not None:
            read_errors.append(f"calibration.json: {type(error).__name__}: {error}")
    return None


def execution_mode(directory, result, read_errors=None):
    seen = set()
    while directory.resolve() not in seen:
        seen.add(directory.resolve())
        if (result.get("agent_info") or {}).get("name") in ("oracle", "nop"):
            return "calibration"
        for path in directory.rglob("evaluation-status.json"):
            try:
                if json.loads(path.read_text()).get("semantic") == "not-run":
                    return "calibration"
            except (OSError, json.JSONDecodeError) as error:
                if read_errors is not None:
                    read_errors.append(f"{path}: {type(error).__name__}: {error}")
                return "unknown"
        source = result.get("config", {}).get("source_trial") or {}
        if source.get("action") != "regrade":
            return "execution"
        if source.get("type") != "local" or not source.get("path"):
            return "unknown"
        directory = Path(source["path"])
        try:
            result = json.loads((directory / "result.json").read_text())
        except (OSError, ValueError):
            return "unknown"
    return "unknown"


def verdict(directory, result, mode_errors=None):
    exception = result.get("exception_info") or {}
    if exception:
        kind = exception.get("exception_type", "")
        if kind == "CancelledError":
            return "cancelled"
        if kind == "AgentTimeoutError":
            return "failed"
        if "Reward" in kind or "Verifier" in kind or kind == "RegradeError":
            return "unscored"
        return "error"
    rewards = (result.get("verifier_result") or {}).get("rewards") or {}
    if not rewards:
        return "unscored"
    calibration_errors = []
    case = calibration_case(directory, result, calibration_errors)
    if calibration_errors:
        return "unscored"
    if case:
        scores = {name: node.get("score") for name, node in reward_nodes(reward_details(directory))}
        if any(scores.get(name) is None for name in case["expected"]):
            return "unscored"
        match = all(scores[name] == value for name, value in case["expected"].items())
        mode = "judge-calibration-regrade" if (result.get("config", {}).get("source_trial") or {}).get("action") == "regrade" else "judge-calibration"
        return mode + ("-match" if match else "-mismatch")
    mode = execution_mode(directory, result, mode_errors)
    if mode == "unknown":
        return "unscored"
    if mode == "calibration":
        return "calibration-pass" if all(v == 1 for v in rewards.values()) else "calibration-fail"
    if (result.get("config", {}).get("source_trial") or {}).get("action") == "regrade":
        return "regrade-pass" if all(v == 1 for v in rewards.values()) else "regrade-fail"
    return "passed" if all(v == 1 for v in rewards.values()) else "failed"


def report(job, baseline=None):
    read_errors = []
    rows, mode_errors = [], {}
    for directory, result in native_results(job, read_errors):
        errors = []
        rows.append((directory, result, verdict(directory, result, errors)))
        if errors:
            mode_errors[directory] = errors
    counts = Counter(status for _, _, status in rows)
    if read_errors:
        counts["incomplete"] = len(read_errors)
    expected, plan_error = None, None
    try:
        expected = json.loads((job / "result.json").read_text()).get("n_total_trials")
        if expected is None:
            plan_error = "result.json does not record n_total_trials"
    except (OSError, json.JSONDecodeError) as error:
        plan_error = f"result.json: {type(error).__name__}: {error}"
    if expected is not None and expected > len(rows):
        counts["incomplete"] = max(counts["incomplete"], expected - len(rows))
    plan = ("Planned trials: unknown. Run completeness: unknown. "
            "Returned-trial classification exit 0 does not confirm run completeness; "
            "report command exit 0 only confirms report generation. "
            f"Plan unavailable: {diagnostic_text(plan_error)}." if expected is None else
            f"Planned trials: {expected} (from job result.json).")
    lines = [f"# Evaluation {job.name}", "", "Native Harbor verdicts are authoritative. Executor usage is attributed from root/descendant session identities, excludes judges, and is not context-window occupancy.", "",
             ", ".join(f"{key}: {value}" for key, value in sorted(counts.items())) or "No completed trial records.", "",
             plan, "",
             "Regrade tokens are inherited source-execution usage, not new executor usage or total regrade cost. Judge usage is excluded. Seconds measures the current trial, including regrading when applicable.", "",
             "Cached input tokens are part of input tokens, not additional tokens. Cache counts alone do not establish fees or a savings percentage; no pricing or savings estimate is calculated.", "",
             "| Task | Result | Input tokens | Cached input tokens | Output tokens | Usage origin | Seconds | Time scope | Evidence |", "| --- | --- | ---: | ---: | ---: | --- | ---: | --- | --- |"]
    usage_errors = {}
    for directory, result, status in rows:
        usage = result.get("agent_result") or {}
        if (directory / "agent/codex.txt").is_file():
            try:
                attributed = session_usage(directory / "agent")
                # Reporting must not use an earlier total after a corrupt event.
                # Validate only attributed sessions; executor parsing is unchanged.
                for session in attributed["sessions"]:
                    path = Path(session["path"])
                    for number, line in enumerate(path.read_text().splitlines(), 1):
                        if not line.strip():
                            continue
                        try:
                            json.loads(line)
                        except json.JSONDecodeError as error:
                            raise json.JSONDecodeError(f"{path}:{number}: {error.msg}", error.doc, error.pos) from error
                total = attributed["total"] or {}
            except (OSError, json.JSONDecodeError) as error:
                usage_errors[directory] = f"{type(error).__name__}: {error}"
                total = {}
            usage = {"n_input_tokens": total.get("input_tokens"), "n_cache_tokens": total.get("cached_input_tokens"),
                     "n_output_tokens": total.get("output_tokens")}
        tokens = [usage.get(key) if usage.get(key) is not None else "unknown"
                  for key in ("n_input_tokens", "n_cache_tokens", "n_output_tokens")]
        elapsed = "unknown"
        if result.get("started_at") and result.get("finished_at"):
            elapsed = round((datetime.fromisoformat(result["finished_at"]) - datetime.fromisoformat(result["started_at"])).total_seconds(), 1)
        regraded = (result.get("config", {}).get("source_trial") or {}).get("action") == "regrade"
        origin = "inherited source execution (not new)" if regraded else "current trial"
        time_scope = "current regrade trial" if regraded else "current trial"
        lines.append(f"| {result['task_name']} | {status} | {tokens[0]} | {tokens[1]} | {tokens[2]} | {origin} | {elapsed} | {time_scope} | [{directory.name}]({directory.name}/result.json) |")
    if read_errors:
        lines += ["", "## Unreadable trial results", "",
                  "Counted as incomplete; task identities and scores are unavailable. Original files are retained.", ""]
        for file, error in read_errors:
            lines.append(f"- {diagnostic_text(file.relative_to(job))}: {diagnostic_text(error)}")
    lines += ["", "## Per-task outcomes", "",
              "Ratios describe returned records, not planned attempts. Returned error/unscored records remain in the denominator; control matches and regrades are not fresh Skill successes.", ""]
    if counts.get("incomplete"):
        lines += ["Incomplete run: missing or unreadable trial results cannot be attributed to tasks here. These ratios cannot establish the full-run success rate.", ""]
    for task in sorted({r["task_name"] for _, r, _ in rows}):
        outcomes = Counter(s for _, r, s in rows if r["task_name"] == task)
        total = sum(outcomes.values())
        lines.append(f"- {task} ({total} returned records): " + ", ".join(f"{name} {count}/{total}" for name, count in sorted(outcomes.items())))
    lines += ["", "## Configuration and grading evidence", ""]
    for directory, result, _ in rows:
        config = result.get("config", {}).get("agent", {})
        settings = config.get("kwargs", {})
        model = config.get("model_name") or (result.get("agent_info") or {}).get("name", "unknown")
        effort = settings.get("reasoning_effort", "unknown")
        skills = ", ".join(Path(p).name for p in config.get("skills", [])) or "none recorded"
        source = result.get("config", {}).get("source_trial") or {}
        executor_label = "source executor (inherited)" if source.get("action") == "regrade" else "executor"
        lines.append(f"- {directory.name}: {executor_label} `{model}`, effort `{effort}`; Skills: {skills}.")
        if error := usage_errors.get(directory):
            lines.append(f"  Executor usage unavailable: {diagnostic_text(error)}. Tokens shown as unknown; native verdict and scores retained.")
        if source.get("action") == "regrade":
            reference = source.get("path") or source.get("trial_id") or "unknown"
            lines.append(f"  Source trial: {reference}. Executor metadata and usage are inherited; this regrade does not rerun the executor.")
        calibration_errors = []
        case = calibration_case(directory, result, calibration_errors)
        if calibration_errors:
            lines.append(f"  Calibration expectations unavailable: {diagnostic_text('; '.join(calibration_errors))}. Native scores retained; no expected scores inferred.")
        elif case:
            lines.append(f"  Judge calibration: {case.get('label_status', 'unknown')}; expected components {case['expected']}. This is not Skill acceptance or human validation.")
            if "label_status" not in case:
                lines.append("  Label status unknown: label_status is missing; neither candidate nor human confirmation is inferred.")
        if errors := mode_errors.get(directory):
            lines.append(f"  Execution mode unavailable: {diagnostic_text('; '.join(errors))}. Native scores retained; trial is unscored.")
        if exception := result.get("exception_info"):
            lines.append(f"  Execution exception: `{exception.get('exception_type', 'unknown')}`; see native result.")
        read_errors = []
        details = reward_details(directory, read_errors)
        if read_errors:
            lines.append(f"  Grading details unavailable: {diagnostic_text('; '.join(read_errors))}. Native result retained.")
        elif details:
            lines.append(f"  [Grading details]({directory.name}/verifier/reward-details.json).")
        if error := details.get("error"):
            lines.append(f"  Grading unavailable: {diagnostic_text(error)}.")
        for cause in details.get("root_causes", []):
            root = f"  Root cause: {diagnostic_text(cause.get('type', 'unknown'))}: {diagnostic_text(cause.get('message', ''))}"
            if location := cause.get("location"):
                root += f"; at {diagnostic_text(location.get('file', 'unknown'))}:{diagnostic_text(location.get('line', 'unknown'))} ({diagnostic_text(location.get('function', 'unknown'))})"
            lines.append(root + ".")
        for name, node in reward_nodes(details):
            if judge := node.get("judge"):
                lines.append(f"  {name}: judge `{judge.get('model', 'unknown')}`, effort `{judge.get('reasoning_effort', 'unknown')}`, samples {judge.get('samples', 1)}.")
            criteria = node.get("criteria", [])
            unavailable = [c for c in criteria if c.get("error") or c.get("value") is None]
            for criterion in unavailable:
                reason = criterion.get("error") or "score unavailable"
                lines.append(f"  Unscorable criterion ({name}): {diagnostic_text(criterion['name'])}; {diagnostic_text(reason)}. Evidence remains in grading details.")
            failed = [c["name"] for c in criteria
                      if c.get("value") is not None and c.get("value") != 1 and not c.get("error")]
            if failed:
                lines.append(f"  Unsatisfied criteria ({name}): " + ", ".join(f"`{c}`" for c in failed) + ". Reasons remain in grading details.")
    if baseline:
        baseline_errors = []
        baseline_rows = list(native_results(baseline, baseline_errors))
        previous = Counter((r["task_name"], verdict(d, r)) for d, r in baseline_rows)
        current = Counter((r["task_name"], s) for _, r, s in rows)
        lines += ["", f"Baseline: {baseline}", "", "Outcome counts only; confirm matching tasks, graders, models and environments before interpreting a change.", ""]
        baseline_expected, baseline_plan_error = None, None
        try:
            baseline_expected = json.loads((baseline / "result.json").read_text()).get("n_total_trials")
            if baseline_expected is None:
                baseline_plan_error = "result.json does not record n_total_trials"
        except (OSError, json.JSONDecodeError) as error:
            baseline_plan_error = f"result.json: {type(error).__name__}: {error}"
        baseline_state = "unknown"
        if baseline_expected is not None:
            if len(baseline_rows) < baseline_expected:
                baseline_state = "incomplete"
            elif len(baseline_rows) == baseline_expected and not baseline_errors:
                baseline_state = "complete"
        lines += [f"Baseline planned trials: {baseline_expected if baseline_expected is not None else 'unknown'}.",
                  f"Baseline returned trials (readable records): {len(baseline_rows)}.",
                  f"Baseline completeness: {baseline_state} (record counts only).",
                  "Current-job classification exit 0 does not confirm baseline completeness. Equal record counts do not establish task coverage or candidate improvement.", ""]
        if baseline_plan_error:
            lines += [f"Baseline plan unavailable: {diagnostic_text(baseline_plan_error)}", ""]
        if baseline_state != "complete":
            lines += [f"Comparison limited: baseline completeness {baseline_state}; retained outcome counts must not be interpreted as improvement.", ""]
        if baseline_errors:
            lines += ["### Unreadable baseline trial results", "",
                      "Task identities and scores cannot be inferred from unreadable records. Affected comparisons are unavailable; readable outcome counts are partial and must not be interpreted as improvement. Current-job counts and classification exit status do not establish baseline completeness.", ""]
            for file, error in baseline_errors:
                lines.append(f"- {diagnostic_text(file.relative_to(baseline))}: {diagnostic_text(error)}")
            lines.append("")
        old_sources, new_sources = saved_comparison_sources(baseline), saved_comparison_sources(job)
        lines += ["### Saved snapshot comparison", "",
                  "These states compare currently saved sibling .inputs evidence, not original execution identity. Matched bytes do not prove snapshot completeness or agreement with execution-time inputs. Different file inventories are unavailable because loss and intentional changes cannot be distinguished here.", "",
                  "| Saved source | Status |", "| --- | --- |"]
        for key, label in (("support", "Shared support"), ("dependency", "Dependency lock"),
                           ("image", "Image identity"), ("verifier", "Task verifier inputs")):
            lines.append(f"| {label} | {saved_source_status(old_sources[key], new_sources[key])} |")
        lines += ["", f"Saved Skill content (separate candidate dimension): {saved_source_status(old_sources['skills'], new_sources['skills'])}.",
                  "Skill variation alone does not make a candidate comparison incompatible; missing evidence does not establish equality.", "",
                  "### Recorded execution comparison", "",
                  "The checks below use retained native task checksums and executor settings. They do not authenticate the saved snapshots above or establish full experimental comparability.", ""]
        for task in sorted({k[0] for k in previous} | {k[0] for k in current}):
            before = {s: n for (t, s), n in previous.items() if t == task}
            after = {s: n for (t, s), n in current.items() if t == task}
            absent_baseline = "unavailable" if baseline_errors else "missing"
            lines.append(f"- {task}: {before or absent_baseline} → {after or 'missing'}")
            old = [r for _, r in baseline_rows if r["task_name"] == task]
            new = [r for _, r, _ in rows if r["task_name"] == task]
            limits = ["unreadable baseline trial results; per-task coverage unavailable"] if baseline_errors else []
            for label, values in (
                ("task_checksum", lambda r: r.get("task_checksum")),
                ("agent model/settings", agent_comparison_settings),
            ):
                before_values, after_values = ([values(r) for r in group] for group in (old, new))
                if not before_values or not after_values or None in before_values + after_values:
                    limits.append(f"{label} unavailable")
                elif {json.dumps(v, sort_keys=True) for v in before_values} != {json.dumps(v, sort_keys=True) for v in after_values}:
                    limits.append(f"{label} mismatch")
            if limits:
                lines.append("  Comparison limited: " + "; ".join(limits) + ". Grader/task corrections must not be attributed to candidate improvement.")
            else:
                lines.append("  Recorded task checksum and agent model/settings match; skill paths are intentionally excluded. Other environment and grader provenance still require review.")
    (job / "summary.md").write_text("\n".join(lines) + "\n")
    print(job / "summary.md")
    return counts


def prepare_environment(live, allow_live):
    if live and not allow_live:
        raise ValueError("Live execution requires --allow-live")
    if live and os.environ.get("RSP_EVAL_OFFLINE") == "1":
        raise ValueError("Offline calibration cannot accept live Skill behavior")
    if not live:
        os.environ["RSP_EVAL_OFFLINE"] = "1"
    os.environ.setdefault("RSP_EVAL_OFFLINE", "0")
    os.environ.setdefault("RSP_JUDGE_BASE_URL", "")
    os.environ.setdefault("RSP_JUDGE_API_KEY", "")
    os.environ.setdefault("RSP_JUDGE_HOST", "")


def image_identity():
    return subprocess.check_output(["docker", "image", "inspect", "rsp-eval-agent:2026-10-08", "--format", "{{.Id}} {{.Os}}/{{.Architecture}}"], text=True).strip()


def check_image_inputs():
    # Compare actual baked bytes, including additions/deletions, before claiming
    # that a fresh job's source snapshot describes its execution environment.
    roots = {f"/opt/rsp-package/{name}": ROOT / name
             for name in ("bin", "dist", "rules", "skills", "package.json", "pnpm-lock.yaml")}
    roots.update({f"/opt/rsp-eval/{name}.py": HOME / f"support/{name}.py"
                  for name in ("grade", "checks", "verifier", "workspace", "outputs")})
    roots.update({"/opt/rsp-build/uv.lock": HOME / "uv.lock",
                  "/opt/rsp-build/Dockerfile": HOME / "images/agent/Dockerfile"})
    expected = {}
    for remote, local in roots.items():
        if not local.exists():
            raise ValueError(f"Missing image input: {local}; build the evaluation image first")
        files = local.rglob("*") if local.is_dir() else [local]
        for path in files:
            if path.is_file():
                key = remote + ("/" + path.relative_to(local).as_posix() if path != local else "")
                expected[key] = hashlib.sha256(path.read_bytes()).hexdigest()
    script = """import hashlib, json, sys
from pathlib import Path
actual = {}
for root in map(Path, json.loads(sys.argv[1])):
    for path in root.rglob('*') if root.is_dir() else [root]:
        if path.is_file():
            actual[str(path)] = hashlib.sha256(path.read_bytes()).hexdigest()
print(json.dumps(actual))
"""
    actual = json.loads(subprocess.check_output([
        "docker", "run", "--rm", "--network", "none", "--entrypoint", "python",
        "rsp-eval-agent:2026-10-08", "-c", script, json.dumps(list(roots)),
    ], text=True))
    changed = sorted(key for key in expected.keys() | actual.keys() if expected.get(key) != actual.get(key))
    if changed:
        raise ValueError("Evaluation image input drift: " + ", ".join(changed)
                         + "; rebuild with mise exec -- python tests/skills/build_image.py")


def check_resume_inputs(job):
    inputs = job.with_name(job.name + ".inputs")
    current_support = {p.name: p.read_bytes() for p in (HOME / "support").glob("*.py")}
    try:
        support = {p.name: p.read_bytes() for p in (inputs / "support").glob("*.py")}
        lock = (inputs / "uv.lock").read_bytes()
        image = json.loads((inputs / "source.json").read_text())["image"]
    except (OSError, ValueError, KeyError) as error:
        raise ValueError(f"Resume snapshot unavailable: {inputs}; start a new run or regrade") from error
    if support != current_support or lock != (HOME / "uv.lock").read_bytes():
        raise ValueError(f"Resume support or uv.lock drift: {inputs}; start a new run or regrade")
    if image != image_identity():
        raise ValueError(f"Resume image drift: {inputs}; start a new run or regrade")


def snapshot(selected, agent):
    check_image_inputs()
    job = HOME / "reports" / stamp()
    # Harbor owns Job child directories, so inputs and retry backups are siblings.
    inputs = job.with_name(job.name + ".inputs")
    inputs.mkdir(parents=True)
    job.mkdir()
    shutil.copytree(HOME / "support", inputs / "support", ignore=shutil.ignore_patterns("__pycache__"))
    shutil.copy2(HOME / "uv.lock", inputs / "uv.lock")
    for source in selected:
        shutil.copytree(source, inputs / "tasks" / source.name)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    (inputs / "candidate.patch").write_bytes(subprocess.check_output(["git", "diff", "HEAD", "--binary"], cwd=ROOT))
    write_json(inputs / "source.json", {"commit": commit, "captured_at": job.name,
               "tasks": [p.name for p in selected], "agent": agent, "image": image_identity()})
    return job, inputs


def exit_status(job, counts):
    if not counts or any(counts.get(s) for s in ("failed", "regrade-fail", "error", "unscored", "cancelled", "incomplete", "judge-calibration-mismatch", "judge-calibration-regrade-mismatch")):
        return 1
    for directory, result in native_results(job):
        status = verdict(directory, result)
        if not status.startswith("calibration-"):
            continue
        agent = (result.get("agent_info") or {}).get("name")
        expected = "calibration-fail" if agent == "nop" else "calibration-pass"
        if status != expected:
            return 1
    return 0


def execute(job, inputs, config):
    JobConfig.model_validate(config)
    write_json(inputs / "job.json", config)
    try:
        code = harbor("run", "-y", "-c", inputs / "job.json")
    finally:
        counts = report(job)
    return code or exit_status(job, counts)


def run(args):
    selected = tasks(args.task)
    check(selected)
    prepare_environment(args.agent == "codex", args.allow_live)
    job, inputs = snapshot(selected, args.agent)
    config = yaml.safe_load((HOME / "jobs/default.yaml").read_text())
    config.update(job_name=job.name, jobs_dir=str(job.parent), n_attempts=args.attempts,
                  n_concurrent_trials=args.concurrency,
                  tasks=[{"path": str(inputs / "tasks" / p.name)} for p in selected])
    if args.agent == "codex":
        for index, agent in enumerate(config["agents"]):
            sources = ([] if args.no_skills else [Path(p) for p in args.skill]
                       if args.skill else [ROOT / p for p in agent["skills"]])
            destinations = []
            for source in sources:
                destination = inputs / "skills" / source.name
                if destination.exists():
                    raise ValueError(f"Duplicate Skill name: {source.name}")
                shutil.copytree(source, destination)
                destinations.append(str(destination))
            agent["skills"] = destinations
            if args.model:
                agent["model_name"] = args.model
            native_config = agent.get("kwargs", {}).get("config", {})
            if catalog := native_config.get("model_catalog_json"):
                models = json.loads(Path(catalog).expanduser().read_text())["models"]
                selected_models = [model for model in models if model["slug"] == agent["model_name"]]
                if len(selected_models) != 1:
                    raise ValueError(f"Expected one catalog entry for {agent['model_name']}; refusing fallback metadata")
                destination = inputs / f"model-catalog-{index}.json"
                write_json(destination, {"models": selected_models})
                native_config["model_catalog_json"] = str(destination)
    else:
        config["agents"] = [{"name": args.agent}]
    return execute(job, inputs, config)


def calibration_samples(selected):
    samples = {}
    for task in selected:
        root = HOME / "calibration" / task.name
        if not root.is_dir():
            continue
        for manifest in sorted(root.glob("*/expected.json")):
            case = json.loads(manifest.read_text())
            if (set(case["expected"]) != {"checks", "judge"}
                    or any(v not in (0, 1) for v in case["expected"].values())
                    or case["label_status"] not in ("candidate", "human-reviewed")
                    or not case.get("rationale")):
                raise ValueError(f"Invalid calibration expectations: {manifest}")
            subprocess.run(["bash", "-n", manifest.parent / "sample.sh"], check=True)
            samples[f"{task.name}--{manifest.parent.name}"] = (task, manifest.parent, case)
    return samples


def calibrate(args):
    selected = tasks(args.task)
    samples = calibration_samples(selected)
    if args.sample:
        unknown = set(args.sample) - samples.keys()
        if unknown:
            raise ValueError(f"Unknown calibration samples within selected tasks: {sorted(unknown)}")
        samples = {name: samples[name] for name in sorted(set(args.sample))}
    if not samples:
        raise ValueError("No judge calibration samples for the selected tasks")
    owners = {task for task, _, _ in samples.values()}
    selected = [task for task in selected if task in owners]
    check(selected)
    prepare_environment(True, args.allow_live)
    job, inputs = snapshot(selected, "judge-calibration")
    definitions = []
    for name, (task, source, _) in samples.items():
        target = inputs / "samples" / name
        shutil.copytree(inputs / "tasks" / task.name, target)
        solution = target / "solution"
        (solution / "solve.sh").rename(solution / "base.sh")
        shutil.copy2(source / "sample.sh", solution / "sample.sh")
        (solution / "solve.sh").write_text("#!/usr/bin/env bash\nset -euo pipefail\nbash /solution/base.sh\nbash /solution/sample.sh\n")
        definitions.append({"path": str(target)})
    write_json(inputs / "calibration.json", {name: {**case, "task": task.name} for name, (task, _, case) in samples.items()})
    config = {"job_name": job.name, "jobs_dir": str(job.parent),
              "n_attempts": args.attempts, "n_concurrent_trials": args.concurrency,
              "retry": {"max_retries": 0}, "environment": {"type": "docker", "delete": True},
              "agents": [{"name": "oracle"}], "tasks": definitions}
    return execute(job, inputs, config)


def regrade(args):
    source = args.job.resolve()
    if not (source / "config.json").is_file():
        raise ValueError(f"Source job config unavailable: {source}")
    names = sorted({result["task_name"] for _, result in native_results(source)})
    if not names:
        raise ValueError("Source job has no recorded trials to regrade")
    source_inputs = source.with_name(source.name + ".inputs")
    calibration = source_inputs / "calibration.json"
    cases = json.loads(calibration.read_text()) if calibration.is_file() else {}
    selected = tasks(sorted({cases[name]["task"] for name in names}) if cases else names)
    check(selected)
    prepare_environment(True, args.allow_live)
    job, inputs = snapshot(selected, "regrade")
    definitions = [{"path": str(inputs / "tasks" / p.name)} for p in selected]
    if cases:
        definitions = []
        for name in names:
            target = inputs / "samples" / name
            shutil.copytree(inputs / "tasks" / cases[name]["task"], target)
            shutil.rmtree(target / "solution")
            shutil.copytree(source_inputs / "samples" / name / "solution", target / "solution")
            definitions.append({"path": str(target)})
        write_json(inputs / "calibration.json", {name: cases[name] for name in names})
    config = {"job_name": job.name, "jobs_dir": str(job.parent),
              "n_concurrent_trials": args.concurrency, "retry": {"max_retries": 0},
              "environment": {"type": "docker", "delete": True},
              "tasks": definitions,
              "source_jobs": [{"action": "regrade", "type": "local", "path": str(source)}]}
    return execute(job, inputs, config)


def resume(args):
    job = args.job.resolve()
    config = json.loads((job / "config.json").read_text())
    # Native regrade jobs use source_jobs, not agents; their verifiers can call judges.
    live = ((job.with_name(job.name + ".inputs") / "calibration.json").is_file()
            or bool(config.get("source_jobs"))
            or any(a.get("name") not in ("oracle", "nop") for a in config.get("agents", [])))
    prepare_environment(live, args.allow_live)
    check_resume_inputs(job)
    archive = job.with_name(job.name + ".attempts") / stamp()
    archive.mkdir(parents=True)
    for directory in job.iterdir():
        if not directory.is_dir():
            continue
        result_path = directory / "result.json"
        result = json.loads(result_path.read_text()) if result_path.is_file() else {}
        if not result or (result.get("exception_info") or {}).get("exception_type") in args.error_type:
            shutil.copytree(directory, archive / directory.name)
    for filename in ("config.json", "result.json", "lock.json", "summary.md", "job.log"):
        if (job / filename).is_file():
            shutil.copy2(job / filename, archive / filename)
    command = ["jobs", "resume", "-y", "-p", job]
    for kind in args.error_type:
        command.extend(["-f", kind])
    try:
        code = harbor(*command)
    finally:
        counts = report(job)
    return code or exit_status(job, counts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("check")
    validate.add_argument("--task", action="append", default=[])
    execute = commands.add_parser("run")
    execute.add_argument("--task", action="append", default=[])
    execute.add_argument("--agent", choices=["codex", "oracle", "nop"], default="codex")
    execute.add_argument("--allow-live", action="store_true")
    execute.add_argument("--model")
    selection = execute.add_mutually_exclusive_group()
    selection.add_argument("--skill", action="append", default=[])
    selection.add_argument("--no-skills", action="store_true", help="Inject no Skills; retain the task and project policy")
    execute.add_argument("--attempts", type=int, default=1)
    execute.add_argument("--concurrency", type=int, default=1)
    calibration = commands.add_parser("calibrate")
    calibration.add_argument("--task", action="append", default=[])
    calibration.add_argument("--sample", action="append", default=[], help="Exact task--sample ID; repeat to select multiple samples within --task scope")
    calibration.add_argument("--attempts", type=int, default=1)
    calibration.add_argument("--concurrency", type=int, default=1)
    calibration.add_argument("--allow-live", action="store_true")
    reassess = commands.add_parser("regrade")
    reassess.add_argument("job", type=Path)
    reassess.add_argument("--allow-live", action="store_true")
    reassess.add_argument("--concurrency", type=int, default=1)
    recovery = commands.add_parser("resume")
    recovery.add_argument("job", type=Path)
    recovery.add_argument("--error-type", action="append", required=True)
    recovery.add_argument("--allow-live", action="store_true")
    summary = commands.add_parser("report")
    summary.add_argument("job", type=Path)
    summary.add_argument("--baseline", type=Path)
    args = parser.parse_args()
    if args.command == "check":
        check(tasks(args.task))
        return 0
    if args.command == "report":
        report(args.job, args.baseline)
        return 0
    return {"run": run, "resume": resume, "regrade": regrade, "calibrate": calibrate}[args.command](args)


if __name__ == "__main__":
    raise SystemExit(main())
