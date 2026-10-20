# 폰트

- `Galmuri11-subset.woff2` — 갈무리11(OFL 1.1, `Galmuri-LICENSE.txt`)에서 필요한 글자만 남긴 서브셋. 원본 약 505KB → 약 46KB.
- 포함 글자: 영문·숫자·기호(ASCII), 한글 상용 2,350자(KS X 1001), 호환 자모(ㅋ, ㅠ 등), 일부 기호(♥ ✦ ★ · … 등). 목록은 `make-charset.py`.
- 목록에 없는 글자(드문 한글 등)는 시스템 폰트로 대신 보인다.

다시 만들기 (fonttools 필요):

```bash
python3 make-charset.py chars.txt
pyftsubset Galmuri11.ttf --text-file=chars.txt --flavor=woff2 --layout-features='*' --output-file=Galmuri11-subset.woff2
```

원본 `Galmuri11.ttf`는 npm 패키지 `galmuri`의 `dist/`에 있다.
