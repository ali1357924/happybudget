import React from "react";
import { Icon } from "components";
import IconButton, { IconButtonProps } from "./IconButton";

const ClearButton = (props: Omit<IconButtonProps, "icon">): JSX.Element => {
  return <IconButton {...props} className={"btn--clear"} icon={<Icon icon={"times-circle"} weight={"solid"} />} />;
};

export default React.memo(ClearButton);
