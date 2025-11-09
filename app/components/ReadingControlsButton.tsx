import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ReadingControls } from './ReadingControls';

const { width, height } = Dimensions.get('window');

interface ReadingControlsButtonProps {
  fontSize: number;
  lineHeight: number;
  showTranslation: boolean;
  isFavorited: boolean;
  logId: string;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onTranslationToggle: () => void;
  onFavoriteToggle: () => void;
}

export const ReadingControlsButton: React.FC<ReadingControlsButtonProps> = (props) => {
  return (
    <View style={styles.floatingContainer}>
      <ReadingControls {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: height * 0.12, // 右上角位置
    right: width * 0.05,
    zIndex: 1000,
  },
});