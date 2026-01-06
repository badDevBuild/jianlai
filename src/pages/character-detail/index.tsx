import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { useCharacter, getAvatar, useFactions } from '../../data/useData';
import './index.scss';

export default function CharacterDetail() {
    const router = useRouter();
    const name = decodeURIComponent(router.params.name || '');
    const { character, loading, error } = useCharacter(name);
    const { factionList } = useFactions(); // Get global faction data for weights

    // Toggle States
    const [aliasesExpanded, setAliasesExpanded] = useState(false);
    const [visibleQuotesCount, setVisibleQuotesCount] = useState(3);
    // Realm Info Modal State
    const [showRealmInfo, setShowRealmInfo] = useState(false);

    useEffect(() => {
        if (character && character.name) {
            Taro.setNavigationBarTitle({ title: character.name });
        }
    }, [character]);

    // 1. Faction Sorting: Specific (smaller) > General (larger)
    const sortedFactions = useMemo(() => {
        if (!character?.factions || !factionList.length) return character?.factions || [];

        return [...character.factions].sort((a, b) => {
            const facA = factionList.find(f => f.name === a);
            const facB = factionList.find(f => f.name === b);
            const countA = facA?.memberCount || 0;
            const countB = facB?.memberCount || 0;
            // Descending: Largest member count first
            if (countA !== countB) {
                return countB - countA;
            }
            // Tie-break: Keep original order or alphabetical? 
            // Let's rely on stability or just index if needed, but simple diff is fine.
            return 0;
        });
    }, [character, factionList]);

    // 2. Cultivation Logic (Separating Martial Arts and Qi Refining)
    const cultivationState = useMemo(() => {
        if (!character) return { martial: null, qi: null };

        let martial: { state: string, chapter: string } | null = null;
        let qi: { state: string, chapter: string } | null = null;

        // Priority 1: Use structured wudao_log / lianqi_log if available
        if (character.wudao_log && character.wudao_log.length > 0) {
            // Sort by order descending
            const sorted = [...character.wudao_log].sort((a, b) => b.order - a.order);
            const best = sorted[0];
            martial = { state: best.level, chapter: best.chapter };
        }

        if (character.lianqi_log && character.lianqi_log.length > 0) {
            // Sort by order descending
            const sorted = [...character.lianqi_log].sort((a, b) => b.order - a.order);
            const best = sorted[0];
            qi = { state: best.level, chapter: best.chapter };
        }

        // Priority 2: Fallback to heuristic parsing of cultivation_log IF structured data is missing
        // Only run fallback for the missing type(s)
        if ((!martial || !qi) && character.cultivation_log) {
            character.cultivation_log.forEach(log => {
                const txt = log.state;
                if (!txt || txt === '未知') return;

                // Only verify/parse if we still need one of them
                if (!martial) {
                    const isMartial = /止境|武夫|气盛|归真|神到|金身|远游|山巅|武神/.test(txt);
                    if (isMartial) {
                        // Simple extraction fallback
                        let stateText = txt;
                        if (txt.includes('武夫') && (txt.includes(',') || txt.includes('，') || txt.includes('/'))) {
                            const parts = txt.split(/[,，/]/);
                            const mPart = parts.find(p => /止境|武夫|气盛|归真|神到|金身/i.test(p));
                            if (mPart) stateText = mPart.trim();
                        }
                        martial = { state: stateText, chapter: log.chapter };
                    }
                }

                if (!qi) {
                    const isQi = /练气|筑基|金丹|元婴|玉璞|仙人|飞升|十四境|14境|十五境|剑修|剑仙/.test(txt);
                    if (isQi) {
                        let stateText = txt;
                        if ((txt.includes('剑') || txt.includes('境')) && (txt.includes(',') || txt.includes('，') || txt.includes('/'))) {
                            const parts = txt.split(/[,，/]/);
                            const qPart = parts.find(p => /练气|筑基|金丹|元婴|玉璞|仙人|飞升|十四境|剑|本命/i.test(p));
                            if (qPart) stateText = qPart.trim();
                        }
                        qi = { state: stateText, chapter: log.chapter };
                    }
                }
            });
        }

        return { martial, qi };

    }, [character]);

    // 3. Relationships for Satellite Graph (Top 6 Weighted)
    const topRelations = useMemo(() => {
        if (!character?.relations) return [];
        return Object.entries(character.relations)
            .sort(([, a], [, b]) => (b.strength || 0) - (a.strength || 0))
            .slice(0, 8);
    }, [character]);

    const handleGraphNav = () => {
        Taro.setStorageSync('target_center', character?.name);
        Taro.switchTab({ url: '/pages/graph/index' });
    }

    if (loading) {
        return (
            <View className="loading-container">
                <Text>正在寻访人物...</Text>
            </View>
        );
    }

    if (error || !character) {
        return (
            <View className="error-container">
                <Text>查无此人</Text>
            </View>
        );
    }

    // Aliases Logic
    const aliases = character.aliases || [];
    const displayedAliases = aliasesExpanded ? aliases : aliases.slice(0, 3);
    const hasMoreAliases = aliases.length > 3;

    // Quotes Logic - Click to show 30 more
    const quotes = character.quotes || [];
    const displayedQuotes = quotes.slice(0, visibleQuotesCount);
    const hasMoreQuotes = quotes.length > visibleQuotesCount;



    // Realm Info Content
    const renderRealmInfo = () => {
        if (!showRealmInfo) return null;
        return (
            <View className="realm-info-modal" onClick={() => setShowRealmInfo(false)}>
                <View className="realm-info-content" onClick={e => e.stopPropagation()}>
                    <View className="realm-info-header">
                        <Text className="realm-info-title">境界划分说明</Text>
                        <View className="close-btn" onClick={() => setShowRealmInfo(false)}>×</View>
                    </View>
                    <ScrollView scrollY className="realm-info-body">
                        <View className="realm-section">
                            <Text className="section-title">⚔️ 武道九境 (含传说)</Text>
                            <View className="realm-list">
                                <View className="realm-item">
                                    <Text className="label">炼体三境：</Text>
                                    <Text className="value">泥胚、木胎、水银</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">炼气三境：</Text>
                                    <Text className="value">英魂、雄魄、武胆</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">炼神三境：</Text>
                                    <Text className="value">金身(小宗师)、羽化(远游)、山巅(止境大宗师)</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">止境(十境)：</Text>
                                    <Text className="value">气盛、归真、神道</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">武神境(十一)：</Text>
                                    <Text className="value">传说境界，极难触及</Text>
                                </View>
                            </View>
                        </View>

                        <View className="realm-section">
                            <Text className="section-title">✨ 炼气士 (修士)</Text>
                            <View className="realm-list">
                                <View className="realm-item">
                                    <Text className="label">下五境：</Text>
                                    <Text className="value">铜皮、草根、柳筋、骨气、铸炉</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">中五境：</Text>
                                    <Text className="value">洞府、观海、龙门、金丹、元婴</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">上五境：</Text>
                                    <Text className="value">玉璞、仙人、飞升</Text>
                                </View>
                                <View className="realm-item">
                                    <Text className="label">十四/十五境：</Text>
                                    <Text className="value">失传/传说境界</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <ScrollView className="detail-page" scrollY>
            {renderRealmInfo()}
            {/* Header / Basic Info */}
            <View className="detail-header">
                <View className="avatar-wrapper">
                    <Image
                        className="detail-avatar"
                        src={getAvatar(character)}
                        mode="aspectFill"
                    />
                </View>

                <View className="detail-header-info">
                    <Text className="detail-name">{character.name}</Text>

                    {/* Sorted Factions - Unlimited but formatted */}
                    {sortedFactions.length > 0 && (
                        <View className="faction-tags">
                            {sortedFactions.map((fac, idx) => (
                                <Text key={fac} className={`faction-tag rank-${idx > 2 ? 'common' : idx}`}>
                                    {fac}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* Expandable Aliases */}
                    {character.aliases?.length > 0 && (
                        <View className="aliases-container" onClick={() => hasMoreAliases && setAliasesExpanded(!aliasesExpanded)}>
                            <Text className="aliases-text">
                                {displayedAliases.join(' / ')}
                                {hasMoreAliases && !aliasesExpanded && ' ...'}
                            </Text>
                            {hasMoreAliases && (
                                <Text className="expand-hint">{aliasesExpanded ? '收起' : '展开'}</Text>
                            )}
                        </View>
                    )}
                </View>
            </View>


            {/* Cultivation Cards */}
            <View className="cultivation-card-section">
                <View className="section-header-row" onClick={() => setShowRealmInfo(true)}>
                    <Text className="section-title">修为境界</Text>
                    <View className="info-icon">
                        <Text className="icon-text">?</Text>
                    </View>
                </View>

                <View className="cultivation-card">
                    {/* Martial Arts */}
                    <View className="cultivation-track">
                        <View className="track-header">
                            <View className="track-icon martial"><Text>⚔️</Text></View>
                            <Text className="track-name">武道</Text>
                        </View>
                        <View className="track-bar-container">
                            <View className="track-bar martial" style={{ width: cultivationState.martial ? '85%' : '5%' }}></View>
                        </View>
                        <Text className="track-status">
                            {cultivationState.martial ? cultivationState.martial.state : '未涉足'}
                        </Text>
                    </View>
                    {cultivationState.martial?.chapter && (
                        <Text className="track-chapter">最新记录: {cultivationState.martial.chapter}</Text>
                    )}

                    <View className="divider"></View>

                    {/* Qi Refining */}
                    <View className="cultivation-track">
                        <View className="track-header">
                            <View className="track-icon qi"><Text>✨</Text></View>
                            <Text className="track-name">练气士</Text>
                        </View>
                        <View className="track-bar-container">
                            <View className="track-bar qi" style={{ width: cultivationState.qi ? '85%' : '5%' }}></View>
                        </View>
                        <Text className="track-status">
                            {cultivationState.qi ? cultivationState.qi.state : '未涉足'}
                        </Text>
                    </View>
                    {cultivationState.qi?.chapter && (
                        <Text className="track-chapter">最新记录: {cultivationState.qi.chapter}</Text>
                    )}
                </View>
            </View>


            {/* Bio */}
            {character.bio_summary && (
                <View className="detail-section bio-section">
                    <Text className="section-title">生平事迹</Text>
                    <View className="section-content paper-texture">
                        <Text className="bio-text">{character.bio_summary}</Text>
                    </View>
                </View>
            )}

            {/* Satellite Graph for Relationships */}
            {topRelations.length > 0 && (
                <View className="detail-section relations-section">
                    <View className="section-header-row">
                        <Text className="section-title">主要关系</Text>
                        <View className="view-more-btn" onClick={handleGraphNav}>
                            <Text>查看完整图谱 &gt;</Text>
                        </View>
                    </View>

                    <View className="satellite-graph-container">
                        {/* Center Node (Self) */}
                        <View className="center-node">
                            <Image className="node-avatar" src={getAvatar(character)} mode="aspectFill" />
                            <Text className="node-label">本尊</Text>
                        </View>

                        {/* Orbiting Nodes */}
                        {topRelations.map(([tName, tRel], idx) => {
                            // Calculate position based on index (0-5)
                            // CSS will handle the rotation
                            return (
                                <View
                                    key={tName}
                                    className={`orbit-node pos-${idx}`}
                                    onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(tName)}` })}
                                >
                                    <View className="connector-line" />
                                    <View className="node-wrapper">
                                        <Image className="node-avatar" src={getAvatar({ name: tName } as any)} mode="aspectFill" />
                                        <View className="node-info">
                                            <Text className="node-name">{tName}</Text>
                                            <Text className="node-rel">{tRel.type?.[0] || '关系'}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Quotes - Expandable to 50 */}
            {character.quotes?.length > 0 && (
                <View className="detail-section">
                    <Text className="section-title">经典语录</Text>
                    <View className="section-content quotes-list">
                        {displayedQuotes.map((quote, idx) => (
                            <View key={idx} className="quote-item">
                                <Text className="quote-content">「 {quote.content} 」</Text>
                                <Text className="quote-source">—— {quote.context || `第${quote.chapter}章`}</Text>
                            </View>
                        ))}
                        {hasMoreQuotes ? (
                            <View className="show-more-row" onClick={() => setVisibleQuotesCount(prev => prev + 30)}>
                                <Text className="show-more-text">
                                    {`查看更多 (还有${quotes.length - visibleQuotesCount}条)`}
                                </Text>
                            </View>
                        ) : (quotes.length > 3 && (
                            <View className="show-more-row" onClick={() => setVisibleQuotesCount(3)}>
                                <Text className="show-more-text">收起</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Tags */}
            {character.tags?.length > 0 && (
                <View className="detail-section">
                    <Text className="section-title">江湖标签</Text>
                    <View className="tag-list">
                        {character.tags.map(tag => (
                            <View key={tag} className="tag-seal">
                                <Text className="tag-text">{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View className="bottom-spacer" />
        </ScrollView>
    );
}
