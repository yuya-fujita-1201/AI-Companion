import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";

export async function requestAudioPermissions(): Promise<boolean> {
  try {
    // expo-audio automatically requests permissions when recording starts
    return true;
  } catch (error) {
    console.error("Failed to request audio permissions:", error);
    return false;
  }
}

export async function configureAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  } catch (error) {
    console.error("Failed to configure audio mode:", error);
  }
}

export async function uploadAudioFile(uri: string): Promise<string> {
  try {
    // Read the audio file as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create form data
    const formData = new FormData();
    formData.append("file", blob, "recording.m4a");

    // Upload to server storage
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload audio file");
    }

    const data = await uploadResponse.json();
    return data.url;
  } catch (error) {
    console.error("Failed to upload audio:", error);
    throw error;
  }
}
