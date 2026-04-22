/// <reference types="@shopify/app-bridge-types" />

import type {
  SAppNavAttributes,
  SAppWindowAttributes,
  UIModalAttributes,
  UINavMenuAttributes,
  UISaveBarAttributes,
  UITitleBarAttributes,
} from "@shopify/app-bridge-types";

type WithReactProps<T> = T & {
  children?: React.ReactNode;
  key?: React.Key;
  ref?: React.Ref<HTMLElement>;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-window": WithReactProps<SAppWindowAttributes>;
      "s-app-nav": WithReactProps<SAppNavAttributes>;
      "ui-modal": WithReactProps<UIModalAttributes>;
      "ui-nav-menu": WithReactProps<UINavMenuAttributes>;
      "ui-save-bar": WithReactProps<UISaveBarAttributes>;
      "ui-title-bar": WithReactProps<UITitleBarAttributes>;
    }
  }
}

export {};
