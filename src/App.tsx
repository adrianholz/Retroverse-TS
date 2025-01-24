import { HashRouter } from "react-router-dom";
import AnimatedRoutes from "./AnimatedRoutes";
import "./App.css";
import Container from "./Components/UI/Container/Container";
import { EmulatorContextProvider } from "./EmulatorContext";
import { SystemContextProvider } from "./SystemContext";
import { UserContextProvider } from "./UserContext";
import { LibraryContextProvider } from "./LibraryContext";

function App() {
  return (
    <HashRouter>
      <UserContextProvider>
        <EmulatorContextProvider>
          <SystemContextProvider>
            <LibraryContextProvider>
              <Container>
                <AnimatedRoutes />
              </Container>
            </LibraryContextProvider>
          </SystemContextProvider>
        </EmulatorContextProvider>
      </UserContextProvider>
    </HashRouter>
  );
}

export default App;
