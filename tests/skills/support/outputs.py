"""Validate agent-owned report shapes before task-specific interpretation."""
import json


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
