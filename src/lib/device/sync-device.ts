import type { AppShellState } from "../../types/device";
import { syncDeviceRepository } from "../posts/repository";

type SyncDeviceInput = {
  anonymousDeviceId: string;
};

export async function syncDevice({
  anonymousDeviceId,
}: SyncDeviceInput): Promise<Pick<AppShellState, "anonymousDeviceId" | "deviceReady">> {
  await syncDeviceRepository(anonymousDeviceId);

  return {
    anonymousDeviceId,
    deviceReady: true,
  };
}
