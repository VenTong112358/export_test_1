import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { AppDispatch, RootState } from '@data/repository/store';
import { fetchSavedArticles, unsaveArticle } from '@data/usecase/SavedArticlesUseCase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedArticlesPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { articles: savedArticles, loading, error } = useSelector((state: RootState) => state.savedArticles);
  const [refreshing, setRefreshing] = useState(false);

  // 获取收藏文章列表
  const fetchSavedArticlesData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      await dispatch(fetchSavedArticles()).unwrap();
      console.log('[SavedArticles] Fetched articles:', savedArticles.length);
    } catch (error) {
      console.error('[SavedArticles] Error fetching articles:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 取消收藏文章
  const handleUnsaveArticle = async (articleId: number, title: string) => {
    Alert.alert(
      '取消收藏',
      `确定要取消收藏文章「${title}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(unsaveArticle(articleId)).unwrap();
              console.log('[SavedArticles] Article unsaved:', articleId);
              Alert.alert('成功', '已取消收藏该文章');
            } catch (error) {
              console.error('[SavedArticles] Error unsaving article:', error);
              Alert.alert('错误', '取消收藏失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 查看文章详情
  const handleViewArticle = (article: any) => {
    console.log('[SavedArticles] View article:', article.id);
    // 导航到文章详情页面
    router.push({
      pathname: '/PassageMain',
      params: { sessionId: article.id.toString() }
    });
  };

  // 返回上一页
  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/MainPage');
    }
  };

  // 下拉刷新
  const onRefresh = () => {
    fetchSavedArticlesData(true);
  };

  // 渲染文章项
  const renderArticleItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleViewArticle(item)}
      activeOpacity={0.7}
    >
      <View style={styles.articleHeader}>
        <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title || '无标题'}
        </Text>
        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsaveArticle(item.id, item.title)}
        >
          <Ionicons name="heart" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.articlePreview, { color: theme.colors.text }]} numberOfLines={3}>
        {getContentPreview(item.content)}
      </Text>
      
      <View style={styles.articleFooter}>
        <Text style={[styles.savedDate, { color: theme.colors.text }]}>
          收藏于 {formatDate(item.saved_at)}
        </Text>
        <View style={styles.articleMeta}>
          <Ionicons name="time-outline" size={14} color={theme.colors.text} />
          <Text style={[styles.metaText, { color: theme.colors.text }]}>约 {Math.ceil((item.content?.length || 0) / 200)} 分钟阅读</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取内容预览
  const getContentPreview = (content: string) => {
    if (!content) return '暂无内容预览';
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  useEffect(() => {
    fetchSavedArticlesData();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>收藏文章</Text>
        <View style={styles.placeholder} />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>加载中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={() => fetchSavedArticlesData()}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : savedArticles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.colors.text} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>暂无收藏文章</Text>
          <Text style={[styles.emptySubText, { color: theme.colors.text }]}>去阅读一些文章并收藏吧！</Text>
        </View>
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderArticleItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
  articleCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  articleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  unsaveButton: {
    padding: 4,
  },
  articlePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedDate: {
    fontSize: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
});