import * as React from "react";
import { Route } from "@react-navigation/native";
import { StackNavigationState } from "@react-navigation/routers";

import SceneStack from "./SceneStack";
import {
  SharedElementStackNavigationHelpers,
  SharedElementStackNavigationConfig,
  SharedElementStackDescriptorMap,
  SharedElementStackNavigationOptions
} from "../types";
import {
  SceneTransitionerClass,
  Transition
} from "@tleef/react-native-shared-element-scenes/lib";
import Animated from "react-native-reanimated";

type Props = SharedElementStackNavigationConfig & {
  state: StackNavigationState;
  navigation: SharedElementStackNavigationHelpers;
  descriptors: SharedElementStackDescriptorMap;
};

type RouteTransition = {
  route: Route<string>;
  sceneId: string;
  prevSceneId: string;
  closing: boolean;
  transition?: Transition;
};

type RouteTransitions = { [key: string]: RouteTransition };

type State = {
  // Local copy of the routes which are actually rendered
  routes: Route<string>[];
  // Previous routes, to compare whether routes have changed or not
  previousRoutes: Route<string>[];
  // Previous descriptors, to compare whether descriptors have changed or not
  previousDescriptors: SharedElementStackDescriptorMap;
  // List of route transitions
  routeTransitions: RouteTransitions;
  // Since the local routes can vary from the routes from props, we need to keep the descriptors for old routes
  // Otherwise we won't be able to access the options for routes that were removed
  descriptors: SharedElementStackDescriptorMap;
};

export default class StackView extends React.Component<Props, State> {
  private _sceneTransitioner?: SceneTransitionerClass;

  static getDerivedStateFromProps(
    props: Readonly<Props>,
    state: Readonly<State>
  ) {
    // If there was no change in routes, we don't need to compute anything
    if (props.state.routes === state.previousRoutes && state.routes.length) {
      if (props.descriptors !== state.previousDescriptors) {
        const descriptors = state.routes.reduce<
          SharedElementStackDescriptorMap
        >((acc, route) => {
          acc[route.key] =
            props.descriptors[route.key] || state.descriptors[route.key];

          return acc;
        }, {});

        return {
          previousDescriptors: props.descriptors,
          descriptors
        };
      }

      return null;
    }

    // Here we determine which routes were added or removed to animate them
    // We keep a copy of the route being removed in local state to be able to animate it

    let routes =
      props.state.index < props.state.routes.length - 1
        ? // Remove any extra routes from the state
          // The last visible route should be the focused route, i.e. at current index
          props.state.routes.slice(0, props.state.index + 1)
        : props.state.routes;

    // Now we need to determine which routes were added and removed
    let { routeTransitions, previousRoutes } = state;

    const previousFocusedRoute = previousRoutes[previousRoutes.length - 1] as
      | Route<string>
      | undefined;
    const nextFocusedRoute = routes[routes.length - 1];

    const closingRouteKeys = Object.keys(routeTransitions).filter(
      key => routeTransitions[key].closing
    );

    if (
      previousFocusedRoute &&
      previousFocusedRoute.key !== nextFocusedRoute.key
    ) {
      // We only need to animate routes if the focused route changed
      // Animating previous routes won't be visible coz the focused route is on top of everything

      if (!previousRoutes.find(r => r.key === nextFocusedRoute.key)) {
        // A new route has come to the focus, we treat this as a push
        // A replace can also trigger this, the animation should look like push
        let routeTransition = routeTransitions[nextFocusedRoute.key];

        if (!routeTransition) {
          const nextDescriptor =
            props.descriptors[nextFocusedRoute.key] ||
            state.descriptors[nextFocusedRoute.key];
          const prevDescriptor =
            props.descriptors[previousFocusedRoute.key] ||
            state.descriptors[previousFocusedRoute.key] ||
            state.previousDescriptors[previousFocusedRoute.key];

          const nextOptions = nextDescriptor
            ? nextDescriptor.options
            : ({} as SharedElementStackNavigationOptions);
          const prevOptions = prevDescriptor
            ? prevDescriptor.options
            : ({} as SharedElementStackNavigationOptions);

          routeTransition = {
            route: nextFocusedRoute,
            sceneId: nextOptions.sceneId || nextFocusedRoute.key,
            prevSceneId:
              nextOptions.prevSceneId ||
              prevOptions.sceneId ||
              previousFocusedRoute.key,
            closing: false
          };

          routeTransitions = {
            ...routeTransitions,
            [routeTransition.route.key]: routeTransition
          };
        }

        routeTransition.closing = false;
      } else if (!routes.find(r => r.key === previousFocusedRoute.key)) {
        // The previously focused route was removed, we treat this as a pop
        let routeTransition = routeTransitions[previousFocusedRoute.key];

        if (!routeTransition) {
          const prevDescriptor =
            props.descriptors[previousFocusedRoute.key] ||
            state.descriptors[previousFocusedRoute.key] ||
            state.previousDescriptors[previousFocusedRoute.key];
          const nextDescriptor =
            props.descriptors[nextFocusedRoute.key] ||
            state.descriptors[nextFocusedRoute.key];

          const prevOptions = prevDescriptor
            ? prevDescriptor.options
            : ({} as SharedElementStackNavigationOptions);
          const nextOptions = nextDescriptor
            ? nextDescriptor.options
            : ({} as SharedElementStackNavigationOptions);

          routeTransition = {
            route: previousFocusedRoute,
            sceneId: prevOptions.sceneId || previousFocusedRoute.key,
            prevSceneId:
              prevOptions.prevSceneId ||
              nextOptions.sceneId ||
              nextFocusedRoute.key,
            closing: true
          };

          routeTransitions = {
            ...routeTransitions,
            [routeTransition.route.key]: routeTransition
          };
        }

        routeTransition.closing = true;

        routes = [...routes, routeTransition.route];
      } else {
        // Looks like some routes were re-arranged and no focused routes were added/removed
        // i.e. the currently focused route already existed and the previously focused route still exists
        // We don't know how to animate this
      }
    } else if (closingRouteKeys.length) {
      // Keep the routes we are closing or replacing if animation is enabled for them
      routes = routes.slice();
      routes.splice(
        routes.length - 1,
        0,
        ...state.routes.filter(({ key }) => closingRouteKeys.includes(key))
      );
    }

    if (!routes.length) {
      throw new Error(
        "There should always be at least one route in the navigation state."
      );
    }

    const descriptors = routes.reduce<SharedElementStackDescriptorMap>(
      (acc, route) => {
        acc[route.key] =
          props.descriptors[route.key] || state.descriptors[route.key];

        return acc;
      },
      {}
    );

    return {
      routes,
      previousRoutes: props.state.routes,
      previousDescriptors: props.descriptors,
      routeTransitions,
      descriptors
    };
  }

  state: State = {
    routes: [],
    previousRoutes: [],
    previousDescriptors: {},
    routeTransitions: {},
    descriptors: {}
  };

  private handleOpenRoute = ({ route }: { route: Route<string> }) => {
    this.setState(state => {
      const routeTransitions = {
        ...state.routeTransitions
      };

      delete routeTransitions[route.key];

      return {
        routeTransitions
      };
    });
  };

  private handleCloseRoute = ({ route }: { route: Route<string> }) => {
    // We need to clean up any state tracking the route and pop it immediately
    this.setState(state => {
      const routeTransitions = {
        ...state.routeTransitions
      };

      delete routeTransitions[route.key];

      return {
        routes: state.routes.filter(r => r.key !== route.key),
        routeTransitions
      };
    });
  };

  private handleTransitionStart = (
    route: Route<string>,
    data: {
      closing: boolean;
      animValue: Animated.Value<number>;
    }
  ) =>
    this.props.navigation.emit({
      type: "transitionStart",
      target: route.key,
      data
    });

  private handleTransitionEnd = (
    route: Route<string>,
    data: {
      closing: boolean;
      cancelled: boolean;
    }
  ) =>
    this.props.navigation.emit({
      type: "transitionEnd",
      data: data,
      target: route.key
    });

  private handleSceneTransitionerRef = (
    sceneTransitioner: SceneTransitionerClass
  ) => {
    this._sceneTransitioner = sceneTransitioner;
  };

  private handleRouteTransition = (key: string) => {
    const routeTransition = this.state.routeTransitions[key];

    const fromId = routeTransition.closing
      ? routeTransition.sceneId
      : routeTransition.prevSceneId;
    const toId = routeTransition.closing
      ? routeTransition.prevSceneId
      : routeTransition.sceneId;

    if (this._sceneTransitioner && !routeTransition.transition) {
      const descriptor = this.state.descriptors[key];

      const { transitionSpec } = descriptor
        ? descriptor.options
        : ({} as SharedElementStackNavigationOptions);

      let springConfig = undefined;

      if (transitionSpec && transitionSpec.animation === "spring") {
        springConfig = transitionSpec.config;
      }

      routeTransition.transition = this._sceneTransitioner.transition({
        fromId,
        toId,
        springConfig
      });

      const animValue = routeTransition.transition.animValue;

      const handleStart = () => {
        this.handleTransitionStart(routeTransition.route, {
          closing: routeTransition.closing,
          animValue
        });
      };

      const handleEnd = (cancelled: boolean) => {
        this.handleTransitionEnd(routeTransition.route, {
          closing: routeTransition.closing,
          cancelled
        });

        if (!cancelled && routeTransition.closing) {
          this.handleCloseRoute({ route: routeTransition.route });
        } else {
          this.handleOpenRoute({ route: routeTransition.route });
        }
      };

      routeTransition.transition.onEnterStart(handleStart);
      routeTransition.transition.onEnterEnd(handleEnd);
      routeTransition.transition.onLeaveStart(handleStart);
      routeTransition.transition.onLeaveEnd(handleEnd);
    }

    if (routeTransition.transition) {
      if (toId === routeTransition.transition.fromId) {
        // We are going back to where we came from, we need to cancel
        routeTransition.transition.cancel();
      } else {
        routeTransition.transition.continue();
      }
    }
  };

  render() {
    const { routes, descriptors } = this.state;

    return (
      <SceneStack
        routes={routes}
        descriptors={descriptors}
        onSceneTransitionerRef={this.handleSceneTransitionerRef}
      />
    );
  }

  componentDidUpdate() {
    const { routeTransitions } = this.state;

    const routeTransitionKeys = Object.keys(routeTransitions);

    if (routeTransitionKeys.length) {
      routeTransitionKeys.forEach(this.handleRouteTransition);
    }
  }
}
