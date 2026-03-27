import { Suspense } from "react";
import { MasterProvider } from "@/components/admin/MasterContext";
import { MasterSiteBar } from "@/components/admin/MasterSiteBar";
import { MainNav } from "@/components/layout/MainNav";
import type { NavQuestionCategory } from "@/lib/data/queries";
import type { RegionRow } from "@/lib/types/database";

type Props = {
  lang: string;
  regions: RegionRow[];
  navQuestionCategories: NavQuestionCategory[];
  children: React.ReactNode;
  isMaster?: boolean;
};

export function AppChrome({
  lang,
  regions,
  navQuestionCategories,
  children,
  isMaster = false,
}: Props) {
  return (
    <MasterProvider isMaster={isMaster}>
    <div className="min-h-screen bg-zinc-50">
      <Suspense
        fallback={
          <header
            className="sticky top-0 z-50 min-h-[57px] w-full border-b border-white/15 shadow-md"
            style={{ backgroundColor: "var(--header-bar-bg)" }}
          />
        }
      >
        <MainNav
          lang={lang}
          regions={regions}
          navQuestionCategories={navQuestionCategories}
        />
      </Suspense>
      <main
        className={`mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8${isMaster ? " pb-20" : ""}`}
      >
        {children}
      </main>
      <MasterSiteBar />
    </div>
    </MasterProvider>
  );
}
