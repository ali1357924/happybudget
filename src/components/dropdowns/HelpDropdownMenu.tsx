import React from "react";
import { isNil } from "lodash";

import * as config from "config";

import { Icon } from "components";
import { HelpLink } from "components/links";

import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";

const HelpDropdownMenu = (
  props: Omit<DropdownMenuProps, "models" | "menuClassName" | "menuId" | "children">
): JSX.Element => (
  <DropdownMenu
    {...props}
    menuClassName={"header-dropdown-menu"}
    menuId={"support-menu"}
    models={[
      {
        id: "feedback",
        label: "Feedback/Feature Request",
        onClick: () => {
          if (!isNil(config.env.CANNY_FEEDBACK_URL)) {
            window.open(config.env.CANNY_FEEDBACK_URL, "_blank");
          } else {
            console.warn(
              `Could not identify Canny feedback URL as ENV variable
											'CANNY_FEEDBACK_URL; is not defined.`
            );
          }
        },
        icon: <Icon icon={"bullhorn"} weight={"light"} />
      },
      {
        id: "intercom-chat",
        label: "Chat with Support",
        icon: <Icon icon={"comment-dots"} weight={"light"} />
      },
      {
        id: "faq",
        label: "Support Articles",
        onClick: () => {
          if (!isNil(config.env.INTERCOM_SUPPORT_URL)) {
            window.open(config.env.INTERCOM_SUPPORT_URL, "_blank");
          } else {
            console.warn(
              `Could not identify Intercom support URL as ENV variable
											'INTERCOM_SUPPORT_URL; is not defined.`
            );
          }
        },
        icon: <Icon icon={"question-circle"} weight={"light"} />
      }
    ]}
  >
    <HelpLink />
  </DropdownMenu>
);

export default React.memo(HelpDropdownMenu);
