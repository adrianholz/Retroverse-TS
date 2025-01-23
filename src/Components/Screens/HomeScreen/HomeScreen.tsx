import Title from "../../UI/Title/Title";
import { motion } from "framer-motion";

const HomeScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Title navigation={false} />
    </motion.div>
  );
};

export default HomeScreen;
