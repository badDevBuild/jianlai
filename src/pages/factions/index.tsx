import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useFactions } from '../../data/useData';
import './index.scss';

const PAGE_SIZE = 20;

export default function FactionList() {
    const { factionList, loading } = useFactions();
    const [page, setPage] = useState(1);

    useLoad(() => {
        console.log('FactionList loaded');
    });

    // 仅保留分页逻辑，移除搜索状态

    // 分页数据
    const displayList = useMemo(() => {
        if (!factionList) return [];
        return factionList.slice(0, page * PAGE_SIZE);
    }, [factionList, page]);

    const handleScrollToLower = () => {
        if (factionList && displayList.length < factionList.length) {
            setPage(prev => prev + 1);
        }
    };

    return (
        <View className="factions-page">
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
                                        {(faction.location || faction.type) && (
                                            <Text className="faction-location">
                                                {faction.location || faction.type}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="member-badge">
                                        <Text className="count">{faction.members?.length || 0}</Text>
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
                        <Text>暂无宗派数据</Text>
                    </View>
                )}

                {/* 底部加载更多提示 */}
                {factionList && displayList.length > 0 && displayList.length < factionList.length && (
                    <View className="loading-more">
                        <Text>加载更多...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
