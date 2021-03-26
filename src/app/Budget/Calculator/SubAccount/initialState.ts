import {
  initialDetailResponseState,
  initialListResponseState,
  initialCommentsListResponseState
} from "store/initialState";

export const initialSubAccountGroupsState: Redux.Calculator.ISubAccountGroupsStore = {
  deleting: []
};

export const initialSubAccountsState: Redux.Calculator.ISubAccountsStore = {
  table: [],
  deleting: [],
  updating: [],
  creating: false,
  history: initialListResponseState,
  groups: initialSubAccountGroupsState,
  ...initialListResponseState
};

const initialState: Redux.Calculator.ISubAccountStore = {
  id: null,
  detail: initialDetailResponseState,
  subaccounts: initialSubAccountsState,
  comments: initialCommentsListResponseState
};

export default initialState;
