import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Route, Redirect } from "react-router-dom";
import { Dispatch } from "redux";

import { NetworkError, ServerError, ClientError, AuthenticationError } from "api";
import { ApplicationSpinner } from "components/display";
import { updateLoggedInUserAction } from "store/actions";
import { validateToken } from "services";

const PrivateRoute = ({ ...props }: { [key: string]: any }): JSX.Element => {
  const [redirect, setRedirect] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const dispatch: Dispatch = useDispatch();

  useEffect(() => {
    setAuthenticating(true);
    validateToken()
      .then((response: Http.ITokenValidationResponse) => {
        dispatch(updateLoggedInUserAction(response.user));
      })
      .catch((e: Error) => {
        if (e instanceof AuthenticationError) {
          setRedirect(true);
        } else {
          if (e instanceof NetworkError || e instanceof ClientError || e instanceof ServerError) {
            /* eslint-disable no-console */
            console.error(e);
          } else {
            throw e;
          }
        }
      })
      .finally(() => {
        setAuthenticating(false);
      });
  }, []);

  if (redirect === true) {
    return <Redirect to={"/login"} />;
  } else if (authenticating) {
    return <ApplicationSpinner />;
  } else {
    return <Route {...props} />;
  }
};

export default PrivateRoute;
