import { isNil } from "lodash";
import { SagaIterator } from "redux-saga";
import { call, put } from "redux-saga/effects";
import { getAccounts, deleteAccount } from "services";
import { handleRequestError } from "store/tasks";
import { loadingBudgetAccountsAction, responseBudgetAccountsAction, deletingAccountAction } from "./actions";

// TODO: Build in Pagination with AGGrid.
export function* getBudgetAccountsTask(action: Redux.Budget.IAction<any>): SagaIterator {
  if (!isNil(action.budgetId)) {
    yield put(loadingBudgetAccountsAction(action.budgetId, true));
    try {
      // TODO: Build in Pagination with AGGrid.
      const response = yield call(getAccounts, action.budgetId, { no_pagination: true });
      yield put(responseBudgetAccountsAction(action.budgetId, response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the budget accounts.");
      yield put(responseBudgetAccountsAction(action.budgetId, { count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingBudgetAccountsAction(action.budgetId, false));
    }
  }
}

export function* deleteAccountTask(action: Redux.Budget.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(deletingAccountAction({ id: action.payload, value: true }));
    try {
      yield call(deleteAccount, action.payload);
    } catch (e) {
      handleRequestError(e, "There was an error deleting the account.");
    } finally {
      yield put(deletingAccountAction({ id: action.payload, value: false }));
    }
  }
}
