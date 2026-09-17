import { View, Text, Image, Input, ScrollView, Canvas } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useCharacters, getAvatar, useCharacter } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { generateCompareCard, CompareCharData } from '../../utils/compareCardGenerator';
import { trackCompareGenerate, trackCardSave } from '../../utils/analytics';
import Icon from '../../components/Icon';
import './index.scss';

// cultivation can be string (lite) or array of objects (full)
const formatCultivation = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => v.realm_name || v.realm || '').filter(Boolean).join(' / ') || '';
  if (typeof val === 'object') return val.realm_name || val.realm || '';
  return '';
};

export default function ComparePage() {
  const router = useRouter();
  const char1Name = decodeURIComponent(router.params.char1 || '');
  const { data: allCharsDB, characterList } = useCharacters();

  useAppShare({
    title: `剑来光阴 - 人物对比`,
    path: `/pages/compare/index?char1=${encodeURIComponent(char1Name)}`
  });

  const [char2Name, setChar2Name] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(!char1Name);

  const { character: char1Full } = useCharacter(char1Name);
  const { character: char2Full } = useCharacter(char2Name);

  const [generating, setGenerating] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [cardImagePath, setCardImagePath] = useState('');

  const char1 = allCharsDB?.[char1Name] || null;
  const char2 = char2Name ? (allCharsDB?.[char2Name] || null) : null;

  // Merged full data (prefer full, fallback to lite)
  const c1 = char1Full || char1;
  const c2 = char2Full || char2;

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !characterList.length) return [];
    const q = searchQuery.trim().toLowerCase();
    return characterList
      .filter(c => {
        if (c.name === char1Name) return false;
        return c.name.toLowerCase().includes(q)
          || (c.aliases && c.aliases.some(a => a.toLowerCase().includes(q)));
      })
      .slice(0, 20);
  }, [searchQuery, characterList, char1Name]);

  const selectChar2 = (name: string) => {
    setChar2Name(name);
    setShowSearch(false);
    setSearchQuery('');
  };

  // ── Derived comparison data ──
  const getRelationCount = (c: any) => c?.relationCount ?? Object.keys(c?.relations || {}).length;
  const getQuotesCount = (c: any) => c?.quotes_count ?? c?.quotes?.length ?? 0;
  const getTechniques = (c: any): string[] => (c?.techniques || []).map((t: any) => t.name || t).filter(Boolean);
  const getTags = (c: any): string[] => c?.tags || [];
  const getFactions = (c: any): string[] => c?.factions || [];
  const getBio = (c: any): string => (c?.bio || '').replace(/\n/g, '');

  // Mutual relations
  const mutualRelations = useMemo(() => {
    if (!c1?.relations || !c2?.relations) return [];
    const r1Keys = new Set(Object.keys(c1.relations));
    return Object.keys(c2.relations).filter(k => r1Keys.has(k)).slice(0, 8);
  }, [c1, c2]);

  // Comparison rows
  const comparisonRows = useMemo(() => {
    if (!char1 || !char2) return [];
    return [
      {
        label: '修为',
        left: formatCultivation(c1?.cultivation) || formatCultivation(c1?.realm) || '—',
        right: formatCultivation(c2?.cultivation) || formatCultivation(c2?.realm) || '—',
      },
      {
        label: '势力',
        left: getFactions(c1)[0] || '—',
        right: getFactions(c2)[0] || '—',
      },
      {
        label: '关系',
        left: `${getRelationCount(c1)} 条`,
        right: `${getRelationCount(c2)} 条`,
      },
      {
        label: '语录',
        left: `${getQuotesCount(c1)} 句`,
        right: `${getQuotesCount(c2)} 句`,
      },
      {
        label: '功法',
        left: getTechniques(c1).length ? `${getTechniques(c1).length} 式` : '—',
        right: getTechniques(c2).length ? `${getTechniques(c2).length} 式` : '—',
      },
    ];
  }, [char1, char2, c1, c2]);

  const char1Quote = (char1Full?.quotes || char1?.quotes)?.[0]?.content || '';
  const char2Quote = (char2Full?.quotes || char2?.quotes)?.[0]?.content || '';

  const buildCompareData = (name: string, lite: any, full: any): CompareCharData => {
    const data = full || lite;
    if (!data) return { name, avatar: '', relationCount: 0 };
    const techniques = getTechniques(data);
    return {
      name: data.name,
      avatar: getAvatar(data),
      alias: data.aliases?.[0] || '',
      cultivation: formatCultivation(data.cultivation) || formatCultivation(data.realm),
      faction: getFactions(data)[0] || '',
      tags: getTags(data).slice(0, 4),
      techniquesCount: techniques.length,
      topTechniques: techniques.slice(0, 3),
      quotesCount: getQuotesCount(data),
      relationCount: getRelationCount(data),
      mutualRelations: mutualRelations.slice(0, 5),
      quote: (full?.quotes || data.quotes)?.[0]?.content || '',
    };
  };

  const handleGenerateCard = () => {
    if (!char1 || !char2 || generating) return;
    setGenerating(true);
    const query = Taro.createSelectorQuery();
    query.select('#compareCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        try {
          const canvasNode = res[0]?.node;
          if (!canvasNode) {
            Taro.showToast({ title: '画布初始化失败', icon: 'none' });
            setGenerating(false);
            return;
          }
          const dpr = Taro.getSystemInfoSync().pixelRatio;
          const leftData = buildCompareData(char1Name, char1, char1Full);
          const rightData = buildCompareData(char2Name, char2, char2Full);
          const tempPath = await generateCompareCard(canvasNode, leftData, rightData, dpr);
          trackCompareGenerate(char1Name, char2Name);
          setCardImagePath(tempPath);
          setShowCardPreview(true);
        } catch (err) {
          console.error('Compare card generation failed:', err);
          Taro.showToast({ title: '生成失败', icon: 'none' });
        } finally {
          setGenerating(false);
        }
      });
  };

  const handleSaveCard = () => {
    if (!cardImagePath) return;
    Taro.saveImageToPhotosAlbum({
      filePath: cardImagePath,
      success: () => {
        trackCardSave('compare', `${char1Name}_vs_${char2Name}`);
        Taro.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg?.includes('deny') || err.errMsg?.includes('auth')) {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册访问权限',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) Taro.openSetting(); }
          });
        } else {
          Taro.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  };

  // ─── Search mode ───
  if (showSearch) {
    return (
      <View className="compare-page-search">
        <View className="search-header">
          <View className="search-input-wrap">
            <Icon name="search" size={16} color="#999999" />
            <Input
              className="search-input"
              placeholder="搜索人物名称或别名"
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.detail.value)}
              confirmType="search"
              alwaysEmbed
            />
            {searchQuery && (
              <View className="clear-btn" onClick={() => setSearchQuery('')}>
                <Icon name="close" size={14} color="#999999" />
              </View>
            )}
          </View>
          {char1Name && (
            <View className="cancel-btn" onClick={() => setShowSearch(false)}>
              <Text>取消</Text>
            </View>
          )}
        </View>
        <View className="search-results-list">
          {searchResults.map(char => (
            <View key={char.name} className="search-item" onClick={() => selectChar2(char.name)}>
              <Image className="search-avatar" src={getAvatar(char)} mode="aspectFill" />
              <View className="search-info">
                <Text className="search-name">{char.name}</Text>
                {char.aliases?.[0] && <Text className="search-alias">{char.aliases[0]}</Text>}
              </View>
            </View>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <View className="search-empty">
              <Text>无匹配人物</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ─── Compare mode ───
  return (
    <View className="compare-page">
      <Canvas type="2d" id="compareCanvas" style={{ width: '750px', height: '1200px', position: 'fixed', left: '-9999px', top: 0 }} />

      {showCardPreview && cardImagePath && (
        <View className="card-preview-modal" onClick={() => setShowCardPreview(false)}>
          <View className="card-preview-content" onClick={e => e.stopPropagation()}>
            <Image className="card-preview-image" src={cardImagePath} mode="widthFix" />
            <View className="card-preview-actions">
              <View className="card-action-btn save-btn" onClick={handleSaveCard}><Text>保存到相册</Text></View>
              <View className="card-action-btn close-btn" onClick={() => setShowCardPreview(false)}><Text>关闭</Text></View>
            </View>
          </View>
        </View>
      )}

      <ScrollView scrollY className="compare-scroll">
        {/* ── Header: avatars + VS ── */}
        <View className="compare-header">
          <View className="char-column" onClick={() => char1 && Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(char1Name)}` })}>
            {char1 ? (
              <>
                <Image className="char-avatar" src={getAvatar(char1)} mode="aspectFill" />
                <Text className="char-name">{char1.name}</Text>
                {char1.aliases?.[0] && <Text className="char-alias">"{char1.aliases[0]}"</Text>}
              </>
            ) : (
              <View className="char-placeholder"><Text>加载中...</Text></View>
            )}
          </View>

          <View className="vs-badge"><Text className="vs-text">VS</Text></View>

          <View className="char-column" onClick={() => !char2 ? setShowSearch(true) : Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(char2Name)}` })}>
            {char2 ? (
              <>
                <Image className="char-avatar" src={getAvatar(char2)} mode="aspectFill" />
                <Text className="char-name">{char2.name}</Text>
                {char2.aliases?.[0] && <Text className="char-alias">"{char2.aliases[0]}"</Text>}
                <Text className="change-btn" onClick={(e) => { e.stopPropagation(); setShowSearch(true); setChar2Name(''); }}>换一个</Text>
              </>
            ) : (
              <View className="char-placeholder" onClick={() => setShowSearch(true)}>
                <Icon name="plus" size={32} color="#999999" />
                <Text className="placeholder-text">选择对比对象</Text>
              </View>
            )}
          </View>
        </View>

        {char1 && char2 && c1 && c2 && (
          <View className="compare-body">
            {/* ── Tags ── */}
            {(getTags(c1).length > 0 || getTags(c2).length > 0) && (
              <View className="tags-section">
                <View className="tags-col">
                  {getTags(c1).slice(0, 4).map(t => (
                    <Text key={t} className="tag-pill">{t}</Text>
                  ))}
                </View>
                <Text className="section-label">身份</Text>
                <View className="tags-col">
                  {getTags(c2).slice(0, 4).map(t => (
                    <Text key={t} className="tag-pill">{t}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* ── Comparison rows ── */}
            {comparisonRows.map((row, idx) => (
              <View key={idx} className="compare-row">
                <Text className="row-left">{row.left}</Text>
                <Text className="row-label">{row.label}</Text>
                <Text className="row-right">{row.right}</Text>
              </View>
            ))}

            {/* ── Top techniques ── */}
            {(getTechniques(c1).length > 0 || getTechniques(c2).length > 0) && (
              <View className="techniques-section">
                <View className="tech-col">
                  {getTechniques(c1).slice(0, 3).map(t => (
                    <Text key={t} className="tech-name">{t}</Text>
                  ))}
                </View>
                <Text className="section-label">代表功法</Text>
                <View className="tech-col">
                  {getTechniques(c2).slice(0, 3).map(t => (
                    <Text key={t} className="tech-name">{t}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* ── Mutual relations ── */}
            {mutualRelations.length > 0 && (
              <View className="mutual-section">
                <Text className="mutual-label">共同关系人</Text>
                <View className="mutual-names">
                  {mutualRelations.map(name => (
                    <Text key={name} className="mutual-name" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(name)}` })}>{name}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* ── Quotes ── */}
            {(char1Quote || char2Quote) && (
              <View className="quotes-section">
                <Text className="section-title">代表金句</Text>
                <View className="quotes-pair">
                  <View className="quote-col">
                    {char1Quote && <Text className="quote-text">「{char1Quote.slice(0, 50)}{char1Quote.length > 50 ? '…' : ''}」</Text>}
                  </View>
                  <View className="quote-col">
                    {char2Quote && <Text className="quote-text">「{char2Quote.slice(0, 50)}{char2Quote.length > 50 ? '…' : ''}」</Text>}
                  </View>
                </View>
              </View>
            )}

            {/* ── Bio ── */}
            {(getBio(c1) || getBio(c2)) && (
              <View className="bio-section">
                <Text className="section-title">人物简介</Text>
                <View className="bio-pair">
                  <View className="bio-col">
                    <Text className="bio-name">{c1.name}</Text>
                    <Text className="bio-text">{getBio(c1) || '暂无简介'}</Text>
                  </View>
                  <View className="bio-col">
                    <Text className="bio-name">{c2.name}</Text>
                    <Text className="bio-text">{getBio(c2) || '暂无简介'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Generate card ── */}
            <View className="generate-btn" onClick={handleGenerateCard}>
              <Icon name="share" size={18} color="#ffffff" />
              <Text className="generate-text">{generating ? '生成中...' : '生成对比卡片'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
