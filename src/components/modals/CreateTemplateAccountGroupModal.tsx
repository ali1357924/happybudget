import * as api from "api";

import { Form } from "components";
import { GroupForm } from "components/forms";

import { Modal } from "./generic";

interface CreateTemplateAccountGroupModalProps {
  onSuccess: (group: Model.Group) => void;
  onCancel: () => void;
  templateId: number;
  accounts: number[];
  open: boolean;
}

const CreateTemplateAccountGroupModal = ({
  templateId,
  accounts,
  open,
  onSuccess,
  onCancel
}: CreateTemplateAccountGroupModalProps): JSX.Element => {
  const [form] = Form.useForm<Http.GroupPayload>({ isInModal: true });
  const cancelToken = api.useCancelToken();

  return (
    <Modal
      title={"Create Sub-Total"}
      visible={open}
      onCancel={() => onCancel()}
      okText={"Create"}
      cancelText={"Cancel"}
      getContainer={false}
      okButtonProps={{ disabled: form.loading }}
      onOk={() => {
        form
          .validateFields()
          .then((values: Http.GroupPayload) => {
            form.setLoading(true);
            api
              .createTemplateAccountGroup(
                templateId,
                {
                  name: values.name,
                  children: accounts,
                  color: values.color
                },
                { cancelToken: cancelToken() }
              )
              .then((group: Model.Group) => {
                form.resetFields();
                onSuccess(group);
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
      <GroupForm form={form} initialValues={{}} />
    </Modal>
  );
};

export default CreateTemplateAccountGroupModal;
