import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import RPGIndex from "./pages/RPGIndex";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import MercuryLesson from "./pages/MercuryLesson";
import VenusLesson from "./pages/VenusLesson";
import EarthLesson from "./pages/EarthLesson";
import MarsLesson from "./pages/MarsLesson";
import JupiterLesson from "./pages/JupiterLesson";
import SaturnLesson from "./pages/SaturnLesson";
import UranusLesson from "./pages/UranusLesson";
import NeptuneLesson from "./pages/NeptuneLesson";
import PhilippinesMap from "./pages/PhilippinesMap";
import RegionLessonPlaceholder from "./pages/RegionLessonPlaceholder";
import RiceTerracesPolynomial from "./pages/lessons/RiceTerracesPolynomial";
import ChocolateHillsRational from "./pages/lessons/ChocolateHillsRational";
import CagsawaDomain from "./pages/lessons/CagsawaDomain";
import PalawanRestrictions from "./pages/lessons/PalawanRestrictions";
import TaalGraphs from "./pages/lessons/TaalGraphs";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import RationalEquationSolver from "@/components/calculator/RationalEquationSolver";
import { TutorCalculatorPanel } from "./components/calculator/TutorCalculatorPanel";
import React from "react";
import BackgroundMusic from "@/components/rpg/BackgroundMusic";
import CalaguasZeros from "./pages/lessons/CalaguasZeros";
import QuantumRationalSolverPage from "./pages/QuantumRationalSolverPage";
import DrawingSolverPage from "./pages/DrawingSolverPage";

const queryClient = new QueryClient();

// --- BEGIN ADD: route resolver ---
export function resolveProgressRoute(p: { module_id: string | null; section_id: string | null; slide_index: number; }) {
  // Defaults if new user
  const moduleId = p.module_id || 'mercury';
  const sectionId = p.section_id || 'S1';
  const slide = Number.isFinite(p.slide_index) ? p.slide_index : 0;

  // Map to your existing route schema — planet-based lessons
  // Default to mercury-lesson if no specific progress
  if (!p.module_id) {
    return '/mercury-lesson';
  }
  
  // Map module_id to planet routes
  const planetRoutes: Record<string, string> = {
    'mercury': '/mercury-lesson',
    'venus': '/venus-lesson', 
    'earth': '/earth-lesson',
    'mars': '/mars-lesson',
    'jupiter': '/jupiter-lesson',
    'saturn': '/saturn-lesson',
    'uranus': '/uranus-lesson',
    'neptune': '/neptune-lesson'
  };
  
  // If we have a valid module_id, return the corresponding route
  const route = planetRoutes[moduleId.toLowerCase()];
  if (route) {
    return route;
  }
  
  // Fallback to mercury if module_id is not recognized
  return '/mercury-lesson';
}
// --- END ADD ---

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h1>
            <p className="text-muted-foreground mb-4">
              The app encountered an error. Please check the console for details.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">Error Details</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Global background music (plays after login across routes) */}
            <BackgroundMusic />
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/index" element={<Index />} />
              <Route path="/rpg" element={<RPGIndex />} />
              <Route path="/mercury-lesson" element={<MercuryLesson />} />
              <Route path="/venus-lesson" element={<VenusLesson />} />
              <Route path="/earth-lesson" element={<EarthLesson />} />
              <Route path="/mars-lesson" element={<MarsLesson />} />
              <Route path="/jupiter-lesson" element={<JupiterLesson />} />
              <Route path="/saturn-lesson" element={<SaturnLesson />} />
              <Route path="/uranus-lesson" element={<UranusLesson />} />
              <Route path="/neptune-lesson" element={<NeptuneLesson />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/solver" element={<RationalEquationSolver />} />
              <Route path="/calculator" element={<TutorCalculatorPanel />} />
              <Route path="/quantum-solver" element={<QuantumRationalSolverPage />} />
              <Route path="/drawing-solver" element={<DrawingSolverPage />} />
              <Route path="/philippines-map" element={<PhilippinesMap />} />
                             <Route path="/lesson/:regionId" element={<RegionLessonPlaceholder />} />
               <Route path="/lesson/rice-terraces" element={<RiceTerracesPolynomial />} />
               <Route path="/lesson/chocolate-hills" element={<ChocolateHillsRational />} />
               <Route path="/lesson/cagsawa-domain" element={<CagsawaDomain />} />
               <Route path="/lesson/palawan-restrictions" element={<PalawanRestrictions />} />
               <Route path="/lesson/taal-graphs" element={<TaalGraphs />} />
               <Route path="/lesson/calaguas-zeros" element={<CalaguasZeros />} />
              <Route path="/test" element={<TestPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
