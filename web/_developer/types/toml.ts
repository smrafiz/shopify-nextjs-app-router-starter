export interface AppConfig {
  name: string;
  handle: string;
  client_id: string;
  application_url: string;
  extension_directories: string[];
  embedded: boolean;
  access_scopes: AccessScopes;
  access: AccessConfig;
  auth?: AuthConfig;
  webhooks: WebhooksConfig;
  app_proxy: AppProxyConfig;
  pos: POSConfig;
  build: BuildConfig;
}

interface AccessScopes {
  scopes: string;
  optional_scopes: string[];
  use_legacy_install_flow: boolean;
}

interface AdminAccessConfig {
  direct_api_mode: "online" | "offline";
  embedded_app_direct_api_access: boolean;
}

interface AccessConfig {
  admin: AdminAccessConfig;
}

interface AuthConfig {
  redirect_urls: string[];
}

interface WebhooksConfig {
  api_version: string;
  subscriptions?: WebhookSubscription[];
}

interface WebhookSubscription {
  topics?: string[];
  compliance_topics?: string[];
  uri: string;
}

interface AppProxyConfig {
  url: string;
  subpath: string;
  prefix: "apps" | "a" | "community" | "tools";
}

interface POSConfig {
  embedded: boolean;
}

interface BuildConfig {
  include_config_on_deploy: boolean;
  automatically_update_urls_on_dev: boolean;
  dev_store_url: string;
}

export {};
