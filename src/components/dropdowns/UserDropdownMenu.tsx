import React from "react";
import { useHistory } from "react-router-dom";

import * as config from "config";

import { Icon } from "components";
import { AccountCircleLink } from "components/links";
import * as store from "store";

import DropdownMenu, { DropdownMenuProps } from "./DropdownMenu";

const UserDropdownMenu = (props: Omit<DropdownMenuProps, "models" | "menuClassName" | "children">): JSX.Element => {
  const [user, _] = store.hooks.useLoggedInUser();
  const history = useHistory();

  return (
    <DropdownMenu
      {...props}
      menuClassName={"header-dropdown-menu"}
      models={[
        {
          id: "profile",
          label: "Profile",
          onClick: () => history.push("/profile"),
          icon: <Icon icon={"address-card"} weight={"light"} />
        },
        {
          id: "admin",
          label: "Admin",
          onClick: () => {
            window.location.href = `${config.env.API_DOMAIN}/admin`;
          },
          icon: <Icon icon={"lock"} weight={"light"} />,
          visible: user.is_staff === true
        },
        {
          id: "logout",
          label: "Logout",
          onClick: () => history.push("/logout"),
          icon: <Icon icon={"sign-out"} weight={"light"} />
        }
      ]}
    >
      <AccountCircleLink user={user} />
    </DropdownMenu>
  );
};

export default React.memo(UserDropdownMenu);
