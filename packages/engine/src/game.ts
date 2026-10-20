import { BRIDE, CHARACTER_PALETTE, GROOM, GROOM_STEP_LEGS, withLegs } from './characters'
import { ENTER_RADIUS, IDLE_FPS, TARGET_VIEW_HEIGHT, VIEW_WIDTH, WALK_SPEED } from './constants'
import { createPainter, type Painter } from './painter'
import type { Frame, GuestEntry, Place, PlaceId, PlayerState, Point, Theme } from './theme'

// 게임 루프, 입력, 카메라, 충돌, 방명록 오브젝트. 테마는 그림과 지형만 넘긴다.

export interface GameEvents {
  // 장소 근처에 들어오거나 나갈 때, 자동 이동이 시작·끝날 때
  onNearChange?(place: Place | null, autoWalking: boolean): void
  onEnter?(place: Place): void
  // 화면을 눌렀을 때. 방명록 오브젝트를 눌렀으면 그 글, 빈 곳이면 null.
  onGuestTap?(entry: GuestEntry | null): void
}

interface Guest {
  entry: GuestEntry
  obj: unknown
  shown: boolean
}

const STEP_GROOM = withLegs(GROOM, GROOM_STEP_LEGS)
const KEYS: Record<string, 'u' | 'd' | 'l' | 'r'> = {
  ArrowUp: 'u',
  KeyW: 'u',
  ArrowDown: 'd',
  KeyS: 'd',
  ArrowLeft: 'l',
  KeyA: 'l',
  ArrowRight: 'r',
  KeyD: 'r',
}
const FOCUS_SECONDS = 3.2

export class Game {
  private readonly ctx: CanvasRenderingContext2D
  private p: Painter
  private bg: HTMLCanvasElement | null = null
  private scale = 3 // 월드 1픽셀 = CSS 몇 픽셀
  private sub = 3 // 캔버스 해상도 배수 (월드 1픽셀을 몇 칸으로 쪼개 그릴지)
  private offset: Point = { x: 0, y: 0 } // 화면이 월드보다 넓을 때 가운데 정렬 여백 (CSS px)
  private view = { w: VIEW_WIDTH, h: TARGET_VIEW_HEIGHT }

  private t = 0
  private last = 0
  private sinceDraw = 1
  private raf = 0
  private running = false
  private paused = false

  private player: PlayerState
  private joy: Point = { x: 0, y: 0 }
  private keys = new Set<string>()
  private auto: Point[] | null = null
  private stuck = 0 // 자동 이동 중 막혀 있던 시간(초)
  private cam: Point = { x: 0, y: 0 } // 그릴 때 쓰는 카메라 (1/sub 픽셀 단위)
  private camF: Point = { x: 0, y: 0 }
  private cameraMoving = false
  private focus: { left: number; point: () => Point } | null = null

  private near: Place | null = null
  private reported: { near: Place | null; auto: boolean } = { near: null, auto: false }

  private guests: Guest[] = []
  private spawning: { guest: Guest; t0: number } | null = null
  private highlighted: Guest | null = null // 방금 올라온 글
  private selectedId: string | null = null // 눌러서 내용을 보고 있는 글

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly theme: Theme,
    private readonly events: GameEvents = {},
    private readonly nametag: HTMLElement | null = null,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.p = createPainter(this.ctx)
    this.player = { ...theme.start, moving: false, facingLeft: false }
  }

  // 컨테이너 크기에 맞춘다. docs/ART_GUIDE.md 1장.
  resize(cssWidth: number, cssHeight: number) {
    const { w, h } = this.theme.world
    let scale = cssHeight / TARGET_VIEW_HEIGHT
    if (cssWidth / scale < VIEW_WIDTH) scale = cssWidth / VIEW_WIDTH
    this.scale = scale
    this.view = { w: Math.min(w, Math.ceil(cssWidth / scale)), h: Math.min(h, Math.ceil(cssHeight / scale)) }
    this.sub = Math.max(1, Math.min(4, Math.round(scale)))
    this.offset = { x: Math.max(0, (cssWidth - this.view.w * scale) / 2), y: Math.max(0, (cssHeight - this.view.h * scale) / 2) }
    this.canvas.width = this.view.w * this.sub
    this.canvas.height = this.view.h * this.sub
    Object.assign(this.canvas.style, {
      position: 'absolute',
      left: `${this.offset.x}px`,
      top: `${this.offset.y}px`,
      width: `${this.view.w * scale}px`,
      height: `${this.view.h * scale}px`,
    })
    this.p = createPainter(this.ctx, this.sub)
    this.updateCamera(0, true)
    if (this.running) this.draw()
  }

  start() {
    if (this.running) return
    this.bg ??= this.renderBackground()
    this.running = true
    this.last = performance.now()
    this.updateCamera(0, true)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.raf = requestAnimationFrame(this.tick)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
  }

  // 모달이 열려 있을 때는 그리기 루프를 멈춘다 (배터리)
  setPaused(paused: boolean) {
    if (this.paused === paused) return
    this.paused = paused
    this.keys.clear()
    this.joy = { x: 0, y: 0 }
    if (!paused && this.running) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  setJoystick(x: number, y: number) {
    this.joy = { x, y }
    if (x || y) this.auto = null
  }

  goTo(place: PlaceId) {
    this.auto = this.theme.route(this.player, place)
    this.focus = null
  }

  setGuests(entries: GuestEntry[]) {
    this.guests = entries.map((entry) => ({ entry, obj: this.theme.guest.create(entry), shown: true }))
  }

  // 새 방명록 글: 카메라가 방명록 영역으로 가서 오브젝트가 생기는 연출을 보여준다.
  addGuest(entry: GuestEntry) {
    const guest: Guest = { entry, obj: this.theme.guest.create(entry), shown: false }
    this.guests.push(guest)
    this.spawning = { guest, t0: this.t }
    this.highlighted = guest
    this.focus = { left: FOCUS_SECONDS, point: () => this.theme.guest.focus(guest.obj, this.t) }
    this.auto = null
  }

  // 눌러서 내용을 보고 있는 오브젝트를 강조한다 (null이면 해제)
  setSelected(entryId: string | null) {
    this.selectedId = entryId
  }

  private renderBackground() {
    const c = document.createElement('canvas')
    c.width = this.theme.world.w
    c.height = this.theme.world.h
    this.theme.drawBackground(createPainter(c.getContext('2d')!))
    return c
  }

  private tick = (now: number) => {
    if (!this.running || this.paused) return
    // dt는 0 이상으로 자른다. 첫 프레임에 음수가 나와 스프라이트 계산이 깨진 적이 있다.
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000))
    this.last = now
    this.t += dt
    this.update(dt)
    this.sinceDraw += dt
    // 움직이는 동안은 매 프레임, 가만히 있을 때는 초당 30번만 그린다
    const busy = this.player.moving || this.spawning !== null || this.focus !== null || this.cameraMoving
    if (busy || this.sinceDraw >= 1 / IDLE_FPS - 0.002) {
      this.sinceDraw = 0
      this.draw()
    }
    this.raf = requestAnimationFrame(this.tick)
  }

  private update(dt: number) {
    const P = this.player
    let vx = this.joy.x
    let vy = this.joy.y
    if (this.keys.size) {
      vx = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0)
      vy = (this.keys.has('d') ? 1 : 0) - (this.keys.has('u') ? 1 : 0)
      this.auto = null
    }
    if (vx || vy) this.auto = null
    else if (this.auto) {
      const target = this.auto[0]!
      const dx = target.x - P.x
      const dy = target.y - P.y
      const d = Math.hypot(dx, dy)
      if (d < 1.5) {
        this.auto.shift()
        if (!this.auto.length) this.auto = null
      } else {
        vx = dx / d
        vy = dy / d
      }
    }

    const m = Math.hypot(vx, vy)
    P.moving = m > 0.05
    if (P.moving) {
      if (Math.abs(vx) > 0.2) P.facingLeft = vx < 0
      const s = (WALK_SPEED * dt * Math.min(1, m)) / m
      const nx = P.x + vx * s
      const ny = P.y + vy * s
      // x축과 y축을 따로 판정해서 벽에 비스듬히 닿으면 미끄러지게 한다
      const freeX = !this.theme.blocked(nx, P.y)
      if (freeX) P.x = nx
      const freeY = !this.theme.blocked(P.x, ny)
      if (freeY) P.y = ny
      // 자동 이동이 0.3초 넘게 막혀 있으면 포기한다 (dt가 0인 프레임 하나로 취소되지 않게 시간으로 잰다)
      this.stuck = freeX || freeY ? 0 : this.stuck + dt
      if (this.auto && this.stuck > 0.3) {
        this.auto = null
        this.stuck = 0
      }
    }

    if (this.focus) {
      this.focus.left -= dt
      if (this.focus.left <= 0) this.focus = null
    }
    this.updateCamera(dt)

    let near: Place | null = null
    for (const place of Object.values(this.theme.places)) {
      if (Math.hypot(place.x - P.x, place.y - P.y) < ENTER_RADIUS) near = place
    }
    this.near = near
    const autoWalking = this.auto !== null
    if (near !== this.reported.near || autoWalking !== this.reported.auto) {
      this.reported = { near, auto: autoWalking }
      this.events.onNearChange?.(near, autoWalking)
    }

    if (this.spawning && this.t - this.spawning.t0 >= this.theme.guest.spawn.duration) {
      this.spawning.guest.shown = true
      this.theme.guest.spawn.landed?.(this.spawning.guest.obj, this.frame(dt))
      this.spawning = null
    }
  }

  private updateCamera(dt: number, snap = false) {
    const { w, h } = this.theme.world
    const target = this.focus ? this.focus.point() : this.player
    const tx = Math.max(0, Math.min(w - this.view.w, target.x - this.view.w / 2))
    const ty = Math.max(0, Math.min(h - this.view.h, target.y - this.view.h / 2))
    const k = snap ? 1 : Math.min(1, dt * 5)
    this.camF.x += (tx - this.camF.x) * k
    this.camF.y += (ty - this.camF.y) * k
    this.cameraMoving = Math.abs(tx - this.camF.x) > 0.05 || Math.abs(ty - this.camF.y) > 0.05
    this.cam = { x: Math.round(this.camF.x * this.sub) / this.sub, y: Math.round(this.camF.y * this.sub) / this.sub }
  }

  private frame(dt = 0): Frame {
    return { t: this.t, dt, player: this.player, camera: this.cam, view: this.view, focusingGuests: this.focus !== null }
  }

  private draw() {
    const { ctx, p, theme } = this
    const f = this.frame()
    ctx.setTransform(this.sub, 0, 0, this.sub, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, this.view.w, this.view.h)
    if (this.bg) ctx.drawImage(this.bg, -this.cam.x, -this.cam.y)
    ctx.save()
    ctx.translate(-this.cam.x, -this.cam.y)

    theme.drawUnder?.(p, f)
    for (const g of this.guests) if (g.shown) theme.guest.draw(p, g.obj, f, g === this.highlighted || g.entry.id === this.selectedId)
    theme.drawOver?.(p, f)
    if (this.spawning) {
      const k = Math.min(1, (this.t - this.spawning.t0) / theme.guest.spawn.duration)
      theme.guest.spawn.draw(p, this.spawning.guest.obj, k, f)
    }

    const P = this.player
    const step = P.moving && Math.floor(this.t * 8) % 2 === 1
    const layers = theme.drawables(f)
    layers.push({
      y: P.y,
      draw: (pp) => {
        pp.rect(P.x - 8, P.y, 16, 1, theme.playerShadow)
        pp.sprite(step ? STEP_GROOM : GROOM, CHARACTER_PALETTE, P.x - 7, P.y - 11 - (step ? 1 : 0), P.facingLeft)
        pp.sprite(BRIDE, CHARACTER_PALETTE, P.x, P.y - 11 - (P.moving && !step ? 1 : 0), P.facingLeft)
      },
    })
    layers.sort((a, b) => a.y - b.y)
    for (const d of layers) d.draw(p)
    theme.drawAir?.(p, f)
    ctx.restore()

    if (this.nametag) {
      const s = this.toScreen({ x: Math.round(P.x * this.sub) / this.sub, y: Math.round(P.y * this.sub) / this.sub - 11 })
      this.nametag.style.transform = `translate(${s.x}px, ${s.y}px)`
    }
  }

  // 월드 좌표 → 무대(캔버스 부모) 기준 CSS 좌표
  private toScreen(pt: Point): Point {
    return { x: this.offset.x + (pt.x - this.cam.x) * this.scale, y: this.offset.y + (pt.y - this.cam.y) * this.scale }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused || isTyping(e.target)) return
    const k = KEYS[e.code]
    if (k) {
      this.keys.add(k)
      e.preventDefault()
    }
    if (e.code === 'KeyE' && this.near && !this.auto) this.events.onEnter?.(this.near)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    const k = KEYS[e.code]
    if (k) this.keys.delete(k)
  }

  private onBlur = () => this.keys.clear()

  private onPointerDown = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    const wx = (e.clientX - r.left) / this.scale + this.cam.x
    const wy = (e.clientY - r.top) / this.scale + this.cam.y
    let best: Guest | null = null
    let bd = this.theme.guest.hitRadius
    for (const g of this.guests) {
      if (!g.shown) continue
      const pos = this.theme.guest.position(g.obj, this.t)
      const d = Math.hypot(pos.x - wx, pos.y - wy)
      if (d < bd) {
        bd = d
        best = g
      }
    }
    this.events.onGuestTap?.(best ? best.entry : null)
  }
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}
