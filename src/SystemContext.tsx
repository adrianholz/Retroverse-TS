import {
  createContext,
  CSSProperties,
  ReactNode,
  useEffect,
  useState,
} from "react";

type System = {
  name: string;
  title: string;
  altTitle: string;
  core: string;
  styles: {
    swiperSlide?: CSSProperties;
    gameInfo?: CSSProperties;
    video?: CSSProperties;
    logo?: CSSProperties;
  };
};

type SystemContextTypes = {
  systems: System[];
  setSystems: React.Dispatch<React.SetStateAction<System[]>>;
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
    };

    loadData();
  }, []);

  return (
    <SystemContext.Provider
      value={{
        setSystems,
        systems,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;
