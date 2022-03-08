import { tabling, redux } from "lib";

import createEventReducer from "./createEventReducer";

export const createTableReducer = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context,
  A extends Redux.TableActionMap<M, C> = Redux.TableActionMap<M, C>
>(
  config: Table.ReducerConfig<R, M, S, C, A>
): Redux.Reducer<S> => {
  return (state: S | undefined = config.initialState, action: Redux.Action): S => {
    let newState = { ...state };

    if (redux.reducers.isClearOnAction(config.clearOn, action)) {
      newState = { ...state, data: [] };
    }

    if (action.type === config.actions.response.toString()) {
      const response: Http.TableResponse<M> = action.payload;
      return {
        ...newState,
        data: tabling.data.createTableRows<R, M>({
          ...config,
          response
        })
      };
    } else if (action.type === config.actions.setSearch.toString()) {
      const search: string = action.payload;
      return { ...newState, search };
    }
    return newState;
  };
};

export const createPublicTableReducer = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context
>(
  config: Table.ReducerConfig<R, M, S, C, Redux.TableActionMap<M, C>>
): Redux.Reducer<S> => {
  return createTableReducer<R, M, S, C, Redux.TableActionMap<M, C>>(config);
};

export const createAuthenticatedTableReducer = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  S extends Redux.TableStore<R> = Redux.TableStore<R>,
  C extends Table.Context = Table.Context,
  A extends Redux.AuthenticatedTableActionMap<R, M, C> = Redux.AuthenticatedTableActionMap<R, M, C>
>(
  config: Table.ReducerConfig<R, M, S, C, A> & {
    readonly getModelRowChildren?: (m: M) => number[];
    readonly recalculateRow?: (state: S, row: Table.DataRow<R>) => Partial<R>;
  }
): Redux.Reducer<S> => {
  const tableEventReducer = createEventReducer<R, M, S, C, A>(config);
  const generic = createTableReducer<R, M, S, C, A>(config);

  return (state: S | undefined = config.initialState, action: Redux.Action): S => {
    const newState = generic(state, action);
    if (action.type === config.actions.handleEvent.toString()) {
      return tableEventReducer(newState, action.payload);
    }
    return newState;
  };
};
