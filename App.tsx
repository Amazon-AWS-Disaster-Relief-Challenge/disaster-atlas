import * as React from "react";
// @ts-ignore
import { withAuthenticator } from "aws-amplify-react-native";
import { QueryClient, QueryClientProvider } from "react-query";
import { NavigationContainer } from "@react-navigation/native";

import config from "./lib/aws-exports";
import Main from "./src/navigation/Main";
import Amplify from "aws-amplify";

Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Main />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default withAuthenticator(App, { usernameAttributes: "email" });
