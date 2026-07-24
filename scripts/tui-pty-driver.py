#!/usr/bin/env python3

import argparse
import fcntl
import json
import os
import pty
import select
import signal
import struct
import termios
import time


def count(data: bytes, needle: bytes) -> int:
    return data.count(needle)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--node", required=True)
    parser.add_argument("--cli", required=True)
    parser.add_argument("--cwd", required=True)
    parser.add_argument("--action", required=True)
    args = parser.parse_args()

    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(args.cwd)
        environment = os.environ.copy()
        environment.update({"CI": "false", "TERM": "xterm-256color", "RSP_UI_LANG": "en"})
        os.execve(args.node, [args.node, args.cli, "ui", "--lang", "en"], environment)

    initial_terminal = termios.tcgetattr(fd)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 24, 120, 0, 0))
    os.set_blocking(fd, False)
    output = bytearray()
    deadline = time.monotonic() + 10
    while b"RSP dashboard" not in output:
        if time.monotonic() >= deadline:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
            raise RuntimeError(f"timed out waiting for dashboard: {bytes(output[-1000:])!r}")
        readable, _, _ = select.select([fd], [], [], 0.1)
        if readable:
            chunk = os.read(fd, 65536)
            if chunk:
                output.extend(chunk)

    os.write(fd, b"?")
    raw_deadline = time.monotonic() + 10
    raw_mode_observed = False
    while b"Keyboard help" not in output:
        if time.monotonic() >= raw_deadline:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
            raise RuntimeError("timed out waiting for interactive input readiness")
        readable, _, _ = select.select([fd], [], [], 0.1)
        if readable:
            chunk = os.read(fd, 65536)
            if chunk:
                output.extend(chunk)
        if termios.tcgetattr(fd)[3] & termios.ICANON == 0:
            raw_mode_observed = True
    if not raw_mode_observed:
        os.kill(pid, signal.SIGKILL)
        os.waitpid(pid, 0)
        raise RuntimeError("interactive input became ready without observable raw mode")
    os.write(fd, b"\x1b")
    time.sleep(0.1)

    signals = {"SIGINT": signal.SIGINT, "SIGTERM": signal.SIGTERM, "SIGHUP": signal.SIGHUP}
    if args.action in signals:
        os.kill(pid, signals[args.action])
    elif args.action == "q":
        os.write(fd, b"q")
    elif args.action == "context-esc":
        os.write(fd, b"?\x1bq")
    elif args.action == "raw-ctrl-c":
        os.write(fd, b"\x03")
    else:
        raise RuntimeError(f"unsupported action: {args.action}")

    exit_deadline = time.monotonic() + 10
    while True:
        exited_pid, status = os.waitpid(pid, os.WNOHANG)
        if exited_pid == pid:
            break
        readable, _, _ = select.select([fd], [], [], 0.1)
        if readable:
            try:
                chunk = os.read(fd, 65536)
                if chunk:
                    output.extend(chunk)
            except OSError:
                pass
        if time.monotonic() >= exit_deadline:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
            raise RuntimeError(f"timed out waiting for exit after {args.action}: {bytes(output[-2000:])!r}")
    while True:
        readable, _, _ = select.select([fd], [], [], 0)
        if not readable:
            break
        try:
            chunk = os.read(fd, 65536)
            if not chunk:
                break
            output.extend(chunk)
        except OSError:
            break
    restored_terminal = termios.tcgetattr(fd)
    exit_code = os.waitstatus_to_exitcode(status)
    expected = {"SIGHUP": 129, "SIGINT": 130, "SIGTERM": 143}.get(args.action, 0)
    observation = {
        "action": args.action,
        "exitCode": exit_code,
        "expectedCode": expected,
        "alternateEnter": count(output, b"\x1b[?1049h"),
        "alternateExit": count(output, b"\x1b[?1049l"),
        "cursorHide": count(output, b"\x1b[?25l"),
        "cursorShow": count(output, b"\x1b[?25h"),
        "terminalAttributesRestored": initial_terminal == restored_terminal,
        "rawModeObserved": raw_mode_observed,
    }
    observation["passed"] = (
        observation["exitCode"] == expected
        and observation["alternateEnter"] == 1
        and observation["alternateExit"] == 1
        and observation["cursorHide"] >= 1
        and observation["cursorShow"] >= 1
        and observation["terminalAttributesRestored"]
        and observation["rawModeObserved"]
    )
    print(json.dumps(observation))


if __name__ == "__main__":
    main()
