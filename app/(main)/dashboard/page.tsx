"use client";

import { useEnhancedUserProfile } from "@/components/CacheProvider";
import Image from "next/image";

export default function PrivatePage() {
  // Get user profile from cached store
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto p-8">
        <div className="hero bg-base-200 rounded-box mb-8">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-base-content mb-5">
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
  const { userProfile } = useEnhancedUserProfile();
  if (!userProfile) return null;
  return (
    <div className="flex flex-col items-center">
      {userProfile.avatar_url && (
        <Image
          src={userProfile.avatar_url}
          alt="Avatar"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full mb-2 object-cover"
          priority
        />
      )}
      <div className="font-bold text-lg text-primary">
        {userProfile.display_name || "No name"}
      </div>
      <div className="text-base-content/70 text-sm">
        {userProfile.bio || "No bio"}
      </div>
      <p className="py-6 text-base-content/70">
        Hello{" "}
        <span className="font-semibold text-primary">
          {userProfile.email || "No email"}
        </span>
        !
      </p>
    </div>
  );
}
