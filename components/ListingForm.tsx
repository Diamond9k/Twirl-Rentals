import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { createItem, deleteItem, updateItem } from "@/lib/api/items";
import { uploadImages } from "@/lib/api/storage";
import { CONDITIONS, OCCASIONS, SIZES } from "@/lib/constants";
import { spacing } from "@/lib/theme";
import type { Item, ItemCondition, ItemSize } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

interface ListingFormProps {
  existing?: Item;
}

export function ListingForm({ existing }: ListingFormProps) {
  const { userId } = useAuth();
  const [photos, setPhotos] = useState<string[]>(existing?.images ?? []);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [occasion, setOccasion] = useState<string | null>(existing?.occasion ?? null);
  const [size, setSize] = useState<ItemSize | null>(existing?.size ?? null);
  const [condition, setCondition] = useState<ItemCondition | null>(existing?.condition ?? null);
  const [price, setPrice] = useState(existing ? String(existing.price_per_day) : "");
  const [deposit, setDeposit] = useState(existing?.deposit ? String(existing.deposit) : "");
  const [saving, setSaving] = useState(false);

  const validate = (): string | null => {
    if (photos.length === 0) return "Add at least one photo.";
    if (title.trim().length < 3) return "Give your piece a title.";
    const p = Number(price);
    if (!p || p < 1) return "Set a price per day.";
    return null;
  };

  const submit = async (status: "active" | "draft") => {
    if (!userId) return;
    const err = validate();
    if (status === "active" && err) {
      Alert.alert("Almost there", err);
      return;
    }
    setSaving(true);
    try {
      const imageUrls = await uploadImages("item-images", userId, photos);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        occasion,
        size,
        condition,
        price_per_day: Number(price) || 1,
        deposit: Number(deposit) || 0,
        images: imageUrls,
        status,
      };

      if (existing) {
        await updateItem(existing.id, payload);
      } else {
        await createItem(userId, payload);
      }
      router.replace("/(tabs)/you");
    } catch (e) {
      Alert.alert("Couldn't save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert("Remove listing", "This permanently deletes this piece.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(existing.id);
            router.replace("/(tabs)/you");
          } catch (e) {
            Alert.alert("Couldn't remove", (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Photos
        </Text>
        <PhotoPicker photos={photos} onChange={setPhotos} />
        <Text variant="caption">
          Natural light, full piece, clean background.{" "}
          <Text variant="link" onPress={() => router.push("/listing/photo-tips")}>
            See photo guide
          </Text>
        </Text>
      </View>

      <TextField
        label="What is it?"
        placeholder="e.g. Blush floral mini dress"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TextField
        label="Description"
        placeholder="Fabric, fit, styling notes…"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          Occasion
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {OCCASIONS.map((o) => (
            <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(o)} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Select
            label="Size"
            value={size}
            onChange={(v) => setSize(v as ItemSize)}
            sheetTitle="Select size"
            options={SIZES.map((s) => ({ value: s, label: s }))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            label="Condition"
            value={condition}
            onChange={(v) => setCondition(v as ItemCondition)}
            sheetTitle="Condition"
            options={CONDITIONS}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Price per day"
            placeholder="$  0"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Deposit (optional)"
            placeholder="$  0"
            value={deposit}
            onChangeText={(t) => setDeposit(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
            hint="Refundable hold"
          />
        </View>
      </View>

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button
          title={existing ? "Save changes" : "List it"}
          onPress={() => submit("active")}
          loading={saving}
        />
        {existing ? (
          <Button title="Remove listing" variant="ghost" size="md" onPress={confirmDelete} />
        ) : (
          <Button
            title="Save as draft"
            variant="secondary"
            size="md"
            onPress={() => submit("draft")}
            disabled={saving}
          />
        )}
      </View>
    </View>
  );
}
