import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { Badge, statusTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Text } from "@/components/ui/Text";
import { dateRange } from "@/lib/format";
import { statusLabel } from "@/lib/rentalFlow";
import { colors, radius, spacing, shadow } from "@/lib/theme";
import type { RentalWithRelations } from "@/lib/api/rentals";
import type { Role } from "@/lib/rentalFlow";

interface RentalCardProps {
  rental: RentalWithRelations;
  role: Role;
  onPress?: () => void;
  highlight?: boolean;
}

export function RentalCard({ rental, role, onPress, highlight }: RentalCardProps) {
  const party = role === "renter" ? rental.owner : rental.renter;
  const cover = rental.item?.images?.[0];

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          {
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          },
          shadow.card,
        ]}
      >
        {highlight ? (
          <View style={{ width: 4, backgroundColor: colors.primary }} />
        ) : null}

        <View style={{ width: 96, backgroundColor: colors.surfaceAlt }}>
          {cover ? (
            <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="image-outline" size={22} color={colors.textFaint} />
            </View>
          )}
        </View>

        <View style={{ flex: 1, padding: spacing.lg, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm }}>
            <Text variant="title" style={{ fontSize: 17, flex: 1 }} numberOfLines={1}>
              {rental.item?.title ?? "Item"}
            </Text>
            <Badge label={statusLabel(rental.status)} tone={statusTone(rental.status)} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Avatar uri={party?.avatar_url} name={party?.full_name} size={20} />
            <Text variant="caption" numberOfLines={1}>
              {party?.full_name ?? "—"}
            </Text>
          </View>

          <Text variant="caption">{dateRange(rental.start_date, rental.end_date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
