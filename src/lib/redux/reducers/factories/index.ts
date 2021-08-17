import { modelListActionReducer } from "lib/redux/reducers";

export * from "./util";
export * from "./comments";
export * from "./detail";
export * from "./table";

export const createSimplePayloadReducer = <P>(actionType: string, initialState: P): Redux.Reducer<P> => {
  const reducer: Redux.Reducer<P> = (state: P = initialState, action: Redux.Action<P>): P => {
    if (action.type === actionType && action.payload !== undefined) {
      return action.payload;
    }
    return state;
  };
  return reducer;
};

export const createSimpleBooleanReducer = (actionType: string): Redux.Reducer<boolean> =>
  createSimplePayloadReducer<boolean>(actionType, false);

/**
 * A reducer factory that creates a generic reducer to handle the state of a
 * list of primary keys that indicate that certain behavior is taking place for
 * the models corresponding to the primary keys of the list.  For instance, if
 * we wanted to keep track of the Accounts that are actively being updated, the
 * reducer would handle the state of a list of primary keys corresponding to the
 * Accounts that are being updated.
 *
 * The reducer has default behavior that is mapped to the action types via
 * the mappings parameter.
 *
 * @param mappings  Mappings of the standard actions to the specific actions that
 *                  the reducer should listen for.
 * @param options   Additional options supplied to the reducer factory.
 */
/* prettier-ignore */
export const createModelListActionReducer =
  (actionType: string) =>
    (st: Redux.ModelListActionStore = [], action: Redux.Action<Redux.ModelListActionPayload>) => {
      if (action.type === actionType) {
        return modelListActionReducer(st, action);
      }
      return st;
    };
