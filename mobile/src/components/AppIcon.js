import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/tokens";

const names = {
  home: "home-outline",
  properties: "map-outline",
  blocks: "layers-outline",
  plants: "leaf-outline",
  crops: "nutrition-outline",
  cropTypes: "git-network-outline",
  varieties: "flower-outline",
  plantInventory: "grid-outline",
  workAssignments: "briefcase-outline",
  workActivities: "construct-outline",
  attendanceQuick: "calendar-outline",
  labors: "people-outline",
  vendors: "storefront-outline",
  fertilizers: "cube-outline",
  expenses: "wallet-outline",
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
