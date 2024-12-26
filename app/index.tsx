import {
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  SafeAreaView,
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
import {
  LiveblocksProvider,
  shallow,
  useHistory,
  useMutation,
  useStorage,
} from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "@/liveblocks.config";
import { useState } from "react";

export default function Index() {
  const { height, width } = useWindowDimensions();

  const roomId = "react-native-expo-whiteboard";

  return (
    <LiveblocksProvider publicApiKey="pk_dev_bMLjei0FFPTcpaOaPjdL1XrDtWL-FSQV5QFmzsjqpTEZCkI_3VQdqZlmZWFqhdyX">
      <RoomProvider
        id={roomId}
        initialPresence={{ selectedShape: null }}
        initialStorage={{ shapes: new LiveMap() }}
      >
        <SafeAreaView style={{ flex: 1 }}>
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
        </SafeAreaView>
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
  onCanvasPointerUp: (e: any, id: string) => void;
};

function Canvas() {
  const [isDragging, setIsDragging] = useState(false);
  const shapeIds = useStorage(
    (root) => Array.from(root.shapes.keys()),
    shallow
  );

  const history = useHistory();

  const deleteRectangle = useMutation(({ storage, self, setMyPresence }) => {
    const shapeId = self.presence.selectedShape;
    if (!shapeId) {
      return;
    }

    storage.get("shapes").delete(shapeId);
    setMyPresence({ selectedShape: null });
  }, []);

  const insertRectangle = useMutation(({ storage, setMyPresence }) => {
    const shapeId = Date.now().toString();
    const shape = new LiveObject({
      x: getRandomInt(0),
      y: getRandomInt(0),
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

      if (!isDragging) {
        return;
      }

      const shapeId = self.presence.selectedShape;
      if (!shapeId) {
        return;
      }

      const shape = storage.get("shapes").get(shapeId);

      if (shape) {
        shape.update({
          x: e.x,
          y: e.y,
        });
      }
    },
    [isDragging]
  );

  return (
    <View style={{ flex: 1 }}>
     <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
     <TouchableOpacity
        onPress={insertRectangle}
        style={{ padding: 10, backgroundColor: "lightpink", borderRadius: 10 }}
      >
        <Text style={{ color: "black" }}>Insert Rectangle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={deleteRectangle}
        style={{ padding: 10, backgroundColor: "lightpink", borderRadius: 10 }}
      >
        <Text style={{ color: "black" }}>Delete Rectangle</Text>
      </TouchableOpacity>
      </View> 
      {shapeIds?.map((id) => (
        <Rectangle
          key={id}
          id={id}
          onShapePointerDown={onShapePointerDown}
          onCanvasPointerMove={onCanvasPointerMove}
          onCanvasPointerUp={onCanvasPointerUp}
        />
      ))}
    </View>
  );
}

function Rectangle({
  id,
  onShapePointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
}: RectangleProps) {
  const { x, y, fill } = useStorage((root) => root.shapes.get(id));
  const pressed = useSharedValue<boolean>(false);

  console.log('init', Math.ceil(x), Math.ceil(y));

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

      console.log('move', Math.ceil(event.x), Math.ceil(event.y));
    //  console.log('move - absolute', Math.ceil(event.absoluteX), Math.ceil(event.absoluteY));
    // console.log('move - translation', Math.ceil(event.translationX), Math.ceil(event.translationY));


      onCanvasPointerMove({ x: event.absoluteX, y: event.absoluteY }, id);
    })
    .onEnd((event) => {
      pressed.value = false;
      onCanvasPointerUp(null, id);
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
    <TouchableOpacity
      onPressIn={(e) => onShapePointerDown(e, id)}
      style={[
        styles.container,
        { transform: [{ translateX: x }, { translateY: y }] },
      ]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.box, animatedStyles]} />
      </GestureDetector>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    position: "absolute",
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: "black",
    position: "absolute",  
    borderRadius: 20,
  },
});
