import document from "document";
import { vibration } from "haptics";

const tiles = ["acOn", "acOff", "console"];
const icons = {
  notConnected: 80,
  connecting: 115,
  connected: 150,
  failed: 185
};
const state = {
  isRunning: false,
  visibleTile: "acOn",
  companionConnect: "notConnected",
  console: {
    headText: "Help",
    bodyText: "This is some help text"
  }
};

const setVisibleTile = currentState => {
  // fade tiles
  document.getElementsByClassName('tile').forEach(t => {
    t.style.display = "none";
  });

  // fade in proper tile
  document.getElementById(currentState.visibleTile).style.display = "inline";


};
const setCompanionIcon = currentState => {
  const iconMask = document.getElementById('icon-mask').getElementsByTagName('rect')[0];
  iconMask.x = icons[currentState.companionConnect];
};
const setConsoleText = currentState => {
  const head = document.getElementById("console-head");
  const body = document.getElementById("console-body");

  head.text = currentState.console.headText;
  body.text = currentState.console.bodyText;
};

const powerUp = currentState => {
  const powerMask = document.getElementById('power-mask').getElementsByTagName("rect")[0];

  const START = 130;
  const MAX = 300;
  const STEP = 18;

  let iter = 0;
  powerMask.width = START;
  const f = setInterval(() => {
    let step = STEP;
    if (iter >= 8) {
      clearInterval(f);
      powerMask.width = 0;
      currentState.isRunning = null;
      currentState.console.headText = "Complete";
      currentState.console.bodyText= "I'm done";
      vibration.start("nudge");
      return;
    }
    if (iter >= 6) {
      step = 27;
    }

    if (powerMask.width >= MAX) {
      powerMask.width = START;
    } else {
      powerMask.width += step;
    }
    iter += 1;
  }, 1000);

  return f;
};
const rotateTile = (currentState, forward = true) => {
  let visibleTileIndex = tiles.indexOf(state.visibleTile);
  visibleTileIndex += forward ? 1 : -1;
  if (visibleTileIndex >= tiles.length) {
    visibleTileIndex = 0;
  } else if (visibleTileIndex < 0) {
    visibleTileIndex = tiles.length - 1;
  }
  state.visibleTile = tiles[visibleTileIndex];
  updateUI(currentState);
};

const updateUI = currentState => {
  setVisibleTile(currentState);
  setCompanionIcon(currentState);
  setConsoleText(currentState);
};

document.onkeypress = (e) => {
  if (e.key === "up") {
    console.log(`up`);
    e.preventDefault();
    if ( ! state.isRunning ) {
      state.isRunning = powerUp(state);
      state.console.headText = "Run Me";
      state.console.bodyText = "I'm running";
      state.visibleTile = "console";
      console.log("start running");
      vibration.start("confirmation");
      updateUI(state);
    } else {
      console.log("already running")
    }

  }
  if (e.key === "down") {
    rotateTile(state);
    // bump the user
    vibration.start("bump");
  }
};

