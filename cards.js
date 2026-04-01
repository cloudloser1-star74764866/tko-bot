// ============================================================
//  test BOT — CARD POOL
//  Add your own cards here! Format:
//  { id: 'unique_id', name: 'Character Name', series: 'Series',
//    rarity: 'R/E/L/MY/UR/LT', desc: 'Flavour text' }
//  Images are managed by imageCache.js (auto-fetched from AniList).
// ============================================================

const { PULL_RATES } = require('./config');

const CARDS = [

  // ── Rare (R) ──────────────────────────────────────────────
  { id: 'naruto',         name: 'Naruto Uzumaki',          series: 'Naruto',                            rarity: 'R',  desc: 'The unpredictable ninja of the Hidden Leaf.' },
  { id: 'goku',           name: 'Goku',                    series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'A pure-hearted Saiyan warrior.' },
  { id: 'luffy',          name: 'Monkey D. Luffy',         series: 'One Piece',                         rarity: 'R',  desc: 'Future King of the Pirates.' },
  { id: 'ichigo',         name: 'Ichigo Kurosaki',         series: 'Bleach',                            rarity: 'R',  desc: 'A Soul Reaper protecting the living world.' },
  { id: 'deku',           name: 'Izuku Midoriya',          series: 'My Hero Academia',                  rarity: 'E',  desc: 'The successor of One For All.' },
  { id: 'link',           name: 'Link',                    series: 'The Legend of Zelda',               rarity: 'R',  desc: 'The Hero of Time, chosen by the Triforce.' },
  { id: 'cloud',          name: 'Cloud Strife',            series: 'Final Fantasy VII',                 rarity: 'R',  desc: 'Ex-SOLDIER turned mercenary.' },
  { id: 'eren',           name: 'Eren Yeager',             series: 'Attack on Titan',                   rarity: 'E',  desc: 'A boy who swore to destroy the Titans — and became the Titans.' },
  { id: 'pikachu',        name: 'Pikachu',                 series: 'Pokémon',                           rarity: 'R',  desc: 'The iconic Electric-type partner.' },
  { id: 'spike',          name: 'Spike Spiegel',           series: 'Cowboy Bebop',                      rarity: 'R',  desc: 'A bounty hunter drifting through space.' },
  // Bleach
  { id: 'rukia',          name: 'Rukia Kuchiki',           series: 'Bleach',                            rarity: 'R',  desc: 'A Soul Reaper who changed Ichigo\'s fate forever.' },
  { id: 'renji',          name: 'Renji Abarai',            series: 'Bleach',                            rarity: 'R',  desc: 'A hot-headed lieutenant with a serpent zanpakuto.' },
  { id: 'uryu',           name: 'Uryu Ishida',             series: 'Bleach',                            rarity: 'R',  desc: 'The last Quincy, cold and precise.' },
  { id: 'orihime',        name: 'Orihime Inoue',           series: 'Bleach',                            rarity: 'R',  desc: 'Her Shun Shun Rikka can reject reality itself.' },
  { id: 'chad',           name: 'Yasutora Sado',           series: 'Bleach',                            rarity: 'R',  desc: 'A gentle giant who fights only to protect others.' },
  // JoJo's Bizarre Adventure
  { id: 'joseph',         name: 'Joseph Joestar',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'Your next line is… "I knew you\'d say that!"' },
  { id: 'caesar',         name: 'Caesar Zeppeli',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'A Hamon warrior of fierce elegance.' },
  { id: 'noriaki',        name: 'Noriaki Kakyoin',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'R',  desc: 'Hierophant Green\'s loyal user.' },
  // One Piece
  { id: 'nami',           name: 'Nami',                    series: 'One Piece',                         rarity: 'R',  desc: 'Navigator of the Straw Hats, lover of treasure.' },
  { id: 'usopp',          name: 'Usopp',                   series: 'One Piece',                         rarity: 'R',  desc: 'Brave warrior of the sea — when he needs to be.' },
  { id: 'chopper',        name: 'Tony Tony Chopper',       series: 'One Piece',                         rarity: 'R',  desc: 'A reindeer doctor with a Devil Fruit of many forms.' },
  { id: 'sanji',          name: 'Sanji',                   series: 'One Piece',                         rarity: 'E',  desc: 'A chef whose kicks blaze like a black flame.' },
  { id: 'robin',          name: 'Nico Robin',              series: 'One Piece',                         rarity: 'R',  desc: 'Archaeologist who can read the Poneglyphs.' },
  // Black Clover
  { id: 'asta',           name: 'Asta',                    series: 'Black Clover',                      rarity: 'E',  desc: 'A boy born without magic who never gives up.' },
  { id: 'noelle',         name: 'Noelle Silva',            series: 'Black Clover',                      rarity: 'R',  desc: 'Royal mage of the Black Bulls with water magic.' },
  { id: 'yuno',           name: 'Yuno',                    series: 'Black Clover',                      rarity: 'R',  desc: 'Asta\'s rival, wielder of wind and star magic.' },
  // Demon Slayer
  { id: 'tanjiro',        name: 'Tanjiro Kamado',          series: 'Demon Slayer',                      rarity: 'E',  desc: 'A kind-hearted demon slayer with the Hinokami Kagura.' },
  { id: 'nezuko',         name: 'Nezuko Kamado',           series: 'Demon Slayer',                      rarity: 'R',  desc: 'A demon who still protects humans with fierce love.' },
  { id: 'zenitsu',        name: 'Zenitsu Agatsuma',        series: 'Demon Slayer',                      rarity: 'R',  desc: 'Terrified of everything — until he falls asleep.' },
  { id: 'inosuke',        name: 'Inosuke Hashibira',       series: 'Demon Slayer',                      rarity: 'R',  desc: 'Wild boar-masked warrior raised in the mountains.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'edward',         name: 'Edward Elric',            series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'The Fullmetal Alchemist, short in stature, towering in will.' },
  { id: 'alphonse',       name: 'Alphonse Elric',          series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'A gentle soul sealed inside a suit of armour.' },
  { id: 'winry',          name: 'Winry Rockbell',          series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'Mechanic genius and the heart of the Elric brothers.' },
  // Sword Art Online
  { id: 'kirito',         name: 'Kirito',                  series: 'Sword Art Online',                  rarity: 'R',  desc: 'The Black Swordsman of Aincrad.' },
  { id: 'asuna',          name: 'Asuna',                   series: 'Sword Art Online',                  rarity: 'R',  desc: 'Lightning Flash, the fastest blade in SAO.' },
  // Jujutsu Kaisen
  { id: 'itadori',        name: 'Yuji Itadori',            series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'Host of Ryomen Sukuna, fighting for a proper death.' },
  { id: 'nobara',         name: 'Nobara Kugisaki',         series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Straw doll technique — don\'t underestimate her.' },
  // Fairy Tail
  { id: 'natsu',          name: 'Natsu Dragneel',          series: 'Fairy Tail',                        rarity: 'E',  desc: 'The Fire Dragon Slayer of Fairy Tail.' },
  { id: 'gray',           name: 'Gray Fullbuster',         series: 'Fairy Tail',                        rarity: 'R',  desc: 'An ice mage who keeps losing his clothes.' },
  { id: 'erza',           name: 'Erza Scarlet',            series: 'Fairy Tail',                        rarity: 'E',  desc: 'Titania the Fairy Queen, requipping armour mid-battle.' },
  // Death Note
  { id: 'light',          name: 'Light Yagami',            series: 'Death Note',                        rarity: 'L',  desc: 'I am justice. I am the god of the new world.' },
  { id: 'l',              name: 'L Lawliet',               series: 'Death Note',                        rarity: 'L',  desc: 'The world\'s greatest detective — sitting oddly.' },
  // Mob Psycho 100
  { id: 'mob',            name: 'Shigeo Kageyama',         series: 'Mob Psycho 100',                    rarity: 'L',  desc: 'A boy suppressing psychic power that shakes the earth.' },
  { id: 'reigen',         name: 'Reigen Arataka',          series: 'Mob Psycho 100',                    rarity: 'R',  desc: 'Greatest psychic of the century — citation needed.' },
  // Hunter x Hunter
  { id: 'gon',            name: 'Gon Freecss',             series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'An innocent boy with limitless hidden potential.' },
  { id: 'kurapika',       name: 'Kurapika',                series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'A Kurta survivor driven by vengeance.' },
  // Chainsaw Man
  { id: 'denji',          name: 'Denji',                   series: 'Chainsaw Man',                      rarity: 'E',  desc: 'A devil hunter with a chainsaw heart.' },
  { id: 'power',          name: 'Power',                   series: 'Chainsaw Man',                      rarity: 'R',  desc: 'Blood Fiend and certified chaotic ally.' },
  // Spy x Family
  { id: 'loid',           name: 'Loid Forger',             series: 'Spy x Family',                      rarity: 'R',  desc: 'Spy Twilight, master of disguise and fake fatherhood.' },
  { id: 'yor',            name: 'Yor Forger',              series: 'Spy x Family',                      rarity: 'R',  desc: 'An assassin who genuinely tries her best at cooking.' },
  { id: 'anya',           name: 'Anya Forger',             series: 'Spy x Family',                      rarity: 'R',  desc: 'A telepath who just wants her family to stay together.' },
  // Re:Zero
  { id: 'subaru',         name: 'Subaru Natsuki',          series: 'Re:Zero',                           rarity: 'R',  desc: 'An ordinary teen who dies repeatedly to save others.' },
  { id: 'emilia',         name: 'Emilia',                  series: 'Re:Zero',                           rarity: 'R',  desc: 'A half-elf candidate for the royal throne.' },
  // Gintama
  { id: 'gintoki',        name: 'Gintoki Sakata',          series: 'Gintama',                           rarity: 'E',  desc: 'The White Demon, now running an odd-jobs business.' },
  // Inuyasha
  { id: 'inuyasha',       name: 'Inuyasha',                series: 'Inuyasha',                          rarity: 'R',  desc: 'Half-demon with the Tessaiga, caught between two worlds.' },
  // Steins;Gate
  { id: 'okabe',          name: 'Rintaro Okabe',           series: 'Steins;Gate',                       rarity: 'R',  desc: 'Mad scientist — El Psy Kongroo.' },
  // Yu Yu Hakusho
  { id: 'yusuke',         name: 'Yusuke Urameshi',         series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'A delinquent who died saving a kid and became a Spirit Detective.' },
  // Naruto
  { id: 'sakura',         name: 'Sakura Haruno',           series: 'Naruto',                            rarity: 'R',  desc: 'A kunoichi whose strength and healing rival any shinobi.' },
  // Hajime no Ippo
  { id: 'ippo',           name: 'Makunouchi Ippo',         series: 'Hajime no Ippo',                    rarity: 'R',  desc: 'A kind-hearted boxer whose Dempsey Roll shakes the ring.' },
  // Eromanga-sensei
  { id: 'sagiri',         name: 'Sagiri Izumi',            series: 'Eromanga-sensei',                   rarity: 'R',  desc: 'A reclusive illustrator who draws from behind a locked door.' },
  // Overlord
  { id: 'albedo',         name: 'Albedo',                  series: 'Overlord',                          rarity: 'E',  desc: 'Guardian Overseer of Nazarick, devoted to Ainz without question.' },
  // Death Note
  { id: 'near',           name: 'Near',                    series: 'Death Note',                        rarity: 'L',  desc: 'L\'s true successor — he cornered Kira with logic and toys.' },

  // ── Epic (E) ──────────────────────────────────────────────
  { id: 'sasuke',         name: 'Sasuke Uchiha',           series: 'Naruto',                            rarity: 'E',  desc: 'Last survivor of the Uchiha clan.' },
  { id: 'vegeta',         name: 'Vegeta',                  series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'The proud Prince of all Saiyans.' },
  { id: 'zoro',           name: 'Roronoa Zoro',            series: 'One Piece',                         rarity: 'E',  desc: 'Swordsman aiming to be the world\'s greatest.' },
  { id: 'bakugo',         name: 'Katsuki Bakugo',          series: 'My Hero Academia',                  rarity: 'E',  desc: 'Explosive hero with a fiery spirit.' },
  { id: 'levi',           name: 'Levi Ackerman',           series: 'Attack on Titan',                   rarity: 'E',  desc: 'Humanity\'s strongest soldier.' },
  { id: 'kratos',         name: 'Kratos',                  series: 'God of War',                        rarity: 'MY', desc: 'The Ghost of Sparta, slayer of gods.' },
  { id: 'sephiroth',      name: 'Sephiroth',               series: 'Final Fantasy VII',                 rarity: 'E',  desc: 'A legendary SOLDIER turned destroyer.' },
  { id: 'killua',         name: 'Killua Zoldyck',          series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'An assassin heir with lightning reflexes.' },
  // Bleach
  { id: 'byakuya',        name: 'Byakuya Kuchiki',         series: 'Bleach',                            rarity: 'E',  desc: 'Pride and petals — the captain of the 6th Division.' },
  { id: 'grimmjow',       name: 'Grimmjow Jaegerjaquez',   series: 'Bleach',                            rarity: 'E',  desc: 'Sixth Espada. Chaos given form.' },
  { id: 'ulquiorra',      name: 'Ulquiorra Cifer',         series: 'Bleach',                            rarity: 'E',  desc: 'Fourth Espada. Nihilism made flesh.' },
  // JoJo's Bizarre Adventure
  { id: 'jotaro',         name: 'Jotaro Kujo',             series: 'JoJo\'s Bizarre Adventure',         rarity: 'E',  desc: 'Yare yare daze. Star Platinum: The World.' },
  { id: 'giorno',         name: 'Giorno Giovanna',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'UR', desc: 'I, Giorno Giovanna, have a dream.' },
  { id: 'josuke',         name: 'Josuke Higashikata',      series: 'JoJo\'s Bizarre Adventure',         rarity: 'E',  desc: 'Don\'t insult the hair. Crazy Diamond will fix that.' },
  // One Piece
  { id: 'ace',            name: 'Portgas D. Ace',          series: 'One Piece',                         rarity: 'E',  desc: 'Fire Fist Ace — Whitebeard\'s beloved son.' },
  { id: 'law',            name: 'Trafalgar D. Water Law',  series: 'One Piece',                         rarity: 'E',  desc: 'The Surgeon of Death and his ROOM ability.' },
  { id: 'kid',            name: 'Eustass Kid',             series: 'One Piece',                         rarity: 'E',  desc: 'A magnetic supernova with a reckless streak.' },
  // Black Clover
  { id: 'yami',           name: 'Yami Sukehiro',           series: 'Black Clover',                      rarity: 'E',  desc: 'Dark magic captain who exceeds his limits daily.' },
  { id: 'julius',         name: 'Julius Novachrono',       series: 'Black Clover',                      rarity: 'E',  desc: 'The Wizard King, obsessed with new magic.' },
  // Demon Slayer
  { id: 'rengoku',        name: 'Kyojuro Rengoku',         series: 'Demon Slayer',                      rarity: 'E',  desc: 'Flame Hashira. Set your heart ablaze!' },
  { id: 'tengen',         name: 'Tengen Uzui',             series: 'Demon Slayer',                      rarity: 'E',  desc: 'Sound Hashira. Flamboyant by choice, lethal by skill.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'roy',            name: 'Roy Mustang',             series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'The Flame Alchemist aiming for the top.' },
  { id: 'armstrong',      name: 'Alex Louis Armstrong',    series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'Strong-arm Alchemist — and proud of it.' },
  // Jujutsu Kaisen
  { id: 'gojo',           name: 'Satoru Gojo',             series: 'Jujutsu Kaisen',                    rarity: 'MY', desc: 'The strongest — Infinity in the palm of his hand.' },
  { id: 'todo',           name: 'Aoi Todo',                series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'What\'s your type? Boogie Woogie!' },
  // Fairy Tail
  { id: 'laxus',          name: 'Laxus Dreyar',            series: 'Fairy Tail',                        rarity: 'E',  desc: 'Lightning Dragon Slayer and Fairy Tail\'s thunder god.' },
  { id: 'gildarts',       name: 'Gildarts Clive',          series: 'Fairy Tail',                        rarity: 'E',  desc: 'Fairy Tail\'s ace, whose Crush magic breaks anything.' },
  // Yu Yu Hakusho
  { id: 'hiei',           name: 'Hiei',                    series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'The Forbidden Child, wielder of the Dragon of the Darkness Flame.' },
  { id: 'kurama',         name: 'Kurama',                  series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'A fox demon reborn — his Rose Whip is merciless.' },
  // Re:Zero
  { id: 'rem',            name: 'Rem',                     series: 'Re:Zero',                           rarity: 'E',  desc: 'A demon maid who loves with her whole heart.' },
  // Seven Deadly Sins
  { id: 'ban',            name: 'Ban',                     series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'The Undead Fox\'s Sin of Greed.' },
  // Vinland Saga
  { id: 'thorfinn',       name: 'Thorfinn',                series: 'Vinland Saga',                      rarity: 'E',  desc: 'A boy forged by war who chose to lay down his blade.' },
  { id: 'askeladd',       name: 'Askeladd',                series: 'Vinland Saga',                      rarity: 'E',  desc: 'A cunning chieftain who plays every side.' },
  // Code Geass
  { id: 'lelouch',        name: 'Lelouch vi Britannia',    series: 'Code Geass',                        rarity: 'E',  desc: 'Zero — the chess master who bet the world.' },
  // Gurren Lagann
  { id: 'kamina',         name: 'Kamina',                  series: 'Gurren Lagann',                     rarity: 'E',  desc: 'Believe in the me who believes in you!' },
  // Chainsaw Man
  { id: 'makima',         name: 'Makima',                  series: 'Chainsaw Man',                      rarity: 'E',  desc: 'Control Devil in disguise. Everything bows to her.' },
  // Black Butler
  { id: 'sebastian',      name: 'Sebastian Michaelis',     series: 'Black Butler',                      rarity: 'E',  desc: 'One hell of a butler. Demon by nature.' },

  // ── Legendary (L) ─────────────────────────────────────────
  { id: 'itachi',         name: 'Itachi Uchiha',           series: 'Naruto',                            rarity: 'MY', desc: 'A shinobi who bore the weight of sacrifice.' },
  { id: 'goku_ssj4',      name: 'Goku SSJ4',               series: 'Dragon Ball GT',                    rarity: 'L',  desc: 'The pinnacle of Saiyan transformation.' },
  { id: 'shanks',         name: 'Red-Hair Shanks',         series: 'One Piece',                         rarity: 'MY', desc: 'One of the Four Emperors of the Sea.' },
  { id: 'allmight',       name: 'All Might',               series: 'My Hero Academia',                  rarity: 'L',  desc: 'The Symbol of Peace. Plus Ultra!' },
  { id: 'genos',          name: 'Genos',                   series: 'One Punch Man',                     rarity: 'L',  desc: 'A cyborg hero seeking the truth of his power.' },
  { id: 'hisoka',         name: 'Hisoka Morow',            series: 'Hunter x Hunter',                   rarity: 'L',  desc: 'A twisted magician who lives to fight the strong.' },
  // Bleach
  { id: 'aizen',          name: 'Sosuke Aizen',            series: 'Bleach',                            rarity: 'MY', desc: 'Omniscient, omnipotent — and he\'s been fooling you all along.' },
  { id: 'gin',            name: 'Gin Ichimaru',            series: 'Bleach',                            rarity: 'L',  desc: 'A silver smile that hides the sharpest blade.' },
  // JoJo's Bizarre Adventure
  { id: 'dio',            name: 'Dio Brando',              series: 'JoJo\'s Bizarre Adventure',         rarity: 'L',  desc: 'WRYYY! The World stops time itself.' },
  // One Piece
  { id: 'mihawk',         name: 'Dracule Mihawk',          series: 'One Piece',                         rarity: 'L',  desc: 'Greatest swordsman in the world. Zoro\'s goal.' },
  // Black Clover
  { id: 'licht',          name: 'Licht',                   series: 'Black Clover',                      rarity: 'L',  desc: 'The first Magic Knight, carrying a nation\'s grief.' },
  // Fullmetal Alchemist: Brotherhood
  { id: 'father',         name: 'Father',                  series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'MY', desc: 'The dwarf in the flask who consumed a God.' },
  // Jujutsu Kaisen
  { id: 'yuta',           name: 'Yuta Okkotsu',            series: 'Jujutsu Kaisen',                    rarity: 'L',  desc: 'Special Grade — his cursed energy is unmatched.' },
  // Fairy Tail
  { id: 'mavis',          name: 'Mavis Vermillion',        series: 'Fairy Tail',                        rarity: 'L',  desc: 'First Master of Fairy Tail, the Fairy Tactician.' },
  // Hunter x Hunter
  { id: 'netero',         name: 'Isaac Netero',            series: 'Hunter x Hunter',                   rarity: 'MY', desc: 'The 12th Chairman — a prayer that could kill gods.' },
  // Gurren Lagann
  { id: 'simon',          name: 'Simon the Digger',        series: 'Gurren Lagann',                     rarity: 'UR', desc: 'From a tunnel-digging boy to the driller who pierces the heavens.' },
  // That Time I Got Reincarnated as a Slime
  { id: 'rimuru',         name: 'Rimuru Tempest',          series: 'That Time I Got Reincarnated as a Slime', rarity: 'UR', desc: 'A slime who built a nation and became a True Demon Lord.' },

  // ── Mythical (MY) ─────────────────────────────────────────
  { id: 'madara',         name: 'Madara Uchiha',           series: 'Naruto',                            rarity: 'MY', desc: 'A god of shinobi with unrivalled power.' },
  { id: 'beerus',         name: 'Beerus',                  series: 'Dragon Ball Super',                 rarity: 'MY', desc: 'God of Destruction. Do not wake him.' },
  { id: 'whitebeard',     name: 'Whitebeard',              series: 'One Piece',                         rarity: 'MY', desc: 'The man who stood atop the world.' },
  { id: 'saitama',        name: 'Saitama',                 series: 'One Punch Man',                     rarity: 'MY', desc: 'Defeated every enemy with a single punch.' },
  { id: 'mewtwo',         name: 'Mewtwo',                  series: 'Pokémon',                           rarity: 'MY', desc: 'A genetically engineered Pokémon of immense psy-power.' },
  // New Mythical
  { id: 'yhwach',         name: 'Yhwach',                  series: 'Bleach',                            rarity: 'MY', desc: 'The Almighty — he sees and rewrites all futures.' },
  { id: 'kira',           name: 'Yoshikage Kira',          series: 'JoJo\'s Bizarre Adventure',         rarity: 'MY', desc: 'All he wants is a quiet life. Killer Queen won\'t let you stop him.' },
  { id: 'kaido',          name: 'Kaido',                   series: 'One Piece',                         rarity: 'MY', desc: 'The world\'s strongest creature. Couldn\'t be killed.' },
  { id: 'muzan',          name: 'Muzan Kibutsuji',         series: 'Demon Slayer',                      rarity: 'MY', desc: 'King of Demons. The source of all evil in the night.' },
  { id: 'sukuna',         name: 'Ryomen Sukuna',           series: 'Jujutsu Kaisen',                    rarity: 'MY', desc: 'King of Curses — even sealed in fingers, none compare.' },
  { id: 'acnologia',      name: 'Acnologia',               series: 'Fairy Tail',                        rarity: 'MY', desc: 'The Black Dragon of the Apocalypse, annihilator of magic.' },
  { id: 'escanor',        name: 'Escanor',                 series: 'The Seven Deadly Sins',             rarity: 'MY', desc: 'The Lion\'s Sin of Pride. At noon, none can surpass him.' },

  // ── Ultra-Rare (UR) ───────────────────────────────────────
  { id: 'kaguya',         name: 'Kaguya Ōtsutsuki',        series: 'Naruto',                            rarity: 'UR', desc: 'The progenitor of chakra itself.' },
  { id: 'zeno',           name: 'Zeno',                    series: 'Dragon Ball Super',                 rarity: 'UR', desc: 'The Omni-King who can erase universes.' },
  { id: 'joyboy',         name: 'Joy Boy',                 series: 'One Piece',                         rarity: 'UR', desc: 'A legend from the Void Century.' },
  { id: 'arceus',         name: 'Arceus',                  series: 'Pokémon',                           rarity: 'UR', desc: 'The Alpha Pokémon who shaped the universe.' },
  // New Ultra-Rare
  { id: 'ichigo_bankai',  name: 'Ichigo (True Bankai)',    series: 'Bleach',                            rarity: 'UR', desc: 'The final convergence of Soul Reaper, Hollow, and Quincy.' },
  { id: 'blackbeard',     name: 'Marshall D. Teach',       series: 'One Piece',                         rarity: 'UR', desc: 'Two Devil Fruits. Darkness swallows all, quakes shatter all.' },
  { id: 'dio_wr',         name: 'DIO (The World)',         series: 'JoJo\'s Bizarre Adventure',         rarity: 'UR', desc: 'ZA WARUDO! Time stops for him and him alone.' },

  // ── Limited (LT) ──────────────────────────────────────────
  { id: 'sage_naruto',    name: 'Naruto (Six Paths Sage)', series: 'Naruto',                            rarity: 'LT', desc: 'Bestowed power by the Sage of Six Paths himself.' },
  { id: 'ultra_goku',     name: 'Goku (Ultra Instinct)',   series: 'Dragon Ball Super',                 rarity: 'LT', desc: 'A state beyond the gods — pure autonomous movement.' },
  { id: 'gear5_luffy',    name: 'Luffy (Gear 5)',          series: 'One Piece',                         rarity: 'LT', desc: 'The most ridiculous power in the world. Joy Boy awakened.' },
  { id: 'sukuna_fp',      name: 'Sukuna (Full Power)',     series: 'Jujutsu Kaisen',                    rarity: 'LT', desc: 'Heian-era pinnacle. Cleave and Dismantle erasing existence.' },

  // ── Lookism ───────────────────────────────────────────────
  { id: 'daniel',      name: 'Daniel Park',      series: 'Lookism', rarity: 'R',  desc: 'A boy born ugly who woke up in a different body — and learned what strength really means.' },
  { id: 'jay',         name: 'Jay Hong',         series: 'Lookism', rarity: 'R',  desc: 'Rich, handsome, and fiercely loyal — the brain behind every plan.' },
  { id: 'zack',        name: 'Zack Lee',         series: 'Lookism', rarity: 'R',  desc: 'Taekwondo prodigy who fights with pride and a little too much heart.' },
  { id: 'vasco',       name: 'Vasco',            series: 'Lookism', rarity: 'R',  desc: 'Big Deal\'s muscle and moral compass — a gentle giant with iron fists.' },
  { id: 'crystal',     name: 'Crystal Choi',     series: 'Lookism', rarity: 'R',  desc: 'The most beautiful girl in school — and sharper than anyone gives her credit for.' },
  { id: 'gun',         name: 'Gun Park',         series: 'Lookism', rarity: 'E',  desc: 'Head of Big Deal — one of the most feared fighters in the underground.' },
  { id: 'jake_kim',    name: 'Jake Kim',         series: 'Lookism', rarity: 'E',  desc: 'A powerhouse affiliate whose raw strength puts him above almost everyone.' },
  { id: 'samuel',      name: 'Samuel Seo',       series: 'Lookism', rarity: 'E',  desc: 'Hostel\'s cold, calculating CEO — his fists back up every business deal.' },
  { id: 'johan',       name: 'Johan Seong',      series: 'Lookism', rarity: 'L',  desc: 'Effortlessly magnetic — his presence alone bends the world around him.' },
  { id: 'tom_lee',     name: 'Tom Lee',          series: 'Lookism', rarity: 'L',  desc: 'Hostel\'s strongest enforcer — a fighter whose composure never breaks.' },
  { id: 'eli',         name: 'Eli Jang',         series: 'Lookism', rarity: 'MY', desc: 'One of the most dangerous men alive, feared even by the underground\'s elite.' },

  // ── Baki ──────────────────────────────────────────────────
  { id: 'baki',        name: 'Baki Hanma',       series: 'Baki',    rarity: 'E',  desc: 'Training since childhood to surpass the strongest creature on Earth — his own father.' },
  { id: 'hanayama',    name: 'Kaoru Hanayama',   series: 'Baki',    rarity: 'E',  desc: 'Yakuza boss with a grip that crushes bedrock — brute strength incarnate.' },
  { id: 'doppo',       name: 'Doppo Orochi',     series: 'Baki',    rarity: 'E',  desc: 'Karate grandmaster whose shuto can split a bull\'s horn.' },
  { id: 'retsu',       name: 'Retsu Kaioh',      series: 'Baki',    rarity: 'E',  desc: 'Chinese kenpo master — two thousand years of technique in his strikes.' },
  { id: 'jack',        name: 'Jack Hanma',       series: 'Baki',    rarity: 'E',  desc: 'Yujiro\'s other son — willing to ruin his own body just to win.' },
  { id: 'oliva',       name: 'Biscuit Oliva',    series: 'Baki',    rarity: 'L',  desc: 'The strongest man in the United States — his muscles are armour and weapon in one.' },
  { id: 'shibukawa',   name: 'Goki Shibukawa',   series: 'Baki',    rarity: 'L',  desc: 'Aikido master who redirects any force — age is just a number.' },
  { id: 'pickle',      name: 'Pickle',           series: 'Baki',    rarity: 'MY', desc: 'A prehistoric man preserved in rock — raw instinct and power untouched by civilisation.' },
  { id: 'musashi',     name: 'Miyamoto Musashi', series: 'Baki',    rarity: 'UR', desc: 'The greatest swordsman in history, resurrected — a blade that cuts the untouchable.' },
  { id: 'yujiro',      name: 'Yujiro Hanma',     series: 'Baki',    rarity: 'UR', desc: 'The Ogre. The strongest creature on the face of the Earth. No argument.' },

];

/**
 * Pull a random card weighted by PULL_RATES.
 */
function pullCard() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let chosen = 'R';

  for (const [rarity, rate] of Object.entries(PULL_RATES)) {
    cumulative += rate;
    if (roll < cumulative) { chosen = rarity; break; }
  }

  const pool = CARDS.filter(c => c.rarity === chosen);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

module.exports = { CARDS, pullCard };
