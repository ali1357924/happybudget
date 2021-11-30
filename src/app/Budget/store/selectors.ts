import { createSelector } from "reselect";

import { redux, budgeting } from "lib";
import { initialSubAccountsTableState } from "./initialState";

export const selectBudgetId = (state: Application.Authenticated.Store) => state.budget.id;
export const selectBudgetDetail = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.detail.data
);
export const selectBudgetDetailLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.budget.detail.loading
);

export const selectSubAccountsTableStore = redux.selectors.simpleDeepEqualSelector((store: Application.Store) => {
  if (redux.typeguards.isAuthenticatedStore(store)) {
    const path = store.router.location.pathname;
    if (budgeting.urls.isAccountUrl(path)) {
      return store.budget.account.table;
    } else if (budgeting.urls.isSubAccountUrl(path)) {
      return store.budget.subaccount.table;
    } else {
      console.warn(
        `SubAccountsTableStore encountered path ${path} which is not pertinent to an
          account or a subaccount.`
      );
    }
  }
  return initialSubAccountsTableState;
});

export const selectFringesStore = createSelector(
  selectSubAccountsTableStore,
  (state: Tables.SubAccountTableStore) => state.fringes
);

export const selectFringes = createSelector(selectFringesStore, (state: Tables.FringeTableStore) => state.data);

export const selectSubAccountUnits = createSelector(
  selectSubAccountsTableStore,
  (state: Tables.SubAccountTableStore) => state.subaccountUnits
);
