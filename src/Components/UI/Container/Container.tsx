import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../../UserContext";
import "./Container.css";
import AudioMotionAnalyzer from "audiomotion-analyzer";
import Blur from "../Blur/Blur";
import MusicPlayer from "../MusicPlayer/MusicPlayer";
import Navigation from "../Navigation/Navigation";

const Container = ({ children }: { children: ReactNode }) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");
  const { theme, intro } = useContext(UserContext)!;

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzer | null>(null);
  const audioContainerRef = useRef(null);
  const audioDragRef = useRef(null);
  const hasMounted = useRef(false);

  const [song, setSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [pauseSong, setPauseSong] = useState(
    window.localStorage.getItem("pause")
      ? window.localStorage.getItem("pause") == "true"
        ? true
        : false
      : false
  );
  const [songIndex, setSongIndex] = useState(0);

  const [blurKey, setBlurKey] = useState(0);

  useEffect(() => {
    if (pauseSong) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  }, [pauseSong]);

  const blurPositions = [
    "top left",
    "top right",
    "bottom right",
    "bottom left",
  ];

  useEffect(() => {
    fetch(`${resourcesPath}/assets/music/songs.json`)
      .then((response) => response.json())
      .then((data) => {
        const songData = data.map((song: Song) => song);
        setSongs(songData);
      })
      .catch((error) => console.error("Error loading songs:", error));
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      setSongIndex(randomIndex);
      setSong(songs[randomIndex]);
    }
  }, [songs]);

  useEffect(() => {
    setBlurKey((prevKey) => prevKey + 1);
  }, [song]);

  useEffect(() => {
    if (!audioRef.current || !audioContainerRef.current) return;

    const audioMotion = new AudioMotionAnalyzer(audioContainerRef.current, {
      source: audioRef.current,
      height: 260,
      overlay: true,
      showBgColor: true,
      bgAlpha: 0,
      showScaleX: false,
      showScaleY: false,
      ansiBands: false,
      mode: 2,
      frequencyScale: "log",
      showPeaks: false,
      smoothing: 0.6,
      gradient: theme.visualizer ? theme.visualizerStyle.type : "prism",
    });

    audioMotionRef.current = audioMotion;

    return () => {
      audioMotion.disconnectInput();
      audioMotion.destroy();
    };
  }, []);

  useEffect(() => {
    if (hasMounted.current && !pauseSong) {
      if (audioRef.current) {
        audioRef.current.play();
      }
    } else {
      hasMounted.current = true;
    }
  }, [song, pauseSong]);

  return (
    <div
      className="container"
      ref={audioDragRef}
      style={{
        background: theme.pattern
          ? `url("${resourcesPath}/assets/img/svg/patterns/${theme.patternType}.svg")`
          : "",
        animation: `${intro ? "container-appear 1s ease forwards" : ""}`,
      }}
    >
      <Navigation />

      {theme.background ? (
        <div className="blur-container" style={{ opacity: pauseSong ? 0 : 1 }}>
          {blurPositions.map((position, index) => (
            <Blur
              key={`${blurKey}-${index}`}
              theme={theme}
              song={song || undefined}
              pauseSong={pauseSong}
              index={index}
              position={position}
            />
          ))}
        </div>
      ) : null}

      {children}

      {theme.visualizer ? (
        <div
          id="audioContainer"
          ref={audioContainerRef}
          style={{
            opacity: `${theme.visualizerStyle.opacity}%`,
            filter: `saturate(${theme.visualizerStyle.saturate}%) brightness(${theme.visualizerStyle.brightness}%)`,
          }}
        ></div>
      ) : null}

      <MusicPlayer
        audioDragRef={audioDragRef}
        audioRef={audioRef}
        song={song ? song : undefined}
        songs={songs ? songs : undefined}
        setSong={setSong}
        pauseSong={pauseSong}
        setPauseSong={setPauseSong}
        songIndex={songIndex}
        setSongIndex={setSongIndex}
        theme={theme}
      />

      <audio
        className="music-source"
        src={song ? `${resourcesPath}/assets/music/${song.file}` : ""}
        controls
        crossOrigin="anonymous"
        ref={audioRef}
      />
    </div>
  );
};

export default Container;
