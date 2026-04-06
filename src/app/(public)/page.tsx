import { HomeScreen } from "../../components/home/home-screen";
import { getHomePageState } from "../../lib/posts/queries";
import { hasSupabaseServerConfig } from "../../lib/supabase/config";

export const revalidate = 10;

export default async function HomePage() {
  const { appShellState, postListState } = await getHomePageState();

  return (
    <HomeScreen
      dataSourceMode={hasSupabaseServerConfig() ? "supabase" : "mock"}
      initialAppShellState={appShellState}
      initialPostListState={postListState}
    />
  );
}
