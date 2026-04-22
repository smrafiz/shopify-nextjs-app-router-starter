/**
 * Shopify Webhook Payload Types
 */

export interface ShopifyLineItemProperty {
    name: string;
    value: string;
}

export interface ShopifyLineItem {
    id: number;
    variant_id: number;
    product_id?: number;
    title: string;
    quantity: number;
    price: string;
    sku?: string;
    variant_title?: string;
    vendor?: string;
    fulfillment_service?: string;
    product_exists?: boolean;
    fulfillable_quantity?: number;
    grams?: number;
    total_discount?: string;
    properties?: ShopifyLineItemProperty[];
}

export interface ShopifyCustomer {
    id: number;
    email: string;
    accepts_marketing?: boolean;
    created_at?: string;
    updated_at?: string;
    first_name?: string;
    last_name?: string;
    orders_count: number;
    state?: string;
    total_spent?: string;
    last_order_id?: number;
    note?: string;
    verified_email?: boolean;
    phone?: string;
    tags?: string;
}

export interface ShopifyOrder {
    id: number;
    admin_graphql_api_id?: string;
    created_at: string;
    updated_at?: string;
    cancelled_at?: string;
    closed_at?: string;
    name: string;
    email: string;
    currency: string;
    financial_status: string;
    fulfillment_status?: string;
    total_price: string;
    subtotal_price?: string;
    total_discounts?: string;
    total_tax?: string;
    tags?: string;
    note?: string;
    note_attributes?: Array<{ name: string; value: string }>;
    discount_codes?: Array<{ code: string; amount: string; type: string }>;
    line_items: ShopifyLineItem[];
    customer?: ShopifyCustomer;
    billing_address?: Record<string, unknown>;
    shipping_address?: Record<string, unknown>;
    fulfillments?: unknown[];
    refunds?: unknown[];
    source_name?: string;
    test?: boolean;
}

export interface ShopifyShop {
    id: number;
    name: string;
    email: string;
    domain: string;
    myshopify_domain: string;
    primary_locale: string;
    country: string;
    country_code: string;
    country_name: string;
    currency: string;
    timezone: string;
    iana_timezone: string;
    shop_owner: string;
    plan_name: string;
    plan_display_name: string;
    created_at: string;
    updated_at: string;
    money_format: string;
    money_with_currency_format: string;
    weight_unit: string;
    taxes_included?: boolean;
    tax_shipping?: boolean;
    has_storefront?: boolean;
    checkout_api_supported?: boolean;
    enabled_presentment_currencies?: string[];
}

export interface ShopifyProduct {
    id: number;
    title: string;
    body_html?: string;
    vendor: string;
    product_type?: string;
    created_at: string;
    handle: string;
    updated_at: string;
    published_at?: string;
    tags?: string;
    status: string;
    admin_graphql_api_id: string;
    variants: unknown[];
    options?: unknown[];
    images?: unknown[];
}
