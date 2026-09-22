import { generateFakeResponse } from "./services/fakeGenerator.js";

const events = generateFakeResponse();

console.log("Total events:", events.length);

const isOrdered = events.every(
  (event, index) =>
    event === `Generated response event ${index + 1}`
);

console.log("Events ordered:", isOrdered);

if (events.length < 30 || !isOrdered) {
  process.exit(1);
}

console.log("Benchmark passed");
