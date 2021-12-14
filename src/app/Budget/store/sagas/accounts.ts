import { SagaIterator } from "redux-saga";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { spawn } from "redux-saga/effects";

import * as api from "api";
import { budgeting, tabling } from "lib";

import { AccountsTable } from "tabling";

import { accounts as actions, loadingBudgetAction, updateBudgetInStateAction } from "../actions";

const ActionMap: Redux.ActionMapObject<Redux.AuthenticatedTableActionMap<Tables.AccountRowData, Model.Account>> & {
  readonly request: ActionCreatorWithPayload<Redux.TableRequestPayload>;
  readonly loadingBudget: ActionCreatorWithPayload<boolean>;
  readonly updateBudgetInState: ActionCreatorWithPayload<Redux.UpdateActionPayload<Model.Budget>>;
} = {
  request: actions.requestAction,
  tableChanged: actions.handleTableChangeEventAction,
  loading: actions.loadingAction,
  response: actions.responseAction,
  saving: actions.savingTableAction,
  addModelsToState: actions.addModelsToStateAction,
  loadingBudget: loadingBudgetAction,
  updateBudgetInState: updateBudgetInStateAction,
  setSearch: actions.setSearchAction
};

const tableSaga = tabling.sagas.createAuthenticatedTableSaga<
  Tables.AccountRowData,
  Model.Account,
  Redux.AuthenticatedTableActionMap<Tables.AccountRowData, Model.Account> & {
    readonly request: Redux.TableRequestPayload;
  }
>({
  actions: ActionMap,
  tasks: budgeting.tasks.accounts.createTableTaskSet<Model.Budget>({
    columns: AccountsTable.Columns,
    selectObjId: (state: Application.Authenticated.Store) => state.budget.id,
    selectStore: (state: Application.Authenticated.Store) => state.budget.accounts,
    actions: ActionMap,
    services: {
      create: api.createBudgetAccount,
      request: api.getBudgetAccounts,
      requestGroups: api.getBudgetAccountGroups,
      requestMarkups: api.getBudgetAccountMarkups,
      bulkCreate: api.bulkCreateBudgetAccounts,
      bulkDelete: api.bulkDeleteBudgetAccounts,
      bulkUpdate: api.bulkUpdateBudgetAccounts,
      bulkDeleteMarkups: api.bulkDeleteBudgetMarkups
    }
  })
});

export default function* rootSaga(): SagaIterator {
  yield spawn(tableSaga);
}
