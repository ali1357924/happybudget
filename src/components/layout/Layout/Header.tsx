import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";

import { Layout } from "antd";

import { Icon, ShowHide } from "components";
import { IconButton } from "components/buttons";
import { HelpDropdownMenu, UserDropdownMenu } from "components/dropdowns";
import { IsAuthenticated } from "components/permissions";
import { SidebarLogo } from "components/svgs";

export type HeaderProps = StandardComponentProps & {
  readonly showHeaderSidebarToggle?: boolean | undefined;
  readonly showHeaderLogo?: boolean | undefined;
  readonly sidebarVisible: boolean;
  readonly toggleSidebar: () => void;
};

const Header = ({
  sidebarVisible,
  toggleSidebar,
  showHeaderLogo,
  showHeaderSidebarToggle,
  ...props
}: HeaderProps): JSX.Element => (
  <Layout.Header
    {...props}
    className={classNames("header", props.className, {
      "with-logo": showHeaderLogo
    })}
  >
    <div className={"primary-header"}>
      <div className={"primary-header-left"}>
        <ShowHide show={showHeaderSidebarToggle}>
          <IconButton
            className={"btn--sidebar-toggle"}
            iconSize={"standard"}
            size={"large"}
            icon={(params: ClickableIconCallbackParams) => {
              if (sidebarVisible === true && params.isHovered === true) {
                return <Icon icon={"arrow-alt-to-left"} weight={"light"} green={true} />;
              } else if (params.isHovered === true) {
                return <Icon icon={"arrow-alt-to-right"} weight={"light"} green={true} />;
              } else {
                return <Icon icon={"bars"} weight={"light"} />;
              }
            }}
            onClick={() => toggleSidebar()}
          />
        </ShowHide>
        <div id={"breadcrumbs"}></div>
      </div>

      <div className={"primary-header-center"}>
        <Link className={"logo-link"} to={"/"}>
          <SidebarLogo />
        </Link>
      </div>

      <IsAuthenticated>
        <div className={"primary-header-right"}>
          <div id={"saving-changes"}></div>
          <HelpDropdownMenu />
          <UserDropdownMenu />
        </div>
      </IsAuthenticated>
    </div>
    <div id={"supplementary-header"}></div>
  </Layout.Header>
);

export default React.memo(Header);
