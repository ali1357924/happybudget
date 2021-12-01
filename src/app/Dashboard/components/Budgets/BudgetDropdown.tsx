import React from "react";
import { useHistory } from "react-router-dom";

import { Dropdown, Icon } from "components";

interface BudgetDropdownProps {
  readonly children: JSX.Element;
  readonly onNewBudget: () => void;
}

const BudgetDropdown: React.FC<BudgetDropdownProps> = ({ children, onNewBudget }): JSX.Element => {
  const history = useHistory();

  return (
    <Dropdown
      menuItems={[
        {
          id: "new-blank-budget",
          label: "New Blank Budget",
          icon: <Icon icon={"pencil"} weight={"light"} />,
          onClick: () => onNewBudget()
        },
        {
          id: "start-from-template",
          label: "Start from Template ",
          icon: <Icon icon={"image"} weight={"light"} />,
          onClick: () => history.push("/templates")
        }
      ]}
      placement={"bottomLeft"}
    >
      {children}
    </Dropdown>
  );
};

export default React.memo(BudgetDropdown);
