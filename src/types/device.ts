export type PermissionMode = "unknown" | "granted" | "denied";

export type DeviceState = {
  anonymousDeviceId: string | null;
  deviceReady: boolean;
  permissionMode: PermissionMode;
  readOnlyMode: boolean;
};

export type AppShellState = DeviceState & {
  selectedGridLevel: "nation" | "sido" | "sigungu" | "dong";
  selectedGridCellPath: string | null;
  selectedDongCode: string | null;
  selectedDongName: string | null;
};
