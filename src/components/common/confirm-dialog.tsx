"use client";

type ConfirmDialogProps = {
  title?: string;
  description?: string;
};

export function ConfirmDialog({
  title = "확인이 필요합니다",
  description = "이 작업을 계속 진행할까요?",
}: ConfirmDialogProps) {
  return (
    <dialog open={false}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div>
        <button type="button">취소</button>
        <button type="button">확인</button>
      </div>
    </dialog>
  );
}
