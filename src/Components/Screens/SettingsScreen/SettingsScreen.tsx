import "./SettingsScreen.css";
import { motion } from "framer-motion";

const SettingsScreen = () => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="settings"
    >
      <h1>Settings</h1>
      <div className="buttons">
        <div>
          <img
            src={`${resourcesPath}/assets/img/svg/gear.svg`}
            alt="Settings Icon"
          />
          <p>General</p>
        </div>
        <div>
          <img
            src={`${resourcesPath}/assets/img/svg/gamepad.svg`}
            alt="Library Icon"
          />
          <p>Library</p>
        </div>
        <div>
          <img
            src={`${resourcesPath}/assets/img/svg/palette.svg`}
            alt="Theme Icon"
          />
          <p>Theme</p>
        </div>
      </div>
      <div className="settings-inner"></div>
    </motion.div>
  );
};

export default SettingsScreen;
