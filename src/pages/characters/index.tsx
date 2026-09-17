import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useCharacters, getAvatar } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import FilterBar from '../../components/FilterBar';
import './index.scss';

const PAGE_SIZE = 20;

export default function Characters() {
    const { characterList, loading, error } = useCharacters();
    useAppShare({ title: '剑来光阴 - 1600+人物图鉴', path: '/pages/characters/index' });
    const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
    const [page, setPage] = useState(1);

    // 获取所有派系 (Memoized & Simplified)
    const factions = useMemo(() => {
        const factionCounts: Record<string, number> = {};
        characterList.forEach(char => {
            if (char.factions) {
                char.factions.forEach(f => {
                    factionCounts[f] = (factionCounts[f] || 0) + 1;
                });
            }
        });

        // Whitelist of important factions to ALWAYS show
        const HOT_FACTIONS = [
            '落魄山', '剑气长城', '大骊王朝', '儒家', '道家', '佛家', '兵家',
            '白玉京', '文庙', '蛮荒天下', '浩然天下', '青冥天下', '正阳山', '风雪庙'
        ];

        // Filter: Must be in HOT list OR have >= 3 members
        return Object.keys(factionCounts)
            .filter(f => HOT_FACTIONS.includes(f) || factionCounts[f] >= 3)
            .sort((a, b) => {
                const idxA = HOT_FACTIONS.indexOf(a);
                const idxB = HOT_FACTIONS.indexOf(b);
                // 1. Hot factions first
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                // 2. Then by member count (descending)
                const diff = factionCounts[b] - factionCounts[a];
                if (diff !== 0) return diff;
                // 3. Alphabetical
                return a.localeCompare(b, 'zh-CN');
            });
    }, [characterList]);

    // 过滤人物
    const filteredCharacters = useMemo(() => {
        let result = characterList;

        if (selectedFactions.length > 0) {
            // 只要包含选中的任意一个派系即可 (OR logic for user convenience)
            result = result.filter(char =>
                char.factions && char.factions.some(f => selectedFactions.includes(f))
            );
        }

        return result;
    }, [characterList, selectedFactions]);

    // 分页 + 数据瘦身 (关键优化：只返回渲染所需字段)
    const displayList = useMemo(() => {
        const pagedData = filteredCharacters.slice(0, page * PAGE_SIZE);
        return pagedData.map(char => {
            // 建构展示描述：简介 -> 语录 -> 别名 -> 空
            let desc = char.bio_summary || '';
            if (!desc && char.quotes && char.quotes.length > 0) {
                desc = `“${char.quotes[0].content}”`;
            }
            if (!desc && char.aliases && char.aliases.length > 0) {
                desc = `别名：${char.aliases.join('、')}`;
            }

            return {
                name: char.name,
                avatar: getAvatar(char),
                factions: char.factions, // 数组引用，通常较小
                desc: desc,
                tags: char.tags,
                cultivation: (() => {
                    const c = char.cultivation;
                    if (typeof c === 'string') return c;
                    if (Array.isArray(c) && c.length > 0) {
                        const last = c[c.length - 1];
                        if (typeof last === 'string') return last;
                        return (last as any).state || (last as any).realm || '';
                    }
                    return '';
                })(),
                relationCount: char.relationCount !== undefined ? char.relationCount : (char.relations ? Object.keys(char.relations).length : 0)
            };
        });
    }, [filteredCharacters, page]);

    const handleScrollToLower = () => {
        if (displayList.length < filteredCharacters.length) {
            setPage(prev => prev + 1);
        }
    };

    const handleToggleFaction = (faction: string) => {
        setPage(1);
        setSelectedFactions(prev => {
            if (prev.includes(faction)) return prev.filter(f => f !== faction);
            return [faction]; // 单选体验较好，若要多选改为 [...prev, faction]
        });
    };

    const handleResetFilter = () => {
        setPage(1);
        setSelectedFactions([]);
    };

    const handleCharacterClick = (name: string) => {
        Taro.navigateTo({
            url: `/pages/character-detail/index?name=${encodeURIComponent(name)}`
        });
    };

    if (loading) {
        return (
            <View className="loading-container">
                <Text>加载中...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="error-container">
                <Text>加载失败，请重试</Text>
            </View>
        );
    }

    return (
        <View className="characters-page">
            {/* 派系筛选 */}
            <View className="filter-container">
                <FilterBar
                    items={factions}
                    selectedItems={selectedFactions}
                    onToggle={handleToggleFaction}
                    onReset={handleResetFilter}
                />
            </View>

            {/* 人物列表 */}
            <View className="character-count">
                <Text>共 {filteredCharacters.length} 位人物</Text>
            </View>

            <ScrollView
                className="character-list"
                scrollY
                onScrollToLower={handleScrollToLower}
                lowerThreshold={100}
            >
                {displayList.map(char => (
                    <View
                        key={char.name}
                        className="character-item"
                        onClick={() => handleCharacterClick(char.name)}
                    >
                        <View className="item-avatar-wrap">
                            <Image className="item-avatar" src={char.avatar} mode="aspectFill" />
                        </View>
                        <View className="item-info">
                            <View className="item-header">
                                <Text className="item-name">{char.name}</Text>
                                {char.factions && char.factions[0] && (
                                    <Text className="item-faction">{char.factions[0]}</Text>
                                )}
                            </View>
                            {char.desc && (
                                <Text className="item-desc">
                                    {char.desc}
                                </Text>
                            )}
                            {/* 可选：展示修为或其他标签 */}
                            {char.cultivation && (
                                <View className="item-tags">
                                    <Text className="tag">{char.cultivation}</Text>
                                </View>
                            )}
                            {(char.tags && char.tags.length > 0) && (
                                <View className="item-tags">
                                    {char.tags.slice(0, 2).map(tag => (
                                        <Text key={tag} className="tag">{tag}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                        <View className="character-stats">
                            <Text className="stat-value">{char.relationCount}</Text>
                            <Text className="stat-label">关系</Text>
                        </View>
                    </View>
                ))}
                {/* 加载更多提示 */}
                {displayList.length < filteredCharacters.length && (
                    <View className="loading-more" style={{ textAlign: 'center', padding: '16px', color: '#999', fontSize: '12px' }}>
                        <Text>加载更多...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
