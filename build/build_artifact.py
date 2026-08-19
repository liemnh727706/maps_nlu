#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ghép NLU-Wayfinder-Campus.html (artifact self-contained, chạy offline) từ:
   build/artifact-body.html + data.js (gốc) + build/qrlib.js + build/artifact-app.js
Chạy:  python build/build_artifact.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

body = open(os.path.join(HERE, 'artifact-body.html'), encoding='utf-8').read()
data = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
app = open(os.path.join(HERE, 'artifact-app.js'), encoding='utf-8').read()
qr = open(os.path.join(HERE, 'qrlib.js'), encoding='utf-8').read()

out = (body
       .replace('/*__DATA__*/', data)
       .replace('/*__QRLIB__*/', qr)
       .replace('/*__APP__*/', app))

dst = os.path.join(ROOT, 'NLU-Wayfinder-Campus.html')
open(dst, 'w', encoding='utf-8').write(out)
print('Built', dst, '(%d bytes)' % len(out))
