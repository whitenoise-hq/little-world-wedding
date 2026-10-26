import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

// docs/STORE_GUIDE.md 1장: 390×844, 배율 3, 모바일·터치
// 사용: node capture.mjs <출력 폴더> <샘플 청첩장 주소>
const [, , OUT, URL] = process.argv
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  // 크롬 위치가 다르면 CHROME_PATH로 지정한다
  executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })
  const clickText = (text) =>
    page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t)
      if (!b) throw new Error(`button not found: ${t}`)
      b.click()
    }, text)
  const scrollModal = (selector, f) =>
    page.evaluate(
      (sel, f) => {
        const el = document.querySelector(sel)
        el.scrollTop = (el.scrollHeight - el.clientHeight) * f
      },
      selector,
      f,
    )
  const closeModal = async () => {
    await page.keyboard.press('Escape')
    await sleep(800)
  }

  // 바로 보기
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(3000)
  await shot('q1-intro')
  await clickText('청첩장 바로 보기')
  await sleep(1200)
  await shot('q2-card-top')

  // 게임
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(3000)
  await shot('01-intro')
  await clickText('들어가기')
  await sleep(6000)
  await shot('03-game')

  const visit = async (label, name, modal) => {
    await page.click(`button[aria-label="${label}"]`)
    await sleep(7000)
    await shot(`${name}-near`)
    if (!modal) return
    await page.click('button.enter')
    await sleep(1500)
    await shot(`${name}-modal`)
    await scrollModal('.modal-body', 1)
    await sleep(700)
    await shot(`${name}-modal-end`)
    await closeModal()
  }
  await visit('청첩장(으)로 이동', '04-home', true)
  await visit('사진(으)로 이동', '05-photo', false)
  await visit('방명록(으)로 이동', '06-guestbook', true)
} finally {
  await browser.close()
}
