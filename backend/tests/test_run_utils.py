import os
import shutil

from run_utils import find_run_for_weights, latest_run_dir, read_run_metrics

CSV = (
    "epoch,metrics/precision(B),metrics/recall(B),metrics/mAP50(B),metrics/mAP50-95(B)\n"
    "1,0.7,0.7,0.80,0.60\n"
    "2,0.9,0.9,0.95,0.80\n"
    "3,0.8,0.8,0.96,0.70\n"
)


def make_run(root, name, mtime):
    weights = root / name / "weights"
    weights.mkdir(parents=True)
    best = weights / "best.pt"
    best.write_bytes(name.encode())
    os.utime(best, (mtime, mtime))
    return root / name


def test_latest_run_uses_newest_weights_not_name(tmp_path):
    make_run(tmp_path, "fruit-detection20", 1000)
    make_run(tmp_path, "fruit-detection3", 2000)  # resumed later, so newer despite the lower number
    (tmp_path / "fruit-detection21").mkdir()  # aborted run with no weights
    assert latest_run_dir(tmp_path).name == "fruit-detection3"


def test_metrics_come_from_best_fitness_epoch(tmp_path):
    run = make_run(tmp_path, "fruit-detection", 1000)
    (run / "results.csv").write_text(CSV)
    metrics = read_run_metrics(run)
    assert metrics["best_epoch"] == 2  # highest 0.1*mAP50 + 0.9*mAP50-95, not highest mAP50
    assert metrics["map50"] == 0.95
    assert metrics["epochs"] == 3


def test_find_run_for_copied_weights(tmp_path):
    run = make_run(tmp_path, "fruit-detection7", 1000)
    copy = tmp_path / "best.pt"
    shutil.copy2(run / "weights" / "best.pt", copy)
    assert find_run_for_weights(copy, tmp_path) == run
