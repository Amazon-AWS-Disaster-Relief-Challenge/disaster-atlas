import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
// @ts-ignore
import { withAuthenticator } from "aws-amplify-react-native";
import { QueryClient, QueryClientProvider } from "react-query";

import config from "./lib/aws-exports";
import Amplify from "aws-amplify";

Amplify.configure(config);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Open up App.tsx to start working on your adpp! HI</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}

export default withAuthenticator(App, { usernameAttributes: "email" });
