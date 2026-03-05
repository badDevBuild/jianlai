import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect } from 'react';
import { useFaction } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import UgcEntry from '../../components/UgcEntry';
import './index.scss';

export default function FactionDetail() {
    const router = useRouter();
    const name = decodeURIComponent(router.params.name || '');
    const { faction, loading, error } = useFaction(name);
    useAppShare({
        title: `【剑来·宗门】${name}`,
        path: `/pages/faction-detail/index?name=${encodeURIComponent(name)}`
    });

    useEffect(() => {
        if (faction) {
            Taro.setNavigationBarTitle({ title: `${faction.name} - 剑来势力` });
        }
    }, [faction]);

    if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
    if (error || !faction) return <View className="error-container"><Text>宗派不存在</Text></View>;

    return (
        <ScrollView className="detail-page" scrollY>
            <View className="detail-header">
                <View className="header-icon">
                    <Text>🏔️</Text>
                </View>
                <Text className="detail-name">{faction.name}</Text>
                <Text className="detail-subtitle">{faction.type || '宗派'}</Text>
            </View>

            {faction.description && (
                <View className="detail-section">
                    <View className="section-header-row">
                        <Text className="section-title">简介</Text>
                    </View>
                    <View className="section-content">
                        <Text className="text-content">{faction.description}</Text>
                    </View>
                    <View className="ugc-footer-wrap"><UgcEntry entryName={faction.name} entryType="势力" field="description" /></View>
                </View>
            )}

            {/* 成员列表 - 重点 */}
            {(faction.members && faction.members.length > 0) && (
                <View className="detail-section">
                    <View className="section-header-row">
                        <Text className="section-title">门下成员 ({faction.members.length})</Text>
                    </View>
                    <View className="member-list">
                        {faction.members.map(memberName => (
                            <View
                                key={memberName}
                                className="member-tag"
                                onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(memberName)}` })}
                            >
                                <Text>{memberName}</Text>
                            </View>
                        ))}
                    </View>
                    <View className="ugc-footer-wrap"><UgcEntry entryName={faction.name} entryType="势力" field="members" /></View>
                </View>
            )}
        </ScrollView>
    );
}
