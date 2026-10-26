# 픽셀 로고(행성 위 신랑·신부 + LITTLE WORLD WEDDING). 사용: python3 logo.py <출력 폴더>
import math
import sys
from PIL import Image

OUT = sys.argv[1]
S = 4
ROWS = 20
K = (42, 26, 46, 255)
INK = (42, 26, 46, 255)
ACCENT = (200, 89, 60, 255)
SHADOW = (242, 198, 168, 255)
PINK = (242, 155, 181, 255)
YELLOW = (246, 200, 95, 255)

PAL = {
    'k': K, 'n': (42, 32, 48, 255), 'N': (122, 74, 48, 255), 's': (242, 194, 154, 255),
    'w': (244, 239, 230, 255), 'u': (47, 59, 98, 255), 'r': (208, 74, 58, 255),
    'p': PINK, 'y': YELLOW, 'g': (201, 198, 192, 255),
}
GROOM = [".kkkkk.", "knnnnnk", "knsssnk", "ksksksk", "ksssssk", ".kwrwk.", "kuuwuuk", "kuuwuuk", "kuuuuuk", ".kn.nk.", ".kk.kk."]
BRIDE = [".kykyk.", "kNNNNNk", "kNsssNk", "kskskNk", "ksssssk", ".kwwwk.", "kwwpwwk", "kwwwwwk", "kwwwwwk", "kgwwwgk", ".kkkkk."]
HEART = [".p.p.", "ppppp", ".ppp.", "..p.."]
PLANET = [(106, 42, 46, 255), (154, 63, 48, 255), (200, 89, 60, 255), (224, 122, 79, 255), (242, 160, 106, 255)]
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

FONT = {
    'L': ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    'I': ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    'T': ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    'E': ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    'W': ["10001", "10001", "10101", "10101", "10101", "11011", "10001"],
    'O': ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    'R': ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    'D': ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    'N': ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    'G': ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
}


def bold(glyph):
    rows = []
    for row in glyph:
        cells = [c == '1' for c in row] + [False]
        rows.append([cells[i] or (i > 0 and cells[i - 1]) for i in range(len(cells))])
    return rows


def put(grid, x, y, c):
    grid[(x, y)] = c


def draw_icon(grid, ox, oy):
    cx, cy, r = ox + 9, oy + 26, 12
    for y in range(oy + 15, oy + ROWS):
        for x in range(cx - r, cx + r + 1):
            d = math.hypot(x + .5 - (cx + .5), y + .5 - (cy + .5))
            if d > r:
                continue
            if d > r - 1.2:
                put(grid, x, y, K)
                continue
            nx, ny = (x - cx) / r, (y - cy) / r
            nz = math.sqrt(max(0, 1 - nx * nx - ny * ny))
            light = -.45 * nx - .55 * ny + .7 * nz + (BAYER[y & 3][x & 3] / 16 - .5) * .18
            idx = 4 if light > .92 else 3 if light > .7 else 2 if light > .38 else 1 if light > .15 else 0
            put(grid, x, y, PLANET[idx])
    for sprite, sx in ((GROOM, ox + 2), (BRIDE, ox + 9)):
        for j, row in enumerate(sprite):
            for i, ch in enumerate(row):
                if ch != '.':
                    put(grid, sx + i, oy + 4 + j, PAL[ch])
    for j, row in enumerate(HEART):
        for i, ch in enumerate(row):
            if ch != '.':
                put(grid, ox + 7 + i, oy + j, PAL[ch])
    for x, y in ((ox + 0, oy + 2), (ox + 18, oy + 6), (ox + 17, oy + 1)):
        put(grid, x, y, YELLOW)
    return 19


def draw_text(grid, text, ox, oy, colors):
    x = ox
    for word, color in zip(text.split(' '), colors):
        for ch in word:
            g = bold(FONT[ch])
            for j, row in enumerate(g):
                for i, on in enumerate(row):
                    if on and (x + i + 1, oy + j + 1) not in grid:
                        put(grid, x + i + 1, oy + j + 1, SHADOW)
            for j, row in enumerate(g):
                for i, on in enumerate(row):
                    if on:
                        put(grid, x + i, oy + j, color)
            x += 7
        x += 3
    return x - 3 - ox


def render(grid, width_cells, path):
    img = Image.new('RGBA', (width_cells * S, ROWS * S), (0, 0, 0, 0))
    px = img.load()
    for (x, y), c in grid.items():
        for a in range(S):
            for b in range(S):
                if 0 <= x * S + a < img.width and 0 <= y * S + b < img.height:
                    px[x * S + a, y * S + b] = c
    img.save(path)


def text_width(words):
    return sum(len(w) * 7 for w in words) + 3 * (len(words) - 1) - 1


pc = {}
iw = draw_icon(pc, 1, 0)
tx = 1 + iw + 5
draw_text(pc, 'LITTLE WORLD WEDDING', tx, 6, [INK, ACCENT, INK])
render(pc, tx + text_width(['LITTLE', 'WORLD', 'WEDDING']) + 2, f'{OUT}/logo-pc.png')
