import { Saga, SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, actionChannel, delay, flush, fork, select } from "redux-saga/effects";
import { isNil, isEqual } from "lodash";

import * as events from "./events";

export const createPublicTableSaga = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context,
  A extends Redux.TableActionMap<M, C> = Redux.TableActionMap<M, C>
>(
  config: Table.PublicSagaConfig<R, M, S, C, A>
): Saga => {
  function* requestSaga(): SagaIterator {
    let lastTasks;
    if (!isNil(config.actions.request) && !isNil(config.tasks.request)) {
      while (true) {
        const action = yield take(config.actions.request.toString());
        if (lastTasks) {
          yield cancel(lastTasks);
        }
        lastTasks = yield call(config.tasks.request, action);
      }
    }
  }

  function* rootSaga(): SagaIterator {
    yield spawn(requestSaga);
  }
  return rootSaga;
};

type SagaConfigWithRequest<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
> = Table.AuthenticatedSagaConfig<
  R,
  M,
  S,
  C,
  Redux.AuthenticatedTableActionMap<R, M, C>,
  Redux.AuthenticatedTableTaskMap<R, C>
>;

type SagaConfigWithoutRequest<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
> = Table.AuthenticatedSagaConfig<
  R,
  M,
  S,
  C,
  Omit<Redux.AuthenticatedTableActionMap<R, M, C>, "request">,
  Omit<Redux.AuthenticatedTableTaskMap<R, C>, "request">
>;

type SagaConfig<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
> = SagaConfigWithRequest<R, M, S, C> | SagaConfigWithoutRequest<R, M, S, C>;

const configIsWithRequest = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
>(
  config: SagaConfig<R, M, S, C>
): config is SagaConfigWithRequest<R, M, S, C> =>
  (config as SagaConfigWithRequest<R, M, S, C>).actions.request !== undefined;

type EmptyBatch = {
  readonly events: [];
  readonly context: null;
};

type PopulatedBatch<
  E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>,
  R extends Table.RowData,
  C extends Table.Context = Table.Context
> = {
  readonly events: E[];
  readonly context: Redux.WithActionContext<C>;
};

type Batch<
  E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>,
  R extends Table.RowData,
  C extends Table.Context = Table.Context
> = PopulatedBatch<E, R, C> | EmptyBatch;

type BatchEventIds = "dataChange" | "rowAdd";

type RunningBatches<R extends Table.RowData, C extends Table.Context = Table.Context> = {
  [Key in BatchEventIds]: Batch<Table.ChangeEventLookup<Key, R>, R, C>;
};

const batchIsEmpty = <
  E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>,
  R extends Table.RowData,
  C extends Table.Context = Table.Context
>(
  batch: Batch<E, R, C>
): batch is EmptyBatch => (batch as EmptyBatch).events.length === 0;

/**
 * When we are queueing actions together for the same types of events that happen
 * at high frequency, we cannot batch together events for actions that have
 * differing values for `context`.  This is because when we batch together the
 * events for those actions, the events themselves will be merged together and
 * submitted as a whole, with the `context` property of the action narrowed
 * down to a single value.  If those contexts are the same for all actions in
 * the batch, then we don't have a problem.  But if they differ, then we have
 * to treat entities of the batch differently.
 */
const actionInconsistentWithBatch = <
  E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>,
  R extends Table.RowData,
  C extends Table.Context = Table.Context
>(
  action: Redux.TableAction<E, C>,
  batch: Batch<E, R, C>
): boolean => !batchIsEmpty(batch) && !isEqual(action.context, batch.context);

interface Flusher<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
> {
  (config: SagaConfig<R, M, S, C>, actions: Redux.TableAction<Table.ChangeEvent<R>, C>[]): SagaIterator;
}

/**
 * Flushes events that are queued in the Action Channel by batching like,
 * consecutive events together to perform bulk API updates instead of individual
 * ones.
 *
 * The algorithm is written specifically to only batch together consecutive
 * events, such that the original order the events occurred in is preserved
 * (which is important).
 *
 * Events: [A, A, A, B, A, A, B, B, C, B, C, A, A, B]
 * In Batches: [[A, A, A], [B], [A, A], [B, B], [C], [B], [C], [A, A], B]
 */
function* flushEvents<
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
>(config: SagaConfig<R, M, S, C>, actions: Redux.TableAction<Table.ChangeEvent<R>, C>[]): SagaIterator {
  let running: RunningBatches<R, C> = {
    dataChange: { context: null, events: [] },
    rowAdd: { context: null, events: [] }
  };

  const addEventToBatch = <E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>>(
    action: Redux.TableAction<E, C>,
    runningBatches: RunningBatches<R, C>
  ): RunningBatches<R, C> => {
    const e: E = action.payload;
    const b: Batch<Table.DataChangeEvent<R> | Table.RowAddEvent<R>, R, C> = runningBatches[e.type];

    // This should be prevented before calling this method.
    if (actionInconsistentWithBatch(action, b)) {
      throw new Error("Action is inconsistent with batch!");
    } else if (batchIsEmpty(b)) {
      return { ...runningBatches, [e.type]: { ...b, events: [action.payload], context: action.context } };
    } else {
      /* Because of the first check, it is guaranteed that the batch in question
         has a context that is consistent with the provided action. */
      return { ...runningBatches, [e.type]: { ...b, events: [...b.events, action.payload] } };
    }
  };

  const clearBatch = <E extends Table.DataChangeEvent<R> | Table.RowAddEvent<R>>(
    type: E["type"],
    runningBatches: RunningBatches<R, C>
  ): RunningBatches<R, C> => ({ ...runningBatches, [type]: { context: null, events: [] } });

  function* flushDataBatch(runningBatches: RunningBatches<R, C>): SagaIterator {
    const b: Batch<Table.DataChangeEvent<R>, R, C> = runningBatches.dataChange;
    if (!batchIsEmpty(b)) {
      const event = events.consolidateDataChangeEvents(b.events);
      if (!Array.isArray(event.payload) || event.payload.length !== 0) {
        yield fork(config.tasks.handleChangeEvent, event, b.context);
      }
      return clearBatch("dataChange", runningBatches);
    }
    return runningBatches;
  }

  function* flushRowAddBatch(runningBatches: RunningBatches<R, C>): SagaIterator {
    const b: Batch<Table.RowAddEvent<R>, R, C> = runningBatches.rowAdd;
    if (!batchIsEmpty(b)) {
      const event = events.consolidateRowAddEvents((b as PopulatedBatch<Table.RowAddDataEvent<R>, R, C>).events);
      if (!Array.isArray(event.payload) || event.payload.length !== 0) {
        yield fork(config.tasks.handleChangeEvent, event, b.context);
      }
      return clearBatch("rowAdd", runningBatches);
    }
    return runningBatches;
  }

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (events.isActionWithChangeEvent(a, "dataChange")) {
      /* If the context of the new event is inconsistent with the batched events
         of the same type, that means the context changed quickly before the
         batch had a chance to flush.  In this case, we need to flush the
         previous batch and start a new batch. */
      if (actionInconsistentWithBatch<Table.DataChangeEvent<R>, R, C>(a, running.dataChange)) {
        running = yield call(flushDataBatch, running);
      }
      running = addEventToBatch(a, running);
    } else if (events.isRowAddEventAction(a) && events.isRowAddDataEventAction(a)) {
      /* If the context of the new event is inconsistent with the batched events
         of the same type, that means the context changed quickly before the
         batch had a chance to flush.  In this case, we need to flush the
         previous batch and start a new batch. */
      if (actionInconsistentWithBatch(a, running.rowAdd)) {
        running = yield call(flushRowAddBatch, running);
      }
      running = addEventToBatch(a, running);
    } else {
      /* If the event was anything other than a row add event or a data change
				 event, we need to flush the batches for both the queued row add and
				 data change events and then handle the new event without queueing
				 it. */
      running = yield call(flushRowAddBatch, running);
      running = yield call(flushDataBatch, running);
      yield fork(config.tasks.handleChangeEvent, a.payload, a.context);
    }
  }
  // Cleanup leftover events at the end.
  running = yield call(flushDataBatch, running);
  running = yield call(flushRowAddBatch, running);
}

export const createAuthenticatedTableSaga = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
>(
  config: SagaConfig<R, M, S, C>
): Saga => {
  const flusher: Flusher<R, M, S, C> = flushEvents;

  function* tableChangeEventSaga(): SagaIterator {
    const changeChannel = yield actionChannel(config.actions.handleEvent.toString());

    function* handleDataChangeEvent(a: Redux.TableAction<Table.DataChangeEvent<R>, C>): SagaIterator {
      yield delay(200);
      const actions: Redux.TableAction<Table.ChangeEvent<R>, C>[] = yield flush(changeChannel);
      yield call(flusher, config, [a, ...actions]);
    }

    function* handleRowAddEvent(a: Redux.TableAction<Table.RowAddDataEvent<R>, C>): SagaIterator {
      /* Buffer and flush data change events and new row events that occur
				 every 500ms - this is particularly important for dragging cell values
				 to update other cell values as it submits a separate DataChangeEvent
				 for every new cell value. */
      yield delay(500);
      const actions: Redux.TableAction<Table.ChangeEvent<R>, C>[] = yield flush(changeChannel);
      yield call(flusher, config, [a, ...actions]);
    }

    function* handleChangeEvent(a: Redux.TableAction<Table.ChangeEvent<R>, C>): SagaIterator {
      const e: Table.ChangeEvent<R> = a.payload;
      if (events.isDataChangeEvent(e)) {
        yield call(handleDataChangeEvent, a as Redux.TableAction<Table.DataChangeEvent<R>, C>);
      } else if (
        /* We do not want to buffer RowAdd events if the row is being added
					 either by the RowAddIndexPayload or the RowAddCountPayload. */
        events.isRowAddEvent(e) &&
        events.isRowAddDataEvent(e)
      ) {
        yield call(handleRowAddEvent, a as Redux.TableAction<Table.RowAddDataEvent<R>, C>);
      } else {
        yield call(config.tasks.handleChangeEvent, e, a.context);
      }
    }

    while (true) {
      const action: Redux.TableAction<Table.Event<R, M>, C> = yield take(changeChannel);
      const e: Table.Event<R, M> = action.payload;
      const store = yield select(config.selectStore);
      if (events.isChangeEvent(e)) {
        yield call(handleChangeEvent, action as Redux.TableAction<Table.ChangeEvent<R>, C>);
      } else if (events.isMetaEvent(e)) {
        if (e.type === "forward") {
          const redoEvent = events.getRedoEvent<R>(store);
          if (!isNil(redoEvent)) {
            yield call(handleChangeEvent, { ...action, payload: redoEvent });
          }
        } else {
          const undoEvent = events.getUndoEvent<R>(store);
          if (!isNil(undoEvent)) {
            yield call(handleChangeEvent, { ...action, payload: undoEvent });
          }
        }
      }
    }
  }

  /* There are some tables, like the FringesTable, that are displayed in a modal
     and the task set associated with them does not include a request task,
     because the request task is performed inside the task set of the Account or
     SubAccount.

		 In this case, the Saga is just used to listen for change events - not make
		 requests and populate the table data.
		 */
  let baseTableSaga: Saga | null = null;
  if (configIsWithRequest<R, M, S, C>(config)) {
    baseTableSaga = createPublicTableSaga<R, M, S, C>(config);
  }

  function* rootSaga(): SagaIterator {
    if (!isNil(baseTableSaga)) {
      yield spawn(baseTableSaga);
    }
    yield spawn(tableChangeEventSaga);
  }
  return rootSaga;
};
