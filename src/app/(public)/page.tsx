import { HomeScreen } from "../../components/home/home-screen";
import { getHomePageState } from "../../lib/posts/queries";
import { hasSupabaseServerConfig } from "../../lib/supabase/config";
import { loadCandidateMessages } from "../../lib/candidates/messages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ appShellState, postListState }, { candidates: initialCandidates }] =
    await Promise.all([getHomePageState(), loadCandidateMessages(null)]);

  return (
    <HomeScreen
      dataSourceMode={hasSupabaseServerConfig() ? "supabase" : "mock"}
      initialAppShellState={appShellState}
      initialPostListState={postListState}
      initialCandidates={initialCandidates}
    />
  );
}
