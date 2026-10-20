// 청첩장 주소(/{slug}): 영어 소문자 8자리.
// 256은 26으로 나누어떨어지지 않으므로 LIMIT 이상인 바이트는 버려서 모든 글자가 같은 확률로 나오게 한다.
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
export const SLUG_LENGTH = 8
const LIMIT = 256 - (256 % ALPHABET.length) // 234

export function generateSlug(): string {
  let slug = ''
  while (slug.length < SLUG_LENGTH) {
    for (const b of crypto.getRandomValues(new Uint8Array(SLUG_LENGTH))) {
      if (b < LIMIT && slug.length < SLUG_LENGTH) slug += ALPHABET[b % ALPHABET.length]
    }
  }
  return slug
}

const SLUG_PATTERN = new RegExp(`^[a-z]{${SLUG_LENGTH}}$`)

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}
