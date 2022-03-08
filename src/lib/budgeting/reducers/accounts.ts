import { tabling } from "lib";

type R = Tables.AccountRowData;
type M = Model.Account;
type S = Tables.AccountTableStore;

type ReducerConfig<
  A extends Redux.TableActionMap<M, Tables.AccountTableContext> = Redux.TableActionMap<M, Tables.ActualTableContext>
> = Table.ReducerConfig<R, M, S, Tables.AccountTableContext, A>;

export const createPublicAccountsTableReducer = (config: ReducerConfig): Redux.Reducer<S> => {
  return tabling.reducers.createPublicTableReducer<R, M, S, Tables.AccountTableContext>(config);
};

export const createAuthenticatedAccountsTableReducer = (
  config: Omit<ReducerConfig<Redux.AuthenticatedTableActionMap<R, M, Tables.AccountTableContext>>, "defaultData">
): Redux.Reducer<S> =>
  tabling.reducers.createAuthenticatedTableReducer<R, M, S, Tables.AccountTableContext>({
    defaultData: {
      markup_contribution: 0.0,
      actual: 0.0,
      accumulated_markup_contribution: 0.0,
      accumulated_fringe_contribution: 0.0
    },
    ...config
  });
