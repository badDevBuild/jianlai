import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useMemo, useEffect } from 'react';
import F6Graph from '../../components/Graph/F6Graph';
import FilterBar from '../../components/FilterBar';
import { useRelations } from '../../data/useData';
import { getEgoGraph, getAvailableRelationTypes } from '../../utils/graph-adapter';
import './index.scss';

export default function GraphPage() {
    const { data: fullData, loading, error } = useRelations();
    const [centerId, setCenterId] = useState('陈平安');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [windowInfo, setWindowInfo] = useState(() => {
        const info = Taro.getSystemInfoSync();
        return {
            width: info.windowWidth,
            height: info.windowHeight
        };
    });

    useDidShow(() => {
        const target = Taro.getStorageSync('target_center');
        if (target) {
            setCenterId(target);
            Taro.removeStorageSync('target_center');
        }
    });

    // Derive filter items from current center node relations
    const filterItems = useMemo(() => {
        if (!fullData) return [];
        return getAvailableRelationTypes(fullData, centerId);
    }, [fullData, centerId]);

    const graphData = useMemo(() => {
        console.log('GraphPage: fullData received', fullData);
        if (!fullData) return { nodes: [], edges: [] };
        return getEgoGraph(fullData, centerId, selectedFilters);
    }, [fullData, centerId, selectedFilters]);

    const handleNodeTap = (nodeId: string) => {
        if (nodeId === centerId) {
            Taro.showToast({ title: `当前中心: ${nodeId}`, icon: 'none' });
            return;
        }

        Taro.showLoading({ title: '计算关系...' });

        setTimeout(() => {
            setCenterId(nodeId);
        }, 10);
    };

    const handleFilterToggle = (item: string) => {
        setSelectedFilters(prev => {
            if (prev.includes(item)) {
                return prev.filter(i => i !== item);
            } else {
                return [...prev, item];
            }
        });
    };

    // Hide loading when centerId changes (meaning data is processed)
    useEffect(() => {
        const timer = setTimeout(() => {
            Taro.hideLoading();
        }, 500);
        return () => clearTimeout(timer);
    }, [centerId]);

    if (loading) {
        return (
            <View className="graph-page loading">
                <View className="loading-spinner"></View>
                <Text>正在梳理脉络...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="graph-page error">
                <Text>脉络紊乱，请稍后重试</Text>
            </View>
        );
    }

    return (
        <View className="graph-page">
            <F6Graph
                data={graphData}
                width={windowInfo.width}
                height={windowInfo.height} // Subtract filter bar height if needed, or overlay
                onNodeTap={handleNodeTap}
            />

            <View className="graph-controls">
                <FilterBar
                    items={filterItems}
                    selectedItems={selectedFilters}
                    onToggle={handleFilterToggle}
                    onReset={() => setSelectedFilters([])}
                />
            </View>
        </View>
    );
}
