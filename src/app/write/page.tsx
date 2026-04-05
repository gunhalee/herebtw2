import { WriteScreen } from "../../components/post/write-screen";
import { hasSupabaseServerConfig } from "../../lib/supabase/config";

export default function WritePage() {
  return (
    <WriteScreen
      dataSourceMode={hasSupabaseServerConfig() ? "supabase" : "mock"}
    />
  );
}
