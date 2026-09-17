import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo } from 'react';
import { useLocation, useLocations } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { trackPageView } from '../../utils/analytics';
import Icon from '../../components/Icon';
import UgcEntry from '../../components/UgcEntry';
import type { LocationData } from '../../data/dataTypes';
import './index.scss';

export default function LocationDetail() {
  const router = useRouter();
  const name = decodeURIComponent(router.params.name || '');
  const { location, loading, error } = useLocation(name);
  const { data: allData } = useLocations();
  useAppShare({
    title: `【剑来·地点】${name}`,
    path: `/pages/location-detail/index?name=${encodeURIComponent(name)}`
  });
  useEffect(() => { trackPageView('/pages/location-detail/index', name); }, [name]);

  useEffect(() => {
    if (location) {
      Taro.setNavigationBarTitle({ title: `${location.name} - 剑来` });
    }
  }, [location]);

  // Find children of this location
  const children = useMemo(() => {
    if (!allData || !name) return [];
    return (Object.values(allData) as LocationData[])
      .filter(l => l.parent === name)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [allData, name]);

  if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
  if (error || !location) return <View className="error-container"><Text>地点不存在</Text></View>;

  const hierarchy = location.hierarchy || [];

  return (
    <ScrollView className="detail-page" scrollY>
      {/* Basic Info */}
      <View className="detail-header location-header">
        <View className="detail-header-info">
          <Text className="detail-name">{location.name}</Text>
          <Text className="detail-category">{location.type || '未知洲（域）'}</Text>
        </View>
      </View>

      {/* Hierarchy breadcrumb */}
      {hierarchy.length > 1 && (
        <View className="hierarchy-breadcrumb">
          {hierarchy.slice(0, -1).map((seg, i) => (
            <View key={seg} className="hierarchy-segment">
              {i > 0 && <Icon name="arrowRight" size={12} color="#999999" />}
              <Text
                className="hierarchy-item"
                onClick={() => Taro.navigateTo({
                  url: `/pages/location-detail/index?name=${encodeURIComponent(seg)}`
                })}
              >
                {seg}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Aliases */}
      {location.aliases && location.aliases.length > 0 && (
        <View className="aliases-row">
          <Text className="aliases-label">别名：</Text>
          <Text className="aliases-text">{location.aliases.join('、')}</Text>
        </View>
      )}

      {location.description && (
        <View className="detail-section location-desc">
          <View className="section-header-row">
            <Text className="section-title">地点志</Text>
          </View>
          <View className="section-content paper-texture">
            <Text className="text-content">{location.description}</Text>
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={location.name} entryType="地点" field="description" /></View>
        </View>
      )}

      {/* Children locations */}
      {children.length > 0 && (
        <View className="detail-section children-section">
          <View className="section-header-row">
            <Text className="section-title">下辖地点</Text>
            <Text className="children-count">{children.length}处</Text>
          </View>
          <View className="children-list">
            {children.map(child => (
              <View
                key={child.name}
                className="child-item"
                onClick={() => Taro.navigateTo({
                  url: `/pages/location-detail/index?name=${encodeURIComponent(child.name)}`
                })}
              >
                <View className="child-info">
                  <Text className="child-name">{child.name}</Text>
                  <View className="child-type-tag">
                    <Text>{child.type}</Text>
                  </View>
                </View>
                <Icon name="arrowRight" size={14} color="#999999" />
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
