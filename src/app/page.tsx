import { FeedHint, HomeCard } from "@/components/home-card";

/**
 * The home page is the pond: it fills the screen (the pond itself lives in the root layout), with a card saying
 * who this is and the ways in. The other pages hold the content. The site header sits on top; on a phone it keeps
 * only the logo and the theme toggle here, and the card's links do the rest.
 */
export default function Home() {
    return (
        <main className="h-svh overflow-hidden">
            <HomeCard />
            <FeedHint />
        </main>
    );
}
