import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo, useCallback } from 'react';
import { useLocations } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import Icon from '../../components/Icon';
import type { LocationData } from '../../data/dataTypes';
import './index.scss';

// Location type → icon mapping
const TYPE_ICONS: Record<string, string> = {
  '天下': 'globe',
  '大洲': 'map',
  '王朝': 'flag',
  '宗门': 'mountain',
  '城市': 'building',
  '城镇': 'building',
  '村落': 'home',
  '山脉': 'peak',
  '建筑': 'landmark',
  '店铺': 'store',
  '水域': 'waves',
  '渡口': 'anchor',
  '遗迹': 'ruin',
};

function getIcon(type: string): string {
  return TYPE_ICONS[type] || 'mapPin';
}

// A child node in the drill-down tree
interface TreeNode {
  name: string;
  childCount: number;  // how many locations are underneath
  location?: LocationData;  // the DB entry if this name is a real location
  type?: string;
}

export default function LocationList() {
  const { data, loading } = useLocations();
  useAppShare({ title: '剑来光阴 - 地点图鉴', path: '/pages/locations/index' });
  const [path, setPath] = useState<string[]>([]);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '剑来地点图鉴' });
  });

  // Build location lookup: name → LocationData
  const locationMap = useMemo(() => {
    if (!data) return new Map<string, LocationData>();
    const map = new Map<string, LocationData>();
    for (const loc of Object.values(data) as LocationData[]) {
      map.set(loc.name, loc);
    }
    return map;
  }, [data]);

  // All locations as array
  const allLocations = useMemo(() => {
    if (!data) return [];
    return Object.values(data) as LocationData[];
  }, [data]);

  // Compute tree nodes at current path depth
  const { nodes, currentLocation } = useMemo(() => {
    const depth = path.length;

    // Find the current location (if the last path segment is a DB entry)
    const curLoc = depth > 0 ? locationMap.get(path[depth - 1]) : undefined;

    // Filter locations that match the current path prefix
    const matching = allLocations.filter(loc => {
      const h = loc.hierarchy;
      if (!h || h.length <= depth) return false;
      for (let i = 0; i < depth; i++) {
        if (h[i] !== path[i]) return false;
      }
      return true;
    });

    // Group by hierarchy[depth] to build child nodes
    const groups = new Map<string, LocationData[]>();
    for (const loc of matching) {
      const key = loc.hierarchy![depth];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(loc);
    }

    // Convert to TreeNode array
    const treeNodes: TreeNode[] = [];
    for (const [name, locs] of groups) {
      const dbEntry = locationMap.get(name);
      treeNodes.push({
        name,
        childCount: locs.length,
        location: dbEntry,
        type: dbEntry?.type,
      });
    }

    // Sort: nodes with more children first, then alphabetically
    treeNodes.sort((a, b) => {
      if (b.childCount !== a.childCount) return b.childCount - a.childCount;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    return { nodes: treeNodes, currentLocation: curLoc };
  }, [allLocations, locationMap, path]);

  // Handle clicking a tree node
  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.childCount <= 1 && node.location) {
      // Leaf node → go to detail page
      Taro.navigateTo({
        url: `/pages/location-detail/index?name=${encodeURIComponent(node.name)}`
      });
    } else {
      // Branch node → drill down
      setPath(prev => [...prev, node.name]);
    }
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumb = useCallback((index: number) => {
    // index -1 = root, 0 = first segment, etc.
    if (index < 0) {
      setPath([]);
    } else {
      setPath(prev => prev.slice(0, index + 1));
    }
  }, []);

  // Navigate to detail page for current location
  const handleViewDetail = useCallback((name: string) => {
    Taro.navigateTo({
      url: `/pages/location-detail/index?name=${encodeURIComponent(name)}`
    });
  }, []);

  return (
    <View className="locations-page">
      {/* Breadcrumb */}
      {path.length > 0 && (
        <View className="breadcrumb-bar">
          <Text
            className="breadcrumb-item root"
            onClick={() => handleBreadcrumb(-1)}
          >
            全部
          </Text>
          {path.map((segment, i) => (
            <View key={segment} className="breadcrumb-segment">
              <Icon name="arrowRight" size={12} color="#999999" />
              <Text
                className={`breadcrumb-item ${i === path.length - 1 ? 'current' : ''}`}
                onClick={() => handleBreadcrumb(i)}
              >
                {segment}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Current location banner */}
      {currentLocation && (
        <View
          className="current-location-banner"
          onClick={() => handleViewDetail(currentLocation.name)}
        >
          <View className="banner-left">
            <Icon name={getIcon(currentLocation.type)} size={24} color="#485a6c" />
            <View className="banner-info">
              <View className="banner-name-row">
                <Text className="banner-name">{currentLocation.name}</Text>
                <View className="banner-type-tag">
                  <Text>{currentLocation.type}</Text>
                </View>
              </View>
              {currentLocation.description && (
                <Text className="banner-desc">{currentLocation.description}</Text>
              )}
            </View>
          </View>
          <Icon name="arrowRight" size={16} color="#999999" />
        </View>
      )}

      <ScrollView scrollY className="list-content">
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : nodes.length > 0 ? (
          <View className="location-grid">
            {/* Section header showing child count */}
            {path.length > 0 && (
              <View className="section-hint">
                <Text>共 {nodes.length} 个子区域</Text>
              </View>
            )}
            {nodes.map(node => (
              <View
                key={node.name}
                className="location-card"
                onClick={() => handleNodeClick(node)}
              >
                <View className="card-left">
                  <View className="icon-wrap">
                    <Icon name={getIcon(node.type || '')} size={20} color="#666666" />
                  </View>
                  <View className="info-wrap">
                    <View className="name-row">
                      <Text className="loc-name">{node.name}</Text>
                      {node.type && (
                        <View className="type-tag">
                          <Text>{node.type}</Text>
                        </View>
                      )}
                    </View>
                    {node.location?.description && (
                      <Text className="loc-desc">{node.location.description}</Text>
                    )}
                  </View>
                </View>
                {node.childCount > 1 && (
                  <View className="child-count-badge">
                    <Text className="count-text">{node.childCount}</Text>
                    <Icon name="arrowRight" size={14} color="#999999" />
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="no-results">
            <Text>暂无子地点</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
