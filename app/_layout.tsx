import { RoomProvider } from "@liveblocks/react";
import { Stack } from "expo-router";

window.addEventListener = () => {}; // workaround until a solution is found to handle reconnection in RN
window.postMessage = () => {}; // used for Liveblocks DevTools. Not supported by RN
global.URL = URL; // need polyfill in RN

const roomId = "react-native-todo-list";

// const initialStorage = () => ({
//   todos: new LiveList([]),
// });


export default function RootLayout() {
  return<Stack screenOptions={{headerShown: false}} />;

}

