export default function setupCarousel(isEnabled, activeSystems) {
  if (!isEnabled) {
    // Remove existing event listeners if carousel is disabled
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
    return;
  }

  const isElementLoaded = async (selector) => {
    while (document.querySelector(selector) === null) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return document.querySelector(selector);
  };

  isElementLoaded(".track").then(() => {
    const track = document.querySelector(".track");

    let maxConstraint;
    switch (activeSystems) {
      case 1:
        maxConstraint = 0;
        break;
      case 2:
        maxConstraint = -20;
        break;
      case 3:
        maxConstraint = -30;
        break;
      case 4:
        maxConstraint = -42;
        break;
      case 5:
        maxConstraint = -52;
        break;
      case 6:
        maxConstraint = -58;
        break;
      case 7:
        maxConstraint = -63;
        break;
      case 8:
        maxConstraint = -67;
        break;
      case 9:
        maxConstraint = -71;
        break;
      case 10:
        maxConstraint = -74;
        break;
      case 11:
        maxConstraint = -76;
        break;
      case 12:
        maxConstraint = -78;
        break;
      case 13:
        maxConstraint = -79;
        break;
      case 14:
        maxConstraint = -81;
        break;
      case 15:
        maxConstraint = -82;
        break;
      case 16:
        maxConstraint = -83;
        break;
      case 17:
        maxConstraint = -84;
        break;
      case 18:
        maxConstraint = -84;
        break;
      case 19:
        maxConstraint = -85;
        break;
      case 20:
        maxConstraint = -86;
        break;
      case 21:
        maxConstraint = -87;
        break;
      case 22:
        maxConstraint = -87;
        break;
      case 23:
        maxConstraint = -87.5;
        break;
      case 24:
        maxConstraint = -88;
        break;
      case 25:
        maxConstraint = -88.5;
        break;
      case 26:
        maxConstraint = -89;
        break;
      case 27:
        maxConstraint = -89;
        break;
      case 28:
        maxConstraint = -89.5;
        break;
      case 29:
        maxConstraint = -90;
        break;
      case 30:
        maxConstraint = -90.5;
        break;
      case 31:
        maxConstraint = -91;
        break;
      case 32:
        maxConstraint = -91;
        break;
      case 33:
        maxConstraint = -91.5;
        break;
      case 34:
        maxConstraint = -91.5;
        break;
      case 35:
        maxConstraint = -92;
        break;
      case 36:
        maxConstraint = -92;
        break;
      case 37:
        maxConstraint = -92;
        break;
      case 38:
        maxConstraint = -92.5;
        break;
      case 39:
        maxConstraint = -92.5;
        break;
      case 40:
        maxConstraint = -93;
        break;
      case 41:
        maxConstraint = -93;
        break;
      case 42:
        maxConstraint = -93;
        break;
      case 43:
        maxConstraint = -93.5;
        break;
      case 44:
        maxConstraint = -93.5;
        break;
      case 45:
        maxConstraint = -93.5;
        break;
      case 46:
        maxConstraint = -94;
        break;
      case 47:
        maxConstraint = -94;
        break;
      case 48:
        maxConstraint = -94;
        break;
      case 49:
        maxConstraint = -94;
        break;
      case 50:
        maxConstraint = -94.5;
        break;
      case 51:
        maxConstraint = -94.5;
        break;
      case 52:
        maxConstraint = -94.5;
        break;
      case 53:
        maxConstraint = -94.5;
        break;
      case 54:
        maxConstraint = -94.5;
        break;
      default:
        maxConstraint = -100;
    }

    window.onmousedown = (e) => {
      track.dataset.mouseDownAt = e.clientX;
    };

    window.onmousemove = (e) => {
      if (track.dataset.mouseDownAt === "0") return;

      const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX;
      const maxDelta = window.innerWidth / 2;

      const percentage = (mouseDelta / maxDelta) * -75;
      const nextPercentageUnconstrained =
        parseFloat(track.dataset.prevPercentage) + percentage;
      const nextPercentage = Math.max(
        Math.min(nextPercentageUnconstrained, 0),
        maxConstraint
      );

      track.dataset.percentage = nextPercentage;

      track.animate(
        {
          transform: `translateX(${nextPercentage}%)`,
        },
        { duration: 1200, fill: "forwards" }
      );

      for (const system of document.querySelectorAll(".system-container div")) {
        system.animate(
          {
            backgroundPosition: `${100 + nextPercentage}% center`,
          },
          { duration: 1200, fill: "forwards" }
        );
      }

      for (const system of document.querySelectorAll(".system-container")) {
        system.classList.remove("expand");
      }
    };

    window.onmouseup = () => {
      track.dataset.mouseDownAt = "0";
      track.dataset.prevPercentage = track.dataset.percentage || 0;
      for (const system of document.querySelectorAll(".system-container")) {
        system.classList.add("expand");
      }
    };
  });
}
