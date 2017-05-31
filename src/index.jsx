import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import configureStore from "./state/configureStore";
import { Provider } from "react-redux";
import reducers from "./reducers";
import { App } from "./components/App.jsx";
import "./index.styl";

let appStore = configureStore({}, reducers);

let render = AppC => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={appStore}>
        <AppC />
      </Provider>
    </AppContainer>,
    document.getElementById("App")
  );
};
render(App);

// HMR interface
if (module.hot) {
  // Capture hot update
  module.hot.accept("./components/App", () => {
    console.log("HERE?");
    let newApp = require("./components/App").App;
    render(newApp);
  });
  module.hot.accept("./reducers", () => {
    appStore.replaceReducer(reducers);
  });

  // Handle errors...maybe?
  module.hot.accept(err => {
    console.log("FOR THE LOVE OF JEBUS");
    console.error(err);
  });
}
