export type Setting = "outdoors" | "indoors" | "city" | "rural";
export type Season = "summer" | "winter" | "either";

export interface Idea {
  id: string;
  text: string;
  kidFriendly: boolean;
  settings: Setting[];
  cost: "free" | "costs-money";
  season: Season;
}

function idea(
  id: string,
  text: string,
  opts: { kid?: boolean; settings?: Setting[]; cost?: "free" | "costs-money"; season?: Season } = {}
): Idea {
  return {
    id,
    text,
    kidFriendly: opts.kid ?? true,
    settings: opts.settings ?? ["indoors", "outdoors", "city", "rural"],
    cost: opts.cost ?? "free",
    season: opts.season ?? "either",
  };
}

// ~100 low-stakes, casual ideas across food, nature, connection, rest,
// learning, and small adventures. Tagged so the (optional, local-only)
// profile can filter/weight the shuffle — never gate manual entries.
export const IDEA_BANK: Idea[] = [
  // Food
  idea("food-1", "Try a recipe you've never made before", { settings: ["indoors"] }),
  idea("food-2", "Order something new at your usual coffee spot", { cost: "costs-money", settings: ["city", "indoors"] }),
  idea("food-3", "Bake something from scratch", { settings: ["indoors"] }),
  idea("food-4", "Try a cuisine you've never had", { cost: "costs-money", settings: ["city", "indoors"] }),
  idea("food-5", "Make a picnic and eat it somewhere pretty", { settings: ["outdoors"] }),
  idea("food-6", "Visit a farmers market", { settings: ["outdoors", "city"], season: "summer" }),
  idea("food-7", "Cook a meal using only what's already in the fridge", { settings: ["indoors"] }),
  idea("food-8", "Try a local restaurant you've been meaning to check out", { cost: "costs-money", settings: ["city"] }),
  idea("food-9", "Make a dessert you've always wanted to try baking", { settings: ["indoors"] }),
  idea("food-10", "Have breakfast for dinner", { settings: ["indoors"] }),
  idea("food-11", "Try a new-to-you snack from a grocery store aisle you usually skip", { cost: "costs-money", settings: ["indoors", "city"] }),
  idea("food-12", "Make a hot drink from scratch (chai, hot cocoa, mulled cider)", { settings: ["indoors"], season: "winter" }),
  idea("food-13", "Grill something outside", { settings: ["outdoors"], season: "summer" }),
  idea("food-14", "Learn to make one dish from a family recipe", { settings: ["indoors"] }),
  idea("food-15", "Try a food truck", { cost: "costs-money", settings: ["city", "outdoors"] }),

  // Nature / outdoors
  idea("nature-1", "Watch a sunrise", { settings: ["outdoors"] }),
  idea("nature-2", "Watch a sunset somewhere you can see the whole sky", { settings: ["outdoors"] }),
  idea("nature-3", "Go for a walk with no destination", { settings: ["outdoors"] }),
  idea("nature-4", "Find a new park or trail nearby", { settings: ["outdoors"] }),
  idea("nature-5", "Lie in the grass and do nothing for 10 minutes", { settings: ["outdoors"], season: "summer" }),
  idea("nature-6", "Go stargazing", { settings: ["outdoors", "rural"] }),
  idea("nature-7", "Take a photo of something beautiful you'd normally walk past", { settings: ["outdoors"] }),
  idea("nature-8", "Sit outside for a whole cup of coffee or tea", { settings: ["outdoors"] }),
  idea("nature-9", "Go somewhere you can see water (lake, river, ocean, fountain)", { settings: ["outdoors"] }),
  idea("nature-10", "Notice and name five plants or trees you pass", { settings: ["outdoors"] }),
  idea("nature-11", "Go for a bike ride", { settings: ["outdoors"] }),
  idea("nature-12", "Build a snow person or have a snowball fight", { settings: ["outdoors"], season: "winter" }),
  idea("nature-13", "Jump in a pile of leaves", { settings: ["outdoors"], season: "either" }),
  idea("nature-14", "Fly a kite", { settings: ["outdoors"], season: "summer" }),
  idea("nature-15", "Go swimming somewhere new", { settings: ["outdoors"], season: "summer", cost: "costs-money" }),
  idea("nature-16", "Take a walk in the rain (with the right shoes)", { settings: ["outdoors"] }),
  idea("nature-17", "Go camping, even just in the backyard", { settings: ["outdoors", "rural"], season: "summer" }),
  idea("nature-18", "Visit a botanical garden or greenhouse", { cost: "costs-money", settings: ["outdoors", "city"] }),
  idea("nature-19", "Feed the ducks or birds somewhere local", { settings: ["outdoors"] }),
  idea("nature-20", "Go for a hike you haven't done before", { settings: ["outdoors", "rural"] }),

  // Connection
  idea("connect-1", "Call a friend you haven't talked to in a while", { settings: ["indoors"] }),
  idea("connect-2", "Write a real letter or postcard to someone", { settings: ["indoors"] }),
  idea("connect-3", "Have a no-phones dinner with someone", { settings: ["indoors"] }),
  idea("connect-4", "Tell someone specifically what you appreciate about them", { settings: ["indoors", "outdoors"] }),
  idea("connect-5", "Host a low-key game night", { settings: ["indoors"] }),
  idea("connect-6", "Invite someone over for coffee instead of meeting out", { settings: ["indoors"] }),
  idea("connect-7", "Reconnect with an old coworker or classmate", { settings: ["indoors"] }),
  idea("connect-8", "Give someone a genuine compliment out loud", { settings: ["indoors", "outdoors", "city"] }),
  idea("connect-9", "Ask a grandparent or older relative about their life", { settings: ["indoors"] }),
  idea("connect-10", "Plan a small hangout with a group of friends", { settings: ["indoors", "outdoors"] }),
  idea("connect-11", "Send a voice memo instead of a text to someone you miss", { settings: ["indoors"] }),
  idea("connect-12", "Introduce two friends who haven't met", { settings: ["indoors", "outdoors"] }),
  idea("connect-13", "Do something kind for a neighbor", { settings: ["outdoors", "indoors"] }),
  idea("connect-14", "Have a long, unhurried phone call with no agenda", { settings: ["indoors"] }),
  idea("connect-15", "Make plans with someone for next month, right now", { settings: ["indoors"] }),

  // Rest
  idea("rest-1", "Take a nap on purpose, guilt-free", { settings: ["indoors"] }),
  idea("rest-2", "Have a full pajama day", { settings: ["indoors"] }),
  idea("rest-3", "Take a long bath or shower with no rushing", { settings: ["indoors"] }),
  idea("rest-4", "Put your phone away for a whole evening", { settings: ["indoors"] }),
  idea("rest-5", "Sit somewhere quiet and just people-watch", { settings: ["outdoors", "city"] }),
  idea("rest-6", "Light a candle and read for an hour", { settings: ["indoors"] }),
  idea("rest-7", "Make your bed extra nice and get in it early", { settings: ["indoors"] }),
  idea("rest-8", "Say no to one thing this month, on purpose", { settings: ["indoors", "outdoors", "city", "rural"] }),
  idea("rest-9", "Spend an afternoon with absolutely no plans", { settings: ["indoors", "outdoors"] }),
  idea("rest-10", "Declutter one small space (a drawer, a shelf)", { settings: ["indoors"] }),
  idea("rest-11", "Journal for 10 minutes, no structure required", { settings: ["indoors"] }),
  idea("rest-12", "Take a slow, phone-free walk before bed", { settings: ["outdoors"] }),
  idea("rest-13", "Watch a movie you loved as a kid", { settings: ["indoors"] }),
  idea("rest-14", "Sit outside in the sun for 15 minutes", { settings: ["outdoors"], season: "summer" }),
  idea("rest-15", "Make yourself a proper hot drink and sit with it, no screens", { settings: ["indoors"] }),

  // Learning
  idea("learn-1", "Watch a documentary on something you know nothing about", { settings: ["indoors"] }),
  idea("learn-2", "Learn to say five phrases in a new language", { settings: ["indoors"] }),
  idea("learn-3", "Learn one new fact about your city or town", { settings: ["indoors", "city"] }),
  idea("learn-4", "Try a beginner tutorial for a skill you're curious about", { settings: ["indoors"] }),
  idea("learn-5", "Read a book outside your usual genre", { settings: ["indoors"] }),
  idea("learn-6", "Visit a museum or gallery you haven't been to", { cost: "costs-money", settings: ["city", "indoors"] }),
  idea("learn-7", "Listen to a podcast episode on a totally new topic", { settings: ["indoors", "outdoors"] }),
  idea("learn-8", "Learn how something in your house actually works", { settings: ["indoors"] }),
  idea("learn-9", "Take a free online class on something fun", { settings: ["indoors"] }),
  idea("learn-10", "Try to identify a bird, plant, or star you don't know", { settings: ["outdoors"] }),
  idea("learn-11", "Learn a magic trick or card trick", { settings: ["indoors"], kid: true }),
  idea("learn-12", "Try a new stretch or workout style just to see what it's like", { settings: ["indoors", "outdoors"] }),
  idea("learn-13", "Learn the history of the street or neighborhood you live on", { settings: ["indoors", "city"] }),
  idea("learn-14", "Teach yourself a simple new recipe technique", { settings: ["indoors"] }),
  idea("learn-15", "Learn a few chords on an instrument, borrowed or your own", { settings: ["indoors"] }),

  // Small adventures
  idea("adv-1", "Take a different route somewhere you go often", { settings: ["outdoors", "city"] }),
  idea("adv-2", "Visit a part of your town you've never been to", { settings: ["city", "outdoors"] }),
  idea("adv-3", "Take a day trip somewhere within an hour", { cost: "costs-money", settings: ["outdoors", "rural", "city"] }),
  idea("adv-4", "Try a hobby shop, bookstore, or market you've never been into", { settings: ["city", "indoors"] }),
  idea("adv-5", "Go somewhere alone just for the fun of it", { settings: ["outdoors", "city"] }),
  idea("adv-6", "Ride public transit somewhere new just to see what's there", { cost: "costs-money", settings: ["city"] }),
  idea("adv-7", "Visit a tourist spot in your own city like a visitor would", { cost: "costs-money", settings: ["city"] }),
  idea("adv-8", "Try a class you'd normally talk yourself out of (pottery, dance, climbing)", { cost: "costs-money", settings: ["indoors", "city"] }),
  idea("adv-9", "Get lost on purpose for 20 minutes, then find your way back", { settings: ["outdoors", "city"] }),
  idea("adv-10", "Visit a library you've never been to", { settings: ["city", "indoors"] }),
  idea("adv-11", "Try karaoke, even just at home", { settings: ["indoors"] }),
  idea("adv-12", "Go to a small local event (fair, market, open mic)", { settings: ["outdoors", "city"] }),
  idea("adv-13", "Try a board game you've never played", { settings: ["indoors"], kid: true }),
  idea("adv-14", "Take yourself on a solo coffee or movie date", { cost: "costs-money", settings: ["city", "indoors"] }),
  idea("adv-15", "Explore a nearby small town you've never visited", { settings: ["rural", "outdoors"], cost: "costs-money" }),

  // Playful / kid-friendly-leaning
  idea("play-1", "Build a blanket fort", { kid: true, settings: ["indoors"] }),
  idea("play-2", "Do a puzzle from start to finish", { kid: true, settings: ["indoors"] }),
  idea("play-3", "Have a family movie night with snacks", { kid: true, settings: ["indoors"] }),
  idea("play-4", "Draw or color something just for fun, no goal", { kid: true, settings: ["indoors"] }),
  idea("play-5", "Have a backyard water balloon fight", { kid: true, settings: ["outdoors"], season: "summer" }),
  idea("play-6", "Make up a silly family tradition", { kid: true, settings: ["indoors", "outdoors"] }),
  idea("play-7", "Do a scavenger hunt around the house or block", { kid: true, settings: ["indoors", "outdoors"] }),
  idea("play-8", "Bake cookies and decorate them together", { kid: true, settings: ["indoors"] }),
  idea("play-9", "Have a dance party in the living room", { kid: true, settings: ["indoors"] }),
  idea("play-10", "Fly paper airplanes and see whose goes farthest", { kid: true, settings: ["indoors", "outdoors"] }),
  idea("play-11", "Go to a playground, even without kids in tow", { kid: true, settings: ["outdoors"] }),
  idea("play-12", "Play a video game you loved growing up", { kid: true, settings: ["indoors"] }),
  idea("play-13", "Make homemade ice cream or popsicles", { kid: true, settings: ["indoors"], season: "summer" }),
  idea("play-14", "Have a pillow fight", { kid: true, settings: ["indoors"] }),
  idea("play-15", "Visit a petting zoo, aquarium, or farm", { kid: true, settings: ["outdoors", "rural"], cost: "costs-money" }),

  // Pets / misc
  idea("pet-1", "Take your dog somewhere new to sniff around", { settings: ["outdoors"] }),
  idea("pet-2", "Give your pet an extra-long play session", { settings: ["indoors", "outdoors"] }),
  idea("misc-1", "Donate a bag of things you no longer use", { settings: ["indoors"] }),
  idea("misc-2", "Write down three things you're proud of this year", { settings: ["indoors"] }),
  idea("misc-3", "Try going a full day without complaining", { settings: ["indoors", "outdoors", "city", "rural"] }),
  idea("misc-4", "Compliment a stranger's outfit, dog, or garden", { settings: ["outdoors", "city"] }),
  idea("misc-5", "Try a new playlist or genre of music for a whole afternoon", { settings: ["indoors", "outdoors"] }),
  idea("misc-6", "Rearrange a room, even just a little", { settings: ["indoors"] }),
  idea("misc-7", "Watch the whole sunset without checking your phone once", { settings: ["outdoors"] }),
  idea("misc-8", "Try journaling one line every night for a week", { settings: ["indoors"] }),
];
