import { SagaIterator } from "redux-saga";
import { spawn, takeLatest, call, put, select, cancelled, all } from "redux-saga/effects";
import axios, { CancelTokenSource } from "axios";
import { isNil } from "lodash";

import * as api from "api";
import { budgeting, tabling } from "lib";
import { FringesTable } from "components/tabling";

import * as actions from "../actions";

import accountSaga from "./account";
import accountsSaga from "./accounts";
import actualsSaga from "./actuals";
import subAccountSaga from "./subAccount";
import pdfSaga from "./pdf";

const FringesActionMap = {
  requestAccount: actions.account.requestAccountAction,
  requestSubAccount: actions.subAccount.requestSubAccountAction,
  requestAccountTableData: actions.account.requestAction,
  requestSubAccountTableData: actions.subAccount.requestAction,
  tableChanged: actions.handleFringesTableChangeEventAction,
  loading: actions.loadingFringesAction,
  response: actions.responseFringesAction,
  saving: actions.savingFringesTableAction,
  clear: actions.clearFringesAction,
  addModelsToState: actions.addFringeModelsToStateAction,
  loadingBudget: actions.loadingBudgetAction,
  updateBudgetInState: actions.updateBudgetInStateAction,
  setSearch: actions.setFringesSearchAction,
  responseFringeColors: actions.responseFringeColorsAction
};

const FringesTasks = budgeting.tasks.fringes.createTableTaskSet<Model.Budget>({
  columns: FringesTable.Columns,
  selectObjId: (state: Application.Authenticated.Store) => state.budget.id,
  selectAccountTableData: (state: Application.Authenticated.Store) => state.budget.account.table.data,
  selectSubAccountTableData: (state: Application.Authenticated.Store) => state.budget.subaccount.table.data,
  actions: FringesActionMap,
  services: {
    request: api.getBudgetFringes,
    bulkCreate: api.bulkCreateBudgetFringes,
    bulkDelete: api.bulkDeleteBudgetFringes,
    bulkUpdate: api.bulkUpdateBudgetFringes
  }
});

const fringesTableSaga = tabling.sagas.createAuthenticatedTableSaga<Tables.FringeRowData, Model.Fringe>({
  actions: FringesActionMap,
  tasks: FringesTasks
});

function* getBudgetTask(action: Redux.Action<null>, source: CancelTokenSource): SagaIterator {
  const budgetId = yield select((state: Application.Authenticated.Store) => state.budget.id);
  if (!isNil(budgetId)) {
    yield put(actions.loadingBudgetAction(true));
    try {
      const response: Model.Budget = yield call(api.getBudget, budgetId, { cancelToken: source.token });
      yield put(actions.responseBudgetAction(response));
    } catch (e: unknown) {
      if (!(yield cancelled())) {
        api.handleRequestError(e as Error, "There was an error retrieving the budget.");
        yield put(actions.responseBudgetAction(null));
      }
    } finally {
      yield put(actions.loadingBudgetAction(false));
    }
  }
}

function* getData(action: Redux.Action<any>): SagaIterator {
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  try {
    yield all([call(getBudgetTask, action, source), call(FringesTasks.request, action)]);
  } finally {
    if (yield cancelled()) {
      source.cancel("cancelled");
    }
  }
}

function* watchForBudgetIdChangedSaga(): SagaIterator {
  yield takeLatest(actions.setBudgetIdAction.toString(), getData);
}

export default function* rootSaga(): SagaIterator {
  yield spawn(watchForBudgetIdChangedSaga);
  yield spawn(fringesTableSaga);
  yield spawn(accountSaga);
  yield spawn(accountsSaga);
  yield spawn(actualsSaga);
  yield spawn(subAccountSaga);
  yield spawn(pdfSaga);
}
