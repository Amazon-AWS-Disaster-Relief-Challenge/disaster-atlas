import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Map from "../screens/Map";
import { Feather } from "@expo/vector-icons";
export const Tab = createBottomTabNavigator();

export default function MainRoute() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="map"
      tabBar={() => <></>}
    >
      <Tab.Screen
        name="map"
        component={Map}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
