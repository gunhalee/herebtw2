export function validatePostContent(content: string) {
  const trimmed = content.trim();

  if (trimmed.length < 1 || trimmed.length > 100) {
    return {
      valid: false,
      message: "내용은 1자 이상 100자 이하로 입력해 주세요.",
    };
  }

  return {
    valid: true,
    message: null,
  };
}
