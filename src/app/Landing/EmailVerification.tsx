import { useEffect, useState } from "react";
import { Redirect, useLocation } from "react-router-dom";
import { isNil, includes } from "lodash";

import * as api from "api";
import { util, notifications } from "lib";
import { ApplicationSpinner } from "components";

import { UITokenNotificationRedirectData } from "./Notifications";

type IRedirect = {
  readonly pathname: "/login";
  readonly state?: {
    readonly notifications?: UINotificationData[];
    readonly tokenNotification?: UITokenNotificationRedirectData;
  };
};

const EmailVerification = (): JSX.Element => {
  const [redirect, setRedirect] = useState<IRedirect | undefined>(undefined);
  const location = useLocation();
  const handler = notifications.ui.useNotifications({ defaultClosable: true });

  useEffect(() => {
    const searchParams = util.urls.getQueryParams(location.search);
    if (!isNil(searchParams.token)) {
      api
        .validateEmailConfirmationToken(searchParams.token)
        .then(() => {
          setRedirect({
            pathname: "/login",
            state: {
              notifications: [
                {
                  closable: true,
                  level: "success",
                  message: "Your email address was successfully verified."
                }
              ]
            }
          });
        })
        .catch((e: Error) => {
          if (e instanceof api.ClientError || e instanceof api.NetworkError || e instanceof api.ServerError) {
            if (e instanceof api.ClientError && !isNil(e.authenticationError)) {
              if (includes([api.ErrorCodes.TOKEN_EXPIRED, api.ErrorCodes.TOKEN_INVALID], e.authenticationError.code)) {
                setRedirect({
                  pathname: "/login",
                  state: {
                    tokenNotification: {
                      tokenType: "email-confirmation",
                      userId: e.authenticationError.user_id,
                      code: e.authenticationError.code as Http.TokenErrorCode
                    }
                  }
                });
              }
            } else {
              setRedirect({
                pathname: "/login",
                state: {
                  notifications: handler.getRequestErrorNotifications(e)
                }
              });
            }
          } else {
            throw e;
          }
        });
    } else {
      setRedirect({ pathname: "/login" });
    }
  }, [location.search]);

  if (!isNil(redirect)) {
    return <Redirect to={redirect} />;
  }
  return <ApplicationSpinner visible={true} />;
};

export default EmailVerification;
