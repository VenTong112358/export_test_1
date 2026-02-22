import { SpeakApi } from '@data/api/SpeakApi';
import { DailyNewWord } from '@data/model/WordPreview';
import { Ionicons } from '@expo/vector-icons';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './Header';
// Defer importing expo-av until needed to avoid runtime crashes with version mismatch
let Audio: any = null;


const { width, height } = Dimensions.get('window');

interface WordPreviewProps {
  logId: number;
  words: DailyNewWord[];
  onBackPress?: () => void; // Optional custom back handler
}

export const WordPreview: React.FC<WordPreviewProps> = ({ logId, words, onBackPress }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const soundRef = useRef<any>(null);
  
  // Global hidden state for English/Chinese
  const [englishHidden, setEnglishHidden] = useState(false); // false: show all, true: hide all
  const [chineseHidden, setChineseHidden] = useState(false);
  // Exception sets: when hidden, these are shown; when shown, these are hidden
  const [englishExceptions, setEnglishExceptions] = useState<Set<number>>(new Set());
  const [chineseExceptions, setChineseExceptions] = useState<Set<number>>(new Set());
  
  // State for reviewed words modal
  const [showReviewedWordsModal, setShowReviewedWordsModal] = useState(false);
  
  // Get all logs from Redux to find the current log
  const { logs } = useDailyLearningLogs();
  
  // Get reviewed words only from the current passage (logId)
  const currentReviewedWords = React.useMemo(() => {
    console.log('[WordPreview] Collecting reviewed words for current logId:', logId, 'type:', typeof logId);
    
    if (!logId) {
      console.log('[WordPreview] No logId provided');
      return [];
    }
    
    if (!Array.isArray(logs) || logs.length === 0) {
      console.log('[WordPreview] No logs available or logs is empty');
      return [];
    }
    
    // Convert logId to number for comparison (in case it's a string)
    const logIdNum = typeof logId === 'string' ? parseInt(logId, 10) : logId;
    
    // Find the current log by logId (try both number and string comparison)
    const currentLog = logs.find((log: any) => {
      const logIdMatch = log.id === logIdNum || log.id === logId || String(log.id) === String(logId);
      return logIdMatch;
    }) as any;
    
    console.log('[WordPreview] Searching for log:', {
      searchLogId: logId,
      searchLogIdNum: logIdNum,
      logsCount: logs.length,
      allLogIds: logs.map((l: any) => ({ id: l.id, type: typeof l.id, title: l.english_title }))
    });
    
    if (!currentLog) {
      console.log('[WordPreview] Current log not found for logId:', logId);
      console.log('[WordPreview] Available log IDs:', logs.map((l: any) => l.id));
      return [];
    }
    
    // Check both field names: daily_reviewed_words (expected) and daily_review_words (actual API)
    const reviewedWords = currentLog.daily_reviewed_words || (currentLog as any).daily_review_words;
    
    console.log('[WordPreview] Current log found:', {
      id: currentLog.id,
      englishTitle: currentLog.english_title,
      hasDailyReviewedWords: !!currentLog.daily_reviewed_words,
      hasDailyReviewWords: !!(currentLog as any).daily_review_words,
      reviewedWords: reviewedWords,
      reviewedWordsType: typeof reviewedWords,
      reviewedWordsIsArray: Array.isArray(reviewedWords),
      reviewedWordsLength: reviewedWords?.length || 0,
    });
    
    if (reviewedWords && Array.isArray(reviewedWords) && reviewedWords.length > 0) {
      console.log('[WordPreview] Current log has', reviewedWords.length, 'reviewed words');
      return reviewedWords;
    } else {
      console.log('[WordPreview] Current log has no reviewed words or invalid format');
      return [];
    }
  }, [logId, logs]);

  // Handle English word click
  const handleEnglishWordClick = (wordId: number) => {
    const newSet = new Set(englishExceptions);
    if (englishHidden) {
      // All hidden, click to show this word
      if (newSet.has(wordId)) {
        newSet.delete(wordId); // remove from exceptions, so stays hidden
      } else {
        newSet.add(wordId); // add to exceptions, so show this word
      }
    } else {
      // All shown, click to hide this word
      if (newSet.has(wordId)) {
        newSet.delete(wordId); // remove from exceptions, so stays shown
      } else {
        newSet.add(wordId); // add to exceptions, so hide this word
      }
    }
    setEnglishExceptions(newSet);
  };

  // Handle Chinese word click
  const handleChineseWordClick = (wordId: number) => {
    const newSet = new Set(chineseExceptions);
    if (chineseHidden) {
      // All hidden, click to show this word
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
    } else {
      // All shown, click to hide this word
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
    }
    setChineseExceptions(newSet);
  };

  // Handle global English toggle
  const handleToggleEnglish = () => {
    setEnglishHidden(!englishHidden);
    setEnglishExceptions(new Set()); // clear all exceptions
  };

  // Handle global Chinese toggle
  const handleToggleChinese = () => {
    setChineseHidden(!chineseHidden);
    setChineseExceptions(new Set());
  };

  const handleSoundPress = async (word: string) => {
    if (!word) return;

    try {
      const url = await SpeakApi.getInstance().getSpeechUrl({ word });
      console.log('[WordPreview] 尝试播放语音，URL:', url);

      if (!Audio) {
        try {
          const mod = require('expo-av');
          Audio = mod.Audio;
        } catch (e) {
          console.error('[WordPreview] Failed to load expo-av:', e);
          return;
        }
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error: any) {
      console.error('[WordPreview] 语音播放失败:', error.message || error);
    }
  };

  // Handle start learning button
  const handleStartLearning = () => {
    console.log('[WordPreview] Starting learning for logId:', logId);
    router.push({
      pathname: '/PassageMain',
      params: { sessionId: logId.toString() }
    });
  };

  // Handle back button
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress(); // Use custom back logic if provided
    } else {
      router.back(); // Default: go back
    }
  };

  // Render individual word item with two-column layout
  const renderWordItem = (word: DailyNewWord) => {
    // English show/hide logic
    let shouldShowEnglish;
    if (englishHidden) {
      // All hidden, only show if in exceptions
      shouldShowEnglish = englishExceptions.has(word.id);
    } else {
      // All shown, hide if in exceptions
      shouldShowEnglish = !englishExceptions.has(word.id);
    }
    // Chinese show/hide logic
    let shouldShowChinese;
    if (chineseHidden) {
      shouldShowChinese = chineseExceptions.has(word.id);
    } else {
      shouldShowChinese = !chineseExceptions.has(word.id);
    }

    return (
      <View key={word.id} style={styles.wordItem}>
        {/* English Column */}
        <TouchableOpacity
          style={styles.englishColumn}
          onPress={() => handleEnglishWordClick(word.id)}
        >
          {shouldShowEnglish ? (
            <View style={styles.englishContent}>
              <View style={styles.englishWordRow}>
                <View style={styles.englishTextContainer}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <Text style={styles.phoneticText}>{word.phonetic}</Text>
                </View>
                <TouchableOpacity
                  style={styles.soundButton}
                  onPress={() => handleSoundPress(word.word)}
                >
                  <Ionicons name="volume-high-outline" size={20} color="#FC9B33" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.hiddenEnglishPlaceholder} />
          )}
        </TouchableOpacity>

        {/* Chinese Column */}
        <TouchableOpacity
          style={styles.chineseColumn}
          onPress={() => handleChineseWordClick(word.id)}
        >
          {shouldShowChinese ? (
            <Text style={styles.definitionText}>{word.definition}</Text>
          ) : (
            <View style={styles.hiddenChinesePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Header 
        title="仝文馆"
        showBackButton={true}
        showNotificationButton={false}
        onBackPress={handleBackPress}
      />

      <ScrollView style={styles.scrollView}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Today's new words</Text>
          <Text style={styles.subtitleText}>今日新学单词</Text>
        </View>

        {/* Test Button for Reviewed Words */}
        {__DEV__ && (
          <View style={styles.testSection}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                console.log('[WordPreview] Current reviewed words:', currentReviewedWords);
                console.log('[WordPreview] Reviewed words count:', currentReviewedWords.length);
                setShowReviewedWordsModal(true);
              }}
            >
              <Text style={styles.testButtonText}>
                🧪 Show Reviewed Words ({currentReviewedWords.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Toggle Controls */}
        <View style={styles.toggleSection}>
          <TouchableOpacity
            style={[styles.toggleButton, !englishHidden && styles.toggleButtonActive]}
            onPress={handleToggleEnglish}
          >
            <Text style={[styles.toggleButtonText, !englishHidden && styles.toggleButtonTextActive]}>
              {englishHidden ? '显示英文' : '隐藏英文'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toggleButton, !chineseHidden && styles.toggleButtonActive]}
            onPress={handleToggleChinese}
          >
            <Text style={[styles.toggleButtonText, !chineseHidden && styles.toggleButtonTextActive]}>
              {chineseHidden ? '显示中文' : '隐藏中文'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Words List */}
        <View style={styles.wordsSection}>
          <Text style={styles.wordsSectionTitle}>
            {words.length} new words to learn
          </Text>
          {words.map(renderWordItem)}
        </View>
      </ScrollView>

      {/* Start Learning Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.startLearningButton}
          onPress={handleStartLearning}
        >
          <Text style={styles.startLearningButtonText}>Start Today's Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Reviewed Words Modal */}
      <Modal
        visible={showReviewedWordsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewedWordsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reviewed Words</Text>
              <TouchableOpacity
                onPress={() => setShowReviewedWordsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {currentReviewedWords.length === 0 ? (
                <Text style={styles.emptyText}>No reviewed words found</Text>
              ) : (
                currentReviewedWords.map((word: DailyNewWord) => (
                  <View key={`${word.id}-${word.word}`} style={styles.reviewedWordItem}>
                    <View style={styles.reviewedWordRow}>
                      <View style={styles.reviewedWordTextContainer}>
                        <Text style={styles.reviewedWordText}>{word.word}</Text>
                        <Text style={styles.reviewedPhoneticText}>{word.phonetic}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.soundButton}
                        onPress={() => handleSoundPress(word.word)}
                      >
                        <Ionicons name="volume-high-outline" size={20} color="#FC9B33" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.reviewedDefinitionText}>{word.definition}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  toggleButton: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  toggleButtonTextActive: {
    color: 'white',
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
    marginBottom: height * 0.015,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  englishColumn: {
    flex: 1,
    paddingRight: width * 0.02,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  chineseColumn: {
    flex: 1,
    paddingLeft: width * 0.02,
  },
  englishContent: {
    alignItems: 'center',
    width: '100%',
  },
  englishWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  englishTextContainer: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C1A30',
    marginBottom: height * 0.005,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  phoneticText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  soundButton: {
    padding: 8,
  },
  definitionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },

  hiddenEnglishPlaceholder: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenChinesePlaceholder: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  startLearningButton: {
    backgroundColor: '#FC9B33',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startLearningButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  testSection: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  testButton: {
    backgroundColor: '#FF5722',
    padding: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: height * 0.6,
  },
  reviewedWordItem: {
    padding: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewedWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.01,
  },
  reviewedWordTextContainer: {
    flex: 1,
  },
  reviewedWordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  reviewedPhoneticText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  reviewedDefinitionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  emptyText: {
    padding: width * 0.04,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
}); 
export default WordPreview;