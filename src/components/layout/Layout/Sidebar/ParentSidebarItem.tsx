import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { map, find, isNil } from "lodash";

import { ui } from "lib";
import { ShowHide } from "components";

import GenericSidebarItem from "./GenericSidebarItem";
import ExpandedSidebarItem from "./ExpandedSidebarItem";

const ParentSidebarItem = (props: IExpandedParentSidebarItem): JSX.Element => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const history = useHistory();

  const { submenu, ...item } = props;
  return (
    <React.Fragment>
      <ExpandedSidebarItem
        {...item}
        style={{ marginBottom: 10 }}
        onClick={() => {
          /* The parent will be active if any of it's children items are active,
						 and if this is the case then we do not want to perform any action
						 when the parent is clicked (because it is already open - at least
						 it should be).

						 If the parent is not active however, we want to perform an action
						 based on whether or not the submenu is already open.  If the
						 submenu is already open, we simply want to close it.  If the
						 submenu is not open however, we not only want to open it but we
						 want to "click" the default item.
					*/
          if (!ui.util.itemIsActive(props, location)) {
            if (!open) {
              setOpen(true);
              let defaultItem = find(submenu, (i: IExpandedSingleSidebarItem) => i.default === true);
              if (defaultItem === undefined) {
                defaultItem = submenu[0];
              }
              if (defaultItem !== undefined) {
                defaultItem.closeSidebarOnClick?.();
                if (!isNil(defaultItem.to)) {
                  history.push(defaultItem.to);
                } else if (!isNil(defaultItem.onClick)) {
                  defaultItem.onClick();
                }
              }
            } else {
              setOpen(false);
            }
          } else if (!open) {
            /* This should not happen, but just in case it does we do not want
						   the user to get stuck in a state where they cannot get the submenu
						   back open. */
            console.warn(
              `Inconsistent State: Parent sidebar item ${props.label} is active
							but not open.`
            );
            setOpen(true);
          }
        }}
      />
      <ShowHide show={open}>
        <div className={"sidebar-sub-menu"}>
          {map(submenu, (subItem: IExpandedSingleSidebarItem, i: number) => {
            return (
              <GenericSidebarItem<IExpandedSingleSidebarItem> key={i} {...subItem}>
                <span className={"text-container"}>{subItem.label}</span>
              </GenericSidebarItem>
            );
          })}
        </div>
      </ShowHide>
    </React.Fragment>
  );
};

export default React.memo(ParentSidebarItem);