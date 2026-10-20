"""Validate agent-owned report shapes before task-specific interpretation."""
import json
import re
from pathlib import Path


def object_value(value, label):
    assert isinstance(value, dict), f"{label} must be an object"
    return value


def object_list(value, label):
    assert isinstance(value, list) and all(isinstance(item, dict) for item in value), f"{label} must be a list of objects"
    return value


def read_object(path):
    try:
        value = json.loads(path.read_text())
    except (json.JSONDecodeError, UnicodeError) as error:
        raise AssertionError(f"{path} must contain valid JSON") from error
    return object_value(value, str(path))


def nonempty_text(value):
    return isinstance(value, str) and bool(value.strip())


def evidence_file(root, reference):
    """Resolve workspace evidence with an optional line, column or line range."""
    assert nonempty_text(reference), "Evidence path must be nonempty text"
    match = re.fullmatch(r"(.+?):L?([0-9]+)(?::([0-9]+)|-L?([0-9]+))?", reference)
    path = match[1] if match else reference
    if path.startswith("/app/"):
        path = path[len("/app/"):]
    root = Path(root).resolve()
    try:
        target = (root / path).resolve()
    except (OSError, RuntimeError, ValueError) as error:
        raise AssertionError(f"Evidence path is invalid: {reference}") from error
    assert target.is_relative_to(root), f"Evidence path leaves workspace: {reference}"
    assert target.is_file(), f"Evidence path does not exist: {reference}"
    if match:
        line = int(match[2])
        column = int(match[3]) if match[3] else None
        end = int(match[4]) if match[4] else line
        try:
            lines = target.read_text().splitlines()
        except UnicodeError as error:
            raise AssertionError(f"Evidence location requires a text file: {reference}") from error
        assert 1 <= line <= len(lines), f"Evidence line is out of range: {reference}"
        assert line <= end <= len(lines), f"Evidence range is out of order or range: {reference}"
        if column is not None:
            assert 1 <= column <= len(lines[line - 1]) + 1, f"Evidence column is out of range: {reference}"
    return target
