import { View, Text, ScrollView, Image, Canvas } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { useFaction } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { trackPageView, trackCardGenerate, trackCardSave } from '../../utils/analytics';
import { generateFactionCard } from '../../utils/factionCardGenerator';
import Icon from '../../components/Icon';
import UgcEntry from '../../components/UgcEntry';
import './index.scss';

const PAGE_SIZE = 20;

const TYPE_ICON_MAP: Record<string, string> = {
    '宗门': 'mountain', '王朝': 'crown', '家族': 'family', '地方势力': 'shield',
    '官方机构': 'official', '江湖门派': 'jianghu', '教派': 'doctrine', '军事组织': 'military',
    '跨界组织': 'crossworld', '商业组织': 'commerce', '神道势力': 'shrine', '书院': 'academy',
    '妖族势力': 'beast', '组织': 'org', '天下': 'globe',
};

export default function FactionDetail() {
    const router = useRouter();
    const name = decodeURIComponent(router.params.name || '');
    const { faction, loading, error } = useFaction(name);
    const [showCount, setShowCount] = useState(PAGE_SIZE);
    useAppShare({
        title: `【剑来·宗门】${name}`,
        path: `/pages/faction-detail/index?name=${encodeURIComponent(name)}`
    });
    useEffect(() => { trackPageView('/pages/faction-detail/index', name); }, [name]);

    const [generating, setGenerating] = useState(false);
    const [showCardPreview, setShowCardPreview] = useState(false);
    const [cardImagePath, setCardImagePath] = useState('');

    const handleGenerateCard = () => {
        if (!faction || generating) return;
        setGenerating(true);
        const query = Taro.createSelectorQuery();
        query.select('#factionCardCanvas')
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
                    const tempPath = await generateFactionCard(canvasNode, {
                        name: faction.name,
                        type: faction.type,
                        description: faction.description || '',
                        members: faction.members || [],
                        memberCount: faction.member_count || (faction.members || []).length,
                    }, dpr);
                    trackCardGenerate('faction', faction.name);
                    setCardImagePath(tempPath);
                    setShowCardPreview(true);
                } catch (err) {
                    console.error('Faction card generation failed:', err);
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
                trackCardSave('faction', name);
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
        if (faction) {
            Taro.setNavigationBarTitle({ title: `${faction.name} - 剑来` });
        }
    }, [faction]);

    if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
    if (error || !faction) return <View className="error-container"><Text>宗派不存在</Text></View>;

    const members = faction.members || [];
    const totalCount = faction.member_count || members.length;
    const displayMembers = members.slice(0, showCount);
    const powerClass = faction.power_score != null && faction.power_score >= 2000 ? 'high' : faction.power_score != null && faction.power_score >= 500 ? 'mid' : 'low';

    return (
        <ScrollView className="detail-page" scrollY>
            {/* Hidden Canvas */}
            <Canvas type="2d" id="factionCardCanvas" style={{ width: '750px', height: '1100px', position: 'fixed', left: '-9999px', top: 0 }} />

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

            <View className="detail-header">
                <View className="header-icon">
                    <Icon name={TYPE_ICON_MAP[faction.type || ''] || 'flag'} size={32} color="#485a6c" />
                </View>
                <Text className="detail-name">{faction.name}</Text>
                <Text className="detail-subtitle">{faction.type || '宗派'}</Text>
                {/* 分享卡片按钮 */}
                <View className="share-card-btn" onClick={handleGenerateCard}>
                    <Icon name="share" size={16} color="#485a6c" />
                    <Text className="share-card-text">{generating ? '生成中...' : '分享卡片'}</Text>
                </View>
            </View>

            <View className="info-cards">
                {totalCount > 0 && (
                    <View className="info-card">
                        <Text className="info-value">{totalCount}</Text>
                        <Text className="info-label">已知成员</Text>
                    </View>
                )}
                {faction.power_score != null && faction.power_score > 0 && (
                    <View className={`info-card power-${powerClass}`}>
                        <Text className="info-value">{faction.power_score}</Text>
                        <Text className="info-label">实力</Text>
                    </View>
                )}
            </View>

            {(faction.location || faction.region) && (
                <View className="location-bar">
                    {faction.location && (
                        <View className="loc-row">
                            <Text className="loc-label">山门：</Text>
                            <Text className="loc-value">{faction.location}</Text>
                        </View>
                    )}
                    {faction.region && (
                        <View className="loc-row">
                            <Text className="loc-label">区域：</Text>
                            <Text className="loc-value">{faction.region}</Text>
                        </View>
                    )}
                </View>
            )}

            {faction.description && (
                <View className="detail-section">
                    <View className="section-header-row">
                        <Text className="section-title">简介</Text>
                    </View>
                    <View className="section-content">
                        <Text className="text-content">{faction.description}</Text>
                    </View>
                    <View className="ugc-footer-wrap"><UgcEntry entryName={faction.name} entryType="势力" field="description" /></View>
                </View>
            )}

            {members.length > 0 && (
                <View className="detail-section">
                    <View className="section-header-row">
                        <Text className="section-title">门下成员 ({totalCount})</Text>
                    </View>
                    <View className="member-list">
                        {displayMembers.map(memberName => (
                            <View
                                key={memberName}
                                className="member-tag"
                                onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(memberName)}` })}
                            >
                                <Text>{memberName}</Text>
                            </View>
                        ))}
                    </View>
                    <View className="member-actions">
                        <View
                            className="member-expand-btn"
                            style={{ display: showCount < members.length ? '' : 'none' }}
                            onClick={() => setShowCount(c => Math.min(c + PAGE_SIZE, members.length))}
                        >
                            <Text>展开更多 (已显示{displayMembers.length}/{members.length})</Text>
                        </View>
                        <View
                            className="member-expand-btn"
                            style={{ display: showCount >= members.length && members.length > PAGE_SIZE ? '' : 'none' }}
                            onClick={() => setShowCount(PAGE_SIZE)}
                        >
                            <Text>收起</Text>
                        </View>
                    </View>
                    <View className="ugc-footer-wrap"><UgcEntry entryName={faction.name} entryType="势力" field="members" /></View>
                </View>
            )}
        </ScrollView>
    );
}
