import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useFactions } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import FilterBar from '../../components/FilterBar';
import './index.scss';

const PAGE_SIZE = 20;

export default function FactionList() {
    const { factionList, loading } = useFactions();
    useAppShare({ title: '剑来光阴 - 宗门势力大全', path: '/pages/factions/index' });
    const [page, setPage] = useState(1);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    useLoad(() => {
        Taro.setNavigationBarTitle({ title: '剑来宗门势力' });
    });

    // 1. 提取所有类型 (Memoized)
    const allTypes = useMemo(() => {
        if (!factionList) return [];
        const types = new Set<string>();
        factionList.forEach(f => {
            if (f.type) types.add(f.type);
        });
        // 按照常见优先级排序 or 默认排序
        const PREFERRED_ORDER = ['宗门', '王朝', '组织', '家族', '天下'];
        return Array.from(types).sort((a, b) => {
            const idxA = PREFERRED_ORDER.indexOf(a);
            const idxB = PREFERRED_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b, 'zh-CN');
        });
    }, [factionList]);

    // 2. 过滤逻辑
    const filteredList = useMemo(() => {
        if (!factionList) return [];
        if (selectedTypes.length === 0) return factionList;
        return factionList.filter(f => f.type && selectedTypes.includes(f.type));
    }, [factionList, selectedTypes]);

    // 3. 分页逻辑
    const displayList = useMemo(() => {
        return filteredList.slice(0, page * PAGE_SIZE);
    }, [filteredList, page]);

    const handleScrollToLower = () => {
        if (displayList.length < filteredList.length) {
            setPage(prev => prev + 1);
        }
    };

    // 切换 Filter
    const handleToggleType = (type: string) => {
        setPage(1); // 重置分页
        setSelectedTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                // 单选模式 (若需多选，改为 return [...prev, type])
                return [type];
            }
        });
    };

    const handleResetFilter = () => {
        setPage(1);
        setSelectedTypes([]);
    };

    return (
        <View className="factions-page">
            {/* 顶部筛选栏 */}
            <View className="filter-container">
                <FilterBar
                    items={allTypes}
                    selectedItems={selectedTypes}
                    onToggle={handleToggleType}
                    onReset={handleResetFilter}
                />
            </View>

            {/* 列表内容 */}
            <ScrollView
                scrollY
                className="list-content"
                onScrollToLower={handleScrollToLower}
                lowerThreshold={100}
            >
                {loading ? (
                    <View className="loading">
                        <Text>加载中...</Text>
                    </View>
                ) : displayList.length > 0 ? (
                    <View className="faction-grid">
                        {displayList.map((faction) => (
                            <View
                                key={faction.name}
                                className="faction-card"
                                onClick={() => Taro.navigateTo({ url: `/pages/faction-detail/index?name=${encodeURIComponent(faction.name)}` })}
                            >
                                <View className="card-header">
                                    <View className="faction-icon">
                                        <Text>🏔️</Text>
                                    </View>
                                    <View className="faction-info">
                                        <Text className="faction-name">{faction.name}</Text>
                                        <View className="faction-meta">
                                            {faction.type && <Text className="tag type-tag">{faction.type}</Text>}
                                            {faction.location && <Text className="tag loc-tag">{faction.location}</Text>}
                                        </View>
                                    </View>
                                    <View className="member-badge">
                                        <Text className="count">{faction.member_count || faction.members?.length || 0}</Text>
                                        <Text className="unit">人</Text>
                                    </View>
                                </View>

                                {faction.description && (
                                    <View className="card-body">
                                        <Text className="faction-desc">{faction.description}</Text>
                                    </View>
                                )}

                                <View className="card-footer">
                                    <Text className="view-more">查看详情</Text>
                                    <Text className="arrow">→</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="no-results">
                        <Text>暂无相关宗派</Text>
                    </View>
                )}

                {/* 底部加载更多提示 */}
                {displayList.length > 0 && displayList.length < filteredList.length && (
                    <View className="loading-more">
                        <Text>加载更多...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
