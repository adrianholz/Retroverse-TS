import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomeScreen from "./Components/Screens/HomeScreen/HomeScreen";
import ProfileScreen from "./Components/Screens/ProfileScreen/ProfileScreen";
import LoginScreen from "./Components/Screens/LoginScreen/LoginScreen";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
