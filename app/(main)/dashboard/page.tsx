"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";

export default function PrivatePage() {
  // Get user profile from cached store
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="rounded-lg bg-muted p-8 mb-8">
          <div className="text-center">
            <div className="max-w-md mx-auto">
              <h1 className="text-4xl font-bold mb-5">
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
      {userProfile.avatar_url && (
        <Image
          src={userProfile.avatar_url}
          alt="Avatar"
          width={64}
          height={64}
          className="mb-2 h-16 w-16 rounded-full object-cover"
          priority
        />
      )}
      <div className="text-lg font-bold text-primary">
        {userProfile.display_name || "No name"}
      </div>
      <div className="text-sm text-muted-foreground">
        {userProfile.bio || "No bio"}
      </div>
      <p className="py-6 text-muted-foreground">
        Hello{" "}
        <span className="font-semibold text-primary">
          {userProfile.email || "No email"}
        </span>
        !
      </p>
    </div>
  );
}
