import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MyProgressBarProps {
  progress: number; // 0~1 之间的小数
  height?: number;
  backgroundColor?: string;
  barColor?: string;
  borderRadius?: number;
}

const MyProgressBar: React.FC<MyProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = '#F5F5F5',
  barColor = '#FC9B33',
  borderRadius = 4,
  borderColor = '#FC9B33',
  borderWidth = 1,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius,
          borderColor,
          borderWidth,
        },
      ]}
    >
      <View
        style={{
          height,
          width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
          backgroundColor: barColor,
          borderRadius,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default MyProgressBar;
