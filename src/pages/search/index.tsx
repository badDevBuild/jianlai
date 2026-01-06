import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useSearch, getAvatar, useCharacters } from '../../data/useData';
import './index.scss';

// 类型图标映射
const TYPE_ICONS: Record<string, string> = {
    character: '👤',
    item: '✨',
    faction: '🏔️',
    location: '📍',
};

// 类型名称映射
const TYPE_NAMES: Record<string, string> = {
    character: '人物',
    item: '法宝',
    faction: '宗派',
    location: '地点',
};

// 热门搜索
const HOT_SEARCHES = ['陈平安', '宁姚', '崔东山', '落魄山', '大骊王朝'];

// 筛选类型
const FILTERS = [
    { key: 'all', label: '全部' },
    { key: 'character', label: '人物' },
    { key: 'item', label: '法宝' },
    { key: 'faction', label: '宗派' },
    { key: 'location', label: '地点' },
];

export default function SearchPage() {
    const { search, loading } = useSearch();
    const { characterList } = useCharacters(); // Use for fast avatar lookup if needed, though getAvatar handles most.

    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [results, setResults] = useState<ReturnType<typeof search>>([]);

    // Memoize and filter results
    const filteredResults = useMemo(() => {
        if (activeFilter === 'all') return results;
        return results.filter(item => item.type === activeFilter);
    }, [results, activeFilter]);

    const handleSearch = (value: string) => {
        setQuery(value);
        if (value.trim()) {
            setResults(search(value));
        } else {
            setResults([]);
        }
    };

    const handleResultClick = (item: { type: string; id: string }) => {
        const pathMap: Record<string, string> = {
            character: `/pages/character-detail/index?name=${encodeURIComponent(item.id)}`,
            item: `/pages/artifact-detail/index?name=${encodeURIComponent(item.id)}`,
            faction: `/pages/faction-detail/index?name=${encodeURIComponent(item.id)}`,
            location: `/pages/location-detail/index?name=${encodeURIComponent(item.id)}`,
        };

        const path = pathMap[item.type];
        if (path) {
            Taro.navigateTo({ url: path });
        }
    };

    const handleBack = () => {
        Taro.switchTab({ url: '/pages/index/index' });
    };

    return (
        <View className="search-page">
            {/* 搜索栏 */}
            <View className="search-header">
                <View className="search-input-wrap">
                    <Text className="search-icon">🔍</Text>
                    <Input
                        className="search-input"
                        placeholder="搜索人物、法宝、宗派、地点..."
                        value={query}
                        onInput={(e) => handleSearch(e.detail.value)}
                        focus
                    />
                    {query && (
                        <Text className="clear-btn" onClick={() => handleSearch('')}>✕</Text>
                    )}
                </View>
                <View className="header-action" onClick={handleBack}>
                    <Text>取消</Text>
                </View>
            </View>

            {/* 筛选 Tab */}
            {query && results.length > 0 && (
                <View className="filter-tabs">
                    {FILTERS.map(filter => (
                        <View
                            key={filter.key}
                            className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label}
                        </View>
                    ))}
                </View>
            )}

            {/* 搜索结果 */}
            {query ? (
                <ScrollView className="search-results" scrollY>
                    {loading ? (
                        <View className="loading">
                            <Text>搜索中...</Text>
                        </View>
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map((item, idx) => {
                            const isCharacter = item.type === 'character';
                            const avatarUrl = isCharacter ? getAvatar({ name: item.id } as any) : '';

                            return (
                                <View
                                    key={`${item.name}-${idx}`}
                                    className="result-item"
                                    onClick={() => handleResultClick(item)}
                                >
                                    {isCharacter ? (
                                        <View className="result-avatar-wrap">
                                            <Image className="result-avatar" src={avatarUrl} mode="aspectFill" />
                                        </View>
                                    ) : (
                                        <View className={`result-icon-wrap type-${item.type}`}>
                                            <Text className="result-icon">{TYPE_ICONS[item.type] || '📄'}</Text>
                                        </View>
                                    )}

                                    <View className="result-info">
                                        <Text className="result-name">{item.name}</Text>
                                        <Text className="result-type">{TYPE_NAMES[item.type] || item.type}</Text>
                                    </View>

                                    <View className="result-arrow">→</View>
                                </View>
                            );
                        })
                    ) : (
                        <View className="no-results">
                            <Text>未找到相关结果</Text>
                        </View>
                    )}
                </ScrollView>
            ) : (
                <View className="search-suggestions">
                    <Text className="suggestion-title">热门搜索</Text>
                    <View className="suggestion-tags">
                        {HOT_SEARCHES.map(tag => (
                            <Text
                                key={tag}
                                className="suggestion-tag"
                                onClick={() => handleSearch(tag)}
                            >
                                {tag}
                            </Text>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}
