import { Switch, Route, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UserProvider, useUserContext } from "@/contexts/user";

import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { Matches } from "@/pages/matches";
import { MatchDetail } from "@/pages/match-detail";
import { Leaderboard } from "@/pages/leaderboard";
import { Groups } from "@/pages/groups";
import { Bracket } from "@/pages/bracket";
import { Admin } from "@/pages/admin";
import { Profile } from "@/pages/profile";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { userId } = useUserContext();
  if (userId == null) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function HomeRedirect() {
  const { userId } = useUserContext();
  if (userId != null) return <Redirect to="/dashboard" />;
  return <Home />;
}

function LoginRoute() {
  const { userId } = useUserContext();
  if (userId != null) return <Redirect to="/dashboard" />;
  return <Login />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={LoginRoute} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/matches">
        <ProtectedRoute component={Matches} />
      </Route>
      <Route path="/matches/:id">
        <ProtectedRoute component={MatchDetail} />
      </Route>
      <Route path="/leaderboard">
        <ProtectedRoute component={Leaderboard} />
      </Route>
      <Route path="/groups">
        <ProtectedRoute component={Groups} />
      </Route>
      <Route path="/bracket">
        <ProtectedRoute component={Bracket} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
