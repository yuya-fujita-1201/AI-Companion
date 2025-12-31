import { Pressable, View, Platform } from "react-native";
import { useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface VoiceInputButtonProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function VoiceInputButton({
  onStartRecording,
  onStopRecording,
  disabled = false,
}: VoiceInputButtonProps) {
  const colors = useColors();
  const [isRecording, setIsRecording] = useState(false);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 1 - (pulseScale.value - 1) * 2,
  }));

  const handlePressIn = () => {
    if (disabled) return;

    setIsRecording(true);
    onStartRecording();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scale.value = withSpring(1.1, { damping: 10 });

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000 }),
        withTiming(1, { duration: 0 })
      ),
      -1
    );
  };

  const handlePressOut = () => {
    if (disabled) return;

    setIsRecording(false);
    onStopRecording();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    scale.value = withSpring(1, { damping: 10 });
    pulseScale.value = 1;
  };

  return (
    <View className="items-center justify-center">
      {isRecording && (
        <Animated.View
          style={[
            pulseStyle,
            {
              position: "absolute",
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary,
            },
          ]}
        />
      )}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Animated.View
          style={[
            buttonStyle,
            {
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: isRecording ? colors.error : colors.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
        >
          <IconSymbol
            name="paperplane.fill"
            size={28}
            color="white"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}
