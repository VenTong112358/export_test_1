import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  style?: any;
}

export const WebIcon: React.FC<WebIconProps> = ({ name, size = 24, color = '#000', style }) => {
  if (Platform.OS === 'web') {
    // For web, use fallback text icons
    const iconClass = `icon-${name.replace(/-/g, '-')}`;
    return (
      <span 
        className={`${iconClass} icon-fallback`}
        style={{
          ...style,
          fontSize: size,
          color: color,
          display: 'inline-block',
          width: size,
          height: size,
          textAlign: 'center',
          lineHeight: `${size}px`
        }}
      />
    );
  }
  
  // For mobile, use regular Ionicons
  return <Ionicons name={name} size={size} color={color} style={style} />;
}; 