"""Reward Kit registration, staged beside each task's private assertions."""
from pathlib import Path
import rewardkit as rk
from verifier import check_task


@rk.criterion
def task_contract(workspace):
    return check_task(Path(__file__).parent, workspace)
