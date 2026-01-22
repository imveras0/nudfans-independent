import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import CreatorSetup from "./pages/CreatorSetup";
import CreatorProfile from "./pages/CreatorProfile";
import Feed from "./pages/Feed";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Explore from "./pages/Explore";
import PaymentHistory from "./pages/PaymentHistory";
import Admin from "./pages/Admin";
import { useAuth } from "./_core/hooks/useAuth";
import { BottomNavigation } from "./components/BottomNavigation";

function Router() {
  const { user, loading } = useAuth();
  
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/creator-setup" component={CreatorSetup} />
        <Route path="/creator" component={() => { window.location.href = "/explore"; return null; }} />
        <Route path="/creator/:username" component={CreatorProfile} />
        <Route path="/feed" component={Feed} />
        <Route path="/explore" component={Explore} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/:tab" component={Dashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/messages/:conversationId" component={Messages} />
        <Route path="/payments" component={PaymentHistory} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      {user && !loading && <BottomNavigation />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Elements stripe={stripePromise}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </Elements>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
