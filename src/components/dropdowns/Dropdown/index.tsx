import React, { useMemo } from "react";
import classNames from "classnames";
import ClickAwayListener from "react-click-away-listener";
import { uniqueId, isNil } from "lodash";

import { Dropdown as AntdDropdown } from "antd";
import { DropDownProps as AntdDropdownProps } from "antd/lib/dropdown";

import { Menu } from "components";
import { util } from "lib";

interface BaseDropdownProps extends Omit<AntdDropdownProps, "overlay"> {
  readonly onClickAway?: () => void;
  readonly children: React.ReactChild | React.ReactChild[];
}

interface DropdownOverlayProps extends BaseDropdownProps {
  readonly overlay: React.ReactElement | (() => React.ReactElement);
}

interface DropdownMenuItemsProps extends BaseDropdownProps {
  readonly menuProps?: StandardComponentProps;
  readonly menuItems: IMenuItem[];
  readonly menuMode?: "single" | "multiple";
  readonly menuButtons?: IMenuButton[];
  readonly menuCheckbox?: boolean;
  readonly menuDefaultSelected?: MenuItemId[];
  readonly menuSelected?: MenuItemId[];
  readonly onChange?: (params: IMenuChangeParams) => void;
}

export type DropdownProps = DropdownOverlayProps | DropdownMenuItemsProps;

export const isPropsWithOverlay = (props: DropdownProps): props is DropdownOverlayProps =>
  (props as DropdownOverlayProps).overlay !== undefined;

const Dropdown = ({ ...props }: DropdownProps): JSX.Element => {
  const buttonId = useMemo(() => uniqueId(), []);

  return (
    <AntdDropdown
      {...props}
      className={classNames("dropdown", props.className)}
      trigger={props.trigger || ["click"]}
      overlay={
        <ClickAwayListener
          onClickAway={(e: any) => {
            // react-click-away-listener does a pretty shitty job of weeding out
            // click events inside the element that it's ClickAwayListener
            // component wraps.
            // Note that this logic falls apart if a custom overlay is being
            // used.
            if (!isNil(props.onClickAway)) {
              const menus = document.getElementsByClassName("dropdown-menu");
              let clickInsideMenu = false;
              for (let i = 0; i < menus.length; i++) {
                if (util.html.isNodeDescendantOf(menus[i], e.target)) {
                  clickInsideMenu = true;
                  break;
                }
              }
              // Since the dropdown button (props.children) is rendered outside
              // of the menu (where the ClickAway is detected), clicking the
              // button will also trigger the ClickAway, so we need to avoid it.
              const button = document.getElementById(buttonId);
              if (!isNil(button) && !util.html.isNodeDescendantOf(button, e.target) && clickInsideMenu === false) {
                props.onClickAway();
              }
            }
          }}
        >
          <React.Fragment>
            {isPropsWithOverlay(props) ? (
              props.overlay
            ) : (
              <Menu.Expanded
                {...props.menuProps}
                onChange={props.onChange}
                items={props.menuItems}
                mode={props.menuMode}
                checkbox={props.menuCheckbox}
                buttons={props.menuButtons}
                defaultSelected={props.menuDefaultSelected}
                selected={props.menuSelected}
              />
            )}
          </React.Fragment>
        </ClickAwayListener>
      }
    >
      {React.Children.only(props.children) && React.isValidElement(props.children)
        ? React.cloneElement(props.children, { id: buttonId })
        : props.children}
    </AntdDropdown>
  );
};

export default Dropdown;
