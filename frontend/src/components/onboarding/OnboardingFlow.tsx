import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Camera, Image, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/hooks/useProfile';
import { INTEREST_CATEGORIES, MIN_INTERESTS } from '@/lib/constants';
import { validateUsername } from '@/lib/utils';
import { toast } from 'sonner';

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();

  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNextStep = () => {
    if (step === 3) {
      // Validate username
      const usernameCheck = validateUsername(username);
      if (!usernameCheck.valid) {
        setUsernameError(usernameCheck.message || 'Invalid username');
        return;
      }
      setUsernameError('');
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      toast.error(`Please select at least ${MIN_INTERESTS} interests!`);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: username.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
        interests: selectedInterests,
        avatarFile,
        coverFile,
        isOnboarded: true,
      });

      navigate('/feed', { replace: true });
    } catch (err: any) {
      const message = err.message || 'Unknown error';
      if (message.includes('public.profiles') || message.includes('PGRST205')) {
        toast.error(
          'Database not set up yet. Ask your developer to run: npm run db:setup'
        );
      } else {
        toast.error(`Onboarding failed: ${message}`);
      }
    }
  };

  const stepsCount = 4;
  const progressPercent = (step / stepsCount) * 100;

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative">
      {/* Decorative Blur elements */}
      <div className="absolute top-1/6 left-1/5 h-[200px] w-[200px] rounded-full bg-indigo-500/5 blur-[80px]" />
      <div className="absolute bottom-1/6 right-1/5 h-[200px] w-[200px] rounded-full bg-pink-500/5 blur-[80px]" />

      <Card variant="glass" padding="lg" className="w-full max-w-xl shadow-2xl border-slate-800/80 my-8">
        {/* Step progress bar header */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Step {step} of {stepsCount}</span>
            <span>{progressPercent.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            />
          </div>
        </div>

        {/* Dynamic Slides */}
        <div className="min-h-[300px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <div className="mx-auto p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-fit mb-3">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                    Set Profile Picture
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                    Help other creators recognize you by uploading a premium profile photo
                  </p>
                </div>

                <ImageUpload
                  value={avatarFile}
                  onChange={setAvatarFile}
                  aspectRatio="square"
                  className="mt-2"
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <div className="mx-auto p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-fit mb-3">
                    <Image className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                    Select Cover Photo
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                    Personalize your dashboard profile layout with a background cover photo
                  </p>
                </div>

                <ImageUpload
                  value={coverFile}
                  onChange={setCoverFile}
                  aspectRatio="video"
                  className="mt-2"
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center mb-1">
                  <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                    Tell Us About Yourself
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Fill in your unique details to complete your card profile
                  </p>
                </div>

                {/* Username */}
                <Input
                  type="text"
                  label="Username"
                  placeholder="e.g. story_maker"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  error={usernameError}
                />

                {/* Full Name */}
                <Input
                  type="text"
                  label="Full Name"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                {/* Bio */}
                <Textarea
                  label="Bio / Tagline"
                  placeholder="Write a brief introduction about your inspirations, interests, or stories..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  showCharacterCount
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div className="text-center">
                  <div className="mx-auto p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-fit mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                    Choose Your Interests
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select at least {MIN_INTERESTS} topics to curate your dashboard feed list
                  </p>
                </div>

                {/* Grid of Interests */}
                <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 mt-3 custom-scrollbar">
                  {INTEREST_CATEGORIES.map((cat) => {
                    const isSelected = selectedInterests.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleInterestToggle(cat)}
                        className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-6 mt-8">
            {step > 1 ? (
              <Button
                onClick={handlePrevStep}
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="h-4.5 w-4.5" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < stepsCount ? (
              <Button
                onClick={handleNextStep}
                variant="primary"
                size="sm"
                disabled={step === 3 && (!username || !fullName)}
                rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                variant="primary"
                size="sm"
                isLoading={updateProfile.isPending}
                disabled={selectedInterests.length < MIN_INTERESTS}
                rightIcon={<Check className="h-4.5 w-4.5" />}
              >
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
