import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { useTopCharacters, useRandomQuote, getAvatar, preloadAllData } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import './index.scss';

// 背景图使用远程 URL
const bgBamboo = 'https://shushu.host/jianlai/img/bg-bamboo.jpg';
const bgMountain = 'https://shushu.host/jianlai/img/bg-mountain.jpg';

// 每日金句 - 默认兜底
const DEFAULT_QUOTES = [
  { content: '你好， 我叫阿良， 善良的良。我是一名剑客。', author: '阿良', id: '1' },
  { content: '天下事，有所激有所逼而成者，居其半。', author: '崔东山', id: '2' },
  { content: '读万卷书，行万里路，还要经一番事。', author: '齐静春', id: '3' },
  { content: '这世上，从来不缺聪明人。', author: '老秀才', id: '4' },
  { content: '善恶有报，好人有好报。', author: '陈平安', id: '5' },
];

// 静态数据 - 模拟统计数量
const STATS = {
  factions: 635,
  items: 2459,
  locations: 1387,
  relations: '人物关系网'
};

export default function Index() {
  useAppShare();
  const { characterList, loading } = useTopCharacters();
  const { quotes: randomQuotes } = useRandomQuote();

  // 每日金句交互状态
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 优先使用随机金句，加载中或无数据时使用默认
  const displayQuotes = (randomQuotes && randomQuotes.length > 0) ? randomQuotes : DEFAULT_QUOTES;
  const dailyQuote = displayQuotes[quoteIndex % displayQuotes.length];

  const currentBg = quoteIndex % 2 === 0 ? bgBamboo : bgMountain;

  // 系统信息适配
  const [navBarHeight, setNavBarHeight] = useState(0);
  const [capsulePos, setCapsulePos] = useState({ top: 0, right: 0, height: 0 });

  useLoad(() => {
    try {
      const menuButton = Taro.getMenuButtonBoundingClientRect();
      if (menuButton) {
        setCapsulePos({
          top: menuButton.top,
          right: menuButton.right,
          height: menuButton.height
        });
        // 简单估算导航栏高度：胶囊底部 + 16px padding
        setNavBarHeight(menuButton.bottom + 16);
      }

      // 启动静默预加载
      preloadAllData();

    } catch (e) {
      console.error('获取胶囊位置失败', e);
    }
  });

  const categories = [
    { name: '宗派势力', count: `${STATS.factions} 个势力`, icon: '🏔️', path: '/pages/factions/index', color: '#eef2ff', iconColor: '#6366f1' },
    { name: '宝物图鉴', count: `${STATS.items} 件物品`, icon: '🗡️', path: '/pages/artifacts/index', color: '#fdf4ff', iconColor: '#d946ef' },
    { name: '地点图鉴', count: `${STATS.locations} 个地点`, icon: '🗺️', path: '/pages/locations/index', color: '#f0fdf4', iconColor: '#22c55e' },
    { name: '世界观', count: '宏大设定', icon: '📜', path: '/pages/world/index', color: '#fff7ed', iconColor: '#f97316' },
  ];

  const handleCategoryClick = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const handleSearchClick = () => {
    Taro.navigateTo({ url: '/pages/search/index' });
  };

  const handleQuoteClick = () => {
    // 切换到下一个
    setQuoteIndex((prev) => prev + 1);
  };

  const handleMoreQuotes = (e) => {
    e.stopPropagation(); // 阻止冒泡，避免触发切金句
    Taro.navigateTo({ url: '/pages/quotes/index' });
  };

  return (
    <View className="index-page">
      {/* 沉浸式 Header 区 */}
      <View className="custom-header" style={{ paddingTop: `${capsulePos.top}px`, height: `${capsulePos.height}px` }}>
        <View className="header-content">
          <Text className="app-title">剑来·<Text className="title-highlight">光阴</Text></Text>
        </View>
      </View>

      <View style={{ height: `${navBarHeight}px` }} />

      <ScrollView className="main-scroll" scrollY>
        <View className="content-container">

          {/* 页面内大搜索框 */}
          <View className="page-search-field" onClick={handleSearchClick}>
            <Text className="search-icon">🔍</Text>
            <Text className="search-text">搜索人物、法宝、势力...</Text>
          </View>

          {/* 风流人物 */}
          <View className="section-container">
            <View className="section-header">
              <Text className="section-title">风流人物</Text>
              <View className="section-link" onClick={() => Taro.navigateTo({ url: '/pages/characters/index' })}>
                <Text>查看全部</Text>
                <Text className="arrow">›</Text>
              </View>
            </View>

            {loading ? (
              <View className="loading-state"><Text>加载中...</Text></View>
            ) : (
              <ScrollView className="characters-scroll" scrollX showScrollbar={false}>
                {characterList.map((char, index) => (
                  <View
                    key={char.name}
                    className="character-card"
                    onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(char.name)}` })}
                  >
                    <View className="avatar-wrapper">
                      <Image className="character-avatar" src={getAvatar(char)} mode="aspectFill" />
                    </View>
                    <Text className="character-name">{char.name}</Text>
                  </View>
                ))}
                <View className="scroll-spacer" />
              </ScrollView>
            )}
          </View>

          {/* 功能入口 Grid */}
          <View className="grid-container">
            {categories.map((cat) => (
              <View
                key={cat.name}
                className="grid-card"
                onClick={() => handleCategoryClick(cat.path)}
              >
                <View className="card-content">
                  <Text className="card-title">{cat.name}</Text>
                  <Text className="card-count">{cat.count}</Text>
                </View>
                <View className="card-icon-bg" style={{ backgroundColor: cat.color }}>
                  <Text className="card-icon" style={{ color: cat.iconColor }}>{cat.icon}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* 每日金句 */}
          <View className="section-container quote-section">
            <View className="section-header">
              <Text className="section-title">每日金句</Text>
            </View>
            <View className="quote-card-large" onClick={handleQuoteClick}>
              <Image
                className="quote-bg-image"
                src={currentBg}
                mode="aspectFill"
              />
              <View className="quote-overlay" />
              <View className="quote-content-wrap">
                <Text className="quote-mark-left">"</Text>
                <Text className="quote-text">{dailyQuote.content}</Text>
                <Text className="quote-mark-right">"</Text>
                <View className="quote-author-line">
                  <View className="line" />
                  <Text className="author-name">{dailyQuote.author}</Text>
                </View>
              </View>

              <View className="quote-actions" onClick={handleMoreQuotes}>
                <Text className="action-text">点击查看更多金句</Text>
                <View className="action-btn">→</View>
              </View>
            </View>
          </View>

          {/* 底部留白 */}


        </View>
      </ScrollView>

    </View>
  );
}
