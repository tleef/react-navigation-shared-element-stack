import * as React from "react";
import { Animated, Platform, StyleSheet, View, ViewProps } from "react-native";
import { Screen, ScreenContainer, screensEnabled } from "react-native-screens";
import { Route } from "@react-navigation/native";
import {
  Scene,
  SceneTransitioner,
  SceneTransitionerClass,
  Stage
} from "@tleef/react-native-shared-element-scenes/lib";
import {
  SharedElementStackDescriptorMap,
  SharedElementStackNavigationOptions
} from "../types";

type Props = {
  descriptors: SharedElementStackDescriptorMap;
  routes: Route<string>[];
  onSceneTransitionerRef: (sceneTransitioner: SceneTransitionerClass) => void;
};

const FAR_FAR_AWAY = 9000;

const MaybeScreenContainer = ({
  enabled,
  style,
  ...rest
}: ViewProps & {
  enabled: boolean;
  children: React.ReactNode;
}) => {
  if (enabled && screensEnabled()) {
    return <ScreenContainer style={style} {...rest} />;
  }

  return (
    <View
      collapsable={!enabled}
      removeClippedSubviews={Platform.OS !== "ios" && enabled}
      style={[style, { overflow: "hidden" }]}
      {...rest}
    />
  );
};

const MaybeScreen = ({
  enabled,
  active,
  style,
  ...rest
}: ViewProps & {
  enabled: boolean;
  active: number | Animated.AnimatedInterpolation;
  children: React.ReactNode;
}) => {
  if (enabled && screensEnabled()) {
    // @ts-ignore
    return <Screen active={active} style={style} {...rest} />;
  }

  return (
    <View
      style={[
        style,
        {
          overflow: "hidden",
          // Position the screen offscreen to take advantage of offscreen perf optimization
          // https://facebook.github.io/react-native/docs/view#removeclippedsubviews
          // This can be useful if screens is not enabled
          // It's buggy on iOS, so we don't enable it there
          top:
            enabled && typeof active === "number" && !active ? FAR_FAR_AWAY : 0
        }
      ]}
      {...rest}
    />
  );
};

export default class SceneStack extends React.Component<Props> {
  render() {
    const { routes, descriptors, onSceneTransitionerRef } = this.props;

    // Screens is buggy on iOS, so we don't enable it there
    // For modals, usually we want the screen underneath to be visible, so also disable it there
    const isScreensEnabled = Platform.OS !== "ios";

    return (
      <Stage>
        <MaybeScreenContainer
          enabled={isScreensEnabled}
          style={StyleSheet.absoluteFill}
        >
          {routes.map((route, index, self) => {
            const descriptor = descriptors[route.key];

            // Display current screen and a screen beneath.
            let isScreenActive: Animated.AnimatedInterpolation | 0 | 1 =
              index >= self.length - 2 ? 1 : 0;

            const { sceneStyle, sceneId } = descriptor
              ? descriptor.options
              : ({} as SharedElementStackNavigationOptions);

            return (
              <MaybeScreen
                key={route.key}
                style={StyleSheet.absoluteFill}
                enabled={isScreensEnabled}
                active={isScreenActive}
                pointerEvents="box-none"
              >
                <Scene
                  sceneId={sceneId || route.key}
                  style={[StyleSheet.absoluteFill, sceneStyle]}
                >
                  {descriptor.render()}
                </Scene>
              </MaybeScreen>
            );
          })}
        </MaybeScreenContainer>
        <SceneTransitioner wrappedComponentRef={onSceneTransitionerRef} />
      </Stage>
    );
  }
}
