import { SagaIterator } from "redux-saga";
import { call, put, select, all } from "redux-saga/effects";
import { isNil, map } from "lodash";
import { createSelector } from "reselect";
import { PayloadActionCreator } from "@reduxjs/toolkit";

import * as api from "api";
import { tabling, notifications } from "lib";

/* eslint-disable indent */
export const createChangeEventHandler = <R extends Table.RowData, M extends Model.RowHttpModel = Model.RowHttpModel>(
  handlers: Partial<Redux.TableEventTaskMapObject<R, M>>
): Redux.TableEventTask<Table.ChangeEvent<R, M>> => {
  function* handleChangeEvent(e: Table.ChangeEvent<R, M>): SagaIterator {
    if (e.type !== "modelAdded") {
      const handler = handlers[e.type] as Redux.TableEventTask<Table.ChangeEvent<R, M>, R, M> | undefined;
      /* Do not issue a warning/error if the event type does not have an
				 associated handler because there are event types that correspond to
				 reducer behavior only. */
      if (!isNil(handler)) {
        yield call(handler, e);
      }
    }
  }
  return handleChangeEvent;
};

type BulkCreate<RSP, ARGS extends any[]> = (...args: ARGS) => [Http.Service<Promise<RSP>>, ...ARGS];

type CreateBulkTaskConfig<
  R extends Table.RowData,
  M extends Model.RowHttpModel,
  S extends Redux.TableStore,
  RSP,
  ARGS extends any[]
> = {
  readonly loadingActions: PayloadActionCreator<boolean>[];
  readonly responseActions: (r: RSP, e: Table.RowAddEvent<R>) => Redux.Action<any>[];
  readonly columns: Table.Column<R, M>[];
  readonly selectStore: (state: Application.Authenticated.Store) => S;
  readonly bulkCreate: BulkCreate<RSP, ARGS>;
};

/* eslint-disable indent */
export const createBulkTask = <
  R extends Table.RowData,
  M extends Model.RowHttpModel,
  S extends Redux.TableStore,
  P,
  RSP,
  ARGS extends any[] = []
>(
  config: CreateBulkTaskConfig<R, M, S, RSP, ARGS>
): Redux.TableBulkCreateTask<R, ARGS> => {
  const selectData = createSelector(config.selectStore, (store: S) => store.data);

  function* bulkCreateTask(e: Table.RowAddEvent<R>, errorMessage: string, ...args: ARGS): SagaIterator {
    const payload: Partial<R>[] | Table.RowAddIndexPayload | Table.RowAddCountPayload = e.payload;
    const store: Table.BodyRow<R>[] = yield select(selectData);

    let data: Partial<R>[];
    if (tabling.typeguards.isRowAddCountPayload(payload) || tabling.typeguards.isRowAddIndexPayload(payload)) {
      data = tabling.patterns.generateNewRowData({ store, ...payload }, config.columns);
    } else {
      data = payload;
    }
    /*
    Note: The logic in the reducer for activating the placeholder rows with
    real data relies on the assumption that the models in the response
    are in the same order as the placeholder numbers.
    */
    if (e.placeholderIds.length !== data.length) {
      throw new Error(
        `Only ${e.placeholderIds.length} placeholder IDs were provided, but ${data.length}
            new rows are being created.`
      );
    }
    const requestPayload: Http.BulkCreatePayload<P> = tabling.http.createBulkCreatePayload<R, P, M>(
      data,
      config.columns
    );
    yield all(map(config.loadingActions, (action: PayloadActionCreator<boolean>) => put(action(true))));
    try {
      const response: RSP = yield api.request(...config.bulkCreate(...args), requestPayload);
      yield all(map(config.responseActions(response, e), (action: Redux.Action<any>) => put(action)));
    } catch (err: unknown) {
      notifications.requestError(err as Error, errorMessage);
    } finally {
      yield all(map(config.loadingActions, (action: PayloadActionCreator<boolean>) => put(action(false))));
    }
  }

  return bulkCreateTask;
};
