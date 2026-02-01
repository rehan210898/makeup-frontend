import React, { useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
  snapPoints?: number[];
  initialSnap?: number;
  closeOnBackdrop?: boolean;
  backdropIntensity?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  children,
  showHandle = true,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  closeOnBackdrop = true,
  backdropIntensity = 50,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const currentSnapIndex = useSharedValue(initialSnap);

  const snapPointsPixels = snapPoints.map((p) => SCREEN_HEIGHT * (1 - p));
  const minTranslateY = snapPointsPixels[snapPointsPixels.length - 1];
  const maxTranslateY = SCREEN_HEIGHT;

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(snapPointsPixels[initialSnap], {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialSnap, snapPointsPixels, translateY, backdropOpacity]);

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateY = snapPointsPixels[currentSnapIndex.value] + event.translationY;
      translateY.value = Math.max(minTranslateY, Math.min(maxTranslateY, newTranslateY));
    })
    .onEnd((event) => {
      // Determine which snap point to go to
      const velocity = event.velocityY;
      const currentY = translateY.value;

      // If swiping down fast, close
      if (velocity > 500) {
        runOnJS(closeModal)();
        return;
      }

      // Find closest snap point
      let closestSnap = 0;
      let closestDistance = Math.abs(currentY - snapPointsPixels[0]);

      snapPointsPixels.forEach((snapY, index) => {
        const distance = Math.abs(currentY - snapY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnap = index;
        }
      });

      // If past the threshold, close
      if (currentY > SCREEN_HEIGHT * 0.7) {
        runOnJS(closeModal)();
        return;
      }

      currentSnapIndex.value = closestSnap;
      translateY.value = withSpring(snapPointsPixels[closestSnap], {
        damping: 20,
        stiffness: 300,
      });
    });

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.container}>
        <AnimatedPressable
          style={[styles.backdrop, animatedBackdropStyle]}
          onPress={closeOnBackdrop ? closeModal : undefined}
        >
          <BlurView intensity={backdropIntensity} tint="dark" style={StyleSheet.absoluteFill} />
        </AnimatedPressable>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.modal, animatedModalStyle]}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.glassOverlay} />

            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.content}
            >
              {children}
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: SCREEN_HEIGHT * 0.3,
    maxHeight: SCREEN_HEIGHT * 0.95,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
});

export default GlassModal;
