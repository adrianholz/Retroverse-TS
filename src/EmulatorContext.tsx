import { createContext, ReactNode, useEffect, useState } from "react";

type EmulatorContextTypes = {
  executeEmulatorCommand: (emulatorName: string, args: any) => Promise<void>;
  emulators: string[];
};

export const EmulatorContext = createContext<EmulatorContextTypes | undefined>(
  undefined
);

export const EmulatorContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [emulators, setEmulators] = useState<string[]>([]);

  useEffect(() => {
    // Fetch emulator names on startup
    async function fetchEmulatorNames() {
      try {
        const emulatorNames = await window.ipcRenderer.invoke(
          "get-emulator-names"
        );
        setEmulators(emulatorNames);
      } catch (error) {
        console.error("Failed to fetch emulator names:", error);
      }
    }

    fetchEmulatorNames();
  }, []);

  async function executeEmulatorCommand(
    emulatorName: string,
    args: any = null
  ) {
    try {
      const { pid } = await window.ipcRenderer.invoke(
        "execute-emulator-command",
        emulatorName,
        args
      );
      console.log(`Process started with PID: ${pid}`);

      window.ipcRenderer.on("emulator-closed", (_event, data) => {
        if (data.emulatorName === emulatorName) {
          console.log(`${emulatorName} closed with code ${data.code}`);
        }
      });
    } catch (error) {
      console.error("Failed to execute command:", error);
    }
  }

  return (
    <EmulatorContext.Provider
      value={{
        executeEmulatorCommand,
        emulators,
      }}
    >
      {children}
    </EmulatorContext.Provider>
  );
};

export default EmulatorContext;
