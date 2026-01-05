import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

interface RadarChartProps {
  data: {
    label: string;
    labelEn?: string; // English label
    value: number; // 0-100
  }[];
  size?: number;
  maxValue?: number;
}

// Label mapping for English translations
const labelEnMap: { [key: string]: string } = {
  '单词': 'Words',
  '语法': 'Grammar',
  '阅读': 'Reading',
};

const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  size = 200,
  maxValue = 100 
}) => {
  const centerX = size / 2;
  const centerY = size / 2 + 20; // Move chart down to accommodate top label
  const radius = size * 0.35;
  
  const numAxes = data.length;
  const angleStep = (2 * Math.PI) / numAxes;
  
  // Calculate points for the data polygon
  const dataPoints = data.map((item, index) => {
    const angle = (index * angleStep) - (Math.PI / 2); // Start from top
    const valueRadius = (item.value / maxValue) * radius;
    const x = centerX + valueRadius * Math.cos(angle);
    const y = centerY + valueRadius * Math.sin(angle);
    return { x, y };
  });
  
  // Create polygon points string
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Calculate label positions (outside the chart)
  const labelPositions = data.map((item, index) => {
    const angle = (index * angleStep) - (Math.PI / 2);
    const labelRadius = radius + 35; // Increased to accommodate two lines
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { x, y, angle };
  });
  
  // Generate grid circles (3 levels)
  const gridLevels = [0.33, 0.66, 1.0];
  
  // Increase SVG height to accommodate labels
  const svgHeight = size + 50;
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <Circle
            key={`grid-${i}`}
            cx={centerX}
            cy={centerY}
            r={radius * level}
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="1"
          />
        ))}
        
        {/* Grid lines (axes) */}
        {data.map((item, index) => {
          const angle = (index * angleStep) - (Math.PI / 2);
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          return (
            <Line
              key={`axis-${index}`}
              x1={centerX}
              y1={centerY}
              x2={x2}
              y2={y2}
              stroke="#E5E5E5"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Data polygon */}
        <Polygon
          points={polygonPoints}
          fill="#FC9B33"
          fillOpacity={0.3}
          stroke="#FC9B33"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#FC9B33"
          />
        ))}
        
        {/* Labels - Chinese and English */}
        {labelPositions.map((pos, index) => {
          const item = data[index];
          const englishLabel = item.labelEn || labelEnMap[item.label] || '';
          return (
            <React.Fragment key={`label-${index}`}>
              {/* Chinese label */}
              <SvgText
                x={pos.x}
                y={pos.y - 6}
                fontSize="12"
                fill="#333"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily={Platform.select({ ios: 'Inter', android: 'sans-serif' })}
                fontWeight="500"
              >
                {item.label}
              </SvgText>
              {/* English label */}
              {englishLabel && (
                <SvgText
                  x={pos.x}
                  y={pos.y + 8}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontFamily={Platform.select({ ios: 'Inter', android: 'sans-serif' })}
                  fontWeight="400"
                >
                  {englishLabel}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RadarChart;

