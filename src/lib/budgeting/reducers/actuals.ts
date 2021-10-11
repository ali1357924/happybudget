import * as tabling from "../../tabling";

type M = Model.Actual;
type R = Tables.ActualRowData;

export type ActualTableActionMap = Redux.AuthenticatedTableActionMap<R, M> & {
  readonly responseActualTypes: Http.ListResponse<Model.Tag>;
};

/* eslint-disable indent */
export const createAuthenticatedActualsTableReducer = (
  config: Table.ReducerConfig<R, M, Tables.ActualTableStore, ActualTableActionMap> & {
    readonly ownerTree: Redux.Reducer<Redux.ModelListResponseStore<Model.OwnerTreeNode>>;
  }
): Redux.Reducer<Tables.ActualTableStore> => {
  type S = Tables.ActualTableStore;

  const generic = tabling.reducers.createAuthenticatedTableReducer<R, M, Tables.ActualTableStore>(config);

  return (state: S | undefined = config.initialState, action: Redux.Action<any>): S => {
    let newState = generic(state, action);
    if (action.type === config.actions.responseActualTypes.toString()) {
      const payload: Http.ListResponse<Model.Tag> = action.payload;
      newState = { ...newState, actualTypes: payload.data };
    }
    return { ...newState, ownerTree: config.ownerTree(newState.ownerTree, action) };
  };
};
