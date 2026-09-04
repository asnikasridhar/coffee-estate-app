import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/tokens";

const names = {
  home: "home-outline",
  estate: "business-outline",
  properties: "location-outline",
  blocks: "grid-outline",
  plants: "flower-outline",
  crops: "leaf",
  cropTypes: "git-branch-outline",
  varieties: "leaf-outline",
  plantInventory: "leaf-outline",
  workAssignments: "briefcase-outline",
  workActivities: "clipboard-outline",
  attendanceQuick: "calendar-outline",
  labors: "people-outline",
  vendors: "storefront-outline",
  fertilizers: "flask-outline",
  fertilizer: "flask-outline",
  baseUnits: "scale-outline",
  inventory: "cube-outline",
  expenses: "wallet-outline",
  finance: "cash-outline",
  market: "trending-up-outline",
  sales: "receipt-outline",
  season: "calendar-number-outline",
  wages: "card-outline",
  calendar: "calendar-outline",
  chevron: "chevron-forward",
  reports: "bar-chart-outline",
  rainfallQuick: "rainy-outline",
  yieldQuick: "scale-outline",
  settings: "settings-outline",
  notifications: "notifications-outline",
  more: "menu-outline",
  add: "add-circle-outline",
  search: "search-outline",
  filter: "options-outline",
  warning: "warning-outline",
  success: "checkmark-circle-outline",
  back: "chevron-back",
  edit: "create-outline",
  delete: "trash-outline",
  document: "document-text-outline",
  sheet: "grid-outline",
};
export default function AppIcon({ name, size = 22, color = colors.text }) {
  return (
    <Ionicons
      name={names[name] || name || "grid-outline"}
      size={size}
      color={color}
    />
  );
}
