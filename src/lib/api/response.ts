import { NextResponse } from "next/server";
import type { ApiResponse } from "../../types/api";

type ApiError = {
  code: string;
  message: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };

  return NextResponse.json(body, init);
}

export function fail(error: ApiError, status = 400) {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error,
  };

  return NextResponse.json(body, { status });
}
