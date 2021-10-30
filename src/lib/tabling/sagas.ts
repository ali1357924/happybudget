import { Saga, SagaIterator } from "redux-saga";
import { spawn, take, call, cancel, actionChannel, delay, fork, flush, all } from "redux-saga/effects";
import { isNil, map, filter } from "lodash";

import { tabling } from "lib";

/* eslint-disable indent */
export const createTableSaga = <
  R extends Table.RowData,
  M extends Model.TypedHttpModel = Model.TypedHttpModel,
  A extends Redux.AuthenticatedTableActionMap<R, M> = Redux.AuthenticatedTableActionMap<R, M>
>(
  config: Table.SagaConfig<R, M, A>
): Saga => {
  function* requestSaga(): SagaIterator {
    let lastTasks;
    if (!isNil(config.actions.request)) {
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

export const createUnauthenticatedTableSaga = <
  R extends Table.RowData,
  M extends Model.TypedHttpModel = Model.TypedHttpModel,
  A extends Redux.AuthenticatedTableActionMap<R, M> = Redux.AuthenticatedTableActionMap<R, M>
>(
  config: Table.SagaConfig<R, M, A>
): Saga => {
  return createTableSaga<R, M, A>(config);
};

/* eslint-disable indent */
export const createAuthenticatedTableSaga = <
  R extends Table.RowData,
  M extends Model.TypedHttpModel = Model.TypedHttpModel,
  A extends Redux.AuthenticatedTableActionMap<R, M> = Redux.AuthenticatedTableActionMap<R, M>
>(
  config: Table.SagaConfig<R, M, A>
): Saga => {
  function* flushEvents(actions: Redux.Action<Table.ChangeEvent<R, M>>[]): SagaIterator {
    /* eslint-disable-next-line no-loop-func */
    let actionsWithDataChangeEvents = filter(actions, (a: Redux.Action<Table.ChangeEvent<R, M>>) =>
      tabling.typeguards.isActionWithDataChangeEvent(a)
    ) as Redux.Action<Table.DataChangeEvent<R>>[];

    let actionsWithoutDataChangeEvents = filter(
      actions,
      /* eslint-disable-next-line no-loop-func */
      (a: Redux.Action<Table.ChangeEvent<R, M>>) => !tabling.typeguards.isActionWithDataChangeEvent(a)
    );

    const events: Table.DataChangeEvent<R>[] = map(
      actionsWithDataChangeEvents,
      /* eslint-disable-next-line no-loop-func */
      (a: Redux.Action<Table.DataChangeEvent<R>>) => a.payload
    );
    const event = tabling.events.consolidateDataChangeEvents(events);
    if (!Array.isArray(event.payload) || event.payload.length !== 0) {
      yield fork(config.tasks.handleChangeEvent, {
        type: config.actions.tableChanged.toString(),
        payload: event
      });
    }
    // Note: Since we are now applying the events in a segmented order, the order might
    // not be the same as it was when the user submitted them.  This might cause bugs, as
    // a certain entity might not longer exist if it was deleted and then updated, for
    // example.  However, this will only happen if the user is abnormally fast (like really
    // fast).
    yield all(
      /* eslint-disable-next-line no-loop-func */
      map(actionsWithoutDataChangeEvents, (a: Redux.Action<Table.ChangeEvent<R, M>>) =>
        call(config.tasks.handleChangeEvent, a)
      )
    );
  }

  function* tableChangeEventSaga(): SagaIterator {
    const changeChannel = yield actionChannel(config.actions.tableChanged.toString());
    try {
      while (true) {
        const action = yield take(changeChannel);
        yield call(config.tasks.handleChangeEvent, action);
        // console.log({ action: action.type });
        // const e: Table.ChangeEvent<R, M> = action.payload;
        // if (!tabling.typeguards.isDataChangeEvent(e)) {
        //   console.log("HANDLING DATA CHANGE");
        //   yield fork(config.tasks.handleChangeEvent, action);
        // } else {
        //   // Buffer and flush data change events that occur every 500ms - this is particularly
        //   // important for dragging cell values to update other cell values as it submits a
        //   // separate DataChangeEvent for every new cell value.
        //   yield delay(200);
        //   const actions: Redux.Action<Table.ChangeEvent<R, M>>[] = yield flush(changeChannel);
        //   yield fork(flushEvents, [...actions, action]);
        // }
      }
    } finally {
      const actions = yield flush(changeChannel);
      if (actions.length !== 0) {
        yield fork(flushEvents, actions);
      }
    }
  }

  const baseTableSaga = createTableSaga<R, M, A>(config);

  function* rootSaga(): SagaIterator {
    yield spawn(baseTableSaga);
    yield spawn(tableChangeEventSaga);
  }
  return rootSaga;
};
