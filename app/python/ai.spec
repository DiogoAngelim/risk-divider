# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

# -----------------------------
# Analysis
# -----------------------------
a = Analysis(
    ['ai.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=collect_submodules('torch'),  # include all PyTorch submodules
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

# -----------------------------
# PYZ
# -----------------------------
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

# -----------------------------
# EXE
# -----------------------------
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ai',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,          # hide console/popup
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
