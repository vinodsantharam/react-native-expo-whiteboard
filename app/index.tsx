import { Dimensions, Platform, View } from "react-native";

import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Button, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useWindowDimensions } from "react-native";

export default function Index() {
  const { height, width } = useWindowDimensions();

  console.log(Platform.OS, height, width);

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      {Rectangle({ x: width / 2, y: height / 2 })}
      {Rectangle({ x: 0, y: 0 })}
    </GestureHandlerRootView>
  );
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

const { width, height } = Dimensions.get("screen");

function Rectangle({ x, y }: { x: number; y: number }) {
  const pressed = useSharedValue<boolean>(false);

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    })
    .onBegin(() => {
      pressed.value = true;
    })
    .onUpdate((event) => {
      const maxTranslateX = width - 25;
      const maxTranslateY = height - 25;

      translationX.value = clamp(
        prevTranslationX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      translationY.value = clamp(
        prevTranslationY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );
    })
    .onEnd((event) => {
      pressed.value = false;
    })
    .runOnJS(true);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: withTiming(pressed.value ? 1.2 : 1) },
    ],
    backgroundColor: pressed.value ? "#FFE04B" : "#b58df1",
  }));

  return (
    <View
      style={[
        styles.container,
        { transform: [{ translateX: x }, { translateY: y }] },
      ]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.box, animatedStyles]} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: "black",
    position: "absolute",
    borderRadius: 20,
  },
});
