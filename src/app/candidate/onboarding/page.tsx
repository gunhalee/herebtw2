import { redirect } from "next/navigation";
import { getCandidateSession } from "../../../lib/auth/candidate-session";
import { OnboardingScreen } from "../../../components/candidate/onboarding-screen";

export default async function OnboardingPage() {
  const session = await getCandidateSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.hasFirstMessage) {
    redirect("/candidate/dashboard");
  }

  return (
    <OnboardingScreen
      candidateName={session.name}
      district={session.district}
    />
  );
}
