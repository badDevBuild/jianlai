import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect } from 'react';
import { useItem, getItemIcon } from '../../data/useData';
import './index.scss';

export default function ArtifactDetail() {
  const router = useRouter();
  const name = decodeURIComponent(router.params.name || '');
  const { item, loading, error } = useItem(name);

  useEffect(() => {
    if (item) {
      Taro.setNavigationBarTitle({ title: item.name });
    }
  }, [item]);

  if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
  if (error || !item) return <View className="error-container"><Text>法宝不存在</Text></View>;

  const getGradeClass = (grade: string) => {
    if (grade === '神器') return 'grade-shenqi';
    if (grade === '仙兵') return 'grade-xianbing';
    if (grade === '半仙兵') return 'grade-banxianbing';
    if (grade === '法宝') return 'grade-fabao';
    if (grade === '灵器') return 'grade-lingqi';
    return 'grade-normal';
  };

  return (
    <ScrollView className="detail-page" scrollY>
      <View className="detail-header">
        <View className="header-icon">
          <Image
            src={getItemIcon(item)}
            className="item-image"
            mode="aspectFit"
          />
        </View>
        <Text className="detail-name">{item.name}</Text>
        <View className={`grade-pill ${getGradeClass(item.grade as string)}`}>
          <Text>{item.grade || '未知品秩'}</Text>
        </View>
      </View>

      {item.description && (
        <View className="detail-section">
          <Text className="section-title">法宝简介</Text>
          <View className="section-content">
            <Text className="text-content">{item.description}</Text>
          </View>
        </View>
      )}

      {/* 持有记录 */}
      {(item.ownership_log && item.ownership_log.length > 0) && (
        <View className="detail-section">
          <Text className="section-title">流转记录</Text>
          <View className="timeline-list">
            {item.ownership_log.map((log, index) => (
              <View key={index} className="timeline-item">
                <View className="timeline-dot" />
                <View className="timeline-content">
                  <Text className="owner-name" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(log.owner)}` })}>
                    {log.owner}
                  </Text>
                  <Text className="chapter-ref">于 {log.chapter} 获得</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
