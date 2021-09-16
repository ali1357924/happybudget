import { isNil } from "lodash";

import * as api from "api";

import { Form } from "components";
import { GroupForm } from "components/forms";

import { Modal } from "./generic";

interface CreateSubAccountGroupModalProps {
  onSuccess: (group: Model.Group) => void;
  onCancel: () => void;
  accountId?: number;
  subaccountId?: number;
  subaccounts: number[];
  open: boolean;
}

const CreateSubAccountGroupModal = ({
  accountId,
  subaccountId,
  open,
  subaccounts,
  onSuccess,
  onCancel
}: CreateSubAccountGroupModalProps): JSX.Element => {
  const [form] = Form.useForm<Http.GroupPayload>({ isInModal: true });
  const cancelToken = api.useCancelToken();

  return (
    <Modal
      title={"Create Sub-Total"}
      visible={open}
      onCancel={() => onCancel()}
      okText={"Create"}
      okButtonProps={{ disabled: form.loading }}
      cancelText={"Cancel"}
      getContainer={false}
      onOk={() => {
        form
          .validateFields()
          .then((values: Http.GroupPayload) => {
            form.setLoading(true);
            if (!isNil(accountId)) {
              api
                .createAccountSubAccountGroup(
                  accountId,
                  {
                    name: values.name,
                    children: subaccounts,
                    color: values.color
                  },
                  { cancelToken: cancelToken() }
                )
                .then((group: Model.Group) => {
                  form.resetFields();
                  onSuccess(group);
                })
                .catch((e: Error) => form.handleRequestError(e))
                .finally(() => form.setLoading(false));
            } else if (!isNil(subaccountId)) {
              api
                .createSubAccountSubAccountGroup(subaccountId, {
                  name: values.name,
                  children: subaccounts,
                  color: values.color
                })
                .then((group: Model.Group) => {
                  form.resetFields();
                  onSuccess(group);
                })
                .catch((e: Error) => form.handleRequestError(e))
                .finally(() => form.setLoading(false));
            }
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

export default CreateSubAccountGroupModal;
