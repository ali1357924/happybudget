import React from "react";
import { Switch } from "react-router-dom";

import { Layout } from "components/layout";
import { LayoutProps } from "components/layout/Layout";

import "./index.scss";

type GenericProps = {
  children: JSX.Element;
} & Pick<LayoutProps, "sidebar" | "toolbar" | "breadcrumbs">;

const Generic: React.FC<GenericProps> = ({ children, ...props }) => {
  return (
    <Layout
      collapsed
      includeFooter={false}
      headerProps={{ style: { height: 70 + 36 } }}
      contentProps={{ style: { marginTop: 70 + 36 + 10, height: "calc(100vh - 116px)" } }}
      {...props}
    >
      <div className={"budget"}>
        <Switch>{children}</Switch>
      </div>
    </Layout>
  );
};

export default Generic;
