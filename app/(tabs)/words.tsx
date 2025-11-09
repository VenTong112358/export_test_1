import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';
import { useLocalArticles } from '@hooks/useLocalArticles';
import { Header } from '../components/Header';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

export default function WordsPage() {
  const { theme } = useTheme();
  const { logs, isLoading, error, additional_information } = useDailyLearningLogs();
  const router = useRouter();
  const userId = useSelector((state: any) => state.auth.user?.id);
  const { articles, newWords, isLoading: localLoading, getArticlesGroupedByDate, refreshArticles } = useLocalArticles(userId);

  // Accordion state: store expanded article ids
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);

  // 默认全部展开：每次 articles 变化时自动展开所有 article
  useEffect(() => {
    if (articles.length > 0) {
      setExpandedArticles(articles.map(a => a.id));
    }
  }, [articles]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get formatted date for display
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Get the most recent learning log with words
  const getMostRecentLogWithWords = () => {
    if (!logs || logs.length === 0) return null;
    
    // Sort logs by date (most recent first)
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Find the first log that has words
    return sortedLogs.find(log => log.daily_new_words && log.daily_new_words.length > 0) || null;
  };

  const mostRecentLog = getMostRecentLogWithWords();
  const todayDate = getTodayDate();
  const isToday = mostRecentLog?.date === todayDate;

  // Helper to format percentage
  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  // Get progress data from additional_information
  const learningProportion = additional_information?.learning_proportion ?? 0;
  const progression = additional_information?.progression ?? 0;
  const wordBookName = additional_information?.word_book?.name ?? '';

  // Toggle expand/collapse for an article
  const toggleArticle = (articleId: string) => {
    setExpandedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  // 页面聚焦时刷新
  useFocusEffect(
    React.useCallback(() => {
      refreshArticles();
    }, [userId])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Header 
        title="仝文馆"
        showMenuButton={false}
        showNotificationButton={false}
      />

      <ScrollView style={styles.scrollView}>
        {/* Day Day up - Daily Progress Section */}
        {additional_information && (
          <>
            {/* Title block styled like 'Recent new words' */}
            <View style={styles.titleSection}>
              <Text style={styles.titleText}>Day Day up</Text>
              <Text style={styles.subtitleText}>每日进步</Text>
            </View>
            {/* Arc progress bar and info */}
            <View style={styles.dailyProgressSection}>
              <View style={styles.arcProgressContainer}>
                <AnimatedCircularProgress
                  size={180}
                  width={16}
                  fill={learningProportion * 100}
                  arcSweepAngle={270}
                  rotation={225}
                  lineCap="round"
                  tintColor="#FC9B33"
                  backgroundColor="#FFF7E6"
                  children={() => (
                    <Text style={styles.arcProgressPercentText}>{formatPercent(learningProportion)}</Text>
                  )}
                />
              </View>
              {/* Progression and word book name */}
              <View style={styles.arcProgressInfoContainer}>
                <Text style={styles.arcProgressInfoText}>已学{progression}个单词</Text>
                <Text style={styles.arcProgressInfoText}>{wordBookName}</Text>
              </View>
              
            </View>
          </>
        )}

        {/* 功能按钮区 - 卡片式美化 function button */ }
        {/* <View style={styles.featureGridBg}>
                <View style={styles.featureGridCard}>
                  <TouchableOpacity style={styles.featureGridItem}
                    onPress={() => {
                      // Navigate to FavouriteSentences page
                      router.push('/FavouriteSentences');
                    }}
                  >
                    <Ionicons name="book-outline" size={32} color="#FC9B33" />
                    <Text style={styles.featureGridText}>单词本</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.featureGridItem}
                    onPress={() => {
                      // Navigate to FavouriteSentences page
                      router.push('/FavouriteSentences');
                    }}
                  >
                    <Ionicons name="star-outline" size={32} color="#FC9B33" />
                    <Text style={styles.featureGridText}>收藏句子</Text>
                  </TouchableOpacity>
                  <View style={styles.featureGridItem} />
                  <View style={styles.featureGridItem} />
                </View>
              </View> */}

        {/*/!* Tool Section *!/*/}
        {/*<View style={styles.toolSection}>*/}
        {/*  /!* 单词本 *!/*/}
        {/*  <TouchableOpacity style={styles.toolItem1} onPress={() => router.push('/word-preview')}>*/}
        {/*    <View style={styles.toolIcon1}>*/}
        {/*      <Ionicons name="book-outline" size={16} color="#FF9500" />*/}
        {/*    </View>*/}
        {/*    <Text style={styles.toolText1}>单词本</Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*  */}
        {/*  /!* 复习测验 *!/*/}
        {/*  <TouchableOpacity style={styles.toolItem2}>*/}
        {/*    <View style={styles.toolIcon2}>*/}
        {/*      <Ionicons name="search-outline" size={16} color="#FF9500" />*/}
        {/*    </View>*/}
        {/*    <Text style={styles.toolText2}>复习测验</Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*  */}
        {/*  /!* 收藏句子 *!/*/}
        {/*  <TouchableOpacity style={styles.toolItem3} onPress={() => router.push('/FavouriteSentences')}>*/}
        {/*    <View style={styles.toolIcon3}>*/}
        {/*      <Ionicons name="heart-outline" size={16} color="#FF9500" />*/}
        {/*    </View>*/}
        {/*    <Text style={styles.toolText3}>收藏句子</Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*  */}
        {/*  /!* 收藏短语 *!/*/}
        {/*  <TouchableOpacity style={styles.toolItem4}>*/}
        {/*    <View style={styles.toolIcon4}>*/}
        {/*      <Ionicons name="bookmark-outline" size={16} color="#FF9500" />*/}
        {/*    </View>*/}
        {/*    <Text style={styles.toolText4}>收藏短语</Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*</View>*/}
        
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>
            {articles.length > 0 ? "Recent new words" : "Recent new words"}
          </Text>
          <Text style={styles.subtitleText}>
            {articles.length > 0 ? "最近新学单词" : "最近新学单词"}
          </Text>
        </View>

        {/* Date Display */}
        {articles.length > 0 && (
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>
              {getFormattedDate(articles[0].date)}
            </Text>
            <Text style={styles.dateNote}>
              ({articles.length} completed article{articles.length > 1 ? 's' : ''})
            </Text>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading words...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {/* Words List - Grouped by Articles */}
        {articles.length > 0 && (
          <View style={styles.wordsSection}>
            {Object.entries(getArticlesGroupedByDate()).map(([date, dateArticles]) => (
              <View key={date} style={styles.dateGroupContainer}>
                <Text style={styles.dateGroupTitle}>{getFormattedDate(date)}</Text>
                {dateArticles.map((article) => (
                  <View key={article.id} style={styles.articleContainer}>
                    <TouchableOpacity onPress={() => toggleArticle(article.id)} activeOpacity={0.7} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                      <View style={{flex:1}}>
                        <Text style={styles.articleTitle}>{article.englishTitle}</Text>
                        {article.chineseTitle && (
                          <Text style={styles.articleSubtitle}>{article.chineseTitle}</Text>
                        )}
                      </View>
                      <Ionicons name={expandedArticles.includes(article.id) ? 'chevron-up' : 'chevron-down'} size={22} color="#FC9B33" style={{marginLeft:8}} />
                    </TouchableOpacity>
                    {expandedArticles.includes(article.id) && (
                      <View style={{marginTop:8}}>
                        {article.newWords.map((word, index) => (
                          <View key={`${article.id}-${word.id}`} style={styles.wordItem}>
                            <View style={styles.wordRow}>
                              <Text style={styles.wordText}>{word.word}</Text>
                              {word.phonetic && (
                                <Text style={styles.phoneticText}>[{word.phonetic}]</Text>
                              )}
                            </View>
                            <Text style={styles.definitionText}>{word.definition}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* No Words State */}
        {!isLoading && !error && !localLoading && articles.length === 0 && (
          <View style={styles.noWordsContainer}>
            <Text style={styles.noWordsText}>No completed articles yet</Text>
            <Text style={styles.noWordsSubtext}>Complete articles to see new words here</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#FFFBF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    color: '#FC9B33',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: '#FC9B33',
    padding: width * 0.04,
    margin: width * 0.04,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Iowan Old Style', android: 'serif' }),
    fontWeight: '700',
  },
  subtitleText: {
    color: 'white',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
  dateSection: {
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
    color: '#0C1A30',
    marginBottom: height * 0.005,
  },
  dateNote: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#838589',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  errorContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordsSection: {
    paddingHorizontal: width * 0.04,
  },
  wordsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.02,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  wordItem: {
    backgroundColor: 'white',
    padding: width * 0.04,
    marginBottom: height * 0.01,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.005,
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FAC880',
    marginRight: width * 0.02,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  phoneticText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  definitionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  noWordsContainer: {
    padding: width * 0.04,
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  noWordsText: {
    fontSize: 18,
    color: '#838589',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
    marginBottom: height * 0.01,
  },
  noWordsSubtext: {
    fontSize: 14,
    color: '#838589',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    textAlign: 'center',
  },
  dailyProgressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
    paddingVertical: height * 0.03,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dailyProgressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FC9B33',
    marginBottom: 10,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  arcProgressContainer: {
    width: 180,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 20,
    
  },
  arcProgressCenterTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 90,
  },
  arcProgressPercentText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FC9B33',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  arcProgressInfoContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  arcProgressInfoText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    marginVertical: 1,
    marginTop: 10,
  },
  // 卡片式功能入口区样式
  featureGridBg: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.01,
    paddingBottom: height * 0.01,
  },
  featureGridCard: {
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.02,
    elevation: 2,
  },
  featureGridItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.01,
  },
  featureGridText: {
    marginTop: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    lineHeight: 20,
  },
  dateGroupContainer: {
    marginBottom: height * 0.03,
  },
  dateGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C1A30',
    marginBottom: height * 0.015,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  articleContainer: {
    backgroundColor: '#FFF7E6',
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.015,
    borderLeftWidth: 3,
    borderLeftColor: '#FC9B33',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FC9B33',
    marginBottom: height * 0.005,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  articleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: height * 0.01,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  // Tool Section styles
  toolSection: {
    flexDirection: 'row',
    height: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginHorizontal: width * 0.04,
    marginVertical: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  // 单词本
  toolItem1: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  toolIcon1: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  toolText1: {
    width: 39,
    height: 25,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 25,
    textAlign: 'center',
    color: '#5C5D61',
  },
  // 复习测验
  toolItem2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  toolIcon2: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  toolText2: {
    width: 52,
    height: 25,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 25,
    textAlign: 'center',
    color: '#5C5D61',
  },
  // 收藏句子
  toolItem3: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  toolIcon3: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  toolText3: {
    width: 52,
    height: 25,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 25,
    textAlign: 'center',
    color: '#5C5D61',
  },
  // 收藏短语
  toolItem4: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  toolIcon4: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  toolText4: {
    width: 52,
    height: 25,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 25,
    textAlign: 'center',
    color: '#5C5D61',
  },
});