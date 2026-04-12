type DongPostsFeedVeilProps = {
  message?: string;
};

export function DongPostsFeedVeil({
  message = "주민들의 한마디를 보기 위해 위치 권한을 허용해주세요.",
}: DongPostsFeedVeilProps) {
  return (
    <div aria-hidden="true" className="global-feed-preview__veil">
      <div className="global-feed-preview__badge">{message}</div>
    </div>
  );
}
