"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";
import { Sparkles, User } from "lucide-react";

export default function PrivatePage() {
  // Get user profile from cached store
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto p-4 sm:p-8 relative z-10">
        <div className="bg-slate-800/40 border border-slate-600 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-500 shadow-2xl rounded-lg overflow-hidden mb-8">
          <div className="bg-slate-700/30 border-b border-slate-600 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-center gap-3">
              <div className="text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                <span className="text-lg sm:text-xl font-semibold">
                  Welcome to Cognify
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 text-center">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-5">
                Welcome!
              </h1>
              <UserProfileInline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline UserProfileDisplay logic as a local component
function UserProfileInline() {
  const { userProfile } = useUserProfile();
  if (!userProfile) return null;
  return (
    <div className="flex flex-col items-center">
      {userProfile.avatar_url ? (
        <Image
          src={userProfile.avatar_url}
          alt="Avatar"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-blue-400/40"
          priority
        />
      ) : (
        <div className="w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center border-2 border-blue-400/40">
          <User className="w-8 h-8 text-white" />
        </div>
      )}
      <div className="font-bold text-lg text-blue-300">
        {userProfile.display_name || "No name"}
      </div>
      <div className="text-slate-300 text-sm mb-4">
        {userProfile.bio || "No bio"}
      </div>
      <p className="py-4 text-slate-200">
        Hello{" "}
        <span className="font-semibold text-violet-300">
          {userProfile.email || "No email"}
        </span>
        !
      </p>
    </div>
  );
}
