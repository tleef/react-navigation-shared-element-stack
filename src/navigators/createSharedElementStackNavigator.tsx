import * as React from "react";
import {
  createNavigatorFactory,
  DefaultNavigatorOptions,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
  useNavigationBuilder
} from "@react-navigation/native";
import SharedElementStackView from "../views/SharedElementStackView";
import {
  SharedElementStackNavigationConfig,
  SharedElementStackNavigationEventMap,
  SharedElementStackNavigationOptions
} from "../types";

type Props = DefaultNavigatorOptions<SharedElementStackNavigationOptions> &
  StackRouterOptions &
  SharedElementStackNavigationConfig;

function SharedElementStackNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: Props) {
  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState,
    StackRouterOptions,
    SharedElementStackNavigationOptions,
    SharedElementStackNavigationEventMap
  >(StackRouter, {
    initialRouteName,
    children,
    screenOptions
  });

  return (
    <SharedElementStackView
      {...rest}
      state={state}
      descriptors={descriptors}
      navigation={navigation}
    />
  );
}

export default createNavigatorFactory<
  SharedElementStackNavigationOptions,
  typeof SharedElementStackNavigator
>(SharedElementStackNavigator);
