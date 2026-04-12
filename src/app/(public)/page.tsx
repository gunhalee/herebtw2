import { HomeScreen } from "../../components/home/home-screen";
import { getHomePageState } from "../../lib/posts/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    candidateId?: string | string[];
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const rawCandidateId = resolvedSearchParams.candidateId;
  const candidateId = Array.isArray(rawCandidateId)
    ? rawCandidateId[0] ?? null
    : rawCandidateId ?? null;
  const {
    appShellState,
    candidateMessages,
    postListState,
    selectedCandidateReplies,
  } = await getHomePageState({
    candidateId,
  });

  return (
    <HomeScreen
      initialAppShellState={appShellState}
      initialCandidateMessages={candidateMessages}
      initialPostListState={postListState}
      selectedCandidateReplies={selectedCandidateReplies}
    />
  );
}
