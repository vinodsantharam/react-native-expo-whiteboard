import {
  Platform,
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  SafeAreaView,
  PanResponder,
  Animated,
  StatusBar,
} from "react-native";

import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
  const roomId = "react-native-expo-whiteboard";

  return (
    <LiveblocksProvider publicApiKey="pk_dev_bMLjei0FFPTcpaOaPjdL1XrDtWL-FSQV5QFmzsjqpTEZCkI_3VQdqZlmZWFqhdyX">
      <RoomProvider
        id={roomId}
        initialPresence={{ selectedShape: null }}
        initialStorage={{ shapes: new LiveMap() }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#eeeeee",}}>
          <StatusBar barStyle="dark-content" />
          <GestureHandlerRootView
            style={{
              flex: 1,
              backgroundColor: "#eeeeee",
            }}
          >
            <Canvas />
          </GestureHandlerRootView>
        </SafeAreaView>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

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
      console.log("onCanvasPointerUp", isDragging);

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
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={insertRectangle}
          style={styles.toolbarButton}
        >
          <Text style={{ color: "#181818" }}>Rectangle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={deleteRectangle}
          style={styles.toolbarButton}
        >
          <Text style={{ color: "#181818" }}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => history.undo()}
          style={styles.toolbarButton}
        >
          <Text style={{ color: "#181818" }}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => history.redo()}
          style={styles.toolbarButton}
        >
          <Text style={{ color: "#181818" }}>Redo</Text>
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
  const shapeIdRef = useRef("");
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

  const statusBarHeight = Platform.OS === "ios" ? Constants.statusBarHeight : 0;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (e, gestureState) => {
        const rectangleX = gestureState.moveX - e.nativeEvent.locationX;
        const rectangleY =
          gestureState.moveY - e.nativeEvent.locationY - statusBarHeight;

        pan.x.setValue(gestureState.dx);
        pan.y.setValue(gestureState.dy);

        console.log("move", Math.ceil(rectangleX), Math.ceil(rectangleY));
        onCanvasPointerMove(
          {
            x: Math.ceil(rectangleX),
            y: Math.ceil(rectangleY),
            isDragging: isDraggingRef.current,
          },
          shapeIdRef.current
        );

        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gestureState);
      },
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
      onPanResponderEnd: () => {
        onCanvasPointerUp(null, shapeIdRef.current);
      },
    })
  ).current;

  if (!isDragging) {
    pan.setOffset({ x: x, y: y });
  }

  return (
    <Animated.View
      style={[
        styles.box,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableWithoutFeedback
        onPressIn={() => onShapePointerDown(shapeIdRef.current)}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 3,
            borderColor: selectionColor,
            backgroundColor: fill || "#CCC",
          }}
        />
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    flexDirection: "row",
    borderRadius: 10,
    alignSelf: "center",
    top: "3%",
    backgroundColor: "white",
    shadowOffset: { width: 0, height: 2 },
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  toolbarButton: {
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    margin: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  box: {
    position: "absolute",
    width: 100,
    height: 100,
  },
});
