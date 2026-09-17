import { View, Text, ScrollView, Image, Canvas } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { useItem, getItemIcon } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { trackPageView, trackCardGenerate, trackCardSave } from '../../utils/analytics';
import { generateItemCard } from '../../utils/itemCardGenerator';
import Icon from '../../components/Icon';
import UgcEntry from '../../components/UgcEntry';
import './index.scss';

export default function ArtifactDetail() {
  const router = useRouter();
  const name = decodeURIComponent(router.params.name || '');
  const { item, loading, error } = useItem(name);
  useAppShare({
    title: `【剑来·法宝】${name}`,
    path: `/pages/artifact-detail/index?name=${encodeURIComponent(name)}`
  });
  useEffect(() => { trackPageView('/pages/artifact-detail/index', name); }, [name]);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [cardImagePath, setCardImagePath] = useState('');

  const handleGenerateCard = () => {
    if (!item || generating) return;
    setGenerating(true);
    const query = Taro.createSelectorQuery();
    query.select('#itemCardCanvas')
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
          const tempPath = await generateItemCard(canvasNode, {
            name: item.name,
            grade: item.grade || '未知',
            type: item.type,
            owner: (item as any).holder || (item as any).current_owner || '',
            description: item.description || '',
            icon: getItemIcon(item),
          }, dpr);
          trackCardGenerate('item', item.name);
          setCardImagePath(tempPath);
          setShowCardPreview(true);
        } catch (err) {
          console.error('Item card generation failed:', err);
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
        trackCardSave('item', name);
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

  useEffect(() => {
    if (item) {
      Taro.setNavigationBarTitle({ title: `${item.name} - 剑来` });
    }
  }, [item]);

  if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
  if (error || !item) return <View className="error-container"><Text>法宝不存在</Text></View>;

  const getGradeClass = (grade: string) => {
    if (grade === '神器') return 'grade-shenqi';
    if (grade === '仙兵') return 'grade-xianbing';
    if (grade === '半仙兵') return 'grade-banxianbing';
    if (grade === '法宝') return 'grade-fabao';
    if (grade === '灵器') return 'grade-lingqi';
    return 'grade-normal';
  };

  const iconSrc = getItemIcon(item);
  const gradeLevel = getGradeClass(item.grade as string);

  return (
    <ScrollView className="detail-page" scrollY>
      {/* Hidden Canvas */}
      <Canvas type="2d" id="itemCardCanvas" style={{ width: '750px', height: '1100px', position: 'fixed', left: '-9999px', top: 0 }} />

      {/* Card Preview Modal */}
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

      {/* Image / Header */}
      <View className="detail-header">
        <View className="avatar-wrapper">
          <Image className="detail-avatar" src={iconSrc} mode="aspectFit" />
          <UgcEntry entryName={item.name} entryType="法宝" field="image" label="换配图" />
        </View>
        <View className="detail-header-info">
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text className={`detail-name grade-${gradeLevel}`}>{item.name}</Text>
          </View>
          <View className="tags-row">
            <View className={`grade-pill ${getGradeClass(item.grade as string)}`}>
              <Text>{item.grade || '未知品秩'}</Text>
            </View>
            {item.subtype && (
              <View className="grade-pill grade-normal">
                <Text>{item.subtype}</Text>
              </View>
            )}
          </View>
        </View>
        {/* 分享卡片按钮 */}
        <View className="share-card-btn" onClick={handleGenerateCard}>
          <Icon name="share" size={16} color="#485a6c" />
          <Text className="share-card-text">{generating ? '生成中...' : '分享卡片'}</Text>
        </View>
      </View>

      {/* Main Desc */}
      {item.description && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">法宝卷宗</Text>
          </View>
          <View className="section-content paper-texture">
            <Text className="text-content">{item.description}</Text>
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="description" /></View>
        </View>
      )}

      {/* 外观 Visual */}
      {item.visual && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">外观形态</Text>
          </View>
          <View className="section-content">
            {item.visual.static && (
              <View className="info-row">
                <Text className="info-label">静止：</Text>
                <Text className="info-value">{item.visual.static}</Text>
              </View>
            )}
            {item.visual.active && (
              <View className="info-row">
                <Text className="info-label">动态：</Text>
                <Text className="info-value">{item.visual.active}</Text>
              </View>
            )}
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="visual" /></View>
        </View>
      )}

      {/* 能力 Abilities */}
      {(item.supernatural_ability || item.rank_potential) && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">神异能力</Text>
          </View>
          <View className="section-content">
            {item.supernatural_ability && (
              <View className="info-block">
                <Text className="info-label-block">本命神通</Text>
                <Text className="text-content">{item.supernatural_ability}</Text>
              </View>
            )}
            {item.rank_potential && (
              <View className="info-block" style={{ marginTop: '12px' }}>
                <Text className="info-label-block">进阶潜力</Text>
                <Text className="text-content">{item.rank_potential}</Text>
              </View>
            )}
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="abilities" /></View>
        </View>
      )}

      {/* 演化 Evolution */}
      {item.evolution && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">演化路径</Text>
          </View>
          <View className="section-content">
            {item.evolution.current_form && (
              <View className="info-row">
                <Text className="info-label">当前形态：</Text>
                <Text className="info-value">{item.evolution.current_form}</Text>
              </View>
            )}
            {item.evolution.materials_consumed && item.evolution.materials_consumed.length > 0 && (
              <View className="info-row">
                <Text className="info-label">吞噬耗材：</Text>
                <Text className="info-value">{item.evolution.materials_consumed.join('、')}</Text>
              </View>
            )}
            {item.evolution.potential_evolution && (
              <View className="info-row">
                <Text className="info-label">终极形态：</Text>
                <Text className="info-value">{item.evolution.potential_evolution}</Text>
              </View>
            )}
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="evolution" /></View>
        </View>
      )}

      {/* 渊源 Provenance */}
      {item.provenance && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">前世今生</Text>
          </View>
          <View className="section-content">
            {item.provenance.origin && (
              <View className="info-block">
                <Text className="info-label-block">出处</Text>
                <Text className="text-content">{item.provenance.origin}</Text>
              </View>
            )}
            {item.provenance.karma_link && (
              <View className="info-block" style={{ marginTop: '12px' }}>
                <Text className="info-label-block">因果纠缠</Text>
                <Text className="text-content">{item.provenance.karma_link}</Text>
              </View>
            )}
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="provenance" /></View>
        </View>
      )}

      {/* 持有记录 */}
      {(item.ownership_log && item.ownership_log.length > 0) && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">流转记录</Text>
          </View>
          <View className="timeline-list">
            {(expanded ? item.ownership_log : item.ownership_log.slice(0, 5)).map((log, index) => (
              <View key={index} className="timeline-item">
                <View className="timeline-dot" />
                <View className="timeline-content">
                  <Text className="owner-name" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(log.owner)}` })}>
                    {log.owner}
                  </Text>
                  <Text className="chapter-ref">于 {log.chapter}</Text>
                </View>
              </View>
            ))}
          </View>
          {item.ownership_log.length > 5 && (
            <View
              className="expand-button"
              onClick={() => setExpanded(!expanded)}
            >
              <Text>{expanded ? '收起' : `查看全部 (${item.ownership_log.length})`}</Text>
            </View>
          )}
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="ownership_log" /></View>
        </View>
      )}

      {/* 曾持有者 Previous Holders */}
      {item.previous_holders && item.previous_holders.length > 0 && (
        <View className="detail-section">
          <View className="section-header-row">
            <Text className="section-title">历史持有</Text>
          </View>
          <View className="section-content">
            {item.previous_holders.map((holder, idx) => (
              <View key={idx} className="info-row">
                <Text className="info-label">{holder.relation}：</Text>
                <Text className="info-value" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(holder.name)}` })} style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '4px' }}>
                  {holder.name}
                </Text>
              </View>
            ))}
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={item.name} entryType="法宝" field="previous_holders" /></View>
        </View>
      )}

    </ScrollView>
  );
}
