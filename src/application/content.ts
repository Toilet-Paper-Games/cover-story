import type { PromptContentPort, PromptRoundContent, RandomPort } from "./ports";

const rounds: PromptRoundContent[] = [
  {
    incident: { id: "soup-fountain", text: "The town fountain is now soup." },
    angles: [
      { id: "ghost", label: "impress a ghost" },
      { id: "budget", label: "hide budget cuts" },
      { id: "pigeons", label: "get revenge on pigeons" },
      { id: "tourism", label: "boost tourism" },
      { id: "grandma", label: "honor a grandparent" },
      { id: "bet", label: "win a ridiculous bet" },
      { id: "aliens", label: "prepare for aliens" },
      { id: "snack", label: "solve a snack emergency" },
      { id: "mayor", label: "distract the mayor" },
      { id: "record", label: "break a world record" }
    ]
  },
  {
    incident: { id: "moon-missing", text: "The moon went missing for exactly eleven minutes." },
    angles: [
      { id: "proposal", label: "stage a dramatic proposal" },
      { id: "nap", label: "protect a perfect nap" },
      { id: "astronomer", label: "embarrass an astronomer" },
      { id: "electric", label: "lower the electric bill" },
      { id: "werewolf", label: "help a nervous werewolf" },
      { id: "photo", label: "fix a group photo" },
      { id: "coupon", label: "redeem an expired coupon" },
      { id: "owl", label: "settle a dispute with an owl" },
      { id: "birthday", label: "save a forgotten birthday" },
      { id: "audit", label: "avoid an audit" }
    ]
  },
  {
    incident: { id: "museum-pajamas", text: "Every museum statue is wearing matching pajamas." },
    angles: [
      { id: "sleepover", label: "host a secret sleepover" },
      { id: "laundry", label: "test a new laundry service" },
      { id: "critic", label: "confuse an art critic" },
      { id: "warm", label: "keep history warm" },
      { id: "merch", label: "launch suspicious merchandise" },
      { id: "security", label: "distract museum security" },
      { id: "dream", label: "research ancient dreams" },
      { id: "tour", label: "improve the midnight tour" },
      { id: "tailor", label: "impress a famous tailor" },
      { id: "curse", label: "break a tiny curse" }
    ]
  },
  {
    incident: { id: "traffic-ducks", text: "The morning commute was replaced by a parade of ducks." },
    angles: [
      { id: "late", label: "excuse being late" },
      { id: "bread", label: "sell too much bread" },
      { id: "mayor", label: "upstage the mayor" },
      { id: "shortcut", label: "test a secret shortcut" },
      { id: "forecast", label: "prove a weather forecast" },
      { id: "inheritance", label: "claim a strange inheritance" },
      { id: "mascot", label: "find a new team mascot" },
      { id: "music", label: "promote an experimental album" },
      { id: "union", label: "negotiate with the ducks" },
      { id: "parking", label: "eliminate parking fees" }
    ]
  },
  {
    incident: { id: "elevator-cloud", text: "The office elevator now stops at a small cloud." },
    angles: [
      { id: "meeting", label: "escape a long meeting" },
      { id: "coffee", label: "find better coffee" },
      { id: "rent", label: "avoid paying rent" },
      { id: "weather", label: "control the weather" },
      { id: "dragon", label: "hide a baby dragon" },
      { id: "promotion", label: "earn a promotion" },
      { id: "wifi", label: "get stronger Wi-Fi" },
      { id: "plants", label: "rescue the office plants" },
      { id: "view", label: "improve the break-room view" },
      { id: "delivery", label: "receive a mysterious delivery" }
    ]
  },
  {
    incident: { id: "library-spoilers", text: "The library books whisper spoilers after midnight." },
    angles: [
      { id: "book-club", label: "win an intense book club" },
      { id: "librarian", label: "impress the head librarian" },
      { id: "ghostwriter", label: "help a nervous ghostwriter" },
      { id: "fine", label: "erase an overdue fine" },
      { id: "movie", label: "ruin a movie premiere" },
      { id: "sleep", label: "keep students awake" },
      { id: "author", label: "summon a famous author" },
      { id: "podcast", label: "launch a gossip podcast" },
      { id: "mice", label: "negotiate with library mice" },
      { id: "ending", label: "rewrite a terrible ending" }
    ]
  },
  {
    incident: { id: "vending-trophies", text: "Every vending machine only dispenses tiny trophies." },
    angles: [
      { id: "confidence", label: "boost office confidence" },
      { id: "snacks", label: "hide a snack shortage" },
      { id: "champion", label: "declare everyone a champion" },
      { id: "warehouse", label: "empty a trophy warehouse" },
      { id: "coach", label: "impress a retired coach" },
      { id: "currency", label: "invent a new currency" },
      { id: "intern", label: "celebrate an intern" },
      { id: "competition", label: "start a hallway competition" },
      { id: "sponsor", label: "please a strange sponsor" },
      { id: "fortune", label: "fulfill a vending prophecy" }
    ]
  },
  {
    incident: { id: "upward-rain", text: "Rain fell upward over one parking lot." },
    angles: [
      { id: "carwash", label: "avoid paying for a car wash" },
      { id: "umbrella", label: "sell upside-down umbrellas" },
      { id: "cloud", label: "return water to a cloud" },
      { id: "parking", label: "reserve the best parking spot" },
      { id: "scientist", label: "win a science fair" },
      { id: "puddle", label: "remove an embarrassing puddle" },
      { id: "wedding", label: "save an outdoor wedding" },
      { id: "forecast", label: "prove a forecast wrong" },
      { id: "fish", label: "rescue a confused fish" },
      { id: "roof", label: "water a rooftop garden" }
    ]
  },
  {
    incident: { id: "baggage-cakes", text: "The airport baggage carousel delivered birthday cakes." },
    angles: [
      { id: "birthday", label: "save a forgotten birthday" },
      { id: "luggage", label: "distract from lost luggage" },
      { id: "baker", label: "impress an airport baker" },
      { id: "security", label: "test airport security" },
      { id: "pilot", label: "surprise a pilot" },
      { id: "wedding", label: "reroute a wedding reception" },
      { id: "delay", label: "make a flight delay festive" },
      { id: "customs", label: "confuse customs officers" },
      { id: "coupon", label: "redeem a bakery coupon" },
      { id: "record", label: "break a frosting record" }
    ]
  },
  {
    incident: { id: "compliment-lights", text: "Every traffic light started giving personal compliments." },
    angles: [
      { id: "commute", label: "improve the morning commute" },
      { id: "campaign", label: "launch a kindness campaign" },
      { id: "ticket", label: "avoid a traffic ticket" },
      { id: "actor", label: "practice voice acting" },
      { id: "mayor", label: "cheer up the mayor" },
      { id: "dating", label: "promote a dating service" },
      { id: "robot", label: "teach a robot manners" },
      { id: "tourism", label: "attract polite tourists" },
      { id: "driver", label: "encourage one nervous driver" },
      { id: "billboard", label: "replace a broken billboard" }
    ]
  }
];

export class DefaultPromptContent implements PromptContentPort {
  forRound(roundNumber: number, _random: RandomPort): PromptRoundContent {
    return rounds[(roundNumber - 1) % rounds.length]!;
  }
}

export const coverStoryPrompts = new DefaultPromptContent();
