import React from "react";
import { Switch, Redirect, Route } from "react-router-dom";

import { ConnectedApplicationSpinner } from "components";
import { NotFoundRoute, PrivateRoute } from "components/routes";

import * as config from "config";

import Logout from "./Logout";

const Dashboard = config.lazyWithRetry(() => import("./Dashboard"));
const Budget = config.lazyWithRetry(() => import("./Budget"));
const Template = config.lazyWithRetry(() => import("./Template"));
const Settings = config.lazyWithRetry(() => import("./Settings"));

const Application = (): JSX.Element => {
  return (
    <React.Fragment>
      <ConnectedApplicationSpinner />
      <Switch>
        <Redirect exact from={"/"} to={"/budgets"} />
        <PrivateRoute path={"/budgets/:budgetId"} component={Budget} />
        <PrivateRoute path={"/templates/:templateId"} component={Template} />
        <PrivateRoute path={["/budgets", "/contacts", "/templates", "/discover", "/new"]} component={Dashboard} />
        <PrivateRoute path={["/profile", "/security"]} component={Settings} />
        <Route exact path={"/logout"} component={Logout} />
        <NotFoundRoute />
      </Switch>
    </React.Fragment>
  );
};

export default Application;
