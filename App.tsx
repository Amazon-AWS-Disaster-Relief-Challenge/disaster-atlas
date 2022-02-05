import * as React from "react";
// @ts-ignore
import { QueryClient, QueryClientProvider } from "react-query";
import { NavigationContainer } from "@react-navigation/native";

import Main from "./src/navigation/Main";

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

export default App;
