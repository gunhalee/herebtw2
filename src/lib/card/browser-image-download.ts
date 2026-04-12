type SaveCardImageOptions = {
  imageUrl: string;
  fileName: string;
  shareTitle?: string;
};

function isLikelyMobileBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent ?? "";
  if (/Android|iPhone|iPad|iPod/i.test(userAgent)) {
    return true;
  }

  return /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
}

function triggerFileDownload(imageUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = imageUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function openImageForManualSave(imageUrl: string) {
  const opened = window.open(imageUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = imageUrl;
  }
}

async function tryNativeImageShare({
  imageUrl,
  fileName,
  shareTitle,
}: SaveCardImageOptions) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return false;
    }

    const blob = await response.blob();
    const imageFile = new File([blob], fileName, {
      type: blob.type || "image/png",
    });

    if (
      typeof navigator.canShare === "function" &&
      !navigator.canShare({ files: [imageFile] })
    ) {
      return false;
    }

    await navigator.share({
      files: [imageFile],
      title: shareTitle ?? "포토카드 이미지",
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }

    return false;
  }
}

export async function saveCardImageFromBrowser(options: SaveCardImageOptions) {
  if (typeof window === "undefined") {
    return;
  }

  if (isLikelyMobileBrowser()) {
    const shared = await tryNativeImageShare(options);
    if (!shared) {
      openImageForManualSave(options.imageUrl);
    }
    return;
  }

  triggerFileDownload(options.imageUrl, options.fileName);
}
