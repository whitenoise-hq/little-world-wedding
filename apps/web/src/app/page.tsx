import { notFound } from 'next/navigation'

// 청첩장은 /{slug}로만 연다. 루트 주소에는 보여줄 것이 없다.
export default function Home() {
  notFound()
}
