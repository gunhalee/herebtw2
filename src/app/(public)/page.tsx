import { HomeScreenBootstrap } from "../../components/home/home-screen-bootstrap";
import { HomeStaticScreen } from "../../components/home/home-static-screen";
import { getPublicHomePageShellState } from "../../lib/posts/queries";

export const revalidate = 10;

export default async function HomePage() {
  const { currentDongName, selectedDongCode, candidateMessages, postListState } =
    await getPublicHomePageShellState();

  return (
    <HomeScreenBootstrap>
      <HomeStaticScreen
        candidateMessages={candidateMessages}
        currentDongName={currentDongName}
        postListState={postListState}
        selectedDongCode={selectedDongCode}
      />
    </HomeScreenBootstrap>
  );
}
