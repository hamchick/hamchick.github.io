import { FeedHint, HomeCard } from "@/components/home-card";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The home page is the pond: it fills the screen (the pond itself lives in the root layout), with a card saying
 * who this is and the ways in. The other pages hold the content.
 */
export default function Home() {
    return (
        <main className="h-svh overflow-hidden">
            <div className="fixed right-4 top-4 z-20 rounded-full bg-bg/70 backdrop-blur-md sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>
            <HomeCard />
            <FeedHint />
        </main>
    );
}
