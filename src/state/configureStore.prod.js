import { createStore, combineReducers } from "redux";

export default function configureStore(initialState, rootReducer) {
  return createStore(combineReducers(rootReducer), initialState);
}
