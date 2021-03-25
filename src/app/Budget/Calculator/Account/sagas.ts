import { SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, takeEvery } from "redux-saga/effects";
import { isNil } from "lodash";
import { ActionType } from "./actions";
import {
  getAccountTask,
  getSubAccountsTask,
  handleSubAccountUpdateTask,
  handleSubAccountRemovalTask,
  handleAccountChangedTask,
  getAccountCommentsTask,
  submitCommentTask,
  deleteCommentTask,
  editAccountCommentTask,
  getSubAccountsHistoryTask,
  deleteSubAccountGroupTask,
  addSubAccountGroupToStateTask
} from "./tasks";

function* watchForRequestSubAccountsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccounts.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getSubAccountsTask, action);
  }
}

function* watchForRemoveSubAccountSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccounts.Remove, handleSubAccountRemovalTask);
}

function* watchForUpdateSubAccountSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccounts.Update, handleSubAccountUpdateTask);
}

function* watchForRequestAccountSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.Account.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getAccountTask, action);
  }
}

function* watchForAccountIdChangedSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.Account.SetId);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(handleAccountChangedTask, action);
  }
}

function* watchForRequestCommentsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.Comments.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getAccountCommentsTask, action);
  }
}

function* watchForSubmitCommentSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.Comments.Submit);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(submitCommentTask, action);
  }
}

function* watchForRemoveCommentSaga(): SagaIterator {
  yield takeEvery(ActionType.Comments.Delete, deleteCommentTask);
}

function* watchForEditCommentSaga(): SagaIterator {
  yield takeEvery(ActionType.Comments.Edit, editAccountCommentTask);
}

function* watchForRequestSubAccountsHistorySaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccounts.History.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getSubAccountsHistoryTask, action);
  }
}

function* watchForAddGroupToStateSaga(): SagaIterator {
  let lastTasks: { [key: number]: any[] } = {};
  while (true) {
    const action: Redux.IAction<ISubAccountGroup> = yield take(ActionType.SubAccounts.Groups.AddToState);
    if (!isNil(action.payload)) {
      if (isNil(lastTasks[action.payload.id])) {
        lastTasks[action.payload.id] = [];
      }
      // If there were any previously submitted tasks to add the same group,
      // cancel them.
      if (lastTasks[action.payload.id].length !== 0) {
        const cancellable = lastTasks[action.payload.id];
        lastTasks = { ...lastTasks, [action.payload.id]: [] };
        yield cancel(cancellable);
      }
      lastTasks[action.payload.id].push(yield call(addSubAccountGroupToStateTask, action));
    }
  }
}

function* watchForDeleteGroupSaga(): SagaIterator {
  let lastTasks: { [key: number]: any[] } = {};
  while (true) {
    const action: Redux.IAction<number> = yield take(ActionType.SubAccounts.Groups.Delete);
    if (!isNil(action.payload)) {
      if (isNil(lastTasks[action.payload])) {
        lastTasks[action.payload] = [];
      }
      // If there were any previously submitted tasks to delete the same group,
      // cancel them.
      if (lastTasks[action.payload].length !== 0) {
        const cancellable = lastTasks[action.payload];
        lastTasks = { ...lastTasks, [action.payload]: [] };
        yield cancel(cancellable);
      }
      lastTasks[action.payload].push(yield call(deleteSubAccountGroupTask, action));
    }
  }
}

export default function* accountSaga(): SagaIterator {
  yield spawn(watchForAccountIdChangedSaga);
  yield spawn(watchForRequestSubAccountsHistorySaga);
  yield spawn(watchForRequestAccountSaga);
  yield spawn(watchForRequestSubAccountsSaga);
  yield spawn(watchForRemoveSubAccountSaga);
  yield spawn(watchForUpdateSubAccountSaga);
  yield spawn(watchForRequestCommentsSaga);
  yield spawn(watchForSubmitCommentSaga);
  yield spawn(watchForRemoveCommentSaga);
  yield spawn(watchForEditCommentSaga);
  yield spawn(watchForDeleteGroupSaga);
  yield spawn(watchForAddGroupToStateSaga);
}
