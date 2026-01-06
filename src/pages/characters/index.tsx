import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useCharacters, getAvatar } from '../../data/useData';
import './index.scss';

const PAGE_SIZE = 20;

export default function Characters() {
    const { characterList, loading, error } = useCharacters();
    const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // 获取所有派系 (Memoized)
    const factions = useMemo(() => {
        const factionSet = new Set<string>();
        characterList.forEach(char => {
            if (char.factions) {
                char.factions.forEach(f => factionSet.add(f));
            }
        });
        return Array.from(factionSet).slice(0, 10);
    }, [characterList]);

    // 过滤人物
    const filteredCharacters = useMemo(() => {
        let result = characterList;

        if (selectedFaction) {
            result = result.filter(char => char.factions && char.factions.includes(selectedFaction));
        }

        return result;
    }, [characterList, selectedFaction]);

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
                cultivation: (char.cultivation_log && char.cultivation_log.length > 0) ? char.cultivation_log[char.cultivation_log.length - 1].state : '', // 获取最新境界
                relationCount: char.relationCount !== undefined ? char.relationCount : (char.relations ? Object.keys(char.relations).length : 0)
            };
        });
    }, [filteredCharacters, page]);

    const handleScrollToLower = () => {
        if (displayList.length < filteredCharacters.length) {
            setPage(prev => prev + 1);
        }
    };

    // 重置分页当筛选条件改变时
    useMemo(() => {
        setPage(1);
    }, [selectedFaction]);

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
            <ScrollView className="faction-filter" scrollX>
                <View
                    className={`faction-tag ${!selectedFaction ? 'active' : ''}`}
                    onClick={() => setSelectedFaction(null)}
                >
                    全部
                </View>
                {factions.map(fac => (
                    <View
                        key={fac}
                        className={`faction-tag ${selectedFaction === fac ? 'active' : ''}`}
                        onClick={() => setSelectedFaction(fac)}
                    >
                        {fac}
                    </View>
                ))}
            </ScrollView>

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
