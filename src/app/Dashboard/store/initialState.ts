import { initialListResponseState } from "store/initialState";

const initialState: Redux.Dashboard.Store = {
  contacts: initialListResponseState,
  budgets: initialListResponseState,
  templates: {
    ...initialListResponseState,
    duplicating: [],
    moving: []
  },
  community: {
    ...initialListResponseState,
    duplicating: []
  }
};

export default initialState;