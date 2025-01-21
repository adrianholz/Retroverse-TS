import { HashRouter } from "react-router-dom";
import AnimatedRoutes from "./AnimatedRoutes";
import "./App.css";
import Container from "./Components/UI/Container/Container";
import { EmulatorContextProvider } from "./EmulatorContext";
import { SystemContextProvider } from "./SystemContext";
import { UserContextProvider } from "./UserContext";

function App() {
  return (
    <HashRouter>
      <UserContextProvider>
        <EmulatorContextProvider>
          <SystemContextProvider>
            <Container>
              <AnimatedRoutes />
            </Container>
          </SystemContextProvider>
        </EmulatorContextProvider>
      </UserContextProvider>
    </HashRouter>
  );
}

export default App;
