import { SagaIterator, Saga } from "redux-saga";
import { spawn } from "redux-saga/effects";
import { isNil } from "lodash";

export function* RootSaga(): SagaIterator {}

const createApplicationSaga = (config: Modules.ApplicationConfig): Saga => {
  function* applicationSaga(): SagaIterator {
    for (var i = 0; i < config.length; i++) {
      const moduleConfig: Modules.ModuleConfig<any, any> = config[i];
      if (!isNil(moduleConfig.rootSaga)) {
        yield spawn(moduleConfig.rootSaga);
      }
    }
    // Spawn the main application saga.
    yield spawn(RootSaga);
  }
  return applicationSaga;
};

export default createApplicationSaga;
