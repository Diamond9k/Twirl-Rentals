import type { ReactNode } from "react";
import { ScrollView, View, type ViewStyle } from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

import { colors, SCREEN_PADDING } from "@/lib/theme";

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Apply default horizontal padding. Default true. */
  padded?: boolean;
  edges?: Edge[];
  background?: string;
  contentContainerStyle?: ViewStyle;
  footer?: ReactNode;
}

/**
 * Standard screen frame: safe-area, ivory canvas, optional scroll + sticky
 * footer (used by the "Save" / "Pay" / "Show results" CTAs in the mocks).
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ["top"],
  background = colors.background,
  contentContainerStyle,
  footer,
}: ScreenProps) {
  const padStyle: ViewStyle = padded
    ? { paddingHorizontal: SCREEN_PADDING }
    : {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={edges}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { paddingBottom: footer ? 16 : 40 },
            padStyle,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padStyle, contentContainerStyle]}>{children}</View>
      )}
      {footer ? (
        <View
          style={{
            paddingHorizontal: SCREEN_PADDING,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
