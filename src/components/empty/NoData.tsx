import React from "react";
import { isNil } from "lodash";
import classNames from "classnames";

import { Button } from "components/buttons";

import "./NoData.scss";

interface NoDataProps extends StandardComponentWithChildrenProps {
  readonly title?: string;
  readonly subTitle?: string;
  readonly button?: { readonly onClick?: () => void; readonly text: string };
  readonly icon?: IconOrElement;
}

const NoData = ({ title, subTitle, button, icon, children, ...props }: NoDataProps): JSX.Element => {
  return (
    <div {...props} className={classNames("no-data", props.className)}>
      <div className={"no-data-content"}>
        {children}
        {!isNil(title) && <h1>{title}</h1>}
        {!isNil(subTitle) && <p>{subTitle}</p>}
        {!isNil(button) && (
          <Button
            style={{ marginTop: 20 }}
            className={"btn btn--primary"}
            icon={icon}
            onClick={() => button.onClick?.()}
          >
            {button.text}
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(NoData);