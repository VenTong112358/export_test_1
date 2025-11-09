import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import { DailyNewWord } from '@data/model/WordPreview';
import { SpeakApi } from '@data/api/SpeakApi';
// Defer importing expo-av until needed to avoid runtime crashes with version mismatch
let Audio: any = null;
import { Header } from './Header';


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

  // Handle sound button press
  const handleSoundPress = async (word: string) => {
    if (!word) return;
    
    try {
      // Get access token for authentication
      const httpClient = require('../../data/api/HttpClient').HttpClient.getInstance();
      const token = httpClient.getAccessToken();
      
      // Check if user is authenticated
      if (!token) {
        console.warn('[WordPreview] 用户未登录，无法播放语音');
        // You could show a toast or alert here
        return;
      }
      
      // const url = await SpeakApi.getInstance().getSpeechUrl({ word });
      const url = await SpeakApi.getInstance().getSpeechUrl({ word });
      console.log('[WordPreview] 尝试播放语音，URL:', url);

             // // Use expo-av for native platforms (import dynamically to avoid load-time crashes)
      if (!Audio) {
        try {
          const mod = require('expo-av');
          Audio = mod.Audio;
        } catch (e) {
          console.error('[WordPreview] Failed to load expo-av:', e);
          return;
        }
      }

      // Unload previous sound
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
      // You could show a user-friendly error message here
    }
  };
       // Use expo-av for native platforms (import dynamically to avoid load-time crashes)
        // if (!Audio) {
        //   try {
        //     const mod = require('expo-av');
        //     Audio = mod.Audio;
        //   } catch (e) {
        //     console.error('[WordPreview] Failed to load expo-av:', e);
        //     return;
        //   }
        // }
        //
        // // Unload previous sound
        // if (soundRef.current) {
        //   await soundRef.current.unloadAsync();
        //   soundRef.current = null;
        // }
        //
        // const { sound } = await Audio.Sound.createAsync({ uri: url2 });
        // soundRef.current = sound;
        // await sound.playAsync();
        // sound.setOnPlaybackStatusUpdate((status: any) => {
        //   if (status.isLoaded && status.didJustFinish) {
        //     sound.unloadAsync();
        //   }
        // });
      // if (Platform.OS === 'web') {
        // // Use HTML5 Audio for web platform with enhanced error handling
        // try {
        //   // Add timeout and better error handling
        //   const controller = new AbortController();
        //   const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        //
        //   const response = await fetch(url, {
        //     method: 'GET',
        //     headers: {
        //       'Accept': 'audio/*',
        //       'Cache-Control': 'no-cache',
        //       'Authorization': `Bearer ${token}`
        //     },
        //     signal: controller.signal
        //   });
        //
        //   clearTimeout(timeoutId);
        //
        //   if (!response.ok) {
        //     if (response.status === 401) {
        //       console.error('[WordPreview] 认证失败，请重新登录');
        //       return;
        //     }
        //     if (response.status === 404) {
        //       console.warn('[WordPreview] 语音文件不存在:', word);
        //       return;
        //     }
        //     if (response.status === 403) {
        //       console.error('[WordPreview] 权限不足，无法访问语音服务');
        //       return;
        //     }
        //     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        //   }
        //
        //   const contentType = response.headers.get('content-type');
        //   if (!contentType || !contentType.includes('audio')) {
        //     console.warn('[WordPreview] 返回的不是音频文件，内容类型:', contentType);
        //     return;
        //   }
        //
        //   const audioBlob = await response.blob();
        //   const audioUrl = URL.createObjectURL(audioBlob);
        //   const audio = new (window as any).Audio(audioUrl);
        //
        //   audio.onended = () => {
        //     URL.revokeObjectURL(audioUrl);
        //   };
        //
        //   audio.onerror = (e: any) => {
        //     console.error('[WordPreview] 音频播放错误:', e);
        //     URL.revokeObjectURL(audioUrl);
        //   };
        //
        //   await audio.play();
        //   console.log('[WordPreview] 语音播放成功:', word);
        // } catch (error: any) {
        //   if (error.name === 'AbortError') {
        //     console.warn('[WordPreview] 语音请求超时:', word);
        //   } else if (error.message.includes('net::ERR_FAILED')) {
        //     console.error('[WordPreview] 网络连接失败，请检查网络连接');
        //   } else {
        //     console.error('[WordPreview] Web音频播放失败:', error.message);
        //   }
        // }
      // } else {
        // // Use expo-av for native platforms (import dynamically to avoid load-time crashes)
        // if (!Audio) {
        //   try {
        //     const mod = require('expo-av');
        //     Audio = mod.Audio;
        //   } catch (e) {
        //     console.error('[WordPreview] Failed to load expo-av:', e);
        //     return;
        //   }
        // }
        //
        // // Unload previous sound
        // if (soundRef.current) {
        //   await soundRef.current.unloadAsync();
        //   soundRef.current = null;
        // }
        //
        // const { sound } = await Audio.Sound.createAsync({ uri: url2 });
        // soundRef.current = sound;
        // await sound.playAsync();
        // sound.setOnPlaybackStatusUpdate((status: any) => {
        //   if (status.isLoaded && status.didJustFinish) {
        //     sound.unloadAsync();
        //   }
        // });
      // }
  //   } catch (error: any) {
  //     console.error('[WordPreview] 语音播放失败:', error.message || error);
  //     // You could show a user-friendly error message here
  //   }
  // };

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
}); 
export default WordPreview;