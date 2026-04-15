type VeilOverlayProps = {
  message?: string;
};

const DEFAULT_FEED_LOADING_MESSAGE =
  "우리 동네 글을 불러오는 중입니다.";

export function VeilOverlay({
  message = DEFAULT_FEED_LOADING_MESSAGE,
}: VeilOverlayProps) {
  return (
    <div aria-hidden="true" className="global-feed-preview__veil">
      <div className="global-feed-preview__badge">{message}</div>
    </div>
  );
}
