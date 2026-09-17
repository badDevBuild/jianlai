/**
 * 关系图谱 — 势力版图（三层语义缩放）
 *
 * Layer 0: 势力气泡鸟瞰图（Canvas）
 * Layer 1: 势力内部人物网络（Canvas）
 * Layer 2: 人物关系详情（原生底部卡片）
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Text, Canvas, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CanvasViewport } from '../../utils/canvas-viewport'
import CharacterSheet from '../../components/Graph/CharacterSheet'
import './index.scss'

const API_BASE = process.env.API_BASE || 'https://shushu.host/jianlai/data'

// ── 数据类型 ─────────────────────────────

interface MemberNode {
  name: string
  x: number
  y: number
  importance: number
}

interface FactionData {
  id: string
  x: number
  y: number
  radius: number
  memberCount: number
  type: string
  color: string
  members: MemberNode[]
}

interface FactionEdge {
  source: string
  target: string
  strength: number
}

interface Relation {
  source: string
  target: string
  relation: string[]
  strength: number
}

interface LayoutData {
  factions: FactionData[]
  factionEdges: FactionEdge[]
  meta: { totalFactions: number; totalMembers: number }
}

type LayerState = 0 | 1 | 2

// ── 渲染：Layer 0 鸟瞰 ──────────────────

function renderLayer0(
  ctx: any,
  viewport: CanvasViewport,
  factions: FactionData[],
  edges: FactionEdge[],
  activeFactionId: string | null,
  pixelRatio: number
) {
  const { width, height } = viewport.getCanvasSize()
  ctx.clearRect(0, 0, width * pixelRatio, height * pixelRatio)
  ctx.save()
  ctx.scale(pixelRatio, pixelRatio)

  const posMap: Record<string, { x: number; y: number }> = {}
  for (const f of factions) posMap[f.id] = { x: f.x, y: f.y }

  // 连线
  for (const edge of edges) {
    const src = posMap[edge.source], tgt = posMap[edge.target]
    if (!src || !tgt) continue
    const [sx, sy] = viewport.worldToScreen(src.x, src.y)
    const [tx, ty] = viewport.worldToScreen(tgt.x, tgt.y)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(tx, ty)
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'
    ctx.lineWidth = Math.max(0.5, Math.log(edge.strength + 1) * 0.3)
    ctx.stroke()
  }

  // 气泡
  for (const f of factions) {
    const [cx, cy] = viewport.worldToScreen(f.x, f.y)
    const r = viewport.worldToScreenSize(f.radius)
    if (cx + r < -10 || cx - r > width + 10 || cy + r < -10 || cy - r > height + 10) continue

    const isActive = f.id === activeFactionId
    const opacity = activeFactionId && !isActive ? '18' : isActive ? 'cc' : '33'

    // 填充
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = f.color + opacity
    ctx.fill()

    // 边框
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = isActive ? f.color : f.color + '66'
    ctx.lineWidth = isActive ? 2.5 : 1
    ctx.setLineDash(isActive ? [] : [3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // 文字
    if (r > 12) {
      ctx.fillStyle = activeFactionId && !isActive ? '#ccc' : '#1a1a1a'
      ctx.font = `${Math.max(10, Math.min(14, r * 0.35))}px "PingFang SC"`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.id, cx, cy - (r > 25 ? 6 : 0))
      if (r > 25) {
        ctx.fillStyle = activeFactionId && !isActive ? '#ddd' : '#999'
        ctx.font = `${Math.max(9, r * 0.22)}px "PingFang SC"`
        ctx.fillText(`${f.memberCount}人`, cx, cy + 10)
      }
    }
  }

  ctx.restore()
}

// ── 渲染：Layer 1 势力内部 ───────────────

function renderLayer1(
  ctx: any,
  viewport: CanvasViewport,
  faction: FactionData,
  intraRelations: Relation[],
  selectedCharName: string | null,
  pixelRatio: number
) {
  const { width, height } = viewport.getCanvasSize()
  ctx.clearRect(0, 0, width * pixelRatio, height * pixelRatio)
  ctx.save()
  ctx.scale(pixelRatio, pixelRatio)

  const members = faction.members || []

  // 构建位置索引
  const posMap: Record<string, { x: number; y: number }> = {}
  for (const m of members) posMap[m.name] = { x: m.x, y: m.y }

  // 背景: 势力范围圈
  const [fcx, fcy] = viewport.worldToScreen(faction.x, faction.y)
  const fr = viewport.worldToScreenSize(faction.radius * 1.2)
  ctx.beginPath()
  ctx.arc(fcx, fcy, fr, 0, Math.PI * 2)
  ctx.fillStyle = faction.color + '08'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(fcx, fcy, fr, 0, Math.PI * 2)
  ctx.strokeStyle = faction.color + '22'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.stroke()
  ctx.setLineDash([])

  // 关系线
  for (const rel of intraRelations) {
    const sp = posMap[rel.source], tp = posMap[rel.target]
    if (!sp || !tp) continue
    const [sx, sy] = viewport.worldToScreen(sp.x, sp.y)
    const [tx, ty] = viewport.worldToScreen(tp.x, tp.y)
    const isHighlight = rel.source === selectedCharName || rel.target === selectedCharName
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(tx, ty)
    ctx.strokeStyle = isHighlight ? 'rgba(176,58,46,0.25)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = isHighlight ? 1.5 : 0.5
    ctx.stroke()
  }

  // 人物节点
  const maxImportance = Math.max(...members.map(m => m.importance), 1)
  for (const m of members) {
    const [cx, cy] = viewport.worldToScreen(m.x, m.y)
    // 节点大小: 4px ~ 18px 按重要性映射
    const nodeR = 4 + 14 * Math.sqrt(m.importance / maxImportance)
    const screenR = Math.max(3, viewport.worldToScreenSize(0.003) + nodeR * 0.5)

    if (cx + screenR < -5 || cx - screenR > width + 5 || cy + screenR < -5 || cy - screenR > height + 5) continue

    const isSelected = m.name === selectedCharName
    const fillColor = isSelected ? '#b03a2e' : faction.color

    // 节点圆
    ctx.beginPath()
    ctx.arc(cx, cy, screenR, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? fillColor + 'dd' : fillColor + '55'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, screenR, 0, Math.PI * 2)
    ctx.strokeStyle = isSelected ? '#b03a2e' : fillColor + '88'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.stroke()

    // 选中外圈
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(cx, cy, screenR + 4, 0, Math.PI * 2)
      ctx.strokeStyle = '#b03a2e44'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 名字标签
    if (screenR > 6 || isSelected) {
      const fontSize = Math.max(9, Math.min(13, screenR * 0.8))
      ctx.fillStyle = isSelected ? '#b03a2e' : '#333'
      ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px "PingFang SC"`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(m.name, cx, cy + screenR + 3)
    }
  }

  ctx.restore()
}

// ── 主页面组件 ───────────────────────────

export default function GraphPage() {
  // 数据
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null)
  const [relations, setRelations] = useState<Relation[]>([])
  const [loading, setLoading] = useState(true)

  // 三层状态
  const [layer, setLayer] = useState<LayerState>(0)
  const [activeFactionId, setActiveFactionId] = useState<string | null>(null)
  const [selectedCharName, setSelectedCharName] = useState<string | null>(null)

  // 搜索
  const [searchText, setSearchText] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Canvas refs
  const viewportRef = useRef<CanvasViewport | null>(null)
  const pixelRatioRef = useRef(2)

  // 渲染循环需要的 refs（避免闭包陈旧问题）
  const layerRef = useRef<LayerState>(0)
  const activeFactionRef = useRef<string | null>(null)
  const selectedCharRef = useRef<string | null>(null)
  const layoutRef = useRef<LayoutData | null>(null)
  const relationsRef = useRef<Relation[]>([])

  // 同步 state → ref
  useEffect(() => { layerRef.current = layer }, [layer])
  useEffect(() => { activeFactionRef.current = activeFactionId; viewportRef.current?.markDirty() }, [activeFactionId])
  useEffect(() => { selectedCharRef.current = selectedCharName; viewportRef.current?.markDirty() }, [selectedCharName])
  useEffect(() => { layoutRef.current = layoutData }, [layoutData])
  useEffect(() => { relationsRef.current = relations }, [relations])

  // ── 数据加载 ──────────────────────────

  useEffect(() => {
    const loadData = async () => {
      try {
        const [layoutRes, relRes] = await Promise.all([
          Taro.request({ url: `${API_BASE}/graph_layout.json`, timeout: 10000 }),
          Taro.request({ url: `${API_BASE}/relations.json`, timeout: 15000 }),
        ])
        const ld = layoutRes.data
        // 校验返回的确实是有效布局数据（CDN 可能返回 404 HTML）
        if (ld && typeof ld === 'object' && Array.isArray(ld.factions)) {
          setLayoutData(ld as LayoutData)
        } else {
          console.error('graph_layout.json 格式无效，可能未上传到 CDN')
        }
        if (Array.isArray(relRes.data)) {
          setRelations(relRes.data as Relation[])
        }
      } catch (err) {
        console.error('数据加载失败:', err)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // ── Canvas 初始化 ──────────────────────

  useEffect(() => {
    if (!layoutData) return

    const timer = setTimeout(() => {
      const sysInfo = Taro.getSystemInfoSync()
      const pixelRatio = sysInfo.pixelRatio || 2
      pixelRatioRef.current = pixelRatio
      const canvasWidth = sysInfo.windowWidth
      const canvasHeight = sysInfo.windowHeight

      const query = Taro.createSelectorQuery()
      query.select('#graph-canvas').fields({ node: true, size: true }).exec((res) => {
        if (!res?.[0]?.node) return

        const canvas = res[0].node
        canvas.width = canvasWidth * pixelRatio
        canvas.height = canvasHeight * pixelRatio
        const ctx = canvas.getContext('2d')

        const viewport = new CanvasViewport({
          canvasWidth,
          canvasHeight,
          minScale: 0.3,
          maxScale: 8.0,
          friction: 0.93,
          onRender: (renderCtx, vp) => {
            const data = layoutRef.current
            if (!data) return

            if (layerRef.current === 0) {
              renderLayer0(
                renderCtx, vp,
                data.factions,
                data.factionEdges,
                activeFactionRef.current,
                pixelRatioRef.current
              )
            } else if (layerRef.current === 1) {
              const faction = data.factions.find(f => f.id === activeFactionRef.current)
              if (faction) {
                const intraRels = getIntraRelations(faction, relationsRef.current)
                renderLayer1(
                  renderCtx, vp,
                  faction,
                  intraRels,
                  selectedCharRef.current,
                  pixelRatioRef.current
                )
              }
            }
          },
        })

        viewport.bindContext(ctx)
        viewportRef.current = viewport
      })
    }, 150)

    return () => {
      clearTimeout(timer)
      viewportRef.current?.destroy()
    }
  }, [layoutData])

  // ── 辅助：获取势力内部关系 ─────────────

  function getIntraRelations(faction: FactionData, allRelations: Relation[]): Relation[] {
    const memberSet = new Set((faction.members || []).map(m => m.name))
    return allRelations.filter(r => memberSet.has(r.source) && memberSet.has(r.target))
  }

  // ── 交互：进入 Layer 1 ────────────────

  const enterFaction = useCallback((factionId: string) => {
    const faction = layoutData?.factions.find(f => f.id === factionId)
    if (!faction || !viewportRef.current) return

    setActiveFactionId(factionId)
    setLayer(1)
    setSelectedCharName(null)

    // 动画缩放到势力区域
    const targetScale = viewportRef.current.getCanvasSize().width / (faction.radius * 2.5)
    viewportRef.current.animateTo(faction.x, faction.y, targetScale, 300)
  }, [layoutData])

  // ── 交互：返回 Layer 0 ────────────────

  const backToOverview = useCallback(() => {
    setLayer(0)
    setActiveFactionId(null)
    setSelectedCharName(null)

    if (viewportRef.current) {
      const canvasW = viewportRef.current.getCanvasSize().width
      viewportRef.current.animateTo(0.5, 0.5, canvasW * 0.9, 300)
    }
  }, [])

  // ── 触摸事件 ──────────────────────────

  const handleTouchStart = useCallback((e) => {
    viewportRef.current?.handleTouchStart(
      e.touches.map((t: any) => ({ x: t.x, y: t.y }))
    )
  }, [])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault?.()
    viewportRef.current?.handleTouchMove(
      e.touches.map((t: any) => ({ x: t.x, y: t.y }))
    )
  }, [])

  const handleTouchEnd = useCallback((e) => {
    viewportRef.current?.handleTouchEnd(
      (e.touches || []).map((t: any) => ({ x: t.x, y: t.y }))
    )
  }, [])

  // ── 点击 ──────────────────────────────

  const handleTap = useCallback((e) => {
    if (!viewportRef.current || !layoutData) return
    const touch = e.detail || e.touches?.[0]
    if (!touch) return

    if (layerRef.current === 0) {
      // Layer 0: 点击势力气泡
      const hitId = viewportRef.current.hitTest(
        touch.x, touch.y,
        layoutData.factions.map(f => ({ x: f.x, y: f.y, radius: f.radius, id: f.id }))
      )
      if (hitId) {
        enterFaction(hitId)
      }
    } else if (layerRef.current === 1) {
      // Layer 1: 点击人物节点
      const faction = layoutData.factions.find(f => f.id === activeFactionRef.current)
      if (!faction) return
      const hitId = viewportRef.current.hitTest(
        touch.x, touch.y,
        (faction.members || []).map(m => ({ x: m.x, y: m.y, radius: 0.008, id: m.name }))
      )
      if (hitId) {
        setSelectedCharName(hitId)
        setLayer(2)
      }
    }
  }, [layoutData, enterFaction])

  // ── 搜索 ──────────────────────────────

  const searchResults = searchText.trim()
    ? (layoutData?.factions || []).flatMap(f =>
        (f.members || [])
          .filter(m => m.name.includes(searchText.trim()))
          .map(m => ({ name: m.name, faction: f.id }))
      ).slice(0, 8)
    : []

  const handleSearchSelect = useCallback((name: string, factionId: string) => {
    setSearchText('')
    setSearchFocused(false)
    // 先进入势力，再选中人物
    enterFaction(factionId)
    setTimeout(() => {
      setSelectedCharName(name)
      setLayer(2)
    }, 400) // 等动画完成
  }, [enterFaction])

  // ── 人物详情卡交互 ────────────────────

  const handleCharSheetClose = useCallback(() => {
    setSelectedCharName(null)
    setLayer(1)
    viewportRef.current?.markDirty()
  }, [])

  const handleCharTap = useCallback((name: string) => {
    // 在详情卡内点击另一个人物
    const faction = layoutData?.factions.find(f =>
      (f.members || []).some(m => m.name === name)
    )
    if (faction) {
      if (faction.id !== activeFactionId) {
        enterFaction(faction.id)
        setTimeout(() => {
          setSelectedCharName(name)
          setLayer(2)
        }, 400)
      } else {
        setSelectedCharName(name)
      }
    }
  }, [layoutData, activeFactionId, enterFaction])

  // ── 渲染 ─────────────────────────────

  return (
    <View className='graph-container'>
      <Canvas
        type='2d'
        id='graph-canvas'
        className={layer < 2 ? 'graph-canvas' : 'graph-canvas graph-canvas-hidden'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTap={handleTap}
      />

      {/* 搜索栏 */}
      <View className='search-area'>
        <View className='search-bar'>
          <Text className='search-icon'>🔍</Text>
          <Input
            className='search-input'
            placeholder='搜索人物...'
            value={searchText}
            onInput={e => setSearchText(e.detail.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
        </View>
        {searchFocused && searchResults.length > 0 && (
          <View className='search-results'>
            {searchResults.map((r, i) => (
              <View
                key={i}
                className='search-item'
                onClick={() => handleSearchSelect(r.name, r.faction)}
              >
                <Text className='search-name'>{r.name}</Text>
                <Text className='search-faction'>{r.faction}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 面包屑导航 (Layer 1+) */}
      {layer >= 1 && (
        <View className='breadcrumb'>
          <Text className='bread-link' onClick={backToOverview}>全局</Text>
          <Text className='bread-sep'>›</Text>
          <Text className='bread-current'>{activeFactionId}</Text>
        </View>
      )}

      {/* 底部信息栏 (Layer 0) */}
      {layer === 0 && !loading && !searchFocused && (
        <View className='bottom-hint'>
          <Text className='hint-text'>
            {layoutData?.meta?.totalFactions || 0} 个势力 · 点击进入查看成员
          </Text>
        </View>
      )}

      {/* Layer 1 底部提示 */}
      {layer === 1 && (
        <View className='bottom-hint'>
          <Text className='hint-text'>
            {layoutData?.factions.find(f => f.id === activeFactionId)?.memberCount || 0} 个成员 · 点击人物查看关系
          </Text>
        </View>
      )}

      {/* 加载状态 */}
      {loading && (
        <View className='loading-overlay'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )}

      {/* Layer 2: 人物详情卡 */}
      {layer === 2 && selectedCharName && activeFactionId && (
        <CharacterSheet
          charName={selectedCharName}
          factionName={activeFactionId}
          onClose={handleCharSheetClose}
          onCharTap={handleCharTap}
        />
      )}
    </View>
  )
}
