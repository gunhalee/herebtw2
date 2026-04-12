import { HomeScreen } from "../../components/home/home-screen";
import { getHomePageState } from "../../lib/posts/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { appShellState, postListState } = await getHomePageState();

  return (
    <HomeScreen
      initialAppShellState={appShellState}
      initialPostListState={postListState}
    />
  );
}
