import { SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, takeEvery } from "redux-saga/effects";
import { ActionType } from "../../actions";
import {
  getActualsTask,
  handleActualRemovalTask,
  handleActualUpdateTask,
  handleActualsBulkUpdateTask
} from "../../tasks/budget/actuals";

function* watchForRequestActualsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.Budget.Actuals.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getActualsTask, action);
  }
}

function* watchForBulkUpdateActualsSaga(): SagaIterator {
  yield takeEvery(ActionType.Budget.BulkUpdateActuals, handleActualsBulkUpdateTask);
}

function* watchForRemoveActualSaga(): SagaIterator {
  yield takeEvery(ActionType.Budget.Actuals.Remove, handleActualRemovalTask);
}

function* watchForActualUpdateSaga(): SagaIterator {
  yield takeEvery(ActionType.Budget.Actuals.Update, handleActualUpdateTask);
}

export default function* rootSaga(): SagaIterator {
  yield spawn(watchForRequestActualsSaga);
  yield spawn(watchForRemoveActualSaga);
  yield spawn(watchForActualUpdateSaga);
  yield spawn(watchForBulkUpdateActualsSaga);
}