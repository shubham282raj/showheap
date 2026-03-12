let listeners = [];

let state = {
  visible: 0,
  text: "loading",
};

function notify() {
  listeners.forEach((l) => l({ ...state }));
}

export function showSuspense(text = "loading") {
  console.log("showing");
  state.visible += 1;
  state.text = text;

  notify();

  let released = false;

  return () => {
    console.log("hiding");
    if (released) return;
    released = true;

    state.visible = Math.max(0, state.visible - 1);
    notify();
  };
}

export function subscribeSuspense(listener) {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getSuspenseState() {
  return state;
}
