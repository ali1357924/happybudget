import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { isNil } from "lodash";

import { Typography, Form } from "antd";

import { ClientError, NetworkError, renderFieldErrorsInForm } from "api";
import { LogoWhite } from "components/display/svgs";
import { login } from "services";

import LoginForm, { ILoginFormValues } from "./LoginForm";

import "./index.scss";

const Login = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const history = useHistory();

  return (
    <div className={"login-page"}>
      <div className={"login-page-left"}>
        <div className={"form-container"}>
          <Typography.Title className={"title"}>{"Sign In"}</Typography.Title>
          <Typography.Title className={"subTitle"}>{"Cloud based budgeting at your fingertips."}</Typography.Title>
          {!isNil(globalError) && <div className={"global-error"}>{globalError}</div>}
          <LoginForm
            className={"mb--20 mt--20"}
            form={form}
            loading={loading}
            onSubmit={(values: ILoginFormValues) => {
              if (!isNil(values.email) && !isNil(values.password)) {
                login(values.email.toLowerCase(), values.password)
                  .then(() => {
                    history.push("/");
                  })
                  .catch((e: Error) => {
                    if (e instanceof ClientError) {
                      if (!isNil(e.errors.__all__)) {
                        setGlobalError(e.errors.__all__[0].message);
                      } else {
                        // Render the errors for each field next to the form field.
                        renderFieldErrorsInForm(form, e);
                      }
                    } else if (e instanceof NetworkError) {
                      setGlobalError("There was a problem communicating with the server.");
                    } else {
                      throw e;
                    }
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }
            }}
          />
        </div>
      </div>
      <div className={"login-page-right"}>
        <div className={"logo-container"}>
          <LogoWhite />
        </div>
      </div>
    </div>
  );
};

export default Login;
