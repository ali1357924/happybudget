import { SagaIterator } from "redux-saga";
import { call, put, select, fork } from "redux-saga/effects";
import { isNil, find, map, groupBy } from "lodash";
import { handleRequestError } from "api";
import { ActualRowManager } from "lib/tabling/managers";
import { mergeRowChanges } from "lib/model/util";
import {
  getBudgetActuals,
  deleteActual,
  updateActual,
  createAccountActual,
  createSubAccountActual,
  bulkUpdateActuals
} from "api/services";
import { handleTableErrors } from "store/tasks";
import {
  activatePlaceholderAction,
  loadingActualsAction,
  responseActualsAction,
  deletingActualAction,
  creatingActualAction,
  updatingActualAction,
  removePlaceholderFromStateAction,
  removeActualFromStateAction,
  updatePlaceholderInStateAction,
  addPlaceholdersToStateAction,
  addErrorsToStateAction,
  updateActualInStateAction
} from "../actions/actuals";

export function* deleteActualTask(id: number): SagaIterator {
  yield put(deletingActualAction({ id, value: true }));
  try {
    yield call(deleteActual, id);
  } catch (e) {
    handleRequestError(e, "There was an error deleting the actual.");
  } finally {
    yield put(deletingActualAction({ id, value: false }));
  }
}

export function* updateActualTask(id: number, change: Table.RowChange): SagaIterator {
  yield put(updatingActualAction({ id, value: true }));
  try {
    yield call(updateActual, id, ActualRowManager.patchPayload(change));
  } catch (e) {
    yield call(handleTableErrors, e, "There was an error updating the actual.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    yield put(updatingActualAction({ id, value: false }));
  }
}

export function* createActualTask(id: number, row: Table.ActualRow): SagaIterator {
  let service = createAccountActual;
  if (row.parent_type === "subaccount") {
    service = createSubAccountActual;
  }
  yield put(creatingActualAction(true));
  try {
    const response: IActual = yield call(service, id, ActualRowManager.postPayload(row));
    yield put(activatePlaceholderAction({ id: row.id, model: response }));
  } catch (e) {
    yield call(handleTableErrors, e, "There was an error updating the actual.", row.id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    yield put(creatingActualAction(false));
  }
}

export function* bulkUpdateActualsTask(id: number, changes: Table.RowChange[]): SagaIterator {
  const requestPayload: Http.IActualBulkUpdatePayload[] = map(changes, (change: Table.RowChange) => ({
    id: change.id,
    ...ActualRowManager.patchPayload(change)
  }));
  for (let i = 0; i++; i < changes.length) {
    yield put(updatingActualAction({ id: changes[i].id, value: true }));
  }
  try {
    yield call(bulkUpdateActuals, id, requestPayload);
  } catch (e) {
    // Once we rebuild back in the error handling, we will have to be concerned here with the nested
    // structure of the errors.
    yield call(handleTableErrors, e, "There was an error updating the actuals.", id, (errors: Table.CellError[]) =>
      addErrorsToStateAction(errors)
    );
  } finally {
    for (let i = 0; i++; i < changes.length) {
      yield put(updatingActualAction({ id: changes[i].id, value: false }));
    }
  }
}

export function* handleActualRemovalTask(action: Redux.IAction<number>): SagaIterator {
  if (!isNil(action.payload)) {
    const models: IActual[] = yield select((state: Redux.IApplicationStore) => state.budget.actuals.data);
    const model: IActual | undefined = find(models, { id: action.payload });
    if (isNil(model)) {
      const placeholders = yield select((state: Redux.IApplicationStore) => state.budget.actuals.placeholders);
      const placeholder: Table.ActualRow | undefined = find(placeholders, { id: action.payload });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.warn(
          `Inconsistent State!  Inconsistent state noticed when removing actual...
          The actual with ID ${action.payload} does not exist in state when it is expected to.`
        );
      } else {
        yield put(removePlaceholderFromStateAction(placeholder.id));
      }
    } else {
      yield put(removeActualFromStateAction(model.id));
      yield call(deleteActualTask, model.id);
    }
  }
}

export function* handleActualsBulkUpdateTask(action: Redux.IAction<Table.RowChange[]>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId) && !isNil(action.payload)) {
    const grouped = groupBy(action.payload, "id") as { [key: string]: Table.RowChange[] };
    const merged: Table.RowChange[] = map(grouped, (changes: Table.RowChange[], id: string) => {
      return { data: mergeRowChanges(changes).data, id: parseInt(id) };
    });

    const data = yield select((state: Redux.IApplicationStore) => state.budget.actuals.data);
    const placeholders = yield select((state: Redux.IApplicationStore) => state.budget.actuals.placeholders);

    const mergedUpdates: Table.RowChange[] = [];

    for (let i = 0; i < merged.length; i++) {
      const model: IActual | undefined = find(data, { id: merged[i].id });
      if (isNil(model)) {
        const placeholder: Table.ActualRow | undefined = find(placeholders, { id: merged[i].id });
        if (isNil(placeholder)) {
          /* eslint-disable no-console */
          console.error(
            `Inconsistent State!:  Inconsistent state noticed when updating actual in state...
            the actual with ID ${merged[i].id} does not exist in state when it is expected to.`
          );
        } else {
          // NOTE: Since the only required field for the Actual is the parent, which is controlled
          // by the HTML select field, it cannot be copy/pasted and thus we do not have to worry
          // about the bulk creation of Actual(s) - only the bulk updating.
          const updatedRow = ActualRowManager.newRowWithChanges(placeholder, merged[i]);
          yield put(updatePlaceholderInStateAction(updatedRow));
        }
      } else {
        const updatedModel = ActualRowManager.newModelWithChanges(model, merged[i]);
        yield put(updateActualInStateAction(updatedModel));
        mergedUpdates.push(merged[i]);
      }
    }
    if (mergedUpdates.length !== 0) {
      yield fork(bulkUpdateActualsTask, budgetId, mergedUpdates);
    }
  }
}

export function* handleActualUpdateTask(action: Redux.IAction<Table.RowChange>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId) && !isNil(action.payload)) {
    const id = action.payload.id;
    const data: IActual[] = yield select((state: Redux.IApplicationStore) => state.budget.actuals.data);
    const model: IActual | undefined = find(data, { id });
    if (isNil(model)) {
      const placeholders = yield select((state: Redux.IApplicationStore) => state.budget.actuals.placeholders);
      const placeholder: Table.ActualRow | undefined = find(placeholders, { id });
      if (isNil(placeholder)) {
        /* eslint-disable no-console */
        console.error(
          `Inconsistent State!:  Inconsistent state noticed when updating actual in state...
          the actual with ID ${action.payload.id} does not exist in state when it is expected to.`
        );
      } else {
        const updatedRow = ActualRowManager.newRowWithChanges(placeholder, action.payload);
        yield put(updatePlaceholderInStateAction(updatedRow));
        // Wait until all of the required fields are present before we create the entity in the
        // backend.  Once the entity is created in the backend, we can remove the placeholder
        // designation of the row so it will be updated instead of created the next time the row
        // is changed.
        if (ActualRowManager.rowHasRequiredFields(updatedRow) && !isNil(updatedRow.object_id)) {
          yield call(createActualTask, updatedRow.object_id, updatedRow);
        }
      }
    } else {
      const updatedModel = ActualRowManager.newModelWithChanges(model, action.payload);
      yield put(updateActualInStateAction(updatedModel));
      yield call(updateActualTask, model.id, action.payload);
    }
  }
}

export function* getActualsTask(action: Redux.IAction<null>): SagaIterator {
  const budgetId = yield select((state: Redux.IApplicationStore) => state.budget.budget.id);
  if (!isNil(budgetId)) {
    yield put(loadingActualsAction(true));
    try {
      const response = yield call(getBudgetActuals, budgetId, { no_pagination: true });
      yield put(responseActualsAction(response));
      if (response.data.length === 0) {
        yield put(addPlaceholdersToStateAction(2));
      }
    } catch (e) {
      handleRequestError(e, "There was an error retrieving the budget's actuals.");
      yield put(responseActualsAction({ count: 0, data: [] }, { error: e }));
    } finally {
      yield put(loadingActualsAction(false));
    }
  }
}
