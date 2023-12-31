import { isNil, reduce, filter, orderBy } from "lodash";

export const orderActions = (actions: Table.MenuActionObj[]): Table.MenuActionObj[] => {
  const actionsWithIndex = filter(actions, (action: Table.MenuActionObj) => !isNil(action.index));
  const actionsWithoutIndex = filter(actions, (action: Table.MenuActionObj) => isNil(action.index));
  return [...orderBy(actionsWithIndex, ["index"], ["asc"]), ...actionsWithoutIndex];
};

export const evaluateActions = <
  R extends Table.RowData,
  M extends Model.RowHttpModel = Model.RowHttpModel,
  T extends Table.PublicMenuActionParams<R, M> = Table.PublicMenuActionParams<R, M>
>(
  actions: Table.MenuActions<R, M, T>,
  params: T
): Table.MenuActionObj[] => {
  return orderActions(
    reduce(
      Array.isArray(actions) ? actions : actions(params),
      (objs: Table.MenuActionObj[], action: Table.MenuAction<R, M, T>) => {
        return [...objs, typeof action === "function" ? action(params) : action];
      },
      []
    )
  );
};

export const combineMenuActions = <
  P extends Table.PublicMenuActionParams<R, M>,
  R extends Table.RowData,
  M extends Model.RowHttpModel
>(
  ...args: Table.MenuActions<R, M, P>[]
): Table.MenuActions<R, M, P> => {
  return (params: P) =>
    reduce(
      args,
      (curr: Array<Table.MenuAction<R, M, P>>, actions: Table.MenuActions<R, M, P>) => {
        return [...curr, ...(typeof actions === "function" ? actions(params) : actions)];
      },
      []
    );
};
