export type PostLocation = {
  latitude: number;
  longitude: number;
};

export type PostListItem = {
  id: string;
  publicUuid?: string;
  content: string;
  administrativeDongName: string;
  distanceMeters: number;
  relativeTime: string;
  agreeCount: number;
  myAgree: boolean;
  canReport: boolean;
  isHighlighted: boolean;
  replyStatus?: "delivered" | "replied";
  replyCandidateName?: string | null;
  replyContent?: string | null;
  replyIsPromise?: boolean | null;
};

export type PostListState = {
  items: PostListItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  empty: boolean;
  errorMessage: string | null;
  sort: "distance" | "latest";
};

export type PostComposeState = {
  content: string;
  charCount: number;
  submitting: boolean;
  duplicateBlocked: boolean;
  errorMessage: string | null;
};
