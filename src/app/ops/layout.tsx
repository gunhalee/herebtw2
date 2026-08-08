import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
};

export default function OpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
