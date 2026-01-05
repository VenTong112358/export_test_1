import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { ClipPath, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { TranslationToggle } from './TranslationToggle';

// 自定义星形图标组件
const StarIcon: React.FC<{ filled: boolean; size?: number; color?: string }> = ({ 
  filled, 
  size = 20, 
  color = '#333' 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 当收藏状态改变时触发动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [filled]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Svg width={size} height={size} viewBox="0 0 20 19" fill="none">
        <Path 
          d="M10.6988 1.42791L12.9056 5.81547C12.9558 5.92684 13.0347 6.0233 13.1346 6.09525C13.2344 6.16718 13.3517 6.21211 13.4746 6.22552L18.3461 6.93628C18.4872 6.95413 18.6202 7.01114 18.7295 7.10065C18.8389 7.19015 18.9202 7.30847 18.9638 7.44175C19.0075 7.57504 19.0117 7.71782 18.976 7.8534C18.9405 7.98899 18.8664 8.11177 18.7624 8.20744L15.2511 11.6382C15.1615 11.7207 15.0942 11.8239 15.0555 11.9385C15.0167 12.0531 15.0076 12.1754 15.029 12.2943L15.8756 17.1192C15.9002 17.2579 15.8846 17.4005 15.8309 17.5309C15.7772 17.6613 15.6874 17.7742 15.5717 17.8569C15.4561 17.9394 15.3191 17.9884 15.1765 17.9982C15.034 18.0079 14.8915 17.9781 14.7653 17.912L10.3796 15.6293C10.2673 15.5751 10.1439 15.5469 10.0188 15.5469C9.89367 15.5469 9.77023 15.5751 9.65792 15.6293L5.2722 17.912C5.14602 17.9781 5.00356 18.0079 4.86101 17.9982C4.71846 17.9884 4.58154 17.9394 4.46586 17.8569C4.35017 17.7742 4.26034 17.6613 4.2066 17.5309C4.15288 17.4005 4.13737 17.2579 4.16188 17.1192L5.0085 12.2396C5.02995 12.1207 5.02088 11.9984 4.9821 11.8838C4.94332 11.7692 4.87605 11.666 4.78643 11.5835L1.23345 8.20744C1.12833 8.10916 1.05441 7.98296 1.02063 7.84416C0.986857 7.70534 0.994679 7.55986 1.04315 7.42533C1.09162 7.29081 1.17866 7.17301 1.29372 7.08621C1.40879 6.99941 1.54694 6.94732 1.69144 6.93628L6.56293 6.22552C6.6859 6.21211 6.80315 6.16718 6.90299 6.09525C7.00284 6.0233 7.08178 5.92684 7.13197 5.81547L9.33871 1.42791C9.3988 1.30012 9.49476 1.19193 9.61527 1.11611C9.73577 1.04029 9.87578 1 10.0188 1C10.1618 1 10.3018 1.04029 10.4223 1.11611C10.5428 1.19193 10.6387 1.30012 10.6988 1.42791Z" 
          stroke={color} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      </Svg>
    </Animated.View>
  );
};

// 自定义分享图标组件
const ShareIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 18, 
  color = '#000' 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <G clipPath="url(#clip0_2250_2025)">
        <Path 
          d="M16.7143 8.35713V15.8571C16.7143 16.0844 16.633 16.3025 16.4884 16.4632C16.3436 16.624 16.1474 16.7143 15.9428 16.7143H2.05713C1.85254 16.7143 1.65633 16.624 1.51166 16.4632C1.36698 16.3025 1.28571 16.0844 1.28571 15.8571V2.14285C1.28571 1.91553 1.36698 1.69751 1.51166 1.53675C1.65633 1.37601 1.85254 1.28571 2.05713 1.28571H8.35713" 
          stroke={color} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <Path 
          d="M14.1428 1.28571L16.7143 3.85713L14.1428 6.42856" 
          stroke={color} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <Path 
          d="M9 12.2143V8.99997C9 6.15965 11.3025 3.85712 14.1429 3.85712H16.5536" 
          stroke={color} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2250_2025">
          <Rect width="18" height="18" fill="white"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
};

// 自定义字体大小间距图标组件
const FontSizeIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 22, 
  color = '#000' 
}) => {
  return (
    <Svg width={size} height={20} viewBox="0 0 22 20" fill="none">
      <G clipPath="url(#clip0_2275_749)">
        <Mask id="path-1-inside-1_2275_749" fill="white">
          <Path d="M8.70847 18.3334C8.61316 18.3333 8.52022 18.3063 8.44259 18.2561C8.36496 18.2058 8.3065 18.1348 8.27535 18.0529L7.1129 15H2.05405L0.891598 18.053C0.851826 18.1574 0.76805 18.2432 0.6587 18.2915C0.549351 18.3398 0.423384 18.3466 0.308512 18.3104C0.19364 18.2743 0.0992728 18.1981 0.0461692 18.0987C-0.00693432 17.9993 -0.0144238 17.8848 0.0253483 17.7804L4.15035 6.94702C4.18152 6.86515 4.23998 6.79415 4.31761 6.74389C4.39524 6.69364 4.48817 6.66664 4.58347 6.66664C4.67877 6.66664 4.7717 6.69364 4.84933 6.74389C4.92696 6.79415 4.98543 6.86515 5.0166 6.94702L9.1416 17.7804C9.16551 17.8431 9.17256 17.9102 9.16216 17.9759C9.15177 18.0417 9.12423 18.1042 9.08185 18.1584C9.03946 18.2125 8.98346 18.2566 8.91851 18.287C8.85356 18.3175 8.78155 18.3334 8.70847 18.3334ZM2.37144 14.1667H6.7955L4.58347 8.35718L2.37144 14.1667ZM21.5418 18.3334C21.4444 18.3333 21.3495 18.305 21.271 18.2527C21.1924 18.2003 21.1343 18.1265 21.105 18.0421L19.469 13.3334H12.6146L10.9788 18.0422C10.962 18.0958 10.9335 18.1457 10.8951 18.1891C10.8567 18.2325 10.8091 18.2685 10.7551 18.2949C10.7012 18.3213 10.6419 18.3376 10.5809 18.3428C10.5199 18.348 10.4583 18.342 10.3999 18.3252C10.3415 18.3084 10.2873 18.2812 10.2407 18.245C10.1941 18.2089 10.1559 18.1646 10.1284 18.1148C10.1009 18.065 10.0847 18.0107 10.0807 17.9551C10.0767 17.8995 10.085 17.8438 10.1051 17.7912L15.6051 1.95783C15.6345 1.8735 15.6928 1.79989 15.7713 1.74764C15.8498 1.6954 15.9446 1.66724 16.0419 1.66724C16.1393 1.66724 16.2341 1.6954 16.3126 1.74764C16.3911 1.79989 16.4493 1.8735 16.4788 1.95783L21.9788 17.7912C22.0005 17.8536 22.0057 17.9198 21.994 17.9844C21.9823 18.049 21.954 18.1101 21.9115 18.1629C21.8689 18.2158 21.8133 18.2587 21.749 18.2883C21.6848 18.3179 21.6138 18.3333 21.5418 18.3334ZM12.9041 12.5H19.1795L16.0418 3.46707L12.9041 12.5Z"/>
        </Mask>
        <G filter="url(#filter0_i_2275_749)">
          <Path d="M8.70847 18.3334C8.61316 18.3333 8.52022 18.3063 8.44259 18.2561C8.36496 18.2058 8.3065 18.1348 8.27535 18.0529L7.1129 15H2.05405L0.891598 18.053C0.851826 18.1574 0.76805 18.2432 0.6587 18.2915C0.549351 18.3398 0.423384 18.3466 0.308512 18.3104C0.19364 18.2743 0.0992728 18.1981 0.0461692 18.0987C-0.00693432 17.9993 -0.0144238 17.8848 0.0253483 17.7804L4.15035 6.94702C4.18152 6.86515 4.23998 6.79415 4.31761 6.74389C4.39524 6.69364 4.48817 6.66664 4.58347 6.66664C4.67877 6.66664 4.7717 6.69364 4.84933 6.74389C4.92696 6.79415 4.98543 6.86515 5.0166 6.94702L9.1416 17.7804C9.16551 17.8431 9.17256 17.9102 9.16216 17.9759C9.15177 18.0417 9.12423 18.1042 9.08185 18.1584C9.03946 18.2125 8.98346 18.2566 8.91851 18.287C8.85356 18.3175 8.78155 18.3334 8.70847 18.3334ZM2.37144 14.1667H6.7955L4.58347 8.35718L2.37144 14.1667ZM21.5418 18.3334C21.4444 18.3333 21.3495 18.305 21.271 18.2527C21.1924 18.2003 21.1343 18.1265 21.105 18.0421L19.469 13.3334H12.6146L10.9788 18.0422C10.962 18.0958 10.9335 18.1457 10.8951 18.1891C10.8567 18.2325 10.8091 18.2685 10.7551 18.2949C10.7012 18.3213 10.6419 18.3376 10.5809 18.3428C10.5199 18.348 10.4583 18.342 10.3999 18.3252C10.3415 18.3084 10.2873 18.2812 10.2407 18.245C10.1941 18.2089 10.1559 18.1646 10.1284 18.1148C10.1009 18.065 10.0847 18.0107 10.0807 17.9551C10.0767 17.8995 10.085 17.8438 10.1051 17.7912L15.6051 1.95783C15.6345 1.8735 15.6928 1.79989 15.7713 1.74764C15.8498 1.6954 15.9446 1.66724 16.0419 1.66724C16.1393 1.66724 16.2341 1.6954 16.3126 1.74764C16.3911 1.79989 16.4493 1.8735 16.4788 1.95783L21.9788 17.7912C22.0005 17.8536 22.0057 17.9198 21.994 17.9844C21.9823 18.049 21.954 18.1101 21.9115 18.1629C21.8689 18.2158 21.8133 18.2587 21.749 18.2883C21.6848 18.3179 21.6138 18.3333 21.5418 18.3334ZM12.9041 12.5H19.1795L16.0418 3.46707L12.9041 12.5Z" fill={color}/>
        </G>
      </G>
      <Defs>
        <ClipPath id="clip0_2275_749">
          <Rect width="22" height="20" fill="white"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
};

interface HeaderReadingControlsProps {
  fontSize: number;
  lineHeight: number;
  defaultLineHeight?: number;
  hasIncreasedLineHeight?: boolean;
  showTranslation: boolean;
  isFavorited: boolean;
  logId: string;
  isTranslating?: boolean;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onTranslationToggle: () => void;
  onFavoriteToggle: () => void;
  onReviewedWordsToggle: () => void;
}

export const HeaderReadingControls: React.FC<HeaderReadingControlsProps> = ({
  fontSize,
  lineHeight,
  defaultLineHeight = 1.5,
  hasIncreasedLineHeight = false,
  showTranslation,
  isFavorited,
  logId,
  isTranslating = false,
  onFontSizeChange,
  onLineHeightChange,
  onTranslationToggle,
  onFavoriteToggle,
  onReviewedWordsToggle,
}) => {
  const [showFontModal, setShowFontModal] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 计算弹窗位置
  const calculatePopupPosition = () => {
    const screenWidth = Dimensions.get('window').width;
    // 计算实际宽度：4个按钮(32px) + 按钮margin(2*2*4=16px) + 3个间距(4px) + padding(16px)
    const popupWidth = 4 * 32 + 2 * 2 * 4 + 3 * 4 + 16; // 172px
    const rightMargin = 32; // 右边距，确保窗口完全显示
    const calculatedLeft = Math.min(
      buttonLayout.x,
      screenWidth - popupWidth - rightMargin // 留出足够的右边距
    );
    return Math.max(16, calculatedLeft); // 确保至少距离左边界16px
  };

  const increaseFontSize = () => {
    console.log('[HeaderReadingControls] increaseFontSize called, current fontSize:', fontSize);
    if (fontSize < 24) {
      const newSize = fontSize + 2;
      console.log('[HeaderReadingControls] Increasing font size to:', newSize);
      onFontSizeChange(newSize);
    } else {
      console.log('[HeaderReadingControls] Font size already at maximum (24)');
    }
  };

  const decreaseFontSize = () => {
    console.log('[HeaderReadingControls] decreaseFontSize called, current fontSize:', fontSize);
    if (fontSize > 12) {
      const newSize = fontSize - 2;
      console.log('[HeaderReadingControls] Decreasing font size to:', newSize);
      onFontSizeChange(newSize);
    } else {
      console.log('[HeaderReadingControls] Font size already at minimum (12)');
    }
  };

  const increaseLineHeight = () => {
    console.log('[HeaderReadingControls] increaseLineHeight called, current lineHeight:', lineHeight);
    if (lineHeight < 2.5) {
      const newHeight = lineHeight + 0.2;
      console.log('[HeaderReadingControls] Increasing line height to:', newHeight);
      onLineHeightChange(newHeight);
    } else {
      console.log('[HeaderReadingControls] Line height already at maximum (2.5)');
    }
  };

  const decreaseLineHeight = () => {
    console.log('[HeaderReadingControls] decreaseLineHeight called, current lineHeight:', lineHeight, 'default:', defaultLineHeight, 'hasIncreased:', hasIncreasedLineHeight);
    
    // 如果没有增加过，不能减少
    if (!hasIncreasedLineHeight) {
      console.log('[HeaderReadingControls] Cannot decrease: line height has not been increased yet');
      return;
    }
    
    // 不能减少到低于默认值
    if (lineHeight <= defaultLineHeight) {
      console.log('[HeaderReadingControls] Line height already at default value:', defaultLineHeight);
      return;
    }
    
    const newHeight = Math.max(defaultLineHeight, lineHeight - 0.2);
    console.log('[HeaderReadingControls] Decreasing line height to:', newHeight);
    onLineHeightChange(newHeight);
  };

  const handleFontButtonPress = () => {
    console.log('[HeaderReadingControls] Font button pressed, opening modal');
    setShowFontModal(true);
  };

  const onButtonLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonLayout({ x, y, width, height });
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `我正在阅读这篇文章，推荐给你！文章ID: ${logId}`,
        title: '分享文章',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // 分享成功
          console.log('文章分享成功');
        } else {
          // 分享成功但没有指定应用
          console.log('文章分享成功');
        }
      } else if (result.action === Share.dismissedAction) {
        // 用户取消分享
        console.log('用户取消分享');
      }
    } catch (error) {
      Alert.alert('分享失败', '无法分享此文章，请稍后再试');
      console.error('分享错误:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Timer icon button - added next to font size button */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={onReviewedWordsToggle}
      >
        <Ionicons name="timer-outline" size={25} color="#333" style={{ marginTop: 3 }} />
      </TouchableOpacity>

      {/* 字体大小按钮 - 点击弹出选项窗口 */}
      <TouchableOpacity
        style={styles.controlButton} 
        onPress={handleFontButtonPress}
        onLayout={onButtonLayout}
      >
        <FontSizeIcon size={22} color="#333" />
      </TouchableOpacity>

      {/* 点击外部关闭弹窗的透明遮罩 */}
      {showFontModal && (
        <TouchableOpacity 
          style={styles.overlayTouch}
          onPress={() => {
            console.log('[HeaderReadingControls] Overlay touched, closing modal');
            setShowFontModal(false);
          }}
          activeOpacity={1}
        />
      )}

      {/* 字体设置弹出窗口 */}
      {showFontModal && (
        <View style={[styles.dropdownContainer, {
          top: buttonLayout.y + buttonLayout.height + 8,
          left: calculatePopupPosition(),
        }]}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.compactButton} 
              onPress={increaseFontSize}
              activeOpacity={0.7}
            >
              <Text style={styles.compactButtonText}>A+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.compactButton} 
              onPress={decreaseFontSize}
              activeOpacity={0.7}
            >
              <Text style={styles.compactButtonText}>A-</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.compactButton} 
              onPress={increaseLineHeight}
              activeOpacity={0.7}
            >
              <Text style={styles.compactButtonText}>H+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.compactButton} 
              onPress={decreaseLineHeight}
              activeOpacity={0.7}
              disabled={!hasIncreasedLineHeight || lineHeight <= defaultLineHeight}
            >
              <Text style={[
                styles.compactButtonText,
                (!hasIncreasedLineHeight || lineHeight <= defaultLineHeight) && styles.disabledButtonText
              ]}>H-</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 新的中英文翻译切换组件 */}
      <TranslationToggle 
        showTranslation={showTranslation}
        onToggle={onTranslationToggle}
        isLoading={isTranslating}
      />

      {/* 收藏按钮 - 使用自定义SVG图标 */}
      <TouchableOpacity 
        style={[styles.controlButton, styles.favoriteButton]} 
        onPress={() => {
          console.log('[HeaderReadingControls] Favorite button pressed, current state:', isFavorited);
          onFavoriteToggle();
        }}
      >
        <StarIcon 
          filled={isFavorited}
          size={20}
          color={isFavorited ? "#FFD700" : "#333"}
        />
      </TouchableOpacity>

      {/* 分享按钮 - 使用自定义SVG图标 */}
      {/*<TouchableOpacity */}
      {/*  style={[styles.controlButton, styles.shareButton]} */}
      {/*  onPress={() => {*/}
      {/*    console.log('[HeaderReadingControls] Share button pressed');*/}
      {/*    handleShare();*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <ShareIcon size={20} color="#333" />*/}
      {/*</TouchableOpacity>*/}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  favoriteButton: {
    // 移除不规范的样式属性
  },
  shareButton: {
    // 移除不规范的样式属性
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    width: 4 * 32 + 2 * 2 * 4 + 3 * 4 + 16, // 4个按钮(32px) + 按钮margin(16px) + 3个间距(4px) + padding(16px) = 172px
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 25,
    zIndex: 9999, // 大幅提高弹窗层级
  },
  overlayTouch: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 9998, // 提高遮罩层级但低于弹窗
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  compactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 2,
    elevation: 30,
    zIndex: 10000, // 确保按钮在最上层
  },
  compactButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
    fontWeight: 'normal',
  },
  // 移除了重复的 overlayTouch 定义
  // 移除了不需要的 modalOverlay, modalContent, modalOption, modalOptionText 样式
});