import React, { useEffect } from "react";
import { isNil } from "lodash";

import { model } from "lib";

import { Form } from "components";
import { Input } from "components/fields";
import { FormProps } from "components/forms/Form";
import { ColorSelect } from "../fields";

const GroupForm: React.FC<FormProps<Http.GroupPayload>> = ({ ...props }) => {
  const [colors, loading, error] = model.hooks.useGroupColors();

  useEffect(() => {
    props.form.setLoading(loading);
  }, [loading]);

  useEffect(() => {
    if (!isNil(error)) {
      props.form.handleRequestError(error);
    }
  }, [error]);

  return (
    <Form.Form layout={"vertical"} {...props}>
      <Form.Item name={"name"} rules={[{ required: true, message: "Please provide a valid name for the group." }]}>
        <Input placeholder={"Name"} />
      </Form.Item>
      <Form.Item name={"color"} label={"Color"}>
        <ColorSelect colors={colors} />
      </Form.Item>
    </Form.Form>
  );
};

export default GroupForm;
