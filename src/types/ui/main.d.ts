/// <reference path="./menus.d.ts" />
/// <reference path="./layout.d.ts" />
/// <reference path="./tagging.d.ts" />
/// <reference path="./style.d.ts" />
/// <reference path="./forms.d.ts" />
/// <reference path="./pdf.d.ts" />
/// <reference path="./richtext.d.ts" />
/// <reference path="./feedback.d.ts" />

type Order = 1 | -1 | 0;
type DefinitiveOrder = 1 | -1;
type Ordering<T = string> = { [key: T]: Order };

type SearchIndex = string | string[];
type SearchIndicies = SearchIndex[];

type StandardComponentPropNames = "id" | "className" | "style";

interface StandardComponentProps {
  readonly id?: any;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

interface StandardComponentWithChildrenProps extends StandardComponentProps {
  readonly children: import("react").ReactNode;
}

interface StandardPdfComponentProps {
  readonly className?: string;
  readonly style?: import("@react-pdf/renderer").Styles;
  readonly debug?: boolean;
  readonly children?: ReactNode;
  readonly debug?: boolean;
  readonly fixed?: boolean;
  readonly wrap?: boolean;
}

type IconProp = import("@fortawesome/fontawesome-svg-core").IconName | [import("@fortawesome/fontawesome-svg-core").IconPrefix, import("@fortawesome/fontawesome-svg-core").IconName];
type IconWeight = "light" | "regular" | "solid";
type IconOrElement = IconProp | JSX.Element;

interface IIcon extends Omit<import("@fortawesome/react-fontawesome").FontAwesomeIconProps, "icon"> {
  readonly icon?: IconProp | undefined | null;
  readonly prefix?: import("@fortawesome/fontawesome-svg-core").IconPrefix;
  readonly green?: boolean;
  readonly weight?: IconWeight;
  readonly light?: boolean;
  readonly regular?: boolean;
  readonly solid?: boolean;
}

type PropsOf<T> = T extends React.ComponentType<infer Props> ? Props : never;

type RenderFunc = () => JSX.Element;

type Tooltip = Omit<Partial<import("antd/lib/tooltip").TooltipPropsWithTitle>, "title"> & { readonly title: string } | string;

type ClickableIconCallbackParams = {
  readonly isHovered: boolean;
}
type ClickableIconCallback = (params: ClickableIconCallbackParams) => IconOrElement
type ClickableIconOrElement = IconOrElement | ClickableIconCallback;

interface ClickableProps extends StandardComponentProps {
  readonly disabled?: boolean;
  readonly tooltip?: Tooltip;
  readonly icon?: ClickableIconOrElement;
}

type HeaderTemplateFormData = {
  readonly header: string | null;
  readonly left_image: UploadedImage | SavedImage | null;
  readonly left_info: string | null;
  readonly right_image: UploadedImage | SavedImage | null;
  readonly right_info: string | null;
};

interface ExportFormOptions {
  readonly header: HeaderTemplateFormData;
  readonly columns: string[];
  readonly tables?: TableOption[] | null | undefined;
  readonly excludeZeroTotals: boolean;
  readonly notes?: string | null;
  readonly includeNotes: boolean;
}

type PasswordValidationID = "lowercase" | "uppercase" | "number" | "character" | "minChar";
type PasswordValidationName = { id: ValidationId; name: string };
/* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
type PasswordValidationState = { [key in ValidationId]: boolean };

type Pagination = {
  readonly page: number;
  readonly pageSize?: number;
}
