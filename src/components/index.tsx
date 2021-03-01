import React, { Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "style/index.scss";

import { SuspenseFallback } from "components/display";

const Landing = React.lazy(() => import("./Landing"));
const Application = React.lazy(() => import("./Application"));

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ToastContainer />
      <div className={"root"}>
        <Suspense fallback={<SuspenseFallback />}>
          <Switch>
            <Route path={["/login"]} component={Landing} />
            <Route path={["/"]} component={Application} />
          </Switch>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
