import { Reducer, combineReducers } from "redux";
import { isNil, includes, map, filter, reduce, uniq, flatten } from "lodash";

import {
  createModelListResponseReducer,
  createDetailResponseReducer,
  createSimplePayloadReducer,
  createCommentsListResponseReducer
} from "lib/redux/factories";
import { CommentsListResponseActionMap } from "lib/redux/factories/comments";
import { warnInconsistentState, identityReducer } from "lib/redux/util";
import * as typeguards from "lib/model/typeguards";
import {
  fringeValue,
  consolidateTableChange,
  mergeChangesWithModel,
  eventWarrantsGroupRecalculation,
  eventWarrantsRecalculation,
  changeWarrantsRecalculation,
  rowWarrantsRecalculation
} from "lib/model/util";
import { replaceInArray, findWithDistributedTypes } from "lib/util";

import { initialModelListResponseState } from "store/initialState";

type EntityStore =
  | Modules.Budget.AccountSubAccountStore<Model.Account | Model.SubAccount>
  | Modules.Budget.BudgetStore<Model.Budget | Model.Template>;

type ModelLookup<M extends Model.Model> = number | ((m: M) => boolean);

type Model = Model.Account | Model.SubAccount;
type Models = Model.Account[] | Model.SubAccount[];

type FindModelOptions = {
  readonly warnIfMissing?: boolean;
  readonly name?: string;
};

const findModelInData = <M extends Model.Model, A extends Array<any> = M[]>(
  action: Redux.Action<any>,
  data: A,
  id: ModelLookup<M>,
  options: FindModelOptions = { name: "Model", warnIfMissing: true }
): M | null => {
  const predicate = typeof id === "number" ? (m: M) => m.id === id : id;
  const model = findWithDistributedTypes<M, A>(data, predicate);
  if (!isNil(model)) {
    return model;
  } else {
    if (options.warnIfMissing !== false) {
      warnInconsistentState({
        action: action.type,
        reason: `${options.name || "Model"} does not exist in state when it is expected to.`,
        id: id
      });
    }
    return null;
  }
};

const findModelsInData = <M extends Model.Model, A extends Array<any> = M[]>(
  action: Redux.Action<any>,
  data: A,
  ids: ModelLookup<M>[],
  options: FindModelOptions = { name: "Model", warnIfMissing: true }
): M[] =>
  filter(
    map(ids, (predicate: ModelLookup<M>) => findModelInData(action, data, predicate, options)),
    (model: M | null) => model !== null
  ) as M[];

const modelFromState = <M extends Model.Model, A extends Array<any> = M[]>(
  /* eslint-disable indent */
  action: Redux.Action<any>,
  data: A,
  id: ModelLookup<M> | M,
  options: FindModelOptions = { name: "Model", warnIfMissing: true }
): M | null => {
  if (typeof id === "number" || typeof id === "function") {
    return findModelInData<M, A>(action, data, id, options);
  }
  return id;
};

interface FringesReducerFactoryActionMap {
  TableChanged: string;
  Response: string;
  Request: string;
  Loading: string;
  SetSearch: string;
  // This will eventually be removed when we let the reducer respond to
  // the RowAddEvent directly.
  AddToState: string;
  Creating: string;
  Updating: string;
  Deleting: string;
}

export const createFringesReducer = (
  /* eslint-disable indent */
  mapping: FringesReducerFactoryActionMap
): Reducer<Redux.ModelListResponseStore<Model.Fringe>, Redux.Action<any>> => {
  const listResponseReducer = createModelListResponseReducer<Model.Fringe, Redux.ModelListResponseStore<Model.Fringe>>(
    {
      Response: mapping.Response,
      Loading: mapping.Loading,
      SetSearch: mapping.SetSearch,
      // This will eventually be removed when we let the reducer respond to
      // the RowAddEvent directly.
      AddToState: mapping.AddToState,
      Deleting: mapping.Deleting,
      Updating: mapping.Updating,
      Creating: mapping.Creating
    },
    {
      strictSelect: false,
      initialState: initialModelListResponseState
    }
  );
  return (
    state: Redux.ModelListResponseStore<Model.Fringe> = initialModelListResponseState,
    action: Redux.Action<any>
  ): Redux.ModelListResponseStore<Model.Fringe> => {
    let newState = listResponseReducer(state, action);
    if (action.type === mapping.TableChanged) {
      const e: Table.ChangeEvent<BudgetTable.FringeRow, Model.Fringe> = action.payload;

      if (typeguards.isDataChangeEvent(e)) {
        const consolidated = consolidateTableChange(e.payload);

        // The consolidateTableChange method should return changes that are grouped by SubAccount,
        // but just in case we apply grouping logic here.
        let changesPerFringe: {
          [key: number]: { changes: Table.RowChange<BudgetTable.FringeRow, Model.Fringe>[]; model: Model.Fringe };
        } = {};
        for (let i = 0; i < consolidated.length; i++) {
          if (isNil(changesPerFringe[consolidated[i].id])) {
            const fringe: Model.Fringe | null = findModelInData<Model.Fringe>(
              action,
              newState.data,
              consolidated[i].id,
              { name: "Fringe" }
            );
            if (!isNil(fringe)) {
              changesPerFringe[consolidated[i].id] = { changes: [], model: fringe };
            }
          }
          if (!isNil(changesPerFringe[consolidated[i].id])) {
            changesPerFringe[consolidated[i].id] = {
              ...changesPerFringe[consolidated[i].id],
              changes: [...changesPerFringe[consolidated[i].id].changes, consolidated[i]]
            };
          }
        }
        // For each of the Fringe(s) that were changed, apply those changes to the current
        // Fringe model in state.
        for (let k = 0; k < Object.keys(changesPerFringe).length; k++) {
          const id = parseInt(Object.keys(changesPerFringe)[k]);
          const changesObj = changesPerFringe[id];
          let fringe = changesObj.model;
          for (let j = 0; j < changesObj.changes.length; j++) {
            fringe = mergeChangesWithModel(changesObj.model, changesObj.changes[j]);
          }
          newState = {
            ...newState,
            data: replaceInArray<Model.Fringe>(newState.data, { id: fringe.id }, fringe)
          };
        }
      } else if (typeguards.isRowAddEvent(e)) {
        // Eventually, we will want to implement this - so we do not have to rely on waiting
        // for the response of the API request.
      } else if (typeguards.isRowDeleteEvent(e)) {
        const ids: number[] = Array.isArray(e.payload.rows)
          ? map(e.payload.rows, (row: BudgetTable.FringeRow) => row.id)
          : [e.payload.rows.id];
        newState = reduce(
          ids,
          (st: Redux.ModelListResponseStore<Model.Fringe>, id: number): Redux.ModelListResponseStore<Model.Fringe> => {
            const model: Model.Fringe | null = modelFromState<Model.Fringe>(action, st.data, id);
            if (!isNil(model)) {
              return {
                ...st,
                data: filter(newState.data, (m: Model.Fringe) => m.id !== id),
                count: newState.count - 1
              };
            }
            return st;
          },
          newState
        );
      }
    }
    return newState;
  };
};

const groupFromState = <S extends EntityStore>(
  action: Redux.Action<any>,
  st: S,
  id: Model.Group | number,
  lineId?: number,
  options: FindModelOptions = { name: "Group", warnIfMissing: true }
): Model.Group | null => {
  if (typeof id === "number") {
    let predicate = (g: Model.Group) => g.id === id;
    if (!isNil(lineId)) {
      predicate = (g: Model.Group) => g.id === id && includes(g.children, lineId);
    }
    return modelFromState<Model.Group>(action, st.groups.data, predicate, options);
  }
  return id;
};

const modelGroupFromState = <S extends EntityStore>(
  action: Redux.Action<any>,
  st: S,
  lineId: number,
  options: FindModelOptions = { warnIfMissing: true }
): Model.Group | null => {
  const predicate = (g: Model.Group) => includes(g.children, lineId);
  return modelFromState<Model.Group>(action, st.groups.data, predicate, { ...options, name: "Group" });
};

const recalculateGroupMetrics = <S extends EntityStore>(
  /* eslint-disable indent */
  action: Redux.Action<any>,
  st: S,
  group: Model.Group | number
): S => {
  const stateGroup = groupFromState<S>(action, st, group);
  if (!isNil(stateGroup)) {
    const objs = findModelsInData<Model.Account | Model.SubAccount, Model.Account[] | Model.SubAccount[]>(
      action,
      st.children.data,
      stateGroup.children,
      { name: "Group child account/sub-account" }
    );
    let payload: any = {
      estimated: reduce(objs, (sum: number, s: Model.Account | Model.SubAccount) => sum + (s.estimated || 0), 0)
    };
    const actual = reduce(objs, (sum: number, s: Model.Account | Model.SubAccount) => sum + (s.actual || 0), 0);
    payload = { ...payload, actual, variance: payload.estimated - actual };
    return {
      ...st,
      groups: {
        ...st.groups,
        data: replaceInArray<Model.Group>(st.groups.data, { id: stateGroup.id }, { ...stateGroup, ...payload })
      }
    };
  }
  return st;
};

const removeRowFromGroup = <S extends EntityStore>(
  action: Redux.Action<any>,
  st: S,
  id: number,
  group?: number,
  options: FindModelOptions = { warnIfMissing: true }
): [S, number | null] => {
  let newGroup: Model.Group | null = null;
  const model: Model | null = modelFromState<Model, Models>(action, st.children.data, id);
  if (!isNil(model)) {
    newGroup = !isNil(group)
      ? groupFromState<S>(action, st, group, id)
      : modelGroupFromState<S>(action, st, model.id, options);
    if (!isNil(newGroup)) {
      newGroup = {
        ...newGroup,
        children: filter(newGroup.children, (child: number) => child !== model.id)
      };
      st = {
        ...st,
        groups: {
          ...st.groups,
          data: replaceInArray<Model.Group>(st.groups.data, { id: newGroup.id }, newGroup)
        }
      };
    }
  }
  return [st, !isNil(newGroup) ? newGroup.id : null];
};

const removeRowsFromGroup = <S extends EntityStore>(
  action: Redux.Action<any>,
  st: S,
  rows: number[],
  group?: number,
  options: FindModelOptions = { warnIfMissing: true }
): [S, number[]] => {
  let groups: number[] = [];
  st = reduce(
    rows,
    (s: S, row: number) => {
      const [newState, updatedGroup] = removeRowFromGroup(action, st, row, group, options);
      groups = !isNil(updatedGroup) ? [...groups, updatedGroup] : groups;
      return newState;
    },
    st
  );
  return [st, uniq(groups)];
};

const recalculateSubAccountMetrics = <M extends Model.Account | Model.SubAccount>(
  st: Modules.Budget.AccountSubAccountStore<M>,
  action: Redux.Action<any>,
  sub: Model.SubAccount
): Model.SubAccount => {
  let newSubAccount = { ...sub };
  /*
  In the case that the SubAccount has SubAccount(s) itself, the estimated value is determined
  from the accumulation of the estimated values for those children SubAccount(s).  In this
  case,  we do not need to update the SubAccount estimated value in state because it only
  changes when the estimated values of it's SubAccount(s) on another page are altered.
  */
  if (newSubAccount.subaccounts.length === 0 && !isNil(newSubAccount.quantity) && !isNil(newSubAccount.rate)) {
    const multiplier = newSubAccount.multiplier || 1.0;
    let payload: any = {
      estimated: multiplier * newSubAccount.quantity * newSubAccount.rate
    };
    if (!isNil(newSubAccount.actual) && !isNil(payload.estimated)) {
      payload = { ...payload, variance: payload.estimated - newSubAccount.actual };
    }
    newSubAccount = { ...newSubAccount, ...payload };

    // Reapply the fringes to the SubAccount's estimated value.
    newSubAccount = {
      ...newSubAccount,
      estimated: fringeValue(
        newSubAccount.estimated,
        findModelsInData(action, st.fringes.data, newSubAccount.fringes, { name: "Fringe" })
      )
    };
  }
  return newSubAccount;
};

interface GroupsActionMap {
  Response: string;
  Request: string;
  Loading: string;
  UpdateInState: string;
  AddToState: string;
  Deleting: string;
}

interface HistoryActionMap {
  Response: string;
  Request: string;
  Loading: string;
}

interface AccountsSubAccountsActionMap {
  Response: string;
  Request: string;
  Loading: string;
  SetSearch: string;
  AddToState: string;
  Creating: string;
  Updating: string;
  Deleting: string;
}

type BudgetTemplateReducerFactoryActionMap = {
  SetId: string;
  Request: string;
  Response: string;
  Loading: string;
  TableChanged: string;
  UpdateInState: string;
  Accounts: AccountsSubAccountsActionMap;
  Groups: GroupsActionMap;
  // History only applicable in the Budget case (not the Template case).
  History?: HistoryActionMap;
  // Comments only applicable in the Budget case (not the Template case).
  Comments?: Partial<CommentsListResponseActionMap>;
};

type AccountSubAccountReducerFactoryActionMap = Omit<BudgetTemplateReducerFactoryActionMap, "Accounts"> & {
  UpdateInState: string;
  SubAccounts: AccountsSubAccountsActionMap;
  Fringes: FringesReducerFactoryActionMap;
};

const createTableReducer = <
  M extends Model.Account | Model.SubAccount,
  S extends Modules.Budget.AccountSubAccountStore<M> | Modules.Budget.BudgetStore<Model.Budget | Model.Template>
>(
  initialState: S
) => {
  type R = S extends Modules.Budget.AccountSubAccountStore<M> ? BudgetTable.SubAccountRow : BudgetTable.AccountRow;
  return (state: S = initialState, action: Redux.Action<Table.ChangeEvent<R, M>>): S => {
    let newState: S = { ...state };

    // The table change e that is attached to the action.
    const e: Table.ChangeEvent<R, M> = action.payload;

    if (typeguards.isDataChangeEvent(e)) {
      const consolidated = consolidateTableChange(e.payload);

      // The consolidated changes should contain one change per Account/SubAccount, but
      // just in case we apply that grouping logic here.
      let changesPerModel: {
        [key: number]: { changes: Table.RowChange<R, M>[]; model: M };
      } = {};
      for (let i = 0; i < consolidated.length; i++) {
        if (isNil(changesPerModel[consolidated[i].id])) {
          const model: M | null = modelFromState<M>(action, newState.children.data as M[], consolidated[i].id);
          if (!isNil(model)) {
            changesPerModel[consolidated[i].id] = { changes: [], model };
          }
        }
        if (!isNil(changesPerModel[consolidated[i].id])) {
          changesPerModel[consolidated[i].id] = {
            ...changesPerModel[consolidated[i].id],
            changes: [...changesPerModel[consolidated[i].id].changes, consolidated[i]]
          };
        }
      }
      // For each of the children Account(s) or SubAccount(s) that were changed,
      // apply those changes to the current Account/SubAccount model in state.
      newState = reduce(
        changesPerModel,
        (s: S, data: { changes: Table.RowChange<R, M>[]; model: M }) => {
          let model: M = reduce(
            data.changes,
            (m: M, change: Table.RowChange<R, M>) => mergeChangesWithModel(m, change),
            data.model
          );
          /*
          If the changes to the model warrant recalculation and the model is a SubAccount,
          we need to recalculate the metrics for that specific SubAccount.  Note that this
          behavior does not apply to Account(s), since there are no fields we can update on
          an Account that warrant recalculation.
          */
          if (changeWarrantsRecalculation(data.changes) && typeguards.isSubAccount(model)) {
            model = recalculateSubAccountMetrics<M>(s as Modules.Budget.AccountSubAccountStore<M>, action, model) as M;
          }
          s = {
            ...s,
            children: {
              ...s.children,
              data: replaceInArray<M>(s.children.data as M[], { id: model.id }, model)
            }
          };
          /*
          NOTE: Right now, in regard to the Account(s) case (when there are several Account(s),
          not a single Account with several SubAccount(s) - i.e. the case when
          S = Modules.Budget.BudgetStore) there are no changes to a single AccountRow that
          would warrant recalculation of higher level fields - however, we might have them in
          the future, if there is a column that specifies isCalculating, so we perform
          this logic regardless of whether or not the rows are AccountRow or SubAccountRow.
          */
          if (eventWarrantsGroupRecalculation(e)) {
            // The Group might not necessarily exist.
            const rowGroup = modelGroupFromState<S>(action, s, model.id, { name: "Group", warnIfMissing: false });
            if (!isNil(rowGroup)) {
              s = recalculateGroupMetrics<S>(action, s, rowGroup);
            }
          }
          return s;
        },
        newState
      );
    } else if (typeguards.isRowAddEvent(e)) {
      // Eventually, we will want to implement this - so we do not have to rely on waiting
      // for the response of the API request.
    } else if (typeguards.isFullRowEvent(e)) {
      const ids = Array.isArray(e.payload.rows)
        ? map(e.payload.rows, (row: BudgetTable.AccountRow) => row.id)
        : [e.payload.rows.id];

      if (typeguards.isRowDeleteEvent(e)) {
        // We cannot supply the Group ID because we do not know what Group each row belonged to
        // yet.  That is handled by the removeRowsFromGroup method.
        const [updatedState, groups] = removeRowsFromGroup(action, newState, ids, undefined, { warnIfMissing: false });
        newState = { ...updatedState };
        newState = reduce(
          ids,
          (s: S, id: number) => {
            const model: M | null = modelFromState<M, M[]>(action, newState.children.data as M[], id);
            if (!isNil(model)) {
              return {
                ...s,
                children: {
                  ...s.children,
                  data: filter(s.children.data, (m: M) => m.id !== model.id),
                  count: s.children.count - 1
                }
              };
            }
            return s;
          },
          newState
        );
        if (eventWarrantsGroupRecalculation(e)) {
          newState = reduce(groups, (s: S, id: number) => recalculateGroupMetrics(action, s, id), newState);
        }
      } else if (typeguards.isRowRemoveFromGroupEvent(e)) {
        // NOTE: Since we are supplying the actual Group ID here, the Groups returned from the
        // function will only ever have one ID (the original ID we passed in).
        const [updatedState, groups] = removeRowsFromGroup(action, newState, ids, e.payload.group);
        newState = { ...updatedState };
        if (eventWarrantsGroupRecalculation(e)) {
          newState = reduce(groups, (s: S, id: number) => recalculateGroupMetrics(action, s, id), newState);
        }
      } else if (typeguards.isRowAddToGroupEvent(e)) {
        const g: Model.Group | null = groupFromState<S>(action, newState, e.payload.group);
        if (!isNil(g)) {
          const [updatedState, wasUpdated]: [S, boolean] = reduce(
            ids,
            (current: [S, boolean], id: number): [S, boolean] => {
              const model = modelFromState<M, M[]>(action, newState.children.data as M[], id);
              if (!isNil(model)) {
                if (includes(g.children, model.id)) {
                  warnInconsistentState({
                    action,
                    reason: "Model already exists as a child for group.",
                    id: model.id,
                    group: g.id
                  });
                  return current;
                } else {
                  return [
                    {
                      ...current[0],
                      groups: {
                        ...current[0].groups,
                        data: replaceInArray<Model.Group>(
                          current[0].groups.data,
                          { id: g.id },
                          {
                            ...g,
                            children: [...g.children, model.id]
                          }
                        )
                      }
                    },
                    true
                  ];
                }
              }
              return current;
            },
            [newState, false]
          );
          newState = { ...updatedState };
          if (eventWarrantsGroupRecalculation(e) && wasUpdated === true) {
            newState = recalculateGroupMetrics(action, newState, e.payload.group);
          }
        }
      }
    } else if (typeguards.isGroupDeleteEvent(e)) {
      // NOTE: We do not have to worry about recalculation of any metrics in this case.
      const group: Model.Group | null = groupFromState<S>(action, newState, e.payload);
      if (!isNil(group)) {
        newState = {
          ...newState,
          groups: {
            ...newState.groups,
            data: filter(newState.groups.data, (g: Model.Group) => g.id !== e.payload),
            count: newState.groups.count - 1
          }
        };
      }
    }
    return newState;
  };
};

export const createBudgetReducer = <M extends Model.Budget | Model.Template>(
  mapping: BudgetTemplateReducerFactoryActionMap,
  initialState: Modules.Budget.BudgetStore<M>
): Reducer<Modules.Budget.BudgetStore<M>, Redux.Action<any>> => {
  const genericReducer: Reducer<Modules.Budget.BudgetStore<M>, Redux.Action<any>> = combineReducers({
    id: createSimplePayloadReducer<number | null>(mapping.SetId, null),
    detail: createDetailResponseReducer<M, Redux.ModelDetailResponseStore<M>, Redux.Action>({
      Response: mapping.Response,
      Loading: mapping.Loading,
      Request: mapping.Request,
      UpdateInState: mapping.UpdateInState
    }),
    children: createModelListResponseReducer<Model.Account>({
      Response: mapping.Accounts.Response,
      Request: mapping.Accounts.Request,
      Loading: mapping.Accounts.Loading,
      SetSearch: mapping.Accounts.SetSearch,
      // This will eventually be removed when we let the reducer respond to
      // the RowAddEvent directly.
      AddToState: mapping.Accounts.AddToState,
      Deleting: mapping.Accounts.Deleting,
      Updating: mapping.Accounts.Updating,
      Creating: mapping.Accounts.Creating
    }),
    groups: createModelListResponseReducer<Model.Group>({
      Response: mapping.Groups.Response,
      Loading: mapping.Groups.Loading,
      Request: mapping.Groups.Request,
      UpdateInState: mapping.Groups.UpdateInState,
      AddToState: mapping.Groups.AddToState,
      Deleting: mapping.Groups.Deleting
    }),
    comments: !isNil(mapping.Comments)
      ? createCommentsListResponseReducer(mapping.Comments)
      : identityReducer<Redux.ModelListResponseStore<Model.Comment>>(initialModelListResponseState),
    history: !isNil(mapping.History)
      ? createModelListResponseReducer<Model.HistoryEvent>(mapping.History)
      : identityReducer<Redux.ModelListResponseStore<Model.HistoryEvent>>(initialModelListResponseState)
  });

  const tableReducer = createTableReducer<Model.Account, Modules.Budget.BudgetStore<M>>(initialState);

  return (state: Modules.Budget.BudgetStore<M> = initialState, action: Redux.Action<any>) => {
    let newState: Modules.Budget.BudgetStore<M> = genericReducer(state, action);
    if (action.type === mapping.TableChanged) {
      newState = tableReducer(newState, action);
    }
    return newState;
  };
};

const createAccountSubAccountReducer = <M extends Model.Account | Model.SubAccount>(
  mapping: AccountSubAccountReducerFactoryActionMap,
  initialState: Modules.Budget.AccountSubAccountStore<M>
): Reducer<Modules.Budget.AccountSubAccountStore<M>, Redux.Action<any>> => {
  type S = Modules.Budget.AccountSubAccountStore<M>;

  const genericReducer: Reducer<S, Redux.Action<any>> = combineReducers({
    id: createSimplePayloadReducer<number | null>(mapping.SetId, null),
    detail: createDetailResponseReducer<M, Redux.ModelDetailResponseStore<M>, Redux.Action>({
      Response: mapping.Response,
      Loading: mapping.Loading,
      Request: mapping.Request,
      UpdateInState: mapping.UpdateInState
    }),
    fringes: createFringesReducer(mapping.Fringes),
    children: createModelListResponseReducer<Model.SubAccount>({
      Response: mapping.SubAccounts.Response,
      Request: mapping.SubAccounts.Request,
      Loading: mapping.SubAccounts.Loading,
      SetSearch: mapping.SubAccounts.SetSearch,
      AddToState: mapping.SubAccounts.AddToState,
      Deleting: mapping.SubAccounts.Deleting,
      Updating: mapping.SubAccounts.Updating,
      Creating: mapping.SubAccounts.Creating
    }),
    groups: createModelListResponseReducer<Model.Group>({
      Response: mapping.Groups.Response,
      Loading: mapping.Groups.Loading,
      Request: mapping.Groups.Request,
      UpdateInState: mapping.Groups.UpdateInState,
      AddToState: mapping.Groups.AddToState,
      Deleting: mapping.Groups.Deleting
    }),
    comments: !isNil(mapping.Comments)
      ? createCommentsListResponseReducer(mapping.Comments)
      : identityReducer<Redux.ModelListResponseStore<Model.Comment>>(initialModelListResponseState),
    history: !isNil(mapping.History)
      ? createModelListResponseReducer<Model.HistoryEvent>(mapping.History)
      : identityReducer<Redux.ModelListResponseStore<Model.HistoryEvent>>(initialModelListResponseState)
  });

  const tableReducer = createTableReducer<M, S>(initialState);

  type GenericEvent = Table.ChangeEvent<
    BudgetTable.FringeRow | BudgetTable.SubAccountRow,
    Model.Fringe | Model.SubAccount
  >;
  type FringeEvent = Table.ChangeEvent<BudgetTable.FringeRow, Model.Fringe>;

  return (state: S = initialState, action: Redux.Action<any>) => {
    let newState: S = genericReducer(state, action);

    // When an Account's underlying subaccounts are removed, updated or added,
    // or the Fringes are changed, we need to update/recalculate the Account.
    if (action.type === mapping.TableChanged || action.type === mapping.Fringes.TableChanged) {
      const e: GenericEvent = action.payload;

      // If the table change referred to a change to a SubAccount in the table, then we need to
      // update that SubAccount in state.
      if (action.type === mapping.TableChanged) {
        newState = tableReducer(newState, action);
      } else if (action.type === mapping.Fringes.TableChanged) {
        /*
        Since the Fringes are displayed in a modal and not on a separate page, when a Fringe is
        changed we need to recalculate the SubAcccount(s) that have that Fringe so they display
        estimated values that are consistent with the change to the Fringe.
        */
        const fringeEvent = e as FringeEvent;
        // There are no group related events for the Fringe Table, but we have to assert this with
        // a typeguard to make TS happy.
        if (!typeguards.isGroupEvent(fringeEvent)) {
          const recalculateSubAccountsWithFringes = (ids: number[], removeFringes?: boolean): S => {
            /*
            For each Fringe that changed, we have to look at the SubAccount(s) that have that Fringe
            applied and recalculate the metrics for that SubAccount.

            Note that we have to recalculate the SubAccount metrics in entirety, instead of just
            refringing the SubAccount estimated value.  This is because the current estimated value
            on the SubAccount already has fringes applied, and we cannot refringe and already
            fringed value without knowing what the previous Fringe(s) were.
            */
            return reduce(
              uniq(
                map(
                  flatten(
                    map(ids, (id: number) =>
                      filter(newState.children.data, (subaccount: Model.SubAccount) => includes(subaccount.fringes, id))
                    )
                  ),
                  (subaccount: Model.SubAccount) => subaccount.id
                )
              ),
              (s: S, id: number): S => {
                let subAccount = modelFromState<Model.SubAccount>(action, s.children.data, id);
                if (!isNil(subAccount)) {
                  subAccount = recalculateSubAccountMetrics(s, action, subAccount);
                  if (removeFringes === true) {
                    subAccount = {
                      ...subAccount,
                      fringes: filter(subAccount.fringes, (fringeId: number) => fringeId !== id)
                    };
                  }
                  return {
                    ...s,
                    children: {
                      ...s.children,
                      data: replaceInArray<Model.SubAccount>(s.children.data, { id: subAccount.id }, subAccount)
                    }
                  };
                }
                return s;
              },
              newState
            );
          };
          // There are no group related events for the Fringe Table, but we have to assert this with
          // a typeguard to make TS happy.
          if (typeguards.isDataChangeEvent(fringeEvent)) {
            /*
            For each Fringe change that occured, obtain the ID of the Fringe for only the changes
            that warrant recalculation of the SubAccount, and then recalculate the metrics for each
            SubAccount(s) that has that Fringe applied.

            We do not have to be concerned with the individual changes for each Fringe, since the
            actual changes will have already been applied to the Fringe(s) in the Fringe reducer.
            We only are concerned with the IDs of the Fringe(s) that changed, because we need those
            to determine what SubAccount(s) need to be updated (as a result of the change to the
            Fringe).
            */
            const consolidated = consolidateTableChange(fringeEvent.payload);
            newState = recalculateSubAccountsWithFringes(
              uniq(
                map(
                  /*
                  We only want to look at the changes to Fringe(s) that warrant recalculation of
                  the SubAccount.  The event will only warrant recalculation if either the
                  rate field or the cutoff field are changed (at least currently).
                  */
                  filter(consolidated, (ch: Table.RowChange<BudgetTable.FringeRow, Model.Fringe>) =>
                    changeWarrantsRecalculation(ch)
                  ),
                  (change: Table.RowChange<BudgetTable.FringeRow, Model.Fringe>) => change.id
                )
              )
            );
          } else if (typeguards.isRowAddEvent(fringeEvent)) {
            // Eventually, we will want to implement this - so we do not have to rely on waiting
            // for the response of the API request.
          } else if (typeguards.isRowDeleteEvent(fringeEvent)) {
            /*
            For each FringeRow that was removed, obtain the ID of the Fringe for only the removed rows
            that warrant recalculation of the SubAccount, and then recalculate the metrics for each
            SubAccount(s) that previously had that Fringe applied (while also removing the Fringe
            from that SubAccount).
            */
            const rows: BudgetTable.FringeRow[] = Array.isArray(fringeEvent.payload.rows)
              ? fringeEvent.payload.rows
              : [fringeEvent.payload.rows];
            newState = recalculateSubAccountsWithFringes(
              uniq(
                map(
                  /*
                  We only want to look at the FringeRow(s) being deleted that would otherwise warrant
                  recalculation of the SubAccount.  The row will only warrant recalculation of the
                  SubAccount if the rate field or the cutoff field are changed (at least currently).
                  */
                  filter(rows, (row: BudgetTable.FringeRow) =>
                    rowWarrantsRecalculation(row, fringeEvent.payload.columns)
                  ),
                  (row: BudgetTable.FringeRow) => row.id
                )
              ),
              true
            );
          }
        }
      }
      if (!typeguards.isGroupEvent(e) && eventWarrantsRecalculation(e)) {
        // Update the overall Account based on the underlying SubAccount(s) present.
        let subAccounts: Model.SubAccount[] = newState.children.data;
        let newData: { estimated: number; actual?: number; variance?: number } = {
          estimated: reduce(subAccounts, (sum: number, s: Model.SubAccount) => sum + (s.estimated || 0), 0)
        };
        // If we are dealing with the Budget case (and not the Template case) we need to also update
        // the overall Account's actual and variance values.
        const actual = reduce(subAccounts, (sum: number, s: Model.SubAccount) => sum + (s.actual || 0), 0);
        newData = { ...newData, actual, variance: newData.estimated - actual };
        if (!isNil(newState.detail.data)) {
          newState = {
            ...newState,
            detail: {
              ...newState.detail,
              data: {
                ...newState.detail.data,
                ...newData
              }
            }
          };
        }
      }
    }

    return newState;
  };
};

export const createAccountReducer = (
  mapping: AccountSubAccountReducerFactoryActionMap,
  initialState: Modules.Budget.AccountStore
): Reducer<Modules.Budget.AccountStore, Redux.Action<any>> =>
  createAccountSubAccountReducer<Model.Account>(mapping, initialState);

export const createSubAccountReducer = (
  mapping: AccountSubAccountReducerFactoryActionMap,
  initialState: Modules.Budget.SubAccountStore
): Reducer<Modules.Budget.SubAccountStore, Redux.Action<any>> =>
  createAccountSubAccountReducer<Model.SubAccount>(mapping, initialState);
