export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function pdfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

export function formatPdfError(errorData: { error?: string; reason?: string; limit?: number | string }): string {
  if (errorData.reason === "daily_limit_exceeded") {
    const token = localStorage.getItem("token");
    if (!token) {
      return `You've reached the daily limit of ${errorData.limit || 8} free operations. Sign up for a free account to get more, or upgrade to Pro for unlimited access.`;
    }
    return `You've reached your daily limit of ${errorData.limit} operations. Upgrade to Pro for unlimited access.`;
  }
  if (errorData.reason === "file_size_exceeded") {
    return `File size exceeds the ${errorData.limit} limit. Upgrade your plan for larger files.`;
  }
  if (errorData.reason === "page_limit_exceeded") {
    return `PDF exceeds the ${errorData.limit} page limit. Upgrade your plan for more pages.`;
  }
  if (errorData.reason === "account_disabled") {
    return "Your account has been disabled. Please contact support.";
  }
  return errorData.error || "Processing failed. Please try again.";
}

export async function downloadPdfFile(downloadUrl: string, filename?: string) {
  const url = downloadUrl.startsWith("http")
    ? new URL(downloadUrl).pathname
    : downloadUrl;

  const response = await pdfFetch(url);

  if (!response.ok) {
    let errorMsg = "Download failed. Please try again.";
    try {
      const errorData = await response.json();
      errorMsg = formatPdfError(errorData);
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || url.split("/").pop() || "download.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
