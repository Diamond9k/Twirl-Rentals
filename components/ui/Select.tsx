import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { colors, radius, spacing, fontSize } from "@/lib/theme";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SelectProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
  sheetTitle?: string;
}

export function Select<T extends string>({
  label,
  placeholder = "Select",
  value,
  options,
  onChange,
  sheetTitle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text variant="label" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          height: 50,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ fontSize: fontSize.base }} color={selected ? colors.text : colors.textFaint}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? label}>
        <View>
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle" style={{ fontSize: fontSize.base }}>
                    {opt.label}
                  </Text>
                  {opt.hint ? <Text variant="caption">{opt.hint}</Text> : null}
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}
