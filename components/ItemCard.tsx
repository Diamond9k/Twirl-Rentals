import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { colors, radius, spacing, shadow, fontSize } from "@/lib/theme";
import { currencyCompact } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Text } from "@/components/ui/Text";
import type { Item, ItemWithOwner } from "@/lib/types";

interface ItemCardProps {
  item: Item | ItemWithOwner;
  onPress?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  /** "owner" shows lender row (browse); "save" shows a Save link (profile); "edit" shows a pencil (closet). */
  footer?: "owner" | "save" | "edit" | "status";
  onEdit?: () => void;
}

export function ItemCard({
  item,
  onPress,
  saved,
  onToggleSave,
  footer = "owner",
  onEdit,
}: ItemCardProps) {
  const owner = "owner" in item ? item.owner : null;
  const cover = item.images?.[0];

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          },
          shadow.card,
        ]}
      >
        <View style={{ aspectRatio: 0.82, backgroundColor: colors.surfaceAlt }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" transition={150} />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={28} color={colors.textFaint} />
            </View>
          )}

          {item.size ? (
            <View
              style={{
                position: "absolute",
                top: spacing.sm,
                left: spacing.sm,
                backgroundColor: "rgba(255,255,255,0.92)",
                borderRadius: radius.sm,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text weight="semibold" style={{ fontSize: fontSize.caption }}>
                {item.size}
              </Text>
            </View>
          ) : null}

          {footer === "edit" ? (
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              style={[styleCircle, { top: spacing.sm, right: spacing.sm }]}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </Pressable>
          ) : onToggleSave ? (
            <Pressable
              onPress={onToggleSave}
              hitSlop={8}
              style={[styleCircle, { top: spacing.sm, right: spacing.sm }]}
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={18}
                color={saved ? colors.primary : colors.text}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={{ padding: spacing.md, gap: 4 }}>
          <Text variant="title" numberOfLines={1} style={{ fontSize: fontSize.base }}>
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
            <Text weight="bold" color={colors.primary} style={{ fontSize: fontSize.base }}>
              {currencyCompact(item.price_per_day)}
            </Text>
            <Text variant="caption"> / day</Text>
          </View>

          {footer === "owner" && owner ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Avatar uri={owner.avatar_url} name={owner.full_name} size={22} />
              <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                {owner.full_name?.split(" ")[0]}
                {owner.sorority ? ` · ${owner.sorority}` : ""}
              </Text>
            </View>
          ) : null}

          {footer === "save" ? (
            <Pressable
              onPress={onToggleSave}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={15}
                color={colors.primary}
              />
              <Text variant="link" style={{ fontSize: fontSize.small }}>
                {saved ? "Saved" : "Save"}
              </Text>
            </Pressable>
          ) : null}

          {footer === "status" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor:
                    item.status === "active"
                      ? colors.success
                      : item.status === "rented"
                        ? colors.primary
                        : colors.textFaint,
                }}
              />
              <Text variant="caption">
                {item.status === "active"
                  ? "Available"
                  : item.status === "rented"
                    ? "Rented"
                    : "Draft"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styleCircle = {
  position: "absolute" as const,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.surface,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  ...shadow.card,
};
