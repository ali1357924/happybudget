import { isNil } from "lodash";
import classNames from "classnames";

import { Input, Button } from "antd";

import { Form } from "components";
import { FormProps } from "components/Form";
import UploadUserImage from "./UploadUserImage";

interface UserProfileFormProps extends FormProps<Http.UserPayload> {
  imageUrl?: string | null;
  onImageChange?: (f: File | Blob) => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ imageUrl, onImageChange, ...props }): JSX.Element => {
  return (
    <Form.Form {...props} className={classNames("user-profile-form", props.className)}>
      <Form.Item
        name={"first_name"}
        label={"First Name"}
        rules={[{ required: true, message: "Please provide your first name." }]}
      >
        <Input placeholder={"First Name"} />
      </Form.Item>
      <Form.Item
        name={"last_name"}
        label={"Last Name"}
        rules={[{ required: true, message: "Please provide your last name." }]}
      >
        <Input placeholder={"Last Name"} />
      </Form.Item>
      <Form.Item label={"Avatar"}>
        <UploadUserImage
          initialValue={imageUrl}
          onChange={(f: File | Blob) => {
            if (!isNil(onImageChange)) {
              onImageChange(f);
            }
          }}
          onError={(error: string) => props.form.setGlobalError(error)}
        />
      </Form.Item>
      <Form.Item>
        <Button className={"btn--primary"} htmlType={"submit"} style={{ width: "100%" }}>
          {"Save"}
        </Button>
      </Form.Item>
    </Form.Form>
  );
};

export default UserProfileForm;
