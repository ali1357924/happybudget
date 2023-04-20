import { GroupForm } from "deprecated/components/forms";

import { CreateModelModal, CreateModelModalProps, CreateModelCallbacks } from "./generic";

interface CreateGroupModalProps<R extends Table.RowData, M extends model.RowTypedApiModel>
  extends CreateModelModalProps<Model.Group> {
  readonly parentId: number;
  readonly children: number[];
  readonly table: Table.TableInstance<R, M>;
  readonly parentType: Model.ParentType;
}

const CreateGroupModal = <
  R extends Table.RowData,
  M extends model.RowTypedApiModel,
  MM extends Model.SimpleAccount | Model.SimpleSubAccount,
>({
  parentId,
  children,
  parentType,
  table,
  ...props
}: CreateGroupModalProps<R, M>): JSX.Element => (
  <CreateModelModal<Model.Group>
    {...props}
    title="Subtotal"
    titleIcon="folder"
    createSync={(payload: Http.GroupPayload, callbacks: CreateModelCallbacks<Model.Group>) =>
      table.dispatchEvent({ type: "groupAdd", payload, ...callbacks })
    }
  >
    {(form: FormInstance<Http.GroupPayload>) => (
      <GroupForm<MM>
        form={form}
        parentType={parentType}
        parentId={parentId}
        initialValues={{ children }}
      />
    )}
  </CreateModelModal>
);

export default CreateGroupModal;
