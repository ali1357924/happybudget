import { SagaIterator } from "redux-saga";
import { put, takeLatest, spawn } from "redux-saga/effects";

import * as api from "api";
import { budgeting, tabling, notifications } from "lib";

import {
  account as actions,
  responseFringesAction,
  loadingBudgetAction,
  updateBudgetInStateAction,
  responseSubAccountUnitsAction,
  responseFringeColorsAction
} from "../actions";

function* getAccount(action: Redux.Action<number>): SagaIterator {
  try {
    const response: Model.Account = yield api.request(api.getAccount, action.payload);
    yield put(actions.responseAccountAction(response));
  } catch (e: unknown) {
    notifications.ui.handleBannerRequestError(e as Error);
    yield put(actions.responseAccountAction(null));
  }
}

const ActionMap = {
  updateParentInState: actions.updateInStateAction,
  tableChanged: actions.handleTableChangeEventAction,
  loading: actions.loadingAction,
  response: actions.responseAction,
  saving: actions.savingTableAction,
  addModelsToState: actions.addModelsToStateAction,
  loadingBudget: loadingBudgetAction,
  updateBudgetInState: updateBudgetInStateAction,
  setSearch: actions.setSearchAction,
  responseFringes: responseFringesAction,
  responseFringeColors: responseFringeColorsAction,
  responseSubAccountUnits: responseSubAccountUnitsAction
};

export const createTableSaga = (table: Table.TableInstance<Tables.SubAccountRowData, Model.SubAccount>) =>
  tabling.sagas.createAuthenticatedTableSaga<
    Tables.SubAccountRowData,
    Model.SubAccount,
    Tables.SubAccountTableContext,
    Redux.AuthenticatedTableActionMap<Tables.SubAccountRowData, Model.SubAccount, Tables.SubAccountTableContext>
  >({
    actions: { ...ActionMap, request: actions.requestAction },
    tasks: budgeting.tasks.subaccounts.createTableTaskSet<Model.Account, Model.Template>({
      table,
      selectStore: (state: Application.AuthenticatedStore) => state.template.account.table,
      actions: ActionMap,
      services: {
        create: api.createAccountSubAccount,
        request: api.getAccountSubAccounts,
        requestGroups: api.getAccountSubAccountGroups,
        requestMarkups: api.getAccountSubAccountMarkups,
        requestFringes: api.getTemplateFringes,
        bulkCreate: api.bulkCreateAccountSubAccounts,
        bulkDelete: api.bulkDeleteAccountSubAccounts,
        bulkUpdate: api.bulkUpdateAccountSubAccounts,
        bulkDeleteMarkups: api.bulkDeleteAccountMarkups
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
