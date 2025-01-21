const Blur = ({
  theme,
  song,
  index,
  position,
  pauseSong,
}: {
  theme: ThemeTypes;
  song?: Song;
  index: number;
  position: string;
  pauseSong: boolean;
}) => {
  return (
    <div
      className="blur"
      style={{
        backgroundColor: `${theme.backgroundColors[index].color}`,
        width: `${theme.backgroundColors[index].size}px`,
        height: `${theme.backgroundColors[index].size}px`,
        top: position.includes("top")
          ? `-${theme.backgroundColors[index].size / 2}px`
          : undefined,
        bottom: position.includes("bottom")
          ? `-${theme.backgroundColors[index].size / 2}px`
          : undefined,
        left: position.includes("left")
          ? `-${theme.backgroundColors[index].size / 2}px`
          : undefined,
        right: position.includes("right")
          ? `-${theme.backgroundColors[index].size / 2}px`
          : undefined,
        animation: theme.beat ? "beat 1s infinite" : "",
        animationDuration:
          song && theme.beat
            ? `${60000 / (song.bpm >= 120 ? song.bpm / 2 : song.bpm)}ms`
            : "",
        animationPlayState: theme.beat && pauseSong ? "paused" : "running",
      }}
    ></div>
  );
};

export default Blur;
