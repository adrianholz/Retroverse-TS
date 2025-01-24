import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  buildAuthorization,
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
  login: boolean;
  userLogout: () => Promise<() => void>;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeTypes>>;
  handleLogin: (username: string, webApiKey: string) => Promise<void>;
};

export const UserContext = createContext<UserContextTypes | undefined>(
  undefined
);

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [intro, setIntro] = useState(true);
  const [login, setLogin] = useState(false);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [theme, setTheme] = useState({
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
      { color: "#ffffff50", size: 1200 },
      { color: "#ffffff00", size: 1200 },
      { color: "#ffffff50", size: 1200 },
      { color: "#ffffff00", size: 1200 },
    ],
    musicPlayer: true, //music player visibility
    beat: true, //edge blurs animate on music bpm
    visualizer: true, //music visualizer on background
    visualizerStyle: {
      type: "prism", //prism, classic, rainbow
      opacity: 40, //0-100
      saturate: 0, //0-100
      brightness: 40, //0-100
    },
  });

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
      setSummary(userSummary);
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
        loading,
        error,
        setError,
        userLogout,
        login,
        setLogin,
        setTheme,
        handleLogin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
