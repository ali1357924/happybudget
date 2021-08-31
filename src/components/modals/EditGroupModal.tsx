import * as api from "api";

import { Form } from "components";
import { GroupForm } from "components/forms";

import Modal from "./Modal";

interface EditGroupModalProps {
  onSuccess: (group: Model.BudgetGroup) => void;
  onCancel: () => void;
  group: Model.BudgetGroup;
  open: boolean;
}

const EditGroupModal = ({ group, open, onSuccess, onCancel }: EditGroupModalProps): JSX.Element => {
  const [form] = Form.useForm<Http.GroupPayload>({ isInModal: true });

  return (
    <Modal.Modal
      title={"Edit Sub-Total"}
      visible={open}
      onCancel={() => onCancel()}
      okText={"Save"}
      cancelText={"Cancel"}
      getContainer={false}
      okButtonProps={{ disabled: form.loading }}
      onOk={() => {
        form
          .validateFields()
          .then((values: Http.GroupPayload) => {
            form.setLoading(true);
            api
              .updateGroup(group.id, values)
              .then((response: Model.BudgetGroup) => {
                form.resetFields();
                onSuccess(response);
              })
              .catch((e: Error) => {
                form.handleRequestError(e);
              })
              .finally(() => {
                form.setLoading(false);
              });
          })
          .catch(() => {
            return;
          });
      }}
    >
      <GroupForm form={form} initialValues={{ name: group.name, color: group.color }} />
    </Modal.Modal>
  );
};

export default EditGroupModal;
