import { motion } from "framer-motion";
import RetroAchievementsForm from "../../UI/Forms/RetroAchievements/RetroAchievementsForm";

const LoginScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="profile-screen"
    >
      <RetroAchievementsForm />
    </motion.div>
  );
};

export default LoginScreen;
