import { SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, takeEvery } from "redux-saga/effects";
import { isNil } from "lodash";
import { ActionType } from "../actions";
import {
  getSubAccountTask,
  getSubAccountsTask,
  handleSubAccountUpdateTask,
  handleSubAccountRemovalTask,
  handleSubAccountChangedTask,
  getCommentsTask,
  submitCommentTask,
  deleteCommentTask,
  editCommentTask,
  getSubAccountsHistoryTask,
  deleteSubAccountGroupTask,
  removeSubAccountFromGroupTask,
  getGroupsTask,
  handleSubAccountBulkUpdateTask
} from "./tasks";

function* watchForRequestSubAccountsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.SubAccounts.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getSubAccountsTask, action);
  }
}

function* watchForRequestGroupsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.SubAccounts.Groups.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getGroupsTask, action);
  }
}

function* watchForBulkUpdateSubAccountSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccount.BulkUpdate, handleSubAccountBulkUpdateTask);
}

function* watchForRemoveSubAccountSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccount.SubAccounts.Remove, handleSubAccountRemovalTask);
}

function* watchForUpdateSubAccountwSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccount.SubAccounts.Update, handleSubAccountUpdateTask);
}

function* watchForSubAccountIdChangedSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.SetId);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(handleSubAccountChangedTask, action);
  }
}

function* watchForRequestSubAccountSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getSubAccountTask, action);
  }
}

function* watchForRequestSubAccountCommentsSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.Comments.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getCommentsTask, action);
  }
}

function* watchForSubmitCommentSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.Comments.Submit);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(submitCommentTask, action);
  }
}

function* watchForRemoveCommentSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccount.Comments.Delete, deleteCommentTask);
}

function* watchForEditCommentSaga(): SagaIterator {
  yield takeEvery(ActionType.SubAccount.Comments.Edit, editCommentTask);
}

function* watchForRequestSubAccountsHistorySaga(): SagaIterator {
  let lastTasks;
  while (true) {
    const action = yield take(ActionType.SubAccount.SubAccounts.History.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield call(getSubAccountsHistoryTask, action);
  }
}

function* watchForDeleteGroupSaga(): SagaIterator {
  let lastTasks: { [key: number]: any[] } = {};
  while (true) {
    const action: Redux.IAction<number> = yield take(ActionType.SubAccount.SubAccounts.Groups.Delete);
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

function* watchForRemoveSubAccountFromGroupSaga(): SagaIterator {
  let lastTasks: { [key: number]: any[] } = {};
  while (true) {
    const action: Redux.IAction<number> = yield take(ActionType.SubAccount.SubAccounts.RemoveFromGroup);
    if (!isNil(action.payload)) {
      if (isNil(lastTasks[action.payload])) {
        lastTasks[action.payload] = [];
      }
      // If there were any previously submitted tasks to remove the same row,
      // cancel them.
      if (lastTasks[action.payload].length !== 0) {
        const cancellable = lastTasks[action.payload];
        lastTasks = { ...lastTasks, [action.payload]: [] };
        yield cancel(cancellable);
      }
      lastTasks[action.payload].push(yield call(removeSubAccountFromGroupTask, action));
    }
  }
}

export default function* subAccountSaga(): SagaIterator {
  yield spawn(watchForRequestSubAccountsSaga);
  yield spawn(watchForSubAccountIdChangedSaga);
  yield spawn(watchForRemoveSubAccountSaga);
  yield spawn(watchForRequestSubAccountSaga);
  yield spawn(watchForUpdateSubAccountwSaga);
  yield spawn(watchForRequestSubAccountCommentsSaga);
  yield spawn(watchForSubmitCommentSaga);
  yield spawn(watchForRemoveCommentSaga);
  yield spawn(watchForEditCommentSaga);
  yield spawn(watchForRequestSubAccountsHistorySaga);
  yield spawn(watchForDeleteGroupSaga);
  yield spawn(watchForRemoveSubAccountFromGroupSaga);
  yield spawn(watchForRequestGroupsSaga);
  yield spawn(watchForBulkUpdateSubAccountSaga);
}