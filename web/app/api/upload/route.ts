import { NextRequest, NextResponse } from "next/server";
import { handleSessionToken } from "@/lib/shopify";
import { extractBearerToken } from "@/shared/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_ORIGINS = [
  "https://admin.shopify.com",
  process.env.SHOPIFY_APP_URL ?? "",
].filter(Boolean);

const ALLOWED_UPLOAD_HOSTS = [
  "storage.googleapis.com",
  "storage.shopifycdn.com",
  "shopify-staged-uploads.storage.googleapis.com",
];

const STAGED_UPLOADS_MUTATION = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = ALLOWED_ORIGINS.some((o) => origin === o);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

function isAllowedUploadUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_UPLOAD_HOSTS.some((host) => hostname === host);
  } catch {
    return false;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);

  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  try {
    const token = extractBearerToken(request.headers.get("authorization"));

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: cors },
      );
    }

    const { shop, session } = await handleSessionToken(token);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401, headers: cors },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400, headers: cors },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Permitted types: jpeg, png, gif, webp" },
        { status: 415, headers: cors },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 413, headers: cors },
      );
    }

    const safeFilename = file.name
      .replace(/^.*[\\/]/, "")
      .replace(/[^\w.\-]/g, "_")
      .slice(0, 255);

    // Create staged upload target via Shopify Admin API
    const apiUrl = `https://${shop}/admin/api/2025-10/graphql.json`;
    const stagedRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        query: STAGED_UPLOADS_MUTATION,
        variables: {
          input: [
            {
              filename: safeFilename,
              mimeType: file.type,
              resource: "IMAGE",
              fileSize: String(file.size),
              httpMethod: "POST",
            },
          ],
        },
      }),
    });

    if (!stagedRes.ok) {
      console.error("[Upload] stagedUploadsCreate request failed:", stagedRes.status);
      return NextResponse.json(
        { error: "Failed to create upload target" },
        { status: 502, headers: cors },
      );
    }

    const stagedJson = await stagedRes.json() as {
      data?: {
        stagedUploadsCreate?: {
          stagedTargets?: Array<{
            url: string;
            resourceUrl: string;
            parameters: Array<{ name: string; value: string }>;
          }>;
          userErrors?: Array<{ field: string; message: string }>;
        };
      };
    };

    const stagedTarget = stagedJson.data?.stagedUploadsCreate?.stagedTargets?.[0];
    const userErrors = stagedJson.data?.stagedUploadsCreate?.userErrors ?? [];

    if (userErrors.length > 0 || !stagedTarget) {
      console.error("[Upload] stagedUploadsCreate errors:", userErrors);
      return NextResponse.json(
        { error: "Could not obtain upload URL" },
        { status: 502, headers: cors },
      );
    }

    const { url: uploadUrl, resourceUrl, parameters } = stagedTarget;

    if (!isAllowedUploadUrl(uploadUrl)) {
      return NextResponse.json(
        { error: "Invalid upload destination" },
        { status: 400, headers: cors },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const uploadForm = new FormData();
    parameters.forEach(({ name, value }) => uploadForm.append(name, value));
    uploadForm.append("file", new Blob([fileBuffer], { type: file.type }), safeFilename);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      console.error("[Upload] Staged upload failed:", uploadRes.status);
      return NextResponse.json(
        { error: `Upload failed: ${uploadRes.status}` },
        { status: 502, headers: cors },
      );
    }

    return NextResponse.json({ resourceUrl }, { headers: cors });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500, headers: cors },
    );
  }
}
