import { SagaIterator } from "redux-saga";
import { call, put, select, all } from "redux-saga/effects";
import { isNil, find, reduce } from "lodash";
import { handleRequestError } from "api";
import { SubAccountMapping } from "model/tableMappings";
import {
  getAccountSubAccounts,
  createAccountSubAccount,
  updateSubAccount,
  deleteSubAccount,
  getAccount,
  getAccountComments,
  createAccountComment,
  deleteComment,
  updateComment,
  replyToComment,
  getAccountSubAccountsHistory,
  deleteSubAccountGroup
} from "services";
import { handleTableErrors } from "store/tasks";
import {
  loadingAccountAction,
  responseAccountAction,
  loadingSubAccountsAction,
  responseSubAccountsAction,
  deletingSubAccountAction,
  creatingSubAccountAction,
  updatingSubAccountAction,
  addErrorsToStateAction,
  requestSubAccountsAction,
  requestAccountAction,
  loadingCommentsAction,
  responseCommentsAction,
  submittingCommentAction,
  addCommentToStateAction,
  deletingCommentAction,
  removeCommentFromStateAction,
  updateCommentInStateAction,
  editingCommentAction,
  replyingToCommentAction,
  loadingHistoryAction,
  responseHistoryAction,
  deletingGroupAction,
  removeGroupFromStateAction,
  updateGroupInStateAction,
  updateAccountInStateAction,
  updateSubAccountInStateAction,
  removeSubAccountFromStateAction,
  addSubAccountToStateAction,
  removePlaceholderFromStateAction,
  addPlaceholdersToStateAction,
  updatePlaceholderInStateAction,
  activatePlaceholderAction
} from "./actions";

export function* removeSubAccountFromGroupTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(updatingSubAccountAction({ id: action.payload, value: true }));
    try {
      const subaccount: ISubAccount = yield call(updateSubAccount, action.payload, { group: null });
      yield put(updateSubAccountInStateAction(subaccount));
    } catch (e) {
      yield call(
        handleTableErrors,
        e,
        "There was an error removing the sub account from the group.",
        action.payload,
        (errors: Table.CellError[]) => addErrorsToStateAction(errors)
      );
    } finally {
      yield put(updatingSubAccountAction({ id: action.payload, value: false }));
    }
  }
}

export function* deleteSubAccountGroupTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(deletingGroupAction({ id: action.payload, value: true }));
    try {
      yield call(deleteSubAccountGroup, action.payload);
      yield put(removeGroupFromStateAction(action.payload));
    } catch (e) {
      handleRequestError(e, "There was an error deleting the sub account group.");
    } finally {
      yield put(deletingGroupAction({ id: action.payload, value: false }));
    }
  }
}

export function* getHistoryTask(action: Redux.IAction<null>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  if (!isNil(accountId) && !isNil(budgetId)) {
    yield put(loadingHistoryAction(true));
    try {
      const response: Http.IListResponse<HistoryEvent> = yield call(getAccountSubAccountsHistory, accountId, budgetId);
      yield put(responseHistoryAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account's sub accounts history.");
    } finally {
      yield put(loadingHistoryAction(false));
    }
  }
}

export function* submitCommentTask(
  action: Redux.IAction<{ parent?: number; data: Http.ICommentPayload }>
): SagaIterator {
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  if (!isNil(accountId) && !isNil(action.payload)) {
    const { parent, data } = action.payload;
    if (!isNil(parent)) {
      yield put(replyingToCommentAction({ id: parent, value: true }));
    } else {
      yield put(submittingCommentAction(true));
    }
    try {
      let response: IComment;
      if (!isNil(parent)) {
        response = yield call(replyToComment, parent, data.text);
      } else {
        response = yield call(createAccountComment, accountId, data);
      }
      yield put(addCommentToStateAction({ data: response, parent }));
    } catch (e) {
      handleRequestError(e, "There was an error submitting the comment.");
    } finally {
      if (!isNil(parent)) {
        yield put(replyingToCommentAction({ id: parent, value: false }));
      } else {
        yield put(submittingCommentAction(false));
      }
    }
  }
}

export function* deleteCommentTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(deletingCommentAction({ id: action.payload, value: true }));
    try {
      yield call(deleteComment, action.payload);
      yield put(removeCommentFromStateAction(action.payload));
    } catch (e) {
      handleRequestError(e, "There was an error deleting the comment.");
    } finally {
      yield put(deletingCommentAction({ id: action.payload, value: false }));
    }
  }
}

export function* editAccountCommentTask(action: Redux.IAction<Redux.UpdateModelActionPayload<IComment>>): SagaIterator {
  if (!isNil(action.payload)) {
    const { id, data } = action.payload;
    yield put(editingCommentAction({ id, value: true }));
    try {
      // Here we are assuming that Partial<IComment> can be mapped to Partial<Http.ICommentPayload>,
      // which is the case right now but may not be in the future.
      const response: IComment = yield call(updateComment, id, data as Partial<Http.ICommentPayload>);
      yield put(updateCommentInStateAction({ id, data: response }));
    } catch (e) {
      handleRequestError(e, "There was an error updating the comment.");
    } finally {
      yield put(editingCommentAction({ id, value: false }));
    }
  }
}

export function* getAccountCommentsTask(action: Redux.IAction<any>): SagaIterator {
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  if (!isNil(accountId)) {
    yield put(loadingCommentsAction(true));
    try {
      // TODO: We will have to build in pagination.
      const response = yield call(getAccountComments, accountId);
      yield put(responseCommentsAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account's comments.");
      yield put(responseCommentsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingCommentsAction(false));
    }
  }
}

export function* handleAccountChangedTask(action: Redux.IAction<number>): SagaIterator {
  yield all([put(requestAccountAction()), put(requestSubAccountsAction())]);
}

// TODO: We need to also update the estimated, variance and actual values of the parent
// account when a sub account is removed!
export function* handleSubAccountRemovalTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    const models: ISubAccount[] = yield select(
      (state: Redux.IApplicationStore) => state.calculator.account.subaccounts.data
    );
    const model: ISubAccount | undefined = find(models, { id: action.payload });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.IApplicationStore) => state.calculator.account.subaccounts.placeholders
      );
      const placeholder: Table.SubAccountRow | undefined = find(placeholders, { id: action.payload });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.warn(
          `Inconsistent State!  Inconsistent state noticed when removing sub account...
          The sub account with ID ${action.payload} does not exist in state when it is expected to.`
        );
      } else {
        yield put(removePlaceholderFromStateAction(placeholder.id));
      }
    } else {
      yield put(removeSubAccountFromStateAction(model.id));
      yield put(deletingSubAccountAction({ id: model.id, value: true }));
      try {
        yield call(deleteSubAccount, model.id);
      } catch (e) {
        handleRequestError(e, "There was an error deleting the sub account.");
      } finally {
        yield put(deletingSubAccountAction({ id: model.id, value: false }));
      }
    }
  }
}

export function* handleSubAccountUpdatedInStateTask(action: Redux.IAction<ISubAccount>): SagaIterator {
  if (!isNil(action.payload)) {
    const subaccount = action.payload;
    const account: IAccount | undefined = yield select(
      (state: Redux.IApplicationStore) => state.calculator.account.detail.data
    );
    const subaccounts: ISubAccount[] = yield select(
      (state: Redux.IApplicationStore) => state.calculator.account.subaccounts.data
    );
    // Right now, the backend is configured such that the Actual value for the overall Account is
    // determined from the Actual values of the underlying SubAccount(s).  If that logic changes
    // in the backend, we need to also make that adjustment here.
    if (subaccounts.length !== 0 && !isNil(account)) {
      const estimated = reduce(subaccounts, (sum: number, s: ISubAccount) => sum + (s.estimated || 0), 0);
      const actual = reduce(subaccounts, (sum: number, s: ISubAccount) => sum + (s.actual || 0), 0);
      let accountPayload: Partial<IAccount> = { estimated, actual };
      if (!isNil(account.actual)) {
        accountPayload = { ...accountPayload, variance: estimated - actual };
      }
      yield put(updateAccountInStateAction(accountPayload));
    }
    // We should probably remove the group from the table if the response SubAccount does not have
    // a group - however, that will not happen in practice, because this task just handles the case
    // where the SubAccount is updated (not removed or added to a group).
    if (!isNil(subaccount.group)) {
      yield put(updateGroupInStateAction(subaccount.group));
    }
  }
}

export function* handleSubAccountPlaceholderActivatedTask(
  action: Redux.IAction<Table.ActivatePlaceholderPayload<ISubAccount>>
): SagaIterator {
  if (!isNil(action.payload)) {
    const subaccount = action.payload.model;

    // Now that the placeholder is activated, we need to remove the placeholder from state and
    // insert in the actual SubAccount model into the state.
    yield put(removePlaceholderFromStateAction(subaccount.id));
    yield put(addSubAccountToStateAction(subaccount));

    const account: IAccount | undefined = yield select(
      (state: Redux.IApplicationStore) => state.calculator.account.detail.data
    );
    const subaccounts: ISubAccount[] = yield select(
      (state: Redux.IApplicationStore) => state.calculator.account.subaccounts.data
    );
    // Right now, the backend is configured such that the Actual value for the overall Account is
    // determined from the Actual values of the underlying SubAccount(s).  If that logic changes
    // in the backend, we need to also make that adjustment here.
    if (subaccounts.length !== 0 && !isNil(account)) {
      const estimated = reduce(subaccounts, (sum: number, s: ISubAccount) => sum + (s.estimated || 0), 0);
      const actual = reduce(subaccounts, (sum: number, s: ISubAccount) => sum + (s.actual || 0), 0);
      let accountPayload: Partial<IAccount> = { estimated, actual };
      if (!isNil(account.actual)) {
        accountPayload = { ...accountPayload, variance: estimated - actual };
      }
      yield put(updateAccountInStateAction(accountPayload));
    }
    // We should probably remove the group from the table if the response SubAccount does not have
    // a group - however, that will not happen in practice, because this task just handles the case
    // where the SubAccount is updated (not removed or added to a group).
    if (!isNil(subaccount.group)) {
      yield put(updateGroupInStateAction(subaccount.group));
    }
  }
}

export function* handleSubAccountUpdateTask(action: Redux.IAction<Table.RowChange>): SagaIterator {
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId) && !isNil(accountId) && !isNil(action.payload)) {
    const id = action.payload.id;

    const data = yield select((state: Redux.IApplicationStore) => state.calculator.account.subaccounts.data);
    const model: ISubAccount | undefined = find(data, { id });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.IApplicationStore) => state.calculator.account.subaccounts.placeholders
      );
      const placeholder: Table.SubAccountRow | undefined = find(placeholders, { id });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.error(
          `Inconsistent State!:  Inconsistent state noticed when updating sub account in state...
          the subaccount with ID ${action.payload.id} does not exist in state when it is expected to.`
        );
      } else {
        // There are some cases where we need to update the row in the table before we make the request,
        // to improve the UI.  This happens for cells where the value is rendered via an HTML element
        // (i.e. the Unit Cell).  AGGridReact will not automatically update the cell when the Unit is
        // changed via the dropdown, so we need to udpate the row in the data used to populate the table.
        // We could do this by updating with a payload generated from the response, but it is quicker
        // to do it before hand.
        const updatedRow = SubAccountMapping.newRowWithChanges(placeholder, action.payload);
        yield put(updatePlaceholderInStateAction(updatedRow));

        const requestPayload = SubAccountMapping.postPayload(updatedRow);

        // Wait until all of the required fields are present before we create the entity in the
        // backend.  Once the entity is created in the backend, we can remove the placeholder
        // designation of the row so it will be updated instead of created the next time the row
        // is changed.
        if (SubAccountMapping.rowHasRequiredFields(updatedRow)) {
          yield put(creatingSubAccountAction(true));
          try {
            const response: ISubAccount = yield call(
              createAccountSubAccount,
              accountId,
              budgetId,
              requestPayload as Http.ISubAccountPayload
            );
            yield put(activatePlaceholderAction({ id: placeholder.id, model: response }));
          } catch (e) {
            yield call(
              handleTableErrors,
              e,
              "There was an error updating the sub account.",
              placeholder.id,
              (errors: Table.CellError[]) => addErrorsToStateAction(errors)
            );
          } finally {
            yield put(creatingSubAccountAction(false));
          }
        }
      }
    } else {
      // There are some cases where we need to update the row in the table before we make the request,
      // to improve the UI.  This happens for cells where the value is rendered via an HTML element
      // (i.e. the Unit Cell).  AGGridReact will not automatically update the cell when the Unit is
      // changed via the dropdown, so we need to udpate the row in the data used to populate the table.
      // We could do this by updating with a payload generated from the response, but it is quicker
      // to do it before hand.
      const updatedModel = SubAccountMapping.newModelWithChanges(model, action.payload);
      yield put(updateSubAccountInStateAction(updatedModel));

      yield put(updatingSubAccountAction({ id: model.id, value: true }));
      const requestPayload = SubAccountMapping.patchPayload(action.payload);
      try {
        const response: ISubAccount = yield call(updateSubAccount, model.id, requestPayload);
        // TODO: We might want to consider not updating after the response and always relying
        // on state changing the values in the client.
        yield put(updateSubAccountInStateAction(response));
      } catch (e) {
        yield call(
          handleTableErrors,
          e,
          "There was an error updating the sub account.",
          model.id,
          (errors: Table.CellError[]) => addErrorsToStateAction(errors)
        );
      } finally {
        yield put(updatingSubAccountAction({ id: model.id, value: false }));
      }
    }
  }
}

export function* getSubAccountsTask(action: Redux.IAction<null>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  if (!isNil(budgetId) && !isNil(accountId)) {
    yield put(loadingSubAccountsAction(true));
    try {
      const response: Http.IListResponse<ISubAccount> = yield call(getAccountSubAccounts, accountId, budgetId, {
        no_pagination: true
      });
      yield put(responseSubAccountsAction(response));
      if (response.data.length === 0) {
        yield put(addPlaceholdersToStateAction(2));
      }
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account's sub accounts.");
      yield put(responseSubAccountsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingSubAccountsAction(false));
    }
  }
}

export function* getAccountTask(action: Redux.IAction<null>): SagaIterator {
  const accountId = yield select((state: Redux.IApplicationStore) => state.calculator.account.id);
  if (!isNil(accountId)) {
    let showLoadingIndicator = true;
    if (!isNil(action.meta) && action.meta.showLoadingIndicator === false) {
      showLoadingIndicator = false;
    }
    if (showLoadingIndicator) {
      yield put(loadingAccountAction(true));
      // yield put(setAncestorsLoadingAction(true));
    }
    try {
      const response: IAccount = yield call(getAccount, accountId);
      yield put(responseAccountAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account.");
      yield put(responseAccountAction(undefined, { error: e }));
    } finally {
      if (showLoadingIndicator) {
        yield put(loadingAccountAction(false));
        // yield put(setAncestorsLoadingAction(false));
      }
    }
  }
}
