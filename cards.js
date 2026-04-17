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
  // Solo Leveling
  { id: 'jinwoo_r',        name: 'Sung Jinwoo',             series: 'Solo Leveling',                     rarity: 'R',  desc: 'Once the weakest hunter in Korea — now something far, far greater.' },
  // Tower of God
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

  // ══════════════════════════════════════════════════════════
  //  EXPANDED CARD POOL — MANHWA
  // ══════════════════════════════════════════════════════════

  // ── The God of High School ────────────────────────────────
  { id: 'han_daewi',        name: 'Han Daewi',               series: 'The God of High School',            rarity: 'E',  desc: 'A fighter who gave up everything for his sick friend — his borrowed powers rival the divine.' },
  { id: 'yu_mira',          name: 'Yu Mira',                 series: 'The God of High School',            rarity: 'E',  desc: 'Last of the Yu clan — her Moon Light Sword style is passed through generations of perfection.' },
  { id: 'park_ilpyo',       name: 'Park Ilpyo',              series: 'The God of High School',            rarity: 'L',  desc: 'The Fox — Imoogi\'s host, a martial artist whose power shakes the whole tournament.' },
  { id: 'jin_taejin_ghs',   name: 'Jin Taejin',              series: 'The God of High School',            rarity: 'MY', desc: 'The King — Jin Mori\'s grandfather and one of the greatest martial artists humanity has ever produced.' },
  { id: 'judge_q_ghs',      name: 'Judge Q',                 series: 'The God of High School',            rarity: 'E',  desc: 'One of the referees — a figure of mystery whose true power is kept from the contestants.' },
  { id: 'judge_p_ghs',      name: 'Judge P',                 series: 'The God of High School',            rarity: 'E',  desc: 'Another of the three judges — a calm presence who enforces the rules of the divine tournament.' },
  { id: 'judge_r_ghs',      name: 'Judge R',                 series: 'The God of High School',            rarity: 'MY', desc: 'The head judge — a former champion whose authority carries the weight of something much older than the tournament.' },
  { id: 'mira_god_ghs',     name: 'Yu Mira (God Mode)',      series: 'The God of High School',            rarity: 'UR', desc: 'Mira awakened to divine power — the Moon Light Sword becomes an instrument of destruction beyond human ken.' },
  { id: 'daewi_god_ghs',    name: 'Han Daewi (God Mode)',    series: 'The God of High School',            rarity: 'UR', desc: 'Daewi\'s borrowed divinity fully unleashed — his control over wind and water reaches a realm no human should touch.' },
  { id: 'ilpyo_fox_ghs',    name: 'Park Ilpyo (Fox God)',    series: 'The God of High School',            rarity: 'LT', desc: 'Ilpyo fully merged with the Imoogi — a nine-tailed god whose power rewrites the laws of combat.' },
  { id: 'ji_seung_ghs',     name: 'Ji Seung',                series: 'The God of High School',            rarity: 'R',  desc: 'A capable fighter from the early rounds — determined and technically sound under pressure.' },
  { id: 'ma_bora_ghs',      name: 'Ma Bora',                 series: 'The God of High School',            rarity: 'R',  desc: 'A skilled combatant who fights with precision and a calm head regardless of the opponent.' },
  { id: 'gang_manseok_ghs', name: 'Gang Manseok',            series: 'The God of High School',            rarity: 'L',  desc: 'A powerhouse who dominated the early tournament — his strength made even the judges take notice.' },
  { id: 'robert_lime_ghs',  name: 'Robert Lime',             series: 'The God of High School',            rarity: 'L',  desc: 'A foreign contestant of exceptional ability — brutal and efficient in a way most competitors cannot match.' },
  { id: 'nox_ultio_ghs',    name: 'Ultio R',                 series: 'The God of High School',            rarity: 'MY', desc: 'Nox\'s supreme weapon — a divine agent whose goals reach far beyond any single tournament or kingdom.' },
  { id: 'taek_jaesan_ghs',  name: 'Taek Jaesan',             series: 'The God of High School',            rarity: 'E',  desc: 'A veteran fighter in the tournament — his experience gives him an edge that younger talents overlook.' },
  { id: 'lee_sungchul_ghs', name: 'Lee Sungchul',            series: 'The God of High School',            rarity: 'MY', desc: 'One of the Six — a figure of immense authority in the world behind the tournament.' },
  { id: 'nox_comm_ghs',     name: 'Nox Commissioner',        series: 'The God of High School',            rarity: 'L',  desc: 'The hidden hand behind many of the tournament\'s cruelest turns — Nox\'s orchestrator.' },
  { id: 'byeon_jh_ghs',     name: 'Byeon Jaehwan',           series: 'The God of High School',            rarity: 'E',  desc: 'A fighter whose Borrowed Power makes him a wildcard — creativity in combat is his greatest weapon.' },
  { id: 'original_q_ghs',   name: 'Original Q',              series: 'The God of High School',            rarity: 'UR', desc: 'The being behind the mask of Judge Q — a power that predates the tournament itself.' },

  // ── Solo Leveling (additional) ────────────────────────────
  { id: 'cha_hae_in_sl',    name: 'Cha Hae-In',              series: 'Solo Leveling',                     rarity: 'E',  desc: 'South Korea\'s top S-Rank hunter — her sword technique is unmatched among her peers.' },
  { id: 'yoo_jinho_sl',     name: 'Yoo Jinho',               series: 'Solo Leveling',                     rarity: 'R',  desc: 'Jinwoo\'s first guild member and most loyal friend — a man who shows up every single time.' },
  { id: 'woo_jinchul_sl',   name: 'Woo Jinchul',             series: 'Solo Leveling',                     rarity: 'R',  desc: 'The Surveillance Team leader — a principled hunter who respects true power wherever he finds it.' },
  { id: 'go_gunhee_sl',     name: 'Go Gunhee',               series: 'Solo Leveling',                     rarity: 'L',  desc: 'Chairman of the Korean Hunters Association — a once-great hunter whose heart never dimmed.' },
  { id: 'igris_sl',         name: 'Igris',                   series: 'Solo Leveling',                     rarity: 'E',  desc: 'The Blood-Red Commander — the first shadow soldier Jinwoo ever took, and the most loyal of his army.' },
  { id: 'beru_sl',          name: 'Beru',                    series: 'Solo Leveling',                     rarity: 'E',  desc: 'The Ant King turned shadow — the most powerful of Jinwoo\'s shadow army, with his own terrifying loyalty.' },
  { id: 'tusk_sl',          name: 'Tusk',                    series: 'Solo Leveling',                     rarity: 'E',  desc: 'A shadow knight of the Monarch\'s army — his brute strength and resilience make him a cornerstone of the force.' },
  { id: 'antares_sl',       name: 'Antares',                 series: 'Solo Leveling',                     rarity: 'MY', desc: 'The Monarch of Destruction — the strongest of all Monarchs, whose power shook the entire world to its knees.' },
  { id: 'liu_zhigang_sl',   name: 'Liu Zhigang',             series: 'Solo Leveling',                     rarity: 'E',  desc: 'China\'s top hunter — a fighter of fearsome reputation who clashed with the world\'s greatest threats.' },
  { id: 'dongsoo_hwang_sl', name: 'Hwang Dongsoo',           series: 'Solo Leveling',                     rarity: 'E',  desc: 'An S-Rank hunter of the US Guild — his arrogance was backed by genuine, terrifying power.' },
  { id: 'goto_ryuji_sl',    name: 'Goto Ryuji',              series: 'Solo Leveling',                     rarity: 'E',  desc: 'Japan\'s strongest hunter — a respected warrior who faced threats most S-Ranks would flee.' },
  { id: 'christopher_reid_sl', name: 'Christopher Reid',     series: 'Solo Leveling',                     rarity: 'L',  desc: 'The National Level hunter of the United States — one of the few mortals to challenge a Monarch.' },
  { id: 'choi_jongin_sl',   name: 'Choi Jong-In',            series: 'Solo Leveling',                     rarity: 'L',  desc: 'Korea\'s No. 1 hunter — a mage of incredible range who led the nation\'s strongest guild.' },
  { id: 'barion_sl',        name: 'Barion',                  series: 'Solo Leveling',                     rarity: 'E',  desc: 'A powerful shadow soldier — his loyalty and combat ability make him one of the Monarch\'s prized servants.' },
  { id: 'hwang_dongsuk_sl', name: 'Hwang Dongsuk',           series: 'Solo Leveling',                     rarity: 'E',  desc: 'A cruel C-Rank who hunted his own kind for profit — until he met the wrong opponent.' },

  // ── Tower of God (additional) ─────────────────────────────
  { id: 'bam_tog',          name: 'Twenty-Fifth Bam',        series: 'Tower of God',                      rarity: 'LT', desc: 'The Irregular who climbs not for power or position — but for the one person who showed him the light.' },
  { id: 'khun_aguero_tog',  name: 'Khun Aguero Agnes',       series: 'Tower of God',                      rarity: 'E',  desc: 'A disgraced prince of the Khun family — his brilliant tactical mind compensates for everything else.' },
  { id: 'endorsi_tog',      name: 'Endorsi Jahad',           series: 'Tower of God',                      rarity: 'E',  desc: 'A Princess of Zahard — fierce and pragmatic, with a secret softness she works very hard to hide.' },
  { id: 'anaak_tog',        name: 'Anaak Jahad',             series: 'Tower of God',                      rarity: 'E',  desc: 'The daughter who carries Green April to claim vengeance for her mother — a princess of rage and grief.' },
  { id: 'shibisu_tog',      name: 'Shibisu',                 series: 'Tower of God',                      rarity: 'R',  desc: 'A Regular who climbs on wit and friendships — his social genius is his greatest weapon in the Tower.' },
  { id: 'hatz_tog',         name: 'Hatz',                    series: 'Tower of God',                      rarity: 'R',  desc: 'A swordsman of discipline and pride — his twin blades are matched only by his stubbornness.' },
  { id: 'yuri_zahard_tog',  name: 'Ha Yuri Zahard',          series: 'Tower of God',                      rarity: 'L',  desc: 'A Princess of Zahard who broke every rule to help Bam — Black March in one hand, Green April in the other.' },
  { id: 'evan_edrok_tog',   name: 'Evan Edrok',              series: 'Tower of God',                      rarity: 'L',  desc: 'Yuri\'s guide and one of the most skilled Guides in the Tower — his foresight shapes every outcome.' },
  { id: 'karaka_tog',       name: 'Karaka',                  series: 'Tower of God',                      rarity: 'L',  desc: 'A dangerous and proud Regular — his Thorn and mysterious origin make him one of Bam\'s greatest rivals.' },
  { id: 'ha_yura_tog',      name: 'Ha Yura',                 series: 'Tower of God',                      rarity: 'R',  desc: 'A celebrity singer who hides her true objective within the Tower — fame is just a mask.' },
  { id: 'jahad_tog',        name: 'King Zahard',             series: 'Tower of God',                      rarity: 'MY', desc: 'The king who stopped climbing at the top of the Tower — his power, sealed within princesses, shapes all of history.' },
  { id: 'phonsekal_tog',    name: 'Phonsekal Laura',         series: 'Tower of God',                      rarity: 'E',  desc: 'A high-ranking Regulars with extraordinary Shinsu control — a ranker-class threat among her peers.' },
  { id: 'ha_jinsung_tog',   name: 'Ha Jinsung',              series: 'Tower of God',                      rarity: 'L',  desc: 'A High Ranker and one of the most feared members of the Ha family — Bam\'s teacher in the middle floors.' },
  { id: 'evankhell_tog',    name: 'Evankhell',               series: 'Tower of God',                      rarity: 'MY', desc: 'The Ruler of the Hell Train floor — a monster of fire and authority whose wrath reshapes the battlefield.' },
  { id: 'beta_tog',         name: 'Beta',                    series: 'Tower of God',                      rarity: 'E',  desc: 'A synthetic human created from Bam\'s data — fighting to find his own identity in a Tower not built for him.' },
  { id: 'lo_po_tog',        name: 'Lo Po Bia Ren',           series: 'Tower of God',                      rarity: 'E',  desc: 'A Ranker of the Lo Po Bia family — his contracted beast and cunning make him lethal in every situation.' },
  { id: 'wangnan_tog',      name: 'Jue Viole Grace',         series: 'Tower of God',                      rarity: 'L',  desc: 'Bam\'s alias as FUG\'s Slayer nominee — a masked identity under which even greater power was born.' },

  // ── Omniscient Reader's Viewpoint ─────────────────────────
  { id: 'kim_dokja_orv',    name: 'Kim Dokja',               series: 'Omniscient Reader\'s Viewpoint',     rarity: 'MY', desc: 'The sole reader of Ways of Survival — he knows exactly how the story ends, and chose to change it anyway.' },
  { id: 'yoo_joonghyuk_orv',name: 'Yoo Joonghyuk',          series: 'Omniscient Reader\'s Viewpoint',     rarity: 'UR', desc: 'The Regressor — he has lived and died through the scenario countless times, and he never stops getting stronger.' },
  { id: 'jung_heewon_orv',  name: 'Jung Heewon',             series: 'Omniscient Reader\'s Viewpoint',     rarity: 'E',  desc: 'A prosecutor turned scenario survivor — her sword and her loyalty to Dokja are both absolutely lethal.' },
  { id: 'lee_jihye_orv',    name: 'Lee Jihye',               series: 'Omniscient Reader\'s Viewpoint',     rarity: 'E',  desc: 'Joonghyuk\'s former disciple — a naval warfare expert who never gives less than everything in a fight.' },
  { id: 'han_sooyoung_orv', name: 'Han Sooyoung',            series: 'Omniscient Reader\'s Viewpoint',     rarity: 'L',  desc: 'The author who wrote Ways of Survival — her knowledge and ruthlessness make her a player no one should trust.' },
  { id: 'uriel_orv',        name: 'Uriel',                   series: 'Omniscient Reader\'s Viewpoint',     rarity: 'L',  desc: 'The Constellation of the Absolute Flame — her passion for Dokja\'s story runs a little hotter than professional.' },
  { id: 'bihyung_orv',      name: 'Bihyung',                 series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'A dokkaebei broker who acts as Dokja\'s contact — underestimated, but reliably useful when it counts.' },
  { id: 'shin_yoosung_orv', name: 'Shin Yoosung',            series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'A young girl who grew into one of the scenario\'s most important survivors through sheer will and trust.' },
  { id: 'lee_hyunsong_orv', name: 'Lee Hyunsong',            series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'A loyal member of Dokja\'s company — his physical gifts and steady presence anchor the team in battle.' },
  { id: 'lee_gilyoung_orv', name: 'Lee Gilyoung',            series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'A boy who bonded with insects through a scenario — now commands them as an army no one sees coming.' },
  { id: 'yoo_sangah_orv',   name: 'Yoo Sangah',              series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'Dokja\'s colleague — her calm intelligence and emotional steadiness hold the company together from within.' },
  { id: 'jang_hayoung_orv', name: 'Jang Hayoung',            series: 'Omniscient Reader\'s Viewpoint',     rarity: 'E',  desc: 'The Secretive Plotter\'s avatar — unpredictable, overpowered, and operating on an agenda no one fully understands.' },
  { id: 'gong_pildu_orv',   name: 'Gong Pildu',              series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'An older survivor who chose to fight for his community — his gunfire and grit are worth more than raw talent.' },
  { id: 'kim_namwoon_orv',  name: 'Kim Namwoon',             series: 'Omniscient Reader\'s Viewpoint',     rarity: 'R',  desc: 'A brawler who chose the wrong side early — then found a reason to become something worth remembering.' },
  { id: 'dokja_king_orv',   name: 'Kim Dokja (King)',        series: 'Omniscient Reader\'s Viewpoint',     rarity: 'LT', desc: 'Dokja ascended beyond the story\'s limits — the King of Readers, rewriting the end of everything.' },

  // ── Eleceed ───────────────────────────────────────────────
  { id: 'jiwoo_seo_el',     name: 'Jiwoo Seo',               series: 'Eleceed',                           rarity: 'E',  desc: 'A kind-hearted boy with speed that breaks all records — his awakening shook every Awakened in the country.' },
  { id: 'kayden_break_el',  name: 'Kayden Break',            series: 'Eleceed',                           rarity: 'MY', desc: 'The world\'s strongest Awakened — currently stuck in a cat\'s body, which only makes him more terrifying.' },
  { id: 'inhyuk_jang_el',   name: 'Inhyuk Jang',             series: 'Eleceed',                           rarity: 'L',  desc: 'The head of Korea\'s Awakened association — a strategist who views people as pieces on a board he always controls.' },
  { id: 'jisuk_kwon_el',    name: 'Jisuk Kwon',              series: 'Eleceed',                           rarity: 'E',  desc: 'A talented Awakened with impressive barrier abilities — laid-back in personality but fierce when cornered.' },
  { id: 'suyeon_baek_el',   name: 'Suyeon Baek',             series: 'Eleceed',                           rarity: 'E',  desc: 'An Awakened with powerful offensive capabilities — ambitious and driven by something deeper than rankings.' },
  { id: 'daye_seong_el',    name: 'Daye Seong',              series: 'Eleceed',                           rarity: 'R',  desc: 'A competent Awakened who trains alongside Jiwoo — his steady growth shows what dedication without genius looks like.' },
  { id: 'wooin_lee_el',     name: 'Wooin Lee',               series: 'Eleceed',                           rarity: 'R',  desc: 'One of Jiwoo\'s teammates — his ability complements the group and his loyalty never wavers under pressure.' },
  { id: 'dawn_el',          name: 'Dawn',                    series: 'Eleceed',                           rarity: 'L',  desc: 'A foreign Awakened of exceptional power — her history with Kayden shapes some of the story\'s deepest conflicts.' },
  { id: 'kartein_el',       name: 'Kartein',                 series: 'Eleceed',                           rarity: 'MY', desc: 'One of the world\'s top Awakened — his mastery of raw energy projection puts him in a tier above almost anyone.' },
  { id: 'lorcan_el',        name: 'Lorcan',                  series: 'Eleceed',                           rarity: 'E',  desc: 'A western Awakened with formidable combat experience — his strength and pride make him a rival to remember.' },

  // ── Weak Hero ─────────────────────────────────────────────
  { id: 'gray_yeon_wh',     name: 'Gray Yeon',               series: 'Weak Hero',                         rarity: 'L',  desc: 'A frail-looking boy who dismantles bullies with brutal efficiency — the glasses hide a weapon, not a scholar.' },
  { id: 'wolf_kim_wh',      name: 'Wolf Kim',                series: 'Weak Hero',                         rarity: 'E',  desc: 'A naturally talented fighter with instincts honed on the streets — not the villain the story first suggests.' },
  { id: 'ronan_joo_wh',     name: 'Ronan Joo',               series: 'Weak Hero',                         rarity: 'E',  desc: 'A fighter who protects those weaker than himself through force of will and raw punching power.' },
  { id: 'ben_park_wh',      name: 'Ben Park',                series: 'Weak Hero',                         rarity: 'R',  desc: 'A loyal fighter who stands beside Gray when most would walk away — reliability in human form.' },
  { id: 'jake_kim_wh',      name: 'Jake Kim',                series: 'Weak Hero',                         rarity: 'E',  desc: 'A street fighter whose reputation was built punch by punch — his power is real, whatever his methods.' },
  { id: 'donald_na_wh',     name: 'Donald Na',               series: 'Weak Hero',                         rarity: 'E',  desc: 'A powerhouse antagonist — the kind of physical dominance that makes diplomacy feel like a wasted gesture.' },
  { id: 'phillip_im_wh',    name: 'Phillip Im',              series: 'Weak Hero',                         rarity: 'R',  desc: 'Part of the wider network of fighters in Weak Hero\'s world — capable, and very aware of it.' },
  { id: 'stephen_han_wh',   name: 'Stephen Han',             series: 'Weak Hero',                         rarity: 'R',  desc: 'A fighter of notable standing — steady in combat and reliable in the kind of chaos that terrifies most people.' },
  { id: 'goo_siu_wh',       name: 'Goo Siu',                 series: 'Weak Hero',                         rarity: 'L',  desc: 'One of the strongest high-school fighters in the series — his presence signals that things are about to escalate.' },
  { id: 'si_young_wh',      name: 'Si-Young Shin',           series: 'Weak Hero',                         rarity: 'R',  desc: 'A combatant whose growth mirrors Gray\'s own path — driven by circumstances into a world of violence.' },

  // ── Noblesse ─────────────────────────────────────────────
  { id: 'cadis_etrama_nb',  name: 'Cadis Etrama di Raizel',  series: 'Noblesse',                          rarity: 'MY', desc: 'The Noblesse — asleep for 820 years, now awake in the modern world, wielding noble power to protect those he calls his own.' },
  { id: 'frankenstein_nb',  name: 'Frankenstein',            series: 'Noblesse',                          rarity: 'UR', desc: 'Rai\'s devoted servant and scientific genius — his Dark Spear can consume gods if he chooses to let it.' },
  { id: 'm21_nb',           name: 'M-21',                    series: 'Noblesse',                          rarity: 'R',  desc: 'A modified human who found something worth protecting — his growth from experiment to guardian defines the series.' },
  { id: 'regis_nb',         name: 'Regis',                   series: 'Noblesse',                          rarity: 'R',  desc: 'A noble on his coming-of-age journey — proud and hot-headed but genuinely growing into his potential.' },
  { id: 'seira_nb',         name: 'Seira J. Loyard',         series: 'Noblesse',                          rarity: 'E',  desc: 'A noble of the Loyard clan — calm, composed, and carrying more power than her quiet demeanour lets on.' },
  { id: 'rael_nb',          name: 'Rael Kertia',             series: 'Noblesse',                          rarity: 'E',  desc: 'A proud noble with explosive combat ability — his rivalry and growth form one of the series\' best arcs.' },
  { id: 'takeo_nb',         name: 'Takeo',                   series: 'Noblesse',                          rarity: 'R',  desc: 'A modified human working alongside M-21 — steady and dependable where others might break.' },
  { id: 'ikhan_nb',         name: 'Ikhan',                   series: 'Noblesse',                          rarity: 'R',  desc: 'The tech prodigy of the group — his hacking and analysis support the team in ways fists never could.' },
  { id: 'tao_nb',           name: 'Tao',                     series: 'Noblesse',                          rarity: 'R',  desc: 'A modified human with combat enhancements — tactical in the field and fiercely loyal to his people.' },
  { id: 'aris_nb',          name: 'Aris',                    series: 'Noblesse',                          rarity: 'E',  desc: 'A noble whose bloodline carries formidable power — her grace in combat reflects generations of noble tradition.' },

  // ── The Beginning After the End ───────────────────────────
  { id: 'arthur_tbate',     name: 'Arthur Leywin',           series: 'The Beginning After the End',       rarity: 'MY', desc: 'A king reincarnated into a world of mana — carrying memories, loss, and a will that refuses to break again.' },
  { id: 'sylvie_tbate',     name: 'Sylvie',                  series: 'The Beginning After the End',       rarity: 'E',  desc: 'A dragon contracted to Arthur — her power grows in tandem with his, and their bond is absolute.' },
  { id: 'tessia_tbate',     name: 'Tessia Eralith',          series: 'The Beginning After the End',       rarity: 'E',  desc: 'An elven princess of natural magical talent — her connection to Arthur drives the story\'s heart.' },
  { id: 'seris_tbate',      name: 'Seris Vritra',            series: 'The Beginning After the End',       rarity: 'L',  desc: 'A Lance of the Vritra — a being of enormous destructive potential whose allegiance is never simple.' },
  { id: 'nico_tbate',       name: 'Nico Sever',              series: 'The Beginning After the End',       rarity: 'E',  desc: 'Arthur\'s closest friend from the academy — a fighter whose loyalty and growth mirror the protagonist\'s own.' },
  { id: 'virion_tbate',     name: 'Virion Eralith',          series: 'The Beginning After the End',       rarity: 'L',  desc: 'King of the elves — a warrior of age and wisdom who carries the weight of an entire kingdom\'s survival.' },
  { id: 'agrona_tbate',     name: 'Agrona Vritra',           series: 'The Beginning After the End',       rarity: 'MY', desc: 'The High Sovereign of Alacrya — a mastermind whose centuries-long plan reshapes the world Arthur must fight to save.' },
  { id: 'caera_tbate',      name: 'Caera Denoir',            series: 'The Beginning After the End',       rarity: 'E',  desc: 'An Alacryan of the Denoir bloodline — her arc transforms her from enemy to one of the story\'s most compelling figures.' },

  // ── Return of the Disaster-Class Hero ─────────────────────
  { id: 'cha_gang_rdh',     name: 'Cha Gang',                series: 'Return of the Disaster-Class Hero', rarity: 'MY', desc: 'The Disaster — betrayed by his allies and returned from death with a vengeance that cannot be reasoned with.' },
  { id: 'seo_ahjin_rdh',    name: 'Seo Ah-Jin',              series: 'Return of the Disaster-Class Hero', rarity: 'E',  desc: 'A hero who carries guilt for the betrayal — her combat ability and inner conflict define her role in the story.' },
  { id: 'kim_sunghan_rdh',  name: 'Kim Sunghan',             series: 'Return of the Disaster-Class Hero', rarity: 'E',  desc: 'A powerful hero whose loyalties are tested by Cha Gang\'s return and the secrets it uncovers.' },
  { id: 'gaia_rdh',         name: 'Gaia',                    series: 'Return of the Disaster-Class Hero', rarity: 'L',  desc: 'A goddess whose will shaped Cha Gang\'s path — her interest in him is both protective and deeply purposeful.' },
  { id: 'twelve_rdh',       name: 'Twelve Zodiacs',          series: 'Return of the Disaster-Class Hero', rarity: 'L',  desc: 'The elite hero group that betrayed Cha Gang — now they must reckon with everything they buried.' },

  // ── Wind Breaker (manhwa) ─────────────────────────────────
  { id: 'jo_jahyun_wb',     name: 'Jo Ja-Hyun',              series: 'Wind Breaker',                      rarity: 'E',  desc: 'A high schooler who channels unrest into racing — his speed and defiance make him the heart of Sunny High.' },
  { id: 'vinny_wb',         name: 'Vinny Vincent',           series: 'Wind Breaker',                      rarity: 'E',  desc: 'A Zephyr rider of formidable skill — his competitive edge and charisma command any race he enters.' },
  { id: 'dom_jongduk_wb',   name: 'Dom Jongduk',             series: 'Wind Breaker',                      rarity: 'L',  desc: 'The strongest cyclist in the series — a force of nature who defines what the top of the sport looks like.' },
  { id: 'bong_su_wb',       name: 'Bong Su',                 series: 'Wind Breaker',                      rarity: 'R',  desc: 'A rider at Sunny High — reliable in a pack and steady under pressure when the race gets tight.' },
  { id: 'woo_geon_wb',      name: 'Woo Geon',                series: 'Wind Breaker',                      rarity: 'R',  desc: 'A competitor from a rival team — his skill on a bike is no joke and his determination is genuine.' },
  { id: 'sim_youngtak_wb',  name: 'Sim Youngtak',            series: 'Wind Breaker',                      rarity: 'E',  desc: 'A rider who took a different path to the top — technical and precise where others rely on raw speed.' },
  { id: 'shin_joon_wb',     name: 'Shin Joon',               series: 'Wind Breaker',                      rarity: 'R',  desc: 'Part of the racing ecosystem — a competitor whose presence raises the stakes whenever he shows up.' },
  { id: 'kang_hyunmin_wb',  name: 'Kang Hyunmin',            series: 'Wind Breaker',                      rarity: 'E',  desc: 'One of the top riders — his tactical approach to races gives him an edge that pure speed cannot match.' },

  // ── Breaker ───────────────────────────────────────────────
  { id: 'chun_woo_han',     name: 'Chun-Woo Han',            series: 'Breaker',                           rarity: 'MY', desc: 'The Nine Arts Dragon — a murim legend of absolute destruction, feared by every martial arts school.' },
  { id: 'shi_woon_yi',      name: 'Shi-Woon Yi',             series: 'Breaker',                           rarity: 'E',  desc: 'A bullied teen who trained under the Nine Arts Dragon — his determination rewrote the laws of his own body.' },
  { id: 'chang_ho_brkr',    name: 'Chang-Ho',                series: 'Breaker',                           rarity: 'L',  desc: 'A senior disciple in the murim world — a dangerous opponent who takes nothing lightly.' },
  { id: 'jinie_yu_brkr',    name: 'Jinie Yu',                series: 'Breaker',                           rarity: 'R',  desc: 'A skilled fighter connected to the murim world — her abilities make her more than capable of handling herself.' },
  { id: 'kang_joonwoo_brkr',name: 'Kang Joon-Woo',          series: 'Breaker',                           rarity: 'R',  desc: 'A figure in the murim order — his role in the story\'s conflicts reflects the complexity of the world he inhabits.' },

  // ── Nano Machine ─────────────────────────────────────────
  { id: 'cheon_yeo_woon_nm',name: 'Cheon Yeo-Woon',          series: 'Nano Machine',                      rarity: 'MY', desc: 'An illegitimate prince given a nano machine from the future — he climbed from the bottom to the absolute peak of the murim.' },
  { id: 'hing_wunja_nm',    name: 'Hing Wunja',              series: 'Nano Machine',                      rarity: 'E',  desc: 'A skilled martial artist in the Demonic Cult — his power and experience set him apart from ordinary cultivators.' },
  { id: 'mun_ku_nm',        name: 'Mun Ku',                  series: 'Nano Machine',                      rarity: 'E',  desc: 'A loyal ally of Yeo-Woon — her combat ability and fierce dedication make her one of his most trusted companions.' },
  { id: 'bi_ryeon_nm',      name: 'Bi Ryeon',                series: 'Nano Machine',                      rarity: 'R',  desc: 'A fighter within the cult hierarchy — his rivalry and respect for Yeo-Woon drive some of the story\'s best growth arcs.' },
  { id: 'chun_yeowun_nm',   name: 'Chun Yeo-Woon (Ascended)',series: 'Nano Machine',                      rarity: 'UR', desc: 'The Lord of the Demonic Cult at his absolute peak — no technique in the murim world can challenge him.' },

  // ── A Returner's Magic Should Be Special ──────────────────
  { id: 'desir_arman_rm',   name: 'Desir Arman',             series: 'A Returner\'s Magic Should Be Special', rarity: 'MY', desc: 'The sole survivor who returned from the Shadow Labyrinth — now building the mages that should have existed.' },
  { id: 'romantica_rm',     name: 'Romantica Giloette',      series: 'A Returner\'s Magic Should Be Special', rarity: 'E',  desc: 'Desir\'s passionate partner — her raw talent and drive grow exponentially under his guidance.' },
  { id: 'pram_rm',          name: 'Pram Schneider',          series: 'A Returner\'s Magic Should Be Special', rarity: 'E',  desc: 'A swordsman of extraordinary speed in Desir\'s group — reliable, cheerful, and devastating in a duel.' },
  { id: 'adjest_rm',        name: 'Adjest Spelldrix',        series: 'A Returner\'s Magic Should Be Special', rarity: 'L',  desc: 'A princess of immense magical power — cold on the surface, carrying warmth she struggles to express.' },
  { id: 'keinzels_rm',      name: 'Keinzels',                series: 'A Returner\'s Magic Should Be Special', rarity: 'E',  desc: 'One of the powerful mages in the story\'s world — his mastery of specific elements makes him a fearsome combatant.' },

  // ── Mercenary Enrollment ──────────────────────────────────
  { id: 'ijin_yu_me',       name: 'Ijin Yu',                 series: 'Mercenary Enrollment',              rarity: 'MY', desc: 'A teenage mercenary who survived a decade of war — now trying to fit into ordinary school life, failing beautifully.' },
  { id: 'yuna_yu_me',       name: 'Yuna Yu',                 series: 'Mercenary Enrollment',              rarity: 'R',  desc: 'Ijin\'s little sister — the reason he came back, the anchor that keeps him tethered to something human.' },
  { id: 'mangu_ryu_me',     name: 'Mangu Ryu',               series: 'Mercenary Enrollment',              rarity: 'E',  desc: 'A powerful fighter in Ijin\'s world — his combat skills are legitimate, even if his methods aren\'t always.' },
  { id: 'dojun_ryu_me',     name: 'Dojun Ryu',               series: 'Mercenary Enrollment',              rarity: 'R',  desc: 'A figure of authority in the school environment — underestimating Ijin is his most consistent mistake.' },
  { id: 'instructor_me',    name: 'Instructor',              series: 'Mercenary Enrollment',              rarity: 'L',  desc: 'The man who shaped Ijin into a weapon — his training left marks that no peacetime life can completely erase.' },
  { id: 'hajun_shin_me',    name: 'Ha-Jun Shin',             series: 'Mercenary Enrollment',              rarity: 'E',  desc: 'A capable fighter in Ijin\'s orbit — his skill and intensity make him a genuine threat in any confrontation.' },

  // ── FFF-Class Trashero ────────────────────────────────────
  { id: 'kang_hansoo_ft',   name: 'Kang Han Soo',            series: 'FFF-Class Trashero',                rarity: 'MY', desc: 'A hero returning to the fantasy world for the tenth time — done being kind, he\'ll be an absolute menace now.' },
  { id: 'hero_elf_ft',      name: 'Elf Saintess',            series: 'FFF-Class Trashero',                rarity: 'R',  desc: 'One of the hero\'s companions in the fantasy world — idealistic in a story that has no room for idealism.' },
  { id: 'demon_ft',         name: 'Demon King',              series: 'FFF-Class Trashero',                rarity: 'E',  desc: 'The recurring villain of the fantasy world — whether he knows it or not, Han Soo has his number.' },
  { id: 'saintess_ft',      name: 'Saintess',                series: 'FFF-Class Trashero',                rarity: 'R',  desc: 'A divine figure in the fantasy setting — her faith and power are real; her understanding of Han Soo is not.' },

  // ── Hardcore Leveling Warrior ─────────────────────────────
  { id: 'hclw_warrior',     name: 'Hardcore Leveling Warrior',series: 'Hardcore Leveling Warrior',         rarity: 'MY', desc: 'Once the No. 1 player in Lucid Adventure — stripped of everything, clawing his way back to the top.' },
  { id: 'dark_hclw',        name: 'Dark',                    series: 'Hardcore Leveling Warrior',         rarity: 'UR', desc: 'An entity born from darkness within the game — his power is absolute in ways that even the developers fear.' },
  { id: 'sora_hclw',        name: 'Sora',                    series: 'Hardcore Leveling Warrior',         rarity: 'E',  desc: 'A sword-focused fighter whose growth and loyalty to HCLW make her one of the story\'s emotional cores.' },
  { id: 'nightmare_hclw',   name: 'Nightmare',               series: 'Hardcore Leveling Warrior',         rarity: 'L',  desc: 'A terrifying entity within Lucid Adventure — the embodiment of everything the game world fears most.' },
  { id: 'armes_hclw',       name: 'Armes',                   series: 'Hardcore Leveling Warrior',         rarity: 'E',  desc: 'A skilled player of the game whose abilities and ambitions intersect with HCLW\'s desperate climb back.' },

  // ── Second Life Ranker ────────────────────────────────────
  { id: 'yeon_woosung_slr', name: 'Yeon-Woo',                series: 'Second Life Ranker',                rarity: 'MY', desc: 'A man who enters the Tower of Obelisk to avenge his twin brother — and becomes something beyond human in the process.' },
  { id: 'edora_slr',        name: 'Edora',                   series: 'Second Life Ranker',                rarity: 'L',  desc: 'A ranker of the One-Horned tribe — her combat ability and bond with Yeon-Woo shape the story\'s emotional arc.' },
  { id: 'valdebich_slr',    name: 'Valdebich',               series: 'Second Life Ranker',                rarity: 'E',  desc: 'A powerful player whose brute force makes him one of the most feared challengers in the early floors.' },
  { id: 'arthia_slr',       name: 'Arthia',                  series: 'Second Life Ranker',                rarity: 'E',  desc: 'The clan whose betrayal sparked everything — their legacy haunts every step of Yeon-Woo\'s ascent.' },
  { id: 'kronos_slr',       name: 'Kronos',                  series: 'Second Life Ranker',                rarity: 'UR', desc: 'A god of time and a critical figure in Yeon-Woo\'s ascent — his power over chronology reshapes every battle.' },

  // ── Kill the Hero ─────────────────────────────────────────
  { id: 'woojin_kim_kh',    name: 'Kim Woo-Jin',             series: 'Kill the Hero',                     rarity: 'MY', desc: 'A hunter who returned from death vowing to kill the corrupt hero who betrayed him — undead and unrelenting.' },
  { id: 'han_sung_jin_kh',  name: 'Han Sung-Jin',            series: 'Kill the Hero',                     rarity: 'E',  desc: 'The false hero who sits at the top — charismatic and beloved, hiding something irredeemably rotten underneath.' },
  { id: 'lee_jinho_kh',     name: 'Lee Jin-Ho',              series: 'Kill the Hero',                     rarity: 'E',  desc: 'An ally of Woo-Jin — his abilities and motivations add layers to a story built on betrayal and revenge.' },
  { id: 'shin_jongyeon_kh', name: 'Shin Jong-Yeon',          series: 'Kill the Hero',                     rarity: 'L',  desc: 'A high-ranked hunter whose power and insight place him in the category of threats Woo-Jin cannot ignore.' },

  // ── Dungeon Reset ─────────────────────────────────────────
  { id: 'dawoon_jung_dr',   name: 'Dawoon Jung',             series: 'Dungeon Reset',                     rarity: 'E',  desc: 'A player who discovered the dungeon resets for him alone — and turned a glitch into an absolute advantage.' },
  { id: 'jung_soyeon_dr',   name: 'Jung So-Yeon',            series: 'Dungeon Reset',                     rarity: 'R',  desc: 'An ally within the dungeon — her skills and Dawoon\'s peculiar advantage create a partnership that keeps growing.' },
  { id: 'dungeon_reset_mc', name: 'Dawoon (Crafter)',        series: 'Dungeon Reset',                     rarity: 'R',  desc: 'Dawoon leveraging his crafting skill tree — every reset leaves him more prepared than any other player alive.' },

  // ── Tomb Raider King ──────────────────────────────────────
  { id: 'seo_jumin_trk',    name: 'Seo Ju-Heon',             series: 'Tomb Raider King',                  rarity: 'MY', desc: 'The Tomb Raider King — he died, went back in time, and is now using every artifact he died finding to wreck his enemies.' },
  { id: 'yoo_minyeon_trk',  name: 'Yoo Minyeon',             series: 'Tomb Raider King',                  rarity: 'R',  desc: 'An ally in Seo Ju-Heon\'s orbit — capable and adaptable in a world where artifacts rewrite the rules.' },
  { id: 'kim_hyun_soo_trk', name: 'Kim Hyun-Soo',            series: 'Tomb Raider King',                  rarity: 'E',  desc: 'A figure whose power with artifacts makes him a genuine threat — not someone Seo Ju-Heon dismisses lightly.' },
  { id: 'chloe_trk',        name: 'Chloe',                   series: 'Tomb Raider King',                  rarity: 'R',  desc: 'A raider in Seo Ju-Heon\'s world — her involvement shapes some of the story\'s most pivotal artifact hunts.' },

  // ── I\'m the Max-Level Newbie ─────────────────────────────
  { id: 'jinhyuk_kang_mln', name: 'Kang Jinhyuk',            series: 'I\'m the Max-Level Newbie',         rarity: 'MY', desc: 'The only player to clear the Tower of Trials — now back to the beginning, carrying knowledge no one else has.' },
  { id: 'kim_seolhwa_mln',  name: 'Kim Seolhwa',             series: 'I\'m the Max-Level Newbie',         rarity: 'E',  desc: 'A powerful ally in Jinhyuk\'s climb — her abilities complement his and her trust in him is hard-won.' },
  { id: 'lee_se_hun_mln',   name: 'Lee Se-Hun',              series: 'I\'m the Max-Level Newbie',         rarity: 'E',  desc: 'A climber whose raw talent and ambition make him one of the more formidable figures in the tower\'s upper floors.' },
  { id: 'yuki_mln',         name: 'Yuki',                    series: 'I\'m the Max-Level Newbie',         rarity: 'L',  desc: 'A high-floor challenger from a different region — her skill and goals intersect with Jinhyuk\'s in meaningful ways.' },

  // ── The Scholar\'s Reincarnation ──────────────────────────
  { id: 'scholar_mc_sr',    name: 'Hwon',                    series: 'The Scholar\'s Reincarnation',      rarity: 'MY', desc: 'The Warrior-King reincarnated as a noble scholar — his martial arts knowledge in a peace-loving body changes everything.' },
  { id: 'yura_sr',          name: 'Yura',                    series: 'The Scholar\'s Reincarnation',      rarity: 'E',  desc: 'A skilled woman who underestimates the scholar at her peril — her own journey transforms alongside his.' },
  { id: 'hwang_sr',         name: 'Hwang',                   series: 'The Scholar\'s Reincarnation',      rarity: 'L',  desc: 'A martial arts master who senses something terrifyingly familiar in the scholar\'s movements — he is not wrong.' },
  { id: 'heedo_sr',         name: 'Heedo',                   series: 'The Scholar\'s Reincarnation',      rarity: 'R',  desc: 'A loyal companion who believes in the scholar before almost anyone else — naive in the best way.' },

  // ── The Gamer ─────────────────────────────────────────────
  { id: 'jee_han_gm',       name: 'Jee-Han',                 series: 'The Gamer',                         rarity: 'E',  desc: 'A high schooler with the Gamer ability — treating reality like an RPG until the RPG starts fighting back.' },
  { id: 'moojin_gm',        name: 'Moojin',                  series: 'The Gamer',                         rarity: 'R',  desc: 'Jee-Han\'s best friend who is quietly part of the hidden world — his loyalty is the anchor that grounds the story.' },
  { id: 'shin_soo_gm',      name: 'Shin Soo-Ryun',           series: 'The Gamer',                         rarity: 'L',  desc: 'A powerful member of the Chunbumoon clan — her strength and her interest in Jee-Han both keep escalating.' },
  { id: 'ohsung_gm',        name: 'Oh Sehee',                series: 'The Gamer',                         rarity: 'R',  desc: 'Another player in the hidden world — her Gamer-adjacent abilities and ambition make her a wildcard in any plan.' },

  // ── Leveling Up with the Gods ─────────────────────────────
  { id: 'kim_hyunwoo_lug',  name: 'Kim Hyun-Woo',            series: 'Leveling Up with the Gods',         rarity: 'MY', desc: 'A player chosen by the gods to climb the world tree — his past lives and divine backing make him unlike anyone else.' },
  { id: 'indra_lug',        name: 'Indra',                   series: 'Leveling Up with the Gods',         rarity: 'L',  desc: 'The King of the Heavens — a god who tests Hyun-Woo personally, and whose approval means genuine power.' },
  { id: 'shiva_lug',        name: 'Shiva',                   series: 'Leveling Up with the Gods',         rarity: 'MY', desc: 'The Destroyer — a god of apocalyptic power whose interest in the story\'s events is never reassuring.' },
  { id: 'odin_lug',         name: 'Odin',                    series: 'Leveling Up with the Gods',         rarity: 'UR', desc: 'The Allfather — his wisdom and battle strength make him one of the most formidable figures in the divine hierarchy.' },

  // ── UnOrdinary ───────────────────────────────────────────
  { id: 'john_doe_uo',      name: 'John Doe',                series: 'unOrdinary',                        rarity: 'MY', desc: 'A supposedly crippled student hiding the most terrifying ability in the school — his past is a weapon.' },
  { id: 'seraphina_uo',     name: 'Seraphina',               series: 'unOrdinary',                        rarity: 'L',  desc: 'The school\'s No. 1 student — her ability and her relationship with John form the story\'s emotional spine.' },
  { id: 'remi_uo',          name: 'Remi',                    series: 'unOrdinary',                        rarity: 'E',  desc: 'A high-ranking student who believes the ability hierarchy should be dismantled — radical and genuinely capable.' },
  { id: 'arlo_uo',          name: 'Arlo',                    series: 'unOrdinary',                        rarity: 'E',  desc: 'Seraphina\'s loyal No. 2 — a fighter who enforces the rules of Wellston until those rules begin to crack.' },

  // ── Infinite Mage ─────────────────────────────────────────
  { id: 'shirone_im',       name: 'Shirone',                  series: 'Infinite Mage',                     rarity: 'E',  desc: 'A talented mage from a common background who entered the elite academy — his infinite potential earns the title.' },
  { id: 'rian_im',          name: 'Rian',                    series: 'Infinite Mage',                     rarity: 'R',  desc: 'Shirone\'s noble classmate and rival — their friendship forged through competition gives the story its best moments.' },
  { id: 'iruki_im',         name: 'Iruki',                   series: 'Infinite Mage',                     rarity: 'R',  desc: 'A third friend in the mage trio — his specialty and quick thinking make him invaluable on any team.' },
  { id: 'siena_im',         name: 'Siena',                   series: 'Infinite Mage',                     rarity: 'E',  desc: 'A powerful teacher at the academy — her ability and her expectations push her students harder than they thought possible.' },
  { id: 'vincenzo_im',      name: 'Vincenzo',                series: 'Infinite Mage',                     rarity: 'L',  desc: 'A high-ranking mage whose power and position in the story\'s hierarchy give him enormous influence.' },

  // ── Murim Login ───────────────────────────────────────────
  { id: 'jin_taekyung_ml',  name: 'Jin Tae-Kyung',           series: 'Murim Login',                       rarity: 'MY', desc: 'A hunter who enters the murim world through a gate — gaining martial arts mastery that no modern technique can match.' },
  { id: 'goo_hyun_ml',      name: 'Goo Hyun',                series: 'Murim Login',                       rarity: 'E',  desc: 'A murim elder who recognises Tae-Kyung\'s talent — his guidance accelerates an already frightening growth curve.' },
  { id: 'soma_ml',          name: 'Soma',                    series: 'Murim Login',                       rarity: 'E',  desc: 'A formidable fighter in the murim world — his style and strength serve as a benchmark for the story\'s power scaling.' },
  { id: 'namgung_ml',       name: 'Namgung',                 series: 'Murim Login',                       rarity: 'L',  desc: 'A figure of the great clans within the murim world — his involvement shifts the balance of every conflict he enters.' },
  { id: 'hwasan_ml',        name: 'Hwasan Disciple',         series: 'Murim Login',                       rarity: 'R',  desc: 'A trained swordsman of the Hwasan sect — carrying centuries of technique in every move he makes.' },

  // ══════════════════════════════════════════════════════════
  //  EXPANDED CARD POOL — ANIME (ADDITIONAL)
  // ══════════════════════════════════════════════════════════

  // ── Dragon Ball (additional) ──────────────────────────────
  { id: 'gogeta_dbs',       name: 'Gogeta',                  series: 'Dragon Ball Super',                 rarity: 'E',  desc: 'The fusion of Goku and Vegeta through the Fusion Dance — raw dominance with a time limit nobody wants.' },
  { id: 'buu_dbz',          name: 'Kid Buu',                 series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'The most dangerous form of Buu — pure destruction without reason, and only a Spirit Bomb could end it.' },
  { id: 'janemba_dbz',      name: 'Janemba',                 series: 'Dragon Ball Z',                     rarity: 'L',  desc: 'A demon born from pure evil energy — his Bunkai Teleport made him functionally untouchable until Gogeta arrived.' },
  { id: 'baby_dbz',         name: 'Baby Vegeta',             series: 'Dragon Ball GT',                    rarity: 'L',  desc: 'The Tuffle parasite who possessed Vegeta — his hatred for Saiyans was genetically encoded and absolutely relentless.' },
  { id: 'omega_shenron',    name: 'Omega Shenron',           series: 'Dragon Ball GT',                    rarity: 'MY', desc: 'The ultimate Shadow Dragon — seven Dragon Balls worth of negative energy given one overwhelming form.' },
  { id: 'super_17_dbz',     name: 'Super 17',                series: 'Dragon Ball GT',                    rarity: 'E',  desc: 'Two Android 17s fused — with an absolute energy absorption that made him one of GT\'s most dangerous threats.' },
  { id: 'cooler_dbz',       name: 'Cooler',                  series: 'Dragon Ball Z',                     rarity: 'L',  desc: 'Frieza\'s older brother — colder, calmer, and with a fifth form that even Frieza never bothered to unlock.' },
  { id: 'turles_dbz',       name: 'Turles',                  series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'A Saiyan who resembles Goku — his Tree of Might bears fruit that multiplied his power to frightening levels.' },
  { id: 'pan_dbz',          name: 'Pan',                     series: 'Dragon Ball GT',                    rarity: 'R',  desc: 'Gohan\'s daughter — a quarter Saiyan with surprising combat ability and the fighting spirit of her entire bloodline.' },
  { id: 'uub_dbz',          name: 'Uub',                     series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'The human reincarnation of Kid Buu — Goku\'s final opponent in Z, carrying the potential of a god.' },
  { id: 'raditz_dbz',       name: 'Raditz',                  series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'Goku\'s older brother — the Saiyan who started it all. Weaker than most threats that followed, but the first.' },
  { id: 'nappa_dbz',        name: 'Nappa',                   series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'Vegeta\'s former partner — his arrival on Earth killed several Z-Fighters and would have killed them all.' },
  { id: 'hit_dbs',          name: 'Hit',                     series: 'Dragon Ball Super',                 rarity: 'E',  desc: 'Universe 6\'s legendary assassin — his Time Skip freezes opponents for fractions of a second, over and over.' },
  { id: 'gt_goku_ssj4',     name: 'Goku (SSJ4)',             series: 'Dragon Ball GT',                    rarity: 'L',  desc: 'The legendary SSJ4 transformation — the pinnacle of Saiyan evolution that blends humanity and beast.' },
  { id: 'android17_dbz',    name: 'Android 17',              series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'A cyborg who went from villain to winner of the Tournament of Power — his energy is genuinely infinite.' },
  { id: 'videl_dbz',        name: 'Videl',                   series: 'Dragon Ball Z',                     rarity: 'R',  desc: 'Hercule\'s daughter and Gohan\'s eventual partner — she learned to fly through sheer stubbornness.' },
  { id: 'bardock_dbz',      name: 'Bardock',                 series: 'Dragon Ball Z',                     rarity: 'E',  desc: 'Goku\'s father — a Saiyan warrior who saw Frieza\'s betrayal coming and charged at a god alone.' },
  { id: 'toppo_dbs',        name: 'Toppo',                   series: 'Dragon Ball Super',                 rarity: 'L',  desc: 'The Universe 11 Pride Trooper leader — his Destroyer form challenged even the gods of destruction.' },
  { id: 'dyspo_dbs',        name: 'Dyspo',                   series: 'Dragon Ball Super',                 rarity: 'E',  desc: 'The fastest member of the Pride Troopers — his speed rivaled even Hit\'s time manipulation.' },
  { id: 'paragus_dbz',      name: 'Paragus',                 series: 'Dragon Ball Super',                 rarity: 'E',  desc: 'Broly\'s father — a Saiyan who shaped his son\'s rage and unleashed him at precisely the wrong moment.' },

  // ── Naruto (additional) ───────────────────────────────────
  { id: 'obito_uchiha',     name: 'Obito Uchiha',            series: 'Naruto',                            rarity: 'L',  desc: 'The masked man behind everything — a Uchiha broken by grief who became the Fourth Great War\'s architect.' },
  { id: 'kabuto_yakushi',   name: 'Kabuto Yakushi',          series: 'Naruto',                            rarity: 'E',  desc: 'A spy turned perfect sage — his Edo Tensei revived history\'s greatest warriors at the worst possible time.' },
  { id: 'asuma_sarutobi',   name: 'Asuma Sarutobi',          series: 'Naruto',                            rarity: 'R',  desc: 'Team Ten\'s captain and Third Hokage\'s son — his chakra blades and gentle spirit shaped three great shinobi.' },
  { id: 'kurenai_yuhi',     name: 'Kurenai Yuhi',            series: 'Naruto',                            rarity: 'R',  desc: 'A genjutsu specialist and Team Eight\'s leader — her illusions trapped opponents completely within the mind.' },
  { id: 'anko_mitarashi',   name: 'Anko Mitarashi',          series: 'Naruto',                            rarity: 'R',  desc: 'Orochimaru\'s former student — her curse mark and snake techniques made the Forest of Death her domain.' },
  { id: 'iruka_umino',      name: 'Iruka Umino',             series: 'Naruto',                            rarity: 'R',  desc: 'The teacher who saw Naruto first — his belief in the boy who had none planted the seed of everything that followed.' },
  { id: 'might_guy',        name: 'Might Guy',               series: 'Naruto',                            rarity: 'E',  desc: 'The Great Ninja Turtle — when he opened the Eighth Gate against Madara, he forced a god to admit he was strong.' },
  { id: 'kisame_hoshigaki', name: 'Kisame Hoshigaki',        series: 'Naruto',                            rarity: 'E',  desc: 'The Monster of the Hidden Mist — he and Samehada absorbed chakra on a scale nobody else could match.' },
  { id: 'deidara_akatsuki', name: 'Deidara',                 series: 'Naruto',                            rarity: 'E',  desc: 'Art is an explosion — his clay detonations were beautiful and catastrophic in equal measure.' },
  { id: 'konan_akatsuki',   name: 'Konan',                   series: 'Naruto',                            rarity: 'E',  desc: 'The paper angel of Amegakure — six hundred billion explosive tags deployed against Obito in a single technique.' },
  { id: 'sasori_akatsuki',  name: 'Sasori',                  series: 'Naruto',                            rarity: 'E',  desc: 'The Puppet Master who turned himself into art — three hundred puppets and a Human Puppet body that never tires.' },
  { id: 'hidan_akatsuki',   name: 'Hidan',                   series: 'Naruto',                            rarity: 'R',  desc: 'The immortal Akatsuki member — his Jashin ritual linked his wounds to his opponent. Burial was the only answer.' },
  { id: 'kakuzu_akatsuki',  name: 'Kakuzu',                  series: 'Naruto',                            rarity: 'R',  desc: 'A miser who collected the hearts of his enemies — five Nature Releases from five separate bodies.' },
  { id: 'danzo_naruto',     name: 'Danzo Shimura',           series: 'Naruto',                            rarity: 'L',  desc: 'The Shadows\' Hokage — an arm full of Sharingan eyes and a philosophy of brutal pragmatism for the village.' },
  { id: 'hiruzen_naruto',   name: 'Hiruzen Sarutobi',        series: 'Naruto',                            rarity: 'L',  desc: 'The Third Hokage — the Professor who mastered all Konoha techniques, ending his own life to seal Orochimaru.' },
  { id: 'tobirama_naruto',  name: 'Tobirama Senju',          series: 'Naruto',                            rarity: 'L',  desc: 'The Second Hokage — inventor of Edo Tensei, the Flying Thunder God, and Shadow Clones. A kit that built a village.' },
  { id: 'nagato_naruto',    name: 'Nagato',                  series: 'Naruto',                            rarity: 'L',  desc: 'The wielder of the Rinnegan — Six Paths of Pain as his avatar, reviving an entire village with his final breath.' },
  { id: 'fu_naruto',        name: 'Fu',                      series: 'Naruto',                            rarity: 'R',  desc: 'The host of Chomei, the Seven-Tailed Beetle — a joyful jinchuriki whose fate was shaped by the very world that named her.' },
  { id: 'torune_naruto',    name: 'Torune',                  series: 'Naruto',                            rarity: 'R',  desc: 'A Root member whose Nano-Sized Venomous Insects made him one of the most quietly lethal shinobi in Danzo\'s arsenal.' },
  { id: 'kimimaro_naruto',  name: 'Kimimaro',                series: 'Naruto',                            rarity: 'E',  desc: 'The last of his clan — his Shikotsumyaku bone manipulation made him a perfect weapon that burned itself out.' },

  // ── One Piece (additional) ────────────────────────────────
  { id: 'crocodile_op',     name: 'Crocodile',               series: 'One Piece',                         rarity: 'E',  desc: 'Sir Crocodile — the Warlord whose sand dried everything he touched, and whose past holds a secret nobody expected.' },
  { id: 'enel_op',          name: 'Enel',                    series: 'One Piece',                         rarity: 'E',  desc: 'The self-proclaimed God of Skypiea — his lightning struck at the speed of electricity and covered an island.' },
  { id: 'rob_lucci_op',     name: 'Rob Lucci',               series: 'One Piece',                         rarity: 'E',  desc: 'CP9\'s deadliest agent — his Rokuogan and full Zoan form pushed Luffy to a near-death confrontation.' },
  { id: 'smoker_op',        name: 'Smoker',                  series: 'One Piece',                         rarity: 'R',  desc: 'The White Hunter — a Marine Captain whose smoke Logia makes him intangible and his justice makes him relentless.' },
  { id: 'perona_op',        name: 'Perona',                  series: 'One Piece',                         rarity: 'R',  desc: 'The Ghost Princess — her Negative Hollow turned most opponents into sobbing puddles, except one idiot who was already negative.' },
  { id: 'bartolomeo_op',    name: 'Bartolomeo',              series: 'One Piece',                         rarity: 'R',  desc: 'The Cannibal — an absolute Luffy fanboy whose Barrier-Barrier fruit is more powerful than anyone gives it credit for.' },
  { id: 'cavendish_op',     name: 'Cavendish',               series: 'One Piece',                         rarity: 'E',  desc: 'The Pirate Prince — his alter ego Hakuba moves at a speed that makes his blade invisible.' },
  { id: 'coby_op',          name: 'Koby',                    series: 'One Piece',                         rarity: 'R',  desc: 'The boy who started as Alvida\'s chore boy and became a Marine hero — his Observation Haki grew to extraordinary levels.' },
  { id: 'fujitora_op',      name: 'Fujitora',                series: 'One Piece',                         rarity: 'L',  desc: 'The Gravity Admiral — a blind swordsman who pulls meteors from the sky and seeks a world without Warlords.' },
  { id: 'sengoku_op',       name: 'Sengoku',                 series: 'One Piece',                         rarity: 'L',  desc: 'The Fleet Admiral who fought at Marineford — his Mythical Zoan Buddha form filled the entire plaza with shockwaves.' },
  { id: 'buggy_op',         name: 'Buggy the Clown',         series: 'One Piece',                         rarity: 'R',  desc: 'The former cabin boy of Roger\'s crew who stumbled into being a Yonko — beloved by accident, terrifying by reputation.' },
  { id: 'monet_op',         name: 'Monet',                   series: 'One Piece',                         rarity: 'E',  desc: 'A Snow Logia user and Doflamingo\'s spy — her ice manipulation froze opponents in body and in decision-making.' },
  { id: 'sugar_op',         name: 'Sugar',                   series: 'One Piece',                         rarity: 'R',  desc: 'A child-like member of the Donquixote family — her Hobby-Hobby fruit turned anyone she touched into a forgotten toy.' },
  { id: 'caesar_op',        name: 'Caesar Clown',            series: 'One Piece',                         rarity: 'E',  desc: 'The gas scientist — his Logia mastery over gases made him feared as a weapon of mass destruction by everyone sane.' },
  { id: 'vergo_op',         name: 'Vergo',                   series: 'One Piece',                         rarity: 'E',  desc: 'Doflamingo\'s right hand — a Marine Vice Admiral who coated his entire body in Haki so dense even Law\'s ROOM failed him.' },
  { id: 'pica_op',          name: 'Pica',                    series: 'One Piece',                         rarity: 'E',  desc: 'Doflamingo\'s stone giant — his Stone-Stone fruit turned an entire mountain into his body, and his voice was very high-pitched.' },
  { id: 'trebol_op',        name: 'Trebol',                  series: 'One Piece',                         rarity: 'R',  desc: 'The sticky Donquixote officer — his Beta-Beta fruit made him a walking adhesive mine that ignited on contact.' },
  { id: 'brulee_op',        name: 'Brulee',                  series: 'One Piece',                         rarity: 'R',  desc: 'Charlotte Brulee — her Mirror-Mirror fruit gave Big Mom\'s crew access to every reflective surface on Whole Cake Island.' },
  { id: 'pudding_op',       name: 'Charlotte Pudding',       series: 'One Piece',                         rarity: 'R',  desc: 'The three-eyed daughter of Big Mom — her Memo-Memo fruit edited memories, and her feelings for Sanji ran away with her plans.' },
  { id: 'carrot_op',        name: 'Carrot',                  series: 'One Piece',                         rarity: 'E',  desc: 'A Mink of Zou — her Sulong transformation under a full moon made her a force that shook the seas.' },

  // ── Bleach (additional) ───────────────────────────────────
  { id: 'lille_barro_bl',   name: 'Lille Barro',             series: 'Bleach',                            rarity: 'E',  desc: 'First of Yhwach\'s Schutzstaffel — his X-Axis creates a portal of absolute destruction that bypasses all defence.' },
  { id: 'pernida_bl',       name: 'Pernida Parnkgjas',       series: 'Bleach',                            rarity: 'L',  desc: 'The left arm of the Soul King — its Compulsory ability bends and breaks the nervous systems of everything it touches.' },
  { id: 'gerard_bl',        name: 'Gerard Valiant',          series: 'Bleach',                            rarity: 'L',  desc: 'The Miracle — every wound he takes only makes him larger, stronger, and more impossible to stop.' },
  { id: 'as_nodt_bl',       name: 'As Nodt',                 series: 'Bleach',                            rarity: 'E',  desc: 'His Schrift, Fear, bypasses every defence and injects pure terror into the nervous system. Byakuya\'s worst day.' },
  { id: 'bazz_b_bl',        name: 'Bazz-B',                  series: 'Bleach',                            rarity: 'R',  desc: 'A Sternritter whose H is for The Heat — his fire has enough temperature to reduce even high-speed regeneration to ash.' },
  { id: 'harribel_bl',      name: 'Tier Harribel',           series: 'Bleach',                            rarity: 'E',  desc: 'Third Espada — her water-based powers and protective instincts make her the most honourable warrior in Hueco Mundo.' },
  { id: 'szayelaporro_bl',  name: 'Szayelaporro Granz',      series: 'Bleach',                            rarity: 'E',  desc: 'Eighth Espada — a scientist who made himself the perfect being, until Mayuri had a drug for that too.' },
  { id: 'nnoitora_bl',      name: 'Nnoitora Gilga',          series: 'Bleach',                            rarity: 'E',  desc: 'Fifth Espada — his Hierro was the hardest of any Espada, and he charged every battle as if dying was the point.' },
  { id: 'starrk_bl',        name: 'Coyote Starrk',           series: 'Bleach',                            rarity: 'L',  desc: 'First Espada — his Cero Metralleta fired thousands of shots per second, and all he ever wanted was not to be alone.' },
  { id: 'gremmy_bl',        name: 'Gremmy Thoumeaux',        series: 'Bleach',                            rarity: 'L',  desc: 'V for Visionary — he could make anything he imagined real. Yachiru\'s fight against him was the series\' wildest battle.' },
  { id: 'haschwalth_bl',    name: 'Jugram Haschwalth',       series: 'Bleach',                            rarity: 'L',  desc: 'Yhwach\'s right hand — he held The Almighty at night while his master slept, and answered to nothing less.' },
  { id: 'nanao_bl',         name: 'Nanao Ise',               series: 'Bleach',                            rarity: 'R',  desc: 'Shunsui\'s lieutenant — the quiet bookworm who reclaimed her family\'s divine sword and used it to kill a god.' },
  { id: 'nemu_bl',          name: 'Nemu Kurotsuchi',         series: 'Bleach',                            rarity: 'R',  desc: 'Mayuri\'s creation and lieutenant — she was more than her origin, which she proved with her final sacrifice.' },
  { id: 'izuru_kira_bl',    name: 'Izuru Kira',              series: 'Bleach',                            rarity: 'R',  desc: 'Third seat of the third division — Wabisuke doubles the weight of anything it hits, until falling is unavoidable.' },
  { id: 'momo_hinamori_bl', name: 'Momo Hinamori',           series: 'Bleach',                            rarity: 'R',  desc: 'A lieutenant whose trust in Aizen cost her everything — her loyalty and her pain are the series\' most human story.' },

  // ── Jujutsu Kaisen (additional) ───────────────────────────
  { id: 'hakari_jjk',       name: 'Kinji Hakari',            series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'A suspended student with a domain that runs on probability — once the jackpot hits, he becomes literally unkillable.' },
  { id: 'higuruma_jjk',     name: 'Hiromi Higuruma',         series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'A lawyer turned sorcerer — his Deadly Sentencing domain forces a courtroom trial where losing means Executioner\'s Sword.' },
  { id: 'hana_kurusu_jjk',  name: 'Hana Kurusu',             series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'An angel inhabiting a human vessel — her Jacob\'s Ladder is one of the few techniques that can unseal anything.' },
  { id: 'kamo_jjk',         name: 'Noritoshi Kamo',          series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'A student of the Kamo clan — his Blood Manipulation technique launches blood as lethal projectiles or hardened weapons.' },
  { id: 'naobito_jjk',      name: 'Naobito Zenin',           series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'The former Zenin head — his Projection Sorcery animated the world in 1/24th second frames, making him blindingly fast.' },
  { id: 'panda_jjk',        name: 'Panda',                   series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'A cursed corpse given life and a soul — not a panda at all, and three personalities switching in battle.' },
  { id: 'mechamaru_jjk',    name: 'Mechamaru',               series: 'Jujutsu Kaisen',                    rarity: 'R',  desc: 'A remote-controlled sorcerer whose body was destroyed — his Puppet Manipulation fought wars while he survived.' },
  { id: 'kashimo_jjk',      name: 'Hajime Kashimo',          series: 'Jujutsu Kaisen',                    rarity: 'L',  desc: 'A legendary sorcerer who gambled his future to fight the strongest — his electromagnetic body kills on contact.' },
  { id: 'uraume_jjk',       name: 'Uraume',                  series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'Sukuna\'s devoted servant across the centuries — patient, lethal, and waiting for his full return above all else.' },
  { id: 'ryu_ishigori_jjk', name: 'Ryu Ishigori',            series: 'Jujutsu Kaisen',                    rarity: 'E',  desc: 'A special grade sorcerer who lost his memories but not his Cursed Energy — Granite Blast reshapes battlefields.' },

  // ── My Hero Academia (additional) ─────────────────────────
  { id: 'monoma_mha',       name: 'Neito Monoma',            series: 'My Hero Academia',                  rarity: 'R',  desc: 'A Class 1-B student who copies quirks — his rivalry with Class 1-A is performed, but his Copy is completely real.' },
  { id: 'nejire_hado_mha',  name: 'Nejire Hado',             series: 'My Hero Academia',                  rarity: 'R',  desc: 'One of the Big Three — her Wave Motion quirk spirals energy outward in waves that flatten entire city blocks.' },
  { id: 'tamaki_amajiki_mha',name:'Tamaki Amajiki',          series: 'My Hero Academia',                  rarity: 'E',  desc: 'One of the Big Three — Manifest transforms eaten food into body parts, turning a diet into an arsenal.' },
  { id: 'mirio_togata_mha', name: 'Mirio Togata',            series: 'My Hero Academia',                  rarity: 'E',  desc: 'The strongest student at UA — Permeation lets him phase through matter before re-materialising inside opponents.' },
  { id: 'sir_nighteye_mha', name: 'Sir Nighteye',            series: 'My Hero Academia',                  rarity: 'E',  desc: 'All Might\'s former sidekick — his Foresight predicted the future up to an hour ahead with perfect accuracy.' },
  { id: 'mirko_mha',        name: 'Mirko',                   series: 'My Hero Academia',                  rarity: 'E',  desc: 'The No. 5 hero — a rabbit-themed hero whose Leg Force kicked Nomu to pieces with one good leg left.' },
  { id: 'aizawa_mha',       name: 'Shota Aizawa',            series: 'My Hero Academia',                  rarity: 'L',  desc: 'Erasure Hero — his Erasure quirk cancelled any quirk he looked at, removing every opponent\'s greatest advantage.' },
  { id: 'present_mic_mha',  name: 'Present Mic',             series: 'My Hero Academia',                  rarity: 'R',  desc: 'The Voice Hero — his sound amplification destroys eardrums and structures at full volume, all while announcing it.' },
  { id: 'froppy_mha',       name: 'Tsuyu Asui',              series: 'My Hero Academia',                  rarity: 'R',  desc: 'The Frog Hero — her versatile quirk lets her cling, leap, camouflage, and use her tongue as a weapon and lifeline.' },
  { id: 'mineta_mha',       name: 'Minoru Mineta',           series: 'My Hero Academia',                  rarity: 'R',  desc: 'The Grape hero — his Pop Off balls stick to anything except himself, trapping opponents in ways that defy dignity.' },
  { id: 'shinso_mha',       name: 'Hitoshi Shinso',          series: 'My Hero Academia',                  rarity: 'R',  desc: 'A general studies student who could have been the most dangerous hero — Brainwashing controls anyone who replies.' },
  { id: 'hpresent_mic_mha', name: 'Midnight',                series: 'My Hero Academia',                  rarity: 'R',  desc: 'The Somnambulist Hero — her Somnambulist quirk released a sleep-inducing mist that ended battles before they started.' },
  { id: 'fat_gum_mha',      name: 'Fat Gum',                 series: 'My Hero Academia',                  rarity: 'E',  desc: 'A fat-absorbing hero whose stored calories discharged in a single punch that reverberated for blocks.' },
  { id: 'best_jeanist_mha', name: 'Best Jeanist',            series: 'My Hero Academia',                  rarity: 'E',  desc: 'The Fiber Hero — his Fiber Master manipulated threads at the molecular level, wrapping villains in inescapable fabric.' },
  { id: 'gang_orca_mha',    name: 'Gang Orca',               series: 'My Hero Academia',                  rarity: 'E',  desc: 'A hero who looks like a villain — his orca physiology and Orcinus sonic waves paralysed targets at range.' },

  // ── Demon Slayer (additional) ─────────────────────────────
  { id: 'nakime_ds',        name: 'Nakime',                  series: 'Demon Slayer',                      rarity: 'E',  desc: 'Upper Moon Four (interim) — her Biwa manipulation folded space to create an infinite fortress that trapped even hashiras.' },
  { id: 'daki_ds',          name: 'Daki',                    series: 'Demon Slayer',                      rarity: 'E',  desc: 'Upper Moon Six — her obi sashes stored humans alive and severed Hashira necks before they blinked.' },
  { id: 'gyutaro_ds',       name: 'Gyutaro',                 series: 'Demon Slayer',                      rarity: 'E',  desc: 'The true Upper Moon Six — his blood sickles were laced with poison that killed even beheaded opponents.' },
  { id: 'akaza_ds',         name: 'Akaza',                   series: 'Demon Slayer',                      rarity: 'L',  desc: 'Upper Moon Three — he destroyed the Flame Hashira without taking a scratch, and almost wasn\'t stopped even then.' },
  { id: 'hantengu_ds',      name: 'Hantengu',                series: 'Demon Slayer',                      rarity: 'E',  desc: 'Upper Moon Four — his emotional clones each carried the full power of an upper moon, making him nearly unkillable alone.' },
  { id: 'gyokko_ds',        name: 'Gyokko',                  series: 'Demon Slayer',                      rarity: 'E',  desc: 'Upper Moon Five — his ceramic vases spawned fish demons, and his true form covered enemies in a hardened shell of scales.' },
  { id: 'douma_ds',         name: 'Douma',                   series: 'Demon Slayer',                      rarity: 'L',  desc: 'Upper Moon Two — his ice cryokinesis froze and dissolved flesh into his body. Shinobu took him down with poison.' },
  { id: 'enmu_ds',          name: 'Enmu',                    series: 'Demon Slayer',                      rarity: 'E',  desc: 'Lower Moon One — his Blood Demon Art trapped victims in dreams so pleasant they refused to wake up.' },
  { id: 'zohakuten_ds',     name: 'Zohakuten',               series: 'Demon Slayer',                      rarity: 'L',  desc: 'Hantengu\'s hatred clone — four heads of devastating sound blasts and the physical strength of an upper moon.' },
  { id: 'kagaya_ds',        name: 'Kagaya Ubuyashiki',       series: 'Demon Slayer',                      rarity: 'R',  desc: 'The Master of the Demon Slayer Corps — every Hashira obeyed him completely, and his calm never left even at the end.' },

  // ── Attack on Titan (additional) ─────────────────────────
  { id: 'historia_aot',     name: 'Historia Reiss',          series: 'Attack on Titan',                   rarity: 'R',  desc: 'Once Historia, then Queen — she chose a difficult truth over a comfortable lie, and led her people through it.' },
  { id: 'connie_aot',       name: 'Connie Springer',         series: 'Attack on Titan',                   rarity: 'R',  desc: 'A member of the 104th who never stopped pushing forward — his arc carries some of the series\' most heart-breaking turns.' },
  { id: 'sasha_aot',        name: 'Sasha Braus',             series: 'Attack on Titan',                   rarity: 'R',  desc: 'Potato Girl — a hunter whose marksmanship saved countless lives, and whose loss hit the fandom like a wall.' },
  { id: 'falco_aot',        name: 'Falco Grice',             series: 'Attack on Titan',                   rarity: 'R',  desc: 'A Warrior candidate who inherited the Jaw Titan — his bond with Gabi drives the final arc\'s most emotional beats.' },
  { id: 'gabi_aot',         name: 'Gabi Braun',              series: 'Attack on Titan',                   rarity: 'R',  desc: 'A Warrior candidate of terrifying skill — her journey from zealot to something more complicated earned her the story.' },

  // ── Fairy Tail (additional) ───────────────────────────────
  { id: 'zeref_ft',         name: 'Zeref Dragneel',          series: 'Fairy Tail',                        rarity: 'MY', desc: 'The Black Wizard — his Death Magic killed everything around him for centuries before Mavis gave him reason to keep going.' },
  { id: 'mard_geer_ft',     name: 'Mard Geer',               series: 'Fairy Tail',                        rarity: 'L',  desc: 'The Underworld King — E.N.D.\'s gatekeeper, whose Memento Mori sent anything it touched beyond the realm of the living.' },
  { id: 'god_serena_ft',    name: 'God Serena',              series: 'Fairy Tail',                        rarity: 'L',  desc: 'The most powerful of the Ishgar Wizard Saints — eight Dragon Slayer elements in one body, though Acnologia disagreed.' },
  { id: 'brandish_ft',      name: 'Brandish',                series: 'Fairy Tail',                        rarity: 'E',  desc: 'Commandant of Alvarez — her Command T resized anything, including magic tumours and entire countries.' },
  { id: 'dimaria_ft',       name: 'Dimaria Yesta',           series: 'Fairy Tail',                        rarity: 'E',  desc: 'A member of Spriggan 12 — Age Seal froze time for everyone but herself, making her brutally unchallenged.' },
  { id: 'neinhart_ft',      name: 'Neinhart',                series: 'Fairy Tail',                        rarity: 'E',  desc: 'A Spriggan 12 member — his Historia of the Dead resurrected spirits of fallen enemies at their peak strength.' },
  { id: 'bloodman_ft',      name: 'Bloodman',                series: 'Fairy Tail',                        rarity: 'L',  desc: 'A Spriggan 12 member — he wielded all Etherious curses simultaneously in a body of pure Magical Barrier Particles.' },
  { id: 'invel_ft',         name: 'Invel Yura',              series: 'Fairy Tail',                        rarity: 'E',  desc: 'Zeref\'s Winter General — his Ice Lock forced opponents to fight each other to the death in a chain of absolute cold.' },
  { id: 'ajeel_ft',         name: 'Ajeel Ramal',             series: 'Fairy Tail',                        rarity: 'E',  desc: 'The Sand Emperor — his Sea of Sand suffocated armies, and his dehydration magic turned bodies to dust.' },
  { id: 'jacob_ft',         name: 'Jacob Lessio',            series: 'Fairy Tail',                        rarity: 'E',  desc: 'A Spriggan 12 member — his Archive magic and assassination techniques made him a ghost within any battlefield.' },

  // ── Black Clover (additional) ─────────────────────────────
  { id: 'yuno_spade',       name: 'Yuno (Spade Kingdom)',    series: 'Black Clover',                      rarity: 'L',  desc: 'Yuno revealed as the Spade Kingdom\'s prince — his Wind and Star magic combined make him the second strongest being Asta knows.' },
  { id: 'asta_devil_bc',    name: 'Asta (Black Devil)',      series: 'Black Clover',                      rarity: 'LT', desc: 'Asta\'s devil union at full strength — Liebe\'s anti-magic infused entirely, no limit on the negation that breaks gods.' },
  { id: 'noelle_valkyrie',  name: 'Noelle (Valkyrie Dress)', series: 'Black Clover',                      rarity: 'L',  desc: 'Noelle\'s perfected form — the Undine spirit and her royal blood combined into a water armour that challenges arch-devils.' },
  { id: 'nacht_bc',         name: 'Nacht Faust',             series: 'Black Clover',                      rarity: 'E',  desc: 'The Black Bulls\' vice-captain — a shadow mage with four devil contracts who operated entirely from the shadows.' },
  { id: 'secre_bc',         name: 'Secre Swallowtail',       series: 'Black Clover',                      rarity: 'R',  desc: 'A former royal attendant turned anti-bird — her Seal magic undid thousands of years of imprisonment with one technique.' },
  { id: 'luck_bc',          name: 'Luck Voltia',             series: 'Black Clover',                      rarity: 'R',  desc: 'The Black Bull who smiles when fighting — his Lightning Magic accelerated his body to speeds that exceeded perception.' },
  { id: 'finral_bc',        name: 'Finral Roulacase',        series: 'Black Clover',                      rarity: 'R',  desc: 'The Black Bull portal mage — his Spatial Magic was purely defensive, yet he carried battles through perfect placement.' },
  { id: 'magna_bc',         name: 'Magna Swing',             series: 'Black Clover',                      rarity: 'R',  desc: 'A Black Bull with commoner fire magic — his Soul Chain Deathmatch stole every ounce of power from Dante\'s overwhelming form.' },
  { id: 'henry_bc',         name: 'Henry Legolant',          series: 'Black Clover',                      rarity: 'R',  desc: 'The Black Bulls\' hidden member — his Recombination Magic restructures the base entirely around whoever needs it most.' },
  { id: 'liebe_bc',         name: 'Liebe',                   series: 'Black Clover',                      rarity: 'L',  desc: 'The lowest devil who became Asta\'s partner — his anti-magic was born from grief, and his trust in Asta redeemed it.' },

  // ── Log Horizon ───────────────────────────────────────────
  { id: 'shiroe_lh',        name: 'Shiroe',                  series: 'Log Horizon',                       rarity: 'E',  desc: 'The Villain in Glasses — a strategist who rewrote the rules of the Elder Tale world one contract at a time.' },
  { id: 'akatsuki_lh',      name: 'Akatsuki',                series: 'Log Horizon',                       rarity: 'R',  desc: 'A tiny assassin with great loyalty to Shiroe — her sneak attacks and devotion make her one of the series\' best characters.' },
  { id: 'naotsugu_lh',      name: 'Naotsugu',                series: 'Log Horizon',                       rarity: 'R',  desc: 'The guardian who protects with absolute commitment — and an absolute inability to stop making inappropriate jokes.' },
  { id: 'nyanta_lh',        name: 'Nyanta',                  series: 'Log Horizon',                       rarity: 'R',  desc: 'A swashbuckler who discovered you could cook real food in the game — changing the world with a frying pan.' },

  // ── Sword Art Online (additional) ─────────────────────────
  { id: 'eugeo_sao',        name: 'Eugeo',                   series: 'Sword Art Online',                  rarity: 'E',  desc: 'Kirito\'s partner in the Underworld — his Blue Rose Sword and his sacrifice defined the Alicization arc completely.' },
  { id: 'alice_sao',        name: 'Alice Zuberg',            series: 'Sword Art Online',                  rarity: 'L',  desc: 'An Integrity Knight born from the highest Synthesis — her Osmanthus Blade and her recovered humanity made her unstoppable.' },
  { id: 'sinon_sao',        name: 'Sinon',                   series: 'Sword Art Online',                  rarity: 'E',  desc: 'The GGO sharpshooter — her Hecate II sniped through walls and her nerve overcome makes her one of the series\' best.' },
  { id: 'leafa_sao',        name: 'Leafa',                   series: 'Sword Art Online',                  rarity: 'R',  desc: 'Kirito\'s sister in the real world, partner in ALO — a sylph whose flight speed was the envy of every player.' },
  { id: 'lisbeth_sao',      name: 'Lisbeth',                 series: 'Sword Art Online',                  rarity: 'R',  desc: 'The blacksmith of Aincrad — she forged Kirito\'s best equipment and wore her heart on a crafting table.' },

  // ── That Time I Got Reincarnated as a Slime (additional) ──
  { id: 'clayman_slime',    name: 'Clayman',                 series: 'That Time I Got Reincarnated as a Slime', rarity: 'E', desc: 'A Demon Lord who manipulated too many strings at once — his downfall came in front of all his peers.' },
  { id: 'luminous_slime',   name: 'Luminous Valentine',      series: 'That Time I Got Reincarnated as a Slime', rarity: 'L', desc: 'The true Demon Lord of the vampires — her divine speed and immortality made her one of Tempest\'s most powerful allies.' },
  { id: 'hinata_slime',     name: 'Hinata Sakaguchi',        series: 'That Time I Got Reincarnated as a Slime', rarity: 'E', desc: 'The Holy Knight — her anti-magic Holy Field neutralised Rimuru\'s abilities completely before their understanding grew.' },

  // ── No Game No Life ───────────────────────────────────────
  { id: 'sora_ngnl',        name: 'Sora',                    series: 'No Game No Life',                   rarity: 'E',  desc: 'The older sibling of the legendary gaming duo — his psychological warfare and reading of people make every game a trap.' },
  { id: 'shiro_ngnl',       name: 'Shiro',                   series: 'No Game No Life',                   rarity: 'L',  desc: 'An eleven-year-old with a mind that sees every possibility — together with Sora, they have never lost a game.' },
  { id: 'jibril_ngnl',      name: 'Jibril',                  series: 'No Game No Life',                   rarity: 'MY', desc: 'A Flügel who bet her library on a game — her power to nullify physical laws made her a divine weapon in the old wars.' },
  { id: 'stephanie_ngnl',   name: 'Stephanie Dola',          series: 'No Game No Life',                   rarity: 'R',  desc: 'The princess who keeps losing bets to Sora — her earnest sincerity is the heart the series never deserved but got.' },

  // ── KonoSuba ─────────────────────────────────────────────
  { id: 'kazuma_ks',        name: 'Kazuma Satou',            series: 'KonoSuba',                          rarity: 'R',  desc: 'An average NEET transported to a fantasy world — his Steal skill and shameless cunning carry a party that shouldn\'t work.' },
  { id: 'aqua_ks',          name: 'Aqua',                    series: 'KonoSuba',                          rarity: 'R',  desc: 'A goddess reduced to being Kazuma\'s party member — her divine purification clashes with her total lack of common sense.' },
  { id: 'megumin_ks',       name: 'Megumin',                 series: 'KonoSuba',                          rarity: 'E',  desc: 'An arch-wizard who mastered Explosion magic alone — one cast per day, catastrophic, and she will never stop.' },
  { id: 'darkness_ks',      name: 'Darkness',                series: 'KonoSuba',                          rarity: 'R',  desc: 'A crusader whose defence is absolute and whose offence is tragically weak — she protects the party by being hit.' },
  { id: 'wiz_ks',           name: 'Wiz',                     series: 'KonoSuba',                          rarity: 'R',  desc: 'A lich who runs a magic shop — a genuinely powerful undead mage whose business instincts are catastrophically bad.' },

  // ── The Rising of the Shield Hero (additional) ────────────
  { id: 'naofumi_rshr',     name: 'Naofumi Iwatani',         series: 'The Rising of the Shield Hero',     rarity: 'E',  desc: 'The Shield Hero — betrayed from the first day, he built his power through curses, rage, and sheer refusal to fall.' },
  { id: 'filo_rshr',        name: 'Filo',                    series: 'The Rising of the Shield Hero',     rarity: 'R',  desc: 'A filolial queen who imprinted on Naofumi — her cheerful demeanour hides the divine power of a god-bird.' },
  { id: 'glass_rshr',       name: 'Glass',                   series: 'The Rising of the Shield Hero',     rarity: 'L',  desc: 'A vassal weapon holder from another world — her fan techniques shredded the heroes in the first wave encounter.' },

  // ── Overlord (additional) ────────────────────────────────
  { id: 'sebas_ov',         name: 'Sebas Tian',              series: 'Overlord',                          rarity: 'E',  desc: 'A draconic butler of absolute composure — his physical strength is legendary and his mercy rarer than his creator intended.' },
  { id: 'entoma_ov',        name: 'Entoma Vasilissa Zeta',   series: 'Overlord',                          rarity: 'R',  desc: 'A maid of Nazarick — a spider-demon whose Insect Magic and silk-binding make her an unexpected nightmare in combat.' },
  { id: 'lupusregina_ov',   name: 'Lupusregina Beta',        series: 'Overlord',                          rarity: 'R',  desc: 'A cheerful combat maid whose power is severe — her dark instructions from Ainz reveal how little her smile means.' },

  // ── Re:Zero (additional) ──────────────────────────────────
  { id: 'echidna_rzr',      name: 'Echidna',                 series: 'Re:Zero',                           rarity: 'L',  desc: 'The Witch of Greed — she consumed information like sustenance, and her tea parties with Subaru were tests beyond tests.' },
  { id: 'frederica_rzr',    name: 'Frederica Baumann',       series: 'Re:Zero',                           rarity: 'R',  desc: 'The Roswaal manor\'s head maid — a half-beast with loyal service masking abilities that far exceed a servant\'s station.' },
  { id: 'garfiel_rzr',      name: 'Garfiel Tinsel',          series: 'Re:Zero',                           rarity: 'R',  desc: 'The guardian of the Sanctuary — his tiger beast transformation and reckless courage protect what he cannot explain.' },

  // ── Angel Beats ───────────────────────────────────────────
  { id: 'otonashi_ab',      name: 'Otonashi Yuzuru',         series: 'Angel Beats',                       rarity: 'R',  desc: 'A boy who woke up without memories in a school for the dead — his journey to understand his own heart is the story.' },
  { id: 'kanade_ab',        name: 'Kanade Tachibana',        series: 'Angel Beats',                       rarity: 'E',  desc: 'The Angel — her HandSonic blades and her quiet sincerity masked a mission more human than any of the Afterlife Battle Front.' },
  { id: 'yuri_ab',          name: 'Yuri Nakamura',           series: 'Angel Beats',                       rarity: 'R',  desc: 'The SSS leader who refused to pass on — her grief turned into a rebellion against God, and then into understanding.' },

  // ── My Teen Romantic Comedy (Oregairu) ────────────────────
  { id: 'hachiman_og',      name: 'Hachiman Hikigaya',       series: 'My Teen Romantic Comedy SNAFU',     rarity: 'R',  desc: 'A cynic whose solution to every problem is to sacrifice himself — and who had to learn that wasn\'t strength.' },
  { id: 'yukino_og',        name: 'Yukino Yukinoshita',      series: 'My Teen Romantic Comedy SNAFU',     rarity: 'E',  desc: 'The Service Club\'s perfectionist — her cold efficiency and quiet vulnerability make her one of the genre\'s best characters.' },
  { id: 'yui_og',           name: 'Yui Yuigahama',           series: 'My Teen Romantic Comedy SNAFU',     rarity: 'R',  desc: 'The heart of the trio — her warmth and emotional perception see what the other two are too guarded to name.' },

  // ── Toradora ──────────────────────────────────────────────
  { id: 'ryuuji_td',        name: 'Ryuuji Takasu',           series: 'Toradora',                          rarity: 'R',  desc: 'A gentle boy with a scary face — his cooking and his patience for Taiga\'s chaos are the engine of the story.' },
  { id: 'taiga_td',         name: 'Taiga Aisaka',            series: 'Toradora',                          rarity: 'E',  desc: 'The Palmtop Tiger — a tiny terror who could knock out anyone and hide everything she felt behind a wooden sword.' },
  { id: 'minori_td',        name: 'Minori Kushieda',         series: 'Toradora',                          rarity: 'R',  desc: 'Ryuuji\'s original crush — her relentless positivity masks feelings she chose to bury for the friend she loves more.' },

  // ── Is It Wrong to Try to Pick Up Girls in a Dungeon? (additional) ──
  { id: 'ryu_lion_dn',      name: 'Ryu Lion',                series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'E', desc: 'The Gale Wind — an elf adventurer of remarkable power who serves at the Hostess of Fertility and fights for her lost familia.' },
  { id: 'welf_dn',          name: 'Welf Crozzo',             series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'R', desc: 'A smith who joins Bell\'s familia — his refusal to make cursed weapons cost him everything, but his pride never bent.' },
  { id: 'lilly_dn',         name: 'Liliruca Arde',           series: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?', rarity: 'R', desc: 'A Pallum supporter who found a real home in Bell\'s party — her tactical mind and her hard-won trust define her arc.' },

  // ── Dr. Stone ─────────────────────────────────────────────
  { id: 'senku_ishigami',   name: 'Senku Ishigami',          series: 'Dr. Stone',                         rarity: 'E',  desc: 'Ten billion percent — a scientist who rebuilt civilisation from stone-age materials through pure knowledge and will.' },
  { id: 'chrome_stone',     name: 'Chrome',                  series: 'Dr. Stone',                         rarity: 'R',  desc: 'A self-taught sorcerer who turned out to be a natural scientist — his curiosity is the village\'s unofficial engine.' },
  { id: 'kohaku_stone',     name: 'Kohaku',                  series: 'Dr. Stone',                         rarity: 'R',  desc: 'A warrior who became one of Senku\'s most loyal allies — her strength and her loyalty to her sister drive everything.' },
  { id: 'gen_asagiri_stone',name: 'Gen Asagiri',             series: 'Dr. Stone',                         rarity: 'R',  desc: 'A mentalist who chose Senku\'s side permanently — his psychological manipulation is science applied to human behaviour.' },
  { id: 'ryusui_stone',     name: 'Ryusui Nanami',           series: 'Dr. Stone',                         rarity: 'E',  desc: 'The millionaire revived for sailing — his navigation, piloting, and relentless desire to have everything drove the expedition forward.' },

  // ── The Promised Neverland ────────────────────────────────
  { id: 'emma_tpn',         name: 'Emma',                    series: 'The Promised Neverland',            rarity: 'E',  desc: 'The kindest escapee — her plan was never to leave anyone behind, and she paid for it with everything she had.' },
  { id: 'norman_tpn',       name: 'Norman',                  series: 'The Promised Neverland',            rarity: 'L',  desc: 'The perfect student — his mind saw the solution every time, and his willingness to sacrifice himself made him terrifying.' },
  { id: 'ray_tpn',          name: 'Ray',                     series: 'The Promised Neverland',            rarity: 'E',  desc: 'The child who knew the truth from the beginning — his resignation became defiance the moment Emma refused to accept it.' },
  { id: 'isabella_tpn',     name: 'Isabella',                series: 'The Promised Neverland',            rarity: 'L',  desc: 'Mama — a human who chose to farm the children she raised, until the day the love she buried came back to haunt her.' },
  { id: 'musica_tpn',       name: 'Musica',                  series: 'The Promised Neverland',            rarity: 'R',  desc: 'A demon who refused to eat humans — her blood magic and her compassion prove the world of TPN is more than black and white.' },

  // ── Kakegurui (additional) ────────────────────────────────
  { id: 'mary_saotome_kk',  name: 'Mary Saotome',            series: 'Kakegurui',                         rarity: 'E',  desc: 'The girl who lost to Yumeko and decided to become exactly as dangerous — her instinct for gambling grew into something lethal.' },
  { id: 'midari_kk',        name: 'Midari Ikishima',         series: 'Kakegurui',                         rarity: 'R',  desc: 'The head of the beautification committee who gambles for the thrill of being killed — unsettling in every sense.' },
  { id: 'yumemi_kk',        name: 'Yumemi Yumemite',         series: 'Kakegurui',                         rarity: 'R',  desc: 'An idol who uses her fanbase as a weapon in gambling — her calculated theatrics hide a completely ruthless competitor.' },

  // ── Assassination Classroom (additional) ──────────────────
  { id: 'nagisa_ac',        name: 'Nagisa Shiota',           series: 'Assassination Classroom',           rarity: 'E',  desc: 'The quiet student who turned out to have the most lethal instinct in the class — Koro-sensei saw it from the start.' },
  { id: 'kaede_ac',         name: 'Kaede Kayano',            series: 'Assassination Classroom',           rarity: 'R',  desc: 'A student hiding a lethal truth — her tentacle cells and her obsession concealed a grief that drove the entire plan.' },
  { id: 'irina_ac',         name: 'Irina Jelavic',           series: 'Assassination Classroom',           rarity: 'R',  desc: 'The English teacher who is also a professional assassin — her honeytrap tactics and marksmanship are genuinely world-class.' },

  // ── Berserk (additional) ──────────────────────────────────
  { id: 'schierke_brsrk',   name: 'Schierke',                series: 'Berserk',                           rarity: 'R',  desc: 'A young mage who joined Guts\' party — her elemental spirits and her steady growth make her one of the group\'s pillars.' },
  { id: 'isidro_brsrk',     name: 'Isidro',                  series: 'Berserk',                           rarity: 'R',  desc: 'A young thief who idolises Guts — his speed-based sword style grows toward something that could make the dream real.' },
  { id: 'casca_brsrk',      name: 'Casca',                   series: 'Berserk',                           rarity: 'E',  desc: 'The former commander of the Band of the Hawk — her journey of loss and recovery is Berserk\'s most human story.' },

  // ── Rurouni Kenshin ───────────────────────────────────────
  { id: 'himura_kenshin',   name: 'Himura Kenshin',          series: 'Rurouni Kenshin',                   rarity: 'MY', desc: 'The Hitokiri Battousai turned wandering samurai — his reverse-blade vow and his mastery of Hiten Mitsurugi Ryu are absolute.' },
  { id: 'sanosuke_sagara',  name: 'Sanosuke Sagara',         series: 'Rurouni Kenshin',                   rarity: 'E',  desc: 'A former Sekihoutai member who became Kenshin\'s brawling partner — his Futae no Kiwami shattered any defence.' },
  { id: 'hajime_saito',     name: 'Hajime Saito',            series: 'Rurouni Kenshin',                   rarity: 'L',  desc: 'The third captain of the Shinsengumi — his Gatotsu stance was designed to kill in a single thrust, and it never missed.' },
  { id: 'makoto_shishio',   name: 'Makoto Shishio',          series: 'Rurouni Kenshin',                   rarity: 'MY', desc: 'The man wrapped in bandages — burned alive and left for dead, he built an army to burn the Meiji government in return.' },
  { id: 'aoshi_shinomori',  name: 'Aoshi Shinomori',         series: 'Rurouni Kenshin',                   rarity: 'L',  desc: 'The Okashira of the Oniwabanshu — his Kodachi Nitouryu style was deadly at close range against any attacker.' },

  // ── Samurai Champloo ──────────────────────────────────────
  { id: 'jin_sc',           name: 'Jin',                     series: 'Samurai Champloo',                  rarity: 'E',  desc: 'A ronin of the classical school — his precise, controlled kenjutsu answered the chaos of Mugen\'s every swing.' },
  { id: 'mugen_sc',         name: 'Mugen',                   series: 'Samurai Champloo',                  rarity: 'E',  desc: 'A swordsman without a style — his breakdancing-inspired Champloo Kendo was impossible to read, predict, or counter.' },
  { id: 'fuu_sc',           name: 'Fuu',                     series: 'Samurai Champloo',                  rarity: 'R',  desc: 'The girl who hired two killers to find a samurai who smells of sunflowers — stubborn enough to survive the entire journey.' },

  // ── Claymore ─────────────────────────────────────────────
  { id: 'claire_cy',        name: 'Clare',                   series: 'Claymore',                          rarity: 'E',  desc: 'The weakest Claymore ranked last — her Quicksword and the Yoma flesh fused into her drove her past every ranked warrior.' },
  { id: 'teresa_cy',        name: 'Teresa',                  series: 'Claymore',                          rarity: 'L',  desc: 'The strongest Claymore in history — her ability to suppress her Yoki completely made her unreadable and unstoppable.' },
  { id: 'miria_cy',         name: 'Miria',                   series: 'Claymore',                          rarity: 'E',  desc: 'The Phantom — her afterimage technique created duplicates that confused and overwhelmed any foe she faced.' },
  { id: 'jean_cy',          name: 'Jean',                    series: 'Claymore',                          rarity: 'R',  desc: 'A Claymore whose Drill Sword technique rotated her arm at lethal speed — and who gave Clare her life back in the abyss.' },

  // ── Seraph of the End ─────────────────────────────────────
  { id: 'yuichiro_soe',     name: 'Yuichiro Hyakuya',        series: 'Seraph of the End',                 rarity: 'E',  desc: 'A boy who survived the vampire apocalypse through sheer fury — the Asura mode within him rewrites the battle entirely.' },
  { id: 'mikaela_soe',      name: 'Mikaela Hyakuya',         series: 'Seraph of the End',                 rarity: 'L',  desc: 'A vampire who never stopped being human — his blood and his love for Yu are the story\'s most painful contradiction.' },
  { id: 'shinya_soe',       name: 'Shinya Hiragi',           series: 'Seraph of the End',                 rarity: 'E',  desc: 'A marksman of the Hiragi family — his Byakkomaru beast-demon manifested a white tiger that obeyed every command.' },
  { id: 'krul_soe',         name: 'Krul Tepes',              series: 'Seraph of the End',                 rarity: 'L',  desc: 'The third progenitor — queen of Japan\'s vampires, whose strength and ancient fury make most progenitors hesitate.' },

  // ── Fate Series ───────────────────────────────────────────
  { id: 'saber_fate',       name: 'Saber (Artoria)',         series: 'Fate/Stay Night',                   rarity: 'L',  desc: 'The King of Knights — Excalibur\'s holy light and her Invisible Air concealment made her one of the greatest Servants.' },
  { id: 'emiya_fate',       name: 'Archer (EMIYA)',          series: 'Fate/Stay Night',                   rarity: 'E',  desc: 'A Counter Guardian armed with Unlimited Blade Works — an endless supply of traced Noble Phantasms from every hero.' },
  { id: 'gilgamesh_fate',   name: 'Gilgamesh',               series: 'Fate/Stay Night',                   rarity: 'MY', desc: 'The King of Heroes — his Gate of Babylon contains every treasure and every weapon humanity ever imagined or will imagine.' },
  { id: 'cu_chulainn_fate', name: 'Lancer (Cu Chulainn)',    series: 'Fate/Stay Night',                   rarity: 'E',  desc: 'A red-clad Irish hero — his Gae Bolg cursed spear launched reverse-causality: it always pierced the heart.' },
  { id: 'jeanne_fate',      name: 'Jeanne d\'Arc',           series: 'Fate/Apocrypha',                    rarity: 'L',  desc: 'The Ruler-class Servant — La Pucelle burned everything in a final holy flame while her banner held the field.' },
  { id: 'medusa_fate',      name: 'Rider (Medusa)',          series: 'Fate/Stay Night',                   rarity: 'E',  desc: 'The Gorgon who refused to be a monster — Bellerophon and Pegasus made her the siege weapon nobody saw coming.' },

  // ── Puella Magi Madoka Magica ─────────────────────────────
  { id: 'madoka_magica',    name: 'Madoka Kaname',           series: 'Puella Magi Madoka Magica',         rarity: 'E',  desc: 'The girl whose wish rewrote the laws of the universe — her hope became the concept that erases despair itself.' },
  { id: 'homura_magica',    name: 'Homura Akemi',            series: 'Puella Magi Madoka Magica',         rarity: 'L',  desc: 'A magical girl who reset time over a hundred times for one person — her love became a catastrophe, and a miracle.' },
  { id: 'sayaka_magica',    name: 'Sayaka Miki',             series: 'Puella Magi Madoka Magica',         rarity: 'R',  desc: 'A magical girl whose grief turned into a Witch — her fall was the series\' first gut-punch and its most honest tragedy.' },
  { id: 'mami_magica',      name: 'Mami Tomoe',              series: 'Puella Magi Madoka Magica',         rarity: 'E',  desc: 'The veteran magical girl who showed others how it\'s done — until Charlotte showed her what it really costs.' },
  { id: 'kyoko_magica',     name: 'Kyoko Sakura',            series: 'Puella Magi Madoka Magica',         rarity: 'E',  desc: 'A selfish survivor who gave everything for Sayaka at the end — her lance and her arc were both perfectly tragic.' },

  // ── Violet Evergarden ────────────────────────────────────
  { id: 'violet_vg',        name: 'Violet Evergarden',       series: 'Violet Evergarden',                 rarity: 'E',  desc: 'A former soldier who learned to write emotions — her Auto Memory Doll letters captured what the heart couldn\'t say.' },
  { id: 'claudia_vg',       name: 'Claudia Hodgins',         series: 'Violet Evergarden',                 rarity: 'R',  desc: 'The postal service president who gave Violet a home after the war — protective, principled, and quietly grieving.' },
  { id: 'gilbert_vg',       name: 'Gilbert Bougainvillea',   series: 'Violet Evergarden',                 rarity: 'R',  desc: 'The major whose last words gave Violet a purpose and a destination she spent the entire series travelling toward.' },

  // ── Made in Abyss ─────────────────────────────────────────
  { id: 'riko_mia_made',    name: 'Riko',                    series: 'Made in Abyss',                     rarity: 'R',  desc: 'A child of the Abyss who descended into the depths searching for her mother — her courage exceeded every layer she survived.' },
  { id: 'reg_mia_made',     name: 'Reg',                     series: 'Made in Abyss',                     rarity: 'E',  desc: 'A robot boy with no memories and an Incinerator that vaporises whatever it points at — descending for Riko, always.' },
  { id: 'nanachi_mia_made', name: 'Nanachi',                 series: 'Made in Abyss',                     rarity: 'E',  desc: 'A hollowed human who survived the sixth layer — their knowledge of the Abyss and their love for Mitty shaped every choice.' },
  { id: 'bondrewd_mia',     name: 'Bondrewd',                series: 'Made in Abyss',                     rarity: 'L',  desc: 'The Lord of Dawn — a White Whistle who conducted experiments beyond human ethics and smiled through all of it.' },

  // ── Neon Genesis Evangelion (additional) ──────────────────
  { id: 'kaworu_nge',       name: 'Kaworu Nagisa',           series: 'Neon Genesis Evangelion',           rarity: 'E',  desc: 'The Fifth Child — the only person who ever said "I love you" to Shinji and meant it. His death rewrote the ending.' },
  { id: 'misato_nge',       name: 'Misato Katsuragi',        series: 'Neon Genesis Evangelion',           rarity: 'R',  desc: 'The tactician who mothered three pilots and carried her father\'s sacrifice in the cross around her neck.' },
  { id: 'ritsuko_nge',      name: 'Ritsuko Akagi',           series: 'Neon Genesis Evangelion',           rarity: 'R',  desc: 'NERV\'s chief scientist who understood the Eva most completely — including what it would cost her, and paid anyway.' },

  // ── Pokémon (additional) ─────────────────────────────────
  { id: 'charizard_pk',     name: 'Charizard',               series: 'Pokémon',                           rarity: 'E',  desc: 'The Flame Pokémon — fiercely proud and ferociously powerful, its wings carried a rivalry with its trainer beyond all logic.' },
  { id: 'gengar_pk',        name: 'Gengar',                  series: 'Pokémon',                           rarity: 'R',  desc: 'The Shadow Pokémon — lurking in dark corners, feeding on fear, and grinning throughout. Beloved by everyone anyway.' },
  { id: 'eevee_pk',         name: 'Eevee',                   series: 'Pokémon',                           rarity: 'R',  desc: 'The Evolution Pokémon — eight potential forms, each representing a different elemental destiny.' },
  { id: 'snorlax_pk',       name: 'Snorlax',                 series: 'Pokémon',                           rarity: 'R',  desc: 'The Sleeping Pokémon — immovable, enormous, blocking roads since 1996, and somehow the most relatable character.' },
  { id: 'greninja_pk',      name: 'Greninja',                series: 'Pokémon',                           rarity: 'E',  desc: 'The Ninja Pokémon — its water shurikens cut steel and its Bond Phenomenon with Ash nearly broke the anime\'s power ceiling.' },

  // ── Baki (additional) ─────────────────────────────────────
  { id: 'speck_baki',       name: 'Speck',                   series: 'Baki',                              rarity: 'E',  desc: 'An escaped death row convict — his Speck Special grapple technique trapped opponents in a hold almost nobody escaped.' },
  { id: 'yanagi_baki',      name: 'Yanagi',                  series: 'Baki',                              rarity: 'E',  desc: 'An escaped convict with Poison Hand techniques — his toxic touch dissolved tissue and dissolved confidence equally.' },
  { id: 'kaku_kaioh_baki',  name: 'Kaku Kaioh',              series: 'Baki',                              rarity: 'L',  desc: 'A 146-year-old Chinese Kempo grandmaster whose technique refined two millennia of martial wisdom into absolute efficiency.' },
  { id: 'mount_toba_baki',  name: 'Mount Toba',              series: 'Baki',                              rarity: 'R',  desc: 'One of Japan\'s top martial artists — a sumo practitioner who showed that traditional styles still had answers to the underground.' },
  { id: 'hector_baki',      name: 'Hector Doyle',            series: 'Baki',                              rarity: 'R',  desc: 'An escaped convict with a blade-studded body — his technique weaponised every inch of himself into something inescapable.' },

  // ── Blue Lock (additional) ────────────────────────────────
  { id: 'yukimiya_bl',      name: 'Kenyu Yukimiya',          series: 'Blue Lock',                         rarity: 'E',  desc: 'A dribble genius whose Shrine technique makes the ball an extension of his nervous system at full speed.' },
  { id: 'tokimitsu_bl',     name: 'Aiku Tokimitsu',          series: 'Blue Lock',                         rarity: 'R',  desc: 'A physically imposing player whose size and anxiety are in constant conflict — his late-blooming is the story\'s best arc.' },
  { id: 'sendou_bl',        name: 'Jyubei Aryu',             series: 'Blue Lock',                         rarity: 'R',  desc: 'A stylish player whose sense of beauty on the pitch translates into technique that consistently surprises opponents.' },
  { id: 'aryu_bl',          name: 'Aryu',                    series: 'Blue Lock',                         rarity: 'E',  desc: 'A model who plays football — his physical gifts and aesthetic approach to the game make him a wild card in any match.' },
  { id: 'loki_bl',          name: 'Loki',                    series: 'Blue Lock',                         rarity: 'L',  desc: 'A European prodigy whose ability and ego match perfectly — every touch is a statement that he\'s better than whoever is watching.' },

  // ── Lookism (additional) ──────────────────────────────────
  { id: 'soo_il_jeong_lk',  name: 'Soo-Il Jeong',            series: 'Lookism',                           rarity: 'E',  desc: 'A powerful fighter in Lookism\'s underground world — his size and skill make him one of the more formidable presences.' },
  { id: 'james_lee_lk',     name: 'James Lee',               series: 'Lookism',                           rarity: 'E',  desc: 'A seasoned combatant in the underground circuit — his experience in real fighting separates him from school-level brawlers.' },
  { id: 'jiho_park_lk',     name: 'Jiho Park',               series: 'Lookism',                           rarity: 'R',  desc: 'A student in Daniel\'s world whose appearance and character reflect the story\'s central theme in a personal way.' },
  { id: 'jae_hyun_lk',      name: 'Jae-Hyun',                series: 'Lookism',                           rarity: 'R',  desc: 'One of the recurring figures in Lookism\'s high school hierarchy — his position and motivations shift as alliances do.' },
  { id: 'park_hyeong_lk',   name: 'Park Hyeong-Seok',        series: 'Lookism',                           rarity: 'R',  desc: 'Daniel\'s original body — the overweight, bullied life that Daniel escaped, and which took on its own unexpected journey.' },

  // ── Clannad ───────────────────────────────────────────────
  { id: 'tomoya_cl',        name: 'Tomoya Okazaki',          series: 'Clannad',                           rarity: 'R',  desc: 'A delinquent who found reasons to care again — his journey through grief and love is the anime medium at its most human.' },
  { id: 'nagisa_cl',        name: 'Nagisa Furukawa',         series: 'Clannad',                           rarity: 'R',  desc: 'A soft-spoken girl with a fragile body and an unbreakable determination to bring the drama club back to life.' },

  // ── Haikyuu!! (additional) ────────────────────────────────
  { id: 'hinata_hq',        name: 'Shoyo Hinata',            series: 'Haikyuu!!',                         rarity: 'E',  desc: 'The tiny no. 10 whose explosive jumping ability and read-blocks rewrote what a short player could do on the court.' },
  { id: 'kageyama_hq',      name: 'Tobio Kageyama',          series: 'Haikyuu!!',                         rarity: 'E',  desc: 'The King of the Court — his prodigious setting accuracy and relentless growth made every teammate around him better.' },
  { id: 'tsukishima_hq',    name: 'Kei Tsukishima',          series: 'Haikyuu!!',                         rarity: 'R',  desc: 'A middle blocker with exceptional read-blocking — his moment of genuine effort against Ushijima was the series\' peak.' },
  { id: 'yamaguchi_hq',     name: 'Tadashi Yamaguchi',       series: 'Haikyuu!!',                         rarity: 'R',  desc: 'A pinch server who mastered the float serve — his growth from reserve to key player is quietly one of the best in sports anime.' },
  { id: 'nishinoya_hq',     name: 'Yu Nishinoya',            series: 'Haikyuu!!',                         rarity: 'R',  desc: 'Karasuno\'s guardian deity — his Libero diving receives kept alive balls that nobody else could reach.' },
  { id: 'oikawa_hq',        name: 'Tooru Oikawa',            series: 'Haikyuu!!',                         rarity: 'E',  desc: 'The Great King — Aoba Johsai\'s setter whose serves and leadership made him the most dangerous player Hinata ever faced without being a monster.' },
  { id: 'bokuto_hq',        name: 'Kotaro Bokuto',           series: 'Haikyuu!!',                         rarity: 'E',  desc: 'An ace who lives in the moment — at his peak, nobody could stop him. The emo mode was the price of the high.' },
  { id: 'akaashi_hq',       name: 'Keiji Akaashi',           series: 'Haikyuu!!',                         rarity: 'R',  desc: 'Fukurodani\'s setter and Bokuto\'s handler — his calm precision set up greatness and managed entropy in equal measure.' },
  { id: 'kenma_hq',         name: 'Kenma Kozume',            series: 'Haikyuu!!',                         rarity: 'E',  desc: 'Nekoma\'s brain — a video-game lover who treated volleyball as a puzzle to solve, and solved it completely.' },
  { id: 'lev_hq',           name: 'Lev Haiba',               series: 'Haikyuu!!',                         rarity: 'R',  desc: 'Nekoma\'s half-Russian middle blocker — his raw height and potential made him a threat still being unlocked.' },

  // ── One Punch Man (additional) ────────────────────────────
  { id: 'genos_jr',         name: 'Genos (Full Power)',       series: 'One Punch Man',                     rarity: 'E',  desc: 'The cyborg hero upgraded past all previous limits — his core temperatures and speed put him in a different class.' },
  { id: 'king_opm',         name: 'King',                    series: 'One Punch Man',                     rarity: 'E',  desc: 'The World\'s Strongest Man — in reality a person who happens to be nearby when every monster is already dead.' },
  { id: 'fubuki_opm',       name: 'Fubuki',                  series: 'One Punch Man',                     rarity: 'R',  desc: 'The Blizzard of Hell — Class B\'s No. 1 hero, her psychokinesis and group leadership make her a genuine force.' },
  { id: 'flashy_opm',       name: 'Flashy Flash',            series: 'One Punch Man',                     rarity: 'E',  desc: 'The fastest S-Class hero before Saitama — his sword technique moved so fast observers couldn\'t track the strokes.' },
  { id: 'atomic_opm',       name: 'Atomic Samurai',          series: 'One Punch Man',                     rarity: 'E',  desc: 'The blade master S-Class hero — his cross-shaped slash sliced a Dragon-level threat into pieces in seconds.' },
  { id: 'silver_fang_opm',  name: 'Silver Fang',             series: 'One Punch Man',                     rarity: 'L',  desc: 'Blast-less and oldest S-Class — his Water Stream Rock Smashing Fist and Whirlwind Iron Cutting Fist defined the discipline.' },
  { id: 'garou_opm',        name: 'Garou',                   series: 'One Punch Man',                     rarity: 'MY', desc: 'The Human Monster — his Fist That Overcomes God challenged Saitama at a level nothing else ever reached.' },

  // ── Hunter x Hunter (additional) ─────────────────────────
  { id: 'ging_hxh',         name: 'Ging Freecss',            series: 'Hunter x Hunter',                   rarity: 'MY', desc: 'Gon\'s father — a top-five Nen user in the world who designed a game that hid his entire life within it.' },
  { id: 'bisky_hxh',        name: 'Biscuit Krueger',         series: 'Hunter x Hunter',                   rarity: 'L',  desc: 'A Double-Star Hunter who trained Gon and Killua — her true form is monstrous, and she wears a child\'s disguise for fashion.' },
  { id: 'palm_hxh',         name: 'Palm Siberia',            series: 'Hunter x Hunter',                   rarity: 'R',  desc: 'A hunter whose obsession with Gon gave way to terrifying power after her transformation by the Chimera Ants.' },
  { id: 'knov_hxh',         name: 'Knov',                    series: 'Hunter x Hunter',                   rarity: 'R',  desc: 'A hunter whose Nen created pocket dimensions — one look at Neferpitou shattered his will completely and permanently.' },
  { id: 'morel_hxh',        name: 'Morel Mackernasey',       series: 'Hunter x Hunter',                   rarity: 'E',  desc: 'A hunter who controlled smoke at every scale — his Deep Purple could fill a city and his puppets fought inside it.' },

  // ── Vinland Saga (additional) ─────────────────────────────
  { id: 'leif_vs',          name: 'Leif Erikson',            series: 'Vinland Saga',                      rarity: 'R',  desc: 'The explorer who first told Thorfinn of Vinland — the dream that outlasted every war the boy fought.' },
  { id: 'sigurd_vs',        name: 'Sigurd',                  series: 'Vinland Saga',                      rarity: 'R',  desc: 'A warrior whose pride and bitterness drove him — his arc of jealousy and change mirrors the story\'s central themes.' },
  { id: 'floki_vs',         name: 'Floki',                   series: 'Vinland Saga',                      rarity: 'E',  desc: 'The man who set everything in motion by betraying Thors — his cold pragmatism haunted the entire Askeladd arc.' },
  { id: 'einar_vs',         name: 'Einar',                   series: 'Vinland Saga',                      rarity: 'R',  desc: 'A slave who farmed alongside Thorfinn — his friendship and his grief over his family became the heart of the Farmland arc.' },

  // ── Fullmetal Alchemist: Brotherhood (additional) ─────────
  { id: 'mei_chan_fma',      name: 'Mei Chan',                series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'An Xingese princess who practices alkahestry — her long-range transmutation and her tiny panda made her indispensable.' },
  { id: 'ling_yao_fma',     name: 'Ling Yao',                series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'The Xingese prince who hosted Greed — his royal swordsmanship and his drive for immortality shaped the story\'s third act.' },
  { id: 'lan_fan_fma',      name: 'Lan Fan',                 series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'R',  desc: 'Ling\'s loyal bodyguard — she cut off her own arm to let him escape, then returned with automail to fight on.' },
  { id: 'olivier_fma',      name: 'Olivier Armstrong',       series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'E',  desc: 'The Ice Queen of Briggs — her will to protect the north and her absolute command made her a general even gods feared.' },
  { id: 'pride_fma',        name: 'Pride',                   series: 'Fullmetal Alchemist: Brotherhood',  rarity: 'L',  desc: 'Father\'s first and most powerful Homunculus — his shadows could cut, consume, and animate enemies against each other.' },

  // ── The Seven Deadly Sins (additional) ────────────────────
  { id: 'meliodas_assault', name: 'Meliodas (Assault Mode)', series: 'The Seven Deadly Sins',             rarity: 'L',  desc: 'The captain\'s dark power fully unsealed — his assault mode made the Demon King himself take notice.' },
  { id: 'gilthunder_sins',  name: 'Gilthunder',              series: 'The Seven Deadly Sins',             rarity: 'R',  desc: 'A Holy Knight whose lightning-imbued blade put him in a completely different tier from ordinary knights.' },
  { id: 'hendrickson_sins', name: 'Hendrickson',             series: 'The Seven Deadly Sins',             rarity: 'E',  desc: 'A former Great Holy Knight whose descent into grey demon powers consumed him — and turned him into a genuine threat.' },
  { id: 'ludociel_sins',    name: 'Ludociel',                series: 'The Seven Deadly Sins',             rarity: 'L',  desc: 'An Archangel possessing a human body — his Flash technique erased most beings before they saw him move.' },
  { id: 'mael_sins',        name: 'Mael',                    series: 'The Seven Deadly Sins',             rarity: 'MY', desc: 'The original owner of the Grace of Sunshine — his true power surpassed Escanor\'s, and his grief threatened the world.' },

  // ── Chainsaw Man (additional) ─────────────────────────────
  { id: 'kobeni_csm',       name: 'Kobeni Higashiyama',      series: 'Chainsaw Man',                      rarity: 'R',  desc: 'The unluckiest devil hunter who somehow survived everything — her screaming agility was something inhuman.' },
  { id: 'angel_devil_csm',  name: 'Angel Devil',             series: 'Chainsaw Man',                      rarity: 'E',  desc: 'A devil who drains life span through touch and forges it into weapons — beautiful and lethal in equal measure.' },
  { id: 'santa_claus_csm',  name: 'Santa Claus',             series: 'Chainsaw Man',                      rarity: 'L',  desc: 'A devil contractor who spread doll curses across an entire city — their true identity made the horror of it even worse.' },
  { id: 'fami_csm',         name: 'Famine Devil (Fami)',     series: 'Chainsaw Man',                      rarity: 'MY', desc: 'The Famine Devil posing as a student — one of the four horsemen, with long-term plans nobody fully understood.' },

  // ── Code Geass (additional) ───────────────────────────────
  { id: 'schneizel_cg',     name: 'Schneizel el Britannia',  series: 'Code Geass',                        rarity: 'L',  desc: 'The second prince — a chess master who never lost and whose FLEIJA warhead strategy almost erased Tokyo.' },
  { id: 'kallen_cg',        name: 'Kallen Stadtfeld',        series: 'Code Geass',                        rarity: 'E',  desc: 'The Black Knights\' ace pilot — her Guren\'s radiation arm could melt anything it grabbed at full output.' },
  { id: 'orange_cg',        name: 'Jeremiah Gottwald',       series: 'Code Geass',                        rarity: 'E',  desc: 'Orange — his Geass Canceller made him Lelouch\'s most loyal retainer, and his loyalty outlasted betrayal itself.' },

  // ── Gurren Lagann (additional) ────────────────────────────
  { id: 'viral_gl',         name: 'Viral',                   series: 'Gurren Lagann',                     rarity: 'E',  desc: 'A beastman who became Simon\'s unlikely partner — his need for belonging exceeded his hatred for humans by the end.' },
  { id: 'nia_gl',           name: 'Nia Teppelin',            series: 'Gurren Lagann',                     rarity: 'R',  desc: 'Lordgenome\'s daughter whose pure kindness shone in a world of war — her existence bridged the Spiral and Anti-Spiral.' },
  { id: 'lordgenome_true',  name: 'Lordgenome (Helix King)',  series: 'Gurren Lagann',                     rarity: 'MY', desc: 'The Spiral King at his peak — he once fought to reach the stars before the Anti-Spirals showed him why he should stop.' },

  // ── Gintama (additional) ──────────────────────────────────
  { id: 'katsura_gin',      name: 'Katsura Kotaro',          series: 'Gintama',                           rarity: 'E',  desc: 'It\'s not Katsura — it\'s Zura. A former Joui warrior whose heart for liberation never died despite every comedy beat.' },
  { id: 'okita_gin',        name: 'Sogo Okita',              series: 'Gintama',                           rarity: 'E',  desc: 'The sadistic captain of the Shinsengumi first division — his sword skill was real and his love of terrorising Hijikata was also real.' },
  { id: 'hijikata_gin',     name: 'Toshiro Hijikata',        series: 'Gintama',                           rarity: 'E',  desc: 'The Demonic Vice Commander — his Rasetsu mode and his mayo obsession are the two sides of a genuinely complex character.' },
  { id: 'batou_gin',        name: 'Gintoki (Shinsengumi)',   series: 'Gintama',                           rarity: 'L',  desc: 'Gintoki at his most serious — the White Demon who fought in the Joui War and never fully stopped fighting it internally.' },

  // ── Spy x Family (additional) ─────────────────────────────
  { id: 'yuri_sxf',         name: 'Yuri Briar',              series: 'Spy x Family',                      rarity: 'R',  desc: 'Yor\'s brother and secret police officer — his intensity about protecting his sister is matched only by his obliviousness.' },
  { id: 'franky_sxf',       name: 'Franky Franklin',         series: 'Spy x Family',                      rarity: 'R',  desc: 'Loid\'s SSS contact and handler — his disguises are impeccable except when Anya is watching.' },
  { id: 'becky_sxf',        name: 'Becky Blackbell',         series: 'Spy x Family',                      rarity: 'R',  desc: 'Anya\'s rich best friend at Eden Academy — her precocious confidence and unlikely friendship define the school arc.' },
  { id: 'boss_sxf',         name: 'Donovan Desmond',         series: 'Spy x Family',                      rarity: 'L',  desc: 'The target of the entire Strix operation — a political powerbroker whose mind Loid must infiltrate through his son.' },

  // ── Inuyasha (additional) ─────────────────────────────────
  { id: 'sesshomaru',       name: 'Sesshomaru',              series: 'Inuyasha',                          rarity: 'L',  desc: 'Inuyasha\'s full-demon older brother — his Bakusaiga could destroy anything, and his cold pride slowly became something more.' },
  { id: 'naraku_iy',        name: 'Naraku',                  series: 'Inuyasha',                          rarity: 'MY', desc: 'The half-demon who spread misery across the feudal era — his manipulation of the Shikon Jewel nearly corrupted it entirely.' },
  { id: 'kikyo_iy',         name: 'Kikyo',                   series: 'Inuyasha',                          rarity: 'E',  desc: 'The priestess who first sealed Inuyasha — resurrected from clay and her own regret, her power of purification never waned.' },
  { id: 'kagome_iy',        name: 'Kagome Higurashi',        series: 'Inuyasha',                          rarity: 'E',  desc: 'A modern girl who fell through time to become the reincarnation of Kikyo — her sacred arrow hit what no other could.' },
  { id: 'miroku_iy',        name: 'Miroku',                  series: 'Inuyasha',                          rarity: 'R',  desc: 'A lecherous monk with a Wind Tunnel in his palm — a curse that was also a weapon of last resort.' },
  { id: 'sango_iy',         name: 'Sango',                   series: 'Inuyasha',                          rarity: 'R',  desc: 'A demon slayer who lost her village and brother — her Hiraikotsu boomerang and her grief carried every fight forward.' },

  // ── Yu Yu Hakusho (additional) ────────────────────────────
  { id: 'genkai_yyh',       name: 'Genkai',                  series: 'Yu Yu Hakusho',                     rarity: 'L',  desc: 'Yusuke\'s master — her Spirit Wave technique was the most powerful energy technique any human could ever master.' },
  { id: 'toguro_elder_yyh', name: 'Older Toguro',            series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'The brains of the Toguro team — his ability to reshape his body and sacrifice his humanity for power made him a nightmare.' },
  { id: 'sensui_yyh',       name: 'Shinobu Sensui',          series: 'Yu Yu Hakusho',                     rarity: 'MY', desc: 'The former Spirit Detective — seven personalities, Sacred Energy, and a heart broken by humanity\'s worst side.' },
  { id: 'itsuki_yyh',       name: 'Itsuki',                  series: 'Yu Yu Hakusho',                     rarity: 'E',  desc: 'Sensui\'s partner — his Ura-Otoko swallowed opponents into another dimension of permanent suffering.' },

  // ── Steins;Gate (additional) ──────────────────────────────
  { id: 'kurisu_sg',        name: 'Kurisu Makise',           series: 'Steins;Gate',                       rarity: 'E',  desc: 'A neuroscience prodigy who became the partner Okabe never expected — her intelligence and her fate drive everything.' },
  { id: 'mayuri_sg',        name: 'Mayuri Shiina',           series: 'Steins;Gate',                       rarity: 'R',  desc: 'Okabe\'s childhood friend whose death he reset the timeline to prevent — her presence is the anchor of his sanity.' },
  { id: 'suzuha_sg',        name: 'Suzuha Amane',            series: 'Steins;Gate',                       rarity: 'E',  desc: 'A time traveller from the future — the weight she carried across timelines to reach 1% divergence was incalculable.' },

  // ── Death Note (additional) ───────────────────────────────
  { id: 'mello_dn',         name: 'Mello',                   series: 'Death Note',                        rarity: 'R',  desc: 'L\'s third successor — willing to work with the mob to beat Near to the truth about Kira at any cost to himself.' },
  { id: 'matt_dn',          name: 'Matt',                    series: 'Death Note',                        rarity: 'R',  desc: 'Mello\'s loyal partner — his distraction operation succeeded even as it cost him everything.' },
  { id: 'ryuk_dn',          name: 'Ryuk',                    series: 'Death Note',                        rarity: 'E',  desc: 'The Shinigami who dropped the Death Note out of boredom — watching humans destroy each other was his entertainment.' },
  { id: 'rem_dn',           name: 'Rem',                     series: 'Death Note',                        rarity: 'E',  desc: 'A Shinigami who loved Misa enough to die — her sacrifice killed L and was the only act of genuine devotion in the series.' },

  // ── Cowboy Bebop (additional) ─────────────────────────────
  { id: 'jet_black',        name: 'Jet Black',               series: 'Cowboy Bebop',                      rarity: 'R',  desc: 'The Black Dog — a former ISSP detective with a mechanical arm who kept the Bebop flying and his crew fed.' },
  { id: 'faye_valentine',   name: 'Faye Valentine',          series: 'Cowboy Bebop',                      rarity: 'R',  desc: 'A bounty hunter who woke from 54 years of cryosleep with a gambling debt and no memory — she built herself again anyway.' },
  { id: 'ed_cowboy',        name: 'Edward Wong Hau Pepelu Tivrusky IV', series: 'Cowboy Bebop',           rarity: 'R',  desc: 'A child hacker of impossible skill — her cheerful chaos cracked every system and her departure wrecked the crew completely.' },
  { id: 'vicious_cowboy',   name: 'Vicious',                 series: 'Cowboy Bebop',                      rarity: 'E',  desc: 'Spike\'s former partner turned enemy — his katana and his cold ambition made him the closest thing the Syndicate had to a god.' },

  // ── Demon Slayer weapon cards (additional) ────────────────
  { id: 'hotaru_ds',        name: 'Hotaru Haganezuka',       series: 'Demon Slayer',                      rarity: 'R',  desc: 'The masked swordsmith who forged Tanjiro\'s blades — his obsessive dedication to perfect steel drove him to legendary craft.' },

  // ── Misc Anime ────────────────────────────────────────────
  { id: 'accelerator_ri',   name: 'Accelerator',             series: 'A Certain Magical Index',           rarity: 'MY', desc: 'The strongest Level 5 esper — Vector Control lets him redirect any physical force, including concepts as abstract as gravity.' },
  { id: 'mikoto_ri',        name: 'Mikoto Misaka',           series: 'A Certain Scientific Railgun',      rarity: 'E',  desc: 'The Railgun — her electricity fires metal at three times the speed of sound and arcs across entire city sectors.' },
  { id: 'toma_ri',          name: 'Touma Kamijou',           series: 'A Certain Magical Index',           rarity: 'R',  desc: 'A student with the worst luck and a right hand called Imagine Breaker — it negates every supernatural power with one touch.' },
  { id: 'kirito_ggo',       name: 'Kirito (GGO)',            series: 'Sword Art Online',                  rarity: 'E',  desc: 'Kirito in Gun Gale Online — his lightsword deflected bullets with precision that left every gunner in the game speechless.' },
  { id: 'reinhard_re',      name: 'Reinhard von Lohengramm', series: 'Legend of the Galactic Heroes',     rarity: 'MY', desc: 'The golden-haired Kaiser — a military genius who conquered a galaxy before thirty, driven by a promise to a lost friend.' },
  { id: 'yang_wenli',       name: 'Yang Wen-li',             series: 'Legend of the Galactic Heroes',     rarity: 'L',  desc: 'The Magician — he never wanted to be a hero, and became the greatest defensive strategist in galactic history anyway.' },

  // ── Additional Manhwa ─────────────────────────────────────
  { id: 'cheon_jiho_ms',    name: 'Cheon Ji-Ho',             series: 'Martial Artist Lee Gwak',           rarity: 'E',  desc: 'A martial artist forged through suffering — his internal energy cultivation breaks every limit placed before him.' },
  { id: 'sunwoo_ks',        name: 'Sunwoo',                  series: 'The Boxer',                         rarity: 'MY', desc: 'A genius boxer of blank-faced calm — his punch speed and precision operate at a level coaches can barely measure.' },
  { id: 'baek_seoin_ks',    name: 'Baek Seoin',              series: 'The Boxer',                         rarity: 'E',  desc: 'A former champion who coaches Sunwoo — his insight into boxing is matched only by his bafflement at what he found.' },
  { id: 'jayden_ks',        name: 'Jayden',                  series: 'The Boxer',                         rarity: 'L',  desc: 'The world champion who finally met someone beyond his reach — his power and his pride defined an entire era.' },
  { id: 'yu_jin_rm',        name: 'Yu Jin',                  series: 'Return of the Mount Hua Sect',      rarity: 'MY', desc: 'The Mount Hua Sect disciple reborn with 100 years of experience — his sword blooms like plum blossoms, every strike perfect.' },
  { id: 'baek_cheon_rm',    name: 'Baek Cheon',              series: 'Return of the Mount Hua Sect',      rarity: 'E',  desc: 'The First Disciple of Mount Hua — his pride and his growth run parallel as Yu Jin\'s example remakes him entirely.' },
  { id: 'hyun_young_rm',    name: 'Hyun Young',              series: 'Return of the Mount Hua Sect',      rarity: 'R',  desc: 'An elder of the Mount Hua Sect whose management and care keep the sect alive through its most desperate years.' },
  { id: 'tang_soso_rm',     name: 'Tang Soso',               series: 'Return of the Mount Hua Sect',      rarity: 'R',  desc: 'A Tang family cultivator who joins the story with style — her poison skills and spirit keep the cast lively.' },
  { id: 'taichi_murakami',  name: 'Taichi Murakami',         series: 'Blue Box',                          rarity: 'R',  desc: 'A badminton player with honest feelings — his dedication on the court mirrors the careful way he approaches everything.' },
  { id: 'chinatsu_bb',      name: 'Chinatsu Kano',           series: 'Blue Box',                          rarity: 'R',  desc: 'A basketball player in the same house as Taichi — their shared mornings and honest conversations define the series.' },
  { id: 'younggun_thb',     name: 'Lee Younggun',            series: 'The Hero Is Overpowered But Overly Cautious', rarity: 'R', desc: 'A goddess who summoned the most cautious hero imaginable — her optimism was tested by every preparation ritual.' },
  { id: 'seiya_thb',        name: 'Seiya Ryuuguuin',         series: 'The Hero Is Overpowered But Overly Cautious', rarity: 'E', desc: 'A maximally cautious hero who trained until he outlevelled the final boss before leaving the starting area.' },
  { id: 'jinhae_nma',       name: 'Jin Hae',                 series: 'Nine Star Hegemon Body Art',        rarity: 'MY', desc: 'A cultivator reborn with the most powerful body art in existence — his physical might grows at a rate that shocks every realm.' },
  { id: 'hyunsung_max',     name: 'Kim Hyunsung',            series: 'The Max-Level Hero Strikes Back',   rarity: 'MY', desc: 'A hero who merged with every hero\'s soul while comatose — waking to absolute mastery of every weapon and system.' },
  { id: 'david_max',        name: 'David',                   series: 'The Max-Level Hero Strikes Back',   rarity: 'E',  desc: 'One of the legendary heroes whose soul merged with Hyunsung — his combat experience lives on in every strike.' },
  { id: 'taewon_mk',        name: 'Choi Taewon',             series: 'Murim Cultivation',                 rarity: 'E',  desc: 'A cultivator who restarted from the foundation with perfect knowledge of the path ahead — efficiency redefined.' },
  { id: 'jinho_il',         name: 'Jin-ho',                  series: 'I Grow Stronger by Eating',         rarity: 'MY', desc: 'A hunter who grows by devouring abilities from monsters he defeats — the dungeon itself is his training ground.' },
  { id: 'ryong_ahl',        name: 'Ryong',                   series: 'A Returner\'s Magic Should Be Special', rarity: 'R', desc: 'A warrior of the Shadow Labyrinth whose combat style grew from surviving the unsurvivable — and then he met Desir.' },
  { id: 'gunil_fw',         name: 'Gunil',                   series: 'Fist Demon of Mount Hua',           rarity: 'E',  desc: 'A practitioner of the Fist Demon style — his technique breaks bone and barrier in a single disciplined motion.' },
  { id: 'jinsung_fd',       name: 'Jin Sung',                series: 'Fist Demon of Mount Hua',           rarity: 'MY', desc: 'The Fist Demon reborn in a weaker body — and remaking every technique from scratch to be more devastating than before.' },

  // ── Additional Anime ──────────────────────────────────────
  { id: 'zenitsu_pillar',   name: 'Zenitsu (Thunder Pillar)',series: 'Demon Slayer',                      rarity: 'L',  desc: 'Zenitsu having mastered all seven forms — the thunder that he once performed unconscious now moves in full waking glory.' },
  { id: 'inosuke_beast',    name: 'Inosuke (Beast Breathing)',series: 'Demon Slayer',                     rarity: 'E',  desc: 'A wild boar-masked fighter who developed breathing techniques entirely alone — adaptable and destructive in equal measure.' },
  { id: 'kanao_flower',     name: 'Kanao (Flower Breathing)',series: 'Demon Slayer',                      rarity: 'E',  desc: 'A Flower Breathing user whose Scarlet Spider Lily eye technique accelerates perception to inhuman levels.' },
  { id: 'wind_hashira',     name: 'Sanemi Shinazugawa',      series: 'Demon Slayer',                      rarity: 'E',  desc: 'The Wind Hashira — his nine Wind Breathing forms and his rare blood type made him a nightmare for every demon he faced.' },
  { id: 'gojo_infty',       name: 'Gojo (Infinity)',         series: 'Jujutsu Kaisen',                    rarity: 'UR', desc: 'Gojo\'s Infinity fully active — reducing all attacks approaching him to infinitely decelerating futility.' },
  { id: 'sukuna_shrine',    name: 'Sukuna (Shrine)',         series: 'Jujutsu Kaisen',                    rarity: 'UR', desc: 'Sukuna\'s Domain — Malevolent Shrine splits everything within its range with Cleave and Dismantle without a barrier.' },
  { id: 'law_op',           name: 'Trafalgar Law',           series: 'One Piece',                         rarity: 'L',  desc: 'The Surgeon of Death — his ROOM creates a sphere where he rearranges matter, people, and the geography of combat.' },
  { id: 'kid_op',           name: 'Eustass Kid',             series: 'One Piece',                         rarity: 'L',  desc: 'A Yonko-level Supernova — his Electromagnetic Rail and Punk Claw drew metal to a scale that re-shaped battleships.' },
  { id: 'zoro_enma',        name: 'Zoro (Enma)',             series: 'One Piece',                         rarity: 'UR', desc: 'Zoro wielding Enma alongside his two other blades — Three Sword Style at Emperor Strength, cutting through everything.' },
  { id: 'nami_op',          name: 'Nami',                    series: 'One Piece',                         rarity: 'R',  desc: 'The Cat Burglar — her Clima-Tact creates weather and her navigational genius guides the crew through every sea.' },
  { id: 'usopp_op',         name: 'Usopp',                   series: 'One Piece',                         rarity: 'R',  desc: 'A sniper who lied his way to real courage — his Pop Green marksmanship and creativity won fights nobody else could.' },
  { id: 'ryota_bl',         name: 'Ryota Kise',              series: 'Kuroko\'s Basketball',              rarity: 'E',  desc: 'The perfect copy — his ability to mimic the Zone of any player he\'s observed is categorically unfair.' },
  { id: 'akashi_kb',        name: 'Seijuro Akashi',          series: 'Kuroko\'s Basketball',              rarity: 'MY', desc: 'The Emperor — his Emperor Eye reads every player\'s next move perfectly, and his absolute skill wins the game before it starts.' },
  { id: 'aomine_kb',        name: 'Daiki Aomine',            series: 'Kuroko\'s Basketball',              rarity: 'L',  desc: 'The only one who can beat me is me — his formless shots and Zone made him the benchmark every player aspired to touch.' },
  { id: 'kuroko_kb',        name: 'Tetsuya Kuroko',          series: 'Kuroko\'s Basketball',              rarity: 'E',  desc: 'The Phantom Sixth Man — his Misdirection and Ignite Pass invisible-ify him until the ball is already through the net.' },
  { id: 'midorima_kb',      name: 'Shintaro Midorima',       series: 'Kuroko\'s Basketball',              rarity: 'E',  desc: 'A shooter of perfect form — his three-pointers from anywhere on the court defy physics and goalkeeper instinct alike.' },
  { id: 'murasakibara_kb',  name: 'Atsushi Murasakibara',    series: 'Kuroko\'s Basketball',              rarity: 'E',  desc: 'A giant who treats basketball as boring — until his body enters the Zone and he covers every inch of the paint.' },
  { id: 'kagami_kb',        name: 'Taiga Kagami',            series: 'Kuroko\'s Basketball',              rarity: 'E',  desc: 'The Tiger who trained in America and returns to Japan — his Zone and his rivalry with Aomine drove both players higher.' },
  { id: 'hyuga_kb',         name: 'Junpei Hyuga',            series: 'Kuroko\'s Basketball',              rarity: 'R',  desc: 'Seirin\'s captain and clutch-time shooter — his Barrier Jumper made his threes basically uncatchable under pressure.' },
  { id: 'riko_kb',          name: 'Riko Aida',               series: 'Kuroko\'s Basketball',              rarity: 'R',  desc: 'Seirin\'s coach — her eye can read any player\'s physical stats at a glance, and she uses that data mercilessly.' },
  { id: 'ippo_mk',          name: 'Makunouchi Ippo',         series: 'Hajime no Ippo',                    rarity: 'E',  desc: 'A featherweight champion who fights with his entire body weight in every Dempsey Roll — gentle outside, devastating inside.' },
  { id: 'takamura_mk',      name: 'Mamoru Takamura',         series: 'Hajime no Ippo',                    rarity: 'L',  desc: 'A world champion across multiple weight classes — his Bear Uppercut and absolute dominance over every opponent he\'s faced.' },
  { id: 'miyata_mk',        name: 'Ichiro Miyata',           series: 'Hajime no Ippo',                    rarity: 'E',  desc: 'Ippo\'s oldest rival — a counter-puncher whose speed and precision redefined what a boxed counter technique could do.' },
  { id: 'itagaki_mk',       name: 'Itagaki Manabu',          series: 'Hajime no Ippo',                    rarity: 'R',  desc: 'A boxer whose speed rivalled Ippo\'s power — his dancing footwork made him one of the most enjoyable fighters to watch.' },
  { id: 'oliver_phoenix',   name: 'Oliver Queen',            series: 'Record of Ragnarok',                rarity: 'E',  desc: 'Not listed — a placeholder for a Record of Ragnarok combatant whose legend predates the tournament itself.' },
  { id: 'brunhilde_ror',    name: 'Brunhilde',               series: 'Record of Ragnarok',                rarity: 'L',  desc: 'The Valkyrie who proposed Ragnarok to give humanity a chance — her plan, her pride, and her love for humans drive every match.' },
  { id: 'thor_ror',         name: 'Thor',                    series: 'Record of Ragnarok',                rarity: 'MY', desc: 'The God of Thunder in Ragnarok — his Mjolnir struck with the force of divine apocalypse, and Lu Bu took it.' },
  { id: 'lu_bu_ror',        name: 'Lu Bu',                   series: 'Record of Ragnarok',                rarity: 'MY', desc: 'History\'s greatest warrior — his Sky Eater technique fought a god to a standstill and earned humanity its first legend.' },
  { id: 'adam_ror',         name: 'Adam',                    series: 'Record of Ragnarok',                rarity: 'UR', desc: 'The Father of Humanity — his Eyes of the Gods mirror every divine technique and his fighting style is the origin of all martial arts.' },
  { id: 'zerofuku_ror',     name: 'Zerofuku',                series: 'Record of Ragnarok',                rarity: 'L',  desc: 'A god of misfortune whose accumulated grief turned into a weapon — then a revelation about what luck even means.' },
  { id: 'leonidas_ror',     name: 'Leonidas',                series: 'Record of Ragnarok',                rarity: 'E',  desc: 'The Spartan king who faced Adamas — his Magna Carta and unbreakable shield made him the wall between worlds.' },
  { id: 'okita_ror',        name: 'Okita Souji',             series: 'Record of Ragnarok',                rarity: 'E',  desc: 'The most beautiful swordsmanship in history — his Tennen Rishin-ryu was refinement beyond any trained practitioner.' },
  { id: 'rudra_ror',        name: 'Shiva',                   series: 'Record of Ragnarok',                rarity: 'MY', desc: 'The God of Destruction in Ragnarok — four arms and four fighting styles combined into the Rudra Storm that shook the arena.' },
  { id: 'tesla_ror',        name: 'Nikola Tesla',            series: 'Record of Ragnarok',                rarity: 'E',  desc: 'The greatest inventor facing the Jade Emperor — his electric inventions became weapons on the arena\'s grandest stage.' },
  { id: 'jack_ror',         name: 'Jack the Ripper',         series: 'Record of Ragnarok',                rarity: 'L',  desc: 'The world\'s most infamous serial killer — his gloves of divine weapon creation let him turn anything into a killing instrument.' },
  { id: 'heracles_ror',     name: 'Heracles',                series: 'Record of Ragnarok',                rarity: 'L',  desc: 'The strongest god — his Cerberus Requiem and Shield of Athena made him a force that fought with honour above all else.' },
  { id: 'sasaki_ror',       name: 'Sasaki Kojiro',           series: 'Record of Ragnarok',                rarity: 'MY', desc: 'The greatest loser who ever lived — his imagined replica of every style made the strongest version of himself in that ring.' },
  { id: 'poseidon_ror',     name: 'Poseidon',                series: 'Record of Ragnarok',                rarity: 'UR', desc: 'The God of the Seas — so overwhelmingly powerful that every human before Sasaki died in one strike.' },
  { id: 'buddha_ror',       name: 'Buddha',                  series: 'Record of Ragnarok',                rarity: 'MY', desc: 'A god who sided with humanity — his Fist of Conceptual Destruction transcended even the nature of gods.' },
  { id: 'raiden_ror',       name: 'Raiden Tameemon',         series: 'Record of Ragnarok',                rarity: 'L',  desc: 'Japan\'s strongest sumo wrestler who faced Shiva — his raw strength rewrote the upper limit of what a human body can do.' },
  { id: 'qin_shi_ror',      name: 'Qin Shi Huang',           series: 'Record of Ragnarok',                rarity: 'UR', desc: 'The First Emperor — his Human Skin and reflected divine techniques made him a mirror that gods couldn\'t break.' },
  { id: 'beelzebub_ror',    name: 'Beelzebub',               series: 'Record of Ragnarok',                rarity: 'MY', desc: 'The God of Flies — his Perfect Cube reconstructed the anatomy of combat from basic principles, a weapon born of pure science.' },
  { id: 'jin_woo_slm',      name: 'Jinwoo (Shadow Monarch)',  series: 'Solo Leveling',                     rarity: 'UR', desc: 'Sung Jinwoo at the apex of his power — the Shadow Monarch commanding an army that stretches the width of continents.' },
  { id: 'ashborn_sl',       name: 'Ashborn',                 series: 'Solo Leveling',                     rarity: 'LT', desc: 'The Original Shadow Monarch — his power was so complete that he chose a human vessel worthy of carrying it forward.' },
  { id: 'baran_sl',         name: 'Baran',                   series: 'Solo Leveling',                     rarity: 'MY', desc: 'The Demon King of the White Mane — one of the strongest monarchs Jinwoo ever faced, a ceiling that had to be shattered.' },
  { id: 'iron_sl',          name: 'Iron',                    series: 'Solo Leveling',                     rarity: 'E',  desc: 'A powerful shadow soldier drawn from a defeated enemy — his iron body resists punishment that breaks ordinary soldiers.' },
  { id: 'tusk_slr',         name: 'Tusk (Evolved)',          series: 'Solo Leveling',                     rarity: 'L',  desc: 'Tusk at his evolved state — his role as a pillar of the Shadow Monarch\'s army grows more central with every battle.' },
  { id: 'minato_kunai',     name: 'Minato Namikaze (FTG)',   series: 'Naruto',                            rarity: 'UR', desc: 'The Yellow Flash — his Flying Thunder God kunai teleportation was so fast that Raikage fled rather than face him directly.' },
  { id: 'hashirama_ult',    name: 'Hashirama (Wood Dragon)', series: 'Naruto',                            rarity: 'UR', desc: 'The First Hokage with his full Wood Release — the God of Shinobi whose Living Clone sustained the world with one technique.' },
  { id: 'kaguya_ultra',     name: 'Kaguya Otsutsuki',        series: 'Naruto',                            rarity: 'LT', desc: 'The Rabbit Goddess who ate the chakra fruit — her Infinite Tsukuyomi and dimensional control required five Kage to answer.' },
  { id: 'naruto_kurama',    name: 'Naruto (Nine-Tails Mode)',series: 'Naruto',                            rarity: 'UR', desc: 'Naruto with Kurama fully merged — Six Paths Sage Mode combines all nature transformations in one golden-hued form.' },
  { id: 'sasuke_rinnegan',  name: 'Sasuke (Rinnegan)',       series: 'Naruto',                            rarity: 'UR', desc: 'Sasuke with the Six Paths Rinnegan — his Amenotejikara teleportation and Susanoo make him the night the world dreads.' },
  { id: 'luffy_gear5',      name: 'Luffy (Gear 5)',          series: 'One Piece',                         rarity: 'LT', desc: 'Awakened Nika — the Sun God whose rubber reality turns the entire battlefield into a Tom and Jerry cartoon of pure destruction.' },
  { id: 'kaido_ult',        name: 'Kaido (Hybrid)',          series: 'One Piece',                         rarity: 'LT', desc: 'Kaido in Hybrid form — the full dragon power focused in a single body, Ragnaraku splitting sky and sea in one swing.' },
  { id: 'big_mom_op',       name: 'Big Mom',                 series: 'One Piece',                         rarity: 'MY', desc: 'A Yonko of terrifying appetite — her Prometheus, Zeus, and Napoleon homies made her a one-person army with a craving.' },
  { id: 'aokiji_op',        name: 'Aokiji',                  series: 'One Piece',                         rarity: 'L',  desc: 'The Ice Admiral — Kuzan\'s Logia ice spread across continents and his moral conflict with Akainu forged the show\'s darkest fight.' },
  { id: 'kizaru_op',        name: 'Kizaru',                  series: 'One Piece',                         rarity: 'L',  desc: 'The Light Admiral — Borsalino moves and strikes at the speed of photons, and his casualness makes it more terrifying.' },
  { id: 'akainu_op',        name: 'Akainu',                  series: 'One Piece',                         rarity: 'L',  desc: 'The Magma Fist Admiral — his absolute justice and his magma overwhelmed Whitebeard himself in the war\'s bloodiest moment.' },
  { id: 'gohan_beast',      name: 'Gohan (Beast)',           series: 'Dragon Ball Super',                 rarity: 'UR', desc: 'Gohan\'s ultimate power awakened through despair — Beast Form output surpassed every form his father showed him.' },
  { id: 'broly_canon',      name: 'Broly (DBS)',             series: 'Dragon Ball Super',                 rarity: 'LT', desc: 'The canonical Broly — a Saiyan of monstrous potential who matched Gogeta with pure unadulterated instinct.' },
  { id: 'granolah_dbs',     name: 'Granolah',                series: 'Dragon Ball Super',                 rarity: 'MY', desc: 'The strongest warrior in the universe at a single point in time — his wish made him a sniper who hits vital points instantly.' },
  { id: 'gas_dbs',          name: 'Gas',                     series: 'Dragon Ball Super',                 rarity: 'MY', desc: 'The Heeter whose wish for greatest strength transformed him into something the universe had to reckon with.' },
  { id: 'goky_ui_omen',     name: 'Goku (UI Omen)',          series: 'Dragon Ball Super',                 rarity: 'UR', desc: 'Ultra Instinct -Sign- — Goku\'s body reacts without thinking, dodging on reflex at a speed the gods admired.' },

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
  { id: 'muzan_weapon',       name: 'Black Blood Tendrils',         series: 'Demon Slayer',                     rarity: 'MY', weaponCard: true, weaponOf: 'muzan',       desc: "Muzan's body-morphed blood tendrils — razor-sharp extensions that carry a lethal curse, disintegrating anything they touch." },
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
  { id: 'isagi_ego_weapon',   name: 'Meta Vision',                 series: 'Blue Lock',                        rarity: 'UR', weaponCard: true, weaponOf: 'isagi_ego',   desc: "Isagi's awakened ability — spatial awareness so complete that the entire pitch becomes his personal arsenal." },

  // ── Weapon Cards (LT) ─────────────────────────────────────
  { id: 'sage_naruto_weapon', name: 'Six Paths Chibaku Tensei',    series: 'Naruto',                           rarity: 'LT', weaponCard: true, weaponOf: 'sage_naruto', desc: "The Six Paths Sage's ultimate technique — gravity manipulation powerful enough to create new moons." },
  { id: 'ultra_goku_weapon',  name: 'Mastered Ultra Instinct',     series: 'Dragon Ball Super',                rarity: 'LT', weaponCard: true, weaponOf: 'ultra_goku',  desc: "Goku's perfected Ultra Instinct — his body moves and reacts autonomously, completely divorced from conscious thought." },
  { id: 'gear5_luffy_weapon', name: "Nika's Liberation Drums",     series: 'One Piece',                        rarity: 'LT', weaponCard: true, weaponOf: 'gear5_luffy', desc: "The heartbeat of the Sun God — a drum rhythm that grants Luffy power over rubber reality itself." },
  { id: 'sukuna_fp_weapon',   name: 'Malevolent Shrine',           series: 'Jujutsu Kaisen',                   rarity: 'LT', weaponCard: true, weaponOf: 'sukuna_fp',   desc: "Sukuna's domain — a shrine of carnage where Cleave and Dismantle reach everything within its territory." },
  { id: 'daniel_park_ui_lt_weapon', name: 'Ultra Instinct Strike', series: 'Lookism',                         rarity: 'LT', weaponCard: true, weaponOf: 'daniel_park_ui_lt', desc: "Daniel Park's ultimate form — a state of pure autonomous fighting that surpasses all conscious technique." },
  { id: 'ditto_lt_weapon',    name: 'Transform Core',              series: 'Pokémon',                          rarity: 'LT', weaponCard: true, weaponOf: 'ditto_lt',    desc: "Ditto's essence — the mysterious cellular structure that lets it perfectly replicate any being in existence." },
  { id: 'gojo_weapon',        name: 'Infinite Void',               series: 'Jujutsu Kaisen',                   rarity: 'LT', weaponCard: true, weaponOf: 'gojo',        desc: "Gojo's domain expansion — an infinite realm of stimulation that incapacitates all who enter it permanently." },
  { id: 'kaiser_impact_weapon',name: 'World-Class Shot',           series: 'Blue Lock',                        rarity: 'LT', weaponCard: true, weaponOf: 'kaiser_impact',desc: "The Kaiser Impact taken to its absolute limit — a shot that doesn't just score, it redefines football entirely." },

  // ── Special (SP) ──────────────────────────────────────────
  { id: 'bilal_mia', name: 'Bilal Mia', series: 'Special', rarity: 'SP', desc: 'One of a kind.' },

];

/**
 * Base pool filter — excludes Limited, weapon, support, ditto, and special cards.
 * These are never obtainable through regular pulls.
 */
function isNormalPullable(c) {
  return c.rarity !== 'LT' && c.rarity !== 'SP' && !c.weaponCard && !c.supportCard && !c.dittoCard;
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
