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
  { id: 'rukia',          name: 'Rukia Kuchiki',           series: 'Bleach',                            rarity: 'L',  desc: 'A Soul Reaper who changed Ichigo\'s fate forever.' },
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
  { id: 'gojo',           name: 'Satoru Gojo',             series: 'Jujutsu Kaisen',                    rarity: 'LT', desc: 'The strongest — Infinity in the palm of his hand.' },
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
  { id: 'yhwach',         name: 'Yhwach',                  series: 'Bleach',                            rarity: 'UR', desc: 'The Almighty — he sees and rewrites all futures.' },
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
  { id: 'daniel',      name: 'Daniel Park',      series: 'Lookism', rarity: 'MY',  desc: 'A boy born ugly who woke up in a different body — and learned what strength really means.' },
  { id: 'jay',         name: 'Jay Hong',         series: 'Lookism', rarity: 'E',  desc: 'Rich, handsome, and fiercely loyal — the brain behind every plan.' },
  { id: 'zack',        name: 'Zack Lee',         series: 'Lookism', rarity: 'MY',  desc: 'Taekwondo prodigy who fights with pride and a little too much heart.' },
  { id: 'vasco',       name: 'Vasco',            series: 'Lookism', rarity: 'L',  desc: 'Big Deal\'s muscle and moral compass — a gentle giant with iron fists.' },
  { id: 'crystal',     name: 'Crystal Choi',     series: 'Lookism', rarity: 'E',  desc: 'The most beautiful girl in school — and sharper than anyone gives her credit for.' },
  { id: 'gun',         name: 'Gun Park',         series: 'Lookism', rarity: 'UR',  desc: 'Head of Big Deal — one of the most feared fighters in the underground.' },
  { id: 'jake_kim',    name: 'Jake Kim',         series: 'Lookism', rarity: 'MY',  desc: 'A powerhouse affiliate whose raw strength puts him above almost everyone.' },
  { id: 'samuel',      name: 'Samuel Seo',       series: 'Lookism', rarity: 'MY',  desc: 'Hostel\'s cold, calculating CEO — his fists back up every business deal.' },
  { id: 'johan',       name: 'Johan Seong',      series: 'Lookism', rarity: 'UR',  desc: 'Effortlessly magnetic — his presence alone bends the world around him.' },
  { id: 'tom_lee',     name: 'Tom Lee',          series: 'Lookism', rarity: 'UR',  desc: 'Hostel\'s strongest enforcer — a fighter whose composure never breaks.' },
  { id: 'eli',              name: 'Eli Jang',                    series: 'Lookism', rarity: 'L', desc: 'One of the most dangerous men alive, feared even by the underground\'s elite.' },
  { id: 'daniel_park_ui_lt', name: 'Daniel Park (Ultra Instinct)', series: 'Lookism', rarity: 'LT', desc: 'A custom card for Drayco.', fixedHp: 200, fixedDmg: 130, technique: true },

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

  // ── Blue Lock ─────────────────────────────────────────────
  { id: 'isagi',         name: 'Yoichi Isagi',           series: 'Blue Lock', rarity: 'R',  desc: 'Ego\'s weapon — a striker who devours any situation and makes it his.' },
  { id: 'bachira',       name: 'Meguru Bachira',          series: 'Blue Lock', rarity: 'R',  desc: 'The monster inside him dribbles past everything — pure instinct unleashed.' },
  { id: 'chigiri',       name: 'Hyoma Chigiri',           series: 'Blue Lock', rarity: 'R',  desc: 'The fastest dribbler in Blue Lock — when he runs, no one catches him.' },
  { id: 'kunigami',      name: 'Rensuke Kunigami',        series: 'Blue Lock', rarity: 'R',  desc: 'Raw power and conviction — his cannon shot punches through any wall.' },
  { id: 'gagamaru',      name: 'Gin Gagamaru',            series: 'Blue Lock', rarity: 'R',  desc: 'A goalkeeper who sees everything — his hands have stopped what should be impossible.' },
  { id: 'nagi_bl',       name: 'Seishiro Nagi',           series: 'Blue Lock', rarity: 'E',  desc: 'A natural-born genius who never practised — talent alone puts him above the rest.' },
  { id: 'barou',         name: 'Shoei Barou',             series: 'Blue Lock', rarity: 'E',  desc: 'Self-proclaimed king of the pitch — his arrogance is backed by every goal he scores.' },
  { id: 'alexis_ness',   name: 'Alexis Ness',             series: 'Blue Lock', rarity: 'E',  desc: 'The German wunderkind\'s shadow — technical vision that sets up the impossible.' },
  { id: 'karasu',        name: 'Tabito Karasu',           series: 'Blue Lock', rarity: 'E',  desc: 'The trickster who sees three moves ahead — unpredictable and infuriatingly effective.' },
  { id: 'zantetsu',      name: 'Zantetsu Tsurugi',        series: 'Blue Lock', rarity: 'E',  desc: 'Speed incarnate — his feet move before the eye can follow.' },
  { id: 'rin_itoshi',    name: 'Rin Itoshi',              series: 'Blue Lock', rarity: 'L',  desc: 'A genius shaped by rivalry — his perfect technique hides a wound that never healed.' },
  { id: 'sae_itoshi',    name: 'Sae Itoshi',              series: 'Blue Lock', rarity: 'L',  desc: 'Japan\'s greatest midfielder — his passes rewrite the rules of the pitch.' },
  { id: 'aiku',          name: 'Oliver Aiku',             series: 'Blue Lock', rarity: 'L',  desc: 'The world\'s best defender — his one-on-one is an absolute wall.' },
  { id: 'shidou',        name: 'Ryusei Shidou',           series: 'Blue Lock', rarity: 'L',  desc: 'Wild chaos given cleats — he plays for the thrill, and the thrill makes him deadly.' },
  { id: 'hiori',         name: 'Yo Hiori',                series: 'Blue Lock', rarity: 'L',  desc: 'Elegant and precise — his spatial awareness turns every touch into art.' },
  { id: 'kaiser',        name: 'Michael Kaiser',          series: 'Blue Lock', rarity: 'MY', desc: 'The pinnacle of European football — Kaiser Impact reshapes the game by force.' },
  { id: 'noa',           name: 'Noel Noa',                series: 'Blue Lock', rarity: 'MY', desc: 'The world\'s greatest striker and architect of Blue Lock — his footsteps define the sport.' },
  { id: 'ego_jinpachi',  name: 'Jinpachi Ego',            series: 'Blue Lock', rarity: 'MY', desc: 'The man who gambled Japan\'s football future on one ideal — ego is everything.' },
  { id: 'isagi_ego',     name: 'Isagi (Awakened Ego)',    series: 'Blue Lock', rarity: 'UR', desc: 'When his ego fully awakens, the entire pitch becomes his weapon.' },
  { id: 'kaiser_impact', name: 'Kaiser (Kaiser Impact)',  series: 'Blue Lock', rarity: 'LT', desc: 'The singular shot that shook world football — nothing stops it once it leaves his foot.' },

  // ── Pokémon ───────────────────────────────────────────────
  { id: 'ditto_lt', name: 'Ditto', series: 'Pokémon', rarity: 'LT', desc: 'The Transform Pokémon. Rearranges its cell structure to become an exact copy of whatever it faces — then becomes even stronger than the original.', dittoCard: true },

  // ── Additional Rare (R) ───────────────────────────────────
  // Naruto
  { id: 'rock_lee',        name: 'Rock Lee',                series: 'Naruto',                            rarity: 'R',  desc: 'A ninja with no talent for ninjutsu who mastered taijutsu through sheer effort.' },
  { id: 'hinata',          name: 'Hinata Hyuga',            series: 'Naruto',                            rarity: 'R',  desc: 'A gentle-fisted kunoichi who found strength through love and determination.' },
  { id: 'kakashi',         name: 'Kakashi Hatake',          series: 'Naruto',                            rarity: 'R',  desc: 'The Copy Ninja — behind that mask lies a thousand copied techniques.' },
  { id: 'shikamaru',       name: 'Shikamaru Nara',          series: 'Naruto',                            rarity: 'R',  desc: 'A lazy genius with an IQ over 200 and the Shadow Possession jutsu.' },
  { id: 'gaara',           name: 'Gaara',                   series: 'Naruto',                            rarity: 'R',  desc: 'Once a monster of sand, now the Kazekage — redeemed through Naruto\'s fists.' },
  { id: 'neji',            name: 'Neji Hyuga',              series: 'Naruto',                            rarity: 'R',  desc: 'A genius of the Hyuga clan who believed fate was absolute — until he didn\'t.' },
  { id: 'kiba',            name: 'Kiba Inuzuka',            series: 'Naruto',                            rarity: 'R',  desc: 'A wild ninja who fights alongside his partner Akamaru as one force.' },
  { id: 'tenten',          name: 'Tenten',                  series: 'Naruto',                            rarity: 'R',  desc: 'A weapons specialist who can pull any tool from her scroll in an instant.' },
  { id: 'ino',             name: 'Ino Yamanaka',            series: 'Naruto',                            rarity: 'R',  desc: 'A kunoichi who controls minds with her clan\'s psychic jutsu.' },
  // Dragon Ball
  { id: 'krillin',         name: 'Krillin',                 series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'Humanity\'s strongest fighter and Goku\'s best friend — Destructo Disc never misses.' },
  { id: 'android18',       name: 'Android 18',              series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'A cyborg whose power exceeds any human — and she knows it.' },
  { id: 'gohan_dbz',       name: 'Gohan',                   series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'A half-Saiyan prodigy whose hidden power once surpassed his father.' },
  { id: 'trunks_dbz',      name: 'Trunks',                  series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'A time-traveling Saiyan prince carrying the weight of a ruined future.' },
  { id: 'piccolo_dbz',     name: 'Piccolo',                 series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'Namekian warrior, mentor, and proud father figure to Gohan.' },
  // One Piece
  { id: 'franky',          name: 'Franky',                  series: 'One Piece',                         rarity: 'R',  desc: 'A cyborg shipwright who built the Thousand Sunny. SUPER!' },
  { id: 'brook',           name: 'Brook',                   series: 'One Piece',                         rarity: 'R',  desc: 'A skeleton musician sailing the seas. Yohohoho — may I see your panties?' },
  { id: 'jinbe',           name: 'Jinbe',                   series: 'One Piece',                         rarity: 'R',  desc: 'Knight of the Sea and Fish-Man Karate master — the Straw Hats\' helmsman.' },
  { id: 'vivi',            name: 'Nefertari Vivi',          series: 'One Piece',                         rarity: 'R',  desc: 'A princess who sailed with pirates to save her kingdom.' },
  // Bleach
  { id: 'toshiro',         name: 'Toshiro Hitsugaya',       series: 'Bleach',                            rarity: 'R',  desc: 'The youngest captain in Soul Society history — ice dragon in the palm of his hand.' },
  { id: 'rangiku',         name: 'Rangiku Matsumoto',       series: 'Bleach',                            rarity: 'R',  desc: 'Ash-type Zanpakuto and unshakeable loyalty beneath a carefree facade.' },
  { id: 'shunsui',         name: 'Shunsui Kyoraku',         series: 'Bleach',                            rarity: 'R',  desc: 'The most laid-back captain — whose games always end in death.' },
  { id: 'kenpachi',        name: 'Kenpachi Zaraki',         series: 'Bleach',                            rarity: 'R',  desc: 'The Captain who never learned his Zanpakuto\'s name — pure bloodlust made flesh.' },
  { id: 'shinji_bl',       name: 'Shinji Hirako',           series: 'Bleach',                            rarity: 'R',  desc: 'A Visored whose inverted Shikai turns the whole world upside down.' },
  // My Hero Academia
  { id: 'todoroki',        name: 'Shoto Todoroki',          series: 'My Hero Academia',                  rarity: 'R',  desc: 'A hero who wields both ice and flame — split by a painful past.' },
  { id: 'uraraka',         name: 'Ochaco Uraraka',          series: 'My Hero Academia',                  rarity: 'R',  desc: 'Zero Gravity quirk — she makes things weightless with a touch.' },
  { id: 'kirishima',       name: 'Eijiro Kirishima',        series: 'My Hero Academia',                  rarity: 'R',  desc: 'Hardening quirk — an unbreakable hero who lives by the code of manliness.' },
  { id: 'tokoyami',        name: 'Fumikage Tokoyami',       series: 'My Hero Academia',                  rarity: 'R',  desc: 'Dark Shadow — a bird-headed hero whose quirk grows stronger in darkness.' },
  { id: 'yaoyorozu',       name: 'Momo Yaoyorozu',          series: 'My Hero Academia',                  rarity: 'R',  desc: 'She can create anything from her body using Creation — a tactical genius.' },
  { id: 'tenya_iida',      name: 'Tenya Iida',              series: 'My Hero Academia',                  rarity: 'R',  desc: 'Engine quirk — class president with jet boosters in his calves.' },
  // Demon Slayer
  { id: 'shinobu',         name: 'Shinobu Kocho',           series: 'Demon Slayer',                      rarity: 'R',  desc: 'The Insect Hashira — a blade too thin to decapitate, so she poisons instead.' },
  { id: 'kanao',           name: 'Kanao Tsuyuri',           series: 'Demon Slayer',                      rarity: 'R',  desc: 'A girl who once left every choice to a coin — now she chooses for herself.' },
  { id: 'genya',           name: 'Genya Shinazugawa',       series: 'Demon Slayer',                      rarity: 'R',  desc: 'No breath form — he eats demons to steal their regeneration and power.' },
  // Jujutsu Kaisen
  { id: 'megumi',          name: 'Megumi Fushiguro',        series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Ten Shadows — he summons divine shikigami through a shaded domain.' },
  { id: 'maki',            name: 'Maki Zenin',              series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Born without cursed energy — she makes up for it with weapons and raw fury.' },
  { id: 'inumaki',         name: 'Toge Inumaki',            series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'Cursed Speech — his words carry power that forces reality to obey.' },
  // Attack on Titan
  { id: 'mikasa',          name: 'Mikasa Ackerman',         series: 'Attack on Titan',                   rarity: 'R',  desc: 'The greatest soldier of her generation — and she fights for one person.' },
  { id: 'armin',           name: 'Armin Arlert',            series: 'Attack on Titan',                   rarity: 'R',  desc: 'A strategic genius who inherited the Colossal Titan — his mind wins wars.' },
  { id: 'hange',           name: 'Hange Zoe',               series: 'Attack on Titan',                   rarity: 'R',  desc: 'Titan-obsessed scientist and Survey Corps commander who dove into danger.' },
  { id: 'jean',            name: 'Jean Kirstein',           series: 'Attack on Titan',                   rarity: 'R',  desc: 'The realist who wanted a safe life — became a soldier worth fighting beside.' },
  // Hunter x Hunter
  { id: 'leorio',          name: 'Leorio Paradinight',      series: 'Hunter x Hunter',                   rarity: 'R',  desc: 'A loudmouth who wants to be a doctor — and punched a god-king on live TV.' },
  // Fairy Tail
  { id: 'wendy',           name: 'Wendy Marvell',           series: 'Fairy Tail',                        rarity: 'R',  desc: 'Sky Dragon Slayer — gentle healer who can also level cities with wind.' },
  { id: 'cana',            name: 'Cana Alberona',           series: 'Fairy Tail',                        rarity: 'R',  desc: 'Card magic and an iron liver — one of Fairy Tail\'s oldest members.' },
  { id: 'mirajane',        name: 'Mirajane Strauss',        series: 'Fairy Tail',                        rarity: 'R',  desc: 'The sweetest barmaid who becomes a demon when the bar fight starts.' },
  // FMA
  { id: 'riza_hawkeye',    name: 'Riza Hawkeye',            series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'Mustang\'s loyal adjutant — a sharpshooter who would die for her colonel.' },
  { id: 'maes_hughes',     name: 'Maes Hughes',             series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'A family man who got too close to the truth — beloved by all who knew him.' },
  // Seven Deadly Sins
  { id: 'diane_sins',      name: 'Diane',                   series: 'The Seven Deadly Sins',             rarity: 'R',  desc: 'Giant of the Sins — her earth magic and pure heart shake the battlefield.' },
  { id: 'king_sins',       name: 'King',                    series: 'The Seven Deadly Sins',             rarity: 'R',  desc: 'The Fairy King whose Sacred Treasure Chastiefol protects the forest.' },
  { id: 'gowther_sins',    name: 'Gowther',                 series: 'The Seven Deadly Sins',             rarity: 'R',  desc: 'A doll who can rewrite memories — the Goat\'s Sin of Lust with no heart.' },
  { id: 'merlin_sins',     name: 'Merlin',                  series: 'The Seven Deadly Sins',             rarity: 'R',  desc: 'The greatest mage in Britannia — her true power was sealed by the gods.' },
  // Black Clover
  { id: 'charmy',          name: 'Charmy Pappitson',        series: 'Black Clover',                      rarity: 'R',  desc: 'Cotton magic and an infinite appetite — her wolf spirit devours spells whole.' },
  // Overlord
  { id: 'shalltear',       name: 'Shalltear Bloodfallen',   series: 'Overlord',                          rarity: 'R',  desc: 'A Floor Guardian vampire — one of Nazarick\'s most terrifying and loyal servants.' },
  { id: 'cocytus_ov',      name: 'Cocytus',                 series: 'Overlord',                          rarity: 'R',  desc: 'Insectoid Floor Guardian — a warrior of absolute honor and devastating ice power.' },
  { id: 'demiurge_ov',     name: 'Demiurge',                series: 'Overlord',                          rarity: 'R',  desc: 'Nazarick\'s most intelligent Floor Guardian — every scheme is fourteen steps ahead.' },
  { id: 'mare_ov',         name: 'Mare Bello Fiore',        series: 'Overlord',                          rarity: 'R',  desc: 'A shy dark elf Floor Guardian who can collapse the earth with earth magic.' },
  // Re:Zero
  { id: 'beatrice_rzr',    name: 'Beatrice',                series: 'Re:Zero',                           rarity: 'R',  desc: 'A spirit who waited centuries in a library — now she fights for Subaru.' },
  // Chainsaw Man
  { id: 'beam_csm',        name: 'Beam',                    series: 'Chainsaw Man',                      rarity: 'R',  desc: 'Shark Fiend — a loyal and enthusiastic devil who adores Chainsaw Man.' },
  // Vinland Saga
  { id: 'canute_vs',       name: 'Canute',                  series: 'Vinland Saga',                      rarity: 'R',  desc: 'A prince who became a king by learning what it costs to protect people.' },
  // Spy x Family
  { id: 'damian_sxf',      name: 'Damian Desmond',          series: 'Spy x Family',                      rarity: 'R',  desc: 'A proud student at Eden who pretends to hate Anya — and fools no one.' },
  // Gintama
  { id: 'shinpachi_gin',   name: 'Shinpachi Shimura',       series: 'Gintama',                           rarity: 'R',  desc: 'The straight man of Odd Jobs Gin — his retorts are his greatest weapon.' },
  { id: 'kagura_gin',      name: 'Kagura',                  series: 'Gintama',                           rarity: 'R',  desc: 'A Yato alien with superhuman strength who holds an umbrella and eats constantly.' },
  // Yu Yu Hakusho
  { id: 'kuwabara',        name: 'Kazuma Kuwabara',         series: 'Yu Yu Hakusho',                     rarity: 'R',  desc: 'The hothead with the Spirit Sword — his loyalty never wavers.' },
  // One Punch Man
  { id: 'sonic_opm',       name: 'Speed-o\'-Sound Sonic',   series: 'One Punch Man',                     rarity: 'R',  desc: 'A ninja assassin obsessed with defeating Saitama — faster than the eye can follow.' },
  // Pokémon
  { id: 'charizard',       name: 'Charizard',               series: 'Pokémon',                           rarity: 'R',  desc: 'The Flame Pokémon — a dragon in all but typing, blazing with fiery pride.' },
  { id: 'gengar',          name: 'Gengar',                  series: 'Pokémon',                           rarity: 'R',  desc: 'Shadow Pokémon — hides in darkness, steals warmth, and grins all the while.' },
  { id: 'eevee',           name: 'Eevee',                   series: 'Pokémon',                           rarity: 'R',  desc: 'An Evolution Pokémon of infinite potential — which path will it choose?' },
  // Haikyuu
  { id: 'shoyo_hinata',    name: 'Shoyo Hinata',            series: 'Haikyuu!!',                         rarity: 'R',  desc: 'A short middle blocker whose jump reaches the sky — the Little Giant reborn.' },
  { id: 'tobio_kageyama',  name: 'Tobio Kageyama',          series: 'Haikyuu!!',                         rarity: 'R',  desc: 'The King of the Court — a setter whose genius sets up the impossible.' },
  // Dr. Stone
  { id: 'senku',           name: 'Senku Ishigami',          series: 'Dr. Stone',                         rarity: 'R',  desc: 'Ten billion percent! A science genius who will rebuild civilization alone if he has to.' },
  { id: 'kohaku_stone',    name: 'Kohaku',                  series: 'Dr. Stone',                         rarity: 'R',  desc: 'A warrior from the stone world — fierce, fast, and fiercely protective of her village.' },
  // Solo Leveling
  { id: 'jinwoo_r',        name: 'Sung Jinwoo',             series: 'Solo Leveling',                     rarity: 'R',  desc: 'Once the weakest hunter in Korea — now something far, far greater.' },
  // God of High School
  { id: 'han_daewi',       name: 'Han Daewi',               series: 'The God of High School',            rarity: 'R',  desc: 'A street fighter who entered the tournament to save a dying friend.' },
  // Tower of God
  { id: 'bam_tog',         name: 'Bam',                     series: 'Tower of God',                      rarity: 'R',  desc: 'A boy who climbed the Tower for the one who was his whole world.' },
  { id: 'khun_aguero',     name: 'Khun Aguero Agnis',       series: 'Tower of God',                      rarity: 'R',  desc: 'A strategist whose ice spear and tactical genius open impossible paths.' },
  // Mushoku Tensei
  { id: 'rudeus',          name: 'Rudeus Greyrat',          series: 'Mushoku Tensei',                    rarity: 'R',  desc: 'A reborn prodigy mage — he got a second life and chose to live it fully.' },
  { id: 'eris_mt',         name: 'Eris Boreas Greyrat',     series: 'Mushoku Tensei',                    rarity: 'R',  desc: 'A fierce noble who became a swordswoman of terrifying talent.' },
  { id: 'sylphiette',      name: 'Sylphiette',              series: 'Mushoku Tensei',                    rarity: 'R',  desc: 'A half-elf mage with a gentle heart and magic power far beyond her age.' },
  // Konosuba
  { id: 'kazuma_ksb',      name: 'Kazuma Sato',             series: 'KonoSuba',                          rarity: 'R',  desc: 'An ordinary guy dragged to another world — whose luck is both blessing and curse.' },
  { id: 'aqua_ksb',        name: 'Aqua',                    series: 'KonoSuba',                          rarity: 'R',  desc: 'A useless goddess with God Blow and maximum arrogance — surprisingly divine sometimes.' },
  { id: 'megumin_ksb',     name: 'Megumin',                 series: 'KonoSuba',                          rarity: 'R',  desc: 'Explosion mage! One spell, one explosion, and then she collapses. Worth it.' },
  // Shield Hero
  { id: 'naofumi',         name: 'Naofumi Iwatani',         series: 'The Rising of the Shield Hero',     rarity: 'R',  desc: 'The Shield Hero — betrayed, hardened, and strong enough to carry everything.' },
  { id: 'raphtalia',       name: 'Raphtalia',               series: 'The Rising of the Shield Hero',     rarity: 'R',  desc: 'A demi-human who became a swordwoman of legend beside her Shield Hero.' },
  // Tensura
  { id: 'shion_slime',     name: 'Shion',                   series: 'That Time I Got Reincarnated as a Slime', rarity: 'R', desc: 'Rimuru\'s fearsome secretary — her cooking is deadly but her sword is worse.' },
  { id: 'shuna_slime',     name: 'Shuna',                   series: 'That Time I Got Reincarnated as a Slime', rarity: 'R', desc: 'An Ogre princess whose barrier magic and inner strength protect her nation.' },
  // Danmachi
  { id: 'bell_cranel',     name: 'Bell Cranel',             series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'R', desc: 'A small-town boy whose Argonaut skill grows fastest when hope is all he has.' },
  { id: 'aiz_wallenstein', name: 'Aiz Wallenstein',         series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'R', desc: 'The Sword Princess — Level 6 adventurer whose Airiel wind cuts through floors.' },
  // Frieren
  { id: 'fern_frieren',    name: 'Fern',                    series: 'Frieren: Beyond Journey\'s End',     rarity: 'R',  desc: 'A mage who fires a thousand spells a minute — efficiency elevated to art.' },
  // Neon Genesis Evangelion
  { id: 'shinji_nge',      name: 'Shinji Ikari',            series: 'Neon Genesis Evangelion',           rarity: 'R',  desc: 'A reluctant pilot who climbs into the Eva when no one else can — and hates himself for it.' },
  { id: 'rei_nge',         name: 'Rei Ayanami',             series: 'Neon Genesis Evangelion',           rarity: 'R',  desc: 'First Child — a quiet girl of mystery whose true nature is more than human.' },
  { id: 'asuka_nge',       name: 'Asuka Langley Soryu',     series: 'Neon Genesis Evangelion',           rarity: 'R',  desc: 'Second Child — pride, pain, and Unit-02 painted brilliant red.' },
  // Kakegurui
  { id: 'yumeko',          name: 'Jabami Yumeko',           series: 'Kakegurui',                         rarity: 'R',  desc: 'A compulsive gambler who finds ecstasy in pure risk — she plays to feel alive.' },
  // Assassination Classroom
  { id: 'karma_akabane',   name: 'Karma Akabane',           series: 'Assassination Classroom',           rarity: 'R',  desc: 'The sharpest student in class 3-E — his intellect and cruelty are perfectly paired.' },
  // Berserk
  { id: 'griffith_berserk',name: 'Griffith',                series: 'Berserk',                           rarity: 'R',  desc: 'The White Falcon — a beautiful dreamer who sacrificed everything and everyone for it.' },

  // ── Additional Epic (E) ───────────────────────────────────
  // Naruto
  { id: 'minato',          name: 'Minato Namikaze',         series: 'Naruto',                            rarity: 'E',  desc: 'The Yellow Flash — fastest ninja who ever lived, and Naruto\'s father.' },
  { id: 'tsunade',         name: 'Tsunade',                 series: 'Naruto',                            rarity: 'E',  desc: 'Fifth Hokage — legendary medic with monstrous strength and Creation Rebirth.' },
  { id: 'jiraiya',         name: 'Jiraiya',                 series: 'Naruto',                            rarity: 'E',  desc: 'The Toad Sage — a legend of Konoha who trained the boy who changed the world.' },
  { id: 'orochimaru',      name: 'Orochimaru',              series: 'Naruto',                            rarity: 'E',  desc: 'A Sannin who discarded humanity in pursuit of immortality and all jutsu.' },
  { id: 'pain_nbr',        name: 'Pain (Nagato)',           series: 'Naruto',                            rarity: 'E',  desc: 'Six Paths of Pain — Rinne Rebirth brought the world to its knees.' },
  // Dragon Ball
  { id: 'cell_dbz',        name: 'Cell',                    series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'Perfect Cell — a bio-android who absorbed all of humanity\'s cruelty.' },
  { id: 'frieza_dbz',      name: 'Frieza',                  series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'Emperor of the Universe — his power level sent Goku Super Saiyan for the first time.' },
  { id: 'broly_dbz',       name: 'Broly',                   series: 'Dragon Ball Super',                 rarity: 'E',  desc: 'The Legendary Super Saiyan — a gentle giant turned unstoppable force of nature.' },
  { id: 'vegito',          name: 'Vegito',                  series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'The fusion of Goku and Vegeta — a warrior who combines their best and worst.' },
  // One Piece
  { id: 'doflamingo',      name: 'Donquixote Doflamingo',   series: 'One Piece',                         rarity: 'E',  desc: 'The Heavenly Demon — a Warlord who pulls strings like a puppeteer of chaos.' },
  { id: 'katakuri',        name: 'Charlotte Katakuri',      series: 'One Piece',                         rarity: 'E',  desc: 'Big Mom\'s strongest son — a future-seer whose mochi surpasses rubber.' },
  { id: 'boa_hancock',     name: 'Boa Hancock',             series: 'One Piece',                         rarity: 'E',  desc: 'The Pirate Empress — her love-love beam turns hearts to stone, literally.' },
  // Bleach
  { id: 'unohana',         name: 'Retsu Unohana',           series: 'Bleach',                            rarity: 'E',  desc: 'The first Kenpachi — her healing and combat are equally terrifying.' },
  { id: 'mayuri_bl',       name: 'Mayuri Kurotsuchi',       series: 'Bleach',                            rarity: 'E',  desc: 'Captain of the 12th Division — a mad scientist who always has a drug ready.' },
  { id: 'kisuke',          name: 'Kisuke Urahara',          series: 'Bleach',                            rarity: 'E',  desc: 'Former Captain, shopkeeper, genius — the man who prepared every possible outcome.' },
  // My Hero Academia
  { id: 'hawks_mha',       name: 'Hawks',                   series: 'My Hero Academia',                  rarity: 'E',  desc: 'The Wing Hero — fastest Pro Hero, with feathers sharp enough to end a battle.' },
  { id: 'endeavor_mha',    name: 'Endeavor',                series: 'My Hero Academia',                  rarity: 'E',  desc: 'Flame Pillar — the No. 1 hero whose obsession forged both a career and family pain.' },
  { id: 'twice_mha',       name: 'Twice',                   series: 'My Hero Academia',                  rarity: 'E',  desc: 'Double — a man who can duplicate anything, including an army of himself.' },
  { id: 'toga_mha',        name: 'Toga Himiko',             series: 'My Hero Academia',                  rarity: 'E',  desc: 'Transform — she drinks blood to become anyone, fighting for the right to love.' },
  // Demon Slayer
  { id: 'gyomei',          name: 'Gyomei Himejima',         series: 'Demon Slayer',                      rarity: 'E',  desc: 'Stone Hashira — the strongest Hashira, an immovable giant who weeps in battle.' },
  { id: 'muichiro',        name: 'Muichiro Tokito',         series: 'Demon Slayer',                      rarity: 'E',  desc: 'Mist Hashira — two months into training, already a master of seventh form.' },
  { id: 'sanemi',          name: 'Sanemi Shinazugawa',      series: 'Demon Slayer',                      rarity: 'E',  desc: 'Wind Hashira — his rare blood type can intoxicate demons mid-battle.' },
  { id: 'mitsuri',         name: 'Mitsuri Kanroji',         series: 'Demon Slayer',                      rarity: 'E',  desc: 'Love Hashira — her flexible sword and unique muscles hide a terrifying force.' },
  // Jujutsu Kaisen
  { id: 'nanami',          name: 'Kento Nanami',            series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'A salaryman who became a sorcerer — his Ratio technique guarantees the weak point.' },
  { id: 'choso',           name: 'Choso',                   series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'Oldest of the Death Paintings — his blood manipulation is precise and lethal.' },
  { id: 'mahito',          name: 'Mahito',                  series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'Idle Transfiguration — a Cursed Spirit who reshapes souls like clay.' },
  // Attack on Titan
  { id: 'reiner',          name: 'Reiner Braun',            series: 'Attack on Titan',                   rarity: 'E',  desc: 'The Armored Titan — a fractured warrior who carries two identities in one body.' },
  { id: 'annie',           name: 'Annie Leonhart',          series: 'Attack on Titan',                   rarity: 'E',  desc: 'Female Titan — a combatant of crystalline resolve who encased herself to survive.' },
  { id: 'zeke',            name: 'Zeke Yeager',             series: 'Attack on Titan',                   rarity: 'E',  desc: 'Beast Titan — Eldian royalty with a throwing arm that hurls boulders like baseballs.' },
  { id: 'pieck',           name: 'Pieck Finger',            series: 'Attack on Titan',                   rarity: 'E',  desc: 'Cart Titan — a low-to-the-ground titan of endless endurance and sharp strategy.' },
  // Hunter x Hunter
  { id: 'chrollo',         name: 'Chrollo Lucilfer',        series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'Leader of the Phantom Troupe — he steals Nen abilities and arranges them like art.' },
  { id: 'illumi',          name: 'Illumi Zoldyck',          series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'Killua\'s brother — a killer whose needles reshape minds and wills without mercy.' },
  { id: 'neferpitou',      name: 'Neferpitou',              series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'Royal Guard of the Chimera Ant King — a cat-humanoid whose Nen terrified a Chairman.' },
  { id: 'feitan',          name: 'Feitan Portor',           series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'Phantom Troupe\'s fastest — his Rising Sun technique turns suffering into power.' },
  // Fairy Tail
  { id: 'jellal',          name: 'Jellal Fernandes',        series: 'Fairy Tail',                        rarity: 'E',  desc: 'A celestial wizard who carries the weight of crimes committed under dark control.' },
  { id: 'irene',           name: 'Irene Belserion',         series: 'Fairy Tail',                        rarity: 'E',  desc: 'Scarlet Despair — the most powerful woman in the Spriggan 12, mother of Erza.' },
  // FMA
  { id: 'lust_fma',        name: 'Lust',                    series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'Ultimate Spear — her fingers extend to pierce through anything, including hearts.' },
  { id: 'wrath_fma',       name: 'King Bradley',            series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'Fuhrer President — Wrath\'s Ultimate Eye predicts every sword stroke perfectly.' },
  { id: 'envy_fma',        name: 'Envy',                    series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'A shapeshifter who can become anyone — and hates humans more than anything.' },
  { id: 'greed_fma',       name: 'Greed',                   series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'Ultimate Shield — carbon-hardened skin and the most honest of Father\'s sins.' },
  // Seven Deadly Sins
  { id: 'zeldris',         name: 'Zeldris',                 series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'The Demon King\'s executioner — his Ominous Nebula drains all who face him.' },
  { id: 'meliodas_e',      name: 'Meliodas',                series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'Dragon\'s Sin of Wrath — the Sins\' captain whose Full Counter reflects magic at full power.' },
  { id: 'estarossa',       name: 'Estarossa',               series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'Love commandment — his power seals all who have love in their heart.' },
  // Black Clover
  { id: 'zenon',           name: 'Zenon Zogratis',          series: 'Black Clover',                      rarity: 'E',  desc: 'Bone Magic — a Dark Triad member who can pierce anything with spatial skewers.' },
  { id: 'dante_bc',        name: 'Dante Zogratis',          series: 'Black Clover',                      rarity: 'E',  desc: 'Body Magic — the most powerful Dark Triad member who covets Dante\'s perfection.' },
  { id: 'vanica',          name: 'Vanica Zogratis',         series: 'Black Clover',                      rarity: 'E',  desc: 'Blood Magic — the Dark Triad\'s wildcard who fights for the thrill of battle.' },
  // Overlord
  { id: 'ainz_ooal',       name: 'Ainz Ooal Gown',         series: 'Overlord',                          rarity: 'E',  desc: 'The Sorcerer King — a skeleton god who bluffs his way to world domination.' },
  // Re:Zero
  { id: 'priscilla_rzr',   name: 'Priscilla Barielle',      series: 'Re:Zero',                           rarity: 'E',  desc: 'A candidate whose divine protection bends fortune itself to her whims.' },
  { id: 'wilhelm_rzr',     name: 'Wilhelm van Astrea',      series: 'Re:Zero',                           rarity: 'E',  desc: 'The Sword Demon — a swordsman whose love gave him a reason to become legend.' },
  // Chainsaw Man
  { id: 'aki_hayakawa',    name: 'Aki Hayakawa',            series: 'Chainsaw Man',                      rarity: 'E',  desc: 'A devil hunter who made contracts with three devils for vengeance and duty.' },
  { id: 'himeno_csm',      name: 'Himeno',                  series: 'Chainsaw Man',                      rarity: 'E',  desc: 'Ghost Devil contract — she gave an eye for power and her full body to save a friend.' },
  { id: 'violence_fiend',  name: 'Violence Fiend (Galgali)',series: 'Chainsaw Man',                      rarity: 'E',  desc: 'One of humanity\'s strongest fiends — he wears a mask to protect others from his nature.' },
  // Code Geass
  { id: 'suzaku_cg',       name: 'Suzaku Kururugi',         series: 'Code Geass',                        rarity: 'E',  desc: 'The Knight of Zero — a warrior torn between duty and the friend who destroyed everything.' },
  { id: 'cc_cg',           name: 'C.C.',                    series: 'Code Geass',                        rarity: 'E',  desc: 'The immortal witch who gave Lelouch his Geass — and bears a wish of her own.' },
  // Gurren Lagann
  { id: 'yoko_gl',         name: 'Yoko Littner',            series: 'Gurren Lagann',                     rarity: 'E',  desc: 'A sharpshooter from the underground — her rifle never misses what matters most.' },
  // Vinland Saga
  { id: 'bjorn_vs',        name: 'Bjorn',                   series: 'Vinland Saga',                      rarity: 'E',  desc: 'Askeladd\'s berserker — in the fury of battle, he becomes something beyond human.' },
  // Gintama
  { id: 'takasugi_gin',    name: 'Shinsuke Takasugi',       series: 'Gintama',                           rarity: 'E',  desc: 'The rebel who wants to destroy the world he was forced to endure — pure, burning fury.' },
  // Yu Yu Hakusho
  { id: 'younger_toguro',  name: 'Younger Toguro',          series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'A former hero who chose to become a demon — his 100% power rewrites the fight.' },
  // One Punch Man
  { id: 'bang_opm',        name: 'Bang',                    series: 'One Punch Man',                     rarity: 'E',  desc: 'Silver Fang — an S-Class martial arts master with Water Stream Rock Smashing Fist.' },
  { id: 'tatsumaki',       name: 'Tatsumaki',               series: 'One Punch Man',                     rarity: 'E',  desc: 'Tornado of Terror — the second strongest hero, whose psychokinesis bends armies.' },
  // Pokémon
  { id: 'lucario',         name: 'Lucario',                 series: 'Pokémon',                           rarity: 'E',  desc: 'Aura Pokémon — it reads souls and fires aura spheres that never miss.' },
  { id: 'rayquaza',        name: 'Rayquaza',                series: 'Pokémon',                           rarity: 'E',  desc: 'Sky High Pokémon — ruler of the stratosphere who stops wars between two legendaries.' },
  // Haikyuu
  { id: 'kuroo_hq',        name: 'Tetsuro Kuroo',           series: 'Haikyuu!!',                         rarity: 'E',  desc: 'Nekoma\'s captain — a blocking specialist whose read-blocking stops the unstoppable.' },
  { id: 'ushijima_hq',     name: 'Wakatoshi Ushijima',      series: 'Haikyuu!!',                         rarity: 'E',  desc: 'Shiratorizawa\'s ace — left-handed spikes that crash through any block.' },
  // Dr. Stone
  { id: 'tsukasa_stone',   name: 'Tsukasa Shishio',         series: 'Dr. Stone',                         rarity: 'E',  desc: 'The strongest high schooler alive — and the idealist who stood against science itself.' },
  // Solo Leveling
  { id: 'jinwoo_e',        name: 'Sung Jinwoo (Shadow Monarch)', series: 'Solo Leveling',               rarity: 'E',  desc: 'The Shadow Monarch — he commands an army of the dead that grows with every kill.' },
  // Tower of God
  { id: 'rak_tog',         name: 'Rak Wraithraiser',        series: 'Tower of God',                      rarity: 'E',  desc: 'A giant crocodile warrior obsessed with turtles — and terrifyingly powerful in battle.' },
  // Assassination Classroom
  { id: 'korosensei',      name: 'Koro-sensei',             series: 'Assassination Classroom',           rarity: 'E',  desc: 'Mach 20 speed, infinite patience, and a firm belief his students will kill him right.' },
  // Kakegurui
  { id: 'kirari',          name: 'Kirari Momobami',         series: 'Kakegurui',                         rarity: 'E',  desc: 'Student council president who runs the school as a high-stakes aquarium of risk.' },
  // Berserk
  { id: 'guts_berserk',    name: 'Guts (Black Swordsman)',  series: 'Berserk',                           rarity: 'E',  desc: 'A one-eyed warrior carrying a sword too large to be called a sword — and still swinging.' },

  // ── Additional Legendary (L) ───────────────────────────────
  // Naruto
  { id: 'hashirama',       name: 'Hashirama Senju',         series: 'Naruto',                            rarity: 'L',  desc: 'The First Hokage — God of Shinobi, whose wood-style could bind a tailed beast.' },
  // Dragon Ball
  { id: 'broly_legendary', name: 'Broly (Legendary SS)',    series: 'Dragon Ball Super',                 rarity: 'L',  desc: 'The Legendary Super Saiyan at full power — a force of nature that grows without end.' },
  // One Piece
  { id: 'gol_d_roger',     name: 'Gol D. Roger',            series: 'One Piece',                         rarity: 'L',  desc: 'The King of Pirates — the only man to conquer the Grand Line, laughing to the last.' },
  { id: 'silvers_rayleigh',name: 'Silvers Rayleigh',        series: 'One Piece',                         rarity: 'L',  desc: 'The Dark King — Roger\'s first mate, whose Haki can stop a giant in its tracks.' },
  { id: 'monkey_d_garp',   name: 'Monkey D. Garp',          series: 'One Piece',                         rarity: 'L',  desc: 'The Hero of the Marines — fists strong enough to shatter mountains, no Devil Fruit needed.' },
  // Bleach
  { id: 'yamamoto',        name: 'Genryusai Yamamoto',      series: 'Bleach',                            rarity: 'L',  desc: 'The oldest and strongest captain — his Ryujin Jakka could incinerate all of Soul Society.' },
  { id: 'barragan',        name: 'Barragan Louisenbairn',   series: 'Bleach',                            rarity: 'L',  desc: 'God of Hueco Mundo — his Respira rots everything it touches into ash.' },
  // My Hero Academia
  { id: 'shigaraki',       name: 'Tomura Shigaraki',        series: 'My Hero Academia',                  rarity: 'L',  desc: 'Decay — his touch crumbles everything to dust, and his reach grows without limit.' },
  { id: 'dabi',            name: 'Dabi',                    series: 'My Hero Academia',                  rarity: 'L',  desc: 'Blueflame — a villain whose fire burns hotter than his father ever could.' },
  // Demon Slayer
  { id: 'yoriichi',        name: 'Yoriichi Tsugikuni',      series: 'Demon Slayer',                      rarity: 'L',  desc: 'The first Breath user — a swordsman so far beyond all others that demons feared his name.' },
  // JJK
  { id: 'kenjaku',         name: 'Kenjaku',                 series: 'Jujutsu Kaisen',                    rarity: 'L',  desc: 'An ancient sorcerer who switches bodies across centuries, gathering cursed techniques.' },
  // AoT
  { id: 'ymir_fritz',      name: 'Ymir Fritz',              series: 'Attack on Titan',                   rarity: 'L',  desc: 'The first Titan — her power created an entire race and shaped fifteen centuries of history.' },
  // HxH
  { id: 'meruem',          name: 'Meruem',                  series: 'Hunter x Hunter',                   rarity: 'L',  desc: 'The Chimera Ant King — born perfect, then surpassed perfection in his final hours.' },
  // Fairy Tail
  { id: 'august_ft',       name: 'August',                  series: 'Fairy Tail',                        rarity: 'L',  desc: 'The King of Magic — strongest of the Spriggan 12, he can copy and nullify any spell.' },
  // FMA
  { id: 'van_hohenheim',   name: 'Van Hohenheim',           series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'L',  desc: 'A man who carries half a nation\'s souls — and refused to let their deaths be in vain.' },
  // SDS
  { id: 'demon_king_sins', name: 'Demon King',              series: 'The Seven Deadly Sins',             rarity: 'L',  desc: 'The ruler of the Demon Clan — his Ruler commandment reflects attacks back tenfold.' },
  // Black Clover
  { id: 'megicula',        name: 'Megicula',                series: 'Black Clover',                      rarity: 'L',  desc: 'Curse-Warding Magic — the Queen of Curses whose mere name can kill magic knights.' },
  // Re:Zero
  { id: 'roswaal',         name: 'Roswaal L Mathers',       series: 'Re:Zero',                           rarity: 'L',  desc: 'The Court Mage who follows a gospel — every action calculated across infinite loops.' },
  // Chainsaw Man
  { id: 'quanxi_csm',      name: 'Quanxi',                  series: 'Chainsaw Man',                      rarity: 'L',  desc: 'The first crossbow devil — China\'s strongest, whose speed is beyond human perception.' },
  { id: 'reze_csm',        name: 'Reze',                    series: 'Chainsaw Man',                      rarity: 'L',  desc: 'Bomb Girl — a hybrid whose detonations rewrite the rules of the battlefield.' },
  // Gurren Lagann
  { id: 'lordgenome_gl',   name: 'Lordgenome',              series: 'Gurren Lagann',                     rarity: 'L',  desc: 'The Spiral King — a man who once pierced the heavens, then gave up on humanity.' },
  // YYH
  { id: 'raizen',          name: 'Raizen',                  series: 'Yu Yu Hakusho',                     rarity: 'L',  desc: 'One of the Three Kings — Yusuke\'s ancestor, the most powerful demon to ever live.' },
  // OPM
  { id: 'boros_opm',       name: 'Boros',                   series: 'One Punch Man',                     rarity: 'L',  desc: 'Dominator of the Universe — the only enemy who made Saitama use a serious punch.' },
  // Solo Leveling
  { id: 'thomas_andre',    name: 'Thomas Andre',            series: 'Solo Leveling',                     rarity: 'L',  desc: 'Ruler — the world\'s strongest S-Rank hunter before Jinwoo proved otherwise.' },
  // Tower of God
  { id: 'king_zahard',     name: 'King Zahard',             series: 'Tower of God',                      rarity: 'L',  desc: 'The immortal king who rules the Tower — his absolute power has never been seen in full.' },
  // Slime
  { id: 'veldora_slime',   name: 'Veldora Tempest',         series: 'That Time I Got Reincarnated as a Slime', rarity: 'L', desc: 'A True Dragon who swore friendship to a slime — storm-level power sealed for centuries.' },
  // Frieren
  { id: 'flamme_frieren',  name: 'Flamme',                  series: 'Frieren: Beyond Journey\'s End',     rarity: 'L',  desc: 'The greatest mage in history — she taught Frieren everything, including how to hide power.' },
  // Berserk
  { id: 'femto_griffith',  name: 'Femto',                   series: 'Berserk',                           rarity: 'L',  desc: 'The fifth God Hand — Griffith reborn as an angel of darkness, beyond human reach.' },

  // ── Additional Mythical (MY) ───────────────────────────────
  // Dragon Ball
  { id: 'jiren',           name: 'Jiren',                   series: 'Dragon Ball Super',                 rarity: 'MY', desc: 'The Pride Trooper — a mortal who surpassed the gods through will alone.' },
  // One Piece
  { id: 'monkey_d_dragon', name: 'Monkey D. Dragon',        series: 'One Piece',                         rarity: 'MY', desc: 'The world\'s most wanted man — leader of the Revolutionary Army, Luffy\'s father.' },
  // MHA
  { id: 'all_for_one',     name: 'All For One',             series: 'My Hero Academia',                  rarity: 'MY', desc: 'The ultimate villain — steals quirks and has ruled from the shadows for centuries.' },
  // Demon Slayer
  { id: 'kokushibo',       name: 'Kokushibo',               series: 'Demon Slayer',                      rarity: 'MY', desc: 'Upper Moon One — Yoriichi\'s twin, who chose demonic power over his brother\'s path.' },
  // SDS
  { id: 'supreme_deity',   name: 'Supreme Deity',           series: 'The Seven Deadly Sins',             rarity: 'MY', desc: 'Goddess ruler — her commandment Repose makes demons helpless before her will.' },
  // Black Clover
  { id: 'lucifero_bc',     name: 'Lucifero',                series: 'Black Clover',                      rarity: 'MY', desc: 'The King of Devils — even a fragment of his power warps gravity and reality itself.' },
  // Solo Leveling
  { id: 'jinwoo_monarch',  name: 'Sung Jinwoo (Monarch)',   series: 'Solo Leveling',                     rarity: 'MY', desc: 'The Monarch of Shadows — commanding a shadow army that conquered the world\'s strongest.' },

  // ── Additional Ultra-Rare (UR) ────────────────────────────
  { id: 'whis',            name: 'Whis',                    series: 'Dragon Ball Super',                 rarity: 'UR', desc: 'Beerus\'s attendant and a Guide Angel — casually millions of years ahead of any warrior.' },
  { id: 'hagoromo',        name: 'Hagoromo Otsutsuki',      series: 'Naruto',                            rarity: 'UR', desc: 'The Sage of Six Paths — he split the Ten-Tails and gave ninjas the gift of chakra.' },
  { id: 'lucario_mega',    name: 'Lucario (Mega)',          series: 'Pokémon',                           rarity: 'UR', desc: 'Mega-Evolved — aura spikes erupt from every joint, and the power is beyond measure.' },

  // ── Additional Limited (LT) ───────────────────────────────
  { id: 'meruem_awakened', name: 'Meruem (Post-Rose)',      series: 'Hunter x Hunter',                   rarity: 'LT', desc: 'After the Miniature Rose — the King returned stronger than any being had ever been.' },
  { id: 'yoriichi_lt',     name: 'Yoriichi (Demon Slayer)', series: 'Demon Slayer',                      rarity: 'LT', desc: 'The pinnacle of the Breath of the Sun — a technique that nearly killed Muzan in one battle.' },
  { id: 'roger_conqueror', name: 'Roger (Conqueror)',       series: 'One Piece',                         rarity: 'LT', desc: 'The Pirate King at the peak of his power — Conqueror\'s Haki that shook the world entire.' },

  // ── Additional Danmachi ───────────────────────────────────
  { id: 'hestia_dn',       name: 'Hestia',                  series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'E', desc: 'A minor goddess with a major attitude — Bell\'s Familia goddess who fights for her child.' },

  // ── Additional Slime cards ────────────────────────────────
  { id: 'diablo_slime',    name: 'Diablo',                  series: 'That Time I Got Reincarnated as a Slime', rarity: 'E', desc: 'Rimuru\'s most powerful secretary — an ancient demon who chose to serve for the thrill of it.' },
  { id: 'milim_slime',     name: 'Milim Nava',              series: 'That Time I Got Reincarnated as a Slime', rarity: 'E', desc: 'A Demon Lord of overwhelming power — Dragon Nova can erase a country.' },

  // ── Frieren additions ─────────────────────────────────────
  { id: 'frieren_e',       name: 'Frieren',                 series: 'Frieren: Beyond Journey\'s End',     rarity: 'E',  desc: 'An elf mage who outlived the hero\'s party — a thousand years of magic refinement.' },

  // ── Jogo addition ─────────────────────────────────────────
  { id: 'jogo_jjk',        name: 'Jogo',                    series: 'Jujutsu Kaisen',                    rarity: 'L',  desc: 'A Special Grade Cursed Spirit of maximum heat — he nearly killed Gojo once, almost.' },

  // ── Madness (MD) ─────────────────────────────────────────
  { id: 'scarlet_king', name: 'The Scarlet King', series: 'SCP Foundation', rarity: 'MD', image: process.env.BASE_URL ? `${process.env.BASE_URL}/images/scarlet_king_md.png` : null, desc: 'An entity of infinite destruction imprisoned at the foundation of reality itself. Seven scarlet crowns. The end of all things.' },
  { id: 'jin_mori', name: 'Jin Mori', series: 'The God of High School', rarity: 'MD', specialAbility: 'golden_pupils', desc: 'The Monkey King reborn — his Renewal Taekwondo reaches divine speed. Golden pupils awaken and reality bends to his will.' },

  // ── Support Cards ─────────────────────────────────────────
  { id: 'support_r',  name: 'Swift Pull Token',       series: 'Support', rarity: 'R',  supportCard: true, supportEffect: 'pull_speed',      desc: 'A shimmering token that speeds up pull charge regeneration by 5 seconds. Passive effect while owned.' },
  { id: 'support_e',  name: 'Conquest Expansion',     series: 'Support', rarity: 'E',  supportCard: true, supportEffect: 'extra_conquest',   desc: 'An ancient war banner granting the right to send one additional card on conquest. Passive effect while owned.' },
  { id: 'support_l',  name: 'Eternal Wish Crystal',   series: 'Support', rarity: 'L',  supportCard: true, supportEffect: 'any_wish',         desc: 'A crystal forged from pure desire — allows you to wish for Ultra Rare cards and any Limited card you already own. Passive effect while owned.' },
  { id: 'support_my', name: 'Time Warp Compass',      series: 'Support', rarity: 'MY', supportCard: true, supportEffect: 'half_conquest',    desc: 'A mystical compass that bends time itself — cuts conquest mission duration from 2 hours to 1 hour. Passive effect while owned.' },
  { id: 'support_ur', name: 'Scroll Awakener',        series: 'Support', rarity: 'UR', supportCard: true, supportEffect: 'level_scroll_drop', desc: 'A radiant card that unlocks the power of Level Scrolls — now obtainable from fights, raids, and daily rewards. Passive effect while owned.' },

  // ── Weapon Cards (MY) ─────────────────────────────────────
  { id: 'madara_weapon',      name: "Madara's Gunbai",            series: 'Naruto',                            rarity: 'MY', weaponCard: true, weaponOf: 'madara',      desc: "Madara Uchiha's war fan — capable of deflecting ninjutsu and summoning massive wind attacks." },
  { id: 'itachi_weapon',      name: "Amaterasu & Tsukuyomi",      series: 'Naruto',                            rarity: 'MY', weaponCard: true, weaponOf: 'itachi',      desc: "Itachi's Mangekyou Sharingan techniques — Amaterasu's inextinguishable black flames and Tsukuyomi's inescapable genjutsu that tortures the mind for 72 hours in an instant." },
  { id: 'shanks_weapon',      name: 'Gryphon',                    series: 'One Piece',                         rarity: 'MY', weaponCard: true, weaponOf: 'shanks',      desc: "Shanks' cutlass — one of the most feared swords in the world, carried by an Emperor of the Sea." },
  { id: 'aizen_weapon',       name: 'Kyoka Suigetsu',             series: 'Bleach',                            rarity: 'MY', weaponCard: true, weaponOf: 'aizen',       desc: "Aizen's zanpakuto — its Complete Hypnosis manipulates all five senses of anyone who witnesses its release." },
  { id: 'father_weapon',      name: "Philosopher's Stone",        series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'MY', weaponCard: true, weaponOf: 'father',      desc: "The crimson stone that powers Father's God-like ambitions — forged from countless human souls." },
  { id: 'netero_weapon',      name: '100-Type Guanyin Bodhisattva', series: 'Hunter x Hunter',                 rarity: 'MY', weaponCard: true, weaponOf: 'netero',      desc: "Netero's ultimate prayer technique — summons a colossal deity that strikes with the speed of prayer." },
  { id: 'kratos_weapon',      name: 'Leviathan Axe',              series: 'God of War',                        rarity: 'MY', weaponCard: true, weaponOf: 'kratos',      desc: "The Leviathan Axe — forged by the dwarves Brok and Sindri, imbued with the power of ice and frost." },
  { id: 'kira_weapon',        name: 'Killer Queen',                series: "JoJo's Bizarre Adventure",         rarity: 'MY', weaponCard: true, weaponOf: 'kira',        desc: "Kira's Stand — any object it touches becomes a bomb. There is no escaping Killer Queen's detonation." },
  { id: 'kaido_weapon',       name: 'Haoshoku Kanabo',             series: 'One Piece',                        rarity: 'MY', weaponCard: true, weaponOf: 'kaido',       desc: "Kaido's club — infused with Haoshoku Haki, a single swing from this weapon can level mountains." },
  { id: 'muzan_weapon',       name: 'Blood Demon Blades',          series: 'Demon Slayer',                     rarity: 'MY', weaponCard: true, weaponOf: 'muzan',       desc: "Muzan's razor-sharp blood whips — each tendril carries a lethal curse that disintegrates demon slayers." },
  { id: 'sukuna_weapon',      name: 'Cleave & Dismantle',          series: 'Jujutsu Kaisen',                   rarity: 'MY', weaponCard: true, weaponOf: 'sukuna',      desc: "Sukuna's innate cursed techniques — Cleave adapts to the target's durability; Dismantle cuts everything without discrimination." },
  { id: 'acnologia_weapon',   name: "Acnologia's Dragon Roar",    series: 'Fairy Tail',                        rarity: 'MY', weaponCard: true, weaponOf: 'acnologia',   desc: "The Dragon King's roar — a blast of pure destructive power capable of erasing an entire island." },
  { id: 'escanor_weapon',     name: 'Rhitta',                      series: 'The Seven Deadly Sins',            rarity: 'MY', weaponCard: true, weaponOf: 'escanor',     desc: "The sacred axe of Escanor — so heavy no one else can lift it, yet Escanor wields it with one hand at noon." },
  { id: 'daniel_weapon',      name: "Daniel's Power",              series: 'Lookism',                          rarity: 'MY', weaponCard: true, weaponOf: 'daniel',      desc: "Daniel Park's raw fighting spirit — forged through hardship, his body itself becomes a weapon of unmatched power." },
  { id: 'zack_weapon',        name: "Zack's Counter Hook",         series: 'Lookism',                          rarity: 'MY', weaponCard: true, weaponOf: 'zack',        desc: "Zack Lee's boxing — a counter-fighting style built around reading opponents and delivering devastating hooks at the perfect moment." },
  { id: 'jake_kim_weapon',    name: "Jake's Iron Fists",           series: 'Lookism',                          rarity: 'MY', weaponCard: true, weaponOf: 'jake_kim',    desc: "Jake Kim's devastating punches — raw power refined through years of underground fighting." },
  { id: 'samuel_weapon',      name: "Samuel's Cold Strike",        series: 'Lookism',                          rarity: 'MY', weaponCard: true, weaponOf: 'samuel',      desc: "Samuel Seo's calculated strikes — precision-engineered hits that dismantle opponents with surgical efficiency." },
  { id: 'pickle_weapon',      name: 'Prehistoric Jaw',             series: 'Baki',                             rarity: 'MY', weaponCard: true, weaponOf: 'pickle',      desc: "Pickle's ancient bite force — a jaw capable of crushing dinosaur bones, unchanged for millions of years." },
  { id: 'kaiser_weapon',      name: 'Kaiser Impact',               series: 'Blue Lock',                        rarity: 'MY', weaponCard: true, weaponOf: 'kaiser',      desc: "Kaiser's signature shot — a strike of such speed and precision it reshapes the laws of football." },
  { id: 'noa_weapon',         name: "Noa's Perfect Form",          series: 'Blue Lock',                        rarity: 'MY', weaponCard: true, weaponOf: 'noa',         desc: "Noel Noa's perfected technique — the embodiment of everything football should be, refined to absolute excellence." },
  { id: 'ego_jinpachi_weapon',name: "Ego's Blueprint",             series: 'Blue Lock',                        rarity: 'MY', weaponCard: true, weaponOf: 'ego_jinpachi',desc: "Jinpachi Ego's genius strategy — a tactical mind so sharp it turns ideas into weapons that reshape sport itself." },
  { id: 'mewtwo_weapon',      name: 'Psystrike',                   series: 'Pokémon',                          rarity: 'MY', weaponCard: true, weaponOf: 'mewtwo',      desc: "Mewtwo's ultimate psychic attack — materializes the user's psychic power into an unstoppable physical strike." },
  { id: 'beerus_weapon',      name: 'Sphere of Destruction',       series: 'Dragon Ball Super',                rarity: 'MY', weaponCard: true, weaponOf: 'beerus',      desc: "Beerus's ultimate technique — a orb of pure destruction energy that obliterates everything it consumes." },
  { id: 'whitebeard_weapon',  name: 'Murakumogiri',                series: 'One Piece',                        rarity: 'MY', weaponCard: true, weaponOf: 'whitebeard',  desc: "Whitebeard's naginata — one of the 12 Supreme Grade swords, wielded by the world's strongest man." },
  { id: 'saitama_weapon',     name: 'Serious Punch',               series: 'One Punch Man',                    rarity: 'MY', weaponCard: true, weaponOf: 'saitama',     desc: "Saitama's ultimate attack — a punch so powerful it split the clouds across Earth and ended Boros for good." },

  // ── Weapon Cards (UR) ─────────────────────────────────────
  { id: 'giorno_weapon',      name: 'Gold Experience Requiem',     series: "JoJo's Bizarre Adventure",        rarity: 'UR', weaponCard: true, weaponOf: 'giorno',      desc: "Giorno's evolved Stand — it resets any action or consequence to zero. Death loops forever. You cannot win." },
  { id: 'yhwach_weapon',      name: 'The Almighty',                series: 'Bleach',                           rarity: 'UR', weaponCard: true, weaponOf: 'yhwach',      desc: "Yhwach's supreme ability — he sees and freely reorders all possible futures. Every outcome bends to his will." },
  { id: 'simon_weapon',       name: 'Core Drill',                  series: 'Gurren Lagann',                    rarity: 'UR', weaponCard: true, weaponOf: 'simon',       desc: "Simon's drill — the small spiral that powered Lagann and ultimately pierced the heavens themselves." },
  { id: 'rimuru_weapon',      name: 'Predator & Raphael',          series: 'That Time I Got Reincarnated as a Slime', rarity: 'UR', weaponCard: true, weaponOf: 'rimuru', desc: "Rimuru's dual powers — Predator absorbs and mimics, Raphael analyzes and perfects everything in existence." },
  { id: 'kaguya_weapon',      name: 'All-Killing Ash Bones',       series: 'Naruto',                           rarity: 'UR', weaponCard: true, weaponOf: 'kaguya',      desc: "Kaguya's bone kekkei mora — projectiles of pure ash that cause instant death upon contact with their target." },
  { id: 'zeno_weapon',        name: "Zeno's Erase",                series: 'Dragon Ball Super',                rarity: 'UR', weaponCard: true, weaponOf: 'zeno',        desc: "The Omni-King's absolute power — a childlike gesture that erases universes without effort or remorse." },
  { id: 'joyboy_weapon',      name: "Nika's Liberation Fists",     series: 'One Piece',                        rarity: 'UR', weaponCard: true, weaponOf: 'joyboy',      desc: "The power of the Sun God Nika — fists that free all who suffer, turning the world itself into a stage." },
  { id: 'arceus_weapon',      name: 'Creation Plates',             series: 'Pokémon',                          rarity: 'UR', weaponCard: true, weaponOf: 'arceus',      desc: "The Plates of Arceus — 18 divine tablets through which the Original One shaped all of existence." },
  { id: 'ichigo_bankai_weapon',name: 'Tensa Zangetsu',             series: 'Bleach',                           rarity: 'UR', weaponCard: true, weaponOf: 'ichigo_bankai',desc: "Ichigo's true Bankai — a compressed black blade carrying the full convergence of Soul Reaper, Hollow, and Quincy." },
  { id: 'blackbeard_weapon',  name: 'Bisento & Dual Fruits',       series: 'One Piece',                        rarity: 'UR', weaponCard: true, weaponOf: 'blackbeard',  desc: "Blackbeard's massive bisento combined with two Devil Fruits — darkness that devours and quakes that shatter all." },
  { id: 'dio_wr_weapon',      name: 'The World',                   series: "JoJo's Bizarre Adventure",        rarity: 'UR', weaponCard: true, weaponOf: 'dio_wr',      desc: "DIO's Stand — physical strength beyond all human measure, and the power to stop time itself. Za Warudo!" },
  { id: 'gun_weapon',         name: "Gun's Iron Fist",             series: 'Lookism',                          rarity: 'UR', weaponCard: true, weaponOf: 'gun',         desc: "Gun Park's fists — the weapons of the underground's most feared fighter, built through a life of pure combat." },
  { id: 'johan_weapon',       name: "Johan's Technique",           series: 'Lookism',                          rarity: 'UR', weaponCard: true, weaponOf: 'johan',       desc: "Johan Seong's fighting art — a style that combines effortless grace with lethally effective combat instinct." },
  { id: 'tom_lee_weapon',     name: "Tom Lee's Iron Strikes",      series: 'Lookism',                          rarity: 'UR', weaponCard: true, weaponOf: 'tom_lee',     desc: "Tom Lee's composed striking power — clean, efficient blows delivered with the calm precision of someone who has mastered combat completely." },
  { id: 'musashi_weapon',     name: "Musashi's Twin Swords",       series: 'Baki',                             rarity: 'UR', weaponCard: true, weaponOf: 'musashi',     desc: "Miyamoto Musashi's blades — history's greatest swordsman reborn, dual katana that cut the uncuttable." },
  { id: 'yujiro_weapon',      name: "Demon's Back",                series: 'Baki',                             rarity: 'UR', weaponCard: true, weaponOf: 'yujiro',      desc: "Yujiro Hanma's demon face — a terrifying muscular formation that represents the pinnacle of human combat evolution." },
  { id: 'isagi_ego_weapon',   name: 'Direct Drive',                series: 'Blue Lock',                        rarity: 'UR', weaponCard: true, weaponOf: 'isagi_ego',   desc: "Isagi's awakened weapon — spatial awareness so complete that the entire pitch becomes his personal arsenal." },

  // ── Weapon Cards (LT) ─────────────────────────────────────
  { id: 'sage_naruto_weapon', name: 'Six Paths Chibaku Tensei',    series: 'Naruto',                           rarity: 'LT', weaponCard: true, weaponOf: 'sage_naruto', desc: "The Six Paths Sage's ultimate technique — gravity manipulation powerful enough to create new moons." },
  { id: 'ultra_goku_weapon',  name: 'Ultra Instinct Omni-Ki',      series: 'Dragon Ball Super',                rarity: 'LT', weaponCard: true, weaponOf: 'ultra_goku',  desc: "Goku's Ultra Instinct ki — autonomous divine energy that moves beyond the reach of conscious thought." },
  { id: 'gear5_luffy_weapon', name: "Nika's Liberation Drums",     series: 'One Piece',                        rarity: 'LT', weaponCard: true, weaponOf: 'gear5_luffy', desc: "The heartbeat of the Sun God — a drum rhythm that grants Luffy power over rubber reality itself." },
  { id: 'sukuna_fp_weapon',   name: 'Malevolent Shrine',           series: 'Jujutsu Kaisen',                   rarity: 'LT', weaponCard: true, weaponOf: 'sukuna_fp',   desc: "Sukuna's domain — a shrine of carnage where Cleave and Dismantle reach everything within its territory." },
  { id: 'daniel_park_ui_lt_weapon', name: 'Ultra Instinct Strike', series: 'Lookism',                         rarity: 'LT', weaponCard: true, weaponOf: 'daniel_park_ui_lt', desc: "Daniel Park's ultimate form — a state of pure autonomous fighting that surpasses all conscious technique." },
  { id: 'ditto_lt_weapon',    name: 'Transform Core',              series: 'Pokémon',                          rarity: 'LT', weaponCard: true, weaponOf: 'ditto_lt',    desc: "Ditto's essence — the mysterious cellular structure that lets it perfectly replicate any being in existence." },
  { id: 'gojo_weapon',        name: 'Infinite Void',               series: 'Jujutsu Kaisen',                   rarity: 'LT', weaponCard: true, weaponOf: 'gojo',        desc: "Gojo's domain expansion — an infinite realm of stimulation that incapacitates all who enter it permanently." },
  { id: 'kaiser_impact_weapon',name: 'World-Class Shot',           series: 'Blue Lock',                        rarity: 'LT', weaponCard: true, weaponOf: 'kaiser_impact',desc: "The Kaiser Impact taken to its absolute limit — a shot that doesn't just score, it redefines football entirely." },

];

/**
 * Base pool filter — excludes Limited, weapon, support, and ditto cards.
 * These are never obtainable through regular pulls.
 */
function isNormalPullable(c) {
  return c.rarity !== 'LT' && !c.weaponCard && !c.supportCard && !c.dittoCard;
}

/**
 * Pull a random card weighted by PULL_RATES.
 * Limited (LT) cards are explicitly excluded — they are not in PULL_RATES
 * and must never appear in any rarity pool during a normal pull.
 */
function pullCard() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let chosen = 'R';

  for (const [rarity, rate] of Object.entries(PULL_RATES)) {
    cumulative += rate;
    if (roll < cumulative) { chosen = rarity; break; }
  }

  const pool = CARDS.filter(c => isNormalPullable(c) && c.rarity === chosen);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : CARDS[0];
}

module.exports = { CARDS, pullCard };
