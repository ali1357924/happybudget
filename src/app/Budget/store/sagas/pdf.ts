import { SagaIterator } from "redux-saga";
import { spawn, take, cancel, fork, put } from "redux-saga/effects";

import * as api from "api";
import { notifications } from "lib";

import { ActionType } from "../actions";
import * as actions from "../actions/pdf";

function* loadHeaderTemplateTask(id: number): SagaIterator {
  yield put(actions.setLoadingHeaderTemplateDetailAction(true));
  try {
    const response: Model.HeaderTemplate = yield api.request(api.getHeaderTemplate, id);
    yield put(actions.displayHeaderTemplateAction(response));
  } catch (e: unknown) {
    notifications.requestError(e as Error, "There was an error loading the header template.");
  } finally {
    yield put(actions.setLoadingHeaderTemplateDetailAction(false));
  }
}

function* watchForLoadHeaderTemplateTask(): SagaIterator {
  let lastTasks;
  while (true) {
    const action: Redux.Action<number> = yield take(ActionType.HeaderTemplates.Load);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield fork(loadHeaderTemplateTask, action.payload);
  }
}

function* getHeaderTemplatesTask(): SagaIterator {
  yield put(actions.loadingHeaderTemplatesAction(true));
  try {
    const response: Http.ListResponse<Model.SimpleHeaderTemplate> = yield api.request(api.getHeaderTemplates, {});
    yield put(actions.responseHeaderTemplatesAction(response));
  } catch (e: unknown) {
    notifications.requestError(e as Error, "There was an error retrieving the header templates.");
    yield put(actions.responseHeaderTemplatesAction({ data: [], count: 0 }));
  } finally {
    yield put(actions.loadingHeaderTemplatesAction(false));
  }
}

function* watchForRequestHeaderTemplatesSaga(): SagaIterator {
  let lastTasks;
  while (true) {
    yield take(ActionType.HeaderTemplates.Request);
    if (lastTasks) {
      yield cancel(lastTasks);
    }
    lastTasks = yield fork(getHeaderTemplatesTask);
  }
}

export default function* rootSaga(): SagaIterator {
  yield spawn(watchForRequestHeaderTemplatesSaga);
  yield spawn(watchForLoadHeaderTemplateTask);
}
