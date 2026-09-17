/**
 * CanvasViewport — Canvas 2D 手势缩放/平移引擎
 *
 * 职责:
 * - 维护 2D affine transform (translate + scale)
 * - 处理单指拖拽 → 平移
 * - 处理双指捏合 → 缩放（以双指中心为锚点）
 * - 惯性滑动 + 边界回弹
 * - worldToScreen / screenToWorld 坐标转换
 * - 通过 dirty flag + requestAnimationFrame 触发重绘
 *
 * 这是关系图谱重做方案的最高风险模块。
 * 此文件为独立 spike，不依赖任何现有业务代码。
 */

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

export interface ViewportOptions {
  /** Canvas 逻辑宽度 (px) */
  canvasWidth: number
  /** Canvas 逻辑高度 (px) */
  canvasHeight: number
  /** 世界坐标系宽度 (默认 1.0) */
  worldWidth?: number
  /** 世界坐标系高度 (默认 1.0) */
  worldHeight?: number
  /** 最小缩放 */
  minScale?: number
  /** 最大缩放 */
  maxScale?: number
  /** 惯性摩擦系数 (0-1, 越大越滑) */
  friction?: number
  /** 渲染回调 */
  onRender?: (ctx: any, viewport: CanvasViewport) => void
}

interface TouchPoint {
  x: number
  y: number
}

export class CanvasViewport {
  // Transform state
  public scale: number
  public translateX: number
  public translateY: number

  // Config
  private canvasWidth: number
  private canvasHeight: number
  private minScale: number
  private maxScale: number
  private friction: number

  // Gesture state
  private isDragging = false
  private isPinching = false
  private lastTouch: TouchPoint = { x: 0, y: 0 }
  private lastPinchDist = 0
  private lastPinchCenter: TouchPoint = { x: 0, y: 0 }

  // Momentum
  private velocityX = 0
  private velocityY = 0
  private lastMoveTime = 0
  private momentumActive = false

  // Rendering
  private dirty = true
  private animFrameId: number | null = null
  private ctx: any = null
  private onRender: ((ctx: any, viewport: CanvasViewport) => void) | null = null

  // FPS tracking
  private frameCount = 0
  private lastFpsTime = 0
  public currentFps = 0

  constructor(options: ViewportOptions) {
    this.canvasWidth = options.canvasWidth
    this.canvasHeight = options.canvasHeight
    // worldWidth/worldHeight reserved for future boundary clamping
    void options.worldWidth
    void options.worldHeight
    this.minScale = options.minScale ?? 0.5
    this.maxScale = options.maxScale ?? 4.0
    this.friction = options.friction ?? 0.92
    this.onRender = options.onRender ?? null

    // 初始 transform: 将世界坐标 [0,1] 映射到 canvas，屏幕正中央
    this.scale = Math.min(this.canvasWidth, this.canvasHeight) * 0.9
    this.translateX = (this.canvasWidth - this.scale) * 0.5
    this.translateY = (this.canvasHeight - this.scale) * 0.5
  }

  // ── 坐标转换 ────────────────────────────

  /** 世界坐标 → 屏幕像素 */
  worldToScreen(wx: number, wy: number): [number, number] {
    return [
      wx * this.scale + this.translateX,
      wy * this.scale + this.translateY,
    ]
  }

  /** 屏幕像素 → 世界坐标 */
  screenToWorld(sx: number, sy: number): [number, number] {
    return [
      (sx - this.translateX) / this.scale,
      (sy - this.translateY) / this.scale,
    ]
  }

  /** 世界坐标下的距离 → 屏幕像素距离 */
  worldToScreenSize(size: number): number {
    return size * this.scale
  }

  // ── 触摸事件处理 ────────────────────────

  handleTouchStart(touches: TouchPoint[]) {
    this.stopMomentum()

    if (touches.length === 1) {
      this.isDragging = true
      this.isPinching = false
      this.lastTouch = { x: touches[0].x, y: touches[0].y }
      this.velocityX = 0
      this.velocityY = 0
      this.lastMoveTime = Date.now()
    } else if (touches.length >= 2) {
      this.isPinching = true
      this.isDragging = false
      this.lastPinchDist = this.pinchDistance(touches[0], touches[1])
      this.lastPinchCenter = this.pinchCenter(touches[0], touches[1])
    }
  }

  handleTouchMove(touches: TouchPoint[]) {
    if (touches.length === 1 && this.isDragging) {
      const dx = touches[0].x - this.lastTouch.x
      const dy = touches[0].y - this.lastTouch.y
      const now = Date.now()
      const dt = Math.max(now - this.lastMoveTime, 1)

      this.translateX += dx
      this.translateY += dy

      // 计算速度（用于惯性）
      this.velocityX = dx / dt * 16 // 归一化到 ~16ms/frame
      this.velocityY = dy / dt * 16

      this.lastTouch = { x: touches[0].x, y: touches[0].y }
      this.lastMoveTime = now
      this.markDirty()
    } else if (touches.length >= 2 && this.isPinching) {
      const dist = this.pinchDistance(touches[0], touches[1])
      const center = this.pinchCenter(touches[0], touches[1])

      if (this.lastPinchDist > 0) {
        const zoomFactor = dist / this.lastPinchDist
        this.zoomAt(center.x, center.y, zoomFactor)
      }

      // 同时支持双指平移
      const dx = center.x - this.lastPinchCenter.x
      const dy = center.y - this.lastPinchCenter.y
      this.translateX += dx
      this.translateY += dy

      this.lastPinchDist = dist
      this.lastPinchCenter = center
      this.markDirty()
    }
  }

  handleTouchEnd(touches: TouchPoint[]) {
    if (this.isDragging && !this.isPinching) {
      // 启动惯性滑动
      const speed = Math.sqrt(
        this.velocityX * this.velocityX + this.velocityY * this.velocityY
      )
      if (speed > 0.5) {
        this.startMomentum()
      }
    }

    if (touches.length === 0) {
      this.isDragging = false
      this.isPinching = false
    } else if (touches.length === 1) {
      // 从双指变单指
      this.isPinching = false
      this.isDragging = true
      this.lastTouch = { x: touches[0].x, y: touches[0].y }
    }
  }

  // ── 缩放 ──────────────────────────────

  /** 以屏幕坐标 (cx, cy) 为锚点缩放 */
  private zoomAt(cx: number, cy: number, factor: number) {
    const newScale = Math.max(
      this.minScale * this.canvasWidth,
      Math.min(this.maxScale * this.canvasWidth, this.scale * factor)
    )
    const actualFactor = newScale / this.scale

    // 保持锚点不动
    this.translateX = cx - (cx - this.translateX) * actualFactor
    this.translateY = cy - (cy - this.translateY) * actualFactor
    this.scale = newScale
  }

  // ── 惯性 ──────────────────────────────

  private startMomentum() {
    this.momentumActive = true
    this.tickMomentum()
  }

  private stopMomentum() {
    this.momentumActive = false
  }

  private tickMomentum() {
    if (!this.momentumActive) return

    this.velocityX *= this.friction
    this.velocityY *= this.friction

    const speed = Math.sqrt(
      this.velocityX * this.velocityX + this.velocityY * this.velocityY
    )

    if (speed < 0.1) {
      this.momentumActive = false
      return
    }

    this.translateX += this.velocityX
    this.translateY += this.velocityY
    this.markDirty()

    // 用 setTimeout 替代 rAF（小程序兼容）
    setTimeout(() => this.tickMomentum(), 16)
  }

  // ── 辅助 ──────────────────────────────

  private pinchDistance(a: TouchPoint, b: TouchPoint): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private pinchCenter(a: TouchPoint, b: TouchPoint): TouchPoint {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    }
  }

  // ── 渲染循环 ──────────────────────────

  /** 标记需要重绘 */
  markDirty() {
    this.dirty = true
  }

  /** 绑定 Canvas context 并启动渲染循环 */
  bindContext(ctx: any) {
    this.ctx = ctx
    this.lastFpsTime = Date.now()
    this.startRenderLoop()
  }

  /** 停止渲染循环 */
  destroy() {
    this.momentumActive = false
    if (this.animFrameId !== null) {
      // 不再调度下一帧
      this.animFrameId = null
    }
  }

  private startRenderLoop() {
    const loop = () => {
      if (this.animFrameId === null) return // destroyed

      // FPS 计算
      this.frameCount++
      const now = Date.now()
      if (now - this.lastFpsTime >= 1000) {
        this.currentFps = this.frameCount
        this.frameCount = 0
        this.lastFpsTime = now
      }

      if (this.dirty && this.ctx && this.onRender) {
        this.dirty = false
        this.onRender(this.ctx, this)
      }

      this.animFrameId = setTimeout(loop, 16) as unknown as number // ~60fps
    }

    this.animFrameId = 0
    loop()
  }

  // ── 动画 ──────────────────────────────

  /** 动画缩放到指定世界坐标区域 */
  animateTo(
    worldX: number,
    worldY: number,
    targetScale: number,
    duration = 300
  ) {
    const startState = {
      scale: this.scale,
      translateX: this.translateX,
      translateY: this.translateY,
    }

    // 目标: 将 (worldX, worldY) 放在屏幕中心
    const endTranslateX =
      this.canvasWidth / 2 - worldX * targetScale
    const endTranslateY =
      this.canvasHeight / 2 - worldY * targetScale

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      this.scale = startState.scale + (targetScale - startState.scale) * eased
      this.translateX =
        startState.translateX +
        (endTranslateX - startState.translateX) * eased
      this.translateY =
        startState.translateY +
        (endTranslateY - startState.translateY) * eased
      this.markDirty()

      if (progress < 1) {
        setTimeout(animate, 16)
      }
    }
    animate()
  }

  // ── 点击命中检测 ──────────────────────

  /** 检测屏幕坐标点击了哪个世界坐标节点 */
  hitTest(
    screenX: number,
    screenY: number,
    nodes: Array<{ x: number; y: number; radius: number; id: string }>
  ): string | null {
    const [wx, wy] = this.screenToWorld(screenX, screenY)

    let closest: string | null = null
    let closestDist = Infinity

    for (const node of nodes) {
      const dx = wx - node.x
      const dy = wy - node.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      // 增大命中区域（手指粗）
      const hitRadius = node.radius + 0.015
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist
        closest = node.id
      }
    }

    return closest
  }

  // ── 状态读取 ──────────────────────────

  getState(): ViewportState {
    return {
      scale: this.scale,
      translateX: this.translateX,
      translateY: this.translateY,
    }
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight }
  }
}
