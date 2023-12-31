import React, { useState } from "react";
import { isNil } from "lodash";
import { formatters } from "lib";
import Input, { InputProps } from "./Input";

interface PhoneNumberInputProps extends Omit<InputProps, "onChange"> {
  readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly value?: number | string;
}

const PhoneNumberInput = ({ onChange, ...props }: PhoneNumberInputProps): JSX.Element => {
  const [_value, setValue] = useState<string>("");

  return (
    <Input
      {...props}
      value={
        !isNil(props.value) ? formatters.phoneNumberFormatter(props.value) : formatters.phoneNumberFormatter(_value)
      }
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value;
        if (e.target.value.length === 4 && e.target.value.startsWith("(")) {
          /* If we don't do this, we can get stuck in a state where the value
             is something like (555), because it doesn't detect the deletion
             of the second paranthesis. */
          v = v.slice(1, 3);
        }
        v = v.replace(/\D/g, "");
        setValue(v);
        e.target.value = v;
        onChange?.(e);
      }}
    />
  );
};

export default React.memo(PhoneNumberInput);
