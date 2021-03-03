import React from "react";
import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline } from "react-google-login";
import { GoogleLoginButton } from "components/control/buttons";

interface SocialButtonProps {
  provider: "google";
  onGoogleSuccess: (tokenId: string) => void;
  // TODO: Come up with interface for Google structured error.
  onGoogleError: (error: any) => void;
}

const isOfflineResponse = (
  response: GoogleLoginResponse | GoogleLoginResponseOffline
): response is GoogleLoginResponseOffline => {
  return (
    (response as GoogleLoginResponseOffline).code !== undefined &&
    (response as GoogleLoginResponse).tokenId === undefined
  );
};

// TODO: Store in the .env file.
const GOOGLE_CLIENT_ID = "609051398044-dn6cb2km2heebcqsau5ou5bs800s1vtc.apps.googleusercontent.com";

const SocialButton = ({ provider, onGoogleSuccess, onGoogleError }: SocialButtonProps): JSX.Element => {
  if (provider === "google") {
    return (
      <GoogleLogin
        clientId={GOOGLE_CLIENT_ID}
        render={(props: { onClick: () => void; disabled?: boolean }) => (
          <GoogleLoginButton onClick={props.onClick} disabled={props.disabled} />
        )}
        onSuccess={(response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
          // In the case that the response is GoogleLoginResponseOffline, the response
          // will just be { code: xxx } that can be used to obtain a refresh token
          // from the server.  This should be implemented at some point.
          if (isOfflineResponse(response)) {
            /* eslint-disable no-console */
            console.error(`Received offline response with code ${response.code}.`);
          } else {
            onGoogleSuccess(response.tokenId);
          }
        }}
        onFailure={(response: any) => onGoogleError(response)}
        cookiePolicy={"single_host_origin"}
      />
    );
  }
  return <></>;
};

export default SocialButton;
