"use client";

export type ToastProps = {
  message?: string;
};

export function Toast({ message = "이야기가 등록되었어요" }: ToastProps) {
  return <div role="status">{message}</div>;
}
