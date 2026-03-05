import { View, Text, Image, ScrollView, Canvas } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useCharacter, getAvatar, useFactions, useCharacters } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { generateCard, CardData } from '../../utils/cardGenerator';
import UgcEntry from '../../components/UgcEntry';
import './index.scss';

export default function CharacterDetail() {
    const router = useRouter();
    const name = decodeURIComponent(router.params.name || '');
    const { data: allCharacters } = useCharacters(); // Fetch all for avatar lookup
    useAppShare({
        title: `【剑来·人物】${name}的生平事迹`,
        path: `/pages/character-detail/index?name=${encodeURIComponent(name)}`
    });

    const { character, loading, error } = useCharacter(name);
    const { factionList } = useFactions(); // Get global faction data for weights

    // Toggle States
    const [aliasesExpanded, setAliasesExpanded] = useState(false);
    const [visibleQuotesCount, setVisibleQuotesCount] = useState(3);
    // Realm Info Modal State
    const [showRealmInfo, setShowRealmInfo] = useState(false);
    // Card Generation State
    const [showCardPreview, setShowCardPreview] = useState(false);
    const [cardImagePath, setCardImagePath] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (character && character.name) {
            Taro.setNavigationBarTitle({ title: `${character.name} - 剑来` });
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

    // 2. Cultivation Logic (Unified V2/V3)
    // 2. Cultivation Logic (Unified V2/V3)
    const cultivationState = useMemo(() => {
        if (!character) return { martial: null, qi: null };

        let martial: { state: string, chapter: string, progress: number, label: string } | null = null;
        let qi: { state: string, chapter: string, progress: number, label: string } | null = null;

        // --- 1. Define Helper & Maps (Unified) ---
        const MARTIAL_REALM_VAL: Record<string, number> = {
            '泥胚': 1, '木胎': 2, '水银': 3,
            '英魂': 4, '雄魄': 5, '武胆': 6,
            '金身': 7, '小宗师': 7,
            '羽化': 8, '远游': 8,
            '山巅': 9, '大宗师': 9,
            '止境': 10, '气盛': 10, '归真': 10, '神到': 10,
            '武神': 11
        };

        const QI_REALM_VAL: Record<string, number> = {
            '铜皮': 1, '草根': 1, '柳筋': 1, '骨气': 1, '铸炉': 1,
            '洞府': 6, '观海': 7, '龙门': 8,
            '金丹': 9,
            '元婴': 10,
            '玉璞': 11,
            '仙人': 12,
            '飞升': 13,
            '十四境': 14, '14境': 14, '合道': 14,
            '十五境': 15, '15境': 15
        };

        const calcData = (rawText: string, isMartialVal: boolean) => {
            const map = isMartialVal ? MARTIAL_REALM_VAL : QI_REALM_VAL;
            let val = 0;
            // Simple heuristic to find highest realm mention
            for (const k in map) {
                if (rawText.includes(k) && map[k] > val) val = map[k];
            }
            const max = isMartialVal ? 11 : 15;
            const progress = val > 0 ? Math.min(Math.round((val / max) * 100), 100) : 5;
            const label = val > 0 ? `(${val}境)` : '';
            return { progress, label };
        };

        // --- 2. V3 Logic ---
        // Handle V3 `cultivation` array (from full profile)
        if (Array.isArray(character.cultivation) && character.cultivation.length > 0 && typeof character.cultivation[0] === 'object' && ('path' in character.cultivation[0] || 'stage' in character.cultivation[0])) {
            (character.cultivation as any[]).forEach(c => {
                const path = c.path || '';
                const realm = c.realm_name || c.realm || '未知';
                const stage = c.stage || '';
                const notes = c.notes || '';

                const fullState = stage ? `${realm} (${stage})` : realm;

                // Identify path type
                const isMartialPath = path.includes('武夫') || path.includes('武道') || stage.includes('武') || stage === '武学';
                const isQiPath = path.includes('炼气') || path.includes('剑修') || path.includes('修士') || path.includes('儒家') || path.includes('佛家') || path.includes('道家') || path.includes('妖族') || path.includes('鬼物') || path.includes('兵家') || stage.includes('练气') || stage.includes('炼气') || stage === '练气';

                if (isMartialPath) {
                    const { progress, label } = calcData(fullState, true);
                    martial = { state: fullState, chapter: notes, progress, label };
                } else if (isQiPath || path) {
                    // Default to Qi logic for others for now, or refine
                    const { progress, label } = calcData(fullState, false);
                    qi = { state: fullState, chapter: notes, progress, label };
                }
            });
            // If we found something, return early
            if (martial || qi) return { martial, qi };
        }

        // Handle V3 Lite String (e.g. "止境/飞升境")
        if (typeof character.cultivation === 'string') {
            const parts = character.cultivation.split('/');
            parts.forEach(part => {
                const isMartialPart = /止境|武夫|气盛|归真|神到|金身|远游|山巅|武神/.test(part);
                if (isMartialPart) {
                    const { progress, label } = calcData(part, true);
                    martial = { state: part, chapter: '', progress, label };
                } else {
                    const { progress, label } = calcData(part, false);
                    qi = { state: part, chapter: '', progress, label };
                }
            });
            if (martial || qi) return { martial, qi };
        }


        // --- 3. V2 Legacy Logic ---

        // Priority: wudao_log / lianqi_log
        if (character.wudao_log && character.wudao_log.length > 0) {
            const sorted = [...character.wudao_log].sort((a, b) => b.order - a.order);
            const best = sorted[0];
            const { progress, label } = calcData(best.level, true);
            martial = { state: best.level, chapter: best.chapter, progress, label };
        }
        if (character.lianqi_log && character.lianqi_log.length > 0) {
            const sorted = [...character.lianqi_log].sort((a, b) => b.order - a.order);
            const best = sorted[0];
            const { progress, label } = calcData(best.level, false);
            qi = { state: best.level, chapter: best.chapter, progress, label };
        }

        // Fallback: cultivation_log (Legacy array)
        if ((!martial || !qi) && Array.isArray(character.cultivation_log)) {
            character.cultivation_log.forEach(log => {
                const txt = log.state;
                if (!txt || txt === '未知') return;

                if (!martial) {
                    const isMartial = /止境|武夫|气盛|归真|神到|金身|远游|山巅|武神/.test(txt);
                    if (isMartial) {
                        let stateText = txt;
                        if (txt.includes('武夫') && (txt.includes(',') || txt.includes('，') || txt.includes('/'))) {
                            const parts = txt.split(/[,，/]/);
                            const mPart = parts.find(p => /止境|武夫|气盛|归真|神到|金身/i.test(p));
                            if (mPart) stateText = mPart.trim();
                        }
                        const { progress, label } = calcData(stateText, true);
                        martial = { state: stateText, chapter: log.chapter || '', progress, label };
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
                        const { progress, label } = calcData(stateText, false);
                        qi = { state: stateText, chapter: log.chapter || '', progress, label };
                    }
                }
            });
        }

        return { martial, qi };
    }, [character]);

    // 3. Relationships for Satellite Graph (Top 8 Weighted, only person-to-person)
    const topRelations = useMemo(() => {
        if (!character?.relations) return [];
        return Object.entries(character.relations)
            .filter(([targetName]) => allCharacters && targetName in allCharacters)
            .sort(([, a], [, b]) => (b.strength || 0) - (a.strength || 0))
            .slice(0, 8);
    }, [character, allCharacters]);

    const handleGenerateCard = async () => {
        if (!character || generating) return;
        setGenerating(true);
        try {
            const query = Taro.createSelectorQuery();
            query.select('#cardCanvas')
                .fields({ node: true, size: true })
                .exec(async (res) => {
                    try {
                        const canvasNode = res[0]?.node;
                        if (!canvasNode) {
                            Taro.showToast({ title: '画布初始化失败', icon: 'none' });
                            setGenerating(false);
                            return;
                        }
                        const sysInfo = Taro.getSystemInfoSync();
                        const dpr = sysInfo.pixelRatio;

                        // Build cultivation text
                        let cultText = '';
                        if (cultivationState.martial) cultText += cultivationState.martial.state;
                        if (cultivationState.martial && cultivationState.qi) cultText += ' / ';
                        if (cultivationState.qi) cultText += cultivationState.qi.state;

                        const cardData: CardData = {
                            name: character.name,
                            avatar: getAvatar(character),
                            aliases: character.aliases || [],
                            cultivation: cultText,
                            factions: character.factions || [],
                            quote: character.quotes?.[0]?.content || '',
                            tags: character.tags || [],
                        };

                        const tempPath = await generateCard(canvasNode, cardData, dpr);
                        setCardImagePath(tempPath);
                        setShowCardPreview(true);
                    } catch (err) {
                        console.error('Card generation failed:', err);
                        Taro.showToast({ title: '生成失败，请重试', icon: 'none' });
                    } finally {
                        setGenerating(false);
                    }
                });
        } catch (err) {
            console.error('Card generation failed:', err);
            Taro.showToast({ title: '生成失败', icon: 'none' });
            setGenerating(false);
        }
    };

    const handleSaveCard = () => {
        if (!cardImagePath) return;
        Taro.saveImageToPhotosAlbum({
            filePath: cardImagePath,
            success: () => {
                Taro.showToast({ title: '已保存到相册', icon: 'success' });
            },
            fail: (err) => {
                if (err.errMsg?.includes('deny') || err.errMsg?.includes('auth')) {
                    Taro.showModal({
                        title: '需要相册权限',
                        content: '请在设置中开启相册访问权限',
                        confirmText: '去设置',
                        success: (modalRes) => {
                            if (modalRes.confirm) Taro.openSetting();
                        }
                    });
                } else {
                    Taro.showToast({ title: '保存失败', icon: 'none' });
                }
            }
        });
    };

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
            {/* Hidden Canvas for card generation */}
            <Canvas
                type="2d"
                id="cardCanvas"
                style={{ width: '750px', height: '1100px', position: 'fixed', left: '-9999px', top: 0 }}
            />

            {/* Card Preview Modal */}
            {showCardPreview && cardImagePath && (
                <View className="card-preview-modal" onClick={() => setShowCardPreview(false)}>
                    <View className="card-preview-content" onClick={e => e.stopPropagation()}>
                        <Image className="card-preview-image" src={cardImagePath} mode="widthFix" />
                        <View className="card-preview-actions">
                            <View className="card-action-btn save-btn" onClick={handleSaveCard}>
                                <Text>保存到相册</Text>
                            </View>
                            <View className="card-action-btn close-btn" onClick={() => setShowCardPreview(false)}>
                                <Text>关闭</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {renderRealmInfo()}
            {/* Header / Basic Info */}
            <View className="detail-header">
                <View className="avatar-wrapper">
                    <Image
                        className="detail-avatar"
                        src={getAvatar(character)}
                        mode="aspectFill"
                    />
                    <UgcEntry entryName={character.name} entryType="人物" field="avatar" label="换头像" />
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
                            <View className="track-bar martial" style={{ width: `${cultivationState.martial ? cultivationState.martial.progress : 5}%` }}></View>
                        </View>
                        <Text className="track-status">
                            {cultivationState.martial ? `${cultivationState.martial.state} ${cultivationState.martial.label}` : '未涉足'}
                        </Text>
                    </View>
                    {cultivationState.martial?.chapter && cultivationState.martial.chapter !== '未知' && (
                        <Text className="track-chapter">最新记录: {cultivationState.martial.chapter.replace(/\n/g, '')}</Text>
                    )}

                    <View className="divider"></View>

                    {/* Qi Refining */}
                    <View className="cultivation-track">
                        <View className="track-header">
                            <View className="track-icon qi"><Text>✨</Text></View>
                            <Text className="track-name">练气士</Text>
                        </View>
                        <View className="track-bar-container">
                            <View className="track-bar qi" style={{ width: `${cultivationState.qi ? cultivationState.qi.progress : 5}%` }}></View>
                        </View>
                        <Text className="track-status">
                            {cultivationState.qi ? `${cultivationState.qi.state} ${cultivationState.qi.label}` : '未涉足'}
                        </Text>
                    </View>
                    {cultivationState.qi?.chapter && cultivationState.qi.chapter !== '未知' && (
                        <Text className="track-chapter">最新记录: {cultivationState.qi.chapter.replace(/\n/g, '')}</Text>
                    )}
                </View>
                <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="cultivation" /></View>
            </View>


            {/* Techniques (New in V3) */}
            {
                character.techniques && character.techniques.length > 0 && (
                    <View className="detail-section technique-section">
                        <View className="section-header-row">
                            <Text className="section-title">功法与神通</Text>
                        </View>
                        <View className="section-content">
                            {character.techniques.map((tech, idx) => (
                                <View key={idx} className="technique-item">
                                    <View className="tech-header">
                                        <Text className="tech-name">{tech.name}</Text>
                                        <View className="tech-badges">
                                            {tech.type && <Text className="tech-badge type">{tech.type}</Text>}
                                            {tech.category && <Text className="tech-badge category">{tech.category}</Text>}
                                        </View>
                                    </View>
                                    <Text className="tech-desc">{(tech.description || '').replace(/[\r\n]+/g, '')}</Text>
                                </View>
                            ))}
                        </View>
                        <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="techniques" /></View>
                    </View>
                )
            }


            {/* Bio */}
            {
                (character.bio || character.bio_summary) && (
                    <View className="detail-section bio-section">
                        <View className="section-header-row">
                            <Text className="section-title">生平事迹</Text>
                        </View>
                        <View className="section-content paper-texture">
                            <Text className="bio-text">{(character.bio || character.bio_summary)?.replace(/\n/g, '')}</Text>
                        </View>
                        <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="bio" /></View>
                    </View>
                )
            }

            {/* Appearance (New in V3) */}
            {
                character.appearance && (
                    <View className="detail-section">
                        <View className="section-header-row">
                            <Text className="section-title">容貌风采</Text>
                        </View>
                        <View className="section-content">
                            {character.appearance.facial && (
                                <View className="info-row">
                                    <Text className="info-label">面容：</Text>
                                    <Text className="info-value">{character.appearance.facial.replace(/\n/g, '')}</Text>
                                </View>
                            )}
                            {character.appearance.physique && (
                                <View className="info-row">
                                    <Text className="info-label">体魄：</Text>
                                    <Text className="info-value">{character.appearance.physique.replace(/\n/g, '')}</Text>
                                </View>
                            )}
                            {character.appearance.attire && (
                                <View className="info-row">
                                    <Text className="info-label">衣着：</Text>
                                    <Text className="info-value">{character.appearance.attire.replace(/\n/g, '')}</Text>
                                </View>
                            )}
                            {character.appearance.aura && (
                                <View className="info-row">
                                    <Text className="info-label">气象：</Text>
                                    <Text className="info-value">{character.appearance.aura.replace(/\n/g, '')}</Text>
                                </View>
                            )}
                        </View>
                        <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="appearance" /></View>
                    </View>
                )
            }

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
                            // Avatar Lookup
                            const relatedChar = allCharacters?.[tName];
                            const avatarSrc = getAvatar(relatedChar || { name: tName } as any);

                            return (
                                <View
                                    key={tName}
                                    className={`orbit-node pos-${idx}`}
                                    onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(tName)}` })}
                                >
                                    <View className="connector-line" />
                                    <View className="node-wrapper">
                                        <Image className="node-avatar" src={avatarSrc} mode="aspectFill" />
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
            {
                character.quotes?.length > 0 && (
                    <View className="detail-section">
                        <View className="section-header-row">
                            <Text className="section-title">经典语录</Text>
                        </View>
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
                        <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="quotes" /></View>
                    </View>
                )
            }

            {/* Tags */}
            {
                character.tags?.length > 0 && (
                    <View className="detail-section">
                        <View className="section-header-row">
                            <Text className="section-title">江湖标签</Text>
                        </View>
                        <View className="tag-list">
                            {character.tags.map(tag => (
                                <View key={tag} className="tag-seal">
                                    <Text className="tag-text">{tag}</Text>
                                </View>
                            ))}
                        </View>
                        <View className="ugc-footer-wrap"><UgcEntry entryName={character.name} entryType="人物" field="tags" /></View>
                    </View>
                )
            }

            {/*移除了全局 UgcEntry*/}

            {/* Generate Card Button */}
            <View className="generate-card-section">
                <View
                    className={`generate-card-btn ${generating ? 'disabled' : ''}`}
                    onClick={handleGenerateCard}
                >
                    <Text>{generating ? '生成中...' : '生成人物卡片'}</Text>
                </View>
                <Text className="generate-card-hint">保存卡片分享给好友</Text>
            </View>

            <View className="bottom-spacer" />
        </ScrollView >
    );
}
