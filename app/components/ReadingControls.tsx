import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { TranslationToggle } from './TranslationToggle';

const { width, height } = Dimensions.get('window');

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

interface ReadingControlsProps {
  fontSize: number;
  lineHeight: number;
  showTranslation: boolean;
  isFavorited: boolean;
  logId: string;
  isTranslating?: boolean;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onTranslationToggle: () => void;
  onFavoriteToggle: () => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  fontSize,
  lineHeight,
  showTranslation,
  isFavorited,
  logId,
  isTranslating = false,
  onFontSizeChange,
  onLineHeightChange,
  onTranslationToggle,
  onFavoriteToggle,
}) => {
  const increaseFontSize = () => {
    if (fontSize < 24) {
      onFontSizeChange(fontSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      onFontSizeChange(fontSize - 2);
    }
  };

  const increaseLineHeight = () => {
    if (lineHeight < 2.0) {
      onLineHeightChange(lineHeight + 0.1);
    }
  };

  const decreaseLineHeight = () => {
    if (lineHeight > 1.0) {
      onLineHeightChange(lineHeight - 0.1);
    }
  };

  return (
    <View style={styles.container}>
      {/* 字体大小调节按钮 */}
      <TouchableOpacity style={styles.controlButton} onPress={decreaseFontSize}>
        <Ionicons name="text-outline" size={20} color="#333" />
        <Text style={styles.smallText}>A</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={increaseFontSize}>
        <Ionicons name="text-outline" size={24} color="#333" />
        <Text style={styles.largeText}>A</Text>
      </TouchableOpacity>

      {/* 新的中英文翻译切换组件 */}
      <View style={styles.translationContainer}>
        <TranslationToggle 
          showTranslation={showTranslation}
          onToggle={onTranslationToggle}
          isLoading={isTranslating}
        />
      </View>

      {/* 收藏按钮 - 使用自定义SVG图标 */}
      <TouchableOpacity style={[styles.controlButton, styles.favoriteButton]} onPress={onFavoriteToggle}>
        <StarIcon 
          filled={isFavorited}
          size={22}
          color={isFavorited ? "#FFD700" : "#333"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column', // 改为垂直排列
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 200, // 调整为垂直布局的高度
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4, // 垂直间距
    position: 'relative',
  },
  favoriteButton: {
    height: 17,
    borderWidth: 1,
    borderColor: '#000000',
    // 注意：React Native 不支持 calc() 和百分比定位，需要用具体数值或 Dimensions 计算
    // 这里保持原有的相对定位方式
  },
  smallText: {
    position: 'absolute',
    fontSize: 10,
    color: '#333',
    bottom: 2,
    right: 2,
  },
  largeText: {
    position: 'absolute',
    fontSize: 12,
    color: '#333',
    bottom: 2,
    right: 2,
    fontWeight: 'bold',
  },
  translationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
});