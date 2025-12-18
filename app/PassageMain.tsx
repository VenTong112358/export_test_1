import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
// import { LongPressGestureHandler, State } from 'react-native-gesture-handler'; // 注释掉手势组件引入
import { WordAnalysis } from '@data/api/ArticleApi';
import { FavoriteApi } from '@data/api/FavoriteApi';
import { WordDefinitionApi } from '@data/api/WordDefinitionApi';
import { AppDispatch, RootState } from '@data/repository/store';
import {
  ArticleSegment,
  clearError,
  finishReading,
  generateArticle,
  generateArticleStreamFromLog,
  setCurrentSegmentIndex,
  setDifficulty,
  setSelectedWord,
  setSelectedWords,
  setSessionId,
  translateWord
} from '@data/usecase/ArticleUseCase';
import { updateLogStatus } from '@data/usecase/DailyLearningLogsUseCase';
import { fetchSavedArticles } from '@data/usecase/SavedArticlesUseCase';
import {
  getSentenceExplanationStream,
  getSentenceTranslationStream
} from '@data/usecase/SentenceTranslationUseCase';
import {
  clearCurrentWord,
  searchWord,
  searchWordEnglish,
  setShowModal
} from '@data/usecase/WordSearchUseCase';
import { Audio } from 'expo-av';
import { stemmer } from 'stemmer';
import { SentenceSelectionModal } from './components/SentenceSelectionModal';
import { useDailyLearningLog } from './hooks/useDailyLearningLog';
import { useStreamingHighlighter } from './hooks/useStreamingHighlighter';
// import { ArticleCacheService } from '@data/sqlite/Database';

// Import sentence splitter hook
import { SpeakApi } from '@data/api/SpeakApi';
import { Header } from './components/Header';
import { HeaderReadingControls } from './components/HeaderReadingControls';
import { useStreamingSentenceSplitter } from './hooks/useStreamingSentenceSplitter';
// Defer importing expo-av until needed to avoid runtime crashes with version mismatch
let AudioModule: any = null;
if (Platform.OS !== 'web') {
  AudioModule = require('expo-av').Audio;
}
// import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
// Types
interface PassageMainProps {
  sessionId?: string;
  initialDifficulty?: 'easy' | 'medium' | 'hard';
  onComplete?: () => void;
}

// Route page component for Expo Router
export default function PassageMainRoute() {
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;

  // console.log('[PassageMainRoute] Route params:', params);
  // console.log('[PassageMainRoute] SessionId from params:', sessionId);

  // Add a temporary debug view
  if (!sessionId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>Debug: No sessionId provided</Text>
        <Text style={{ fontSize: 14, color: 'gray' }}>Params: {JSON.stringify(params)}</Text>
      </View>
    );
  }

  return <PassageMainPage sessionId={sessionId} />;
}

const PassageMainPage: React.FC<PassageMainProps> = ({
  sessionId: propSessionId,
  initialDifficulty = 'medium',
  onComplete,
}) => {

  // const { width, height } = Dimensions.get('window');
  // 记录句子的ref
  const sentenceRefs = useRef<{ [id: string]: any }>({});
  // 记录单词的ref
  const wordRefs = useRef<{ [id: string]: any }>({});
  // 记录sound的ref
  const soundRef = useRef<Audio.Sound | null>(null);
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  // Get sessionId from props or route params
  const sessionId = propSessionId || (params.sessionId as string);

  // console.log('[PassageMain] Component props:', { propSessionId, initialDifficulty });
  // console.log('[PassageMain] Route params:', params);
  // console.log('[PassageMain] Final sessionId:', sessionId);

  // Parse logId for fetching daily learning log
  const logId = sessionId ? parseInt(sessionId) : null;
  const { log, newWords } = useDailyLearningLog(logId);



  // Extract word list from newWords for highlighting
  const newWordsList = newWords.map(word => word.word);

  // Debug: Log new words list
  // console.log('[PassageMain] New words list:', newWordsList);
  // console.log('[PassageMain] Raw newWords from hook:', newWords);
  // console.log('[PassageMain] LogId:', logId);

  // Initialize streaming highlighter

  const {
    displayText,
    highlightedSegments,
    onChunk,
    clear: clearHighlighter,
    getPlainText,
    buffer,
    debugWordMatching,
    processTextWithHighlights // Added this line
  } = useStreamingHighlighter(newWordsList);

  // Initialize sentence splitter
  const {
    paragraphs: sentenceParagraphs,
    onChunk: onSentenceChunk,
    clear: clearSentenceSplitter,
    getAllParagraphs,
    markComplete: markSentenceComplete
  } = useStreamingSentenceSplitter();

  // Local state for sentence selection
  const [selectedSentence, setSelectedSentence] = useState<string>('');
  const [showSentenceModal, setShowSentenceModal] = useState(false);
  const [sentenceModalPosition, setSentenceModalPosition] = useState({ x: 0, y: 0, direction: 'down' });
  const [sentenceModalContent, setSentenceModalContent] = useState<string | null>(null);

  // Local state for word re-lookup choice modal
  const [showWordChoiceModal, setShowWordChoiceModal] = useState(false);
  const [wordChoiceModalPosition, setWordChoiceModalPosition] = useState({ x: 0, y: 0, direction: 'down' });
  const [pendingWordAnalysis, setPendingWordAnalysis] = useState<WordAnalysis | null>(null);
  const [pendingUniqueWordKey, setPendingUniqueWordKey] = useState<string | undefined>(undefined);

  // Reading controls state
  const [fontSize, setFontSize] = useState(16);
  const defaultLineHeight = 1.5; // 记住默认值
  const [lineHeight, setLineHeight] = useState(defaultLineHeight);
  const [hasIncreasedLineHeight, setHasIncreasedLineHeight] = useState(false); // 跟踪是否增加过

  // Debug font changes
  useEffect(() => {
    console.log('[PassageMain] Font size changed to:', fontSize);
  }, [fontSize]);

  useEffect(() => {
    console.log('[PassageMain] Line height changed to:', lineHeight);
  }, [lineHeight]);

  // 处理行高变化
  const handleLineHeightChange = (newHeight: number) => {
    // 如果新高度大于默认值，标记为已增加过
    if (newHeight > defaultLineHeight) {
      setHasIncreasedLineHeight(true);
    }
    setLineHeight(newHeight);
  };
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Redux state for saved articles
  const { articles: savedArticles } = useSelector((state: RootState) => state.savedArticles);

  // Ref for abort controller
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  // 单词释义与干扰项弹窗
  const [showWordDefinitionModal, setShowWordDefinitionModal] = useState(false);
  const [wordDefinition, setWordDefinition] = useState<string | null>(null);
  const [wordDefinitionCorrect, setWordDefinitionCorrect] = useState<string | null>(null);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [wordModalPosition, setWordModalPosition] = useState({ x: 0, y: 0, width: 0, height: 0, direction: 'down' });
  const [wordModalLeft, setWordModalLeft] = useState(0);
  const [articleWidth, setArticleWidth] = useState(0);
  const [articleX, setArticleX] = useState(0);

  // Word details for display after correct answer
  const [currentWordText, setCurrentWordText] = useState<string>('');
  const [currentWordPhonetic, setCurrentWordPhonetic] = useState<string>('');
  const [showWordDetails, setShowWordDetails] = useState(false);

  // Debug: Log highlighted segments
  // console.log('[PassageMain] Highlighted segments count:', highlightedSegments.length);
  // console.log('[PassageMain] Display text length:', displayText.length);

  // Redux state
  const {
    segments,
    currentSegmentIndex,
    selectedWord,
    isLoading,
    error,
    difficulty,
    currentContent,
    isGenerating,
    // Streaming generation states
    streamingContent,
    isStreaming,
    streamingError,
    selectedWords
  } = useSelector((state: RootState) => state.article);

  // Debug: Log Redux state changes
  useEffect(() => {
    // Redux state tracking removed
  }, [isLoading, isStreaming, streamingContent?.length, streamingError, error, currentContent?.content?.length]);

  const {
    currentWord,
    definition,
    review,
    isLoading: isWordSearchLoading,
    error: wordSearchError,
    showModal: showWordModal
  } = useSelector((state: RootState) => state.wordSearch);

  const {
    selectedSentence: selectedSentenceFromRedux,
    explanation,
    isLoading: isSentenceLoading,
    error: sentenceError,
    showModal: showSentenceModalFromRedux,
    modalPosition: sentenceModalPositionFromRedux
  } = useSelector((state: RootState) => state.sentenceTranslation);

  // Local state
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showTranslationOverlay, setShowTranslationOverlay] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showSentenceAnalysisModal, setShowSentenceAnalysisModal] = useState(false);
  const [sentenceAnalysisContent, setSentenceAnalysisContent] = useState('');
  // Translation mode state - true for English translation, false for Chinese translation
  const [isEnglishTranslationMode, setIsEnglishTranslationMode] = useState(false);
  // Guess modal animation states
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  // Initialize article from log
  useEffect(() => {
    const initializeArticle = async () => {
      console.log('[PassageMain] Initializing article with sessionId:', sessionId);

      if (!sessionId) {
        console.error('[PassageMain] No sessionId available, cannot initialize article');
        return;
      }

      // Parse sessionId as logId
      const logId = parseInt(sessionId);
      if (isNaN(logId)) {
        console.error('[PassageMain] Invalid sessionId (logId):', sessionId);
        return;
      }

      dispatch(setSessionId(sessionId));

      // Clear highlighter and sentence splitter when starting new article
      clearHighlighter();
      processedLengthRef.current = 0;
      clearSentenceSplitter();

      try {
        // Always generate new article first
        console.log('[PassageMain] Generating new article content for logId:', logId);
        const result = await dispatch(generateArticleStreamFromLog(logId)).unwrap();

        console.log('[PassageMain] Article streaming started successfully:', result);
      } catch (error) {
        console.error('[PassageMain] Failed to start article streaming from log:', error);
      }
    };

    if (sessionId) {
      initializeArticle();
    } else {
      console.warn('[PassageMain] No sessionId provided, skipping article initialization');
    }
    // 页面卸载时清空selectedWords
    return () => {
      dispatch(setSelectedWords([]));
    };
  }, [sessionId, dispatch]);

  // Check if current article is favorited when component mounts or savedArticles change
  useEffect(() => {
    if (logId && savedArticles.length > 0) {
      const isCurrentArticleFavorited = savedArticles.some(article => article.id === logId);
      setIsFavorited(isCurrentArticleFavorited);
      console.log('[PassageMain] Article favorite status checked:', { logId, isCurrentArticleFavorited });
    }
  }, [logId, savedArticles]);

  // Fetch saved articles when component mounts
  useEffect(() => {
    dispatch(fetchSavedArticles());
  }, [dispatch]);

  // Handle streaming content updates
  // useEffect(() => {
  //   if (isStreaming && streamingContent) {
  //     // Process new content chunks for highlighting
  //     const newContent = streamingContent;
  //     const currentLength = displayText.length;
  //
  //     if (newContent.length > currentLength) {
  //       const newChunk = newContent.slice(currentLength);
  //       onChunk(newChunk);
  //       // Also process for sentence splitting
  //       onSentenceChunk(newChunk);
  //     }
  //   } else if (!isStreaming && streamingContent) {
  //     // When streaming is complete, ensure all content is processed
  //     if (displayText !== streamingContent) {
  //       const remainingContent = streamingContent.slice(displayText.length);
  //       if (remainingContent) {
  //         onChunk(remainingContent);
  //         onSentenceChunk(remainingContent);
  //       }
  //     }
  //     // Mark sentence splitting as complete
  //     markSentenceComplete();
  //   }
  // }, [streamingContent, isStreaming, displayText.length, onChunk, onSentenceChunk, markSentenceComplete]);
  // Cursor that always tells us how much we've already processed
  const processedLengthRef = useRef(0);
  // Handle streaming content updates
  useEffect(() => {
    if (!streamingContent) return;

    // Only take the part we haven't handled yet
    const start = processedLengthRef.current;
    const newChunk = streamingContent.slice(start);

    if (newChunk.length) {
      onChunk(newChunk);          // word highlights
      onSentenceChunk(newChunk);  // sentence splitter
      processedLengthRef.current = streamingContent.length;  // advance cursor
    }

    // When the stream has finished, final-ise the splitter
    if (!isStreaming) {
      markSentenceComplete();
    }
  }, [streamingContent, isStreaming]);

  // Handle sentence long press
  const handleSentenceLongPress = useCallback((sentence: string, sentenceId: string) => {
    setSelectedSentence(sentence);
    setShowSentenceModal(true);
    // Calculate modal position
    console.log('[PassageMain] sentenceId', sentenceId);
    const ref = sentenceRefs.current[sentenceId];
    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
          console.warn('[PassageMain] measureInWindow returned NaN, using safe defaults');
          x = 0; y = 0; width = 0; height = 0;
        }
        const GAP = 12;
        const modalMinHeight = 160;
        const windowHeight = Dimensions.get('window').height || 800;
        const direction: 'down' | 'up' = (y < windowHeight / 2) ? 'down' : 'up';

        setSentenceModalPosition({
          x: x + width / 2,
          y: direction === 'down'
            ? y + height + GAP
            : y - modalMinHeight - GAP,
          direction,
        });
      });
    }
  }, []);

  // Handle sentence translation
  const handleSentenceTranslate = useCallback(async (sentence: string) => {
    if (!logId) return;

    // Cancel any ongoing request
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    currentAbortControllerRef.current = abortController;

    try {
      // Start with empty content to show loading state
      setSentenceModalContent('');

      const result = await dispatch(getSentenceTranslationStream({
        category: 'phrase',
        request: {
          content: sentence
        },
        onChunk: (chunk: string) => {
          // Update content with each chunk received
          setSentenceModalContent(prev => prev + chunk);
        },
        abortController
      })).unwrap();
      console.log('[PassageMain] Sentence translation completed', result);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[PassageMain] Sentence translation cancelled - switching to new action');
      } else {
        console.error('[PassageMain] Sentence translation failed:', error);
      }
    }
  }, [logId, dispatch]);

  // Handle sentence analyze
  const handleSentenceAnalyze = useCallback(async (sentence: string) => {
    if (!logId) return;

    // Cancel any ongoing request
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    currentAbortControllerRef.current = abortController;

    try {
      // Start with empty content to show loading state
      setSentenceModalContent('');

      const result = await dispatch(getSentenceExplanationStream({
        userId: logId,
        request: {
          content: sentence,
          translation: ''
        },
        onChunk: (chunk: string) => {
          // Update content with each chunk received
          setSentenceModalContent(prev => prev + chunk);
        },
        abortController
      })).unwrap();
      console.log('[PassageMain] Sentence analysis completed', result);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[PassageMain] Sentence analysis cancelled - switching to new action');
      } else {
        console.error('[PassageMain] Sentence analysis failed:', error);
      }
    }
  }, [logId, dispatch]);

  // Handle sentence copy
  const handleSentenceCopy = useCallback(() => {
    // console.log('[PassageMain] Sentence copy pressed');
    // TODO: Implement sentence copy
  }, []);

  // Handle sentence favorite
  const handleSentenceFavorite = useCallback(() => {
    // console.log('[PassageMain] Sentence favorite pressed');
    // TODO: Implement sentence favorite
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async () => {
    // 添加 logId 的 null 检查
    if (!logId) {
      console.error('LogId is null, cannot toggle favorite');
      Alert.alert('错误', '文章ID无效，无法执行收藏操作');
      return;
    }

    // 立即更新UI状态，提供即时反馈
    const previousState = isFavorited;
    const newState = !isFavorited;
    setIsFavorited(newState);
    console.log('[PassageMain] Favorite status immediately updated to:', newState ? 'favorited' : 'unfavorited');

    // 在后台调用API
    try {
      let response;
      if (previousState) {
        response = await FavoriteApi.unsaveArticle(logId.toString());
      } else {
        response = await FavoriteApi.saveArticle(logId.toString());
      }

      // 验证API响应，如果不一致则修正状态
      if (response && typeof response.save_status === 'number') {
        const apiState = response.save_status === 1;
        if (apiState !== newState) {
          console.warn('[PassageMain] API response differs from UI state, correcting...');
          setIsFavorited(apiState);
        }
        console.log('[PassageMain] API confirmed favorite status:', apiState ? 'favorited' : 'unfavorited');
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      // API失败时回滚到之前的状态
      setIsFavorited(previousState);
      Alert.alert('错误', '操作失败，请重试');
    }
  }, [isFavorited, logId]);

  // Handle translation mode toggle
  const handleTranslationToggle = useCallback(() => {
    console.log('[PassageMain] Translation mode toggle clicked, current mode:', isEnglishTranslationMode ? 'English' : 'Chinese');
    const newMode = !isEnglishTranslationMode;
    setIsEnglishTranslationMode(newMode);
    console.log('[PassageMain] Translation mode switched to:', newMode ? 'English' : 'Chinese');
  }, [isEnglishTranslationMode]);

  // Handle sentence modal close
  const handleSentenceModalClose = useCallback(() => {
    setShowSentenceModal(false);
    setSelectedSentence('');
    setSentenceModalContent(null);
  }, []);

  // Handle word choice modal actions
  const handleWordChoiceModalClose = useCallback(() => {
    setShowWordChoiceModal(false);
    setPendingWordAnalysis(null);
    setPendingUniqueWordKey(undefined);
  }, []);

  const handleRemoveWordHighlight = useCallback(() => {
    if (pendingWordAnalysis) {
      // Remove word from selectedWords to unhighlight it
      const updatedSelectedWords = selectedWords.filter(w => w.text !== pendingWordAnalysis.text);
      dispatch(setSelectedWords(updatedSelectedWords));
    }
    handleWordChoiceModalClose();
  }, [pendingWordAnalysis, selectedWords, dispatch, handleWordChoiceModalClose]);

  const handleLookupWordAgain = useCallback(async () => {
    if (pendingWordAnalysis && logId) {
      // Close choice modal first
      handleWordChoiceModalClose();

      // Restore original word selection logic
      await dispatch(setSelectedWord(pendingWordAnalysis));

      // Call the word search API again based on translation mode
      if (isEnglishTranslationMode) {
        dispatch(searchWordEnglish({ logId, word: pendingWordAnalysis.text }));
      } else {
        dispatch(searchWord({ logId, word: pendingWordAnalysis.text }));
      }

      // Show the word modal
      dispatch(setShowModal(true));
    }
  }, [pendingWordAnalysis, logId, dispatch, handleWordChoiceModalClose, isEnglishTranslationMode]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (logId) {
      dispatch(generateArticleStreamFromLog(logId));
    }
  }, [logId, dispatch]);

  // Handle difficulty feedback
  const handleDifficultyFeedback = useCallback(async (feedback: 'easy' | 'medium' | 'hard') => {
    // Adjust difficulty based on user feedback
    let newDifficulty = difficulty;
    if (feedback === 'easy' && difficulty !== 'hard') {
      newDifficulty = difficulty === 'medium' ? 'hard' : 'medium';
    } else if (feedback === 'hard' && difficulty !== 'easy') {
      newDifficulty = difficulty === 'medium' ? 'easy' : 'medium';
    }

    dispatch(setDifficulty(newDifficulty));

    // Generate new article segment
    try {
      await dispatch(generateArticle({
        difficulty: newDifficulty,
        length: 'medium',
        language: 'en'
      })).unwrap();

      dispatch(setCurrentSegmentIndex(currentSegmentIndex + 1));
    } catch (error) {
      console.error('Failed to generate new article:', error);
    }
  }, [difficulty, currentSegmentIndex, dispatch]);

  const isWordQueried = (word: string) => {
    return selectedWords.some(w => w.text.toLowerCase() === word.toLowerCase());
  };
  const handleWordPress = useCallback(async (wordAnalysis: WordAnalysis, uniqueWordKey?: string) => {
    // Check if word has already been queried
    const isAlreadyQueried = selectedWords.some(w => w.text === wordAnalysis.text);

    if (isAlreadyQueried) {
      // Show choice modal for already queried words
      setPendingWordAnalysis(wordAnalysis);
      setPendingUniqueWordKey(uniqueWordKey);

      const ref = wordRefs.current[uniqueWordKey || wordAnalysis.text];
      if (ref && ref.measureInWindow) {
        // inside handleWordPress -> isAlreadyQueried branch
        ref.measureInWindow((x: number, y: number, width: number, height: number) => {
          const safe = (n: number, fb = 0) => Number.isFinite(n) ? n : fb;
          x = safe(x); y = safe(y); width = safe(width); height = safe(height);

          const GAP = 8, modalH = 100;
          const win = Dimensions.get('window');
          const direction: 'down' | 'up' = y < win.height / 2 ? 'down' : 'up';

          let yPos = direction === 'down' ? y + height + GAP : y - modalH - GAP;
          if (!Number.isFinite(yPos)) yPos = win.height / 2 - modalH / 2;

          setWordChoiceModalPosition({
            x: safe(x + width / 2, win.width / 2),
            y: yPos,
            direction,
          });
          setShowWordChoiceModal(true);
        });

        // ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        //   const GAP = 8;
        //   const modalHeight = 100;
        //   const windowHeight = Dimensions.get('window').height || 800;
        //   const windowWidth = Dimensions.get('window').width || 400;
        //
        //   const direction: 'down' | 'up' = (y < windowHeight / 2) ? 'down' : 'up';
        //
        //   setWordChoiceModalPosition({
        //     x: x + width / 2,
        //     y: direction === 'down' ? y + height + GAP : y - modalHeight - GAP,
        //     direction,
        //   });
        //   setShowWordChoiceModal(true);
        // });
      } else {
        // Fallback position
        setWordChoiceModalPosition({
          x: Dimensions.get('window').width / 2,
          y: Dimensions.get('window').height / 2,
          direction: 'down',
        });
        setShowWordChoiceModal(true);
      }
      return;
    }

    // Restore original word selection logic
    await dispatch(setSelectedWord(wordAnalysis));

    // Call the word search API for new words based on translation mode
    if (logId) {
      if (isEnglishTranslationMode) {
        dispatch(searchWordEnglish({ logId, word: wordAnalysis.text }));
      } else {
        dispatch(searchWord({ logId, word: wordAnalysis.text }));
      }
    }

    const ref = wordRefs.current[uniqueWordKey || wordAnalysis.text];

    // Debug: Log what key we're looking for
    console.log('[WordPress] Looking for ref with key:', {
      uniqueWordKey,
      fallbackKey: wordAnalysis.text,
      finalKey: uniqueWordKey || wordAnalysis.text,
      refExists: !!ref,
      allRefs: Object.keys(wordRefs.current).slice(0, 5) // Show first 5 keys
    });

    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
          console.warn('[WordPress] measureInWindow NaN, using fallback');
          x = Dimensions.get('window').width / 2;
          y = Dimensions.get('window').height / 2;
          width = 0; height = 0;
        }
        console.log('[WordPress] Position:', {
          word: wordAnalysis.text,
          x, y, width, height,
          windowWidth: Dimensions.get('window').width,
          windowHeight: Dimensions.get('window').height
        });

        // Calculate modal direction - default to above word
        const GAP = 8;
        const modalHeight = 120; // Modal height
        const modalWidth = Math.min(articleWidth, 300); // Modal width
          const windowHeight = Dimensions.get('window').height || 800;
          const windowWidth = Dimensions.get('window').width || 400;

        // Validate position validity
        if (x < 0 || y < 0 || x > windowWidth || y > windowHeight) {
          console.warn('[WordPress] Invalid position, using fallback');
          // Use screen center as fallback
          setWordModalLeft((windowWidth - modalWidth) / 2);
          setWordModalPosition({
            x: windowWidth / 2,
            y: windowHeight / 2 - 60,
            width: 0,
            height: 0,
            direction: 'down',
          });
          dispatch(setShowModal(true));
          return;
        }

        // Special check for last paragraph issues - more lenient check
        if (y === 0 || height === 0 || y > windowHeight - 150) {
          console.warn('[WordPress] Last paragraph issue for word:', wordAnalysis.text);
          // For last paragraph, use a fixed position near screen bottom
          const modalWidth = Math.min(articleWidth, 300);
          const modalHeight = 120;

          // Calculate horizontal position based on word position in text
          // For last paragraph, center the modal horizontally
          const modalLeft = (windowWidth - modalWidth) / 2;

          // Use a fixed position near screen bottom with good spacing
          const modalY = windowHeight - modalHeight - 200; // 200px from bottom

          setWordModalLeft(modalLeft);
          setWordModalPosition({
            x: windowWidth / 2, // Center horizontally
            y: modalY,
            width: 0,
            height: 0,
            direction: 'up',
          });
          dispatch(setShowModal(true));
          return;
        }

        // Calculate modal horizontal position, ensure it doesn't exceed screen boundaries
        let modalLeft = x + width / 2 - modalWidth / 2;
        const safeHorizontalMargin = 40; // Increased horizontal safe margin to 40px
        if (modalLeft < safeHorizontalMargin) modalLeft = safeHorizontalMargin;
        if (modalLeft + modalWidth > windowWidth - safeHorizontalMargin) {
          modalLeft = windowWidth - modalWidth - safeHorizontalMargin;
        }

        // Improved vertical position calculation logic
        const safeTopMargin = 60;
        const safeBottomMargin = 60;
        const direction: 'down' | 'up' = y < windowHeight / 2 ? 'down' : 'up';
        let modalY = direction === 'down' ? y + height + GAP : y - modalHeight - GAP;

        // Ensure modal doesn't exceed screen boundaries
        if (modalY < safeTopMargin) {
          modalY = safeTopMargin;
        }
        if (modalY + modalHeight > windowHeight - safeBottomMargin) {
          modalY = windowHeight - modalHeight - safeBottomMargin;
        }

        setWordModalLeft(modalLeft); // Save calculated position
        setWordModalPosition({
          x: x + width / 2,
          y: modalY,
          width,
          height,
          direction,
        });
        dispatch(setShowModal(true));
      });
    } else {
      // Improved fallback - use screen center if ref is not available
      console.log('[WordPress] Ref not available, using fallback position');
      const windowHeight = Dimensions.get('window').height;
      const windowWidth = Dimensions.get('window').width;
      const modalWidth = Math.min(articleWidth, 300);

      setWordModalLeft((windowWidth - modalWidth) / 2);
      setWordModalPosition({
        x: windowWidth / 2,
        y: windowHeight / 2 - 60,
        width: 0,
        height: 0,
        direction: 'down',
      });
      dispatch(setShowModal(true));
    }

    // Only show guess modal for unlearned words, let the API handle the lookup modal
    if (wordAnalysis.type === 'unlearned') {
      setShowGuessModal(true);
    }
  }, [dispatch, logId, selectedWords, articleWidth, isEnglishTranslationMode]);

  const handleWordDefinition = useCallback(async (word: string, uniqueWordKey?: string) => {
    // Reset modal state immediately
    setWordDefinition(null);
    setWordOptions([]);
    setWordDefinitionCorrect(null);
    setShowCorrectAnswer(false);
    setShowCheckmark(false);
    setShowWordDetails(false);
    setCurrentWordText('');
    setCurrentWordPhonetic('');
    checkmarkScale.setValue(0);

    // Enhanced word matching using Porter Stemmer
    const findMatchingWord = (targetWord: string) => {
      const cleanTargetWord = targetWord.toLowerCase().replace(/[^\w]/g, '');
      const targetStem = stemmer(cleanTargetWord);
      // console.log('[WordDefinition] Target word:', cleanTargetWord, 'Stem:', targetStem);
      for (const newWord of newWords) {
        const cleanNewWord = newWord.word.toLowerCase().replace(/[^\w]/g, '');
        // console.log('[WordDefinition] Comparing with:', cleanNewWord);
        if (cleanTargetWord === cleanNewWord) {
          // console.log('[WordDefinition] Exact match found');
          return newWord;
        }
        const newWordStem = stemmer(cleanNewWord);
        if (targetStem === newWordStem && targetStem.length > 2) {
          // console.log('[WordDefinition] Stem match found');
          return newWord;
        }
        if (cleanTargetWord.startsWith(newWordStem) || newWordStem.startsWith(targetStem)) {
          // console.log('[WordDefinition] Prefix match found');
          return newWord;
        }
      }
      return null;
    };

    const matchedWord = findMatchingWord(word);

    if (!matchedWord) {
      console.log('[WordDefinition] No matching word found for:', word);
      Alert.alert('Word not found in vocabulary list');
      return;
    }

    try {
      console.log('[WordDefinition] Found matching word:', matchedWord);
      const wordDefinitionApi = WordDefinitionApi.getInstance();
      const wordDefinitionData = await wordDefinitionApi.getDefinitionAndDistractors(matchedWord.id.toString());
      console.log('[WordDefinition] API response:', wordDefinitionData);

      if (!wordDefinitionData || !wordDefinitionData.definition || !Array.isArray(wordDefinitionData.distractors)) {
        console.error('[WordDefinition] Invalid API response structure:', wordDefinitionData);
        Alert.alert('Failed to load word definition due to invalid data.');
        return;
      }

      // Prepare quiz content
      setCurrentWordText(matchedWord.word);
      setCurrentWordPhonetic(matchedWord.phonetic || '');
      const correctAnswer = wordDefinitionData.definition;
      setWordDefinition(correctAnswer);

      const options = [...wordDefinitionData.distractors];
      const randomIndex = Math.floor(Math.random() * (options.length + 1));
      options.splice(randomIndex, 0, correctAnswer);
      setWordOptions(options);

      // Get position and show modal
      const ref = wordRefs.current[uniqueWordKey || word];
      if (ref && ref.measureInWindow) {
        ref.measureInWindow((x: number, y: number, width: number, height: number) => {
          let safeX = x, safeY = y, safeWidth = width, safeHeight = height;
          console.log('[WordDefinition] safeX:', safeX, 'safeY:', safeY, 'safeWidth:', safeWidth, 'safeHeight:', safeHeight);
          if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
            console.warn('[WordDefinition] measureInWindow NaN, using fallback');
            const { width: wWidth, height: wHeight } = Dimensions.get('window');
            safeX = wWidth / 2;
            safeY = wHeight / 2;
            safeWidth = 0;
            safeHeight = 0;
          }

          const GAP = 4;
          const modalHeight = 30;
          const windowHeight = Dimensions.get('window').height;

          let modalY: number;
          let direction: 'down' | 'up';
            // Fix condition: only trigger for words truly near bottom or with invalid measurements
          const isNearBottom = safeY + safeHeight > windowHeight - 50; // Only if word is within 50px of bottom
          const hasInvalidMeasurements = safeY === 0 || safeHeight === 0;

          if (hasInvalidMeasurements || isNearBottom) {
            // Only show warning for words actually near bottom
            if (isNearBottom && !hasInvalidMeasurements) {
              console.warn('[WordDefinition] Word near bottom of screen:', word, 'safeY:', safeY, 'windowHeight:', windowHeight);
            }
            // Use fallback position for invalid measurements
            if (hasInvalidMeasurements) {
              modalY = windowHeight / 2 - modalHeight / 2;
            } else {
              modalY = safeY - modalHeight - GAP; // Position above word
            }
            direction = 'up';
            console.log('[WordDefinition] direction:', direction, 'modalY:', modalY);
          } else {
            // Default to 'down' for all other cases, positioned directly below word
            direction = 'down';
            modalY = safeY + safeHeight + GAP; // Position directly below word with minimal gap

            // Only adjust if absolutely necessary to stay on screen
            const safeBottomMargin = 10; // Minimal bottom margin
            console.log('[WordDefinition] direction:', direction, 'modalY:', modalY);
          }

          setWordModalPosition({
            x: safeX + safeWidth / 2,
            y: modalY,
            width: safeWidth,
            height: safeHeight,
            direction,
          });

          setShowWordDefinitionModal(true);
        });
      } else {
        console.log('[WordDefinition] Ref not available, using fallback');
        const { width: wWidth, height: wHeight } = Dimensions.get('window');
        setWordModalPosition({
          x: wWidth / 2,
          y: wHeight / 2 - 100,
          width: 0,
          height: 0,
          direction: 'down',
        });
        setShowWordDefinitionModal(true);
      }
    } catch (error) {
      console.log('[WordDefinition] API error:', error);
      Alert.alert('Failed to load word definition');
    }
  }, [newWords, checkmarkScale, setWordModalPosition, setShowWordDefinitionModal, setWordDefinition, setWordOptions, setWordDefinitionCorrect, setShowCorrectAnswer, setShowCheckmark, setShowWordDetails, setCurrentWordText, setCurrentWordPhonetic]);

  const handleLongPress = useCallback((text: string) => {
    setSelectedText(text);
    setShowTranslationOverlay(true);

    // Call translation API
    dispatch(translateWord({
      text,
      from: 'en',
      to: 'zh'
    }));
  }, [dispatch]);

  const handleBackPress = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/MainPage');
    }
  };

  const handleFinishReading = async () => {
    if (!logId) return;

    try {
      // Call finish reading API without waiting for it to complete
      dispatch(updateLogStatus({ logId, status: 'learned' }));
      console.log('[PassageMain] handleFinishReading log+++++++++++++++++++++++++++++', logId);

      // Don't await the finishReading dispatch to avoid triggering isLoading
      dispatch(finishReading(logId));

      // Navigate immediately without waiting for API response
      router.push(`/article-rate?logId=${logId}`);
    } catch (error) {
      console.error('Failed to finish reading:', error);
      // Still navigate even if API fails
      router.push(`/article-rate?logId=${logId}`);
    }
  };

  const handleWordModalClose = () => {
    dispatch(setShowModal(false));
    dispatch(clearCurrentWord());
  };

  // Handle correct answer selection in guess modal
  const handleCorrectAnswer = () => {
    setShowCorrectAnswer(true);
    setShowCheckmark(true);

    // Animate checkmark scale from 0 to 1
    Animated.spring(checkmarkScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Hide text and show checkmark for 1 second, then close modal
    setTimeout(() => {
      setShowGuessModal(false);
      setShowCorrectAnswer(false);
      setShowCheckmark(false);
      checkmarkScale.setValue(0); // Reset animation
    }, 1000);
  };

  const handleFavoritePress = () => {
    // TODO: Implement favorite functionality
    // console.log('Favorite pressed for word:', currentWord);
  };

  // const handleSoundPress = async (word?: string) => {
  //   const targetWord = word || selectedWord?.text || currentWord || '';
  //   if (!targetWord) return;
  //
  //   try {
  //     // Get access token for authentication
  //     const httpClient = require('../../data/api/HttpClient').HttpClient.getInstance();
  //     const token = httpClient.getAccessToken();
  //
  //     // Check if user is authenticated
  //     if (!token) {
  //       console.warn('[PassageMain] 用户未登录，无法播放语音');
  //       return;
  //     }
  //
  //     const url = await SpeakApi.getInstance().getSpeechUrl({ word: targetWord });
  //     // const url2 = await SpeakApi.getInstance().getSpeechUrl2({ word: targetWord });
  //     console.log('[PassageMain] 尝试播放语音，URL:', url);
  //
  //     if (Platform.OS === 'web') {
  //       // Use HTML5 Audio for web platform with enhanced error handling
  //       try {
  //         // Add timeout and better error handling
  //         const controller = new AbortController();
  //         const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  //
  //         const response = await fetch(url, {
  //           method: 'GET',
  //           headers: {
  //             'Accept': 'audio/*',
  //             'Cache-Control': 'no-cache',
  //             'Authorization': `Bearer ${token}`
  //           },
  //           signal: controller.signal
  //         });
  //
  //         clearTimeout(timeoutId);
  //
  //         if (!response.ok) {
  //           if (response.status === 401) {
  //             console.error('[PassageMain] 认证失败，请重新登录');
  //             return;
  //           }
  //           if (response.status === 404) {
  //             console.warn('[PassageMain] 语音文件不存在:', targetWord);
  //             return;
  //           }
  //           if (response.status === 403) {
  //             console.error('[PassageMain] 权限不足，无法访问语音服务');
  //             return;
  //           }
  //           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //         }
  //
  //         const contentType = response.headers.get('content-type');
  //         if (!contentType || !contentType.includes('audio')) {
  //           console.warn('[PassageMain] 返回的不是音频文件，内容类型:', contentType);
  //           return;
  //         }
  //
  //         const audioBlob = await response.blob();
  //         const audioUrl = URL.createObjectURL(audioBlob);
  //         const audio = new (window as any).Audio(audioUrl);
  //
  //         audio.onended = () => {
  //           URL.revokeObjectURL(audioUrl);
  //         };
  //
  //         audio.onerror = (e: any) => {
  //           console.error('[PassageMain] 音频播放错误:', e);
  //           URL.revokeObjectURL(audioUrl);
  //         };
  //
  //         await audio.play();
  //         console.log('[PassageMain] 语音播放成功:', targetWord);
  //       } catch (error: any) {
  //         if (error.name === 'AbortError') {
  //           console.warn('[PassageMain] 语音请求超时:', targetWord);
  //         } else if (error.message.includes('net::ERR_FAILED')) {
  //           console.error('[PassageMain] 网络连接失败，请检查网络连接');
  //         } else {
  //           console.error('[PassageMain] Web音频播放失败:', error.message);
  //         }
  //       }
  //     } else {
  //       // Use expo-av for native platforms
  //       // 卸载上一个 sound
  //       if (soundRef.current) {
  //         await soundRef.current.unloadAsync();
  //         soundRef.current = null;
  //       }
  //
  //       const { sound } = await AudioModule.Sound.createAsync({ uri: url });
  //       soundRef.current = sound;
  //       await sound.playAsync();
  //       sound.setOnPlaybackStatusUpdate((status: any) => {
  //         if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
  //           sound.unloadAsync();
  //         }
  //       });
  //     }
  //   } catch (error: any) {
  //     console.error('[PassageMain] 语音播放失败:', error.message || error);
  //   }
  // };
  const handleSoundPress = async (word?: string) => {
  // const handleSoundPress = async (word?: string) => {
    const targetWord = word || selectedWord?.text || currentWord || '';
    if (!targetWord) return;

    try {
      // Get access token for authentication
      const httpClient = require('../data/api/HttpClient').HttpClient.getInstance();

      const token = httpClient.getAccessToken();

      // Check if user is authenticated
      if (!token) {
        console.warn('[WordPreview] 用户未登录，无法播放语音');
        // You could show a toast or alert here
        return;
      }

      // const url = await SpeakApi.getInstance().getSpeechUrl({ word });
      const url = await SpeakApi.getInstance().getSpeechUrl({ word: targetWord });
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

  // Debug function to check word matching
  const handleDebugWordMatching = useCallback(() => {
    debugWordMatching();
  }, [debugWordMatching]);

  // Function to render highlighted text using streaming highlighter
  // replace your current renderHighlightedText with this
  const renderHighlightedText = () => {
    const segments = processTextWithHighlights(displayText);

    return (
      <Text style={[styles.articleText, { fontSize, lineHeight: lineHeight * fontSize, width: '100%' }]}>
        {segments.map((segment, i) => {
          const clean = segment.text.replace(/[^\w]/g, '').toLowerCase();
          const key = `stream-${clean}-${i}`;
          return (
            <Text
              key={key}
              ref={r => { wordRefs.current[key] = r; }}
              style={[
                styles.sentenceText,
                { fontSize, lineHeight: lineHeight * fontSize },
                segment.isHighlighted && styles.streamingWordHighlight,
                isWordQueried(segment.text) && styles.queriedWordUnderline,
              ]}
              onPress={() => {
                if (!/^[a-zA-Z]+$/.test(clean)) return;
                const wa = { text: clean, type: 'known', difficulty: 'medium', frequency: 1 } as WordAnalysis;
                segment.isHighlighted
                  ? handleWordDefinition(segment.text, key)
                  : handleWordPress(wa, key);
              }}
            >
              {segment.text}
            </Text>
          );
        })}
      </Text>
    );
  };


  // Function to render unified content with both word highlighting and sentence splitting
  const renderUnifiedContent = () => {
    const allParagraphs = getAllParagraphs();

    // Create a Set to deduplicate sentences and avoid rendering duplicates
    const seen = new Set();
    // For each paragraph, filter out unique sentences
    const uniqueParagraphs = allParagraphs.map(paragraph => {
      const uniqueSentences = paragraph.sentences.filter(sentence => {
        if (seen.has(sentence.text)) return false;
        seen.add(sentence.text);
        return true;
      });
      return { ...paragraph, sentences: uniqueSentences };
    }).filter(paragraph => paragraph.sentences.length > 0);

    // If we have sentence paragraphs, render them with word highlighting
    if (uniqueParagraphs.length > 0) {
      return uniqueParagraphs.map((paragraph) => (
        <View key={paragraph.id} style={styles.paragraphContainer}>
          {paragraph.sentences.map((sentence) => (
            <MemoizedSentence
              key={sentence.id}
              sentence={sentence}
              selectedSentence={selectedSentence}
              renderHighlightedTextInSentence={renderHighlightedTextInSentence}
              sentenceRefs={sentenceRefs}
              fontSize={fontSize}
              lineHeight={lineHeight}
            />
          ))}
        </View>
      ));
    }

    console.log('[PassageMain] No sentence paragraphs, using fallback rendering');
    // Fallback to regular highlighted text if no sentences yet
    return renderHighlightedText();
  };

  // Function to render highlighted text within a sentence
  const renderHighlightedTextInSentence = (sentenceText: string, sentenceId: string) => {
    // Directly perform highlight splitting for the sentence
    const sentenceSegments = processTextWithHighlights(sentenceText);

    return sentenceSegments.map((segment, index) => {
      // Clean the word text to match the key used in handleWordPress
      const cleanWord = segment.text.replace(/[^\w]/g, '').toLowerCase();
      const wordKey = cleanWord || segment.text; // Use cleaned word as key, fallback to original text

      // Create unique key for each word occurrence to avoid conflicts
      const uniqueWordKey = `${wordKey}-${sentenceText}-${index}`;



      return (
        <Text
          key={`${sentenceText}-${segment.text}-${index}`} // 使用更唯一的key
          ref={ref => {
            wordRefs.current[uniqueWordKey] = ref; // 使用唯一key存储ref
          }}
          style={[
            styles.sentenceText,
            { fontSize, lineHeight: lineHeight * fontSize },
            segment.isHighlighted && styles.streamingWordHighlight,
            isWordQueried(segment.text) && styles.queriedWordUnderline
          ]}
          onPress={() => {
            if (!segment.isHighlighted) {
              if (cleanWord.length > 0 && /^[a-zA-Z]+$/.test(cleanWord)) {
                const wordAnalysis: WordAnalysis = {
                  text: cleanWord,
                  type: 'known',
                  difficulty: 'medium',
                  frequency: 1
                };
                // Pass the unique key to handleWordPress
                handleWordPress(wordAnalysis, uniqueWordKey);
              }
            } else {
              console.log('[PassageMain] segment.text', segment.text);
              // Pass the unique key to handleWordDefinition
              handleWordDefinition(segment.text, uniqueWordKey);
            }
          }}
          onLongPress={() => handleSentenceLongPress(sentenceText, sentenceId)}
          delayLongPress={800}
        >
          {segment.text}
        </Text>
      );
    });
  };



  // Render word component
  const renderWord = (word: WordAnalysis) => (
    <TouchableOpacity
      key={word.text}
      style={styles.wordContainer}
      onPress={() => handleWordPress(word)}
    >
      <Text style={styles.wordText}>{word.text}</Text>
    </TouchableOpacity>
  );

  // Render segment component
  const renderSegment = (segment: ArticleSegment, index: number) => (
    <View key={segment.id} style={styles.segmentContainer}>
      <Text style={styles.segmentText}>{segment.content}</Text>
      {segment.words.length > 0 && (
        <View style={styles.wordsContainer}>
          {segment.words.map(renderWord)}
        </View>
      )}
    </View>
  );

  // Show error state
  if (error || streamingError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="仝文馆"
          showBackButton={true}
          showNotificationButton={false}
          onBackPress={handleBackPress}
        />

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error || streamingError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(clearError())}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Display streaming content or complete content
  const displayContent: string = isStreaming ? (streamingContent || '') : (currentContent?.content || '');

  if (!displayContent && !isStreaming) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="仝文馆"
          showBackButton={true}
          showNotificationButton={false}
          onBackPress={handleBackPress}
        />

        <View style={styles.loadingContainer}>
          <Text>No article content available</Text>
          <Text style={{ fontSize: 12, color: 'gray', marginTop: 10 }}>
            Debug: sessionId={sessionId}, logId={logId}
          </Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>
            isStreaming={isStreaming.toString()}, error={error}
          </Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>
            streamingContent length: {streamingContent?.length || 0}
          </Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>
            currentContent length: {currentContent?.content?.length || 0}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with embedded reading controls */}
      <Header
        title="仝文馆"
        showBackButton={true}
        showNotificationButton={false}
        onBackPress={handleBackPress}
        customRightComponent={
          <HeaderReadingControls
            fontSize={fontSize}
            lineHeight={lineHeight}
            defaultLineHeight={defaultLineHeight}
            hasIncreasedLineHeight={hasIncreasedLineHeight}
            showTranslation={showTranslation}
            isFavorited={isFavorited}
            logId={logId?.toString() || sessionId}
            onFontSizeChange={setFontSize}
            onLineHeightChange={handleLineHeightChange}
            onTranslationToggle={handleTranslationToggle}
            onFavoriteToggle={handleFavoriteToggle}
          />
        }
      />

      {/* Article Content */}
      <View style={styles.articleContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>正在生成文章...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>生成失败: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.articleScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.articleContentContainer}
            bounces={true}
            onLayout={(event) => {
              const { width, x } = event.nativeEvent.layout;
              setArticleWidth(width);
              setArticleX(x);
            }}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.articleTitle}>{log?.english_title || 'Article'}</Text>
              <Text style={styles.articleSubtitle}>{log?.chinese_title || ''}</Text>
              <View style={styles.titleSeparator} />
              <Text style={styles.aiGeneratedLabel}>(AI生成)</Text>
            </View>

            {/* Article Content - 根据showTranslation状态显示原文或翻译 */}
            <View style={styles.articleTextContainer}>
              {showTranslation && translatedContent ? (
                <Text style={[styles.articleContent, { fontSize, lineHeight: lineHeight * fontSize }]}>
                  {translatedContent}
                </Text>
              ) : (
                renderUnifiedContent()
              )}

              {/* 翻译加载指示器 */}
              {isTranslating && (
                <View style={styles.translationLoadingContainer}>
                  <Text style={styles.translationLoadingText}>正在翻译...</Text>
                </View>
              )}
            </View>

            {/* Debug info
            {__DEV__ && (
              <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginTop: 10 }}>
                <Text>Debug: displayText.length = {displayText.length}</Text>
                <Text>Debug: isStreaming = {isStreaming.toString()}</Text>
                <Text>Debug: streamingContent.length = {streamingContent?.length || 0}</Text>
                <Text>Debug: highlightedSegments.length = {highlightedSegments.length}</Text>
                <Text>Debug: sentenceParagraphs.length = {sentenceParagraphs.length}</Text>
              </View>
            )} */}

            {/* Show streaming indicator if still generating */}
            {isStreaming && (
              <View style={styles.streamingIndicator}>
                <Text style={styles.streamingText}>正在生成...</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* 移除独立的 ReadingControlsButton */}
      {/*
      <ReadingControlsButton
        fontSize={fontSize}
        lineHeight={lineHeight}
        showTranslation={showTranslation}
        isFavorited={isFavorited}
        logId={sessionId}
        onFontSizeChange={setFontSize}
        onLineHeightChange={setLineHeight}
        onTranslationToggle={handleTranslationToggle}
        onFavoriteToggle={handleFavoriteToggle}
      />
      */}

      {/* Complete Learning Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleFinishReading}
        >
          <Text style={styles.completeButtonText}>完成阅读</Text>
        </TouchableOpacity>
      </View>



      {/* Word Lookup Modal */}
      <Modal
        visible={showWordModal}
        transparent
        animationType="fade"
        onRequestClose={handleWordModalClose}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'box-none', // 允许点击穿透到下层元素
          }}
        >
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50, // 降低背景遮罩的层级
            }}
            onPress={handleWordModalClose}
          />
          <View
            style={{
              position: 'absolute',
              left: isFinite(wordModalLeft) ? wordModalLeft : 0,
              top: isFinite(wordModalPosition.y) ? wordModalPosition.y : 0,
              zIndex: 100,
              alignItems: 'flex-start',
            }}
          >
            {/* 上方三角形 */}
            {wordModalPosition.direction === 'down' && (
              <View
                style={{
                  position: 'absolute',
                  left: Math.max(0, Math.min((isFinite(wordModalPosition.x) && isFinite(wordModalLeft) ? wordModalPosition.x - wordModalLeft - 12 : 0), Math.min(articleWidth, 300) - 24)),
                  top: -12,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderBottomWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: '#FFF3E6',
                }}
              />
            )}
            {/* 弹窗主体 */}
            <View
              style={{
                backgroundColor: '#FFF3E6',
                borderRadius: 16,
                padding: 18,
                paddingHorizontal: 26,
                width: Math.min(articleWidth, 300), // 限制最大宽度
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* First Row: Word + Buttons */}
              <View style={styles.wordModalFirstRow}>
                <View style={styles.wordModalWordSection}>
                  <Text style={styles.wordModalWord}>{selectedWord?.text || currentWord || 'Unknown word'}</Text>
                </View>
                <View style={styles.wordModalButtons}>
                  <TouchableOpacity
                    style={styles.wordModalButton}
                    onPress={() => handleSoundPress()}
                  >
                    <Ionicons name="volume-high-outline" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Second Row: Definition */}
              <View style={styles.wordModalSecondRow}>
                <Text style={styles.wordModalDefinition}>
                  {isWordSearchLoading ? 'Loading...' : definition || 'No definition available'}
                </Text>
              </View>
            </View>
            {/* 下方三角形 */}
            {wordModalPosition.direction === 'up' && (
              <View
                style={{
                  position: 'absolute',
                  left: Math.max(0, Math.min(wordModalPosition.x - wordModalLeft - 12, Math.min(articleWidth, 300) - 24)), // 确保三角形在弹窗内
                  bottom: -12,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderTopWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: '#FFF3E6',
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Sentence Selection Modal */}
      <SentenceSelectionModal
        visible={showSentenceModal}
        sentence={selectedSentence}
        position={sentenceModalPosition}
        direction={sentenceModalPosition.direction as 'up' | 'down'}
        sentenceModalContent={sentenceModalContent}
        logId={logId || 0}
        onTranslate={() => {
          handleSentenceTranslate(selectedSentence);
        }}
        onAnalyze={() => {
          handleSentenceAnalyze(selectedSentence);
        }}
        onCopy={() => {
          handleSentenceCopy();
          handleSentenceModalClose();
        }}
        onClose={handleSentenceModalClose}
      />

      {/* Word Choice Modal */}
      <WordChoiceModal
        visible={showWordChoiceModal}
        position={{ ...wordChoiceModalPosition, direction: wordChoiceModalPosition.direction as 'down' | 'up' }}
        onRemoveHighlight={handleRemoveWordHighlight}
        onLookupAgain={handleLookupWordAgain}
        onClose={handleWordChoiceModalClose}
      />

      {/* Modals */}
      <Modal
        visible={showGuessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {!showCheckmark ? (
              <>
                <Text style={styles.modalTitle}>Guess the Word</Text>
                <Text style={styles.modalWord}>{selectedWord?.text}</Text>

                {/* Sample options - you can replace with actual options */}
                <View style={styles.guessOptions}>
                  <TouchableOpacity
                    style={styles.guessOption}
                    onPress={() => handleCorrectAnswer()}
                  >
                    <Text style={styles.guessOptionText}>Correct Answer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.guessOption}
                    onPress={() => setShowGuessModal(false)}
                  >
                    <Text style={styles.guessOptionText}>Wrong Answer</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowGuessModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.checkmarkContainer}>
                <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color="#4CAF50"
                    style={styles.checkmarkIcon}
                  />
                </Animated.View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {showTranslationOverlay && (
        <View style={[styles.overlay, { pointerEvents: 'box-none' }]}>
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setShowTranslationOverlay(false)}
          />
          <View style={styles.overlayContent}>
            <Text style={styles.overlayText}>{selectedText}</Text>
            <Text style={styles.overlayTranslation}>Translation here</Text>
          </View>
        </View>
      )}
      <SentenceAnalysisModal
        showSentenceAnalysisModal={showSentenceAnalysisModal}
        setShowSentenceAnalysisModal={setShowSentenceAnalysisModal}
        sentenceAnalysisContent={sentenceAnalysisContent}
      />

      {/* 单词释义与干扰项弹窗 */}
      <Modal
        visible={showWordDefinitionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowWordDefinitionModal(false);
          setShowCorrectAnswer(false);
          setShowCheckmark(false);
          setShowWordDetails(false);
          setCurrentWordText('');
          setCurrentWordPhonetic('');
          checkmarkScale.setValue(0);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'box-none', // 允许点击穿透到下层元素
          }}
        >
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50, // 降低背景遮罩的层级
            }}
            onPress={() => {
              setShowWordDefinitionModal(false);
              setShowCorrectAnswer(false);
              setShowCheckmark(false);
              setShowWordDetails(false);
              setCurrentWordText('');
              setCurrentWordPhonetic('');
              checkmarkScale.setValue(0);
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: articleX,
              top: wordModalPosition.y,
              width: articleWidth,
              zIndex: 100,
              alignItems: 'flex-start',
            }}
          >
            {/* 上方三角形 */}
            {wordModalPosition.direction === 'down' && (
              <View
                style={{
                  position: 'absolute',
                  left: wordModalPosition.x - articleX - 12,
                  top: -12,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderBottomWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: '#FFF3E6',
                }}
              />
            )}
            {/* 弹窗主体 */}
            <View
              style={{
                backgroundColor: '#FFF3E6',
                borderRadius: 16,
                padding: 18,
                paddingHorizontal: 26,
                width: articleWidth,
                height: 70, // 固定高度，与modalHeight保持一致
                alignItems: 'center',
                justifyContent: 'center', // 确保内容垂直居中
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {/* 干扰项内容 */}
              {!showCheckmark && !showWordDetails ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%',}}>
                  {Array.isArray(wordOptions) && wordOptions.length > 0 && wordOptions.map((option, idx) => (
                    <React.Fragment key={`${option}-${idx}`}>
                      {/* if wordDefinitionCorrect  == wordDefinition, set color to green */}
                      {/* if wordDefinitionCorrect  !== wordDefinition, set color to red */}
                      {/* if wordDefinitionCorrect  == wordDefinition, set color to black */}
                      <Pressable
                        onPress={() => {
                        console.log('[PassageMain] wordDefinitionCorrect', wordDefinitionCorrect);
                        console.log('[PassageMain] wordDefinition', wordDefinition);
                        console.log('[PassageMain] option', option);
                        console.log('[PassageMain] wordDefinitionCorrect === wordDefinition', wordDefinitionCorrect === wordDefinition);
                        console.log('[PassageMain] wordDefinitionCorrect !== wordDefinition', wordDefinitionCorrect !== wordDefinition);
                        setWordDefinitionCorrect(option);

                        // Check if this is the correct answer
                        if (option === wordDefinition) {
                          // Trigger animation for correct answer
                          setShowCorrectAnswer(true);

                          // Show checkmark after 0.5 seconds (after text turns green)
                          setTimeout(() => {
                            setShowCheckmark(true);

                            // Animate checkmark scale from 0 to 1
                            Animated.spring(checkmarkScale, {
                              toValue: 1,
                              useNativeDriver: true,
                              tension: 100,
                              friction: 8,
                            }).start();
                          }, 500);

                          // After checkmark animation, show word details
                          setTimeout(() => {
                            setShowCheckmark(false);
                            setShowWordDetails(true);
                            checkmarkScale.setValue(0);
                          }, 1500);
                        }
                      }}
                    >
                      <Text
                        style={[
                          {
                          color: '#333',
                          fontSize: 12,
                          fontWeight: '500',
                          textAlignVertical: 'center',
                          minWidth: 80,
                        },
                        wordDefinitionCorrect !== null && option === wordDefinitionCorrect && (
                          option === wordDefinition
                            ? { color: '#4CAF50' } // 选中且正确
                            : { color: '#F44336' } // 选中但错误
                        ),
                        wordDefinitionCorrect === null && {
                          color: '#333',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    </Pressable>
                    {idx !== wordOptions.length - 1 && (
                      <Text style={{ color: '#FC9B33', fontSize: 18, marginHorizontal: 4 }}>|</Text>
                    )}
                  </React.Fragment>
                                    ))}
                  </View>
                ) : showCheckmark ? (
                  <View style={styles.checkmarkContainer}>
                    <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={50}
                        color="#4CAF50"
                        style={styles.checkmarkIcon}
                      />
                    </Animated.View>
                  </View>
                ) : showWordDetails ? (
                  <View style={styles.wordDetailsContainer}>
                    <View style={styles.wordDetailsRow}>
                      <Text style={styles.wordDetailsText}>{currentWordText}</Text>
                      {currentWordPhonetic && (
                        <Text style={styles.wordDetailsPhonetic}> {currentWordPhonetic}</Text>
                      )}
                      <TouchableOpacity
                        style={styles.wordDetailsSoundButton}
                        onPress={() => handleSoundPress(currentWordText)}
                      >
                        <Ionicons name="volume-high-outline" size={20} color="#FC9B33" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.wordDetailsDefinition}>{wordDefinition}</Text>
                  </View>
                ) : null}
                </View>
            {/* 下方三角形 */}
            {wordModalPosition.direction === 'up' && (
              <View
                style={{
                  position: 'absolute',
                  left: (isFinite(wordModalPosition.x) && isFinite(articleX)) ? wordModalPosition.x - articleX - 12 : 0,
                  bottom: -12,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderTopWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: '#FFF3E6',
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
// 解析内容弹窗
const SentenceAnalysisModal = ({ showSentenceAnalysisModal, setShowSentenceAnalysisModal, sentenceAnalysisContent }: { showSentenceAnalysisModal: boolean, setShowSentenceAnalysisModal: (show: boolean) => void, sentenceAnalysisContent: string }) => {
  return (
    <Modal
      visible={showSentenceAnalysisModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSentenceAnalysisModal(false)}
    >
      <View style={[styles.analysisModalContainer, { pointerEvents: 'box-none' }]}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50, // 降低背景遮罩的层级
          }}
          onPress={() => setShowSentenceAnalysisModal(false)}
        />
        <View style={styles.analysisModalContent}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => setShowSentenceAnalysisModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.analysisModalTitle}>Sentence Analysis</Text>
          <ScrollView style={styles.analysisModalScrollView}>
            <Text style={styles.analysisModalContentText}>{sentenceAnalysisContent}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// 单词选择弹窗
const WordChoiceModal = ({
  visible,
  position,
  onRemoveHighlight,
  onLookupAgain,
  onClose
}: {
  visible: boolean;
  position: { x: number; y: number; direction: 'down' | 'up' };
  onRemoveHighlight: () => void;
  onLookupAgain: () => void;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.wordChoiceModalOverlay, { pointerEvents: 'box-none' }]}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50, // 降低背景遮罩的层级
          }}
          onPress={onClose}
        />
        <View
          style={[
            styles.wordChoiceModalContent,
            {
              position: 'absolute',
              left: position.x - 100, // Center the modal
              top: position.y,
              zIndex: 100, // 确保模态框内容在背景遮罩之上
            }
          ]}
        >
          <TouchableOpacity
            style={styles.wordChoiceButton}
            onPress={onRemoveHighlight}
          >
            <Text style={styles.wordChoiceButtonText}>取消划线</Text>
          </TouchableOpacity>

          <View style={styles.wordChoiceDivider} />

          <TouchableOpacity
            style={styles.wordChoiceButton}
            onPress={onLookupAgain}
          >
            <Text style={styles.wordChoiceButtonText}>再次查词</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  segment: {
    padding: width * 0.04,
    marginBottom: height * 0.02,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    lineHeight: 25,
    color: 'black',
  },
  unlearnedWord: {
    backgroundColor: '#9500',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  reviewingWord: {
    backgroundColor: '#838589',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  unknownWord: {
    backgroundColor: '#838589',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  wordText: {
    color: 'white',
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  feedbackContainer: {
    marginTop: height * 0.02,
    padding: width * 0.04,
    backgroundColor: '#FC9B33',
    borderRadius: 5,
  },
  feedbackTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '400',
    marginBottom: height * 0.01,
  },
  feedbackButtons: {
    gap: height * 0.01,
  },
  feedbackButton: {
    backgroundColor: 'white',
    padding: width * 0.04,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  feedbackButtonText: {
    color: '#FF8000',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '400',
    textAlign: 'center',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: width * 0.06,
    borderRadius: 10,
    width: width * 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
    marginBottom: height * 0.02,
  },
  modalWord: {
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'K2D', android: 'sans-serif' }),
    color: '#F87A2C',
    marginBottom: height * 0.02,
  },
  modalDefinition: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    marginBottom: height * 0.02,
  },
  closeButton: {
    backgroundColor: '#FC9B33',
    padding: width * 0.04,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: 'white',
    padding: width * 0.06,
    borderRadius: 10,
    width: width * 0.8,
  },
  overlayText: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#0C1A30',
    marginBottom: height * 0.01,
  },
  overlayTranslation: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FC9B33',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Article content styles
  articleContainer: {
    flex: 1,
    padding: width * 0.04,
  },
  titleSection: {
    marginBottom: height * 0.03,
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FC9B33',
    marginBottom: height * 0.01,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    lineHeight: 34,
  },
  articleSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    marginBottom: height * 0.015,
  },
  titleSeparator: {
    height: 2,
    backgroundColor: '#FC9B33',
    borderRadius: 1,
  },
  aiGeneratedLabel: {
    fontSize: 12,
    color: '#FF0000',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    marginTop: height * 0.01,
    fontWeight: '500',
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  highlightedWord: {
    backgroundColor: '#FC9B33',
    color: 'white',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  clickableWord: {
    color: '#333',
  },
  // Word lookup modal styles
  wordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordModalContent: {
    backgroundColor: '#F8D16E',
    padding: width * 0.06,
    borderRadius: 5,
    width: width * 0.85,
    maxWidth: 400,
  },
  wordModalFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    gap: 16, // 增加单词和按钮之间的间距
  },
  wordModalWordSection: {
    flex: 1,
  },
  wordModalWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordModalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  wordModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  wordModalSecondRow: {
    paddingTop: height * 0.01,
    // Removed borderTopWidth and borderTopColor to remove the divider line
  },
  wordModalDefinition: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  // New styles for streaming content
  streamingContainer: {
    backgroundColor: '#F0F0F0',
    padding: width * 0.04,
    borderRadius: 8,
    marginTop: height * 0.02,
    marginBottom: height * 0.04,
  },
  streamingLabel: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
    color: '#333',
    marginBottom: height * 0.01,
  },
  streamingContent: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#555',
    lineHeight: 22,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: height * 0.04,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  streamingIndicator: {
    backgroundColor: '#FC9B33',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  streamingIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
  },
  errorContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  newWordHighlight: {
    backgroundColor: '#FC9B33',
    color: 'white',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  streamingWordHighlight: {
    backgroundColor: '#FF9B0F',
    color: 'white',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  learnedWord: {
    borderBottomWidth: 2,
    borderBottomColor: '#FC9B33',
  },
  queriedWordUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: '#FC9B33',
  },
  wordContainer: {
    paddingHorizontal: 2,
  },
  articleText: {
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: height * 0.01,
  },
  segmentContainer: {
    marginBottom: height * 0.02,
  },
  // Bottom container styles
  bottomContainer: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completeButton: {
    backgroundColor: '#FC9B33',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginLeft: width * 0.03,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  debugButton: {
    backgroundColor: '#666',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  paragraphContainer: {
    marginBottom: height * 0.02,
    width: '100%',
  },
  sentenceWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    paddingVertical: height * 0.005,
  },
  sentenceContainer: {
    paddingVertical: height * 0.005,
    width: '100%',
  },
  sentenceText: {
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    flexWrap: 'wrap',
  },
  articleTextContainer: {
    // Dynamic styles will be applied inline
  },
  articleScrollView: {
    flex: 1,
  },
  articleContentContainer: {
    paddingBottom: height * 0.05, // Add some padding at the bottom for the button
  },
  streamingText: {
    color: 'white',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
  },
  selectedSentenceContainer: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    borderRadius: 6,
  },
  selectedSentenceText: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    borderRadius: 6,
  },
  closeIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
    padding: 6,
  },
  analysisModalContentText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  analysisModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 22,
    width: '80%',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  analysisModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    marginTop: 4,
    alignSelf: 'center',
  },
  analysisModalScrollView: {
    flex: 1,
    width: '100%',
    maxHeight: height * 0.8,
    minHeight: 160,
  },
  // Guess modal styles
  guessOptions: {
    marginVertical: height * 0.02,
    gap: height * 0.01,
  },
  guessOption: {
    backgroundColor: '#F0F0F0',
    padding: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
  },
  guessOptionText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 70, // 固定高度，与原来的modal height保持一致
  },
  checkmarkIcon: {
    // Add any additional styling for the checkmark if needed
  },
  wordDetailsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  wordDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  wordDetailsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  wordDetailsPhonetic: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordDetailsSoundButton: {
    padding: 4,
    marginLeft: 8,
  },
  wordDetailsDefinition: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  translationLoadingContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginVertical: 10,
  },
  translationLoadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Word Choice Modal styles
  wordChoiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  wordChoiceModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  wordChoiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  wordChoiceButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#333',
    fontWeight: '500',
  },
  wordChoiceDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 0,
  },
});

// Memoized Sentence Component
const MemoizedSentence = React.memo(({
                                       sentence,
                                       selectedSentence,
                                       renderHighlightedTextInSentence,
                                       sentenceRefs,
                                       fontSize,
                                       lineHeight,
                                     }: {
  sentence: { id: string; text: string };
  selectedSentence: string;
  renderHighlightedTextInSentence: (sentenceText: string, sentenceId: string) => React.ReactNode;
  sentenceRefs: React.MutableRefObject<{ [id: string]: any }>;
  fontSize: number;
  lineHeight: number;
}) => {
  return (
      <TouchableOpacity
          key={sentence.id}
          activeOpacity={0.8}
          style={[
            styles.sentenceWrapper,
            selectedSentence === sentence.text && styles.selectedSentenceContainer,
          ]}
      >
        <Text
            ref={(ref) => {
              sentenceRefs.current[sentence.id] = ref;
            }}
            style={[
              styles.sentenceText,
              { fontSize, lineHeight: lineHeight * fontSize },
              selectedSentence === sentence.text && styles.selectedSentenceText,
            ]}
        >
          {renderHighlightedTextInSentence(sentence.text, sentence.id)}
        </Text>
      </TouchableOpacity>
  );
});

// Export as a named export for backward compatibility
export { PassageMainPage as PassageMain };
