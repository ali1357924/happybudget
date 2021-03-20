import { SagaIterator } from "redux-saga";
import { call, put, select } from "redux-saga/effects";
import { isNil, find } from "lodash";
import { handleRequestError } from "api";
import {
  getAccounts,
  deleteAccount,
  updateAccount,
  createAccount,
  getBudgetComments,
  createBudgetComment,
  deleteComment,
  updateComment,
  replyToComment,
  getAccountsHistory
} from "services";
import { handleTableErrors } from "store/tasks";
import { userToSimpleUser } from "model/mappings";
import { nowAsString } from "util/dates";
import { generateRandomNumericId } from "util/math";
import {
  payloadFromResponse,
  postPayload,
  patchPayload,
  rowHasRequiredFields,
  payloadBeforeResponse
} from "../../util";
import {
  loadingAccountsAction,
  responseAccountsAction,
  deletingAccountAction,
  creatingAccountAction,
  updatingAccountAction,
  updateAccountsTableRowAction,
  activateAccountsTablePlaceholderAction,
  removeAccountsTableRowAction,
  addErrorsToAccountsTableAction,
  addAccountsTablePlaceholdersAction,
  loadingBudgetCommentsAction,
  responseBudgetCommentsAction,
  submittingBudgetCommentAction,
  addBudgetCommentToStateAction,
  deletingBudgetCommentAction,
  removeBudgetCommentFromStateAction,
  updateBudgetCommentInStateAction,
  editingBudgetCommentAction,
  replyingToBudgetCommentAction,
  loadingAccountsHistoryAction,
  responseAccountsHistoryAction,
  addAccountsHistoryToStateAction
} from "../actions";

export function* getAccountsHistoryTask(action: Redux.IAction<null>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId)) {
    yield put(loadingAccountsHistoryAction(true));
    try {
      const response: Http.IListResponse<IFieldAlterationEvent> = yield call(getAccountsHistory, budgetId);
      yield put(responseAccountsHistoryAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the accounts history.");
    } finally {
      yield put(loadingAccountsHistoryAction(false));
    }
  }
}

export function* submitBudgetCommentTask(
  action: Redux.IAction<{ parent?: number; data: Http.ICommentPayload }>
): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId) && !isNil(action.payload)) {
    const { parent, data } = action.payload;
    if (!isNil(parent)) {
      yield put(replyingToBudgetCommentAction({ id: parent, value: true }));
    } else {
      yield put(submittingBudgetCommentAction(true));
    }
    try {
      let response: IComment;
      if (!isNil(parent)) {
        response = yield call(replyToComment, parent, data.text);
      } else {
        response = yield call(createBudgetComment, budgetId, data);
      }
      yield put(addBudgetCommentToStateAction({ data: response, parent }));
    } catch (e) {
      handleRequestError(e, "There was an error submitting the comment.");
    } finally {
      if (!isNil(parent)) {
        yield put(replyingToBudgetCommentAction({ id: parent, value: false }));
      } else {
        yield put(submittingBudgetCommentAction(false));
      }
    }
  }
}

export function* deleteBudgetCommentTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(deletingBudgetCommentAction({ id: action.payload, value: true }));
    try {
      yield call(deleteComment, action.payload);
      yield put(removeBudgetCommentFromStateAction(action.payload));
    } catch (e) {
      handleRequestError(e, "There was an error deleting the comment.");
    } finally {
      yield put(deletingBudgetCommentAction({ id: action.payload, value: false }));
    }
  }
}

export function* editBudgetCommentTask(action: Redux.IAction<Redux.UpdateModelActionPayload<IComment>>): SagaIterator {
  if (!isNil(action.payload)) {
    const { id, data } = action.payload;
    yield put(editingBudgetCommentAction({ id, value: true }));
    try {
      // Here we are assuming that Partial<IComment> can be mapped to Partial<Http.ICommentPayload>,
      // which is the case right now but may not be in the future.
      const response: IComment = yield call(updateComment, id, data as Partial<Http.ICommentPayload>);
      yield put(updateBudgetCommentInStateAction({ id, data: response }));
    } catch (e) {
      handleRequestError(e, "There was an error updating the comment.");
    } finally {
      yield put(editingBudgetCommentAction({ id, value: false }));
    }
  }
}

export function* getBudgetCommentsTask(action: Redux.IAction<any>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId)) {
    yield put(loadingBudgetCommentsAction(true));
    try {
      // TODO: We will have to build in pagination.
      const response = yield call(getBudgetComments, budgetId);
      yield put(responseBudgetCommentsAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the budget's comments.");
      yield put(responseBudgetCommentsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingBudgetCommentsAction(false));
    }
  }
}

export function* handleAccountRemovalTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    const tableData: Table.IAccountRow[] = yield select(
      (state: Redux.IApplicationStore) => state.calculator.accounts.table.data
    );
    const existing: Table.IAccountRow | undefined = find(tableData, { id: action.payload });
    if (isNil(existing)) {
      /* eslint-disable no-console */
      console.warn(
        `Inconsistent State!  Inconsistent state noticed when removing an account...
        The account with ID ${action.payload} does not exist in state when it is expected to.`
      );
    } else {
      // Dispatch the action to remove the row from the table in the UI.
      yield put(removeAccountsTableRowAction(action.payload));
      // Only make an API request to the server to delete the sub account if the
      // row was not a placeholder (i.e. the sub account exists in the backend).
      if (existing.meta.isPlaceholder === false) {
        yield put(deletingAccountAction({ id: action.payload, value: true }));
        try {
          yield call(deleteAccount, action.payload);
        } catch (e) {
          // TODO: Should we put the row back in if there was an error?
          handleRequestError(e, "There was an error deleting the account.");
        } finally {
          yield put(deletingAccountAction({ id: action.payload, value: false }));
        }
      }
    }
  }
}

export function* handleAccountUpdateTask(action: Redux.IAction<Table.RowChange>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(action.payload) && !isNil(action.payload.id)) {
    const table = yield select((state: Redux.IApplicationStore) => state.calculator.accounts.table.data);

    const existing: Table.IAccountRow = find(table, { id: action.payload.id });
    if (isNil(existing)) {
      /* eslint-disable no-console */
      console.error(
        `Inconsistent State!:  Inconsistent state noticed when updating account in state...
        the account with ID ${action.payload.id} does not exist in state when it is expected to.`
      );
    } else {
      // There are some cases where we need to update the row in the table before
      // we make the request, to improve the UI.  This happens for cells where the
      // value is rendered via an HTML element (i.e. the Unit Cell).  AGGridReact will
      // not automatically update the cell when the Unit is changed via the dropdown,
      // so we need to udpate the row in the data used to populate the table.  We could
      // do this by updating with a payload generated from the response, but it is quicker
      // to do it before hand.
      const preResponsePayload = payloadBeforeResponse(action.payload, "account");
      if (Object.keys(preResponsePayload).length !== 0) {
        yield put(
          updateAccountsTableRowAction({
            id: existing.id,
            data: preResponsePayload
          })
        );
      }
      if (existing.meta.isPlaceholder === true) {
        // TODO: Should we be using the payload data here?  Instead of the existing row?
        // Or we should probably merge them, right?
        const requestPayload = postPayload<Table.IAccountRow>(existing, "account");
        // Wait until all of the required fields are present before we create the entity in the
        // backend.  Once the entity is created in the backend, we can remove the placeholder
        // designation of the row so it will be updated instead of created the next time the row
        // is changed.
        if (rowHasRequiredFields<Table.IAccountRow>(existing, "account")) {
          yield put(creatingAccountAction(true));
          try {
            const response: IAccount = yield call(createAccount, budgetId, requestPayload as Http.IAccountPayload);
            yield put(activateAccountsTablePlaceholderAction({ oldId: existing.id, id: response.id }));
            const responsePayload = payloadFromResponse<IAccount>(response, "account");
            yield put(updateAccountsTableRowAction({ id: response.id, data: responsePayload }));
          } catch (e) {
            yield call(
              handleTableErrors,
              e,
              "There was an error updating the account.",
              existing.id,
              (errors: Table.ICellError[]) => addErrorsToAccountsTableAction(errors)
            );
          } finally {
            yield put(creatingAccountAction(false));
          }
        }
      } else {
        yield put(updatingAccountAction({ id: existing.id as number, value: true }));
        const requestPayload = patchPayload(action.payload, "account") as Partial<Http.IAccountPayload>;
        try {
          const response: IAccount = yield call(updateAccount, existing.id as number, requestPayload);
          const responsePayload = payloadFromResponse<IAccount>(response, "account");
          yield put(updateAccountsTableRowAction({ id: response.id, data: responsePayload }));

          const user = yield select((state: Redux.IApplicationStore) => state.user);

          // Here, instead of refreshing the history from the API we can just add
          // "mock" objects to the state so the history updates with less latency.
          // This is not a big deal because there are no write operations associated
          // with history, just read.
          const fields = Object.keys(action.payload.data);
          for (let i = 0; i < fields.length; i++) {
            yield put(
              addAccountsHistoryToStateAction({
                id: generateRandomNumericId(),
                created_at: nowAsString(),
                new_value: action.payload.data[fields[i]].newValue,
                old_value: action.payload.data[fields[i]].oldValue,
                object_id: response.id,
                content_object_type: "account",
                type: "field_alteration",
                user: userToSimpleUser(user),
                field: fields[i]
              })
            );
          }
        } catch (e) {
          yield call(
            handleTableErrors,
            e,
            "There was an error updating the account.",
            existing.id,
            (errors: Table.ICellError[]) => addErrorsToAccountsTableAction(errors)
          );
        } finally {
          yield put(updatingAccountAction({ id: existing.id as number, value: false }));
        }
      }
    }
  }
}

export function* getAccountsTask(action: Redux.IAction<null>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId)) {
    yield put(loadingAccountsAction(true));
    try {
      const response = yield call(getAccounts, budgetId, { no_pagination: true });
      yield put(responseAccountsAction(response));
      if (response.data.length === 0) {
        yield put(addAccountsTablePlaceholdersAction(2));
      }
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the budget's accounts.");
      yield put(responseAccountsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingAccountsAction(false));
    }
  }
}
