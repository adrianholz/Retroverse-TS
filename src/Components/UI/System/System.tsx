import { useNavigate } from "react-router-dom";
import "./System.css";

const System = ({ name }: { name: string }) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const navigate = useNavigate();

  const style = {
    logo: {
      maxWidth: "190px",
      left: "60px",
    },
  };

  return (
    <div
      className="emulator-container expand"
      onClick={() => navigate(`/systems/${name}`)}
      id={name}
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
        ></video>
      </div>
    </div>
  );
};

export default System;
