/**
 * Trottr - Equine Profiles Database & Chat Dialogue
 * Clean, authentic copy without emoji spam.
 */

window.DEFAULT_USER_PROFILE = {
  id: 'my_horse',
  name: 'Whisper',
  age: 6,
  gender: 'Mare',
  breed: 'Thoroughbred',
  breedCategory: 'thoroughbred',
  height: '16.0 hh',
  distance: 0,
  location: 'Lexington, KY',
  tagline: 'Fast on the flat, soft in the bridle',
  bio: "Looking for a handsome stallion or chill gelding to graze peacefully alongside. Passionate about evening turnout, crisp carrot slices, and pretending there's an invisible monster in the corner of the indoor ring.",
  discipline: 'Hunter Under Saddle & Leisure',
  greenFlags: ['Gentle ear scratches', 'Unlimited clover patches', 'Warm fleece blankets'],
  redFlags: ['Plastic feed sacks', 'Thunderstorms', 'Small barking terriers'],
  photo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  svgColor: '#78350f',
  svgMane: '#1c1917'
};

window.HORSE_PROFILES = [
  {
    id: 'barnaby',
    name: 'Barnaby "Thunderhoof"',
    age: 7,
    gender: 'Stallion',
    breed: 'Friesian',
    breedCategory: 'draft',
    height: '16.2 hh',
    distance: 3,
    location: 'Lexington, KY',
    tagline: 'Tall, dark, and terrified of plastic bags in the wind',
    bio: "Grand Prix Dressage prodigy by day, drama king by night. My mane takes 45 minutes to condition and yes, I do flick it when I trot past your barn. Looking for a mare who appreciates majestic slow-motion canters and won't judge me when I refuse to walk past an oddly shaped puddle.",
    discipline: 'Grand Prix Dressage',
    greenFlags: [
      'Fresh alfalfa cubes served warm',
      'Classical piano during schooling',
      'Scratching the spot right behind my withers'
    ],
    redFlags: [
      'Puddles deeper than two inches',
      'Plastic grocery bags blowing across the arena',
      'The farrier wearing his heavy leather apron'
    ],
    audioPersonality: 'dramatic',
    photo: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#1e293b',
    chatStarters: [
      "*prances in place and arches neck majestically*",
      "Hay there... I noticed your coat gleams under the arena lights.",
      "Did somebody say dinner mash is served?"
    ],
    replies: {
      carrot: "*crunches carrot delicately* Ah, organic baby carrots. You clearly have good taste.",
      apple: "*snorts with delight* Sweet gala apples... you just secured a VIP spot in my pasture.",
      hay: "*rolls enthusiastically in the fresh hay* Now this is high-grade timothy.",
      whinny: "*lets out an operatic, resonant whinny across the arena*",
      default: [
        "*flicks mane over shoulder* Tell me more, but please don't touch my forelock before photos.",
        "I was schooling a passage earlier today, but I couldn't stop thinking about our turnout time together.",
        "Quick question: how do you feel about joint turnout? I promise not to hog the water trough.",
        "*softly nuzzles your shoulder looking for peppermints*"
      ]
    }
  },
  {
    id: 'duchess',
    name: 'Duchess Celestia',
    age: 5,
    gender: 'Mare',
    breed: 'Arabian',
    breedCategory: 'arabian',
    height: '15.0 hh',
    distance: 6,
    location: 'Ocala, FL',
    tagline: 'High endurance, higher standards',
    bio: "Endurance champion with pedigree papers dating back generations. If your paddock doesn't have at least 40 acres of lush bluegrass and automated heated waterers, please swipe left. I can gallop 50 miles without breaking a sweat, but I will break your heart.",
    discipline: '50-Mile Endurance',
    greenFlags: [
      'Honeycrisp apples sliced into wedges',
      'High tail-carriage appreciation',
      'Sunset beach gallops without tack'
    ],
    redFlags: [
      'Muddy turnout paddocks',
      'Geldings with zero ambition',
      'Cheap generic fly repellent'
    ],
    audioPersonality: 'dramatic',
    photo: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#831843',
    chatStarters: [
      "*raises tail high in an elegant arch and trots effortlessly past*",
      "Are you fast enough to keep up with me across the dunes?",
      "I only accept suitors who understand proper pedigree."
    ],
    replies: {
      carrot: "*sniffs with mild suspicion before nibbling* ...Adequate. But I prefer peeled.",
      apple: "*eyes widen with joy* Honeycrisp! You actually remembered. You're not like the common farm horses.",
      hay: "*daintily selects only the greenest blades* Exquisite fiber content.",
      whinny: "*high-pitched, melodic soprano whinny that echoes through the valley*",
      default: [
        "My groom wanted to braid my tail today, but I told him true royalty wears it flowing in the wind.",
        "We should plan an endurance trek this weekend. Think you can handle 35 miles at a steady trot?",
        "*tilts head quizzically* Have you checked your ancestral registration papers lately?",
        "I suppose you can escort me to the wash stall later... if you behave."
      ]
    }
  },
  {
    id: 'biscuit',
    name: 'Biscuit the Menace',
    age: 12,
    gender: 'Stallion',
    breed: 'Shetland Pony',
    breedCategory: 'pony',
    height: '10.1 hh',
    distance: 1,
    location: 'Barn 3 (escaped again)',
    tagline: '10.1 hands high, 20 hands of pure chaos',
    bio: "I may be knee-height, but I am the undisputed alpha of this property. I have escaped 14 electric paddocks, stolen 22 lunches from barn kids, and chased an F-250 pickup truck down the driveway. Looking for a partner in crime to help me unlatch the feed room door.",
    discipline: 'Paddock Anarchy',
    greenFlags: [
      'Leaving the feed room latch slightly loose',
      'Sweet molasses feed bins left unattended',
      'Treating me like a terrifying 1,200 lb predator'
    ],
    redFlags: [
      'Children carrying tiny pink saddles',
      'Being called "cute and little"',
      'Anyone attempting to put me on a low-carb diet'
    ],
    audioPersonality: 'shetland',
    photo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#7c2d12',
    chatStarters: [
      "*aggressively paws the ground and squeals at maximum volume*",
      "HAY! I broke out again. Where are you hiding the oats?!",
      "I'm small enough to walk under the fence. Need anything from the house?"
    ],
    replies: {
      carrot: "*CHOMPS VIOLENTLY* MINE! GIMME ANOTHER OR THE TACK ROOM GETS IT!",
      apple: "*takes the entire apple whole and chews aggressively* MORE. BRING ME MORE TRIBUTE.",
      hay: "*kicks the hay bale into the mud and sleeps on it* Alpha behavior only.",
      whinny: "*ear-piercing miniature pony screech of ultimate dominance*",
      default: [
        "I just stared down a 17-hand warmblood until he gave me his hay. Respect the hustle.",
        "Meet me by the tractor at midnight. I know how to turn the diesel engine on.",
        "If they put that grazing muzzle on me one more time, somebody's leather boots are getting eaten.",
        "*aggressively demands forehead scratches while pretending to hate them*"
      ]
    }
  },
  {
    id: 'sterling',
    name: 'Sterling Silver',
    age: 9,
    gender: 'Gelding',
    breed: 'Thoroughbred',
    breedCategory: 'thoroughbred',
    height: '16.3 hh',
    distance: 8,
    location: 'Saratoga Springs, NY',
    tagline: 'Retired racetrack speedster, professional couch potato',
    bio: "Former steeplechaser who decided running really fast in a circle was entirely too much cardio. Now living my best life taking 4-hour naps in the afternoon sun and pretending I didn't hear my trainer calling my name. Seeking a chill companion to share a shady oak tree.",
    discipline: 'Leisure Napping',
    greenFlags: [
      'German mint horse treats',
      'Sleeping flat on my side until the barn manager panics',
      'Cozy heavyweight winter turnouts with neck covers'
    ],
    redFlags: [
      'Anyone mentioning the words "let\'s go for a trot"',
      'Veterinarians carrying large silver cases',
      'Waking up before 10:00 AM'
    ],
    audioPersonality: 'default',
    photo: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#334155',
    chatStarters: [
      "*yawns luxuriously and stretches front legs into a bow*",
      "Hey... you look like someone who understands the value of a solid 3-hour mud nap.",
      "Are you busy? Or can we stand head-to-tail and swish flies for each other?"
    ],
    replies: {
      carrot: "*slowly munches with closed eyes* Mmm... that hits the spot. Wake me up in two hours.",
      apple: "*crunch crunch crunch* Absolute perfection. You're officially on my top 3 favorite equines list.",
      hay: "*tucks into the hay with contented sighs* This is the good second-cutting alfalfa.",
      whinny: "*relaxed, gentle whinny that sounds like a warm greeting*",
      default: [
        "The barn manager thought I was colicking earlier, but honestly I was just enjoying a really deep sleep.",
        "Racehorse past? Ancient history. The only thing I race toward now is the evening feed tub.",
        "Wanna hang out in the north pasture? The grass is knee-deep and the oak shade is prime.",
        "*softly rests chin on your withers and drifts off to sleep*"
      ]
    }
  },
  {
    id: 'buttercup',
    name: 'Buttercup',
    age: 6,
    gender: 'Mare',
    breed: 'Clydesdale',
    breedCategory: 'draft',
    height: '17.3 hh',
    distance: 12,
    location: 'Bozeman, MT',
    tagline: 'Gentle giant with feathers on my feet',
    bio: "Weighing in at a modest 1,950 lbs, I am a certified gentle giant. My hobbies include leaning against fence posts until they gently crack, giving soft nose hugs, and enjoying warm bran mash on snowy mornings. Looking for a sweet soul who isn't intimidated by my size.",
    discipline: 'Heavy Pulling & Sweet Nuzzles',
    greenFlags: [
      'Extra large jumbo grooming brushes',
      'Warm bran mash with molasses drizzle',
      'Standing together peacefully while it snows'
    ],
    redFlags: [
      'Tiny horse trailers with no headroom',
      'People who think draft horses can\'t be delicate',
      'Anyone who complains about muddy feathered fetlocks'
    ],
    audioPersonality: 'draft',
    photo: 'https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#14532d',
    chatStarters: [
      "*gives a colossal, deep, vibrating snort of friendship*",
      "Hello little friend. Don't worry, I watch my hooves very carefully.",
      "Would you like to share my jumbo hay feeder?"
    ],
    replies: {
      carrot: "*inhales the carrot in a single gentle gulp* Delicious. Like a miniature sweet tooth toothpick.",
      apple: "*crushes the apple with thunderous satisfaction* Ahh, you are the sweetest soul in the stable.",
      hay: "*devours three flakes in sixty seconds* Mmm, pure farm-grown fuel.",
      whinny: "*deep, booming baritone whinny that rumbles the barn rafters*",
      default: [
        "My feather boots just got brushed out and I feel like an absolute princess.",
        "If you ever get chilly, you can stand on the leeward side of me—I block 99% of all Arctic winds.",
        "I pulled the carriage in the town parade yesterday. Everyone clapped.",
        "*gently rests her massive, warm forehead against you with a deep sigh*"
      ]
    }
  },
  {
    id: 'ziggy',
    name: 'Ziggy Stardust',
    age: 4,
    gender: 'Stallion',
    breed: 'Appaloosa',
    breedCategory: 'mustang',
    height: '15.2 hh',
    distance: 5,
    location: 'Austin, TX',
    tagline: 'Spotted coat, spotted past, wild spirit',
    bio: "Leopard spotted stallion with rock-and-roll attitude. I don't follow arena lines; I make my own trails. Can slide stop on a dime, spin like a top, and look utterly majestic while doing it. Seeking an adventurous mare who doesn't mind getting dust in her coat.",
    discipline: 'Reining & Trail Blazing',
    greenFlags: [
      'Hand-tooled western leather saddles',
      'Carrots cut into guitar pick shapes',
      'Ripping at full gallop through open sagebrush'
    ],
    redFlags: [
      'Dressage rules requiring boring plain colors',
      'Nosebands that restrict my swagger',
      'Being kept in a stall for more than 4 hours'
    ],
    audioPersonality: 'default',
    photo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#701a75',
    chatStarters: [
      "*executes a smooth rollback at the fence and tips imaginary hat*",
      "Ever seen spots like these before? Every single one tells a story.",
      "Let's jump the pasture fence and go watch the sunset."
    ],
    replies: {
      carrot: "*bites carrot with swagger* Sweet treat for a sweet mare. You've got style.",
      apple: "*crunch* Crisp. Just what I needed after spinning 360s in the sand.",
      hay: "*kicks up dust in celebration* Let's party in the round pen.",
      whinny: "*sharp, lively western whinny with a little vibrato kick at the end*",
      default: [
        "They tried to put a dressage saddle on me once. I bucked so high I saw stars.",
        "Wanna go trail riding tonight under the Texas sky? I know where the sweet wild oats grow.",
        "My coat pattern is 100% natural, no dye jobs here.",
        "*prances sideways showing off his leopard hip blanket*"
      ]
    }
  },
  {
    id: 'lady_penelope',
    name: 'Lady Penelope',
    age: 8,
    gender: 'Mare',
    breed: 'Warmblood',
    breedCategory: 'warmblood',
    height: '16.3 hh',
    distance: 14,
    location: 'Wellington, FL',
    tagline: 'Clear rounds only. Excuses are for ponies',
    bio: "Grand Prix 1.50m show jumper. I don't touch poles, and I don't date horses who knock rails. If you have ever refused a water liverpool fence, do not bother swiping right. Looking for an athletic stallion with serious scope and grand prix ambitions.",
    discipline: '1.50m Show Jumping',
    greenFlags: [
      'Imported Belgian clover hay',
      'Flawless flying lead changes',
      'Sponsor rosettes and gold medal podiums'
    ],
    redFlags: [
      'Hitting the top rail on an oxer',
      'Loose shavings in my mane',
      'Unrefined horses who rush their fences'
    ],
    audioPersonality: 'dramatic',
    photo: 'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#1e3a8a',
    chatStarters: [
      "*approaches the jump standards with absolute precision and focus*",
      "Are you here to win rosettes, or are you just pleasure riding?",
      "My trainer says I have world-class scope. What do you bring to the course?"
    ],
    replies: {
      carrot: "*takes with refined grace* Acceptable reward after jumping a clean round.",
      apple: "*nods approvingly* High antioxidant count. Good for athletic muscle recovery.",
      hay: "*inspects bale thoroughly* High protein timothy. Excellent choice.",
      whinny: "*clear, proud, aristocratic whinny of triumph*",
      default: [
        "We cleared the triple combination today with 12 inches to spare. Standard practice.",
        "Are you entering the winter equestrian festival in Wellington this year?",
        "A proper stallion knows how to maintain rhythm before a triple bar.",
        "*stands squarely with ears pricked forward, ready for the victory lap*"
      ]
    }
  },
  {
    id: 'maverick',
    name: 'Major Maverick',
    age: 10,
    gender: 'Gelding',
    breed: 'Quarter Horse',
    breedCategory: 'mustang',
    height: '15.1 hh',
    distance: 4,
    location: 'Amarillo, TX',
    tagline: 'Golden coat, steady mind, never spooked',
    bio: "Palomino gentleman who has seen it all. Barking dogs, tarps, combine harvesters, low-flying helicopters—nothing phases me. Looking for a steady partner to go on quiet sunset trail rides and maybe share a bag of apple wafers by the campfire.",
    discipline: 'Trail Master & Cow Sorter',
    greenFlags: [
      'Salt lick blocks on a hot afternoon',
      'Endless scratching on the neck muscle',
      'Relaxing on the hitching post watching the world go by'
    ],
    redFlags: [
      'High-strung drama queens',
      'Sudden loud noises when I\'m trying to chew my cud',
      'Synthetic horse treats with artificial coloring'
    ],
    audioPersonality: 'default',
    photo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&w=800&q=80'
    ],
    accentColor: '#b45309',
    chatStarters: [
      "*tips nose down and lets out a warm, welcoming nicker*",
      "Well howdy. You look like you could use a calm partner out on the trail.",
      "Sun's setting over the prairie. Perfect time for some green grass."
    ],
    replies: {
      carrot: "*happily chomps with steady rhythm* Mighty kind of you, partner.",
      apple: "*relishes every drop of juice* Now that's the genuine article right there.",
      hay: "*comfortably grazes* Good sweet grass cures just about everything.",
      whinny: "*deep, comforting nicker that puts everyone at ease*",
      default: [
        "Saw a plastic bag blow right past my nose earlier. Didn't even blink.",
        "If you ever need a buddy who won't spook at rustling leaves, I'm your horse.",
        "Take it easy, one stride at a time. That's the secret to a happy paddock.",
        "*gently rests nose against your neck in quiet companionship*"
      ]
    }
  }
];

// Helper to generate a clean stylized fallback SVG horse avatar
window.getHorseSvgAvatar = function(color = '#78350f', mane = '#1c1917') {
  return `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" fill="#f1f5f9"/>
      <g>
        <path d="M130 380 Q150 220 195 150 Q235 130 255 140 Q290 220 335 380 Z" fill="${color}"/>
        <path d="M195 150 Q165 180 155 250 Q145 310 135 380 L165 380 Q185 280 210 180 Z" fill="${mane}"/>
        <path d="M215 120 Q245 75 275 95 Q295 115 305 175 Q310 215 265 255 Q235 245 220 195 Z" fill="${color}"/>
        <ellipse cx="250" cy="142" rx="8" ry="11" fill="#1e293b"/>
        <circle cx="252" cy="139" r="2.5" fill="#ffffff"/>
        <path d="M230 110 Q225 65 240 60 Q250 75 245 105 Z" fill="${color}"/>
        <path d="M250 105 Q255 60 270 55 Q275 75 263 102 Z" fill="${color}"/>
        <polygon points="255,152 260,162 270,162 262,169 265,179 255,173 245,179 248,169 240,162 250,162" fill="#ffffff"/>
      </g>
    </svg>
  `);
};
