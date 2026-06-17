import { useMemo, useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Text } from "@/components/ui/Text";
import { dateRange, rentalDays } from "@/lib/format";
import { colors, fonts, spacing } from "@/lib/theme";

interface DateRangeSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (start: string, end: string) => void;
  /** yyyy-mm-dd ranges that are already booked. */
  blocked?: { start_date: string; end_date: string }[];
}

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function DateRangeSheet({ visible, onClose, onConfirm, blocked = [] }: DateRangeSheetProps) {
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const blockedDays = useMemo(() => {
    const set = new Set<string>();
    blocked.forEach((b) => eachDay(b.start_date, b.end_date).forEach((d) => set.add(d)));
    return set;
  }, [blocked]);

  const onDayPress = (day: DateData) => {
    const d = day.dateString;
    if (blockedDays.has(d)) return;
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
    } else if (d > start) {
      // Reject ranges that span a blocked day.
      const spans = eachDay(start, d).some((x) => blockedDays.has(x));
      if (spans) {
        setStart(d);
        setEnd(null);
      } else {
        setEnd(d);
      }
    } else {
      setStart(d);
      setEnd(null);
    }
  };

  const marked = useMemo(() => {
    const m: Record<string, object> = {};
    blockedDays.forEach((d) => {
      m[d] = { disabled: true, disableTouchEvent: true };
    });
    if (start && !end) {
      m[start] = { startingDay: true, endingDay: true, color: colors.primary, textColor: colors.white };
    } else if (start && end) {
      eachDay(start, end).forEach((d, i, arr) => {
        m[d] = {
          color: d === start || d === end ? colors.primary : colors.primarySoft,
          textColor: d === start || d === end ? colors.white : colors.primary,
          startingDay: i === 0,
          endingDay: i === arr.length - 1,
        };
      });
    }
    return m;
  }, [start, end, blockedDays]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Sheet visible={visible} onClose={onClose} title="Select your dates">
      <Calendar
        minDate={today}
        markingType="period"
        markedDates={marked}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          textMonthFontFamily: fonts.serifSemibold,
          textMonthFontSize: 18,
          monthTextColor: colors.wine,
        }}
      />

      <Text variant="body" center style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        {start && end
          ? `${dateRange(start, end)} · ${rentalDays(start, end)} nights`
          : "Pick a start and end date"}
      </Text>

      <Button
        title="Confirm dates"
        disabled={!start || !end}
        onPress={() => start && end && onConfirm(start, end)}
      />
    </Sheet>
  );
}
