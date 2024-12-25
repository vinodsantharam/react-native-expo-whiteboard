import {
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
} from "react-native";

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
import { LiveblocksProvider, shallow, useHistory, useMutation, useStorage } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "@/liveblocks.config";
import { useState } from "react";

export default function Index() {
  const { height, width } = useWindowDimensions();

  console.log(Platform.OS, height, width);
const roomId = "react-native-expo-whiteboard";


  return (
    <LiveblocksProvider
      publicApiKey='pk_dev_bMLjei0FFPTcpaOaPjdL1XrDtWL-FSQV5QFmzsjqpTEZCkI_3VQdqZlmZWFqhdyX'
    >
    <RoomProvider
      id={roomId}
      initialPresence={{ selectedShape: null }}
      initialStorage={{ shapes: new LiveMap() }}
    >
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: "white",
        }}
      >
        <Canvas />

        {/* {Rectangle({ x: width / 2, y: height / 2 })}
      {Rectangle({ x: 0, y: 0 })} */}
      </GestureHandlerRootView>
    </RoomProvider>
    </LiveblocksProvider>
  );
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

const { width, height } = Dimensions.get("screen");

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function getRandomColor(): string {
  return COLORS[getRandomInt(COLORS.length)];
}

type RectangleProps = {
  id: string;
  onShapePointerDown: (e: any, id: string) => void;
  onCanvasPointerMove: (e: any, id: string) => void;
};

function Canvas() {
  const [isDragging, setIsDragging] = useState(false);
  const shapeIds = useStorage(
    (root) => Array.from(root.shapes.keys()),
    shallow
  );

  console.log(shapeIds);

  const history = useHistory();

  const insertRectangle = useMutation(({ storage, setMyPresence }) => {
    const shapeId = Date.now().toString();
    const shape = new LiveObject({
      x: getRandomInt(300),
      y: getRandomInt(300),
      fill: getRandomColor(),
    });
    storage.get("shapes").set(shapeId, shape);
    setMyPresence({ selectedShape: shapeId }, { addToHistory: true });
  }, []);

  const onShapePointerDown = useMutation(
    ({ setMyPresence }, e: any, shapeId: string) => {
      
      history.pause();

      setMyPresence({ selectedShape: shapeId }, { addToHistory: true });
      setIsDragging(true);
    },
    [history]
  );

  const onCanvasPointerUp = useMutation(
    ({ setMyPresence }) => {
      if (!isDragging) {
        setMyPresence({ selectedShape: null }, { addToHistory: true });
      }

      setIsDragging(false);
      history.resume();
    },
    [isDragging, history]
  );


  const onCanvasPointerMove = useMutation(
    ({ storage, self }, e: any) => {

      // console.log(e)

      // if (!isDragging) {
      //   return;
      // }

      // console.log(self.presence.selectedShape)
      debugger
      const shapeId = self.presence.selectedShape;
      if (!shapeId) {
        return;
      }

      const shape = storage.get("shapes").get(shapeId);

      if (shape) {
        shape.update({
          x: e.absoluteX - 50,
          y: e.absoluteY - 50,
        });
      }
    },
    [isDragging]
  );

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={insertRectangle}
        style={{ padding: 100, backgroundColor: "lightpink", borderRadius: 10 }}
      >
        <Text style={{ color: "black" }}>Insert Rectangle</Text>
      </TouchableOpacity>
      {shapeIds?.map((id) => (
        <Rectangle key={id} id={id} onShapePointerDown={onShapePointerDown} onCanvasPointerMove={onCanvasPointerMove}/>
      ))}
    </View>
  );
}

// function Rectangle({ x, y }: { x: number; y: number }) {
//   const pressed = useSharedValue<boolean>(false);

//   const translationX = useSharedValue(0);
//   const translationY = useSharedValue(0);
//   const prevTranslationX = useSharedValue(0);
//   const prevTranslationY = useSharedValue(0);

//   const pan = Gesture.Pan()
//     .minDistance(1)
//     .onStart(() => {
//       prevTranslationX.value = translationX.value;
//       prevTranslationY.value = translationY.value;
//     })
//     .onBegin(() => {
//       pressed.value = true;
//     })
//     .onUpdate((event) => {
//       const maxTranslateX = width - 25;
//       const maxTranslateY = height - 25;

//       translationX.value = clamp(
//         prevTranslationX.value + event.translationX,
//         -maxTranslateX,
//         maxTranslateX
//       );
//       translationY.value = clamp(
//         prevTranslationY.value + event.translationY,
//         -maxTranslateY,
//         maxTranslateY
//       );
//     })
//     .onEnd((event) => {
//       pressed.value = false;
//     })
//     .runOnJS(true);

//   const animatedStyles = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: translationX.value },
//       { translateY: translationY.value },
//       { scale: withTiming(pressed.value ? 1.2 : 1) },
//     ],
//     backgroundColor: pressed.value ? "#FFE04B" : "#b58df1",
//   }));

//   return (
//     <View
//       style={[
//         styles.container,
//         { transform: [{ translateX: x }, { translateY: y }] },
//       ]}
//     >
//       <GestureDetector gesture={pan}>
//         <Animated.View style={[styles.box, animatedStyles]} />
//       </GestureDetector>
//     </View>
//   );
// }

function Rectangle({ id, onShapePointerDown, onCanvasPointerMove }: RectangleProps) {
  const { x, y, fill } = useStorage((root) => root.shapes.get(id)) ?? {};
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

      // console.log(event);


      onCanvasPointerMove(
        { x: translationX.value, y: translationY.value },
        id
      )
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
    <TouchableWithoutFeedback
      onPressIn={(e) => onShapePointerDown(e, id)}
      style={[
        styles.container,
        { transform: [{ translateX: x ?? 0 }, { translateY: y ?? 0 }] },
      ]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.box, animatedStyles]} />
      </GestureDetector>
    </TouchableWithoutFeedback>
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
