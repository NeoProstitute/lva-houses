import { Dashboard } from "../components/dashboard";
import { getLeaderboard } from "../lib/api";

export default async function Home() {
  const leaderboard = await getLeaderboard();
  return <Dashboard initialLeaderboard={leaderboard} />;
}
