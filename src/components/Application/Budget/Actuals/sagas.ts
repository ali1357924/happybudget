import { SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, takeEvery } from "redux-saga/effects";
import { ActionType } from "./actions";
import { getActualsTask, handleActualRemovalTask, handleActualUpdateTask } from "./tasks";

function* watchForTriggerBudgetActualsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.ActualsTable.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getActualsTask, action);
  }
}

function* watchForRemoveActualSaga(): SagaIterator {
  yield takeEvery(ActionType.Remove, handleActualRemovalTask);
}

function* watchForActualUpdateSaga(): SagaIterator {
  yield takeEvery(ActionType.Update, handleActualUpdateTask);
}

export default function* rootSaga(): SagaIterator {
  yield spawn(watchForTriggerBudgetActualsSaga);
  yield spawn(watchForRemoveActualSaga);
  yield spawn(watchForActualUpdateSaga);
}
