import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showNotificationButton?: boolean;
  showHamburgerMenu?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onHamburgerPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
  iconColor?: string;
  customRightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Read Ease',
  showBackButton = false,
  showMenuButton = true,
  showNotificationButton = true,
  showHamburgerMenu = false,
  onBackPress,
  onMenuPress,
  onNotificationPress,
  onHamburgerPress,
  backgroundColor,
  titleColor = '#FC9B33',
  iconColor = '#0C1A30',
  customRightComponent,
}: HeaderProps) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    }
    // 默认菜单行为可以在这里添加
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('../../test');
    }
  };

  const handleHamburgerPress = () => {
    if (onHamburgerPress) {
      onHamburgerPress();
    }
  };

  return (
    <View style={[
      styles.header,
      { 
        backgroundColor: backgroundColor || theme.colors.background,
      }
    ]}>
      {/* Left Button */}
      <View style={styles.leftButton}>
        {showBackButton ? (
          <TouchableOpacity style={styles.button} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : showMenuButton ? (
          <TouchableOpacity style={styles.button} onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Title */}
      <Text style={[styles.headerTitle, { color: titleColor }]}>
        {title}
      </Text>

      {/* Right Button */}
      <View style={styles.rightButton}>
        {customRightComponent ? (
          customRightComponent
        ) : showHamburgerMenu ? (
          <TouchableOpacity style={styles.button} onPress={handleHamburgerPress}>
            <Ionicons name="menu" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : showNotificationButton ? (
          <TouchableOpacity style={styles.button} onPress={handleNotificationPress}>
            <Ionicons name="notifications" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 9990, // 确保Header在Modal之上
    height: 70,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  leftButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightButton: {
    minWidth: 40,
    alignItems: 'flex-end',
    // 增加宽度以容纳5个控制按钮
    width: 'auto',
    maxWidth: 200,
  },
  button: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
});