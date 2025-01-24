import "./System.css";
import { useContext, useEffect, useState } from "react";
import SystemContext from "../../../SystemContext";

const System = ({ name, onClick }: { name: string; onClick: () => any }) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const [isDragging, setIsDragging] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);

  const { systems } = useContext(SystemContext)!;

  const style = systems.find((system) => system.name === name)?.styles || {
    logo: {
      maxWidth: "190px",
      left: "60px",
    },
  };

  useEffect(() => {
    // @ts-ignore
    if (style.video && style.video.keyframes) {
      // @ts-ignore
      const keyframes = style.video.keyframes;
      const keyframesString = Object.entries(keyframes)
        .map(([percent, props]) => {
          // @ts-ignore
          const propsString = Object.entries(props)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ");
          return `${percent} { ${propsString} }`;
        })
        .join(" ");

      const styleElement = document.createElement("style");
      document.head.appendChild(styleElement);
      const styleSheet = styleElement.sheet;

      const animationName = `customAnimation-${name}`;
      const keyframesRule = `@keyframes ${animationName} { ${keyframesString} }`;

      styleSheet!.insertRule(keyframesRule, styleSheet!.cssRules.length);
      style.video.animationName = animationName;
    }
  }, [style, name]);

  const handleMouseDown = () => {
    setIsDragging(false);
    setMouseDownTime(Date.now());
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    const clickDuration = Date.now() - mouseDownTime;
    if (!isDragging && clickDuration < 200) {
      onClick();
    }
  };

  return (
    <div
      className="system-container expand"
      id={name}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img
        src={`${resourcesPath}/assets/img/webp/logo/${name}-logo.webp`}
        alt={`${name} Logo Solid`}
        style={style.logo}
      />
      <div
        style={{
          backgroundImage: `url("${resourcesPath}/assets/img/webp/background/${name}.webp")`,
        }}
      >
        <div>
          <img
            src={`${resourcesPath}/assets/img/webp/banner/${name}-banner.webp`}
            alt={`${name} Banner`}
          />
        </div>
        <video
          src={`${resourcesPath}/assets/video/${name}.webm`}
          loop
          autoPlay
          muted
          style={{ ...style.video }}
        ></video>
      </div>
    </div>
  );
};

export default System;
