import React, { Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "style/index.scss";

import { ApplicationSpinner } from "components/display";
import { ReduxRoute } from "components/routes";
import { componentLoader } from "lib/operational";

const Landing = React.lazy(() => componentLoader(() => import("./Landing")));
const Application = React.lazy(() => componentLoader(() => import("./Application")));

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ToastContainer />
      <div className={"root"}>
        <div id={"application-spinner-container"}></div>
        <Suspense fallback={<ApplicationSpinner visible={true} />}>
          <Switch>
            <Route path={["/login", "/signup"]} component={Landing} />
            <ReduxRoute path={["/"]} component={Application} />
          </Switch>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
