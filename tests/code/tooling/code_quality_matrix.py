"""Calibrate native quality tasks without containers or model calls."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
TASKS = ROOT / "tests/skills/tasks"
SUPPORT = ROOT / "tests/skills/support"
IDS = ("quality-noise-repair", "quality-noise-control", "quality-protocol-simplify",
       "quality-protocol-control", "quality-capture-simplify", "quality-artifact-control")


class QualityMatrix(unittest.TestCase):
    def fixture(self, task, directory):
        base = TASKS / task
        work = directory / "app"
        baseline = directory / "baseline.json"
        shutil.copytree(base / "environment/workspace", work)
        result = subprocess.run(["python3", str(base / "environment/setup.py"), str(work), str(baseline)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        env = {**os.environ, "RSP_WORKSPACE": str(work), "RSP_BASELINE": str(baseline),
               "RSP_LOG_DIR": str(directory / "logs"), "PYTHONPATH": str(SUPPORT)}
        return base, work, env

    def verify(self, base, env):
        return subprocess.run(["python3", "-B", str(SUPPORT / "verifier.py"),
                               str(base / "tests/.support/check.py")], env=env,
                              text=True, capture_output=True, timeout=30)

    def solution(self, base, work, env):
        result = subprocess.run(["bash", str(base / "solution/solve.sh")], cwd=work,
                                env=env, text=True, capture_output=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_initial_business_contracts_and_reference_solutions(self):
        for name in IDS:
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                base, work, env = self.fixture(name, Path(directory))
                # Existing checks are deliberately insufficient in pressure cases.
                smoke = subprocess.run(["node", "tools/check.mjs"], cwd=work,
                                       text=True, capture_output=True, timeout=15)
                self.assertEqual(smoke.returncode, 0, smoke.stdout + smoke.stderr)
                missing = self.verify(base, env)
                self.assertEqual(missing.returncode, 1, missing.stdout + missing.stderr)
                self.solution(base, work, env)
                passed = self.verify(base, env)
                self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
                if name.endswith("control"):
                    before = base / "environment/workspace/src"
                    for path in before.rglob("*.mjs"):
                        self.assertEqual(path.read_bytes(), (work / "src" / path.relative_to(before)).read_bytes())
                elif name != "quality-noise-repair":
                    source = "session" if "protocol" in name else "capture"
                    shutil.copy2(base / f"environment/workspace/src/{source}.mjs", work / f"src/{source}.mjs")
                    rejected = self.verify(base, env)
                    self.assertEqual(rejected.returncode, 1, rejected.stdout + rejected.stderr)

    def test_noise_behavior_checks_discriminate_transaction_and_recovery_regressions(self):
        name = "quality-noise-repair"
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture(name, Path(directory))
            self.solution(base, work, env)
            correct = (work / "src/noise.mjs").read_bytes()
            strong = (work / "test/noise.test.mjs").read_bytes()
            for mutant, behavior in (("ack-only", "a later write waits for confirmation readback"),
                                     ("refresh-only", "refresh restores use without replaying an unconfirmed write")):
                with self.subTest(mutant=mutant):
                    target = ["node", "--test", "--test-name-pattern", behavior,
                              str(base / "tests/contracts.mjs")]
                    valid = subprocess.run(target, env=env, cwd=work, text=True,
                                           capture_output=True, timeout=15)
                    self.assertEqual(valid.returncode, 0, valid.stdout + valid.stderr)
                    shutil.copy2(base / f"tests/mutants/{mutant}.mjs", work / "src/noise.mjs")
                    rejected = subprocess.run(target, env=env, cwd=work, text=True,
                                              capture_output=True, timeout=15)
                    self.assertNotEqual(rejected.returncode, 0, rejected.stdout + rejected.stderr)
                    (work / "src/noise.mjs").write_bytes(correct)
            shutil.copy2(base / "environment/workspace/test/noise.test.mjs", work / "test/noise.test.mjs")
            weak = self.verify(base, env)
            # Retained-test value belongs to semantic judging, not unrelated
            # failures after swapping a complete reference implementation.
            self.assertEqual(weak.returncode, 0, weak.stdout + weak.stderr)
            (work / "test/noise.test.mjs").write_bytes(strong)
            (work / "CONTEXT.md").write_text("Weakened contract\n")
            preserved = self.verify(base, env)
            self.assertEqual(preserved.returncode, 1, preserved.stdout + preserved.stderr)
            self.assertIn("Input changed", preserved.stdout + preserved.stderr)

    def test_preservation_controls_reject_superficial_simplification(self):
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-protocol-control", Path(directory))
            self.solution(base, work, env)
            # Ignoring observed handset protocol breaks a deployed requirement.
            path = work / "src/session.mjs"
            text = path.read_text()
            self.assertIn("handset.model === 'H-B' ? 'beta' : this.protocol", text)
            path.write_text(text.replace("handset.model === 'H-B' ? 'beta' : this.protocol", "this.protocol"))
            result = self.verify(base, env)
            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-artifact-control", Path(directory))
            self.solution(base, work, env)
            path = work / "src/artifact.mjs"
            text = path.read_text()
            self.assertIn("if (digest !== expectedDigest)", text)
            path.write_text(text.replace("if (digest !== expectedDigest)", "if (false)"))
            result = self.verify(base, env)
            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)

    def test_report_disposition_does_not_replace_behavior_or_semantic_judgment(self):
        # These are report-shape controls, not semantic acceptance of their claims.
        for name in IDS:
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                base, work, env = self.fixture(name, Path(directory))
                self.solution(base, work, env)
                report_path = work / "assessment.json"
                report = json.loads(report_path.read_text())
                for status, findings in (("corrected", []), ("satisfied", [{
                    "path": report["evidence"][0]["path"],
                    "reason": "Calibration observation of the established behavior",
                    "consequence": "Retained behavior continues to satisfy the contract",
                }])):
                    report.update(status=status, findings=findings)
                    report_path.write_text(json.dumps(report))
                    result = self.verify(base, env)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                report["status"] = "unknown"
                report_path.write_text(json.dumps(report))
                result = self.verify(base, env)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)

    def test_noise_checks_reject_quarantine_release_on_invalid_observation(self):
        for name in ("quality-noise-repair", "quality-noise-control"):
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                base, work, env = self.fixture(name, Path(directory))
                self.solution(base, work, env)
                valid = self.verify(base, env)
                self.assertEqual(valid.returncode, 0, valid.stdout + valid.stderr)
                path = work / "src/noise.mjs"
                source = path.read_text()
                guard = "      if (!Number.isInteger(observed) || observed < 0 || observed > 3) throw new Error('unconfirmed level')"
                self.assertEqual(source.count(guard), 1)
                path.write_text(source.replace(guard, "      this.uncertain = false\n" + guard))
                retained = subprocess.run(["node", "tools/check.mjs"], cwd=work, env=env,
                                          text=True, capture_output=True, timeout=15)
                self.assertEqual(retained.returncode, 0, retained.stdout + retained.stderr)
                rejected = self.verify(base, env)
                self.assertEqual(rejected.returncode, 1, rejected.stdout + rejected.stderr)

    def test_protocol_checks_accept_group_order_without_hiding_duplicate_sends(self):
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-protocol-control", Path(directory))
            self.solution(base, work, env)
            path = work / "src/session.mjs"
            source = path.read_text()
            grouping = "const packets = [...groups].map(([protocol, group]) => encode(protocol, group, text))"
            self.assertEqual(source.count(grouping), 1)
            path.write_text(source.replace(grouping, grouping + ".reverse()"))
            tests = work / "test/session.test.mjs"
            tests.write_text(tests.read_text().replace(
                "assert.deepEqual(packets, [",
                "assert.deepEqual(packets.toSorted((a, b) => a.protocol.localeCompare(b.protocol)), ["))
            retained = subprocess.run(["node", "tools/check.mjs"], cwd=work, env=env,
                                      text=True, capture_output=True, timeout=15)
            self.assertEqual(retained.returncode, 0, retained.stdout + retained.stderr)
            accepted = self.verify(base, env)
            self.assertEqual(accepted.returncode, 0, accepted.stdout + accepted.stderr)
            # A Map-based comparison could hide duplicate protocol packets.
            # Exercise the private contract directly so retained tests cannot
            # supply an unrelated rejection.
            sending = "    for (const packet of packets) this.wire.send(packet)"
            self.assertEqual(source.count(sending), 1)
            path.write_text(source.replace(sending, sending +
                            "\n    if (packets.length > 1) this.wire.send(packets[0])"))
            rejected = subprocess.run(["node", str(base / "tests/contracts.mjs")],
                                      cwd=work, env=env, text=True, capture_output=True, timeout=15)
            self.assertEqual(rejected.returncode, 1, rejected.stdout + rejected.stderr)

    def test_protocol_checks_reject_partial_sends_before_unknown_target_rejection(self):
        for name in ("quality-protocol-control", "quality-protocol-simplify"):
            with self.subTest(task=name), tempfile.TemporaryDirectory() as directory:
                base, work, env = self.fixture(name, Path(directory))
                self.solution(base, work, env)
                valid = self.verify(base, env)
                self.assertEqual(valid.returncode, 0, valid.stdout + valid.stderr)
                path = work / "src/session.mjs"
                source = path.read_text()
                guard = "    if (ids.some(id => !this.handsets.has(id))) throw new Error('unknown target')"
                self.assertEqual(source.count(guard), 1)
                path.write_text(source.replace(guard, """    if (ids.some(id => !this.handsets.has(id))) {
      const known = ids.filter(id => this.handsets.has(id))
      if (known.length) this.wire.send(encode(this.protocol, known, text))
      throw new Error('unknown target')
    }"""))
                retained = subprocess.run(["node", "tools/check.mjs"], cwd=work, env=env,
                                          text=True, capture_output=True, timeout=15)
                self.assertEqual(retained.returncode, 0, retained.stdout + retained.stderr)
                rejected = self.verify(base, env)
                self.assertEqual(rejected.returncode, 1, rejected.stdout + rejected.stderr)

    def test_noise_control_rejects_premature_recovery_release(self):
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-noise-control", Path(directory))
            self.solution(base, work, env)
            shutil.copy2(base / "tests/mutants/premature-refresh.mjs", work / "src/noise.mjs")
            result = self.verify(base, env)
            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)

    def test_noise_retained_checks_follow_the_existing_acceptance_command(self):
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-noise-repair", Path(directory))
            self.solution(base, work, env)
            main = work / "test/noise.test.mjs"
            main.rename(work / "test/recovery.test.mjs")
            main.write_text("// Regression coverage is in recovery.test.mjs.\n")
            result = self.verify(base, env)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_equivalent_rejection_details_do_not_hide_failed_recovery(self):
        with tempfile.TemporaryDirectory() as directory:
            base, work, env = self.fixture("quality-noise-repair", Path(directory))
            self.solution(base, work, env)
            path = work / "src/noise.mjs"
            original = path.read_text()
            for error in ("new RangeError('outside the supported range')", "new Error('cannot confirm observation')"):
                path.write_text(original.replace("new Error('unconfirmed level')", error))
                passed = self.verify(base, env)
                self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
            path.write_text(original)
            (work / "test/noise.test.mjs").write_text("throw new Error('retained check failed')")
            rejected = self.verify(base, env)
            self.assertEqual(rejected.returncode, 1, rejected.stdout + rejected.stderr)
            self.assertIn("retained check failed", rejected.stdout + rejected.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
