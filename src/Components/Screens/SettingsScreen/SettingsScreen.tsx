import { useState } from "react";
import "./SettingsScreen.css";
import { motion } from "framer-motion";
import GeneralTab from "../../UI/Settings/GeneralTab/GeneralTab";
import LibraryTab from "../../UI/Settings/LibraryTab/LibraryTab";
import ThemeTab from "../../UI/Settings/ThemeTab/ThemeTab";

const SettingsScreen = () => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  const [tab, setTab] = useState("library");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="settings"
    >
      <h1>Settings</h1>
      <div className="buttons-nav">
        <div
          onClick={() => {
            setTab("general");
          }}
          className={tab == "general" ? "active" : ""}
        >
          <img
            src={`${resourcesPath}/assets/img/svg/gear.svg`}
            alt="Settings Icon"
          />
          <p>General</p>
        </div>
        <div
          onClick={() => {
            setTab("library");
          }}
          className={tab == "library" ? "active" : ""}
        >
          <img
            src={`${resourcesPath}/assets/img/svg/gamepad.svg`}
            alt="Library Icon"
          />
          <p>Library</p>
        </div>
        <div
          onClick={() => {
            setTab("theme");
          }}
          className={tab == "theme" ? "active" : ""}
        >
          <img
            src={`${resourcesPath}/assets/img/svg/palette.svg`}
            alt="Theme Icon"
          />
          <p>Theme</p>
        </div>
      </div>
      <div className="wrapper">
        <GeneralTab active={tab == "general" ? true : false} />
        <LibraryTab active={tab == "library" ? true : false} />
        <ThemeTab active={tab == "theme" ? true : false} />
      </div>
    </motion.div>
  );
};

export default SettingsScreen;
