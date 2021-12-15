import { SagaIterator } from "redux-saga";
import { put, takeLatest } from "redux-saga/effects";

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
    notifications.requestError(e as Error, { message: "There was an error retrieving the account." });
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

export const createTableSaga = (
  table: PotentiallyNullRef<Table.TableInstance<Tables.SubAccountRowData, Model.SubAccount>>
) =>
  tabling.sagas.createAuthenticatedTableSaga<
    Tables.SubAccountRowData,
    Model.SubAccount,
    Tables.SubAccountTableContext,
    Redux.AuthenticatedTableActionMap<Tables.SubAccountRowData, Model.SubAccount, Tables.SubAccountTableContext>
  >({
    actions: { ...ActionMap, request: actions.requestAction },
    tasks: budgeting.tasks.subaccounts.createTableTaskSet<Model.Account, Model.Budget>({
      table,
      selectStore: (state: Application.Authenticated.Store) => state.budget.account.table,
      actions: ActionMap,
      services: {
        create: api.createAccountSubAccount,
        request: api.getAccountSubAccounts,
        requestGroups: api.getAccountSubAccountGroups,
        requestMarkups: api.getAccountSubAccountMarkups,
        requestFringes: api.getBudgetFringes,
        bulkCreate: api.bulkCreateAccountSubAccounts,
        bulkDelete: api.bulkDeleteAccountSubAccounts,
        bulkUpdate: api.bulkUpdateAccountSubAccounts,
        bulkDeleteMarkups: api.bulkDeleteAccountMarkups
      }
    })
  });

function* rootSaga(): SagaIterator {
  yield takeLatest([actions.requestAccountAction.toString()], getAccount);
}

export default rootSaga;
