import React from "react";
import { Tag } from "components/tagging";

import TableModelMenu from "./TableModelMenu";

export type ModelTagsMenuProps<M extends MenuItemModel> = IMenu<M> & { readonly menu?: NonNullRef<IMenuRef<M>> } & {
  readonly tagProps?: Omit<TagProps<M>, "children" | "model" | "text">;
  /* <Tag> components should be generated based on a provided Array of objects
	   (ITag), each of which contains the properties necessary to create a <Tag>
		 component. */
  readonly tags?: ITag[];
  /* If the list of Models (M) or list of ITag objects or Array of Children
		 <Tag> components is empty, this will either render the component provided
		 by onMissingList or create an <EmptyTag> component with props populated
		 from this attribute. */
  readonly onMissing?: JSX.Element | EmptyTagProps;
};

const ModelTagsMenu = <M extends Model.Model>(props: Omit<ModelTagsMenuProps<M>, "renderItemContent">): JSX.Element => {
  return <TableModelMenu<M> {...props} renderItemContent={(model: M) => <Tag model={model} {...props.tagProps} />} />;
};

export default React.memo(ModelTagsMenu) as typeof ModelTagsMenu;
