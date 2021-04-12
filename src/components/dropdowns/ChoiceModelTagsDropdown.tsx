import { DropDownProps } from "antd/lib/dropdown";

import ModelTagsDropdown from "./ModelTagsDropdown";

interface ChoiceModelTagsDropdownProps<
  M extends ChoiceModel<I, N>,
  I extends number = number,
  N extends string = string
> extends Omit<DropDownProps, "trigger" | "className" | "overlay"> {
  value: I | null;
  className?: string;
  trigger?: ("click" | "hover" | "contextMenu")[];
  onChange: (value: I) => void;
  models: M[];
}

const ChoiceModelTagsDropdown = <M extends ChoiceModel<I, N>, I extends number = number, N extends string = string>({
  /* eslint-disable indent */
  value,
  models,
  className,
  onChange,
  trigger = ["click"],
  ...props
}: ChoiceModelTagsDropdownProps<M, I, N>): JSX.Element => {
  return (
    <ModelTagsDropdown<M, number>
      value={value}
      onChange={(v: M) => onChange(v.id)}
      className={className}
      labelField={"name"}
      trigger={trigger}
      models={models}
      multiple={false}
      {...props}
    />
  );
};

export default ChoiceModelTagsDropdown;