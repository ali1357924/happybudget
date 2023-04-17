import classNames from "classnames";

import { ui } from "lib";

import { BareActionButton, BareActionButtonProps } from "./BareActionButton";

export const ClearButton = (props: Omit<BareActionButtonProps, "icon">): JSX.Element => (
  <BareActionButton
    {...props}
    className={classNames("button--clear", props.className)}
    icon={ui.IconNames.TIMES_CIRCLE}
  />
);
