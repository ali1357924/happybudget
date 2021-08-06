import { Reducer } from "redux";
import { isNil, forEach, find, filter, includes, map } from "lodash";
import { util } from "lib";
import { initialModelListResponseState, initialListResponseState } from "store/initialState";

import { warnInconsistentState } from "../util";
import { mergeOptionsWithDefaults, createObjectReducerFromMap } from "./util";
import { MappedReducers, FactoryOptions, createAgnosticModelListActionReducer } from ".";

export type IListResponseActionMap = {
  Loading: string;
  Response: string;
  Request: string;
};

/**
 * A reducer factory that creates a generic reducer to handle the state of a
 * list response, where a list response might be the response received from
 * submitting an API request to /entity/.
 *
 * The reducer has default behavior that is mapped to the action types via
 * the mappings parameter.
 *
 * @param mappings  Mappings of the standard actions to the specific actions that
 *                  the reducer should listen for.
 * @param options   Additional options supplied to the reducer factory.
 */
export const createListResponseReducer = <
  M,
  S extends Redux.ListResponseStore<M> = Redux.ListResponseStore<M>,
  A extends Redux.Action<any> = Redux.Action<any>
>(
  /* eslint-disable indent */
  mappings: Partial<IListResponseActionMap>,
  options: Partial<FactoryOptions<S, A>> = {}
): Reducer<S, A> => {
  const Options = mergeOptionsWithDefaults<S, A>(options, initialListResponseState as S);

  const reducers: MappedReducers<IListResponseActionMap, S, A> = {
    Response: (st: S = Options.initialState, action: Redux.Action<Http.ListResponse<M>>) => {
      return {
        ...st,
        data: action.payload.data,
        count: action.payload.count,
        selected: [],
        responseWasReceived: true
      };
    },
    Request: (st: S = Options.initialState, action: Redux.Action<null>) => ({ ...st, responseWasReceived: false }),
    Loading: (st: S = Options.initialState, action: Redux.Action<boolean>) => ({ ...st, loading: action.payload })
  };
  return createObjectReducerFromMap<IListResponseActionMap, S, A>(mappings, reducers, Options);
};

export type IModelListResponseActionMap = {
  SetSearch: string;
  Loading: string;
  Response: string;
  SetPage: string;
  SetPageSize: string;
  SetPageAndSize: string;
  AddToState: string;
  RemoveFromState: string;
  UpdateInState: string;
  Select: string;
  SelectAll: string;
  Deselect: string;
  Request: string;
  Deleting: string;
  Updating: string;
  Creating: string;
  ObjLoading: string;
  RestoreSearchCache?: string;
};

/**
 * A reducer factory that creates a generic reducer to handle the state of a
 * list response of models, where a list response might be the response received from
 * submitting an API request to /entity/.
 *
 * The reducer has default behavior that is mapped to the action types via
 * the mappings parameter.
 *
 * @param mappings  Mappings of the standard actions to the specific actions that
 *                  the reducer should listen for.
 * @param options   Additional options supplied to the reducer factory.
 */
export const createModelListResponseReducer = <
  M extends Model.Model,
  S extends Redux.ModelListResponseStore<M> = Redux.ModelListResponseStore<M>,
  A extends Redux.Action<any> = Redux.Action<any>
>(
  /* eslint-disable indent */
  mappings: Partial<IModelListResponseActionMap>,
  options: Partial<FactoryOptions<S, A>> = {}
): Reducer<S, A> => {
  const Options = mergeOptionsWithDefaults<S, A>(options, initialModelListResponseState as S);

  const DeletingReducer = createAgnosticModelListActionReducer();
  const UpdatingReducer = createAgnosticModelListActionReducer();
  const ObjLoadingReducer = createAgnosticModelListActionReducer();

  const reducers: MappedReducers<IModelListResponseActionMap, S, A> = {
    // We have to reset the page to it's initial state otherwise we run the risk
    // of a 404 with the API request due to the page not being found.
    SetSearch: (st: S = Options.initialState, action: Redux.Action<string>) => ({
      ...st,
      page: 1,
      search: action.payload
    }),
    Response: (st: S = Options.initialState, action: Redux.Action<Http.ListResponse<M>>) => {
      return {
        ...st,
        data: action.payload.data,
        count: action.payload.count,
        selected: [],
        responseWasReceived: true,
        cache: {
          ...st.cache,
          [st.search]: {
            data: action.payload.data,
            count: action.payload.count,
            next: action.payload.next,
            previous: action.payload.previous
          }
        }
      };
    },
    RestoreSearchCache: (st: S = Options.initialState, action: Redux.Action<null>) => {
      const cachedResponse: Http.ListResponse<M> = st.cache[st.search];
      if (!isNil(cachedResponse)) {
        return {
          ...st,
          data: cachedResponse.data,
          count: cachedResponse.count
        };
      }
      return st;
    },
    Request: (st: S = Options.initialState, action: Redux.Action<null>) => ({
      ...st,
      responseWasReceived: false,
      data: [],
      count: 0,
      selected: [],
      cache: {}
    }),
    Loading: (st: S = Options.initialState, action: Redux.Action<boolean>) => ({ ...st, loading: action.payload }),
    SetPage: (st: S = Options.initialState, action: Redux.Action<number>) => ({
      ...st,
      page: action.payload,
      selected: []
    }),
    SetPageSize: (st: S = Options.initialState, action: Redux.Action<number>) => ({
      ...st,
      pageSize: action.payload,
      selected: []
    }),
    SetPageAndSize: (st: S = Options.initialState, action: Redux.Action<PageAndSize>) => ({
      ...st,
      pageSize: action.payload.pageSize,
      page: action.payload.page,
      selected: []
    }),
    AddToState: (st: S = Options.initialState, action: Redux.Action<M>) => {
      const existing = find(st.data, { id: action.payload.id });
      if (!isNil(existing)) {
        if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
          warnInconsistentState({
            action: action.type,
            reason: "Instance already exists in state when it is not expected to."
          });
        }
        return st;
      } else {
        let pageSize = st.pageSize;
        if (st.data.length + 1 >= st.pageSize) {
          pageSize = st.pageSize + 1;
        }
        return { ...st, data: [...st.data, action.payload], count: st.count + 1, pageSize };
      }
    },
    RemoveFromState: (st: S = Options.initialState, action: Redux.Action<number>) => {
      const existing = find(st.data, { id: action.payload });
      if (isNil(existing)) {
        if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
          warnInconsistentState({
            action: action.type,
            reason: "Instance does not exist in state when it is expected to."
          });
        }
        return st;
      } else {
        const partial = {
          data: filter(st.data, (entity: M) => entity.id !== action.payload),
          count: st.count - 1,
          selected: st.selected
        };
        // Also remove the document from the selected documents.
        if (includes(st.selected, action.payload)) {
          partial.selected = filter(st.selected, (id: number) => id !== action.payload);
        }
        return { ...st, ...partial };
      }
    },
    UpdateInState: (st: S = Options.initialState, action: Redux.Action<Redux.UpdateModelActionPayload<M>>) => {
      const existing: M | undefined = find(st.data, { id: action.payload.id } as any);
      // TODO: If the entity does not exist in the state when updating, should
      // we auto add it?
      if (isNil(existing)) {
        if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
          warnInconsistentState({
            action: action.type,
            reason: "Instance does not exist in state when it is expected to."
          });
        }
        return st;
      }
      const { id: _, ...withoutId } = action.payload.data;
      return { ...st, data: util.replaceInArray<M>(st.data, { id: action.payload.id }, { ...existing, ...withoutId }) };
    },
    Deselect: (st: S = Options.initialState, action: Redux.Action<number>) => {
      const element = find(st.data, { id: action.payload });
      if (!isNil(element) || Options.strictSelect === false) {
        if (!includes(st.selected, action.payload)) {
          if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
            warnInconsistentState({
              action: action.type,
              reason: "Instance does not exist in selected state when it is expected to."
            });
          }
          return st;
        }
        return { ...st, selected: filter(st.selected, (id: number) => id !== action.payload) };
      } else {
        if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
          warnInconsistentState({
            action: action.type,
            reason: "Instance does not exist in selected state when it is expected to."
          });
        }
        return st;
      }
    },
    SelectAll: (st: S = Options.initialState, action: Redux.Action<null>) => {
      if (st.selected.length === st.data.length) {
        return { ...st, selected: [] };
      } else {
        return { ...st, selected: map(st.data, (model: M) => model.id) };
      }
    },
    Select: (st: S = Options.initialState, action: Redux.Action<number | number[]>) => {
      const selected: number[] = [];
      if (Array.isArray(action.payload)) {
        forEach(action.payload, (id: number) => {
          const element = find(st.data, { id });
          if (!isNil(element) || Options.strictSelect === false) {
            selected.push(id);
          } else {
            if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
              warnInconsistentState({
                action: action.type,
                reason: "Instance exist in selected state when it is not expected to."
              });
            }
          }
        });
        return { ...st, selected };
      } else {
        const element = find(st.data, { id: action.payload });
        if (!isNil(element) || Options.strictSelect === false) {
          return { ...st, selected: [...st.selected, action.payload] };
        } else {
          if (!isNil(action.meta) && action.meta.ignoreInconsistentState !== true) {
            warnInconsistentState({
              action: action.type,
              reason: "Instance exists in selected state when it is not expected to."
            });
          }
          return st;
        }
      }
    },
    Creating: (st: S = Options.initialState, action: Redux.Action<boolean>) => ({ ...st, creating: action.payload }),
    Deleting: (st: S = Options.initialState, action: Redux.Action<Redux.ModelListActionPayload>) => {
      return {
        ...st,
        deleting: DeletingReducer(st.deleting, action)
      };
    },
    ObjLoading: (st: S = Options.initialState, action: Redux.Action<Redux.ModelListActionPayload>) => {
      return {
        ...st,
        deleting: ObjLoadingReducer(st.objLoading, action)
      };
    },
    Updating: (st: S = Options.initialState, action: Redux.Action<Redux.ModelListActionPayload>) => {
      return {
        ...st,
        updating: UpdatingReducer(st.updating, action)
      };
    }
  };

  return createObjectReducerFromMap<IModelListResponseActionMap, S, A>(mappings, reducers, Options);
};
