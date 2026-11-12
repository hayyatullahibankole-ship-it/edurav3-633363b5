import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  BookOpen, 
  Target, 
  MessageSquare, 
  Trophy, 
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Edura! 🎉",
    description: "We're excited to help you ace your exams! Let's take a quick tour to show you around and help you get started on your journey to success.",
    icon: <Rocket className="h-12 w-12 text-primary animate-bounce-slow" />
  },
  {
    title: "Practice Tests",
    description: "Take realistic CBT practice tests for JAMB, WAEC, NECO, and Post-UTME. Our questions are carefully curated to match real exam standards.",
    icon: <Target className="h-12 w-12 text-success" />,
    action: { label: "Start Practice", href: "/practice" }
  },
  {
    title: "Classroom 📚",
    description: "Access comprehensive lessons, video tutorials, and study materials for all subjects. Learn at your own pace with expert-curated content.",
    icon: <BookOpen className="h-12 w-12 text-info" />,
    action: { label: "Open Classroom", href: "/study-hub" }
  },
  {
    title: "Ask Tutors 💬",
    description: "Stuck on a question? Get instant help from tutors and fellow students. Share knowledge, ask questions, and learn together in our community forum.",
    icon: <MessageSquare className="h-12 w-12 text-accent" />,
    action: { label: "Visit Forum", href: "/forum" }
  },
  {
    title: "Challenge Arena ⚔️",
    description: "Compete with students nationwide! Take daily challenges, earn points, climb the leaderboard, and win amazing prizes.",
    icon: <Trophy className="h-12 w-12 text-warning" />,
    action: { label: "Join Arena", href: "/challenge-arena" }
  },
  {
    title: "Book 1-on-1 Sessions",
    description: "Need personalized help? Book private tutoring sessions with expert tutors. Get focused attention on topics you find challenging.",
    icon: <Calendar className="h-12 w-12 text-secondary" />,
    action: { label: "Book Session", href: "https://wa.me/2347050757085?text=Hello%20Edura%2C%20I%20would%20like%20to%20book%20an%20expert%20consultation%20session." }
  },
  {
    title: "You're All Set! ✨",
    description: "That's it! You're ready to start your journey to exam success. Remember, consistency is key. Practice regularly, study smart, and don't hesitate to ask for help. Good luck! 🚀",
    icon: <CheckCircle2 className="h-12 w-12 text-success animate-pulse" />
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({ isOpen, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { userProfile } = useAuth();
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (!userProfile?.id) return;

    try {
      // Mark onboarding as completed
      const { error } = await supabase
        .from('user_preferences')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Welcome aboard! 🎉",
        description: "You're all set to start your learning journey!"
      });

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {tourSteps.length}
            </Badge>
            {currentStep < tourSteps.length - 1 && (
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
                Skip Tour
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2 mb-4" />
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex justify-center mb-4">
                {step.icon}
              </div>
              <DialogTitle className="text-2xl font-bold mb-2">
                {step.title}
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                {step.description}
              </DialogDescription>
            </CardContent>
          </Card>

          {step.action && (
            <Card className="border-dashed">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Quick Action</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={step.action.href} onClick={handleSkip}>
                    {step.action.label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            {currentStep === tourSteps.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Get Started!
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
