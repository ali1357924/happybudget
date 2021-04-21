import { SagaIterator } from "redux-saga";
import { call, put, select, all, fork } from "redux-saga/effects";
import { isNil, find, map, groupBy } from "lodash";
import { handleRequestError } from "api";
import { BudgetSubAccountRowManager } from "lib/tabling/managers";
import { mergeRowChanges } from "lib/tabling/util";
import {
  getSubAccountSubAccounts,
  createSubAccountSubAccount,
  updateSubAccount,
  deleteSubAccount,
  getSubAccount,
  getSubAccountComments,
  createSubAccountComment,
  deleteComment,
  updateComment,
  replyToComment,
  getSubAccountSubAccountsHistory,
  deleteGroup,
  getSubAccountSubAccountGroups,
  bulkUpdateSubAccountSubAccounts,
  bulkCreateSubAccountSubAccounts
} from "api/services";
import { handleTableErrors } from "store/tasks";
import { loadingBudgetAction, requestBudgetAction } from "../../actions/budget";
import {
  loadingSubAccountAction,
  responseSubAccountAction,
  requestSubAccountAction,
  loadingSubAccountsAction,
  responseSubAccountsAction,
  deletingSubAccountAction,
  creatingSubAccountAction,
  updatingSubAccountAction,
  requestSubAccountsAction,
  loadingCommentsAction,
  responseCommentsAction,
  creatingCommentAction,
  addCommentToStateAction,
  deletingCommentAction,
  removeCommentFromStateAction,
  updateCommentInStateAction,
  updatingCommentAction,
  replyingToCommentAction,
  loadingSubAccountsHistoryAction,
  responseSubAccountsHistoryAction,
  deletingGroupAction,
  removeGroupFromStateAction,
  updateSubAccountInStateAction,
  removeSubAccountFromStateAction,
  removePlaceholderFromStateAction,
  addPlaceholdersToStateAction,
  updatePlaceholderInStateAction,
  activatePlaceholderAction,
  addErrorsToStateAction,
  loadingGroupsAction,
  responseGroupsAction,
  requestGroupsAction
} from "../../actions/budget/subAccount";

export function* handleSubAccountChangedTask(action: Redux.Action<number>): SagaIterator {
  yield all([put(requestSubAccountAction(null)), put(requestSubAccountsAction(null)), put(requestGroupsAction(null))]);
}

export function* removeSubAccountFromGroupTask(action: Redux.Action<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(updatingSubAccountAction({ id: action.payload, value: true }));
    try {
      // NOTE: We do not need to update the SubAccount in state because the reducer will already
      // disassociate the SubAccount from the group.
      yield call(updateSubAccount, action.payload, { group: null });
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

export function* deleteSubAccountGroupTask(action: Redux.Action<number>): SagaIterator {
  if (!isNil(action.payload)) {
    yield put(deletingGroupAction({ id: action.payload, value: true }));
    try {
      yield call(deleteGroup, action.payload);
      yield put(removeGroupFromStateAction(action.payload));
    } catch (e) {
      handleRequestError(e, "There was an error deleting the sub account group.");
    } finally {
      yield put(deletingGroupAction({ id: action.payload, value: false }));
    }
  }
}

export function* deleteSubAccountTask(id: number): SagaIterator {
  yield put(deletingSubAccountAction({ id, value: true }));
  // We do this to show the loading indicator next to the calculated fields of the Budget Footer Row,
  // otherwise, the loading indicators will not appear until `yield put(requestBudgetAction)`, and there
  // is a lag between the time that this task is called and that task is called.
  yield put(loadingBudgetAction(true));
  let success = true;
  try {
    yield call(deleteSubAccount, id);
  } catch (e) {
    success = false;
    yield put(loadingBudgetAction(false));
    handleRequestError(e, "There was an error deleting the sub account.");
  } finally {
    yield put(deletingSubAccountAction({ id: id, value: false }));
  }
  if (success === true) {
    yield put(requestBudgetAction(null));
  }
}

export function* updateSubAccountTask(id: number, change: Table.RowChange<Table.BudgetSubAccountRow>): SagaIterator {
  yield put(updatingSubAccountAction({ id, value: true }));
  // We do this to show the loading indicator next to the calculated fields of the Budget Footer Row,
  // otherwise, the loading indicators will not appear until `yield put(requestBudgetAction)`, and there
  // is a lag between the time that this task is called and that task is called.
  yield put(loadingBudgetAction(true));
  let success = true;
  try {
    yield call(updateSubAccount, id, BudgetSubAccountRowManager.payload(change));
  } catch (e) {
    success = false;
    yield put(loadingBudgetAction(false));
    yield call(handleTableErrors, e, "There was an error updating the sub account.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    yield put(updatingSubAccountAction({ id, value: false }));
  }
  if (success === true) {
    yield put(requestBudgetAction(null));
  }
}

export function* createSubAccountTask(id: number, row: Table.BudgetSubAccountRow): SagaIterator {
  yield put(creatingSubAccountAction(true));
  // We do this to show the loading indicator next to the calculated fields of the Budget Footer Row,
  // otherwise, the loading indicators will not appear until `yield put(requestBudgetAction)`, and there
  // is a lag between the time that this task is called and that task is called.
  yield put(loadingBudgetAction(true));
  let success = true;
  try {
    const response: Model.BudgetSubAccount = yield call(
      createSubAccountSubAccount,
      id,
      BudgetSubAccountRowManager.payload(row)
    );
    yield put(activatePlaceholderAction({ id: row.id, model: response }));
  } catch (e) {
    success = false;
    yield put(loadingBudgetAction(false));
    yield call(
      handleTableErrors,
      e,
      "There was an error updating the sub account.",
      row.id,
      (errors: Table.CellError[]) => addErrorsToStateAction(errors)
    );
  } finally {
    yield put(creatingSubAccountAction(false));
  }
  if (success === true) {
    yield put(requestBudgetAction(null));
  }
}

export function* bulkUpdateAccountSubAccountsTask(
  id: number,
  changes: Table.RowChange<Table.BudgetSubAccountRow>[]
): SagaIterator {
  const requestPayload: Http.BulkUpdatePayload<Http.SubAccountPayload>[] = map(
    changes,
    (change: Table.RowChange<Table.BudgetSubAccountRow>) => ({
      id: change.id,
      ...BudgetSubAccountRowManager.payload(change)
    })
  );
  for (let i = 0; i++; i < changes.length) {
    yield put(updatingSubAccountAction({ id: changes[i].id, value: true }));
  }
  try {
    yield call(bulkUpdateSubAccountSubAccounts, id, requestPayload);
  } catch (e) {
    // Once we rebuild back in the error handling, we will have to be concerned here with the nested
    // structure of the errors.
    yield call(handleTableErrors, e, "There was an error updating the sub accounts.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    for (let i = 0; i++; i < changes.length) {
      yield put(updatingSubAccountAction({ id: changes[i].id, value: false }));
    }
  }
}

export function* bulkCreateAccountSubAccountsTask(id: number, rows: Table.BudgetSubAccountRow[]): SagaIterator {
  const requestPayload: Http.SubAccountPayload[] = map(rows, (row: Table.BudgetSubAccountRow) =>
    BudgetSubAccountRowManager.payload(row)
  );
  yield put(creatingSubAccountAction(true));
  try {
    const subaccounts: Model.BudgetSubAccount[] = yield call(bulkCreateSubAccountSubAccounts, id, requestPayload);
    for (let i = 0; i < subaccounts.length; i++) {
      // It is not ideal that we have to do this, but we have no other way to map a placeholder
      // to the returned SubAccount when bulk creating.  We can rely on the identifier field being
      // unique (at least we hope it is) - otherwise the request will fail.
      const placeholder = find(rows, { identifier: subaccounts[i].identifier });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.error(
          `Could not map sub-account ${subaccounts[i].id} to it's previous placeholder via the
          identifier, ${subaccounts[i].identifier}`
        );
      } else {
        yield put(activatePlaceholderAction({ id: placeholder.id, model: subaccounts[i] }));
      }
    }
  } catch (e) {
    // Once we rebuild back in the error handling, we will have to be concerned here with the nested
    // structure of the errors.
    yield call(handleTableErrors, e, "There was an error updating the sub accounts.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    yield put(creatingSubAccountAction(false));
  }
}

export function* handleSubAccountRemovalTask(action: Redux.Action<number>): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.budget.account.id);
  if (!isNil(action.payload) && !isNil(accountId)) {
    const models: Model.BudgetSubAccount[] = yield select(
      (state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.data
    );
    const model: Model.BudgetSubAccount | undefined = find(models, { id: action.payload });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.placeholders
      );
      const placeholder: Table.BudgetSubAccountRow | undefined = find(placeholders, { id: action.payload });
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
      yield call(deleteSubAccountTask, model.id);
    }
  }
}

export function* handleSubAccountBulkUpdateTask(
  action: Redux.Action<Table.RowChange<Table.BudgetSubAccountRow>[]>
): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId) && !isNil(action.payload)) {
    const grouped = groupBy(action.payload, "id") as { [key: string]: Table.RowChange<Table.BudgetSubAccountRow>[] };
    const merged: Table.RowChange<Table.BudgetSubAccountRow>[] = map(
      grouped,
      (changes: Table.RowChange<Table.BudgetSubAccountRow>[], id: string) => {
        return { data: mergeRowChanges(changes).data, id: parseInt(id) };
      }
    );
    const data = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.data);
    const placeholders = yield select(
      (state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.placeholders
    );

    const mergedUpdates: Table.RowChange<Table.BudgetSubAccountRow>[] = [];
    const placeholdersToCreate: Table.BudgetSubAccountRow[] = [];

    for (let i = 0; i < merged.length; i++) {
      const model: Model.BudgetSubAccount | undefined = find(data, { id: merged[i].id });
      if (isNil(model)) {
        const placeholder: Table.BudgetSubAccountRow | undefined = find(placeholders, { id: merged[i].id });
        if (isNil(placeholder)) {
          /* eslint-disable no-console */
          console.error(
            `Inconsistent State!:  Inconsistent state noticed when updating sub account in state...
            the subaccount with ID ${merged[i].id} does not exist in state when it is expected to.`
          );
        } else {
          const updatedRow = BudgetSubAccountRowManager.mergeChangesWithRow(placeholder, merged[i]);
          yield put(updatePlaceholderInStateAction({ id: updatedRow.id, data: updatedRow }));
          if (BudgetSubAccountRowManager.rowHasRequiredFields(updatedRow)) {
            placeholdersToCreate.push(updatedRow);
          }
        }
      } else {
        const updatedModel = BudgetSubAccountRowManager.mergeChangesWithModel(model, merged[i]);
        yield put(updateSubAccountInStateAction({ id: updatedModel.id, data: updatedModel }));
        mergedUpdates.push(merged[i]);
      }
    }
    if (mergedUpdates.length !== 0) {
      yield fork(bulkUpdateAccountSubAccountsTask, subaccountId, mergedUpdates);
    }
    if (placeholdersToCreate.length !== 0) {
      yield fork(bulkCreateAccountSubAccountsTask, subaccountId, placeholdersToCreate);
    }
  }
}

export function* handleSubAccountUpdateTask(
  action: Redux.Action<Table.RowChange<Table.BudgetSubAccountRow>>
): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId) && !isNil(action.payload)) {
    const id = action.payload.id;
    const data = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.data);
    const model: Model.BudgetSubAccount | undefined = find(data, { id });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.ApplicationStore) => state.budget.subaccount.subaccounts.placeholders
      );
      const placeholder: Table.BudgetSubAccountRow | undefined = find(placeholders, { id });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.error(
          `Inconsistent State!:  Inconsistent state noticed when updating sub account in state...
          the subaccount with ID ${action.payload.id} does not exist in state when it is expected to.`
        );
      } else {
        const updatedRow = BudgetSubAccountRowManager.mergeChangesWithRow(placeholder, action.payload);
        yield put(updatePlaceholderInStateAction({ id: updatedRow.id, data: updatedRow }));
        // Wait until all of the required fields are present before we create the entity in the
        // backend.  Once the entity is created in the backend, we can remove the placeholder
        // designation of the row so it will be updated instead of created the next time the row
        // is changed.
        if (BudgetSubAccountRowManager.rowHasRequiredFields(updatedRow)) {
          yield call(createSubAccountTask, subaccountId, updatedRow);
        }
      }
    } else {
      const updatedModel = BudgetSubAccountRowManager.mergeChangesWithModel(model, action.payload);
      yield put(updateSubAccountInStateAction({ id: updatedModel.id, data: updatedModel }));
      yield call(updateSubAccountTask, model.id, action.payload);
    }
  }
}

export function* getGroupsTask(action: Redux.Action<null>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId)) {
    yield put(loadingGroupsAction(true));
    try {
      const response: Http.ListResponse<Model.BudgetGroup> = yield call(getSubAccountSubAccountGroups, subaccountId, {
        no_pagination: true
      });
      yield put(responseGroupsAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the sub account's sub account groups.");
      yield put(responseGroupsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingGroupsAction(false));
    }
  }
}

export function* getSubAccountsTask(action: Redux.Action<null>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId)) {
    yield put(loadingSubAccountsAction(true));
    try {
      const response = yield call(getSubAccountSubAccounts, subaccountId, { no_pagination: true });
      yield put(responseSubAccountsAction(response));
      if (response.data.length === 0) {
        yield put(addPlaceholdersToStateAction(2));
      }
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the subaccount's sub accounts.");
      yield put(responseSubAccountsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingSubAccountsAction(false));
    }
  }
}

export function* getSubAccountTask(action: Redux.Action<null>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId)) {
    yield put(loadingSubAccountAction(true));
    try {
      const response: Model.BudgetSubAccount = yield call(getSubAccount, subaccountId);
      yield put(responseSubAccountAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account.");
      yield put(responseSubAccountAction(undefined, { error: e }));
    } finally {
      yield put(loadingSubAccountAction(false));
    }
  }
}

export function* getSubAccountsHistoryTask(action: Redux.Action<null>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId)) {
    yield put(loadingSubAccountsHistoryAction(true));
    try {
      const response: Http.ListResponse<Model.HistoryEvent> = yield call(getSubAccountSubAccountsHistory, subaccountId);
      yield put(responseSubAccountsHistoryAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the sub account's sub accounts history.");
    } finally {
      yield put(loadingSubAccountsHistoryAction(false));
    }
  }
}

export function* submitCommentTask(action: Redux.Action<{ parent?: number; data: Http.CommentPayload }>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId) && !isNil(action.payload)) {
    const { parent, data } = action.payload;
    if (!isNil(parent)) {
      yield put(replyingToCommentAction({ id: parent, value: true }));
    } else {
      yield put(creatingCommentAction(true));
    }
    try {
      let response: Model.Comment;
      if (!isNil(parent)) {
        response = yield call(replyToComment, parent, data.text);
      } else {
        response = yield call(createSubAccountComment, subaccountId, data);
      }
      yield put(addCommentToStateAction({ data: response, parent }));
    } catch (e) {
      handleRequestError(e, "There was an error submitting the comment.");
    } finally {
      if (!isNil(parent)) {
        yield put(replyingToCommentAction({ id: parent, value: false }));
      } else {
        yield put(creatingCommentAction(false));
      }
    }
  }
}

export function* deleteCommentTask(action: Redux.Action<number>): SagaIterator {
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

export function* editCommentTask(action: Redux.Action<Redux.UpdateModelActionPayload<Model.Comment>>): SagaIterator {
  if (!isNil(action.payload)) {
    const { id, data } = action.payload;
    yield put(updatingCommentAction({ id, value: true }));
    try {
      // Here we are assuming that Partial<Model.Comment> can be mapped to Partial<Http.CommentPayload>,
      // which is the case right now but may not be in the future.
      const response: Model.Comment = yield call(updateComment, id, data as Partial<Http.CommentPayload>);
      yield put(updateCommentInStateAction({ id, data: response }));
    } catch (e) {
      handleRequestError(e, "There was an error updating the comment.");
    } finally {
      yield put(updatingCommentAction({ id, value: false }));
    }
  }
}

export function* getCommentsTask(action: Redux.Action<any>): SagaIterator {
  const subaccountId = yield select((state: Redux.ApplicationStore) => state.budget.subaccount.id);
  if (!isNil(subaccountId)) {
    yield put(loadingCommentsAction(true));
    try {
      // TODO: We will have to build in pagination.
      const response = yield call(getSubAccountComments, subaccountId);
      yield put(responseCommentsAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the subaccount's comments.");
      yield put(responseCommentsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingCommentsAction(false));
    }
  }
}