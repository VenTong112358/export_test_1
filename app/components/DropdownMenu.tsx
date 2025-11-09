import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  onHistoryPress: () => void;
  onFavoritesPress: () => void;
  onNotesPress: () => void;
  buttonPosition: { x: number; y: number; width: number; height: number };
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  visible,
  onClose,
  onHistoryPress,
  onFavoritesPress,
  onNotesPress,
  buttonPosition,
}) => {
  const { theme } = useTheme();

  const handleBackdropPress = () => {
    onClose();
  };

  const handleHistoryPress = () => {
    onHistoryPress();
    onClose();
  };

  const handleFavoritesPress = () => {
    onFavoritesPress();
    onClose();
  };

  const handleNotesPress = () => {
    onNotesPress();
    onClose();
  };

  // 计算菜单位置 - 使用指定的CSS尺寸
  const menuWidth = 147;
  const menuHeight = 171;
  const menuX = Math.min(buttonPosition.x + buttonPosition.width - menuWidth, width - menuWidth - 16);
  const menuY = buttonPosition.y + buttonPosition.height + 8;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <View
          style={[
            styles.menu,
            {
              position: 'absolute',
              left: menuX,
              top: menuY,
              width: menuWidth,
              height: menuHeight,
            },
          ]}
        >
          <Svg
             width={menuWidth}
             height={menuHeight}
           >
            {/* SVG背景 */}
            <Path
              d={`M0,8 Q0,0 8,0 L${menuWidth-8},0 Q${menuWidth},0 ${menuWidth},8 L${menuWidth},${menuHeight-8} Q${menuWidth},${menuHeight} ${menuWidth-8},${menuHeight} L8,${menuHeight} Q0,${menuHeight} 0,${menuHeight-8} Z`}
              fill={theme.colors.background}
              stroke="#E0E0E0"
              strokeWidth="1"
            />
          </Svg>
          
          <View style={styles.menuContent}>
          {/* 历史文章 */}
          <TouchableOpacity style={styles.menuItem} onPress={handleHistoryPress}>
            <Ionicons name="time-outline" size={20} color="#0C1A30" />
            <Text style={styles.menuText}>历史文章</Text>
          </TouchableOpacity>

          {/* 分割线 */}
          <View style={styles.divider} />

          {/* 收藏菜单 */}
          <TouchableOpacity style={styles.menuItem} onPress={handleFavoritesPress}>
            <Ionicons name="heart-outline" size={20} color="#0C1A30" />
            <Text style={styles.menuText}>收藏菜单</Text>
          </TouchableOpacity>

          {/* 分割线 */}
          <View style={styles.divider} />

          {/* 我的笔记 */}
          <TouchableOpacity style={styles.menuItem} onPress={handleNotesPress}>
            <Ionicons name="document-text-outline" size={20} color="#0C1A30" />
            <Text style={styles.menuText}>我的笔记</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '500',
    color: '#0C1A30',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
});