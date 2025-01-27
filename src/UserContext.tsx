import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AchievementOfTheWeek,
  buildAuthorization,
  getAchievementOfTheWeek,
  getUserSummary,
  UserSummary,
} from "@retroachievements/api";
import { useNavigate } from "react-router-dom";

type UserContextTypes = {
  theme: ThemeTypes;
  intro: boolean;
  loading: boolean;
  error: any;
  setError: React.Dispatch<any>;
  summary: UserSummary | null;
  aotw: AchievementOfTheWeek | null;
  login: boolean;
  userLogout: () => Promise<() => void>;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeTypes>>;
  handleLogin: (username: string, webApiKey: string) => Promise<void>;
  musicPlayer: boolean;
  setMusicPlayer: React.Dispatch<React.SetStateAction<boolean>>;
  windowMode: string | null;
  setWindowMode: React.Dispatch<React.SetStateAction<string | null>>;
  musicVolume: number;
  setMusicVolume: React.Dispatch<React.SetStateAction<number>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
};

export const UserContext = createContext<UserContextTypes | undefined>(
  undefined
);

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [intro, setIntro] = useState(true);
  const [login, setLogin] = useState(false);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [aotw, setAotw] = useState<AchievementOfTheWeek | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [musicPlayer, setMusicPlayer] = useState(
    window.localStorage.getItem("musicPlayer")
      ? window.localStorage.getItem("musicPlayer") == "true"
        ? true
        : false
      : true
  );
  const [windowMode, setWindowMode] = useState(
    window.localStorage.getItem("windowMode")
      ? window.localStorage.getItem("windowMode")
      : "Fullscreen"
  );
  const [musicVolume, setMusicVolume] = useState(
    window.localStorage.getItem("musicVolume")
      ? Number(window.localStorage.getItem("musicVolume"))
      : 0.5
  );
  const [language, setLanguage] = useState("en-us");
  const [theme, setTheme] = useState(
    window.localStorage.getItem("theme")
      ? JSON.parse(window.localStorage.getItem("theme")!)
      : {
          shape: true,
          shapeType: "inverted-triangle", //circle, triangle, inverted-triangle, star, hexagon
          pattern: true,
          patternType: "grid", //grid, net, lines
          orbit: false,
          wave: true,
          emulatorLogos: true,
          emulatorLogosStyle: "wave", //orbit, float, wave"
          background: true, //edge blurs
          backgroundColors: [
            { color: "#ffffff50", size: 800 },
            { color: "#ffffff00", size: 800 },
            { color: "#ffffff50", size: 800 },
            { color: "#ffffff00", size: 800 },
          ],
          beat: true, //edge blurs animate on music bpm
          visualizer: true, //music visualizer on background
          achievementOfTheWeek: true,
        }
  );

  const navigate = useNavigate();

  useEffect(() => {
    const hasRun = sessionStorage.getItem("introRun");
    if (hasRun !== "true") {
      const timeout = setTimeout(() => {
        setIntro(false);
        sessionStorage.setItem("introRun", "true");
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setIntro(false);
    }
  }, []);

  useEffect(() => {
    window.ipcRenderer.send("set-window-mode", windowMode);
  }, [windowMode]);

  async function handleLogin(username: string, webApiKey: string) {
    try {
      setLoading(true);
      const authorization = buildAuthorization({ username, webApiKey });
      window.localStorage.setItem("username", username);
      window.localStorage.setItem("webApiKey", webApiKey);
      const userSummary = await getUserSummary(authorization, {
        username: username,
        recentGamesCount: 0,
        recentAchievementsCount: 0,
      });
      const achievementOfTheWeek = await getAchievementOfTheWeek(authorization);
      setSummary(userSummary);
      setAotw(achievementOfTheWeek);
      setError(null);
      setLogin(true);
      const hasRun = sessionStorage.getItem("introRun");
      if (hasRun) {
        navigate("/profile");
      }
    } catch {
      if (username == "" || webApiKey == "") {
        setError("Please set both your username and web API key.");
      } else {
        setError("Invalid username or web API key. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const userLogout = useCallback(async function () {
    navigate("/login");
    const timeout = setTimeout(() => {
      window.localStorage.setItem("username", "");
      window.localStorage.setItem("webApiKey", "");
      setSummary(null);
      setLoading(false);
      setLogin(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const username = window.localStorage.getItem("username");
    const webApiKey = window.localStorage.getItem("webApiKey");
    if (username && webApiKey) {
      handleLogin(username, webApiKey);
    }
  }, [userLogout]);

  return (
    <UserContext.Provider
      value={{
        theme,
        intro,
        summary,
        aotw,
        loading,
        error,
        setError,
        userLogout,
        login,
        setLogin,
        setTheme,
        handleLogin,
        musicPlayer,
        setMusicPlayer,
        windowMode,
        setWindowMode,
        musicVolume,
        setMusicVolume,
        language,
        setLanguage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
