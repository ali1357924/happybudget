import * as api from "api";
import { budgeting, tabling } from "lib";

import { accounts as actions, loadingBudgetAction, updateBudgetInStateAction } from "../actions";

const ActionMap: Redux.AuthenticatedTableActionMap<Tables.AccountRowData, Model.Account, Tables.AccountTableContext> & {
  readonly loadingBudget: Redux.ActionCreator<boolean>;
  readonly updateBudgetInState: Redux.ActionCreator<Redux.UpdateActionPayload<Model.Template>>;
} = {
  request: actions.requestAction,
  tableChanged: actions.handleTableChangeEventAction,
  loading: actions.loadingAction,
  response: actions.responseAction,
  addModelsToState: actions.addModelsToStateAction,
  loadingBudget: loadingBudgetAction,
  updateBudgetInState: updateBudgetInStateAction,
  setSearch: actions.setSearchAction
};

export const createTableSaga = (table: Table.TableInstance<Tables.AccountRowData, Model.Account>) =>
  tabling.sagas.createAuthenticatedTableSaga<
    Tables.AccountRowData,
    Model.Account,
    Tables.AccountTableContext,
    Redux.AuthenticatedTableActionMap<Tables.AccountRowData, Model.Account, Tables.AccountTableContext>
  >({
    actions: ActionMap,
    tasks: budgeting.tasks.accounts.createTableTaskSet<Model.Template>({
      table,
      selectStore: (state: Application.AuthenticatedStore) => state.template.accounts,
      actions: ActionMap,
      services: {
        create: api.createTemplateAccount,
        request: api.getTemplateAccounts,
        requestGroups: api.getTemplateAccountGroups,
        requestMarkups: api.getTemplateAccountMarkups,
        bulkCreate: api.bulkCreateTemplateAccounts,
        bulkDelete: api.bulkDeleteTemplateAccounts,
        bulkUpdate: api.bulkUpdateTemplateAccounts,
        bulkDeleteMarkups: api.bulkDeleteTemplateMarkups
      }
    })
  });
