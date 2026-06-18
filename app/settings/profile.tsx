import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Header } from "@/components/ui/Header";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { updateProfile } from "@/lib/api/profiles";
import { uploadImage } from "@/lib/api/storage";
import { SIZES, SORORITIES } from "@/lib/constants";
import { colors, spacing, SCREEN_PADDING } from "@/lib/theme";
import type { ItemSize } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function EditProfileScreen() {
  const { profile, userId, refreshProfile } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [sorority, setSorority] = useState<string | null>(profile?.sorority ?? null);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [sizes, setSizes] = useState<ItemSize[]>((profile?.sizes ?? []) as ItemSize[]);
  const [saving, setSaving] = useState(false);

  const toggleSize = (s: ItemSize) =>
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setAvatar(res.assets[0].uri);
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      let avatarUrl = avatar;
      if (avatar && !/^https?:\/\//.test(avatar)) {
        avatarUrl = await uploadImage("avatars", userId, avatar);
      }
      await updateProfile(userId, {
        full_name: fullName.trim(),
        sorority: sorority ?? undefined,
        bio: bio.trim() || undefined,
        sizes,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Header title="Edit profile" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginVertical: spacing.lg }}>
          <Pressable onPress={pickAvatar}>
            <Avatar uri={avatar} name={fullName} size={104} />
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background }}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </Pressable>
        </View>

        <View style={{ gap: spacing.xl }}>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} />
          <Select
            label="Sorority / chapter"
            placeholder="Choose your chapter"
            sheetTitle="Choose your chapter"
            value={sorority}
            onChange={setSorority}
            options={SORORITIES.map((s) => ({ value: s, label: s }))}
          />
          <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={300} placeholder="A little about your style…" />

          <View style={{ gap: spacing.sm }}>
            <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Sizes
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {SIZES.map((s) => (
                <Chip key={s} label={s} shape="square" selected={sizes.includes(s)} onPress={() => toggleSize(s)} />
              ))}
            </View>
          </View>

          <Button title="Save" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
