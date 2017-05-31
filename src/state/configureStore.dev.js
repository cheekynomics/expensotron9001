import { createStore, applyMiddleware, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";

export default function configureStore(initialState = {}, rootReducer) {
  // const logger = store =>
  //   next =>
  //     action => {
  //       console.log("dispatching", action);
  //       let result = next(action);
  //       console.log("next state", store.getState());
  //       return result;
  //     };
  const crashReporter = store => next => action => {
    try {
      return next(action);
    } catch (err) {
      console.error("Caught an exception!", err);
      // throw err;
    }
  };
  const store = createStore(
    rootReducer,
    initialState,
    composeWithDevTools(applyMiddleware(crashReporter))
  );

  return store;
}
