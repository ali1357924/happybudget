import { redux } from "lib";

const initialState: Modules.Dashboard.Store = {
  budgets: {
    ...redux.initialState.initialAuthenticatedModelListResponseState,
    ordering: [
      { field: "created_at", order: 0 },
      { field: "updated_at", order: -1 },
      { field: "name", order: 0 }
    ]
  },
  templates: {
    ...redux.initialState.initialAuthenticatedModelListResponseState,
    ordering: [
      { field: "created_at", order: 0 },
      { field: "updated_at", order: -1 },
      { field: "name", order: 0 }
    ]
  },
  community: {
    ...redux.initialState.initialAuthenticatedModelListResponseState,
    ordering: [
      { field: "created_at", order: 0 },
      { field: "updated_at", order: -1 },
      { field: "name", order: 0 }
    ]
  },
  contacts: redux.initialState.initialTableState
};

export default initialState;
