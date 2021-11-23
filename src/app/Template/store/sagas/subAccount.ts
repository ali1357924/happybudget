import { SagaIterator } from "redux-saga";
import { call, put, select, spawn, all, takeLatest } from "redux-saga/effects";
import { isNil, filter, intersection } from "lodash";

import * as api from "api";
import { budgeting, tabling, notifications } from "lib";

import { SubAccountsTable } from "components/tabling";

import {
  subAccount as actions,
  loadingTemplateAction,
  updateTemplateInStateAction,
  responseFringesAction,
  responseFringeColorsAction,
  responseSubAccountUnitsAction
} from "../actions";

function* getSubAccount(action: Redux.Action<null>): SagaIterator {
  const subaccountId = yield select((state: Application.Authenticated.Store) => state.template.subaccount.id);
  if (!isNil(subaccountId)) {
    try {
      const response: Model.SubAccount = yield api.request(api.getSubAccount, subaccountId);
      yield put(actions.responseSubAccountAction(response));
    } catch (e: unknown) {
      notifications.requestError(e as Error, "There was an error retrieving the sub account.");
      yield put(actions.responseSubAccountAction(null));
    }
  }
}

const ActionMap = {
  updateParentInState: actions.updateInStateAction,
  tableChanged: actions.handleTableChangeEventAction,
  clear: actions.clearAction,
  loading: actions.loadingAction,
  response: actions.responseAction,
  saving: actions.savingTableAction,
  addModelsToState: actions.addModelsToStateAction,
  loadingBudget: loadingTemplateAction,
  updateBudgetInState: updateTemplateInStateAction,
  setSearch: actions.setSearchAction,
  responseFringes: responseFringesAction,
  responseSubAccountUnits: responseSubAccountUnitsAction,
  responseFringeColors: responseFringeColorsAction
};

const Tasks = budgeting.tasks.subaccounts.createTableTaskSet<Model.SubAccount, Model.Template>({
  columns: filter(
    SubAccountsTable.Columns as Table.Column<Tables.SubAccountRowData, Model.SubAccount>[],
    (c: Table.Column<Tables.SubAccountRowData, Model.SubAccount>) =>
      intersection([c.field, c.colId], ["variance", "contact", "actual"]).length === 0
  ),
  selectBudgetId: (state: Application.Authenticated.Store) => state.template.id,
  selectObjId: (state: Application.Authenticated.Store) => state.template.subaccount.id,
  actions: ActionMap,
  services: {
    request: api.getSubAccountSubAccounts,
    requestMarkups: api.getSubAccountSubAccountMarkups,
    requestGroups: api.getSubAccountSubAccountGroups,
    requestFringes: api.getTemplateFringes,
    bulkCreate: api.bulkCreateSubAccountSubAccounts,
    bulkDelete: api.bulkDeleteSubAccountSubAccounts,
    bulkUpdate: api.bulkUpdateSubAccountSubAccounts,
    bulkDeleteMarkups: api.bulkDeleteSubAccountMarkups
  }
});

const tableSaga = tabling.sagas.createAuthenticatedTableSaga<
  Tables.SubAccountRowData,
  Model.SubAccount,
  Redux.AuthenticatedTableActionMap<Tables.SubAccountRowData, Model.SubAccount>
>({
  actions: ActionMap,
  tasks: Tasks
});

function* getData(action: Redux.Action<any>): SagaIterator {
  yield all([call(getSubAccount, action), call(Tasks.request, action)]);
}

export default function* rootSaga(): SagaIterator {
  yield takeLatest(actions.requestSubAccountAction.toString(), getSubAccount);
  yield takeLatest(actions.setSubAccountIdAction.toString(), getData);
  yield spawn(tableSaga);
}
