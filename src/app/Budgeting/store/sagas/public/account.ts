import { SagaIterator } from "redux-saga";
import { put, takeLatest, spawn } from "redux-saga/effects";

import * as api from "api";
import { budgeting, tabling, notifications } from "lib";

import {
  account as actions,
  responseFringesAction,
  loadingBudgetAction,
  responseSubAccountUnitsAction,
  responseFringeColorsAction
} from "../../actions/public";

function* getAccount(action: Redux.Action<number>): SagaIterator {
  try {
    const response: Model.Account = yield api.request(api.getAccount, action.context, action.payload);
    yield put(actions.responseAccountAction(response));
  } catch (e: unknown) {
    notifications.ui.banner.handleRequestError(e as Error);
    yield put(actions.responseAccountAction(null));
  }
}

const ActionMap = {
  loading: actions.loadingAction,
  response: actions.responseAction,
  loadingBudget: loadingBudgetAction,
  setSearch: actions.setSearchAction,
  responseFringes: responseFringesAction,
  responseFringeColors: responseFringeColorsAction,
  responseSubAccountUnits: responseSubAccountUnitsAction
};

export const createTableSaga = (table: Table.TableInstance<Tables.SubAccountRowData, Model.SubAccount>) =>
  tabling.sagas.createPublicTableSaga<Model.SubAccount, Tables.SubAccountTableContext>({
    actions: { ...ActionMap, request: actions.requestAction },
    tasks: budgeting.tasks.subaccounts.createPublicTableTaskSet({
      table,
      actions: ActionMap,
      services: {
        request: api.getAccountChildren,
        requestGroups: api.getAccountGroups,
        requestMarkups: api.getAccountMarkups
      }
    })
  });

function* watchForRequestAction(): SagaIterator {
  yield takeLatest([actions.requestAccountAction.toString()], getAccount);
}

function* rootSaga(): SagaIterator {
  yield spawn(watchForRequestAction);
}

export default rootSaga;