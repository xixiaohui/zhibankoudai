#!/usr/bin/env python3
"""生成TabBar PNG图标"""
import struct
import zlib
import base64
import os

def create_png(width, height, pixels):
    """创建PNG文件字节"""
    def make_chunk(chunk_type, data):
        chunk_len = len(data)
        chunk_data = chunk_type + data
        crc = zlib.crc32(chunk_data) & 0xffffffff
        return struct.pack('>I', chunk_len) + chunk_data + struct.pack('>I', crc)
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = make_chunk(b'IHDR', ihdr_data)
    
    # IDAT
    raw_data = b''
    for row in pixels:
        raw_data += b'\x00'  # filter type
        for pixel in row:
            raw_data += bytes(pixel)
    
    compressed = zlib.compress(raw_data, 9)
    idat = make_chunk(b'IDAT', compressed)
    
    # IEND
    iend = make_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

def create_icon(size, shape, color, bg_color=(255,255,255,0)):
    """创建简单图标"""
    pixels = []
    cx, cy = size//2, size//2
    r = size//2 - 2
    
    for y in range(size):
        row = []
        for x in range(size):
            dist = ((x-cx)**2 + (y-cy)**2)**0.5
            if shape == 'circle' and dist <= r:
                row.append(color[:3])
            elif shape == 'square' and abs(x-cx) <= r*0.7 and abs(y-cy) <= r*0.7:
                row.append(color[:3])
            elif shape == 'home':
                # 房子形状
                if y > cy - r*0.3 and y < cy + r*0.6 and abs(x-cx) < r*0.5:
                    row.append(color[:3])
                elif y >= cy - r*0.8 and y <= cy - r*0.3:
                    slope = (r*0.5) / (r*0.5)
                    edge = abs(x-cx) / slope + (cy - r*0.8)
                    if y >= edge:
                        row.append(color[:3])
                    else:
                        row.append((240,241,255))
                else:
                    row.append((240,241,255))
            else:
                row.append((240,241,255))
        pixels.append(row)
    return create_png(size, size, pixels)

# 生成简单的彩色块图标
def solid_icon(size, rgb):
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            cx, cy = size//2, size//2
            # 圆角矩形
            margin = size // 5
            rx = size // 4
            if (x >= margin and x < size-margin and y >= margin and y < size-margin):
                # 简单圆角检测
                corners = [
                    (margin+rx, margin+rx),
                    (size-margin-rx, margin+rx),
                    (margin+rx, size-margin-rx),
                    (size-margin-rx, size-margin-rx),
                ]
                in_shape = True
                for (cx2, cy2) in corners:
                    if x < cx2-rx+1 or x > cx2+rx-1:
                        pass
                    if y < cy2-rx+1 or y > cy2+rx-1:
                        pass
                if in_shape:
                    row.append(list(rgb))
                else:
                    row.append([248, 248, 255])
            else:
                row.append([248, 248, 255])
        pixels.append(row)
    return create_png(size, size, pixels)

# 更简单：纯色填充
def simple_colored_png(size, rgb, alpha=False):
    """创建简单的纯色PNG (RGB)"""
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            row.append(list(rgb))
        pixels.append(row)
    return create_png(size, size, pixels)

# 使用PIL如果有，否则用简单方法
try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

output_dir = '/home/user/webapp/miniprogram/images/tab'

icons = {
    'home': {'color': (180, 180, 200), 'active': (108, 99, 255)},
    'finance': {'color': (180, 180, 200), 'active': (108, 99, 255)},
    'ai': {'color': (180, 180, 200), 'active': (108, 99, 255)},
    'life': {'color': (180, 180, 200), 'active': (108, 99, 255)},
    'mine': {'color': (180, 180, 200), 'active': (108, 99, 255)},
}

if HAS_PIL:
    emojis = {
        'home': '🏠', 'finance': '💰', 'ai': '🤖', 'life': '🌱', 'mine': '👤'
    }
    for name, colors in icons.items():
        for state in ['', '_active']:
            color = colors['active'] if state else colors['color']
            img = Image.new('RGBA', (81, 81), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            # 绘制圆形
            draw.ellipse([5, 5, 76, 76], fill=color + (255,))
            img.save(f'{output_dir}/{name}{state}.png')
    print("✅ PIL图标生成成功")
else:
    # 用简单方法生成
    size = 81
    for name, colors in icons.items():
        for state, color in [('', colors['color']), ('_active', colors['active'])]:
            data = simple_colored_png(size, color)
            with open(f'{output_dir}/{name}{state}.png', 'wb') as f:
                f.write(data)
    print("✅ 简单图标生成成功（无PIL）")

print(f"图标已保存到: {output_dir}")
