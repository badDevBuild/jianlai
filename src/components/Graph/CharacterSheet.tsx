/**
 * CharacterSheet — Layer 2 人物关系详情底部卡片
 *
 * 从 chars/{name}.json 懒加载数据，展示：
 * - 人物基本信息（名字、别名、境界、势力）
 * - 关系分组（按归并后类型分组，每组可折叠）
 * - 每条关系的原文证据
 */

import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getAvatar } from '../../data/useData'
import './CharacterSheet.scss'

// 关系类型 → 颜色
const CATEGORY_COLORS: Record<string, string> = {
  '情感': '#c76a79',
  '师徒': '#b8860b',
  '友谊': '#5d7a5d',
  '敌对': '#333333',
  '血亲': '#485a6c',
  '主从': '#6b4c6e',
  '同门': '#7a6e5d',
  '击杀': '#8b0000',
  '上下级': '#4a5568',
  '合作': '#6b8e7b',
  '敬畏': '#8b7355',
  '对抗': '#5a5a5a',
  '其他': '#c0bdb5',
}

// 关系类型归并（与 data/build/relation_type_map.json 同步）
const TYPE_KEYWORDS: Record<string, string> = {
  '情侣': '情感', '夫妻': '情感', '爱慕': '情感', '喜欢': '情感', '暗恋': '情感', '倾慕': '情感',
  '伴侣': '情感', '恋人': '情感', '青梅竹马': '情感', '心仪': '情感', '爱情': '情感', '道侣': '情感',
  '暧昧': '情感', '单恋': '情感', '思念': '情感', '宠溺': '情感', '喜爱': '情感', '单相思': '情感',
  '旧情': '情感', '追求': '情感', '亲密': '情感', '疼爱': '情感', '爱护': '情感', '关爱': '情感',
  '师徒': '师徒', '弟子': '师徒', '先生': '师徒', '学生': '师徒', '教导': '师徒', '学徒': '师徒',
  '传承': '师徒', '授业': '师徒', '受教': '师徒', '指点': '师徒', '点拨': '师徒', '师生': '师徒',
  '点化': '师徒', '指导': '师徒', '传道': '师徒', '提携': '师徒', '教诲': '师徒', '亦师亦友': '师徒',
  '师长': '师徒', '引导': '师徒', '师承': '师徒', '师祖': '师徒', '徒孙': '师徒',
  '朋友': '友谊', '好友': '友谊', '兄弟': '友谊', '挚友': '友谊', '损友': '友谊', '知己': '友谊',
  '同伴': '友谊', '旧识': '友谊', '酒友': '友谊', '忘年交': '友谊', '旧友': '友谊', '玩伴': '友谊',
  '战友': '友谊', '同乡': '友谊', '欢喜冤家': '友谊', '友谊': '友谊', '同行': '友谊', '发小': '友谊',
  '友善': '友谊', '伙伴': '友谊', '友好': '友谊', '赠宝': '友谊', '邻里': '友谊', '结拜兄弟': '友谊',
  '搭档': '友谊', '故人': '友谊', '生死之交': '友谊', '赠礼': '友谊', '赠予': '友谊', '报恩': '友谊',
  '敌对': '敌对', '死敌': '敌对', '仇人': '敌对', '问剑': '敌对', '宿敌': '敌对', '仇敌': '敌对',
  '厌恶': '敌对', '冲突': '敌对', '仇恨': '敌对', '威胁': '敌对', '觊觎': '敌对', '鄙视': '敌对',
  '怨恨': '敌对', '嫉妒': '敌对', '死仇': '敌对', '敌视': '敌对', '背叛': '敌对', '欺骗': '敌对',
  '家人': '血亲', '亲人': '血亲', '父子': '血亲', '母女': '血亲', '父女': '血亲', '母子': '血亲',
  '兄妹': '血亲', '姐弟': '血亲', '祖孙': '血亲', '亲属': '血亲', '长辈': '血亲', '晚辈': '血亲',
  '前辈': '血亲', '叔侄': '血亲', '姐妹': '血亲',
  '主仆': '主从', '护道': '主从', '侍从': '主从', '效忠': '主从', '追随': '主从', '守护': '主从',
  '庇护': '主从', '保护': '主从', '主从': '主从', '救助': '主从', '依附': '主从', '从属': '主从',
  '操控': '主从', '照顾': '主从', '雇佣': '主从', '护送': '主从',
  '师兄弟': '同门', '同门': '同门', '同窗': '同门', '同修': '同门', '师叔侄': '同门', '同道': '同门',
  '击杀': '击杀', '斩杀': '击杀', '杀害': '击杀', '杀戮': '击杀', '碾压': '击杀', '追杀': '击杀',
  '镇压': '击杀', '厮杀': '击杀',
  '上下级': '上下级', '君臣': '上下级', '臣子': '上下级', '下属': '上下级', '命令': '上下级',
  '盟友': '合作', '合作': '合作', '交易': '合作', '同僚': '合作', '招揽': '合作', '利用': '合作',
  '谈判': '合作', '救援': '合作', '协助': '合作', '共生': '合作', '合伙人': '合作', '帮助': '合作',
  '敬重': '敬畏', '畏惧': '敬畏', '威慑': '敬畏', '欣赏': '敬畏', '仰慕': '敬畏', '崇拜': '敬畏',
  '敬畏': '敬畏', '感激': '敬畏', '忌惮': '敬畏', '敬佩': '敬畏', '认可': '敬畏', '信任': '敬畏',
  '赏识': '敬畏', '怀念': '敬畏', '恩人': '敬畏', '敬仰': '敬畏', '恐惧': '敬畏', '推崇': '敬畏',
  '压制': '对抗', '对峙': '对抗', '试探': '对抗', '算计': '对抗', '切磋': '对抗', '警告': '对抗',
  '论道': '对抗', '敲打': '对抗', '惩戒': '对抗', '问拳': '对抗', '挑衅': '对抗', '嘲讽': '对抗',
  '击败': '对抗', '大道之争': '对抗', '亦敌亦友': '对抗',
}

function normalizeRelType(types: string[]): string {
  for (const compound of types) {
    for (const atom of compound.split('/')) {
      const trimmed = atom.trim()
      if (TYPE_KEYWORDS[trimmed]) return TYPE_KEYWORDS[trimmed]
    }
  }
  return '其他'
}

// 星级显示
function strengthStars(strength: number): string {
  const stars = Math.min(5, Math.round(strength / 2))
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

interface CharRelation {
  target: string
  type: string[]
  strength: number
  evidence: Array<{ chapter: string; text: string }>
  category: string
}

interface CharData {
  name: string
  aliases?: string[]
  cultivation?: string
  factions?: string[]
  relations: Record<string, { type: string[]; strength: number; evidence: Array<{ chapter: string; text: string }> }>
}

interface Props {
  charName: string
  factionName: string
  onClose: () => void
  onCharTap: (name: string) => void
}

const API_BASE = process.env.API_BASE || 'https://shushu.host/jianlai/data'

export default function CharacterSheet({ charName, factionName, onClose, onCharTap }: Props) {
  const [charData, setCharData] = useState<CharData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setExpandedCategory(null)
    Taro.request({
      url: `${API_BASE}/chars/${encodeURIComponent(charName)}.json`,
      timeout: 10000,
    })
      .then(res => setCharData(res.data))
      .catch(() => setCharData(null))
      .finally(() => setLoading(false))
  }, [charName])

  // 将关系按类别分组
  const groupedRelations: Record<string, CharRelation[]> = {}
  if (charData?.relations) {
    for (const [target, rdata] of Object.entries(charData.relations)) {
      const category = normalizeRelType(rdata.type || [])
      if (!groupedRelations[category]) groupedRelations[category] = []
      groupedRelations[category].push({
        target,
        type: rdata.type || [],
        strength: rdata.strength || 0,
        evidence: rdata.evidence || [],
        category,
      })
    }
    // 每组内按强度排序
    for (const cat of Object.keys(groupedRelations)) {
      groupedRelations[cat].sort((a, b) => b.strength - a.strength)
    }
  }

  // 按类别人数排序
  const sortedCategories = Object.entries(groupedRelations)
    .sort((a, b) => b[1].length - a[1].length)

  const totalRelations = Object.values(groupedRelations).reduce((sum, arr) => sum + arr.length, 0)

  const avatarUrl = charData ? getAvatar(charData as any) : ''

  return (
    <View className='sheet-mask'>
      <View className='sheet-container'>
        {/* 顶部导航栏 */}
        <View className='sheet-nav'>
          <View className='sheet-back' onClick={onClose}>
            <Text>‹ 返回{factionName}</Text>
          </View>
        </View>

        {loading ? (
          <View className='sheet-loading'>加载中...</View>
        ) : !charData ? (
          <View className='sheet-loading'>暂无数据</View>
        ) : (
          <ScrollView scrollY className='sheet-scroll'>
            {/* 头部信息 */}
            <View className='sheet-header'>
              <Image className='sheet-avatar' src={avatarUrl} mode='aspectFill' />
              <View className='sheet-info'>
                <Text className='sheet-name'>{charName}</Text>
                {charData.cultivation && (
                  <Text className='sheet-realm'>
                    {Array.isArray(charData.cultivation)
                      ? charData.cultivation.map((c: any) => c.realm_name || c.realm || c.path).filter(Boolean).join(' · ')
                      : String(charData.cultivation)}
                  </Text>
                )}
                <Text className='sheet-faction'>{factionName} · {totalRelations}条关系</Text>
                {charData.aliases && charData.aliases.length > 0 && (
                  <Text className='sheet-aliases'>
                    别名: {charData.aliases.slice(0, 5).join('、')}
                  </Text>
                )}
              </View>
            </View>

            {/* 关系分组 */}
            {sortedCategories.map(([category, relations]) => {
              const color = CATEGORY_COLORS[category] || '#999'
              const isExpanded = expandedCategory === category

              return (
                <View key={category} className='relation-group'>
                  <View
                    className='group-header'
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <View className='group-dot' style={{ background: color }} />
                    <Text className='group-name'>{category}</Text>
                    <Text className='group-count'>{relations.length}人</Text>
                    <Text className='group-arrow'>{isExpanded ? '▼' : '▶'}</Text>
                  </View>

                  {/* 始终显示前 3 条，展开后显示全部 */}
                  {(isExpanded ? relations : relations.slice(0, 3)).map((rel, i) => (
                    <View key={i} className='relation-card' onClick={() => onCharTap(rel.target)}>
                      <View className='rel-header'>
                        <Text className='rel-target'>{rel.target}</Text>
                        <Text className='rel-strength' style={{ color }}>
                          {strengthStars(rel.strength)}
                        </Text>
                      </View>
                      {/* 显示第一条证据 */}
                      {rel.evidence.length > 0 && (
                        <View className='rel-evidence'>
                          <Text className='evidence-text'>
                            "{rel.evidence[0].text}"
                          </Text>
                          <Text className='evidence-chapter'>
                            {rel.evidence[0].chapter}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {!isExpanded && relations.length > 3 && (
                    <View
                      className='group-more'
                      onClick={() => setExpandedCategory(category)}
                    >
                      <Text>查看全部 {relations.length} 条 ▶</Text>
                    </View>
                  )}
                </View>
              )
            })}

            {/* 底部安全区 */}
            <View style={{ height: '60px' }} />
          </ScrollView>
        )}
      </View>
    </View>
  )
}
