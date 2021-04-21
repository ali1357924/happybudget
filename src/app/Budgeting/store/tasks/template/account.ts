import { SagaIterator } from "redux-saga";
import { CallEffect, call, put, select, all } from "redux-saga/effects";
import { isNil, find, map, groupBy } from "lodash";
import { handleRequestError } from "api";
import { TemplateSubAccountRowManager } from "lib/tabling/managers";
import { mergeRowChanges } from "lib/tabling/util";
import {
  getAccountSubAccounts,
  createAccountSubAccount,
  updateSubAccount,
  deleteSubAccount,
  getAccount,
  deleteGroup,
  getAccountSubAccountGroups,
  bulkUpdateAccountSubAccounts,
  bulkCreateAccountSubAccounts
} from "api/services";
import { handleTableErrors } from "store/tasks";
import { loadingTemplateAction, requestTemplateAction } from "../../actions/template";
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
  deletingGroupAction,
  removeGroupFromStateAction,
  updateSubAccountInStateAction,
  removeSubAccountFromStateAction,
  removePlaceholderFromStateAction,
  addPlaceholdersToStateAction,
  updatePlaceholderInStateAction,
  activatePlaceholderAction,
  requestGroupsAction,
  responseGroupsAction,
  loadingGroupsAction
} from "../../actions/template/account";

export function* handleAccountChangedTask(action: Redux.Action<number>): SagaIterator {
  yield all([put(requestAccountAction(null)), put(requestSubAccountsAction(null)), put(requestGroupsAction(null))]);
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
  yield put(loadingTemplateAction(true));
  let success = true;
  try {
    yield call(deleteSubAccount, id);
  } catch (e) {
    success = false;
    yield put(loadingTemplateAction(false));
    handleRequestError(e, "There was an error deleting the sub account.");
  } finally {
    yield put(deletingSubAccountAction({ id: id, value: false }));
  }
  if (success === true) {
    yield put(requestTemplateAction(null));
  }
}

export function* updateSubAccountTask(id: number, change: Table.RowChange<Table.TemplateSubAccountRow>): SagaIterator {
  yield put(updatingSubAccountAction({ id, value: true }));
  // We do this to show the loading indicator next to the calculated fields of the Budget Footer Row,
  // otherwise, the loading indicators will not appear until `yield put(requestBudgetAction)`, and there
  // is a lag between the time that this task is called and that task is called.
  yield put(loadingTemplateAction(true));
  let success = true;
  try {
    yield call(updateSubAccount, id, TemplateSubAccountRowManager.payload(change));
  } catch (e) {
    success = false;
    yield put(loadingTemplateAction(false));
    yield call(handleTableErrors, e, "There was an error updating the sub account.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    yield put(updatingSubAccountAction({ id, value: false }));
  }
  if (success === true) {
    yield put(requestTemplateAction(null));
  }
}

export function* createSubAccountTask(id: number, row: Table.TemplateSubAccountRow): SagaIterator {
  yield put(creatingSubAccountAction(true));
  // We do this to show the loading indicator next to the calculated fields of the Budget Footer Row,
  // otherwise, the loading indicators will not appear until `yield put(requestBudgetAction)`, and there
  // is a lag between the time that this task is called and that task is called.
  yield put(loadingTemplateAction(true));
  let success = true;
  try {
    const response: Model.TemplateSubAccount = yield call(
      createAccountSubAccount,
      id,
      TemplateSubAccountRowManager.payload(row)
    );
    yield put(activatePlaceholderAction({ id: row.id, model: response }));
  } catch (e) {
    success = false;
    yield put(loadingTemplateAction(false));
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
    yield put(requestTemplateAction(null));
  }
}

export function* bulkUpdateAccountSubAccountsTask(
  id: number,
  changes: Table.RowChange<Table.TemplateSubAccountRow>[]
): SagaIterator {
  const requestPayload: Http.BulkUpdatePayload<Http.SubAccountPayload>[] = map(
    changes,
    (change: Table.RowChange<Table.TemplateSubAccountRow>) => ({
      id: change.id,
      ...TemplateSubAccountRowManager.payload(change)
    })
  );
  for (let i = 0; i++; i < changes.length) {
    yield put(updatingSubAccountAction({ id: changes[i].id, value: true }));
  }
  try {
    yield call(bulkUpdateAccountSubAccounts, id, requestPayload);
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

export function* bulkCreateAccountSubAccountsTask(id: number, rows: Table.TemplateSubAccountRow[]): SagaIterator {
  const requestPayload: Http.SubAccountPayload[] = map(rows, (row: Table.TemplateSubAccountRow) =>
    TemplateSubAccountRowManager.payload(row)
  );
  yield put(creatingSubAccountAction(true));
  try {
    const subaccounts: Model.TemplateSubAccount[] = yield call(bulkCreateAccountSubAccounts, id, requestPayload);
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
  if (!isNil(action.payload)) {
    const models: Model.TemplateSubAccount[] = yield select(
      (state: Redux.ApplicationStore) => state.template.account.subaccounts.data
    );
    const model: Model.TemplateSubAccount | undefined = find(models, { id: action.payload });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.ApplicationStore) => state.template.account.subaccounts.placeholders
      );
      const placeholder: Table.TemplateSubAccountRow | undefined = find(placeholders, { id: action.payload });
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

export function* handleAccountBulkUpdateTask(
  action: Redux.Action<Table.RowChange<Table.TemplateSubAccountRow>[]>
): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.template.account.id);
  if (!isNil(accountId) && !isNil(action.payload)) {
    const grouped = groupBy(action.payload, "id") as { [key: string]: Table.RowChange<Table.TemplateSubAccountRow>[] };
    const merged: Table.RowChange<Table.TemplateSubAccountRow>[] = map(
      grouped,
      (changes: Table.RowChange<Table.TemplateSubAccountRow>[], id: string) => {
        return { data: mergeRowChanges(changes).data, id: parseInt(id) };
      }
    );

    const data = yield select((state: Redux.ApplicationStore) => state.template.account.subaccounts.data);
    const placeholders = yield select(
      (state: Redux.ApplicationStore) => state.template.account.subaccounts.placeholders
    );

    const mergedUpdates: Table.RowChange<Table.TemplateSubAccountRow>[] = [];
    const placeholdersToCreate: Table.TemplateSubAccountRow[] = [];

    for (let i = 0; i < merged.length; i++) {
      const model: Model.TemplateSubAccount | undefined = find(data, { id: merged[i].id });
      if (isNil(model)) {
        const placeholder: Table.TemplateSubAccountRow | undefined = find(placeholders, { id: merged[i].id });
        if (isNil(placeholder)) {
          /* eslint-disable no-console */
          console.error(
            `Inconsistent State!:  Inconsistent state noticed when updating sub account in state...
            the subaccount with ID ${merged[i].id} does not exist in state when it is expected to.`
          );
        } else {
          const updatedRow = TemplateSubAccountRowManager.mergeChangesWithRow(placeholder, merged[i]);
          yield put(updatePlaceholderInStateAction({ id: updatedRow.id, data: updatedRow }));
          if (TemplateSubAccountRowManager.rowHasRequiredFields(updatedRow)) {
            placeholdersToCreate.push(updatedRow);
          }
        }
      } else {
        const updatedModel = TemplateSubAccountRowManager.mergeChangesWithModel(model, merged[i]);
        yield put(updateSubAccountInStateAction({ id: updatedModel.id, data: updatedModel }));
        mergedUpdates.push(merged[i]);
      }
    }
    yield put(requestTemplateAction(null));
    const effects: CallEffect[] = [];
    if (mergedUpdates.length !== 0) {
      effects.push(call(bulkUpdateAccountSubAccountsTask, accountId, mergedUpdates));
    }
    if (placeholdersToCreate.length !== 0) {
      effects.push(call(bulkCreateAccountSubAccountsTask, accountId, placeholdersToCreate));
    }
    yield all(effects);
  }
}

export function* handleSubAccountUpdateTask(
  action: Redux.Action<Table.RowChange<Table.TemplateSubAccountRow>>
): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.template.account.id);
  if (!isNil(accountId) && !isNil(action.payload)) {
    const id = action.payload.id;

    const data = yield select((state: Redux.ApplicationStore) => state.template.account.subaccounts.data);
    const model: Model.TemplateSubAccount | undefined = find(data, { id });
    if (isNil(model)) {
      const placeholders = yield select(
        (state: Redux.ApplicationStore) => state.template.account.subaccounts.placeholders
      );
      const placeholder: Table.TemplateSubAccountRow | undefined = find(placeholders, { id });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.error(
          `Inconsistent State!:  Inconsistent state noticed when updating sub account in state...
          the subaccount with ID ${action.payload.id} does not exist in state when it is expected to.`
        );
      } else {
        const updatedRow = TemplateSubAccountRowManager.mergeChangesWithRow(placeholder, action.payload);
        yield put(updatePlaceholderInStateAction({ id: updatedRow.id, data: updatedRow }));
        // Wait until all of the required fields are present before we create the entity in the
        // backend.  Once the entity is created in the backend, we can remove the placeholder
        // designation of the row so it will be updated instead of created the next time the row
        // is changed.
        if (TemplateSubAccountRowManager.rowHasRequiredFields(updatedRow)) {
          yield call(createSubAccountTask, accountId, updatedRow);
        }
      }
    } else {
      const updatedModel = TemplateSubAccountRowManager.mergeChangesWithModel(model, action.payload);
      yield put(updateSubAccountInStateAction({ id: updatedModel.id, data: updatedModel }));
      yield call(updateSubAccountTask, model.id, action.payload);
    }
  }
}

export function* getGroupsTask(action: Redux.Action<null>): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.template.account.id);
  if (!isNil(accountId)) {
    yield put(loadingGroupsAction(true));
    try {
      const response: Http.ListResponse<Model.TemplateGroup> = yield call(getAccountSubAccountGroups, accountId, {
        no_pagination: true
      });
      yield put(responseGroupsAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account's sub account groups.");
      yield put(responseGroupsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingGroupsAction(false));
    }
  }
}

export function* getSubAccountsTask(action: Redux.Action<null>): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.template.account.id);
  if (!isNil(accountId)) {
    yield put(loadingSubAccountsAction(true));
    try {
      const response: Http.ListResponse<Model.TemplateSubAccount> = yield call(getAccountSubAccounts, accountId, {
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

export function* getAccountTask(action: Redux.Action<null>): SagaIterator {
  const accountId = yield select((state: Redux.ApplicationStore) => state.template.account.id);
  if (!isNil(accountId)) {
    let showLoadingIndicator = true;
    if (!isNil(action.meta) && action.meta.showLoadingIndicator === false) {
      showLoadingIndicator = false;
    }
    if (showLoadingIndicator) {
      yield put(loadingAccountAction(true));
    }
    try {
      const response: Model.TemplateAccount = yield call(getAccount, accountId);
      yield put(responseAccountAction(response));
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the account.");
      yield put(responseAccountAction(undefined, { error: e }));
    } finally {
      if (showLoadingIndicator) {
        yield put(loadingAccountAction(false));
      }
    }
  }
}
