import React from "react";
import { Switch, Redirect, Route } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Dispatch } from "redux";

import { actions } from "store";

import { MultipleBudgetProductPermissionModal } from "components/modals";
import { NotFoundRoute, PathParamsRoute } from "components/routes";

import { Budget, Template } from "./Budgeting";
import Dashboard from "./Dashboard";
import Settings from "./Settings";
import Logout from "./Logout";

const selectProductPermissionModalOpen = (state: Application.Store) => state.productPermissionModalOpen;

const Application = (): JSX.Element => {
  const ProductPermissionModalOpen = useSelector(selectProductPermissionModalOpen);
  const dispatch: Dispatch = useDispatch();

  return (
    <React.Fragment>
      <Switch>
        <Redirect exact from={"/"} to={"/budgets"} />
        <Redirect exact from={"/login"} to={"/"} />
        <PathParamsRoute<{ budgetId: number }>
          params={["budgetId"]}
          path={"/budgets/:budgetId"}
          component={Budget}
          redux={false}
        />
        <PathParamsRoute<{ budgetId: number }>
          params={["budgetId"]}
          path={"/templates/:budgetId"}
          component={Template}
          redux={false}
        />
        <Route path={["/budgets", "/contacts", "/templates", "/discover"]} component={Dashboard} />
        <Route path={["/profile", "/security", "/billing"]} component={Settings} />
        <Route exact path={"/logout"} component={Logout} />
        <NotFoundRoute auto={true} />
      </Switch>
      <MultipleBudgetProductPermissionModal
        open={ProductPermissionModalOpen}
        onCancel={() => dispatch(actions.authenticated.setProductPermissionModalOpenAction(false))}
      />
    </React.Fragment>
  );
};

export default React.memo(Application);
