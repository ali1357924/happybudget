import React, { ReactNode } from "react";
import { ShowHide } from "components/display";
import Spinner, { SpinnerProps } from "./Spinner";

interface RenderWithSpinnerProps extends SpinnerProps {
  loading?: boolean;
  toggleOpacity?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const RenderWithSpinner = ({
  loading,
  className,
  style = {},
  toggleOpacity = false,
  children,
  ...props
}: RenderWithSpinnerProps): JSX.Element => {
  return (
    <React.Fragment>
      <ShowHide show={toggleOpacity === true}>
        <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
          {loading === true && <Spinner position={"absolute"} {...props} />}
          <div style={{ opacity: loading ? 0.3 : 1, ...style }}>{children}</div>
        </div>
      </ShowHide>
      <ShowHide show={toggleOpacity === false}>
        <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
          {loading === true && <Spinner {...props} />}
          <div style={style}>{children}</div>
        </div>
      </ShowHide>
    </React.Fragment>
  );
};

export default RenderWithSpinner;
