import { SyntheticEvent } from "react";
import { isNil, filter } from "lodash";
import { CheckboxChangeEvent } from "antd/lib/checkbox";

import { EntityText } from "components/typography";

import ExpandedModelMenu from "./ExpandedModelMenu";
import { SubAccountTreeMenuProps } from "./model";

import "./SubAccountTreeMenu.scss";

const SubAccountTreeMenu = ({ nodes, childrenDefaultVisible = true, ...props }: SubAccountTreeMenuProps) => {
  return (
    <ExpandedModelMenu<Model.SubAccountTreeNode>
      {...props}
      onChange={(model: Model.SubAccountTreeNode, e: SyntheticEvent | KeyboardEvent | CheckboxChangeEvent) => {
        const { children, in_search_path, ...rest } = model;
        props.onChange(rest, e);
      }}
      getFirstSearchResult={(ms: Model.SubAccountTreeNode[]) => {
        const inSearchPath = filter(ms, (m: Model.SubAccountTreeNode) => m.in_search_path === true);
        if (!isNil(inSearchPath[0])) {
          return inSearchPath[0];
        }
        return null;
      }}
      models={nodes}
      selected={!isNil(props.selected) ? [`${props.selected.type}-${props.selected.id}`] : null}
      menuProps={{ className: "subaccount-item-tree-menu" }}
      itemProps={{ className: "subaccount-item-tree-menu-item" }}
      levelIndent={10}
      searchIndices={["description", "identifier"]}
      clientSearching={false}
      renderItem={(model: Model.SimpleSubAccount, context: { level: number; index: number }) => {
        return <EntityText fillEmpty={"---------"}>{model}</EntityText>;
      }}
    />
  );
};

export default SubAccountTreeMenu;