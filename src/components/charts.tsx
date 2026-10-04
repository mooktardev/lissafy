import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function useWidth(initial = 300) {
  const [width, setWidth] = useState(initial);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== width) setWidth(w);
  };
  return { width, onLayout };
}

// ---------------------------------------------------------------------------
// Donut
// ---------------------------------------------------------------------------

export function DonutChart({
  data,
  size = 160,
  thickness = 22,
  children,
}: {
  data: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2 : 0;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.cardMuted} strokeWidth={thickness} fill="none" />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * c;
              const seg = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={d.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
        </G>
      </Svg>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Barres groupées (revenus / dépenses)
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  height = 160,
  formatValue,
}: {
  data: { label: string; values: { value: number; color: string }[] }[];
  height?: number;
  formatValue: (v: number) => string;
}) {
  const theme = useTheme();
  const { width, onLayout } = useWidth();
  const labelH = 20;
  const topPad = 16;
  const chartH = height - labelH - topPad;
  const max = Math.max(1, ...data.flatMap((d) => d.values.map((v) => v.value)));
  const groupW = width / Math.max(1, data.length);
  const barsPerGroup = Math.max(1, data[0]?.values.length ?? 1);
  const barW = Math.min(16, (groupW * 0.7) / barsPerGroup);

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <SvgText x={0} y={10} fontSize={10}
              fontFamily={Fonts.medium} fill={theme.textSecondary}>
          {formatValue(max)}
        </SvgText>
        <Line x1={0} x2={width} y1={topPad} y2={topPad} stroke={theme.border} strokeDasharray="3 4" />
        <Line x1={0} x2={width} y1={topPad + chartH} y2={topPad + chartH} stroke={theme.border} />
        {data.map((d, gi) => {
          const groupX = gi * groupW + (groupW - barW * barsPerGroup - 4 * (barsPerGroup - 1)) / 2;
          return (
            <G key={gi}>
              {d.values.map((v, bi) => {
                const h = (v.value / max) * chartH;
                return (
                  <Rect
                    key={bi}
                    x={groupX + bi * (barW + 4)}
                    y={topPad + chartH - h}
                    width={barW}
                    height={Math.max(0, h)}
                    rx={Math.min(4, barW / 2)}
                    fill={v.color}
                  />
                );
              })}
              <SvgText
                x={gi * groupW + groupW / 2}
                y={height - 4}
                fontSize={11}
              fontFamily={Fonts.medium}
                fill={theme.textSecondary}
                textAnchor="middle">
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Courbes (projection)
// ---------------------------------------------------------------------------

export function LineChart({
  series,
  labels,
  height = 200,
  formatValue,
}: {
  series: { values: number[]; color: string; fill?: boolean }[];
  labels: string[];
  height?: number;
  formatValue: (v: number) => string;
}) {
  const theme = useTheme();
  const { width, onLayout } = useWidth();
  const padTop = 18;
  const padBottom = 22;
  const chartH = height - padTop - padBottom;
  const n = Math.max(2, labels.length);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => (i / (n - 1)) * (width - 8) + 4;
  const y = (v: number) => padTop + chartH - (v / max) * chartH;
  const labelEvery = Math.max(1, Math.ceil(labels.length / 6));

  return (
    <View onLayout={onLayout}>
      <Svg width={width} height={height}>
        <SvgText x={0} y={11} fontSize={10}
              fontFamily={Fonts.medium} fill={theme.textSecondary}>
          {formatValue(max)}
        </SvgText>
        {[0, 0.5, 1].map((f) => (
          <Line
            key={f}
            x1={0}
            x2={width}
            y1={padTop + chartH * f}
            y2={padTop + chartH * f}
            stroke={theme.border}
            strokeDasharray={f === 1 ? undefined : '3 4'}
          />
        ))}
        {series.map((s, si) => {
          if (s.values.length === 0) return null;
          const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
          const area = `${d} L${x(s.values.length - 1)},${padTop + chartH} L${x(0)},${padTop + chartH} Z`;
          return (
            <G key={si}>
              {s.fill ? <Path d={area} fill={s.color} opacity={0.15} /> : null}
              <Path d={d} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            </G>
          );
        })}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === labels.length - 1 ? (
            <SvgText
              key={i}
              x={x(i)}
              y={height - 4}
              fontSize={10}
              fontFamily={Fonts.medium}
              fill={theme.textSecondary}
              textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
              {l}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}
