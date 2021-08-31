import { redux } from "lib";

export const initialSubAccountState: Modules.Share.SubAccountStore = {
  id: null,
  detail: redux.initialState.initialDetailResponseState,
  table: {
    ...redux.initialState.initialTableState,
    fringes: {
      ...redux.initialState.initialTableState,
      fringeColors: []
    },
    subaccountUnits: []
  }
};

export const initialAccountState: Modules.Share.AccountStore = {
  id: null,
  detail: redux.initialState.initialDetailResponseState,
  table: {
    ...redux.initialState.initialTableState,
    fringes: {
      ...redux.initialState.initialTableState,
      fringeColors: []
    },
    subaccountUnits: []
  }
};

const initialState: Modules.Share.Store = {
  id: null,
  detail: redux.initialState.initialDetailResponseState,
  account: initialAccountState,
  subaccount: initialSubAccountState
};

export default initialState;
