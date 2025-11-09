import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@data/repository/store';
import { saveSentence, unsaveSentence } from '@data/usecase/SentenceFavouriteUseCase';

const { width, height } = Dimensions.get('window');

interface SentenceSelectionModalProps {
  visible: boolean;
  sentence: string;
  position: { x: number; y: number };
  direction?: 'up' | 'down';
  sentenceModalContent: string | null;
  logId: number; // 添加logId参数
  onTranslate: () => void;
  onAnalyze: () => void;
  onCopy: () => void;
  onClose: () => void;
}

export const SentenceSelectionModal: React.FC<SentenceSelectionModalProps> = ({
  visible,
  sentence,
  position,
  direction = 'down',
  sentenceModalContent,
  logId,
  onTranslate,
  onAnalyze,
  onCopy,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { favoritedSentences, savedSentences, loading } = useSelector((state: RootState) => state.sentenceFavorite);
  
  // 检查句子是否已收藏
  const isFavorited = favoritedSentences.has(sentence);
  
  // 处理收藏/取消收藏
  const handleFavorite = async () => {
    if (!sentence || !logId) return;
    
    try {
      if (isFavorited) {
        // 取消收藏句子
        const savedSentence = savedSentences.find(s => s.content === sentence);
        if (savedSentence) {
          await dispatch(unsaveSentence({ 
            savedPhraseId: savedSentence.id, 
            content: sentence 
          })).unwrap();
        }
      } else {
        // 收藏句子
        await dispatch(saveSentence({
          content: sentence,
          translation: sentenceModalContent || '',
          explication: sentenceModalContent || '',
          log_id: logId,
        })).unwrap();
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
    }
  };
  // Streaming text states
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [lastProcessedContent, setLastProcessedContent] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'translate' | 'analyze' | null>(null);

  // Set modal width to be responsive to screen size
  const screenWidth = Dimensions.get('window').width;
  const modalWidth = Math.min(screenWidth * 0.8, 400);
  const modalMinHeight = 160;
  const padding = 20;
  const safeTopMargin = 120; // Top safe margin
  const safeBottomMargin = 120; // Bottom safe margin

  // Calculate modal position to be centered horizontally
  let modalX = (width - modalWidth) / 2;
  let modalY = position.y; // Already calculated as top or bottom in parent

  // Smarter boundary handling
  if (modalY + modalMinHeight > height - safeBottomMargin) {
    // If modal would exceed bottom, adjust to safe position
    modalY = height - modalMinHeight - safeBottomMargin;
  }
  if (modalY < safeTopMargin) {
    // If modal would exceed top, adjust to safe position
    modalY = safeTopMargin;
  }
  
  // Special check for last paragraph issues - more lenient check
  if (position.y > height - 200) {
    // If position is within 200px of screen bottom, use safe position near bottom
    modalY = height - modalMinHeight - 200; // Increased from 150 to 200px
  }

  // Handle translate with streaming
  const handleTranslate = () => {
    // Clear current content and stop any ongoing streaming
    setStreamingText('');
    setCurrentContent(null);
    setLastProcessedContent(null);
    setIsStreaming(true);
    setCurrentAction('translate');
    
    // Call the translate API
    onTranslate();
  };

  // Handle analyze with streaming
  const handleAnalyze = () => {
    // Clear current content and stop any ongoing streaming
    setStreamingText('');
    setCurrentContent(null);
    setLastProcessedContent(null);
    setIsStreaming(true);
    setCurrentAction('analyze');
    
    // Call the analyze API
    onAnalyze();
  };

  // Reset streaming when modal closes
  useEffect(() => {
    if (!visible) {
      setStreamingText('');
      setIsStreaming(false);
      setCurrentContent(null);
      setLastProcessedContent(null);
      setCurrentAction(null);
    }
  }, [visible]);

  // Handle content updates and start streaming only when new content arrives
  useEffect(() => {
    if (sentenceModalContent !== null && sentenceModalContent !== lastProcessedContent) {
      // Update content immediately when new chunks arrive
      setCurrentContent(sentenceModalContent);
      setLastProcessedContent(sentenceModalContent);
      
      // If we're streaming, update streaming text
      if (isStreaming) {
        setStreamingText(sentenceModalContent);
      }
    }
  }, [sentenceModalContent, lastProcessedContent, isStreaming]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { pointerEvents: 'box-none' }]}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={onClose}
        />
        {direction === 'down' && (
          <View style={{ position: 'absolute', left: modalX + modalWidth / 2 - 12, top: modalY - 12, width: 0, height: 0, zIndex: 10 }}>
            <View style={styles.triangle} />
          </View>
        )}
        <View
          style={[
            styles.modalContainer,
            {
              left: modalX,
              top: modalY,
              width: modalWidth,
              minHeight: modalMinHeight,
            },
          ]}
        >
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTranslate}>
              <Ionicons name="language" size={20} color="#333" />
              <Text style={styles.actionButtonText}>翻译</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleAnalyze}>
              <Ionicons name="analytics" size={20} color="#333" />
              <Text style={styles.actionButtonText}>解析</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
              <Ionicons name="copy" size={20} color="#333" />
              <Text style={styles.actionButtonText}>复制</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, isFavorited && styles.favoriteActive]} 
              onPress={handleFavorite}
              disabled={loading}
            >
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorited ? "#FF6B6B" : "#333"} 
              />
              <Text style={[styles.actionButtonText, isFavorited && styles.favoriteActiveText]}>
                {isFavorited ? '已收藏' : '收藏'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Separator */}
          <View style={styles.separator} />
          {/* Sentence preview area */}
          <View style={styles.sentencePreview}>
            <Text style={styles.originalSentence}>{sentence}</Text>
            <ScrollView style={{ maxHeight: 210 }}>
              <Text style={styles.sentenceText}>
                {isStreaming ? streamingText : (currentContent || '')}
              </Text>
            </ScrollView>
          </View>
        </View>
        {direction === 'up' && (
          <View style={{ position: 'absolute', left: modalX + modalWidth / 2 - 12, top: modalY + modalMinHeight, width: 0, height: 0, zIndex: 10 }}>
            <View style={[styles.triangle, { transform: [{ rotate: '180deg' }] }]} />
          </View>
        )}
      </View>
    </Modal>
  );
};

// 在styles中添加收藏按钮的样式
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: '#FFF3E6', // 改为和其他pop-up一致的颜色
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
    // width: '80%',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF3E6', // 三角形颜色也要匹配
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5', // 改为灰色分隔线
    marginVertical: 4,
    width: '100%',
  },
  sentencePreview: {
    paddingTop: 4,
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  originalSentence: {
    fontSize: 14,
    color: '#666', // 原句文字改为灰色
    lineHeight: 20,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sentenceText: {
    fontSize: 14,
    color: '#666', // 翻译和解析文字改为灰色
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  favoriteActive: {
    backgroundColor: '#FFE5E5',
  },
  favoriteActiveText: {
    color: '#FF6B6B',
  },
}); 

export default SentenceSelectionModal;