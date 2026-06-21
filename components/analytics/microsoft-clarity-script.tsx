import Script from "next/script";
import {
  CLARITY_PROJECT_ID,
  getClarityBootstrapScript,
} from "@/lib/analytics/clarity-project-id";

export function MicrosoftClarityScript() {
  if (!CLARITY_PROJECT_ID) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: getClarityBootstrapScript(CLARITY_PROJECT_ID),
      }}
    />
  );
}
