type SupabaseImageResizeMode = "cover" | "contain" | "fill";

type SupabaseImageTransformOptions = {
  width: number;
  height?: number;
  quality?: number;
  resize?: SupabaseImageResizeMode;
};

const SUPABASE_PUBLIC_OBJECT_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_IMAGE_PATH = "/storage/v1/render/image/public/";

export function getSupabaseRenderImageUrl(
  imageUrl: string | null | undefined,
  options: SupabaseImageTransformOptions,
) {
  if (!imageUrl) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return imageUrl;
  }

  if (!parsedUrl.pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PATH)) {
    return imageUrl;
  }

  parsedUrl.pathname = parsedUrl.pathname.replace(
    SUPABASE_PUBLIC_OBJECT_PATH,
    SUPABASE_RENDER_IMAGE_PATH,
  );
  parsedUrl.searchParams.set("width", String(options.width));

  if (options.height) {
    parsedUrl.searchParams.set("height", String(options.height));
  }

  if (options.quality) {
    parsedUrl.searchParams.set("quality", String(options.quality));
  }

  if (options.resize) {
    parsedUrl.searchParams.set("resize", options.resize);
  }

  return parsedUrl.toString();
}
