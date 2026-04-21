import { CodegenConfig } from "@graphql-codegen/cli";
import { ApiType, preset } from "@shopify/api-codegen-preset";
import { SHOPIFY_API_VERSION } from "./shared/constants";

const config: CodegenConfig = {
  schema: `https://shopify.dev/admin-graphql-direct-proxy/${SHOPIFY_API_VERSION}`,
  documents: ["./lib/graphql/schema/**/*.graphql"],
  generates: {
    "./lib/graphql/generated/": {
      preset: "client",
      plugins: [],
    },
    "./shared/types/generated/admin.generated.d.ts": {
      preset,
      presetConfig: {
        apiType: ApiType.Admin,
      },
    },
  },
};

export default config;
