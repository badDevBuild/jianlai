import { View, Text, ScrollView, Image, Canvas } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { useQuotes } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import { generateQuoteCard } from '../../utils/quoteCardGenerator';
import { trackCardGenerate, trackCardSave } from '../../utils/analytics';
import Icon from '../../components/Icon';
import './index.scss';

const PAGE_SIZE = 10;
const TAG_LIST = ['全部', '励志', '感伤', '豪气', '幽默', '哲理', '温情'];

// 背景图
const bgBamboo = 'https://shushu.host/jianlai/img/bg-bamboo.jpg';
const bgMountain = 'https://shushu.host/jianlai/img/bg-mountain.jpg';

export default function QuotesPage() {
  const { quotes: allQuotes, loading } = useQuotes({ full: true });
  useAppShare({ title: '剑来光阴 - 经典语录', path: '/pages/quotes/index' });
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState('全部');

  // 卡片生成状态
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [cardPath, setCardPath] = useState('');

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '剑来经典语录' });
  });

  const filteredQuotes = useMemo(() => {
    if (selectedTag === '全部') return allQuotes;
    return allQuotes.filter(q => q.tags && q.tags.includes(selectedTag));
  }, [allQuotes, selectedTag]);

  const displayList = useMemo(() => {
    return filteredQuotes.slice(0, page * PAGE_SIZE);
  }, [filteredQuotes, page]);

  const handleScrollToLower = () => {
    if (displayList.length < filteredQuotes.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setPage(1);
  };

  const handleShareQuote = (quote: any, index: number) => {
    if (generatingIdx !== null) return;
    setGeneratingIdx(index);
    const query = Taro.createSelectorQuery();
    query.select('#quoteCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        try {
          const canvasNode = res[0]?.node;
          if (!canvasNode) {
            Taro.showToast({ title: '画布初始化失败', icon: 'none' });
            setGeneratingIdx(null);
            return;
          }
          const dpr = Taro.getSystemInfoSync().pixelRatio;
          const bg = index % 2 === 0 ? bgBamboo : bgMountain;
          const tempPath = await generateQuoteCard(
            canvasNode,
            { content: quote.content, author: quote.author },
            bg,
            dpr
          );
          trackCardGenerate('quote', quote.author);
          setCardPath(tempPath);
          setShowCardPreview(true);
        } catch (err) {
          console.error('Quote card generation failed:', err);
          Taro.showToast({ title: '生成失败', icon: 'none' });
        } finally {
          setGeneratingIdx(null);
        }
      });
  };

  const handleSaveCard = () => {
    if (!cardPath) return;
    Taro.saveImageToPhotosAlbum({
      filePath: cardPath,
      success: () => {
        trackCardSave('quote', '');
        Taro.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg?.includes('deny') || err.errMsg?.includes('auth')) {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册访问权限',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) Taro.openSetting(); }
          });
        } else {
          Taro.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  };

  return (
    <View className="quotes-page">
      {/* Hidden Canvas for quote card */}
      <Canvas
        type="2d"
        id="quoteCanvas"
        style={{ width: '750px', height: '1000px', position: 'fixed', left: '-9999px', top: 0 }}
      />

      {/* Card Preview Modal */}
      {showCardPreview && cardPath && (
        <View className="card-preview-modal" onClick={() => setShowCardPreview(false)}>
          <View className="card-preview-content" onClick={e => e.stopPropagation()}>
            <Image className="card-preview-image" src={cardPath} mode="widthFix" />
            <View className="card-preview-actions">
              <View className="card-action-btn save-btn" onClick={handleSaveCard}>
                <Text>保存到相册</Text>
              </View>
              <View className="card-action-btn close-btn" onClick={() => setShowCardPreview(false)}>
                <Text>关闭</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="page-header">
        <Text className="title">经典语录</Text>
        <Text className="subtitle">共 {filteredQuotes.length} 条心声</Text>
      </View>

      {/* 标签筛选 Tab */}
      <ScrollView className="tag-filter" scrollX showScrollbar={false}>
        {TAG_LIST.map(tag => (
          <Text
            key={tag}
            className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => handleTagChange(tag)}
          >
            {tag}
          </Text>
        ))}
      </ScrollView>

      <ScrollView
        scrollY
        className="quotes-list"
        onScrollToLower={handleScrollToLower}
        lowerThreshold={100}
      >
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : filteredQuotes.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-text">此类金句尚在搜集中</Text>
            <View className="empty-action" onClick={() => handleTagChange('全部')}>
              <Text>查看全部金句</Text>
            </View>
          </View>
        ) : (
          <View className="list-wrapper">
            {displayList.map((quote, index) => (
              <View key={index} className="quote-card">
                <View className="quote-content">
                  <Text>{quote.content}</Text>
                </View>
                <View className="quote-footer" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(quote.author)}` })}>
                  <View className="author-info">
                    <Text className="dash">——</Text>
                    <Text className="author-name">{quote.author}</Text>
                    {quote.context && <Text className="context"> · {quote.context}</Text>}
                  </View>
                  <Image className="author-avatar" src={quote.avatar} mode="aspectFill" />
                </View>
                {/* 分享入口 */}
                <View
                  className="share-entry"
                  onClick={(e) => { e.stopPropagation(); handleShareQuote(quote, index); }}
                >
                  <Icon name="share" size={14} color="#999999" />
                  <Text className="share-text">{generatingIdx === index ? '生成中...' : '分享卡片'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {displayList.length > 0 && displayList.length < filteredQuotes.length && (
          <View className="loading-more">
            <Text>加载更多...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
