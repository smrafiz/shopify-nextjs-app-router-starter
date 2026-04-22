"use server";

import { handleSessionToken } from "@/lib/shopify";
import { executeGraphQLMutation } from "@/lib";
import type { ActionResponse } from "@/shared/types";

const FILE_DELETE_MUTATION = `
  mutation FileDelete($fileIds: [ID!]!) {
    fileDelete(fileIds: $fileIds) {
      deletedFileIds
      userErrors {
        field
        message
      }
    }
  }
`;

interface FileDeleteResult {
  fileDelete: {
    deletedFileIds: string[];
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

/**
 * Upload a file via the /api/upload route (staged Shopify upload).
 * Expects FormData with a "file" field and "sessionToken" field.
 */
export async function uploadMediaAction(
  formData: FormData
): Promise<ActionResponse<{ resourceUrl: string }>> {
  try {
    const sessionToken = formData.get("sessionToken") as string | null;

    if (!sessionToken) {
      return { status: "error", message: "Missing sessionToken in FormData" };
    }

    const appUrl = process.env.SHOPIFY_APP_URL ?? process.env.HOST ?? "";
    if (!appUrl) {
      return { status: "error", message: "App URL not configured" };
    }

    const uploadUrl = `${appUrl.replace(/\/$/, "")}/api/upload`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        status: "error",
        message: body.error ?? `Upload failed with status ${res.status}`,
      };
    }

    const json = (await res.json()) as { resourceUrl?: string };
    if (!json.resourceUrl) {
      return { status: "error", message: "No resourceUrl in upload response" };
    }

    return { status: "success", data: { resourceUrl: json.resourceUrl } };
  } catch (error) {
    console.error("[uploadMediaAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete files from Shopify by their file IDs.
 */
export async function deleteMediaAction(
  sessionToken: string,
  fileIds: string[]
): Promise<ActionResponse<{ deletedFileIds: string[]; failedFileIds: string[] }>> {
  try {
    if (!fileIds || fileIds.length === 0) {
      return {
        status: "success",
        data: { deletedFileIds: [], failedFileIds: [] },
        message: "No files to delete",
      };
    }

    const { shop, session } = await handleSessionToken(sessionToken, false, false);

    if (!session.accessToken) {
      return { status: "error", message: "No access token in session" };
    }

    const result = await executeGraphQLMutation<FileDeleteResult>({
      query: FILE_DELETE_MUTATION,
      variables: { fileIds },
      sessionToken,
      shop,
      accessToken: session.accessToken,
    });

    if (result.errors?.length) {
      return {
        status: "error",
        message: result.errors.map((e) => e.message).join(", "),
      };
    }

    const userErrors = result.data?.fileDelete?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {
        status: "error",
        message: userErrors.map((e) => e.message).join(", "),
      };
    }

    const deletedFileIds = result.data?.fileDelete?.deletedFileIds ?? [];
    const failedFileIds = fileIds.filter((id) => !deletedFileIds.includes(id));

    return {
      status: "success",
      data: { deletedFileIds, failedFileIds },
      message: `Deleted ${deletedFileIds.length} file(s)`,
    };
  } catch (error) {
    console.error("[deleteMediaAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete files",
    };
  }
}
