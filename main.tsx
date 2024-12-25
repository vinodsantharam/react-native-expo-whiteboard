import React from "react";
import { AppRegistry } from "react-native";
// import {  LiveMap } from "@liveblocks/client";
import App from "./app/index";
import { expo } from "./app.json";
import { URL } from "react-native-url-polyfill";
import { RoomProvider } from "./liveblocks.config";

window.addEventListener = (x: any) => x;
window.removeEventListener = (x: any) => x;
// global.URL = URL; // need polyfill in RN

console.log(window);

const Wrapper = () => {
  return <App />;
};

AppRegistry.registerComponent(expo.name, () => Wrapper);
