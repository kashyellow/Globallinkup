import { ClosingCta } from "./closing-cta";
import { DispatchesSection } from "./dispatches-section";
import { Hero } from "./hero";
import { MarketplaceSection } from "./marketplace-section";
import { PeopleSection } from "./people-section";
import { StepsSection } from "./steps-section";

/**
 * Marketing landing page.
 *
 * Section order follows the reference mockup: hero, protocol, directory,
 * dispatches, marketplace, closing ask. The marketing shell supplies the header,
 * footer and the cream/grain backdrop.
 */
export function LandingView() {
  return (
    <>
      <Hero />
      <StepsSection />
      <PeopleSection />
      <DispatchesSection />
      <MarketplaceSection />
      <ClosingCta />
    </>
  );
}
