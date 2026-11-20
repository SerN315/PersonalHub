import type { IconName } from "@/app/components/ultis/icons";
import type { Source } from "@/app/apis/notifications";

export const SOURCE_ICON: Record<Source, IconName> = { party: "MusicNote01Icon", focus: "Timer01Icon", webhook: "Plug01Icon", test: "Notification02Icon" };
export const SOURCE_NAME: Record<Source, string> = { party: "Radio party", focus: "Focus", webhook: "Other tool", test: "Test" };
