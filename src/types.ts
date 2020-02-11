import { StyleProp, ViewStyle } from "react-native";
import {
  NavigationProp,
  ParamListBase,
  Descriptor,
  NavigationHelpers
} from "@react-navigation/native";
import { StackNavigationState } from "@react-navigation/routers";
import { SpringConfig } from "@tleef/react-native-shared-element-scenes/lib";

export type SharedElementStackNavigationEventMap = {
  /**
   * Event which fires when a transition animation starts.
   */
  transitionStart: { data: { closing: boolean } };
  /**
   * Event which fires when a transition animation ends.
   */
  transitionEnd: { data: { closing: boolean } };
};

export type SharedElementStackDescriptor = Descriptor<
  ParamListBase,
  string,
  StackNavigationState,
  SharedElementStackNavigationOptions
>;

export type SharedElementStackDescriptorMap = {
  [key: string]: SharedElementStackDescriptor;
};

export type SharedElementStackNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string
> = NavigationProp<
  ParamList,
  RouteName,
  StackNavigationState,
  SharedElementStackNavigationOptions,
  SharedElementStackNavigationEventMap
> & {
  /**
   * Push a new screen onto the stack.
   *
   * @param name Name of the route for the tab.
   * @param [params] Params object for the route.
   */
  push<RouteName extends keyof ParamList>(
    ...args: ParamList[RouteName] extends undefined | any
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;

  /**
   * Pop a screen from the stack.
   */
  pop(count?: number): void;

  /**
   * Pop to the first route in the stack, dismissing all other screens.
   */
  popToTop(): void;
};

export type SharedElementStackNavigationOptions = {
  transitionSpec?: TransitionSpec;

  sceneStyle?: StyleProp<ViewStyle>;

  sceneId?: string;

  prevSceneId?: string;
};

export type SharedElementStackNavigationConfig = {};

export type TransitionSpec = {
  animation: "spring";
  config: SpringConfig;
};

export type SharedElementStackNavigationHelpers = NavigationHelpers<
  ParamListBase,
  SharedElementStackNavigationEventMap
>;
