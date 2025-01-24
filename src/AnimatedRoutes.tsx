import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomeScreen from "./Components/Screens/HomeScreen/HomeScreen";
import ProfileScreen from "./Components/Screens/ProfileScreen/ProfileScreen";
import LoginScreen from "./Components/Screens/LoginScreen/LoginScreen";
import UserGamesScreen from "./Components/Screens/UserGamesScreen/UserGamesScreen";
import SingleGameScreen from "./Components/Screens/SingleGameScreen/SingleGameScreen";
import LibraryScreen from "./Components/Screens/LibraryScreen/LibraryScreen";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/games" element={<UserGamesScreen />} />
        <Route path="/profile/games/:gameId" element={<SingleGameScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
