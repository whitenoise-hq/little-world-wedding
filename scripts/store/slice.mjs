import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// 상세 랜딩 HTML을 섹션(data-slice)마다 848px 이미지로 자른다
// 사용: node slice.mjs <detail.html> <출력 폴더>
const [, , htmlPath, outDir] = process.argv
mkdirSync(outDir, { recursive: true })
const browser = await puppeteer.launch({
  // 크롬 위치가 다르면 CHROME_PATH로 지정한다
  executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 848, height: 1200, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  for (const el of await page.$$('[data-slice]')) {
    const name = await el.evaluate((n) => n.dataset.slice)
    await el.screenshot({ path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 92 })
  }
} finally {
  await browser.close()
}
