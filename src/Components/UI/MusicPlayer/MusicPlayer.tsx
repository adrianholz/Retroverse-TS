import { motion } from "motion/react";
import "./MusicPlayer.css";
import { BarLoader } from "react-spinners";
import { useContext, useEffect } from "react";
import LibraryContext from "../../../LibraryContext";

const MusicPlayer = ({
  audioDragRef,
  audioRef,
  song,
  songs,
  setSong,
  pauseSong,
  setPauseSong,
  songIndex,
  setSongIndex,
  theme,
}: {
  audioDragRef: React.MutableRefObject<null>;
  audioRef: React.RefObject<HTMLAudioElement>;
  song?: Song;
  songs?: Song[];
  setSong: React.Dispatch<React.SetStateAction<Song | null>>;
  pauseSong: boolean;
  setPauseSong: React.Dispatch<React.SetStateAction<boolean>>;
  songIndex: number;
  setSongIndex: React.Dispatch<React.SetStateAction<number>>;
  theme: ThemeTypes;
}) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { setCarousel } = useContext(LibraryContext)!;

  useEffect(() => {
    const handleEnd = () => {
      const nextIndex = (songIndex + 1) % songs!.length;
      setSongIndex(nextIndex);
      setSong(songs![nextIndex]);
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("ended", handleEnd);
      return () => {
        audioElement.removeEventListener("ended", handleEnd);
      };
    }
  }, [songIndex, songs]);

  function changeSong(index: number) {
    if (index >= 0 && index < songs!.length) {
      setSongIndex(index);
      setSong(songs![index]);
    }
  }

  function handlePreviousSong() {
    const newIndex = Math.max(0, songIndex - 1);
    changeSong(newIndex);
  }

  function handleNextSong() {
    const newIndex = Math.min(songs!.length - 1, songIndex + 1);
    changeSong(newIndex);
  }

  function handlePause() {
    setPauseSong(!pauseSong);
    window.localStorage.setItem("pause", pauseSong ? "false" : "true");
  }

  function handleMouseOver() {
    setCarousel(false);
  }

  function handleMouseLeave() {
    setCarousel(true);
  }

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 1 }}
      drag
      dragConstraints={audioDragRef}
      className="music-player"
      style={{ opacity: theme.musicPlayer ? 1 : 0 }}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {song ? <img src={song.coverArt} alt="Cover Art" /> : null}

      <div className="song-content">
        <div className="song-info">
          <div>
            {song ? (
              <>
                <h2>{song ? song.name : null}</h2>
                <p>{song ? song.author : null}</p>
              </>
            ) : (
              <BarLoader
                color="#ffffff"
                loading={true}
                aria-label="Loading Spinner"
                data-testid="loader"
                className="audioLoading"
              />
            )}
          </div>
        </div>
        <span
          className="drag-bar"
          style={
            !pauseSong
              ? {
                  background:
                    "linear-gradient(-90deg, #12c2e9, #c471ed, #f64f59)",
                  backgroundSize: "400% 400%",
                  animation: "gradient 5s ease infinite",
                }
              : {}
          }
        ></span>
        <div className="song-buttons">
          <img
            onClick={handlePreviousSong}
            src={`${resourcesPath}/assets/img/svg/backwards.svg`}
            alt="Previous Song"
          />
          <img
            onClick={handlePause}
            src={
              pauseSong
                ? `${resourcesPath}/assets/img/svg/play.svg`
                : `${resourcesPath}/assets/img/svg/pause.svg`
            }
            alt="Pause Song"
          />
          <img
            onClick={handleNextSong}
            src={`${resourcesPath}/assets/img/svg/forwards.svg`}
            alt="Next Song"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MusicPlayer;
