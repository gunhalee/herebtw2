type DongPostsFeedVeilProps = {
  message?: string;
};

const DEFAULT_FEED_LOADING_MESSAGE =
  "\uc6b0\ub9ac \ub3d9\ub124 \uae00\uc744 \ubd88\ub7ec\uc624\ub294 \uc911\uc785\ub2c8\ub2e4.";

export function DongPostsFeedVeil({
  message = DEFAULT_FEED_LOADING_MESSAGE,
}: DongPostsFeedVeilProps) {
  return (
    <div aria-hidden="true" className="global-feed-preview__veil">
      <div className="global-feed-preview__badge">{message}</div>
    </div>
  );
}
