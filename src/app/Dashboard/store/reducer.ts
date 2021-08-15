import { Reducer, combineReducers } from "redux";
import { redux } from "lib";
import { ActionType } from "./actions";

const rootReducer: Reducer<Modules.Dashboard.Store, Redux.Action<any>> = combineReducers({
  templates: redux.reducers.factories.createModelListResponseReducer<
    Model.SimpleTemplate,
    Modules.Dashboard.TemplatesStore,
    Redux.Action<any>
  >(
    {
      Response: ActionType.Templates.Response,
      Loading: ActionType.Templates.Loading,
      SetSearch: ActionType.Templates.SetSearch,
      SetPage: ActionType.Templates.SetPage,
      SetPageSize: ActionType.Templates.SetPageSize,
      SetPageAndSize: ActionType.Templates.SetPageAndSize,
      AddToState: ActionType.Templates.AddToState,
      RemoveFromState: ActionType.Templates.RemoveFromState,
      UpdateInState: ActionType.Templates.UpdateInState,
      Deleting: ActionType.Templates.Deleting
    },
    {
      subReducers: {
        duplicating: redux.reducers.factories.createModelListActionReducer(ActionType.Templates.Duplicating),
        moving: redux.reducers.factories.createModelListActionReducer(ActionType.Templates.MovingToCommunity)
      }
    }
  ),
  community: redux.reducers.factories.createModelListResponseReducer<
    Model.SimpleTemplate,
    Modules.Dashboard.CommunityTemplatesStore,
    Redux.Action<any>
  >(
    {
      Response: ActionType.Community.Response,
      Loading: ActionType.Community.Loading,
      SetSearch: ActionType.Community.SetSearch,
      SetPage: ActionType.Community.SetPage,
      SetPageSize: ActionType.Community.SetPageSize,
      SetPageAndSize: ActionType.Community.SetPageAndSize,
      AddToState: ActionType.Community.AddToState,
      RemoveFromState: ActionType.Community.RemoveFromState,
      UpdateInState: ActionType.Community.UpdateInState,
      Deleting: ActionType.Community.Deleting
    },
    {
      subReducers: {
        duplicating: redux.reducers.factories.createModelListActionReducer(ActionType.Community.Duplicating),
        hiding: redux.reducers.factories.createModelListActionReducer(ActionType.Community.Hiding),
        showing: redux.reducers.factories.createModelListActionReducer(ActionType.Community.Showing)
      }
    }
  ),
  budgets: redux.reducers.factories.createModelListResponseReducer<
    Model.SimpleBudget,
    Redux.ModelListResponseStore<Model.SimpleBudget>,
    Redux.Action<any>
  >({
    Response: ActionType.Budgets.Response,
    Loading: ActionType.Budgets.Loading,
    SetSearch: ActionType.Budgets.SetSearch,
    SetPage: ActionType.Budgets.SetPage,
    SetPageSize: ActionType.Budgets.SetPageSize,
    SetPageAndSize: ActionType.Budgets.SetPageAndSize,
    AddToState: ActionType.Budgets.AddToState,
    RemoveFromState: ActionType.Budgets.RemoveFromState,
    UpdateInState: ActionType.Budgets.UpdateInState,
    Deleting: ActionType.Budgets.Deleting
  })
});

export default rootReducer;
