import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserProfile } from "@/hooks/useUserProfile";

export interface HandleSaveParams {
  profilePicture: File | null;
  displayName: string;
  bio: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showToast?: (
    message: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
  setProfilePicture: React.Dispatch<React.SetStateAction<File | null>>;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface HandleFileSelectParams {
  file: File | null;
  setProfilePicture: React.Dispatch<React.SetStateAction<File | null>>;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

// --- Rate Limiting Constants ---
const TEN_SECONDS = 10 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const MAX_CHANGES_PER_HOUR = 3;
const STORAGE_KEY = "profileUpdateTimestamps";

function getTimestamps(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTimestamps(timestamps: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

function canProceedWithUpdate(): { allowed: boolean; message?: string } {
  const now = Date.now();
  const timestamps = getTimestamps().filter((ts) => now - ts < ONE_HOUR);

  if (timestamps.length >= MAX_CHANGES_PER_HOUR) {
    return {
      allowed: false,
      message: "You can only update your profile 3 times per hour.",
    };
  }

  const last = timestamps[timestamps.length - 1];
  if (last && now - last < TEN_SECONDS) {
    const secondsLeft = Math.ceil((TEN_SECONDS - (now - last)) / 1000);
    return {
      allowed: false,
      message: `Please wait ${secondsLeft}s before trying again.`,
    };
  }

  return { allowed: true };
}

function recordUpdateTimestamp() {
  const now = Date.now();
  const timestamps = getTimestamps()
    .filter((ts) => now - ts < ONE_HOUR)
    .concat(now);
  setTimestamps(timestamps);
}

export function useSettingsActions() {
  const {
    userProfile,
    isLoading: profileLoading,
    updateUserProfile,
    uploadAvatar,
  } = useUserProfile();

  function validateProfile(
    displayName: string,
    bio: string
  ): {
    valid: boolean;
    message?: string;
    type?: "error" | "info";
    trimmedDisplayName?: string;
    trimmedBio?: string;
  } {
    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();

    if (trimmedDisplayName.length > 21)
      return {
        valid: false,
        message: "Display name must be 21 characters or less.",
        type: "error",
      };
    if (/\s/.test(trimmedDisplayName))
      return {
        valid: false,
        message: "Display name cannot contain whitespace.",
        type: "error",
      };
    if (trimmedBio.length > 500)
      return {
        valid: false,
        message: "Bio must be 500 characters or less.",
        type: "error",
      };

    return { valid: true, trimmedDisplayName, trimmedBio };
  }

  function getChangedFields({
    trimmedDisplayName,
    trimmedBio,
    userProfile,
    profilePicture,
  }: {
    trimmedDisplayName: string;
    trimmedBio: string;
    userProfile: UserProfile | null;
    profilePicture: File | null;
  }) {
    let displayName = "";
    let bio = "";
    if (userProfile) {
      displayName = userProfile.display_name ?? "";
      bio = userProfile.bio ?? "";
    }
    return {
      isDisplayNameChanged: trimmedDisplayName !== displayName,
      isBioChanged: trimmedBio !== bio,
      isAvatarChanged: !!profilePicture,
    };
  }

  const handleSave = async ({
    profilePicture,
    displayName,
    bio,
    setIsLoading,
    showToast,
    setProfilePicture,
    setPreviewUrl,
  }: HandleSaveParams) => {
    const validation = validateProfile(displayName, bio);
    if (!validation.valid) {
      showToast?.(
        validation.message || "Invalid input.",
        validation.type || "error"
      );
      return;
    }

    const { trimmedDisplayName, trimmedBio } = validation;

    const { isDisplayNameChanged, isBioChanged, isAvatarChanged } =
      getChangedFields({
        trimmedDisplayName: trimmedDisplayName ?? "",
        trimmedBio: trimmedBio ?? "",
        userProfile,
        profilePicture,
      });

    if (!isDisplayNameChanged && !isBioChanged && !isAvatarChanged) {
      showToast?.("No changes to save.", "info");
      return;
    }

    const rateLimitCheck = canProceedWithUpdate();
    if (!rateLimitCheck.allowed) {
      showToast?.(rateLimitCheck.message || "Rate limited.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      let updatedAvatarUrl = userProfile?.avatar_url ?? "";

      if (isAvatarChanged && profilePicture) {
        // Don't clear preview yet — keep it until upload finishes
        updatedAvatarUrl = await uploadAvatar(profilePicture);
      }

      await updateUserProfile({
        ...(isDisplayNameChanged ? { display_name: trimmedDisplayName } : {}),
        ...(isBioChanged ? { bio: trimmedBio } : {}),
        ...(isAvatarChanged ? { avatar_url: updatedAvatarUrl } : {}),
      });

      recordUpdateTimestamp();
      showToast?.("Profile updated successfully!", "success");

      // Reset after success
      setProfilePicture(null);
      setPreviewUrl(null);
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        showToast?.(
          (err as { message?: string }).message || "Error updating profile",
          "error"
        );
      } else {
        showToast?.("Error updating profile", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = ({
    file,
    setProfilePicture,
    setPreviewUrl,
  }: HandleFileSelectParams) => {
    setProfilePicture(file);

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  return {
    userProfile,
    profileLoading,
    handleSave,
    handleFileSelect,
  };
}
