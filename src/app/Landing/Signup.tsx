import { useState } from "react";
import { useHistory } from "react-router-dom";

import * as api from "api";
import { ui } from "lib";

import SignupForm, { ISignupFormValues } from "components/forms/SignupForm";

import LandingFormContainer from "./LandingFormContainer";

const Signup = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const form = ui.hooks.useForm<ISignupFormValues>();
  const history = useHistory();

  return (
    <LandingFormContainer title={"Register"} subTitle={"Cloud based budgeting at your fingertips."}>
      <SignupForm
        form={form}
        loading={loading}
        onGoogleSuccess={(token: string) => {
          setLoading(true);
          api
            .socialLogin({ token_id: token, provider: "google" })
            .then((user: Model.User) => {
              // It might not be the the case that the User has not already logged in
              // if doing Social Registration, because the User might already exist
              // for that Social Account.
              if (user.is_first_time === true) {
                history.push("/discover");
              } else {
                history.push("/");
              }
            })
            .catch((e: Error) => {
              form.handleRequestError(e);
            })
            .finally(() => {
              setLoading(false);
            });
        }}
        onGoogleError={(error: any) => {
          // TODO: Try to do a better job parsing the error.
          /* eslint-disable no-console */
          console.error(error);
          form.notify("There was an error authenticating with Google.");
        }}
        onSubmit={(values: ISignupFormValues) => {
          api
            .register(values)
            .then((user: Model.User) => {
              if (user.is_first_time === true) {
                history.push("/discover");
              } else {
                history.push("/");
              }
            })
            .catch((e: Error) => {
              form.handleRequestError(e);
            })
            .finally(() => {
              setLoading(false);
            });
        }}
      />
    </LandingFormContainer>
  );
};

export default Signup;
