import { forwardRef } from "react";

import { useContacts } from "store/hooks";
import { Icon } from "components";
import { framework } from "components/tabling/generic";

import { ModelTagEditor } from "./generic";

interface ContactEditorProps extends Table.EditorParams<Tables.SubAccountRow, Model.SubAccount> {
  readonly onNewContact: (params: {
    name?: string;
    change: Omit<Table.CellChange<Tables.SubAccountRow, Model.SubAccount>, "newValue">;
  }) => void;
}

const ContactEditor = (props: ContactEditorProps, ref: any) => {
  const contacts = useContacts();
  const [editor] = framework.editors.useModelMenuEditor<Tables.SubAccountRow, Model.SubAccount, Model.Contact, number>({
    ...props,
    forwardedRef: ref
  });

  return (
    <ModelTagEditor<Model.Contact, number>
      editor={editor}
      style={{ width: 160 }}
      selected={editor.value}
      models={contacts}
      onChange={(e: MenuChangeEvent<Model.Contact>) => editor.onChange(e.model.id, e.event)}
      searchIndices={["first_name", "last_name"]}
      tagProps={{ color: "#EFEFEF", textColor: "#2182e4", modelTextField: "full_name", className: "tag--contact" }}
      extra={[
        {
          id: "add-contact",
          onClick: () => {
            const row: Tables.SubAccountRow = props.node.data;
            const searchValue = editor.getSearchValue();
            if (searchValue !== "") {
              props.onNewContact({
                name: searchValue,
                change: {
                  oldValue: row.contact || null,
                  field: props.column.field,
                  row,
                  column: props.column,
                  id: row.id
                }
              });
            } else {
              props.onNewContact({
                change: {
                  oldValue: row.contact || null,
                  field: props.column.field,
                  row,
                  column: props.column,
                  id: row.id
                }
              });
            }
          },
          label: "Add Contact",
          icon: <Icon icon={"plus-circle"} weight={"solid"} green={true} />,
          showOnNoSearchResults: true,
          showOnNoData: true,
          focusOnNoSearchResults: true,
          focusOnNoData: true,
          leaveAtBottom: true
        }
      ]}
    />
  );
};

export default forwardRef(ContactEditor);
