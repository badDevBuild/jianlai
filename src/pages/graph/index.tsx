import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useMemo, useEffect } from 'react';
import F6Graph from '../../components/Graph/F6Graph';
import { useRelations, useCharacters } from '../../data/useData';
import { getEgoGraph } from '../../utils/graph-adapter';
import { useAppShare } from '../../utils/share';
import './index.scss';

export default function GraphPage() {
    useAppShare({ title: '剑来光阴 - 人物关系图谱', path: '/pages/graph/index' });
    const { data: fullData, loading: relLoading, error: relError } = useRelations();
    const { data: allCharacters, loading: charLoading } = useCharacters();
    const loading = relLoading || charLoading;
    const error = relError;

    // Filter relations to only keep person-to-person edges
    const personOnlyData = useMemo(() => {
        if (!fullData || !allCharacters) return [];
        return fullData.filter(item => item.source in allCharacters && item.target in allCharacters);
    }, [fullData, allCharacters]);
    const [centerId, setCenterId] = useState('陈平安');
    const [selectedFilters] = useState<string[]>([]);
    const [windowInfo] = useState(() => {
        const info = Taro.getSystemInfoSync();
        return {
            width: info.windowWidth,
            height: info.windowHeight // Full screen
        };
    });

    useDidShow(() => {
        const target = Taro.getStorageSync('target_center');
        if (target) {
            setCenterId(target);
            Taro.removeStorageSync('target_center');
        }
    });

    const graphData = useMemo(() => {
        if (!personOnlyData.length) return { nodes: [], edges: [] };
        return getEgoGraph(personOnlyData, centerId, selectedFilters);
    }, [personOnlyData, centerId, selectedFilters]);

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
                height={windowInfo.height}
                onNodeTap={handleNodeTap}
            />

        </View>
    );
}
