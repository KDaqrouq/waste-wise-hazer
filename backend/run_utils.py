"""
Helpers for finding training runs and reading their metrics.

Shared by app.py and train_model.py so both agree on what "the latest run" is.
"""

import csv
import filecmp
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent
RUNS_DIR = BASE_DIR / "runs" / "detect"
RUN_PREFIX = "fruit-detection"


def _run_dirs(runs_dir: Path = RUNS_DIR):
    if not runs_dir.exists():
        return []
    return [d for d in runs_dir.iterdir() if d.is_dir() and d.name.startswith(RUN_PREFIX)]


def run_weights(run_dir: Path, prefer: str = "best.pt") -> Optional[Path]:
    """Return best.pt (or last.pt) for a run, whichever exists, in the preferred order."""
    order = [prefer, "last.pt" if prefer == "best.pt" else "best.pt"]
    for name in order:
        path = run_dir / "weights" / name
        if path.exists():
            return path
    return None


def latest_run_dir(runs_dir: Path = RUNS_DIR, prefer: str = "best.pt") -> Optional[Path]:
    """The run whose weights were written most recently.

    Ultralytics numbers runs fruit-detection, fruit-detection2, ... but a resumed
    run keeps its old name, so the newest weights file is the reliable signal.
    """
    candidates = [(d, run_weights(d, prefer)) for d in _run_dirs(runs_dir)]
    candidates = [(d, w) for d, w in candidates if w is not None]
    if not candidates:
        return None
    return max(candidates, key=lambda item: item[1].stat().st_mtime)[0]


def find_run_for_weights(weights: Path, runs_dir: Path = RUNS_DIR) -> Optional[Path]:
    """Find the training run a copied weights file came from (copy2 keeps size and mtime)."""
    for run_dir in _run_dirs(runs_dir):
        candidate = run_dir / "weights" / "best.pt"
        if candidate.exists() and filecmp.cmp(candidate, weights, shallow=True):
            return run_dir
    return None


def read_run_metrics(run_dir: Optional[Path]) -> Optional[dict]:
    """Validation metrics for the epoch best.pt was saved from (highest Ultralytics fitness)."""
    if run_dir is None:
        return None
    results_csv = run_dir / "results.csv"
    if not results_csv.exists():
        return None

    with open(results_csv, newline="") as f:
        rows = [{k.strip(): v.strip() for k, v in row.items() if k} for row in csv.DictReader(f)]
    if not rows:
        return None

    def num(row, key):
        try:
            return float(row.get(key, "nan"))
        except ValueError:
            return float("nan")

    # Ultralytics picks best.pt by fitness = 0.1 * mAP50 + 0.9 * mAP50-95
    best = max(rows, key=lambda r: 0.1 * num(r, "metrics/mAP50(B)") + 0.9 * num(r, "metrics/mAP50-95(B)"))
    return {
        "run": run_dir.name,
        "epochs": len(rows),
        "best_epoch": int(num(best, "epoch")),
        "map50": round(num(best, "metrics/mAP50(B)"), 4),
        "map50_95": round(num(best, "metrics/mAP50-95(B)"), 4),
        "precision": round(num(best, "metrics/precision(B)"), 4),
        "recall": round(num(best, "metrics/recall(B)"), 4),
    }
