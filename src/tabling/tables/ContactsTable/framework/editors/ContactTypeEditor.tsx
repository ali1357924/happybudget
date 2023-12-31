import { forwardRef, ForwardedRef } from "react";
import { model } from "lib";
import { framework } from "tabling/generic";
import { ChoiceSelectEditor } from "tabling/generic/framework/editors";

const ContactTypeEditor = (
  props: Omit<
    framework.editors.ChoiceSelectEditorProps<
      Model.ContactType,
      Tables.ContactRowData,
      Model.Contact,
      Table.Context,
      Tables.ContactTableStore
    >,
    "models" | "searchIndices"
  >,
  ref: ForwardedRef<Table.AgEditorRef<Model.ContactType>>
) => {
  return (
    <ChoiceSelectEditor<
      Model.ContactType,
      Tables.ContactRowData,
      Model.Contact,
      Table.Context,
      Tables.ContactTableStore
    >
      searchIndices={["name"]}
      models={model.contact.ContactTypes.choices}
      ref={ref}
      {...props}
    />
  );
};

export default forwardRef(ContactTypeEditor);
