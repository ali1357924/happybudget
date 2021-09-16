import axios from "axios";
import { SagaIterator } from "redux-saga";
import { put, call, cancelled, fork, select, all } from "redux-saga/effects";
import { map, isNil, filter } from "lodash";

import * as api from "api";
import * as tabling from "../../tabling";
import * as util from "../../util";

type R = Tables.ActualRowData;
type M = Model.Actual;
type P = Http.ActualPayload;

export type ActualsTableActionMap = Redux.AuthenticatedTableActionMap<R, M> & {
  readonly loadingSubAccountsTree: boolean;
  readonly restoreSubAccountsTreeSearchCache: null;
  readonly responseSubAccountsTree: Http.ListResponse<Model.SubAccountTreeNode>;
};

export type ActualsTableTaskConfig = Table.TaskConfig<R, M, Model.Group, ActualsTableActionMap> & {
  readonly selectObjId: (state: Application.Authenticated.Store) => ID | null;
  readonly selectTreeSearch: (state: Application.Authenticated.Store) => string;
  readonly selectTreeCache: (state: Application.Authenticated.Store) => Redux.SearchCache<Model.SubAccountTreeNode>;
};

export type ActualsTableTaskMap = Redux.TableTaskMap<R, M> & {
  readonly requestSubAccountsTree: null;
};

export const createTableTaskSet = (config: ActualsTableTaskConfig): Redux.TaskMapObject<ActualsTableTaskMap> => {
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();

  function* request(action: Redux.Action): SagaIterator {
    const budgetId = yield select(config.selectObjId);
    if (!isNil(budgetId)) {
      yield put(config.actions.loading(true));
      yield put(config.actions.clear(null));
      try {
        yield all([call(requestActuals, budgetId), call(requestSubAccountsTree, action)]);
      } catch (e: unknown) {
        if (!(yield cancelled())) {
          api.handleRequestError(e as Error, "There was an error retrieving the table data.");
          yield put(config.actions.response({ models: { count: 0, data: [] }, groups: { count: 0, data: [] } }));
        }
      } finally {
        yield put(config.actions.loading(false));
        if (yield cancelled()) {
          source.cancel();
        }
      }
    }
  }

  function* requestActuals(budgetId: ID): SagaIterator {
    const response: Http.ListResponse<M> = yield call(
      api.getBudgetActuals,
      budgetId,
      {},
      { cancelToken: source.token }
    );
    yield put(config.actions.response({ models: response, groups: { count: 0, data: [] } }));

    if (response.data.length === 0) {
      const event: Table.RowAddEvent<R> = {
        type: "rowAdd",
        payload: [
          { id: `placeholder-${util.generateRandomNumericId()}`, data: {} },
          { id: `placeholder-${util.generateRandomNumericId()}`, data: {} }
        ]
      };
      // Tag the event as artificial so it does not re-trigger this same task.
      yield put({ type: config.actions.tableChanged.toString(), payload: { ...event, artificial: true } });
      yield fork(bulkCreateTask, budgetId, event, "There was an error creating the rows.");
    }
  }

  function* requestSubAccountsTree(action: Redux.Action<null>): SagaIterator {
    // We have to perform the select() inside of this task, instead of providing budgetId as a param,
    // because there is a saga that listens for an search action to be dispatched and then calls this
    // task.
    const budgetId = yield select((state: Application.Authenticated.Store) => state.budget.id);
    if (!isNil(budgetId)) {
      const search = yield select(config.selectTreeSearch);
      const cache = yield select(config.selectTreeCache);
      if (!isNil(cache[search])) {
        yield put(config.actions.restoreSubAccountsTreeSearchCache(null));
      } else {
        yield put(config.actions.loadingSubAccountsTree(true));
        try {
          // TODO: Eventually we will want to build in pagination for this.
          const response = yield call(
            api.getBudgetSubAccountsTree,
            budgetId,
            { no_pagination: true, search },
            { cancelToken: source.token }
          );
          yield put(config.actions.responseSubAccountsTree(response));
        } catch (e: unknown) {
          if (!(yield cancelled())) {
            api.handleRequestError(e as Error, "There was an error retrieving the budget's items.");
            yield put(config.actions.responseSubAccountsTree({ count: 0, data: [] }));
          }
        } finally {
          yield put(config.actions.loadingSubAccountsTree(false));
          if (yield cancelled()) {
            source.cancel();
          }
        }
      }
    }
  }

  function* bulkCreateTask(budgetId: ID, e: Table.RowAddEvent<R>, errorMessage: string): SagaIterator {
    const requestPayload: Http.BulkCreatePayload<P> = tabling.http.createBulkCreatePayload<R, P, M>(
      e.payload,
      config.columns
    );
    yield put(config.actions.saving(true));
    try {
      const response: Http.BulkCreateChildrenResponse<Model.Budget, M> = yield call(
        api.bulkCreateBudgetActuals,
        budgetId,
        requestPayload,
        { cancelToken: source.token }
      );
      // Note: We also have access to the updated budget here, we should use that.
      // Note: The logic in the reducer for activating the placeholder rows with real data relies on the
      // assumption that the models in the response are in the same order as the placeholder IDs.
      const placeholderIds: Table.PlaceholderRowId[] = map(
        Array.isArray(e.payload) ? e.payload : [e.payload],
        (rowAdd: Table.RowAdd<R>) => rowAdd.id
      );
      yield put(config.actions.addModelsToState({ placeholderIds: placeholderIds, models: response.children }));
    } catch (err: unknown) {
      if (!(yield cancelled())) {
        api.handleRequestError(err as Error, errorMessage);
      }
    } finally {
      yield put(config.actions.saving(false));
      if (yield cancelled()) {
        source.cancel();
      }
    }
  }

  function* bulkUpdateTask(
    budgetId: ID,
    e: Table.ChangeEvent<R, M>,
    requestPayload: Http.BulkUpdatePayload<P>,
    errorMessage: string
  ): SagaIterator {
    yield put(config.actions.saving(true));
    try {
      // Note: We also have access to the updated budget here, we should use that.
      yield call(api.bulkUpdateBudgetActuals, budgetId, requestPayload, { cancelToken: source.token });
    } catch (err: unknown) {
      if (!(yield cancelled())) {
        api.handleRequestError(err as Error, errorMessage);
      }
    } finally {
      yield put(config.actions.saving(false));
      if (yield cancelled()) {
        source.cancel();
      }
    }
  }

  function* bulkDeleteTask(budgetId: ID, e: Table.RowDeleteEvent<R, M>, errorMessage: string): SagaIterator {
    const rws: Table.ModelRow<R, M>[] = filter(
      Array.isArray(e.payload.rows) ? e.payload.rows : [e.payload.rows],
      (r: Table.Row<R, M>) => tabling.typeguards.isModelRow(r)
    ) as Table.ModelRow<R, M>[];
    if (rws.length !== 0) {
      yield put(config.actions.saving(true));
      try {
        // Note: We also have access to the updated budget here, we should use that.
        yield call(
          api.bulkDeleteBudgetActuals,
          budgetId,
          map(rws, (r: Table.ModelRow<R, M>) => r.id),
          { cancelToken: source.token }
        );
      } catch (err: unknown) {
        if (!(yield cancelled())) {
          api.handleRequestError(err as Error, errorMessage);
        }
      } finally {
        yield put(config.actions.saving(false));
        if (yield cancelled()) {
          source.cancel();
        }
      }
    }
  }

  function* handleRowAddEvent(action: Redux.Action<Table.RowAddEvent<R>>): SagaIterator {
    const budgetId = yield select(config.selectObjId);
    if (!isNil(action.payload) && !isNil(budgetId)) {
      const e: Table.RowAddEvent<R> = action.payload;
      yield fork(bulkCreateTask, budgetId, e, "There was an error creating the rows.");
    }
  }

  function* handleRowDeleteEvent(action: Redux.Action<Table.RowDeleteEvent<R, M>>): SagaIterator {
    const budgetId = yield select(config.selectObjId);
    if (!isNil(action.payload) && !isNil(budgetId)) {
      const e: Table.RowDeleteEvent<R, M> = action.payload;
      yield fork(bulkDeleteTask, budgetId, e, "There was an error deleting the rows.");
    }
  }

  // ToDo: This is an EDGE case, but we need to do it for smooth operation - we need to filter out the
  // changes that correspond to placeholder rows.
  function* handleDataChangeEvent(action: Redux.Action<Table.DataChangeEvent<R, M>>): SagaIterator {
    const budgetId = yield select(config.selectObjId);
    if (!isNil(action.payload) && !isNil(budgetId)) {
      const e: Table.DataChangeEvent<R, M> = action.payload;
      const merged = tabling.events.consolidateTableChange(e.payload);
      if (merged.length !== 0) {
        const requestPayload = tabling.http.createBulkUpdatePayload<R, P, M>(merged, config.columns);
        yield fork(bulkUpdateTask, budgetId, e, requestPayload, "There was an error updating the rows.");
      }
    }
  }

  return {
    request,
    handleRowAddEvent,
    handleRowDeleteEvent,
    handleDataChangeEvent,
    requestSubAccountsTree
  };
};
