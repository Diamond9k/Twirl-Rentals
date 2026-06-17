import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { colors, radius, spacing } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface PhotoPickerProps {
  /** Local URIs or already-uploaded URLs. */
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function PhotoPicker({ photos, onChange, max = 8 }: PhotoPickerProps) {
  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to add pictures.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: max - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      onChange([...photos, ...result.assets.map((a) => a.uri)].slice(0, max));
    }
  };

  const remove = (uri: string) => onChange(photos.filter((p) => p !== uri));

  const SLOT = 116;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.md }}
    >
      {photos.map((uri) => (
        <View key={uri} style={{ width: SLOT, height: SLOT * 1.25 }}>
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%", borderRadius: radius.md }}
            contentFit="cover"
          />
          <Pressable
            onPress={() => remove(uri)}
            hitSlop={8}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "rgba(255,255,255,0.95)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={16} color={colors.text} />
          </Pressable>
        </View>
      ))}

      {photos.length < max ? (
        <Pressable
          onPress={pick}
          style={{
            width: SLOT,
            height: SLOT * 1.25,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.borderStrong,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
          <Text variant="caption">Add photo</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
