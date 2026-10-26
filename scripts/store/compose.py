import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# docs/STORE_GUIDE.md 4·5장: 대표이미지 1장 + 추가이미지 7장 (1000×1000)
# 사용: python3 compose.py <캡처 폴더> <출력 폴더> <logo-pc.png> <글꼴 폴더>
# 결과를 docs/store/template/main/ 과 나란히 놓고 비교한다.
SHOTS, OUT, LOGO, FONTS = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
os.makedirs(OUT, exist_ok=True)

# 테마별 값: docs/STORE_GUIDE.md 3장 표에서 그 테마 열의 값으로 바꾼다 (지금은 공항)
THEME = {
    'dark': (22, 38, 61), 'mint': (223, 230, 239), 'circle': (203, 215, 230), 'dark_sub': (195, 206, 222),
    'stage': '공항', 'gb_label': 'BOARDING GATE', 'gb_title': '축하 메시지가 종이비행기 한 대로',
    'gb_sub': '탑승구에서 남긴 메시지는 종이비행기가 되어 하늘을 날아요', 'gb_item': '종이비행기가 되는 방명록',
    'home_label': 'CHECK-IN', 'home_title': '체크인 카운터에서 예식 정보를 한눈에',
}

SIZE = 1000
CREAM = (247, 242, 233)
INK = (40, 38, 34)
MUTED = (110, 104, 96)
ACCENT = (200, 89, 60)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


TITLE = lambda s: font('NanumMyeongjo-Bold.ttf', s)
BODY = lambda s: font('NanumGothic-Regular.ttf', s)
BODY_B = lambda s: font('NanumGothic-Bold.ttf', s)


def shot(name):
    return Image.open(os.path.join(SHOTS, name)).convert('RGB')


def phone(screen, height):
    sh = height - 28
    sw = round(sh * screen.width / screen.height)
    bezel, radius = 14, round(sw * 0.12)
    w, h = sw + bezel * 2, sh + bezel * 2
    frame = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, w - 1, h - 1), radius + bezel, fill=(28, 28, 30, 255))
    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, sh - 1), radius, fill=255)
    frame.paste(screen.resize((sw, sh), Image.LANCZOS), (bezel, bezel), mask)
    return frame


def place(canvas, img, x, y, shadow=True):
    if shadow:
        sh = Image.new('RGBA', (img.width + 80, img.height + 80), (0, 0, 0, 0))
        sh.paste((0, 0, 0, 255), (40, 40), img.split()[3].point(lambda a: 60 if a else 0))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)), (x - 40, y - 26))
    canvas.alpha_composite(img, (x, y))


def centered(d, text, y, f, fill):
    d.text(((SIZE - d.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)


def canvas(bg=CREAM):
    return Image.new('RGBA', (SIZE, SIZE), bg + (255,))


def header(c, label, title, sub, colors=(ACCENT, INK, MUTED)):
    d = ImageDraw.Draw(c)
    centered(d, label, 64, BODY_B(20), colors[0])
    centered(d, title, 100, TITLE(48), colors[1])
    centered(d, sub, 172, BODY(25), colors[2])


def one(c, name):
    p = phone(shot(name), 740)
    place(c, p, (SIZE - p.width) // 2, 236)


def two(c, a, b, gap=36):
    pa, pb = phone(shot(a), 720), phone(shot(b), 720)
    x0 = (SIZE - pa.width - pb.width - gap) // 2
    place(c, pa, x0, 248)
    place(c, pb, x0 + pa.width + gap, 248)


def save(c, name):
    c.convert('RGB').save(os.path.join(OUT, name), quality=95)


# 01 대표이미지: 글자 없음
c = canvas(THEME['mint'])
ImageDraw.Draw(c).ellipse((140, 140, 860, 860), fill=THEME['circle'])
p1, p2 = phone(shot('01-intro.png'), 760), phone(shot('03-game.png'), 820)
place(c, p1, 500 - p1.width - 10, 150)
place(c, p2, 520, 90)
save(c, '01-main.jpg')

c = canvas()
header(c, 'PLAYABLE INVITATION', '하객이 직접 걸어 다니는 청첩장', f"조이스틱으로 두 사람을 움직여 작은 {THEME['stage']}을 둘러봐요")
one(c, '03-game.png')
save(c, '02-walk.jpg')

c = canvas()
header(c, THEME['home_label'], THEME['home_title'], '인사말 · 일시 · 오시는 길 · 연락처 · 계좌번호')
two(c, '04-home-modal.png', '04-home-modal-end.png')
save(c, '03-house.jpg')

c = canvas()
header(c, THEME['gb_label'], THEME['gb_title'], THEME['gb_sub'])
two(c, '06-guestbook-near.png', '06-guestbook-modal.png')
save(c, '04-guestbook.jpg')

c = canvas()
header(c, 'EASY TO USE', '버튼 하나로 원하는 장소까지', '게임이 처음인 분도 버튼만 누르면 알아서 걸어가요')
one(c, '04-home-near.png')
save(c, '05-easy.jpg')

c = canvas(THEME['dark'])
header(c, 'COVER', '링크를 열면 펼쳐지는 표지', '앱 설치 없이 카카오톡에서 바로 열려요', ((232, 196, 160), CREAM, THEME['dark_sub']))
one(c, '01-intro.png')
save(c, '06-cover.jpg')

c = canvas()
d = ImageDraw.Draw(c)
centered(d, "WHAT'S INSIDE", 84, BODY_B(20), ACCENT)
centered(d, '청첩장에 담기는 내용', 120, TITLE(52), INK)
items = [('신랑 · 신부 이름과 인사말', ''), ('예식 날짜 · 시간, 달력, D-day', ''), ('예식장 주소와 길찾기', '카카오맵 · 네이버지도'),
         ('오시는 길', '지하철 · 버스 · 주차'), ('신랑 · 신부, 양가 혼주 연락처', '원하는 분만 공개'), ('마음 전하실 곳', '신랑 측 · 신부 측 계좌번호 복사'),
         ('사진 갤러리', '최대 20장'), (THEME['gb_item'], ''), ('배경음악', '선택')]
y = 236
for title, sub in items:
    d.rounded_rectangle((150, y, 850, y + 62), 14, fill=(255, 255, 255))
    d.ellipse((176, y + 23, 192, y + 39), fill=THEME['dark'])
    d.text((214, y + 17), title, font=BODY_B(26), fill=INK)
    if sub:
        d.text((826 - d.textlength(sub, font=BODY(21)), y + 21), sub, font=BODY(21), fill=MUTED)
    y += 76
logo = Image.open(LOGO).convert('RGBA')
logo = logo.resize((logo.width // 2, logo.height // 2), Image.NEAREST)
place(c, logo, (SIZE - logo.width) // 2, 930, shadow=False)
save(c, '07-contents.jpg')

c = canvas()
header(c, 'QUICK VIEW', '게임 없이 바로 보는 청첩장', '표지의 "청첩장 바로 보기"를 누르면 한 화면에 모두 담겨요')
two(c, 'q1-intro.png', 'q2-card-top.png')
save(c, '08-quick.jpg')
print('ok')
