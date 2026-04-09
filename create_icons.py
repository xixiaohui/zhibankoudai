#!/usr/bin/env python3
import base64
import os

# Simple 1x1 purple pixel PNG as placeholder
# This creates valid PNG files that can be replaced with real icons later
PNG_DATA = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
)

tab_dir = os.path.join(os.path.dirname(__file__), 'miniprogram', 'images', 'tab')
os.makedirs(tab_dir, exist_ok=True)

icons = ['home', 'expert', 'ai', 'mine']
for icon in icons:
    # Normal icon
    with open(os.path.join(tab_dir, f'{icon}.png'), 'wb') as f:
        f.write(PNG_DATA)
    # Active icon (slightly different)
    with open(os.path.join(tab_dir, f'{icon}_active.png'), 'wb') as f:
        f.write(PNG_DATA)

print(f'Created {len(icons)*2} tab icons in {tab_dir}')
