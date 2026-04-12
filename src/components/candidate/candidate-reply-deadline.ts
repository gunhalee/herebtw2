export type PromiseDeadlineOption =
  | "3months"
  | "6months"
  | "1year"
  | "custom";

export function getPromiseDeadlineValue(input: {
  isPromise: boolean;
  promiseDeadline: PromiseDeadlineOption;
  customDeadline: string;
}) {
  if (!input.isPromise) {
    return null;
  }

  const electionDate = new Date("2026-06-03");

  switch (input.promiseDeadline) {
    case "3months": {
      const date = new Date(electionDate);
      date.setMonth(date.getMonth() + 3);
      return date.toISOString().split("T")[0] ?? null;
    }
    case "6months": {
      const date = new Date(electionDate);
      date.setMonth(date.getMonth() + 6);
      return date.toISOString().split("T")[0] ?? null;
    }
    case "1year": {
      const date = new Date(electionDate);
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString().split("T")[0] ?? null;
    }
    case "custom":
      return input.customDeadline || null;
    default:
      return null;
  }
}
