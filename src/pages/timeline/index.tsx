import { View, Text, ScrollView } from '@tarojs/components';
import { useTimeline } from '../../data/useData';
import { useState, useMemo } from 'react';
import Icon from '../../components/Icon';
import { useAppShare } from '../../utils/share';
import './index.scss';

const PAGE_SIZE = 20;

export default function Timeline() {
    useAppShare({ title: '剑来光阴 - 编年长卷', path: '/pages/timeline/index' });
    const { data: timelineData, loading, error } = useTimeline();
    const [page, setPage] = useState(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // 获取所有事件类型
    const eventTypes = useMemo(() => {
        if (!timelineData) return [];
        const typeSet = new Set<string>();
        timelineData.forEach(event => {
            if (event.type) typeSet.add(event.type);
        });
        return Array.from(typeSet);
    }, [timelineData]);

    // 过滤数据
    const filteredData = useMemo(() => {
        if (!timelineData) return [];
        let result = timelineData;
        if (selectedType) {
            result = result.filter(event => event.type === selectedType);
        }
        return result;
    }, [timelineData, selectedType]);

    const displayData = useMemo(() => {
        return filteredData.slice(0, page * PAGE_SIZE);
    }, [filteredData, page]);

    const handleScrollToLower = () => {
        if (displayData.length < filteredData.length) {
            setPage(prev => prev + 1);
        }
    };

    // 重置分页当筛选条件改变时
    useMemo(() => {
        setPage(1);
    }, [selectedType]);

    if (loading) {
        return (
            <View className="timeline-page loading">
                <View className="loading-spinner"></View>
                <Text>光阴长河缓缓铺展...</Text>
            </View>
        );
    }

    if (error || !timelineData) {
        return (
            <View className="timeline-page error">
                <Text>加载失败</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="timeline-page"
            scrollY
            onScrollToLower={handleScrollToLower}
            lowerThreshold={200}
        >
            <View className="page-header">
                <Text className="title">光阴长河</Text>
                <Text className="subtitle">万年之后，皆是历史</Text>
            </View>

            {/* 类型筛选 */}
            <ScrollView className="type-filter" scrollX>
                <View
                    className={`type-tag ${!selectedType ? 'active' : ''}`}
                    onClick={() => setSelectedType(null)}
                >
                    全部
                </View>
                {eventTypes.map(type => (
                    <View
                        key={type}
                        className={`type-tag ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type}
                    </View>
                ))}
            </ScrollView>

            <View className="timeline-list">
                {displayData.map((event, index) => (
                    <View key={index} className="timeline-item">
                        <View className="time-node">
                            <View className="dot" />
                            <View className="line" />
                        </View>
                        <View className="event-content">
                            <View className="event-header">
                                {event.year && (
                                    <Text className="event-year">{event.year}</Text>
                                )}
                                <Text className="event-type">{event.type || '事件'}</Text>
                            </View>

                            <Text className="event-title">{event.event || event.name}</Text>

                            {event.description && (
                                <Text className="event-desc">{event.description}</Text>
                            )}

                            <View className="event-footer">
                                {event.participants && event.participants.length > 0 && (
                                    <View className="meta-row">
                                        <Icon name="users" size={14} color="#999999" />
                                        <Text className="meta-value">{event.participants.slice(0, 3).join('、')}等</Text>
                                    </View>
                                )}
                                {event.source_chapter && (
                                    <View className="meta-row">
                                        <Icon name="book" size={14} color="#999999" />
                                        <Text className="meta-value">{event.source_chapter}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
                {displayData.length < timelineData.length && (
                    <View className="loading-more">
                        <Text>加载更多...</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
