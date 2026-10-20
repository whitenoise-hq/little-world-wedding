import sys
chars=set(chr(c) for c in range(0x20,0x7f))
for b1 in range(0xB0,0xC9):
  for b2 in range(0xA1,0xFF):
    try: chars.add(bytes([b1,b2]).decode('euc-kr'))
    except UnicodeDecodeError: pass
chars.update(chr(c) for c in range(0x3131,0x318F))   # 호환 자모 (ㅋㅋ, ㅠㅠ)
chars.update('·…‘’“”♥♡✦★☆←→↑↓～~!?「」『』《》〈〉·•℃％')
chars.add(' ')
open(sys.argv[1],'w',encoding='utf-8').write(''.join(sorted(chars)))
print(len(chars))
