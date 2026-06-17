import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { colors, radius, shadow, spacing, SCREEN_PADDING } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet (date picker, filters, condition/size pickers, action menus). */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          // Stop propagation so taps inside the sheet don't close it.
          onPress={(e) => e.stopPropagation()}
          style={[
            {
              backgroundColor: colors.background,
              borderTopLeftRadius: radius.xl + 8,
              borderTopRightRadius: radius.xl + 8,
              paddingHorizontal: SCREEN_PADDING,
              paddingTop: spacing.md,
              paddingBottom: spacing.xxxl,
            },
            shadow.floating,
          ]}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.borderStrong,
              marginBottom: spacing.lg,
            }}
          />
          {title ? (
            <Text variant="title" center style={{ marginBottom: spacing.lg }}>
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
}

/** Centered confirmation dialog (sign out, block, delete, mark returned). */
export function Dialog({
  visible,
  onClose,
  children,
}: ConfirmDialogProps & { children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xxl,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            {
              width: "100%",
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing.xxl,
              alignItems: "center",
            },
            shadow.floating,
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
