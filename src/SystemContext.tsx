import { createContext, ReactNode, useEffect, useState } from "react";

type SystemContextTypes = {
  systems: System[];
  setSystems: React.Dispatch<React.SetStateAction<System[]>>;
  currentActiveSystems: System[];
  setCurrentActiveSystems: React.Dispatch<React.SetStateAction<System[]>>;
};

export const SystemContext = createContext<SystemContextTypes | undefined>(
  undefined
);

export const SystemContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [systems, setSystems] = useState<System[]>([]);
  const [currentActiveSystems, setCurrentActiveSystems] = useState<System[]>(
    []
  );

  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  useEffect(() => {
    const loadData = async () => {
      let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
      resourcesPath = resourcesPath.replace(/\\/g, "/");

      const fileContent = window.ipcRenderer.sendSync(
        "read-file",
        `${resourcesPath}/roms/systems.json`
      );
      const data: System[] = JSON.parse(fileContent);

      setSystems(data);
      setCurrentActiveSystems(
        window.localStorage.getItem("activeSystems")
          ? JSON.parse(window.localStorage.getItem("activeSystems")!)
          : systems[0]
      );
    };

    loadData();
  }, []);

  return (
    <SystemContext.Provider
      value={{
        setSystems,
        systems,
        currentActiveSystems,
        setCurrentActiveSystems,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;
