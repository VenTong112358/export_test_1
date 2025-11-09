import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { Header } from './components/Header';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSavedSentencesByArticle, toggleArticleExpansion } from '../data/usecase/SentenceFavouriteUseCase';
import { AppDispatch, RootState } from '../data/repository/store';

const { width, height } = Dimensions.get('window');

// JWT token will automatically provide user_id to the API

export default function FavouriteSentences() {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { monthlyGroups, loading, error, expandedArticles } = useSelector((state: RootState) => state.sentenceFavorite);
  const [isStatsExpanded, setIsStatsExpanded] = React.useState(false);

  useEffect(() => {
    dispatch(fetchSavedSentencesByArticle()).catch((error) => {
      console.error('Failed to fetch saved sentences:', error);
      // 可以在这里添加用户友好的错误提示
    });
  }, [dispatch]);

  // 添加调试日志
  useEffect(() => {
    console.log('🔍 [FavouriteSentences] Redux state:', {
      monthlyGroups,
      loading,
      error,
      monthlyGroupsLength: monthlyGroups.length
    });
  }, [monthlyGroups, loading, error]);

  useEffect(() => {
    if (error) {
      console.error('收藏句子加载失败:', error);
    }
  }, [error]);

  const handleToggleArticle = (logId: number) => {
    dispatch(toggleArticleExpansion(logId));
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return `${year}年${monthNames[parseInt(month) - 1]}`;
  };

  const getTotalSentencesCount = () => {
    return monthlyGroups.reduce((total, monthGroup) => {
      return total + monthGroup.articles.reduce((monthTotal, article) => {
        return monthTotal + article.saved_sentences.length;
      }, 0);
    }, 0);
  };

  const getTotalArticlesCount = () => {
    return monthlyGroups.reduce((total, monthGroup) => total + monthGroup.articles.length, 0);
  };

  const handleBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/words'); // or router.push('/(tabs)/words')
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Header 
        title=" "
        showBackButton={true}
        showMenuButton={false}
        showNotificationButton={false}
        onBackPress={handleBack}
      />
      {/* Orange title section */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>Favorite Sentences 收藏句子</Text>
      </View>
      {/* 统计卡片 */}
      <TouchableOpacity 
        style={styles.statsCard}
        onPress={() => router.push('/FavouriteSentencesDetail')}
        activeOpacity={0.7}
      >
        <View style={styles.statsHeader}>
          <Text style={[styles.statsDate, { color: theme.colors.text }]}>{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}</Text>
           <Ionicons 
             name="chevron-forward" 
             size={16} 
             color={theme.colors.text} 
             style={styles.expandIcon} 
           />
        </View>
        <Text style={[styles.statsDescription, { color: theme.colors.text }]}>
          在 <Text style={{ fontWeight: 'bold' }}>{getTotalArticlesCount()}</Text> 篇文章中 <Text style={{ fontWeight: 'bold' }}>收藏</Text> 了 <Text style={{ fontWeight: 'bold' }}>{getTotalSentencesCount()}</Text> 个句子
        </Text>
        {monthlyGroups.length > 0 && monthlyGroups[0].articles.length > 0 && (
          <>
            <View style={styles.statsDivider} />
            <Text style={[styles.statsArticleTitle, { color: theme.colors.text }]}>
              {monthlyGroups[0].articles[0].article_title}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* 只有当统计卡片展开时才显示收藏句子列表 */}
      {isStatsExpanded && (
        <ScrollView style={styles.scrollView}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FC9B33" style={{ marginTop: 40 }} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>加载中...</Text>
            </View>
          ) : monthlyGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>暂无收藏的句子</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.secondary }]}>在阅读文章时点击句子即可收藏</Text>
            </View>
          ) : (
            monthlyGroups.map((monthGroup, monthIndex) => (
              <View key={monthGroup.month} style={styles.monthSection}>
                {/* 月份标题 */}
                <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
                  {formatMonth(monthGroup.month)}
                </Text>
                
                {/* 该月份的文章列表 */}
                {monthGroup.articles.map((article, articleIndex) => {
                  const isExpanded = expandedArticles.has(article.log_id);
                  return (
                    <View key={article.log_id} style={[styles.articleCard, { backgroundColor: theme.colors.card }]}>
                      {/* 文章标题和展开按钮 */}
                      <TouchableOpacity 
                        style={styles.articleHeader}
                        onPress={() => handleToggleArticle(article.log_id)}
                      >
                        <View style={styles.articleTitleContainer}>
                          <Text style={[styles.articleTitle, { color: theme.colors.text }]}>
                            {article.article_title}
                          </Text>
                          <Text style={[styles.articleSentenceCount, { color: theme.colors.secondary }]}>
                            {article.saved_sentences.length} 个句子
                          </Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={theme.colors.secondary} 
                        />
                      </TouchableOpacity>
                      
                      {/* 展开的句子列表 */}
                      {isExpanded && (
                        <View style={styles.sentencesContainer}>
                          {article.saved_sentences.map((sentence, sentenceIndex) => (
                            <View key={sentence.id} style={[styles.sentenceCard, { backgroundColor: theme.colors.background }]}>
                              <Text style={[styles.sentenceContent, { color: theme.colors.text }]}>
                                {sentence.content}
                              </Text>
                              {sentence.translation && (
                                <Text style={[styles.sentenceTranslation, { color: theme.colors.secondary }]}>
                                  {sentence.translation}
                                </Text>
                              )}
                              {sentence.explication && (
                                <Text style={[styles.sentenceExplication, { color: theme.colors.secondary }]}>
                                  {sentence.explication}
                                </Text>
                              )}
                              {sentence.note && (
                                <Text style={[styles.sentenceNote, { color: theme.colors.secondary }]}>
                                  备注: {sentence.note}
                                </Text>
                              )}
                              <Text style={[styles.sentenceDate, { color: theme.colors.secondary }]}>
                                {new Date(sentence.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
      
      {/* Bottom Menu */}
      <View style={styles.bottomMenu}>
        <View style={styles.bottomMenuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/MainPage')}>
            <Ionicons name="document-text-outline" size={18} color="#200E32" />
            <Text style={styles.menuText}>文章</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItemActive} onPress={() => router.push('/(tabs)/words')}>
            <Ionicons name="book-outline" size={18} color="#FC9833" />
            <Text style={styles.menuTextActive}>单词</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-outline" size={18} color="#200E32" />
            <Text style={styles.menuText}>我的</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F6',
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    marginTop: 20,
  },
  sentenceCardOld: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sentenceContentOld: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  sentenceTranslationOld: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  sentenceExplicationOld: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sentenceNoteOld: {
    fontSize: 14,
    color: '#FC9B33',
    marginBottom: 8,
    fontWeight: '500',
  },
  sentenceDateOld: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Orange title section style
  titleSection: {
    marginHorizontal: width * 0.05,
    marginTop: 20,
    height: 25,
    backgroundColor: '#FC9B33',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontWeight: '900',
    lineHeight: 25,
  },
  subtitleText: {
    display: 'none',
  },
  // Stats card styles
  statsCard: {
    marginHorizontal: width * 0.05,
    marginTop: 20,
    backgroundColor: '#FFFDFB',
    shadowColor: 'rgba(127, 75, 2, 0.25)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 4,
    borderRadius: 10,
    padding: 16,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 8,
  },
  statsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  statsArticleTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Month and article styles
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  articleCard: {
    marginHorizontal: 0,
    marginBottom: 12,
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
    alignItems: 'center',
    padding: 16,
  },
  articleTitleContainer: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleSentenceCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  sentencesContainer: {
    marginTop: 12,
  },
  sentenceCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sentenceContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  sentenceTranslation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  sentenceExplication: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  sentenceNote: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '500',
  },
  sentenceDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  // Bottom Menu styles
  bottomMenu: {
    position: 'absolute',
    height: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFBF8',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomMenuContainer: {
    position: 'absolute',
    width: width * 0.74,
    height: 37,
    left: width * 0.11,
    top: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  menuItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  menuText: {
    fontFamily: 'DM Sans',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    letterSpacing: 0.2,
    color: '#200E32',
    marginTop: 4,
  },
  menuTextActive: {
     fontFamily: 'DM Sans',
     fontWeight: '500',
     fontSize: 10,
     lineHeight: 13,
     textAlign: 'center',
     letterSpacing: 0.2,
     color: '#FC9833',
     marginTop: 4,
   },
});