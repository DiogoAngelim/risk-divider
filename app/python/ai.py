#!/usr/bin/env python3
"""
Usage:
    python ai.py <exchange> <symbol1> [symbol2 ...]

Reads CSVs from ~/stock-data/data/data/{exchange}/{symbol}.csv,
computes log returns, trains a small PPO-like actor network on CPU/GPU,
and prints the optimal weights as valid JSON.
"""
import os
import sys
import json
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd

np.core.multiarray.add_docstring = lambda *a, **kw: None

# -----------------------------
# Config
# -----------------------------
DATA_DIR = Path.home() / "stock-data" / "data" / "data"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# -----------------------------
# Actor network
# -----------------------------
class Actor(nn.Module):
    def __init__(self, n_assets):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(n_assets, 64),
            nn.ReLU(),
            nn.Linear(64, n_assets),
        )

    def forward(self, x):
        raw = self.model(x)
        return torch.softmax(raw, dim=1)

# -----------------------------
# PPO training
# -----------------------------
def train_ppo(returns: np.ndarray, n_assets: int, epochs: int = 100, lr: float = 1e-3):
    actor = Actor(n_assets).to(device)
    optimizer = optim.Adam(actor.parameters(), lr=lr)
    actor.train()

    x = torch.tensor(returns, dtype=torch.float32).to(device)

    for _ in range(epochs):
        weights = actor(x)
        portfolio = (weights * x).sum(dim=1)

        mean = portfolio.mean()
        std = portfolio.std(unbiased=False)
        std = torch.clamp(std, min=1e-8)

        sharpe = mean / std
        loss = -sharpe

        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(actor.parameters(), max_norm=1.0)
        optimizer.step()

    return actor

# -----------------------------
# Load CSVs
# -----------------------------
def load_data(exchange: str, symbols: list[str]):
    if not symbols:
        raise ValueError("No symbols provided")

    dfs = []
    for symbol in symbols:
        path = DATA_DIR / exchange / f"{symbol}.csv"
        if not path.is_file():
            raise FileNotFoundError(f"CSV not found: {path}")

        df = pd.read_csv(path, parse_dates=["Date"])
        price_col = "Adj Close" if "Adj Close" in df.columns else "Close" if "Close" in df.columns else None
        if not price_col:
            raise ValueError(f"CSV {path} must have either 'Adj Close' or 'Close' column")

        df = df[["Date", price_col]].rename(columns={price_col: symbol})
        dfs.append(df)

    merged = dfs[0]
    for df in dfs[1:]:
        merged = pd.merge(merged, df, on="Date", how="inner")

    merged = merged.sort_values("Date").reset_index(drop=True)
    prices = merged.iloc[:, 1:].values.astype(float)
    if prices.shape[0] < 2:
        raise ValueError("Not enough price data after alignment (need at least 2 rows).")

    log_returns = np.log(prices[1:] / prices[:-1]).astype(np.float32)
    log_returns = np.nan_to_num(log_returns, nan=0.0, posinf=0.0, neginf=0.0)
    return log_returns, merged["Date"].values[1:]

# -----------------------------
# Entry point
# -----------------------------
def main():
    if len(sys.argv) < 3:
        print("Usage: python ai.py <exchange> <symbol1> [symbol2 ...]")
        sys.exit(1)

    exchange = sys.argv[1]
    symbols = sys.argv[2:]

    try:
        returns, dates = load_data(exchange, symbols)
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
        sys.exit(2)

    n_assets = returns.shape[1]

    try:
        actor = train_ppo(returns, n_assets, epochs=50, lr=1e-3)
    except Exception as e:
        print(f"Training error: {e}", file=sys.stderr)
        sys.exit(3)

    with torch.no_grad():
        last_state = torch.tensor(returns[-1:], dtype=torch.float32).to(device)
        weights = actor(last_state).cpu().numpy().flatten().tolist()

    weights = [0.0 if not np.isfinite(w) else float(w) for w in weights]
    print(json.dumps({"optimal_weights": weights}))

if __name__ == "__main__":
    main()
