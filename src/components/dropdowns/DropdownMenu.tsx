import React, { useEffect, useMemo, useState } from "react";
import { uniqueId } from "lodash";

import { Menu } from "components/menus";
import { ui } from "lib";

import Dropdown, { DropdownProps } from "./Dropdown";

export type DropdownMenuProps<
  S extends object = MenuItemSelectedState,
  M extends MenuItemModel<S> = MenuItemModel<S>
> = Omit<IMenu<S, M>, "className" | "style"> &
  Pick<StandardComponentProps, "className"> &
  Pick<DropdownProps, "children" | "dropdown" | "placement"> & {
    readonly menuClassName?: string;
    readonly menuStyle?: React.CSSProperties;
  };

const DropdownMenu = <S extends object = MenuItemSelectedState, M extends MenuItemModel<S> = MenuItemModel<S>>({
  menuClassName,
  menuStyle,
  className,
  placement,
  dropdown,
  ...props
}: DropdownMenuProps<S, M>): JSX.Element => {
  const [visible, setVisible] = useState(false);
  const menuId = useMemo(() => uniqueId("dropdown-menu-"), []);
  const menu = ui.hooks.useMenuIfNotDefined<S, M>(props.menu);
  const dropdownRef = ui.hooks.useDropdownIfNotDefined(dropdown);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.stopPropagation();
        setVisible(false);
      }
    };
    menu.current.focus(visible);
    if (visible === true) {
      window.addEventListener("keydown", keyListener);
    } else {
      window.removeEventListener("keydown", keyListener);
    }
    return () => window.removeEventListener("keydown", keyListener);
  }, [visible]);

  return (
    <Dropdown
      dropdown={dropdownRef}
      className={className}
      overlayId={menuId}
      placement={placement}
      overlay={
        <Menu<S, M>
          {...props}
          menu={menu}
          id={menuId}
          className={menuClassName}
          style={menuStyle}
          closeParentDropdown={() => dropdownRef.current.setVisible(false)}
        />
      }
    >
      {props.children}
    </Dropdown>
  );
};

export default React.memo(DropdownMenu) as typeof DropdownMenu;
