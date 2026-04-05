export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}
