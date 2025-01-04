import {
  Dimensions,
  Platform,
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  SafeAreaView,
  PanResponder,
  Animated,
} from "react-native";

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
  useOthers,
  useSelf,
  useStorage,
} from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "@/liveblocks.config";
import { useRef, useState } from "react";
import Constants from "expo-constants";

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
  isDragging: boolean;
  onShapePointerDown: (id: string) => void;
  onCanvasPointerMove: (e: any, id: string) => void;
  onCanvasPointerUp: (e: any, id: string) => void;
};

function Canvas() {
  const [isDragging, setIsDragging] = useState(false);
  console.log('isDragging', isDragging);
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
    ({ setMyPresence }, shapeId: string) => {
      history.pause();

      setMyPresence({ selectedShape: shapeId }, { addToHistory: true });
      setIsDragging(true);
    },
    [history]
  );

  const onCanvasPointerUp = useMutation(
    ({ setMyPresence }) => {
      console.log('onCanvasPointerUp', isDragging);

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
      console.log('onCanvasPointerMove', e.isDragging);


      if (!e.isDragging) {
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          padding: 20,
          position: "fixed",
          top: 0,
          width: "100%",
          backgroundColor: "white",
        }}
      >
        <TouchableOpacity
          onPress={insertRectangle}
          style={{
            padding: 10,
            backgroundColor: "lightpink",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "black" }}>Insert Rectangle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={deleteRectangle}
          style={{
            padding: 10,
            backgroundColor: "lightpink",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "black" }}>Delete Rectangle</Text>
        </TouchableOpacity>
      </View>
      {shapeIds?.map((id) => (
        <RectanglePanResponder
         isDragging={isDragging}
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

function RectanglePanResponder({
  isDragging,
  id,
  onShapePointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
}: RectangleProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const { x, y, fill } = useStorage((root) => root.shapes.get(id));
  console.log("init", Math.ceil(x), Math.ceil(y));
  const shapeIdRef = useRef('');
  const isDraggingRef = useRef(false);

  shapeIdRef.current = id;
  isDraggingRef.current = isDragging;

  const selectedByMe = useSelf((me) => me.presence.selectedShape === id);
  const selectedByOthers = useOthers((others) =>
    others.some((other) => other.presence.selectedShape === id)
  );
  const selectionColor = selectedByMe
    ? "blue"
    : selectedByOthers
      ? "green"
      : "transparent";

  const statusBarHeight = Platform.OS === 'ios' ? Constants.statusBarHeight : 0;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
      },
      onPanResponderMove: (e, gestureState) => {
        const rectangleX = gestureState.moveX - e.nativeEvent.locationX;
        const rectangleY = gestureState.moveY - e.nativeEvent.locationY - statusBarHeight;

        pan.x.setValue(gestureState.dx);
        pan.y.setValue(gestureState.dy);

       console.log("move", Math.ceil(rectangleX), Math.ceil(rectangleY));
       onCanvasPointerMove( {x: Math.ceil(rectangleX), y: Math.ceil(rectangleY), isDragging: isDraggingRef.current}, shapeIdRef.current);

        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gestureState)
      },
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
      onPanResponderEnd: () => {
        onCanvasPointerUp(null, shapeIdRef.current);
      },
    })
  ).current;

  if(!isDragging){
    pan.setOffset({ x: x, y: y });
  }

  return (
    <Animated.View
      style={[
        {
          ...styles.box,
          borderColor: selectionColor,
          backgroundColor: fill || "#CCC",
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
      style={{ flex: 1, backgroundColor: "transparent"
         }}
        onPressIn={() => onShapePointerDown(shapeIdRef.current)}
      ></TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 20,
  },
});
