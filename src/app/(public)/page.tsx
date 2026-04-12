import { HomeScreen } from "../../components/home/home-screen";
import { getHomePageState } from "../../lib/posts/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { appShellState, candidateMessages, postListState } =
    await getHomePageState();

  return (
    <HomeScreen
      initialAppShellState={appShellState}
      initialCandidateMessages={candidateMessages}
      initialPostListState={postListState}
    />
  );
}
