import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onValuesChange: (low: number, high: number) => void;
  step?: number;
}

const THUMB_RADIUS = 12;
const THUMB_SIZE = THUMB_RADIUS * 2;
const TRACK_HEIGHT = 4;
const HIT_SLOP = 20; // Extra touch area around thumb

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  low,
  high,
  onValuesChange,
  step = 1,
}) => {
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  // Use refs for values that PanResponder needs — avoids stale closure problem
  const lowRef = useRef(low);
  const highRef = useRef(high);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const onChangeRef = useRef(onValuesChange);

  // Keep refs in sync with props
  lowRef.current = low;
  highRef.current = high;
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  onChangeRef.current = onValuesChange;

  // Local state for live display during drag — persists until parent props catch up
  const [localLow, setLocalLow] = useState(low);
  const [localHigh, setLocalHigh] = useState(high);

  // Sync from parent props when not dragging
  const isDragging = useRef(false);
  if (!isDragging.current) {
    if (localLow !== low) setLocalLow(low);
    if (localHigh !== high) setLocalHigh(high);
  }

  const displayLow = localLow;
  const displayHigh = localHigh;

  const range = max - min || 1;

  const valueToFraction = (value: number) => {
    return Math.max(0, Math.min(1, (value - min) / range));
  };

  const posToValue = useCallback((pageX: number) => {
    const w = trackWidth.current;
    const x = trackX.current;
    if (w <= 0) return minRef.current;
    const fraction = Math.max(0, Math.min(1, (pageX - x) / w));
    const raw = minRef.current + fraction * (maxRef.current - minRef.current);
    const s = stepRef.current;
    const stepped = Math.round(raw / s) * s;
    return Math.max(minRef.current, Math.min(maxRef.current, stepped));
  }, []);

  // Determine which thumb is closer to touch point
  const activeThumb = useRef<'low' | 'high' | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        const touchX = evt.nativeEvent.pageX;
        const w = trackWidth.current;
        const x = trackX.current;
        if (w <= 0) return;

        const range = (maxRef.current - minRef.current) || 1;
        const lowFrac = (lowRef.current - minRef.current) / range;
        const highFrac = (highRef.current - minRef.current) / range;
        const lowPos = x + lowFrac * w;
        const highPos = x + highFrac * w;

        const distLow = Math.abs(touchX - lowPos);
        const distHigh = Math.abs(touchX - highPos);

        activeThumb.current = distLow <= distHigh ? 'low' : 'high';

        const value = posToValue(touchX);
        if (activeThumb.current === 'low') {
          const clamped = Math.min(value, highRef.current - stepRef.current);
          lowRef.current = clamped;
          setLocalLow(clamped);
        } else {
          const clamped = Math.max(value, lowRef.current + stepRef.current);
          highRef.current = clamped;
          setLocalHigh(clamped);
        }
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const value = posToValue(touchX);

        if (activeThumb.current === 'low') {
          const clamped = Math.min(value, highRef.current - stepRef.current);
          lowRef.current = clamped;
          setLocalLow(clamped);
        } else if (activeThumb.current === 'high') {
          const clamped = Math.max(value, lowRef.current + stepRef.current);
          highRef.current = clamped;
          setLocalHigh(clamped);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        onChangeRef.current(lowRef.current, highRef.current);
        activeThumb.current = null;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        activeThumb.current = null;
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
    // Measure absolute position for pageX calculations
    (e.target as any)?.measure?.(
      (_x: number, _y: number, _w: number, _h: number, pageX: number) => {
        trackX.current = pageX;
      }
    );
  };

  const handleTrackRef = useCallback((ref: View | null) => {
    if (ref) {
      // Delay measure to ensure layout is complete
      setTimeout(() => {
        ref.measure((_x, _y, w, _h, pageX) => {
          trackWidth.current = w;
          trackX.current = pageX;
        });
      }, 100);
    }
  }, []);

  const lowFrac = valueToFraction(displayLow);
  const highFrac = valueToFraction(displayHigh);
  const leftPercent = `${lowFrac * 100}%`;
  const widthPercent = `${(highFrac - lowFrac) * 100}%`;

  return (
    <View style={styles.container}>
      {/* Selected value display */}
      <View style={styles.valuesRow}>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>Min</Text>
          <Text style={styles.valueText}>₹ {displayLow}</Text>
        </View>
        <View style={styles.valueSeparator}>
          <Text style={styles.separatorText}>to</Text>
        </View>
        <View style={[styles.valueBox, { alignItems: 'flex-end' }]}>
          <Text style={styles.valueLabel}>Max</Text>
          <Text style={styles.valueText}>₹ {displayHigh}</Text>
        </View>
      </View>

      {/* Slider */}
      <View
        ref={handleTrackRef}
        style={styles.trackArea}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={styles.track} />

        {/* Selected range highlight */}
        <View style={[styles.selectedTrack, { left: leftPercent, width: widthPercent }]} />

        {/* Low thumb */}
        <View
          style={[
            styles.thumbOuter,
            { left: leftPercent, marginLeft: -THUMB_RADIUS },
          ]}
        >
          <View style={styles.thumb} />
        </View>

        {/* High thumb */}
        <View
          style={[
            styles.thumbOuter,
            { left: `${highFrac * 100}%`, marginLeft: -THUMB_RADIUS },
          ]}
        >
          <View style={styles.thumb} />
        </View>
      </View>

      {/* Range labels */}
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>₹{min}</Text>
        <Text style={styles.rangeText}>₹{max}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  valueBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  valueSeparator: {
    paddingHorizontal: 10,
  },
  separatorText: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: FONTS.display.medium,
  },
  valueLabel: {
    fontSize: 10,
    color: COLORS.text.muted,
    fontFamily: FONTS.display.medium,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: 15,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  trackArea: {
    height: THUMB_SIZE + HIT_SLOP * 2,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: THUMB_RADIUS,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: '#E8E8E8',
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  selectedTrack: {
    height: TRACK_HEIGHT,
    backgroundColor: COLORS.primary,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
  },
  thumbOuter: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE + HIT_SLOP * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginHorizontal: THUMB_RADIUS,
  },
  rangeText: {
    fontSize: 11,
    color: COLORS.text.muted,
    fontFamily: FONTS.display.regular,
  },
});

export default PriceRangeSlider;
