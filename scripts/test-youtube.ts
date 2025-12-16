
import { searchYouTube } from "../src/lib/youtube";

async function test() {
    console.log("Testing searchYouTube...");
    try {
        const results = await searchYouTube("fitness");
        console.log("Success!");
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
