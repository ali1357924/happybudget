interface ILazyBreadCrumbItem {
  readonly requiredParams: string[];
  readonly func: (params: any) => IBreadCrumbItem | IBreadCrumbItem[];
}

interface IBreadCrumbItem extends Omit<MenuItemModel, "render"> {
  readonly tooltip?: Tooltip;
  readonly options?: MenuItemModel[];
  readonly primary?: boolean;
  readonly render?: () => React.ReactChild;
}

interface ISidebarItem {
  readonly icon?: IconOrElement | null | undefined;
  readonly activeIcon?: IconOrElement | null | undefined;
  readonly label?: string;
  readonly to?: string;
  readonly collapsed?: boolean;
  readonly active?: boolean;
  readonly hidden?: boolean;
  readonly separatorAfter?: boolean;
  readonly activePathRegexes?: RegExp[];
  readonly tooltip?: Tooltip;
  readonly onClick?: () => void;
  readonly onActivated?: () => void;
}

type LayoutClassNameParams = {
  "expanded-layout": boolean | undefined,
  "collapsed-layout": boolean | undefined,
  "sidebar-visible": boolean | undefined,
  "sidebar-hidden": boolean | undefined
}