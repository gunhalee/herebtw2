"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createJsonPostRequestInit,
  fetchClientApiData,
} from "../../lib/api/client";
import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";
import {
  uiColors,
  uiRadius,
  uiShadow,
  uiSpacing,
} from "../../lib/ui/tokens";
import { AdministrativeAreaSearchResults } from "./administrative-area-search-results";

type AdministrativeAreaSearchDialogProps = {
  onClose: () => void;
  onSelect: (selection: ManualAdministrativeLocationSelection) => void;
};

export function AdministrativeAreaSearchDialog({
  onClose,
  onSelect,
}: AdministrativeAreaSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    ManualAdministrativeLocationSelection[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    let disposed = false;

    if (normalizedQuery.length < 2) {
      setResults([]);
      setSearching(false);
      setErrorMessage(null);
      return;
    }

    setSearching(true);
    setErrorMessage(null);

    const timeout = window.setTimeout(() => {
      void fetchClientApiData<{
        locations: ManualAdministrativeLocationSelection[];
      }>({
        errorMessage: "동네를 검색하지 못했습니다.",
        init: {
          ...createJsonPostRequestInit({ query: normalizedQuery }),
          signal: controller.signal,
        },
        path: "/api/location/search",
        timeoutErrorMessage:
          "동네 검색이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
      })
        .then((response) => {
          if (disposed || requestId !== requestIdRef.current) {
            return;
          }

          setResults(response.locations);
          setSearching(false);
        })
        .catch((error: unknown) => {
          if (disposed || requestId !== requestIdRef.current) {
            return;
          }

          setResults([]);
          setSearching(false);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "동네를 검색하지 못했습니다.",
          );
        });
    }, 350);

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-label="작성할 지역 찾기"
      aria-modal="true"
      role="dialog"
      style={{
        alignItems: "flex-end",
        background: uiColors.backdrop,
        display: "flex",
        inset: 0,
        justifyContent: "center",
        position: "fixed",
        zIndex: 18,
      }}
    >
      <section
        style={{
          background: uiColors.surfaceSheet,
          borderRadius: `${uiRadius.xl} ${uiRadius.xl} 0 0`,
          boxShadow: uiShadow.sheet,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.lg,
          maxHeight: "min(76dvh, 640px)",
          maxWidth: "520px",
          padding: `${uiSpacing.xl} ${uiSpacing.pageX} calc(${uiSpacing.xxxl} + env(safe-area-inset-bottom))`,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "grid",
            gridTemplateColumns: "40px 1fr 40px",
          }}
        >
          <span aria-hidden="true" />
          <div style={{ minWidth: 0, textAlign: "center" }}>
            <h2
              style={{
                color: uiColors.textStrong,
                fontSize: "18px",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              작성할 지역 찾기
            </h2>
            <p
              style={{
                color: uiColors.textMuted,
                fontSize: "11px",
                lineHeight: 1.45,
                margin: "3px 0 0",
              }}
            >
              동·읍·면부터 시·도까지 선택할 수 있어요.
            </p>
          </div>
          <button
            aria-label="닫기"
            onClick={onClose}
            style={{
              alignItems: "center",
              appearance: "none",
              background: "transparent",
              border: 0,
              color: uiColors.textMuted,
              cursor: "pointer",
              display: "flex",
              height: "40px",
              justifyContent: "center",
              padding: 0,
              width: "40px",
            }}
            type="button"
          >
            <X aria-hidden="true" size={21} strokeWidth={2} />
          </button>
        </div>

        <label
          style={{
            alignItems: "center",
            background: uiColors.surfaceMuted,
            border: `1px solid ${uiColors.border}`,
            borderRadius: uiRadius.md,
            display: "flex",
            gap: uiSpacing.sm,
            minHeight: "48px",
            padding: `0 ${uiSpacing.md}`,
          }}
        >
          <Search aria-hidden="true" color={uiColors.textMuted} size={19} />
          <input
            autoComplete="off"
            autoFocus
            inputMode="search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 성수1가1동, 서울 강남구"
            style={{
              appearance: "none",
              background: "transparent",
              border: 0,
              color: uiColors.textStrong,
              flex: 1,
              fontSize: "16px",
              minWidth: 0,
              outline: "none",
            }}
            value={query}
          />
        </label>

        <AdministrativeAreaSearchResults
          errorMessage={errorMessage}
          query={query}
          results={results}
          searching={searching}
          onSelect={onSelect}
        />
      </section>
    </div>
  );
}
