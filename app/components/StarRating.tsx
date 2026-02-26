import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designTokensColors as c } from '../../constants/designTokens';

interface StarRatingProps {
  value: number; // 0–5
  onChange: (value: number) => void;
  starSize?: number;
  gap?: number;
  disabled?: boolean;
}

const STAR_COUNT = 5;

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  starSize = 28,
  gap = 8,
  disabled = false,
}) => {
  return (
    <View style={[styles.row, { gap }]}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const rating = i + 1;
        const filled = value >= rating;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => !disabled && onChange(rating)}
            activeOpacity={0.7}
            style={styles.starTouch}
            accessibilityRole="button"
            accessibilityLabel={`${rating} star${rating > 1 ? 's' : ''}`}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={starSize}
              color={filled ? c.primary : c.primary}
              style={filled ? undefined : styles.starUnfilled}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starTouch: {
    padding: 4,
  },
  starUnfilled: {
    opacity: 0.2,
  },
});
