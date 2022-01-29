import * as api from "api";
import { budgeting, tabling } from "lib";

import { accounts as actions, loadingBudgetAction, updateBudgetInStateAction } from "../actions";

const ActionMap: Redux.AuthenticatedTableActionMap<Tables.AccountRowData, Model.Account, Tables.AccountTableContext> & {
  readonly loadingBudget: Redux.ActionCreator<boolean>;
  readonly updateBudgetInState: Redux.ActionCreator<Redux.UpdateActionPayload<Model.Budget>>;
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
    tasks: budgeting.tasks.accounts.createTableTaskSet<Model.Budget>({
      table,
      selectStore: (state: Application.AuthenticatedStore) => state.budget.accounts,
      actions: ActionMap,
      services: {
        create: api.createBudgetChild,
        request: api.getBudgetChildren,
        requestGroups: api.getBudgetGroups,
        requestMarkups: api.getBudgetMarkups,
        bulkCreate: api.bulkCreateBudgetChildren,
        bulkDelete: api.bulkDeleteBudgetChildren,
        bulkUpdate: api.bulkUpdateBudgetChildren,
        bulkDeleteMarkups: api.bulkDeleteBudgetMarkups
      }
    })
  });
